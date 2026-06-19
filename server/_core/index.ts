import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb, createCurrency, createAddress } from "../db";
import { startRatesUpdater } from "./rates-updater";
import { users, currencies, depositAddresses, exchangeRates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import logger, { logSecurityEvent, logError, logInfo } from "./logger";
import { hashPassword } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function initializeSeedData() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("[Init] Database not available, skipping seed data initialization");
      return;
    }

    // Seed currencies using Drizzle ORM
    const currenciesToSeed = [
      { code: 'USDT_TRC20', name: 'USDT (Tron)', type: 'crypto' as const, network: 'TRC20', symbol: '₮', isActive: 1 },
      { code: 'USDT_BEP20', name: 'USDT (BSC)', type: 'crypto' as const, network: 'BEP20', symbol: '₮', isActive: 1 },
      { code: 'USDT_SOL', name: 'USDT (Solana)', type: 'crypto' as const, network: 'SOL', symbol: '₮', isActive: 1 },
      { code: 'USDT_TON', name: 'USDT (Ton)', type: 'crypto' as const, network: 'TON', symbol: '₮', isActive: 1 },
      { code: 'BTC', name: 'Bitcoin', type: 'crypto' as const, network: 'BTC', symbol: '₿', isActive: 1 },
      { code: 'ETH', name: 'Ethereum', type: 'crypto' as const, network: 'ETH', symbol: 'Ξ', isActive: 1 },
      { code: 'LTC', name: 'Litecoin', type: 'crypto' as const, network: 'LTC', symbol: 'Ł', isActive: 1 },
      { code: 'TON', name: 'Toncoin', type: 'crypto' as const, network: 'TON', symbol: '💎', isActive: 1 },
      { code: 'XMR', name: 'Monero', type: 'crypto' as const, network: 'XMR', symbol: 'ɱ', isActive: 1 },
      { code: 'RUB', name: 'Russian Ruble', type: 'fiat' as const, network: 'RUB', symbol: '₽', isActive: 1 },
    ];

    let currencyMap: Record<string, number> = {};
    for (const curr of currenciesToSeed) {
      try {
        // Check if currency already exists
        const existing = await db.select().from(currencies).where(eq(currencies.code, curr.code)).limit(1);
        if (existing.length > 0) {
          currencyMap[curr.code] = existing[0].id;
          console.log(`[Init] Currency already exists: ${curr.code}`);
        } else {
          // Insert new currency
          const result = await db.insert(currencies).values(curr).returning();
          if (result && result.length > 0) {
            currencyMap[curr.code] = result[0].id;
            console.log(`[Init] ✅ Currency seeded: ${curr.code} (ID: ${result[0].id})`);
          }
        }
      } catch (e) {
        console.error(`[Init] Error seeding currency ${curr.code}:`, e);
      }
    }

    // Refresh currency map to ensure all IDs are available
    console.log(`[Init] Refreshing currency map...`);
    const allCurrencies = await db.select().from(currencies);
    for (const curr of allCurrencies) {
      currencyMap[curr.code] = curr.id;
    }
    console.log(`[Init] Currency map refreshed with ${Object.keys(currencyMap).length} currencies`);

    // Seed exchange rates using Drizzle ORM
    const cryptoCurrencies = ['USDT_TRC20', 'USDT_BEP20', 'USDT_SOL', 'USDT_TON', 'BTC', 'ETH', 'LTC', 'TON', 'XMR'];
    const mockRates: Record<string, number> = {
      'USDT_TRC20': 75,
      'USDT_BEP20': 75,
      'USDT_SOL': 75,
      'USDT_TON': 75,
      'BTC': 9250000,
      'ETH': 350000,
      'LTC': 12500,
      'TON': 550,
      'XMR': 25000,
    };

    let ratesCreated = 0;
    console.log(`[Init] Starting rates seeding. Currency map has ${Object.keys(currencyMap).length} currencies`);
    console.log(`[Init] Currency map keys:`, Object.keys(currencyMap));
    console.log(`[Init] RUB ID: ${currencyMap['RUB']}`);
    
    for (const fromCrypto of cryptoCurrencies) {
      const fromId = currencyMap[fromCrypto];
      console.log(`[Init] Processing ${fromCrypto}: fromId=${fromId}, mockRate=${mockRates[fromCrypto]}`);
      if (!fromId) {
        console.log(`[Init] ⚠️ No ID found for ${fromCrypto}`);
        continue;
      }

      const rubId = currencyMap['RUB'];
      const priceRub = mockRates[fromCrypto];
      console.log(`[Init] Checking conditions: priceRub=${priceRub}, rubId=${rubId}, fromId=${fromId}`);
      if (!priceRub || !rubId) {
        console.log(`[Init] ⚠️ Missing priceRub=${priceRub} or rubId=${rubId}`);
        continue;
      }

      // Create rate for crypto -> RUB
      try {
        console.log(`[Init] About to query existing rate for ${fromCrypto} (${fromId}) -> RUB (${rubId})`);
        const existing = await db.select().from(exchangeRates)
          .where(and(eq(exchangeRates.fromCurrencyId, fromId), eq(exchangeRates.toCurrencyId, rubId)))
          .limit(1);
        
        console.log(`[Init] Query result for ${fromCrypto} -> RUB: existing.length=${existing.length}`);
        
        if (existing.length === 0) {
          console.log(`[Init] Inserting rate: ${fromCrypto} (${fromId}) -> RUB (${rubId}), baseRate=${priceRub}`);
          try {
            const result = await db.insert(exchangeRates).values({
              fromCurrencyId: fromId,
              toCurrencyId: rubId,
              baseRate: priceRub,
              markupPercent: 0,
              isActive: 1,
            });
            console.log(`[Init] ✅ Rate seeded: ${fromCrypto} -> RUB, result:`, result);
            ratesCreated++;
          } catch (insertErr) {
            console.error(`[Init] ❌ Failed to insert rate ${fromCrypto} -> RUB:`, insertErr);
          }
        } else {
          console.log(`[Init] Rate already exists: ${fromCrypto} -> RUB`);
        }

        // Create rate for RUB -> crypto
        const rubToExisting = await db.select().from(exchangeRates)
          .where(and(eq(exchangeRates.fromCurrencyId, rubId), eq(exchangeRates.toCurrencyId, fromId)))
          .limit(1);
        
        if (rubToExisting.length === 0) {
          const rubToCryptoRate = 1 / priceRub;
          await db.insert(exchangeRates).values({
            fromCurrencyId: rubId,
            toCurrencyId: fromId,
            baseRate: rubToCryptoRate,
            markupPercent: 0,
            isActive: 1,
          });
          console.log(`[Init] ✅ Rate seeded: RUB -> ${fromCrypto}`);
          ratesCreated++;
        }

        // Create rates between crypto currencies
        for (const toCrypto of cryptoCurrencies) {
          if (fromCrypto === toCrypto) continue;

          const toId = currencyMap[toCrypto];
          if (!toId) continue;

          const toPriceRub = mockRates[toCrypto];
          if (!toPriceRub) continue;

          const cryptoExisting = await db.select().from(exchangeRates)
            .where(and(eq(exchangeRates.fromCurrencyId, fromId), eq(exchangeRates.toCurrencyId, toId)))
            .limit(1);

          if (cryptoExisting.length === 0) {
            const cryptoToCryptoRate = priceRub / toPriceRub;
            await db.insert(exchangeRates).values({
              fromCurrencyId: fromId,
              toCurrencyId: toId,
              baseRate: cryptoToCryptoRate,
              markupPercent: 0,
              isActive: 1,
            });
            ratesCreated++;
          }
        }
      } catch (e) {
        console.error(`[Init] Error seeding rates for ${fromCrypto}:`, e);
        console.error(`[Init] Error stack:`, e instanceof Error ? e.stack : 'No stack');
      }
    }
    console.log(`[Init] Exchange rates seeded: ${ratesCreated} rates created`);

    // Seed deposit addresses using Drizzle ORM
    const addressesToSeed = [
      { currencyCode: 'USDT_TRC20', address: 'TWc1QzHxa5JcdbBCNmem3Ab7T6GyRUwexK', label: 'USDT TRC20 Wallet' },
      { currencyCode: 'USDT_BEP20', address: '0x8D73D376410Eec9b5DAaA9612E69754432372191', label: 'USDT BEP20 Wallet' },
      { currencyCode: 'USDT_SOL', address: '7Sujm4R4nC8W2z2eGx3T83jyFbfzPqBPu7BqjGYao5BY', label: 'USDT SOL Wallet' },
      { currencyCode: 'USDT_TON', address: 'UQBraQDC2JTumcZMzSX0ZTtTSwOZt9INkhMJprIj4Z_ooh9i', label: 'USDT TON Wallet' },
      { currencyCode: 'BTC', address: 'bc1qlge7n68ugkqap5u699a64j3veqn2kjwyp6thgj', label: 'Bitcoin Wallet' },
      { currencyCode: 'ETH', address: '0x8D73D376410Eec9b5DAaA9612E69754432372191', label: 'Ethereum Wallet' },
      { currencyCode: 'LTC', address: 'ltc1qsrtwj6v3xn5nkrkrn2cm2auskxavzc06pelvxc', label: 'Litecoin Wallet' },
      { currencyCode: 'TON', address: 'UQBraQDC2JTumcZMzSX0ZTtTSwOZt9INkhMJprIj4Z_ooh9i', label: 'Toncoin Wallet' },
      { currencyCode: 'XMR', address: '7Sujm4R4nC8W2z2eGx3T83jyFbfzPqBPu7BqjGYao5BY', label: 'Monero Wallet' },
    ];

    for (const addr of addressesToSeed) {
      try {
        const currencyId = currencyMap[addr.currencyCode];
        if (!currencyId) {
          console.log(`[Init] Currency not found for address: ${addr.currencyCode}`);
          continue;
        }

        // Check if address already exists
        const existing = await db.select().from(depositAddresses)
          .where(and(eq(depositAddresses.currencyId, currencyId), eq(depositAddresses.address, addr.address)))
          .limit(1);
        
        if (existing.length > 0) {
          console.log(`[Init] Address already exists for ${addr.currencyCode}`);
        } else {
          // Insert new address
          await db.insert(depositAddresses).values({
            currencyId,
            address: addr.address,
            label: addr.label,
            isActive: 1,
          });
          console.log(`[Init] ✅ Address seeded: ${addr.currencyCode}`);
        }
      } catch (e) {
        console.error(`[Init] Error seeding address for ${addr.currencyCode}:`, e);
      }
    }

    console.log("[Init] Seed data initialization completed!");
  } catch (error) {
    console.error("[Init] Error initializing seed data:", error);
  }
}

async function initializeAdminUser() {
  try {
    const db = await getDb();
    if (!db) {
      console.log("[Init] Database not available, skipping admin user creation");
      return;
    }

    // Check if admin user already exists
    const existingUser = await db.select().from(users).where(eq(users.openId, 'BlackSupport')).limit(1);
    const PLAIN_PASSWORD = 'FGGHJKJoouy58&%^*98785';
    const hashedPassword = await hashPassword(PLAIN_PASSWORD);
    
    if (existingUser.length > 0) {
      // User exists - check if password needs to be updated
      const user = existingUser[0];
      
      // If password looks like plain text (not a bcrypt hash), update it
      if (user.password && !user.password.startsWith('$2')) {
        console.log("[Init] Admin user exists with plain-text password, updating to bcrypt hash...");
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.openId, 'BlackSupport'));
        console.log("[Init] Admin password updated to bcrypt hash!");
      } else {
        console.log("[Init] Admin user already exists with proper password hash");
      }
      return;
    }

    // Create admin user with hashed password
    await db.insert(users).values({
      openId: 'BlackSupport',
      name: 'BlackSupport',
      email: 'admin@easycash.club',
      password: hashedPassword,
      role: 'admin',
      loginMethod: 'password',
    });
    console.log("[Init] Admin user created successfully!");
  } catch (error) {
    console.error("[Init] Error creating admin user:", error);
  }
}

async function startServer() {
  // Initialize admin user on startup
  await initializeAdminUser();
  
  // Initialize seed data on startup
  await initializeSeedData();

  const app = express();
  const server = createServer(app);
  
  // ============================================================================
  // LOGGING MIDDLEWARE
  // ============================================================================
  
  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logMessage = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
      
      // Log security-relevant events
      if (req.path.includes('/auth') || req.path.includes('/admin') || req.path.includes('/trpc')) {
        logSecurityEvent('http_request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
      
      // Log errors
      if (res.statusCode >= 400) {
        logger.warn(logMessage);
      } else {
        logger.debug(logMessage);
      }
    });
    next();
  });
  
  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================
  
  // Trust proxy headers for HTTPS detection
  app.set('trust proxy', true);
  
  // Helmet: Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: false, // Отключаем CSP пока не настроим все нужные внешние домены
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Rate Limiting: Protect against brute force and DDoS attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting for health checks and static files
      return req.path === '/health' || req.path.startsWith('/public');
    },
  });
  
  // Apply rate limiting to all routes
  app.use(limiter);
  
  // More strict rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true, // Don't count successful requests
  });
  
  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
      console.log(`[${logLevel.toUpperCase()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app, authLimiter);
  // tRPC API with rate limiting
  app.use(
    "/trpc",
    limiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[Server] Running on http://localhost:${port}/`);
    console.log(`[Security] Helmet protection enabled`);
    console.log(`[Security] Rate limiting enabled (100 requests per 15 minutes)`);
    // Initialize seed data asynchronously after server starts
    initializeSeedData().catch(err => console.error("[Init] Failed to seed data:", err));
    // Start the rates updater (updates every 5 minutes)
    startRatesUpdater(5 * 60 * 1000);
  });
}

// Export for testing
export { initializeSeedData, authLimiter };

startServer().catch(console.error);
