-- Add live primary trait columns to users table
-- When "直播中" filter is active, each user only appears at their primary trait node
-- Real and fictional species each have their own primary

-- staging
ALTER TABLE staging.users ADD COLUMN IF NOT EXISTS live_primary_real_trait_id UUID REFERENCES staging.vtuber_traits(id) ON DELETE SET NULL;
ALTER TABLE staging.users ADD COLUMN IF NOT EXISTS live_primary_fictional_trait_id UUID REFERENCES staging.vtuber_traits(id) ON DELETE SET NULL;

-- production
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS live_primary_real_trait_id UUID REFERENCES public.vtuber_traits(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS live_primary_fictional_trait_id UUID REFERENCES public.vtuber_traits(id) ON DELETE SET NULL;
