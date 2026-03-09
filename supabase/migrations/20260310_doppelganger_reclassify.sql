-- 偽人(Doppelgänger) 分類修正：補上 Type 層，歸入魔物
-- 使用 name_zh 匹配避免 Unicode ä 編碼差異（單字元 vs 組合字元）
-- category_path 必須是 4 段（origin|sub_origin|type|name）前端才能正確分組

-- PUBLIC
UPDATE public.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|' || name
WHERE name_zh = '偽人';

-- STAGING
UPDATE staging.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|' || name
WHERE name_zh = '偽人';
