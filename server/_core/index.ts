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
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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
