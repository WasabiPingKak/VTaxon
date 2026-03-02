-- Add bio (self-introduction) column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
