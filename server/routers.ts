import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "./db";
import {
  getAllCurrencies, getCurrencyById, createCurrency, updateCurrency, deleteCurrency,
  getAllRates, getRateForPair, createRate, updateRate, deleteRate,
  getAllAddresses, getAddressesForCurrency, createAddress, updateAddress, deleteAddress,
  getAllOrders, getOrderByPublicId, createOrder, updateOrderStatus,
  createUser, getUserByOpenId, updateUser, getAllUsers, deleteUserById
} from "./db";
import { notifyOwner } from "./_core/notification";
import { buildRatesMatrix, getExchangeRate, getRatesFrom, getRatesTo, ratesMatrixCache, getSupportedCurrencies } from "./_core/rates-parser";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),
    logout: protectedProcedure.mutation(() => {
      // Token will be cleared on client side
      return { success: true } as const;
    }),
    login: publicProcedure
      .input(z.object({
        openId: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Login] Login attempt for openId:", input.openId);
        const user = await getUserByOpenId(input.openId);
        console.log("[Login] User found:", user ? `${user.openId}` : "null");
        
        if (!user) {
          console.log("[Login] User not found, throwing error");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid OpenID or password",
          });
        }
        
        if (!user.password) {
          console.log("[Login] No password set for user");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid OpenID or password",
          });
        }
        
        // Verify password using bcrypt
        const passwordMatch = await verifyPassword(input.password, user.password);
        if (!passwordMatch) {
          console.log("[Login] Password mismatch");
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid OpenID or password",
          });
        }
        
        console.log("[Login] Password matched, creating JWT");
        // Create JWT session token
        const tokenPayload = {
          openId: user.openId,
          appId: "easycash-app",
          name: user.name || user.openId,
        };
        console.log("[Auth] Creating JWT with payload:", tokenPayload);
        const sessionToken = await sdk.createSessionToken(tokenPayload);
        console.log("[Auth] JWT created successfully, token length:", sessionToken.length);
        console.log("[Auth] JWT token (first 50 chars):", sessionToken.substring(0, 50));
        
        // Return token for client to store in localStorage
        console.log("[Login] Returning success response with token");
        console.log("[Login] Token value:", sessionToken ? `${sessionToken.substring(0, 50)}...` : "EMPTY");
        console.log("[Login] Response object:", { success: true, userId: user?.id, tokenLength: sessionToken?.length });
        const response = { success: true, user, token: sessionToken };
        console.log("[Login] Final response keys:", Object.keys(response));
        return response;
      }),
    createUser: publicProcedure
      .input(z.object({
        openId: z.string().min(1),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.enum(["user", "admin"]).optional(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const user = await createUser({
          openId: input.openId,
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role || "user",
          loginMethod: "manual",
        });
        return { success: true, user };
      }),
    setPassword: publicProcedure
      .input(z.object({
        openId: z.string().min(1),
        password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
      }))
      .mutation(async ({ input }) => {
        // Hash password before storing
        const hashedPassword = await hashPassword(input.password);
        const user = await updateUser(input.openId, {
          password: hashedPassword,
        });
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        return { success: true, user };
      }),
  }),

  // ============ PUBLIC: Currencies ============
  currencies: router({
    list: publicProcedure.query(async () => {
      return getAllCurrencies(true);
    }),
  }),

  // ============ PUBLIC: Addresses ============
  addresses: router({
    list: publicProcedure.query(async () => {
      return getAllAddresses(true);
    }),
  }),

  // ============ PUBLIC: Rates ============
  rates: router({
    // Get exchange rate between two specific currencies by ID
    getForPair: publicProcedure
      .input(z.object({ fromCurrencyId: z.number(), toCurrencyId: z.number() }))
      .query(async ({ input }) => {
        // Get currencies to find their codes
        const fromCurrency = await getCurrencyById(input.fromCurrencyId);
        const toCurrency = await getCurrencyById(input.toCurrencyId);
        
        if (!fromCurrency || !toCurrency) {
          return null;
        }
        
        // Get markup from DB
        const dbRate = await getRateForPair(input.fromCurrencyId, input.toCurrencyId);
        const markup = dbRate ? parseFloat(dbRate.markupPercent) : 0;
        
        // Get actual rate from Rapira rates matrix
        const ratesMatrix = await ratesMatrixCache.get();
        const rapiraRate = ratesMatrix.rates.find(
          r => r.from === fromCurrency.code && r.to === toCurrency.code
        );
        
        if (!rapiraRate) {
          return null;
        }
        
        // Calculate effective rate: Rapira rate * (1 + markup%)
        const baseRate = rapiraRate.rate;
        const effectiveRate = baseRate * (1 + markup / 100);
        
        return {
          from: fromCurrency.code,
          to: toCurrency.code,
          baseRate: baseRate.toFixed(8),
          markupPercent: markup.toFixed(2),
          effectiveRate: effectiveRate.toFixed(8),
          rapiraRate: baseRate.toFixed(8),
        };
      }),
    listAll: publicProcedure.query(async () => {
      return getAllRates(true);
    }),
    // Get complete rates matrix (all possible exchanges)
    matrix: publicProcedure.query(async () => {
      try {
        return await ratesMatrixCache.get();
      } catch (error) {
        console.error("Error fetching rates matrix:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch rates matrix",
        });
      }
    }),
    // Get exchange rate between two specific currencies
    getRate: publicProcedure
      .input(z.object({ from: z.string(), to: z.string() }))
      .query(async ({ input }) => {
        try {
          const rate = await ratesMatrixCache.getRate(input.from, input.to);
          if (!rate) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `No rate found for ${input.from} to ${input.to}`,
            });
          }
          return rate;
        } catch (error) {
          console.error(`Error fetching rate for ${input.from}/${input.to}:`, error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch exchange rate",
          });
        }
      }),
    // Get all rates FROM one currency
    getRatesFrom: publicProcedure
      .input(z.object({ from: z.string() }))
      .query(async ({ input }) => {
        try {
          return await ratesMatrixCache.getRatesFrom(input.from);
        } catch (error) {
          console.error(`Error fetching rates from ${input.from}:`, error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch rates",
          });
        }
      }),
    // Get all rates TO one currency
    getRatesTo: publicProcedure
      .input(z.object({ to: z.string() }))
      .query(async ({ input }) => {
        try {
          return await ratesMatrixCache.getRatesTo(input.to);
        } catch (error) {
          console.error(`Error fetching rates to ${input.to}:`, error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch rates",
          });
        }
      }),
    // Get list of all supported currencies
    supported: publicProcedure.query(async () => {
      return getSupportedCurrencies();
    }),
  }),

  // ============ PUBLIC: Orders ============
  orders: router({
    create: publicProcedure
      .input(z.object({
        giveCurrencyId: z.number().positive(),
        receiveCurrencyId: z.number().positive(),
        giveAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Сумма должна быть положительным числом",
        }),
        receiveAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Сумма должна быть положительным числом",
        }),
        exchangeRate: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Курс обмена должен быть положительным числом",
        }),
        payoutDetails: z.string().min(5, "Слишком короткие реквизиты").max(200, "Слишком длинные реквизиты"),
        telegramHandle: z.string().min(3, "Неверный формат Telegram").max(50, "Слишком длинный Telegram"),
      }))
      .mutation(async ({ input }) => {
        // Get a deposit address for the give currency
        const addresses = await getAddressesForCurrency(input.giveCurrencyId);
        if (addresses.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No deposit address available for this currency",
          });
        }
        // Pick a random active address
        const depositAddr = addresses[Math.floor(Math.random() * addresses.length)];
        
        const orderId = nanoid(12).toUpperCase();
        
        await createOrder({
          orderId,
          giveCurrencyId: input.giveCurrencyId,
          giveAmount: input.giveAmount,
          receiveCurrencyId: input.receiveCurrencyId,
          receiveAmount: input.receiveAmount,
          exchangeRate: input.exchangeRate,
          payoutDetails: input.payoutDetails,
          depositAddress: depositAddr.address,
          telegramHandle: input.telegramHandle,
          status: "pending",
        });

        // Get currency names for notification
        const giveCurrency = await getCurrencyById(input.giveCurrencyId);
        const receiveCurrency = await getCurrencyById(input.receiveCurrencyId);

        // Notify owner about new order
        try {
          await notifyOwner({
            title: `New Exchange Order #${orderId}`,
            content: `New order: ${input.giveAmount} ${giveCurrency?.name || "Unknown"} → ${input.receiveAmount} ${receiveCurrency?.name || "Unknown"}\nTelegram: ${input.telegramHandle}\nPayout: ${input.payoutDetails}`,
          });
        } catch (e) {
          console.error("Failed to notify owner:", e);
        }

        return {
          orderId,
          depositAddress: depositAddr.address,
        };
      }),

    getStatus: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        const order = await getOrderByPublicId(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        return order;
      }),
  }),

  // ============ ADMIN: Currencies ============
  adminCurrencies: router({
    list: adminProcedure.query(async () => {
      return getAllCurrencies(false);
    }),
    create: adminProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        type: z.enum(["crypto", "fiat"]),
        network: z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createCurrency({
          ...input,
          network: input.network ?? null,
          symbol: input.symbol ?? null,
          icon: input.icon ?? null,
          category: input.category ?? null,
          sortOrder: input.sortOrder ?? 0,
        });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        name: z.string().optional(),
        type: z.enum(["crypto", "fiat"]).optional(),
        network: z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        isActive: z.number().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCurrency(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCurrency(input.id);
        return { success: true };
      }),
  }),

  // ============ ADMIN: Rates ============
  adminRates: router({
    list: adminProcedure.query(async () => {
      return getAllRates(false);
    }),
    create: adminProcedure
      .input(z.object({
        fromCurrencyId: z.number(),
        toCurrencyId: z.number(),
        rate: z.string(),
        markupPercent: z.string().optional(),
        minAmount: z.string().nullable().optional(),
        maxAmount: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createRate({
          fromCurrencyId: input.fromCurrencyId,
          toCurrencyId: input.toCurrencyId,
          rate: input.rate,
          markupPercent: input.markupPercent || "0",
          minAmount: input.minAmount ?? null,
          maxAmount: input.maxAmount ?? null,
        });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        rate: z.string().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) > 0), {
          message: "Курс должен быть положительным числом",
        }).optional(),
        markupPercent: z.string().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= -50 && parseFloat(val) <= 100), {
          message: "Наценка должна быть от -50% до 100%",
        }).optional(),
        minAmount: z.string().nullable().optional(),
        maxAmount: z.string().nullable().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateRate(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteRate(input.id);
        return { success: true };
      }),
  }),

  // ============ ADMIN: Deposit Addresses ============
  adminAddresses: router({
    list: adminProcedure.query(async () => {
      return getAllAddresses();
    }),
    create: adminProcedure
      .input(z.object({
        currencyId: z.number().positive(),
        address: z.string().min(10, "Слишком короткий адрес").max(200, "Слишком длинный адрес"),
        label: z.string().max(50, "Слишком длинное название").nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createAddress({
          currencyId: input.currencyId,
          address: input.address,
          label: input.label ?? null,
        });
        return { id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().positive(),
        address: z.string().min(10, "Слишком короткий адрес").max(200, "Слишком длинный адрес").optional(),
        label: z.string().max(50, "Слишком длинное название").nullable().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAddress(id, data);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAddress(input.id);
        return { success: true };
      }),
  }),

  // ============ ADMIN: Orders ============
  adminOrders: router({
    list: adminProcedure.query(async () => {
      return getAllOrders();
    }),
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "payment_received", "processing", "completed", "cancelled"]),
        adminNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status, input.adminNote);
        return { success: true };
      }),
  }),
  // ============ ADMIN: Users ============
  adminUsers: router({
    list: adminProcedure.query(async () => {
      return getAllUsers();
    }),
    create: adminProcedure
      .input(z.object({
        openId: z.string().min(3, "OpenID должен содержать минимум 3 символа").max(50),
        name: z.string().max(100).nullable().optional(),
        email: z.string().email().max(100).nullable().optional(),
        password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(100),
        role: z.enum(["user", "admin", "manager", "operator", "viewer"]),
        status: z.enum(["active", "inactive"]),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await getUserByOpenId(input.openId);
        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User with this OpenID already exists",
          });
        }
        // Hash password before storing
        const hashedPassword = await hashPassword(input.password);
        const user = await createUser({
          openId: input.openId,
          name: input.name ?? null,
          email: input.email ?? null,
          password: hashedPassword,
          role: input.role,
          status: input.status,
        });
        return user;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number().positive(),
        openId: z.string().min(3).max(50).optional(),
        name: z.string().max(100).nullable().optional(),
        email: z.string().email().max(100).nullable().optional(),
        password: z.string().min(8, "Пароль должен содержать минимум 8 символов").max(100).optional(),
        role: z.enum(["user", "admin", "manager", "operator", "viewer"]).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }))
      .mutation(async ({ input }) => {
        // Get user by ID from database
        const allUsers = await getAllUsers();
        const user = allUsers.find(u => u.id === input.id);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }
        // If openId is provided and different, validate it's unique
        if (input.openId && input.openId !== user.openId) {
          const existingUser = await getUserByOpenId(input.openId);
          if (existingUser) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "OpenID already in use",
            });
          }
        }
        const updates: Record<string, any> = {};
        if (input.name !== undefined) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.password) {
          // Hash password before storing
          updates.password = await hashPassword(input.password);
        }
        if (input.role) updates.role = input.role;
        if (input.status) updates.status = input.status;
        if (input.openId && input.openId !== user.openId) updates.openId = input.openId;
        
        // Use the current or new openId for the update
        const openIdToUse = input.openId || user.openId;
        const result = await updateUser(openIdToUse, updates);
        return result;
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteUserById(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
