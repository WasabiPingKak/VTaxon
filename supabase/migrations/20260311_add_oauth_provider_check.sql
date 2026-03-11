-- Add CHECK constraint on oauth_accounts.provider to restrict to known providers
-- Applies to both staging and public schemas

-- Staging
ALTER TABLE staging.oauth_accounts
  ADD CONSTRAINT ck_oauth_provider CHECK (provider IN ('youtube', 'twitch'));

-- Production
ALTER TABLE public.oauth_accounts
  ADD CONSTRAINT ck_oauth_provider CHECK (provider IN ('youtube', 'twitch'));
