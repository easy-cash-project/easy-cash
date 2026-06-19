-- Delete all old currencies and reset the sequence
DELETE FROM "currencies";
ALTER SEQUENCE "currencies_id_seq" RESTART WITH 1;

-- Insert new currencies with correct codes
INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "is_active", "created_at", "updated_at") VALUES
('USDT_TRC20', 'USDT (Tron)', 'crypto', 'TRC20', '₮', 1, NOW(), NOW()),
('USDT_BEP20', 'USDT (BSC)', 'crypto', 'BEP20', '₮', 1, NOW(), NOW()),
('USDT_SOL', 'USDT (Solana)', 'crypto', 'SOL', '₮', 1, NOW(), NOW()),
('USDT_TON', 'USDT (Ton)', 'crypto', 'TON', '₮', 1, NOW(), NOW()),
('USDT_ERC20', 'USDT (Ethereum)', 'crypto', 'ERC20', '₮', 1, NOW(), NOW()),
('BTC', 'Bitcoin', 'crypto', NULL, '₿', 1, NOW(), NOW()),
('ETH', 'Ethereum', 'crypto', NULL, 'Ξ', 1, NOW(), NOW()),
('LTC', 'Litecoin', 'crypto', NULL, 'Ł', 1, NOW(), NOW()),
('TON', 'Toncoin', 'crypto', NULL, '💎', 1, NOW(), NOW()),
('TRX', 'Tron', 'crypto', NULL, 'T', 1, NOW(), NOW()),
('XMR', 'Monero', 'crypto', NULL, 'ɱ', 1, NOW(), NOW()),
('RUB', 'Russian Ruble', 'fiat', NULL, '₽', 1, NOW(), NOW());
