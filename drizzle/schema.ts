import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Currencies available for exchange.
 * type: 'crypto' | 'fiat'
 * network: optional network for crypto (e.g., BEP20, ERC20, TRC20, SOL, TON)
 */
export const currencies = mysqlTable("currencies", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["crypto", "fiat"]).notNull(),
  network: varchar("network", { length: 64 }),
  symbol: varchar("symbol", { length: 16 }),
  icon: varchar("icon", { length: 512 }),
  category: varchar("category", { length: 32 }), // Crypto, Карты, Cash, ATM
  isActive: int("isActive").default(1).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;

/**
 * Exchange rates between currency pairs.
 * rate: the base exchange rate
 * markupPercent: percentage to add on top of the base rate
 * effectiveRate = rate * (1 + markupPercent / 100)
 */
export const exchangeRates = mysqlTable("exchange_rates", {
  id: int("id").autoincrement().primaryKey(),
  fromCurrencyId: int("fromCurrencyId").notNull(),
  toCurrencyId: int("toCurrencyId").notNull(),
  rate: decimal("rate", { precision: 20, scale: 8 }).notNull(),
  markupPercent: decimal("markupPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  minAmount: decimal("minAmount", { precision: 20, scale: 8 }),
  maxAmount: decimal("maxAmount", { precision: 20, scale: 8 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

/**
 * Deposit addresses for receiving crypto from clients.
 */
export const depositAddresses = mysqlTable("deposit_addresses", {
  id: int("id").autoincrement().primaryKey(),
  currencyId: int("currencyId").notNull(),
  address: varchar("address", { length: 512 }).notNull(),
  label: varchar("label", { length: 128 }),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DepositAddress = typeof depositAddresses.$inferSelect;
export type InsertDepositAddress = typeof depositAddresses.$inferInsert;

/**
 * Exchange orders created by clients.
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderId: varchar("orderId", { length: 32 }).notNull().unique(), // public-facing order ID
  giveCurrencyId: int("giveCurrencyId").notNull(),
  giveAmount: decimal("giveAmount", { precision: 20, scale: 8 }).notNull(),
  receiveCurrencyId: int("receiveCurrencyId").notNull(),
  receiveAmount: decimal("receiveAmount", { precision: 20, scale: 8 }).notNull(),
  exchangeRate: decimal("exchangeRate", { precision: 20, scale: 8 }).notNull(),
  payoutDetails: text("payoutDetails").notNull(), // card number or crypto address for payout
  depositAddress: varchar("depositAddress", { length: 512 }).notNull(), // address shown to client
  telegramHandle: varchar("telegramHandle", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "payment_received", "processing", "completed", "cancelled"]).default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
