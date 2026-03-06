-- Add alternative_names_zh column to species_cache
-- 用於儲存俗名／別名（逗號分隔，如「綿羊」）

-- Production (public schema)
ALTER TABLE public.species_cache
    ADD COLUMN IF NOT EXISTS alternative_names_zh TEXT;

-- Staging schema
ALTER TABLE staging.species_cache
    ADD COLUMN IF NOT EXISTS alternative_names_zh TEXT;
