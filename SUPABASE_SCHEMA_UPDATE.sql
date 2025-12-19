-- Update users table to add role field
-- Run this SQL in Supabase SQL Editor after the initial setup

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'caretaker'));

-- Update existing users to have admin role (if any exist)
UPDATE users SET role = 'admin' WHERE role IS NULL;

-- Create index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: After running this, existing users will have 'admin' role by default
-- New registrations will create admin users, and admins can add caretaker users

