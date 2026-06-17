CREATE TABLE "currencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(128) NOT NULL,
	"type" "type" NOT NULL,
	"network" varchar(64),
	"symbol" varchar(16),
	"icon" varchar(512),
	"category" varchar(32),
	"isActive" numeric DEFAULT '1' NOT NULL,
	"sortOrder" numeric DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposit_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"currencyId" numeric NOT NULL,
	"address" varchar(512) NOT NULL,
	"label" varchar(128),
	"isActive" numeric DEFAULT '1' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromCurrencyId" numeric NOT NULL,
	"toCurrencyId" numeric NOT NULL,
	"rate" numeric(20, 8) NOT NULL,
	"markupPercent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"minAmount" numeric(20, 8),
	"maxAmount" numeric(20, 8),
	"isActive" numeric DEFAULT '1' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderId" varchar(32) NOT NULL,
	"giveCurrencyId" numeric NOT NULL,
	"giveAmount" numeric(20, 8) NOT NULL,
	"receiveCurrencyId" numeric NOT NULL,
	"receiveAmount" numeric(20, 8) NOT NULL,
	"exchangeRate" numeric(20, 8) NOT NULL,
	"payoutDetails" text NOT NULL,
	"depositAddress" varchar(512) NOT NULL,
	"telegramHandle" varchar(128) NOT NULL,
	"status" "status" DEFAULT 'pending' NOT NULL,
	"adminNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
