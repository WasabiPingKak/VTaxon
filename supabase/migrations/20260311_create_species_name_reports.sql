-- Species name reports (Chinese name missing/wrong)
-- Applies to both staging and public schemas

-- staging
CREATE TABLE IF NOT EXISTS staging.species_name_reports (
    id          SERIAL PRIMARY KEY,
    user_id     UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    taxon_id    INTEGER REFERENCES staging.species_cache(taxon_id),
    report_type TEXT NOT NULL,            -- 'missing_zh' | 'wrong_zh'
    current_name_zh   TEXT,
    suggested_name_zh TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    admin_note  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staging_snr_status
    ON staging.species_name_reports(status);

-- public
CREATE TABLE IF NOT EXISTS public.species_name_reports (
    id          SERIAL PRIMARY KEY,
    user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    taxon_id    INTEGER REFERENCES public.species_cache(taxon_id),
    report_type TEXT NOT NULL,            -- 'missing_zh' | 'wrong_zh'
    current_name_zh   TEXT,
    suggested_name_zh TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    admin_note  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_snr_status
    ON public.species_name_reports(status);
