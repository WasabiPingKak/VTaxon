-- 1. taxon_id 改為 nullable（原本是 NOT NULL）
ALTER TABLE vtuber_traits ALTER COLUMN taxon_id DROP NOT NULL;

-- 2. 新增 fictional_species_id 欄位
ALTER TABLE vtuber_traits
    ADD COLUMN fictional_species_id INTEGER REFERENCES fictional_species(id);

-- 3. 確保至少填一個（現實或奇幻）
ALTER TABLE vtuber_traits
    ADD CONSTRAINT chk_species_type
    CHECK (taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL);

-- 4. 移除舊的 unique constraint，改用 partial unique index
ALTER TABLE vtuber_traits DROP CONSTRAINT IF EXISTS uq_user_taxon;

CREATE UNIQUE INDEX uq_user_real_taxon
    ON vtuber_traits (user_id, taxon_id)
    WHERE taxon_id IS NOT NULL;

CREATE UNIQUE INDEX uq_user_fictional
    ON vtuber_traits (user_id, fictional_species_id)
    WHERE fictional_species_id IS NOT NULL;

-- 5. 新增索引
CREATE INDEX IF NOT EXISTS idx_traits_fictional
    ON vtuber_traits (fictional_species_id);
