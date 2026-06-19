-- Insert currencies one by one to avoid syntax issues
INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('BTC', 'Bitcoin', 'crypto', NULL, '₿', 'Crypto', 1, 1, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('ETH', 'Ethereum', 'crypto', NULL, 'Ξ', 'Crypto', 1, 2, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('LTC', 'Litecoin', 'crypto', NULL, 'Ł', 'Crypto', 1, 3, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('XMR', 'Monero', 'crypto', NULL, 'ɱ', 'Crypto', 1, 4, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('TON', 'Toncoin', 'crypto', NULL, '💎', 'Crypto', 1, 5, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('TRX', 'Tron', 'crypto', NULL, 'T', 'Crypto', 1, 6, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('USDT', 'Tether ERC20', 'crypto', 'ERC20', '₮', 'Crypto', 1, 7, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('USDT', 'Tether TRC20', 'crypto', 'TRC20', '₮', 'Crypto', 1, 8, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('USDT', 'Tether BEP20', 'crypto', 'BEP20', '₮', 'Crypto', 1, 9, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('USDT', 'Tether SOL', 'crypto', 'SOL', '₮', 'Crypto', 1, 10, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('USDT', 'Tether TON', 'crypto', 'TON', '₮', 'Crypto', 1, 11, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('VISA_MC', 'Visa/Mastercard', 'fiat', NULL, '💳', 'Карты', 1, 12, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('TBANK', 'T-Bank', 'fiat', NULL, '🏦', 'Карты', 1, 13, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('SBER', 'Sber', 'fiat', NULL, '🏦', 'Карты', 1, 14, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('SBP', 'SBP', 'fiat', NULL, '⚡', 'Карты', 1, 15, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('MIR', 'MIR', 'fiat', NULL, '💳', 'Карты', 1, 16, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('CASH', 'Наличные', 'fiat', NULL, '💵', 'Cash', 1, 17, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('TBANK_CASHIN', 'T-Bank cash-in', 'fiat', NULL, '🏧', 'Cash', 1, 18, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('TBANK_QR', 'T-Bank QR', 'fiat', NULL, '📱', 'ATM', 1, 19, now(), now());

INSERT INTO "currencies" ("code", "name", "type", "network", "symbol", "category", "isActive", "sortOrder", "createdAt", "updatedAt") 
VALUES ('SBER_QR', 'Sber QR', 'fiat', NULL, '📱', 'ATM', 1, 20, now(), now());
