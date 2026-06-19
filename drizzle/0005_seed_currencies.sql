-- Insert all currencies from CURRENCIES_SEED
INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
-- Crypto currencies
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
('USDT', 'Tether TON', 'crypto', 'TON', '₮', 'Crypto', 1, 11, now(), now()),
-- Fiat / Card methods
('VISA_MC', 'Visa/Mastercard', 'fiat', NULL, '💳', 'Карты', 1, 12, now(), now()),
('TBANK', 'T-Bank', 'fiat', NULL, '🏦', 'Карты', 1, 13, now(), now()),
('SBER', 'Sber', 'fiat', NULL, '🏦', 'Карты', 1, 14, now(), now()),
('SBP', 'SBP', 'fiat', NULL, '⚡', 'Карты', 1, 15, now(), now()),
('MIR', 'MIR', 'fiat', NULL, '💳', 'Карты', 1, 16, now(), now()),
('CASH', 'Наличные', 'fiat', NULL, '💵', 'Cash', 1, 17, now(), now()),
('TBANK_CASHIN', 'T-Bank cash-in', 'fiat', NULL, '🏧', 'Cash', 1, 18, now(), now()),
('TBANK_QR', 'T-Bank QR', 'fiat', NULL, '📱', 'ATM', 1, 19, now(), now()),
('SBER_QR', 'Sber QR', 'fiat', NULL, '📱', 'ATM', 1, 20, now(), now());
