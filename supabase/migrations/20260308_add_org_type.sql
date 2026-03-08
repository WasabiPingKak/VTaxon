-- Migration: Add org_type column to users table for 社團勢 classification
-- Values: 'indie' (default) | 'corporate' | 'club'

-- ===== staging schema =====
ALTER TABLE staging.users ADD COLUMN IF NOT EXISTS org_type VARCHAR(20) NOT NULL DEFAULT 'indie';

-- Backfill: existing users with organization → corporate
UPDATE staging.users SET org_type = 'corporate'
WHERE org_type = 'indie'
  AND organization IS NOT NULL
  AND organization != '';

-- ===== public schema =====
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_type VARCHAR(20) NOT NULL DEFAULT 'indie';

-- Backfill: existing users with organization → corporate
UPDATE public.users SET org_type = 'corporate'
WHERE org_type = 'indie'
  AND organization IS NOT NULL
  AND organization != '';
