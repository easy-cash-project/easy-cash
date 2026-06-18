-- Migration: Update admin password to bcrypt hash
-- This migration updates the BlackSupport admin user password from plain text to bcrypt hash
-- Password: FGGHJKJoouy58&%^*98785
-- Bcrypt hash (10 rounds): $2b$10$m93ri2nwx8h35p88wuWsNunjHEHxSjLWm.jDrH3TXlfDHrYW2Ot1.

UPDATE "users" 
SET "password" = '$2b$10$m93ri2nwx8h35p88wuWsNunjHEHxSjLWm.jDrH3TXlfDHrYW2Ot1.'
WHERE "openId" = 'BlackSupport' AND "password" = 'FGGHJKJoouy58&%^*98785';
