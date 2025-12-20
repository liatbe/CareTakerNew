-- Create family_data table for storing all app data
-- This table stores key-value pairs for each family
-- Run this in Supabase SQL Editor if the table doesn't exist

-- Create family_data table (stores all app data per family)
CREATE TABLE IF NOT EXISTS family_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_data_family_id ON family_data(family_id);
CREATE INDEX IF NOT EXISTS idx_family_data_key ON family_data(key);

-- Enable Row Level Security (RLS)
ALTER TABLE family_data ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we're using anon key)
-- In production, you should use proper authentication tokens
CREATE POLICY "Allow public read access" ON family_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON family_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON family_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON family_data
  FOR DELETE USING (true);

