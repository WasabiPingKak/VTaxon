-- 偽人(Doppelgänger) 分類修正：補上 Type 層，歸入魔物

-- PUBLIC
UPDATE public.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|Doppelgänger'
WHERE name = 'Doppelgänger';

-- STAGING
UPDATE staging.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|Doppelgänger'
WHERE name = 'Doppelgänger';
