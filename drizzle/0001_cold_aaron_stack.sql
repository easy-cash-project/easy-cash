CREATE TABLE `currencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` enum('crypto','fiat') NOT NULL,
	`network` varchar(64),
	`symbol` varchar(16),
	`icon` varchar(512),
	`category` varchar(32),
	`isActive` int NOT NULL DEFAULT 1,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deposit_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`currencyId` int NOT NULL,
	`address` varchar(512) NOT NULL,
	`label` varchar(128),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deposit_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromCurrencyId` int NOT NULL,
	`toCurrencyId` int NOT NULL,
	`rate` decimal(20,8) NOT NULL,
	`markupPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`minAmount` decimal(20,8),
	`maxAmount` decimal(20,8),
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchange_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(32) NOT NULL,
	`giveCurrencyId` int NOT NULL,
	`giveAmount` decimal(20,8) NOT NULL,
	`receiveCurrencyId` int NOT NULL,
	`receiveAmount` decimal(20,8) NOT NULL,
	`exchangeRate` decimal(20,8) NOT NULL,
	`payoutDetails` text NOT NULL,
	`depositAddress` varchar(512) NOT NULL,
	`telegramHandle` varchar(128) NOT NULL,
	`status` enum('pending','payment_received','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
	`adminNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderId_unique` UNIQUE(`orderId`)
);
