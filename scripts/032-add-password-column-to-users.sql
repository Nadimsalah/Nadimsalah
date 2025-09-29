-- Add password column to users table to fix checkout error
-- This addresses the "column password does not exist" error

-- Add password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Update existing users to have a default password hash if they don't have one
UPDATE users 
SET password = password_hash 
WHERE password IS NULL AND password_hash IS NOT NULL;

-- For users without any password, set a placeholder
UPDATE users 
SET password = '$2b$10$placeholder.hash.for.existing.users'
WHERE password IS NULL;

-- Add index for better performance on password lookups
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password);
