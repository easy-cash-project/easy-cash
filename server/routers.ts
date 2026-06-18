import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getAllCurrencies, getCurrencyById, createCurrency, updateCurrency, deleteCurrency,
  getAllRates, getRateForPair, createRate, updateRate, deleteRate,
  getAllAddresses, getAddressesForCurrency, createAddress, updateAddress, deleteAddress,
  getAllOrders, getOrderByPublicId, createOrder, updateOrderStatus,
  createUser, getUserByOpenId, updateUser
} from "./db";
import { notifyOwner } from "./_core/notification";

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
        const user = await getUserByOpenId(input.openId);
        
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid OpenID or password",
          });
        }
        
        if (!user.password || user.password !== input.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid OpenID or password",
          });
        }
        
        // Create JWT session token
        const sessionToken = sdk.createSessionToken({
          openId: user.openId,
          appId: "easycash-app",
          name: user.name || user.openId,
        });
        
        // Return token for client to store in localStorage
        return { success: true, user, token: sessionToken };
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
        password: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const user = await updateUser(input.openId, {
          password: input.password,
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

  // ============ PUBLIC: Rates ============
  rates: router({
    getForPair: publicProcedure
      .input(z.object({ fromCurrencyId: z.number(), toCurrencyId: z.number() }))
      .query(async ({ input }) => {
        const rate = await getRateForPair(input.fromCurrencyId, input.toCurrencyId);
        if (!rate) return null;
        // Calculate effective rate with markup
        const baseRate = parseFloat(rate.rate);
        const markup = parseFloat(rate.markupPercent);
        const effectiveRate = baseRate * (1 + markup / 100);
        return {
          ...rate,
          effectiveRate: effectiveRate.toFixed(8),
        };
      }),
    listAll: publicProcedure.query(async () => {
      return getAllRates(true);
    }),
  }),

  // ============ PUBLIC: Orders ============
  orders: router({
    create: publicProcedure
      .input(z.object({
        giveCurrencyId: z.number(),
        giveAmount: z.string(),
        receiveCurrencyId: z.number(),
        receiveAmount: z.string(),
        exchangeRate: z.string(),
        payoutDetails: z.string().min(1),
        telegramHandle: z.string().min(1),
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
        rate: z.string().optional(),
        markupPercent: z.string().optional(),
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
        currencyId: z.number(),
        address: z.string(),
        label: z.string().nullable().optional(),
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
        id: z.number(),
        address: z.string().optional(),
        label: z.string().nullable().optional(),
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
});

export type AppRouter = typeof appRouter;
