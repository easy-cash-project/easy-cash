CREATE TABLE IF NOT EXISTS "telegram_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"botToken" varchar(256) NOT NULL,
	"chatId" varchar(64) NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
