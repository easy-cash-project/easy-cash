-- Fix field types in currencies table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='currencies' AND column_name='isActive') THEN
    ALTER TABLE currencies ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='currencies' AND column_name='sortOrder') THEN
    ALTER TABLE currencies ALTER COLUMN "sortOrder" SET DATA TYPE integer USING ("sortOrder"::integer);
  END IF;
END $$;

-- Fix field types in exchange_rates table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='fromCurrencyId') THEN
    ALTER TABLE exchange_rates ALTER COLUMN "fromCurrencyId" SET DATA TYPE integer USING ("fromCurrencyId"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='toCurrencyId') THEN
    ALTER TABLE exchange_rates ALTER COLUMN "toCurrencyId" SET DATA TYPE integer USING ("toCurrencyId"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='isActive') THEN
    ALTER TABLE exchange_rates ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exchange_rates' AND column_name='rate') THEN
    ALTER TABLE exchange_rates RENAME COLUMN "rate" TO "baseRate";
  END IF;
END $$;

-- Fix field types in deposit_addresses table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deposit_addresses' AND column_name='currencyId') THEN
    ALTER TABLE deposit_addresses ALTER COLUMN "currencyId" SET DATA TYPE integer USING ("currencyId"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deposit_addresses' AND column_name='isActive') THEN
    ALTER TABLE deposit_addresses ALTER COLUMN "isActive" SET DATA TYPE integer USING ("isActive"::integer);
  END IF;
END $$;

-- Fix field types in orders table
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='giveCurrencyId') THEN
    ALTER TABLE orders ALTER COLUMN "giveCurrencyId" SET DATA TYPE integer USING ("giveCurrencyId"::integer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='receiveCurrencyId') THEN
    ALTER TABLE orders ALTER COLUMN "receiveCurrencyId" SET DATA TYPE integer USING ("receiveCurrencyId"::integer);
  END IF;
END $$;
