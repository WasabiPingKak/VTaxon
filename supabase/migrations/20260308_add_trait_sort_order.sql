-- Add sort_order column to vtuber_traits for user-defined trait ordering
-- Backfill existing data with order based on created_at

-- staging
ALTER TABLE staging.vtuber_traits ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE staging.vtuber_traits t SET sort_order = sub.rn - 1
FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn FROM staging.vtuber_traits) sub
WHERE t.id = sub.id;
CREATE INDEX IF NOT EXISTS idx_vtuber_traits_sort_order ON staging.vtuber_traits(user_id, sort_order);

-- public (same)
ALTER TABLE public.vtuber_traits ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE public.vtuber_traits t SET sort_order = sub.rn - 1
FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn FROM public.vtuber_traits) sub
WHERE t.id = sub.id;
CREATE INDEX IF NOT EXISTS idx_vtuber_traits_sort_order ON public.vtuber_traits(user_id, sort_order);
