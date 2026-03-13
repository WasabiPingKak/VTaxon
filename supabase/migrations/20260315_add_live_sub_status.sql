-- Add live subscription status tracking to oauth_accounts
-- Tracks whether Twitch EventSub / YouTube WebSub subscription succeeded or failed

-- staging
ALTER TABLE staging.oauth_accounts ADD COLUMN IF NOT EXISTS live_sub_status TEXT;
ALTER TABLE staging.oauth_accounts ADD COLUMN IF NOT EXISTS live_sub_at TIMESTAMPTZ;

-- production
ALTER TABLE public.oauth_accounts ADD COLUMN IF NOT EXISTS live_sub_status TEXT;
ALTER TABLE public.oauth_accounts ADD COLUMN IF NOT EXISTS live_sub_at TIMESTAMPTZ;
