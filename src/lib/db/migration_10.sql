-- KlinikAid Migration 10: Data Privacy Agreement Consent
-- Target DB: Supabase Postgres

-- Add accepted_privacy_at column to public.profiles table if it does not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamp with time zone NULL;
