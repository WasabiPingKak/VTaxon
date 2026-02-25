CREATE TABLE IF NOT EXISTS vtuber_traits (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taxon_id     INTEGER NOT NULL REFERENCES species_cache(taxon_id),
    display_name VARCHAR(255),  -- e.g. 龍、狐狸
    trait_note   TEXT,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT uq_user_taxon UNIQUE (user_id, taxon_id)
);

-- Index for querying traits by vtuber
CREATE INDEX IF NOT EXISTS idx_traits_user  ON vtuber_traits (user_id);

-- Index for querying all vtubers sharing the same species
CREATE INDEX IF NOT EXISTS idx_traits_taxon ON vtuber_traits (taxon_id);
