import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb, createCurrency, createAddress } from "../db";
import { users, currencies, depositAddresses } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

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
            console.log(`[Init] ✅ Currency seeded: ${curr.code}`);
          }
        }
      } catch (e) {
        console.error(`[Init] Error seeding currency ${curr.code}:`, e);
      }
    }

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
    if (existingUser.length > 0) {
      console.log("[Init] Admin user already exists");
      return;
    }

    // Create admin user
    await db.insert(users).values({
      openId: 'BlackSupport',
      name: 'BlackSupport',
      email: 'admin@easycash.club',
      password: 'FGGHJKJoouy58&%^*98785',
      role: 'admin',
      status: 'active',
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
  // Trust proxy headers for HTTPS detection
  app.set('trust proxy', true);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/trpc",
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
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
