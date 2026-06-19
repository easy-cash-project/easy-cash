import { serial, pgEnum, pgTable, text, timestamp, varchar, numeric, integer } from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["user", "admin", "manager", "operator", "viewer"]);
const typeEnum = pgEnum("type", ["crypto", "fiat"]);
const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
const orderStatusEnum = pgEnum("order_status", ["pending", "payment_received", "processing", "completed", "cancelled"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Currencies available for exchange.
 * type: 'crypto' | 'fiat'
 * network: optional network for crypto (e.g., BEP20, ERC20, TRC20, SOL, TON)
 */
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  type: typeEnum("type").notNull(),
  network: varchar("network", { length: 64 }),
  symbol: varchar("symbol", { length: 16 }),
  icon: varchar("icon", { length: 512 }),
  category: varchar("category", { length: 32 }), // Crypto, Карты, Cash, ATM
  isActive: integer("isActive").default(1).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = typeof currencies.$inferInsert;

/**
 * Exchange rates between currency pairs.
 * rate: the base exchange rate
 * markupPercent: percentage to add on top of the base rate
 * effectiveRate = rate * (1 + markupPercent / 100)
 */
export const exchangeRates = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  fromCurrencyId: integer("fromCurrencyId").notNull(),
  toCurrencyId: integer("toCurrencyId").notNull(),
  baseRate: numeric("baseRate", { precision: 20, scale: 8 }).notNull(),
  markupPercent: numeric("markupPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  minAmount: numeric("minAmount", { precision: 20, scale: 8 }),
  maxAmount: numeric("maxAmount", { precision: 20, scale: 8 }),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

/**
 * Deposit addresses for receiving crypto from clients.
 */
export const depositAddresses = pgTable("deposit_addresses", {
  id: serial("id").primaryKey(),
  currencyId: integer("currencyId").notNull(),
  address: varchar("address", { length: 512 }).notNull(),
  label: varchar("label", { length: 128 }),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DepositAddress = typeof depositAddresses.$inferSelect;
export type InsertDepositAddress = typeof depositAddresses.$inferInsert;

/**
 * Exchange orders created by clients.
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: varchar("orderId", { length: 32 }).notNull().unique(), // public-facing order ID
  giveCurrencyId: integer("giveCurrencyId").notNull(),
  giveAmount: numeric("giveAmount", { precision: 20, scale: 8 }).notNull(),
  receiveCurrencyId: integer("receiveCurrencyId").notNull(),
  receiveAmount: numeric("receiveAmount", { precision: 20, scale: 8 }).notNull(),
  exchangeRate: numeric("exchangeRate", { precision: 20, scale: 8 }).notNull(),
  payoutDetails: text("payoutDetails").notNull(), // card number or crypto address for payout
  depositAddress: varchar("depositAddress", { length: 512 }).notNull(), // address shown to client
  telegramHandle: varchar("telegramHandle", { length: 128 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Telegram notification configuration.
 * Stores bot token and chat ID for sending order notifications.
 */
export const telegramConfig = pgTable("telegram_config", {
  id: serial("id").primaryKey(),
  botToken: varchar("botToken", { length: 256 }).notNull(),
  chatId: varchar("chatId", { length: 64 }).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TelegramConfig = typeof telegramConfig.$inferSelect;
export type InsertTelegramConfig = typeof telegramConfig.$inferInsert;
