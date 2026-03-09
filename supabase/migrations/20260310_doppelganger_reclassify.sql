-- 偽人(Doppelgänger) 分類修正：補上 Type 層，歸入魔物
-- 使用 name_zh 匹配（name 欄位有 Unicode ä 編碼差異，WHERE name= 可能不匹配）

-- PUBLIC (id=721)
UPDATE public.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|' || name
WHERE name_zh = '偽人'
  AND category_path NOT LIKE '%魔物%';

-- STAGING (id=600)
UPDATE staging.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|' || name
WHERE name_zh = '偽人'
  AND category_path NOT LIKE '%魔物%';
