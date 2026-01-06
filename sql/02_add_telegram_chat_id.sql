-- Migration: Add telegram_chat_id to user_profiles
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table if it doesn't exist (safety check from guide)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  fcm_token TEXT,
  telegram_chat_id TEXT, -- New column
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add column explicitly if table exists but column doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'telegram_chat_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN telegram_chat_id TEXT;
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Ensure these exist)
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = user_id);

create policy "Users can insert own profile" on user_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = user_id);

-- 5. Create index for faster lookup by telegram_chat_id (for the Edge Function)
CREATE INDEX IF NOT EXISTS idx_user_profiles_telegram_chat_id ON public.user_profiles(telegram_chat_id);
