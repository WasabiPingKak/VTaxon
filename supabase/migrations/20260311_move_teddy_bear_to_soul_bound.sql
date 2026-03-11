-- 搬移 Teddy Bear 從「機械生命」到「附魂體」
-- 泰迪熊是填充玩偶，不屬於機械生命，歸入附魂體更合理

-- === Staging ===
UPDATE staging.fictional_species
SET sub_origin = '附魂體',
    category_path = '人造生命|附魂體|Teddy Bear'
WHERE name = 'Teddy Bear';

-- === Production ===
UPDATE public.fictional_species
SET sub_origin = '附魂體',
    category_path = '人造生命|附魂體|Teddy Bear'
WHERE name = 'Teddy Bear';
