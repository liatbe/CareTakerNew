-- Fix: Remove unique constraint on family_id to allow multiple users per family
-- Run this SQL in Supabase SQL Editor

-- Drop the unique constraint on family_id
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_family_id_key;

-- Create a regular index instead (not unique) for better query performance
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

-- Note: This allows multiple users to have the same family_id, which is correct
-- since all users in a family should share the same family_id

