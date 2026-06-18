-- Fix field types in currencies table
ALTER TABLE currencies 
  ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer),
  ALTER COLUMN "sortOrder" SET DATA TYPE integer USING ("sortOrder"::integer);

-- Fix field types in exchange_rates table
ALTER TABLE exchange_rates
  ALTER COLUMN "fromCurrencyId" SET DATA TYPE integer USING ("fromCurrencyId"::integer),
  ALTER COLUMN "toCurrencyId" SET DATA TYPE integer USING ("toCurrencyId"::integer),
  ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer);

-- Rename rate column to baseRate if it exists
ALTER TABLE exchange_rates RENAME COLUMN "rate" TO "baseRate";

-- Fix field types in deposit_addresses table
ALTER TABLE deposit_addresses
  ALTER COLUMN "currencyId" SET DATA TYPE integer USING ("currencyId"::integer),
  ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer);

-- Fix field types in orders table
ALTER TABLE orders
  ALTER COLUMN "giveCurrencyId" SET DATA TYPE integer USING ("giveCurrencyId"::integer),
  ALTER COLUMN "receiveCurrencyId" SET DATA TYPE integer USING ("receiveCurrencyId"::integer);
