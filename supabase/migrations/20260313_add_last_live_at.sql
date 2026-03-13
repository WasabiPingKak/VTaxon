-- staging
ALTER TABLE staging.users ADD COLUMN IF NOT EXISTS last_live_at TIMESTAMPTZ;
-- production
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_live_at TIMESTAMPTZ;
