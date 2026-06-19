-- Seed currencies - with proper handling for duplicates
-- This migration adds all necessary currencies for the exchange

-- Delete existing currencies to ensure clean state
DELETE FROM "currencies" WHERE "code" IN ('BTC', 'ETH', 'LTC', 'XMR', 'TON', 'TRX', 'USDT');

-- Insert all currencies
INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES 
  ('BTC', 'Bitcoin', 'crypto', NULL, '₿', 'Crypto', 1, 1, now(), now()),
  ('ETH', 'Ethereum', 'crypto', NULL, 'Ξ', 'Crypto', 1, 2, now(), now()),
  ('LTC', 'Litecoin', 'crypto', NULL, 'Ł', 'Crypto', 1, 3, now(), now()),
  ('XMR', 'Monero', 'crypto', NULL, 'ɱ', 'Crypto', 1, 4, now(), now()),
  ('TON', 'Toncoin', 'crypto', NULL, '💎', 'Crypto', 1, 5, now(), now()),
  ('TRX', 'Tron', 'crypto', NULL, 'T', 'Crypto', 1, 6, now(), now()),
  ('USDT', 'Tether ERC20', 'crypto', 'ERC20', '₮', 'Crypto', 1, 7, now(), now()),
  ('USDT', 'Tether TRC20', 'crypto', 'TRC20', '₮', 'Crypto', 1, 8, now(), now()),
  ('USDT', 'Tether BEP20', 'crypto', 'BEP20', '₮', 'Crypto', 1, 9, now(), now()),
  ('USDT', 'Tether SOL', 'crypto', 'SOL', '₮', 'Crypto', 1, 10, now(), now()),
  ('USDT', 'Tether TON', 'crypto', 'TON', '₮', 'Crypto', 1, 11, now(), now());
