# Supabase Setup Guide

This guide will help you set up Supabase backend storage so your CareTaker app data can be accessed across different devices and browsers.

## Step 1: Create a Supabase Account

1. Go to https://supabase.com
2. Click "Start your project" (it's free!)
3. Sign up with GitHub, Google, or email
4. Create a new project:
   - **Name**: CareTaker (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (gear) in the left sidebar
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

Copy both of these - you'll need them in Step 4.

## Step 3: Create Database Tables

1. In your Supabase dashboard, click on **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy and paste this SQL code:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  family_id TEXT UNIQUE NOT NULL,
  contract_start_date DATE,
  monthly_base_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_data ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since we're using anon key)
-- In production, you should use proper authentication tokens
CREATE POLICY "Allow public read access" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON family_data
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON family_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON family_data
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON family_data
  FOR DELETE USING (true);
```

4. Click **Run** (or press Ctrl+Enter)
5. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

1. In your project root, create a file named `.env.local` (if it doesn't exist)
2. Add these lines (replace with your actual values from Step 2):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Important**: Make sure `.env.local` is in your `.gitignore` file (it should be by default)

## Step 5: Update Your Code

The code has already been updated to use the API! You just need to:

1. Make sure you've added the environment variables (Step 4)
2. Restart your development server:
   ```bash
   npm run dev
   ```

## Step 6: Test It

1. Open your app in the browser
2. Open Developer Tools (F12) → Console tab
3. You should see storage operations logged
4. Try registering a new user or saving some data
5. Check the Supabase dashboard → **Table Editor** → `family_data` to see your data!

## Step 7: Deploy to Vercel

When deploying to Vercel, you need to add the environment variables:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Save**
5. Redeploy your site

## Troubleshooting

### "API error: 401" or "Unauthorized"
- Check that your environment variables are set correctly
- Make sure you copied the full anon key (it's very long)
- Restart your dev server after adding env variables

### "Table doesn't exist"
- Make sure you ran the SQL script in Step 3
- Check the SQL Editor for any errors

### Data not syncing
- Check browser console for errors
- Verify environment variables are set
- The app will fall back to localStorage if the API fails, so it should still work

### Still using localStorage?
- If you don't set the environment variables, the app will automatically use localStorage (backward compatible)
- This is fine for testing, but data won't sync across devices

## Security Note

⚠️ **Important**: The current setup uses public access policies for simplicity. For production use, you should:

1. Implement proper authentication with Supabase Auth
2. Use Row Level Security (RLS) policies based on user tokens
3. Hash passwords before storing (currently stored in plain text for simplicity)

The current setup is fine for personal/family use, but not recommended for public-facing applications.

## Next Steps

Once everything is working:
- Your data will automatically sync to Supabase
- You can access your data from any device/browser
- Data persists even if you clear browser cache
- You can view/edit data directly in Supabase dashboard if needed

