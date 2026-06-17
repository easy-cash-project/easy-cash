import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Exchange routers", () => {
  it("public currencies.list returns an array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const currencies = await caller.currencies.list();
    expect(Array.isArray(currencies)).toBe(true);
  });

  it("admin currencies.create requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.adminCurrencies.create({
        code: "TEST",
        name: "Test Coin",
        type: "crypto",
      })
    ).rejects.toThrow();
  });

  it("admin can list orders", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const orders = await caller.adminOrders.list();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("admin can list rates", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const rates = await caller.adminRates.list();
    expect(Array.isArray(rates)).toBe(true);
  });

  it("admin can list addresses", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const addresses = await caller.adminAddresses.list();
    expect(Array.isArray(addresses)).toBe(true);
  });

  it("public getStatus throws for non-existent order", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.orders.getStatus({ orderId: "NONEXISTENT123" })
    ).rejects.toThrow("Order not found");
  });

  it("rates.getForPair returns null when no rate exists", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const rate = await caller.rates.getForPair({ fromCurrencyId: 99999, toCurrencyId: 99998 });
    expect(rate).toBeNull();
  });
});
