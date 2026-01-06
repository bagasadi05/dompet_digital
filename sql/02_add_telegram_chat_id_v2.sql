-- Migration: Add telegram_chat_id to user_profiles (V2 - Safe Mode)
-- Run this in your Supabase SQL Editor

-- 1. Add column explicitly if table exists but column doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'telegram_chat_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN telegram_chat_id TEXT;
    END IF;
END $$;

-- 2. Create index for faster lookup by telegram_chat_id (for the Edge Function)
CREATE INDEX IF NOT EXISTS idx_user_profiles_telegram_chat_id ON public.user_profiles(telegram_chat_id);

-- Note: Policies are assumed to exist from previous setup. If you need to verify, the table should have RLS enabled.
-- You can check this by running:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';
