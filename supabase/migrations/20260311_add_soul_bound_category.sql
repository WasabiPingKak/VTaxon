-- 新增「附魂體」子分類：搬移 Doll + 新增 Cursed Doll
-- Related: fictional_species_requests #35

-- === Staging ===
-- 搬移 Doll
UPDATE staging.fictional_species
SET sub_origin = '附魂體',
    category_path = '人造生命|附魂體|Doll'
WHERE name = 'Doll';

-- 新增 Cursed Doll
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Cursed Doll', '詛咒娃娃', '人造生命', '附魂體', '人造生命|附魂體|Cursed Doll', '靈魂因詛咒而寄宿於娃娃中的存在')
ON CONFLICT(name) DO NOTHING;

-- === Production ===
-- 搬移 Doll
UPDATE public.fictional_species
SET sub_origin = '附魂體',
    category_path = '人造生命|附魂體|Doll'
WHERE name = 'Doll';

-- 新增 Cursed Doll
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Cursed Doll', '詛咒娃娃', '人造生命', '附魂體', '人造生命|附魂體|Cursed Doll', '靈魂因詛咒而寄宿於娃娃中的存在')
ON CONFLICT(name) DO NOTHING;
