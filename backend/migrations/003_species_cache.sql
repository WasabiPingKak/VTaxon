CREATE TABLE IF NOT EXISTS species_cache (
    taxon_id        INTEGER PRIMARY KEY,  -- GBIF usageKey
    scientific_name VARCHAR(512) NOT NULL,
    common_name_en  VARCHAR(512),
    common_name_zh  VARCHAR(512),
    taxon_rank      VARCHAR(50),
    taxon_path      VARCHAR(2048),  -- Materialized Path, e.g. Animalia|Chordata|...
    kingdom         VARCHAR(255),
    phylum          VARCHAR(255),
    class           VARCHAR(255),
    order_          VARCHAR(255),
    family          VARCHAR(255),
    genus           VARCHAR(255),
    cached_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable fast prefix queries for kinship distance calculation
CREATE INDEX IF NOT EXISTS idx_taxon_path ON species_cache (taxon_path varchar_pattern_ops);
