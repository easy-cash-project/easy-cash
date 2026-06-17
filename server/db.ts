import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, currencies, exchangeRates, depositAddresses, orders } from "../drizzle/schema";
import type { InsertCurrency, InsertExchangeRate, InsertDepositAddress, InsertOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USERS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CURRENCIES ============

export async function getAllCurrencies(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(currencies).where(eq(currencies.isActive, 1)).orderBy(currencies.sortOrder);
  }
  return db.select().from(currencies).orderBy(currencies.sortOrder);
}

export async function getCurrencyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(currencies).where(eq(currencies.id, id)).limit(1);
  return result[0];
}

export async function createCurrency(data: InsertCurrency) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(currencies).values(data);
  return result[0].insertId;
}

export async function updateCurrency(id: number, data: Partial<InsertCurrency>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(currencies).set(data).where(eq(currencies.id, id));
}

export async function deleteCurrency(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(currencies).where(eq(currencies.id, id));
}

// ============ EXCHANGE RATES ============

export async function getAllRates(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(exchangeRates).where(eq(exchangeRates.isActive, 1));
  }
  return db.select().from(exchangeRates);
}

export async function getRateForPair(fromCurrencyId: number, toCurrencyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(exchangeRates)
    .where(and(
      eq(exchangeRates.fromCurrencyId, fromCurrencyId),
      eq(exchangeRates.toCurrencyId, toCurrencyId),
      eq(exchangeRates.isActive, 1)
    ))
    .limit(1);
  return result[0];
}

export async function createRate(data: InsertExchangeRate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(exchangeRates).values(data);
  return result[0].insertId;
}

export async function updateRate(id: number, data: Partial<InsertExchangeRate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(exchangeRates).set(data).where(eq(exchangeRates.id, id));
}

export async function deleteRate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(exchangeRates).where(eq(exchangeRates.id, id));
}

// ============ DEPOSIT ADDRESSES ============

export async function getAddressesForCurrency(currencyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(depositAddresses)
    .where(and(
      eq(depositAddresses.currencyId, currencyId),
      eq(depositAddresses.isActive, 1)
    ));
}

export async function getAllAddresses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(depositAddresses);
}

export async function createAddress(data: InsertDepositAddress) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(depositAddresses).values(data);
  return result[0].insertId;
}

export async function updateAddress(id: number, data: Partial<InsertDepositAddress>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(depositAddresses).set(data).where(eq(depositAddresses.id, id));
}

export async function deleteAddress(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(depositAddresses).where(eq(depositAddresses.id, id));
}

// ============ ORDERS ============

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getOrderByPublicId(orderId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderId, orderId)).limit(1);
  return result[0];
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function updateOrderStatus(id: number, status: string, adminNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: Record<string, unknown> = { status };
  if (adminNote !== undefined) {
    updateData.adminNote = adminNote;
  }
  await db.update(orders).set(updateData).where(eq(orders.id, id));
}
