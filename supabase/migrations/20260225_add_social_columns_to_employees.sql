-- Migration: Add social media columns to employees table
-- Description: Adds instagram_url, facebook_url, and tiktok_url to store professional social links.

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
