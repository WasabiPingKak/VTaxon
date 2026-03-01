-- ============================================================
-- VTaxon 品種種子資料
-- 家犬 (taxon_id=5219174) 7 種 + 家貓 (taxon_id=2435099) 6 種
-- ============================================================

INSERT INTO breeds (taxon_id, name_en, name_zh, breed_group) VALUES
-- 家犬品種
(5219174, 'Shiba Inu',                '柴犬',       '亞洲犬'),
(5219174, 'Pembroke Welsh Corgi',     '柯基犬',     '牧羊犬'),
(5219174, 'Labrador Retriever',       '拉布拉多',   '獵犬'),
(5219174, 'Pomeranian',               '博美犬',     '玩賞犬'),
(5219174, 'Akita Inu',                '秋田犬',     '亞洲犬'),
(5219174, 'Siberian Husky',           '哈士奇',     '工作犬'),
(5219174, 'Golden Retriever',         '黃金獵犬',   '獵犬'),

-- 家貓品種
(2435099, 'British Shorthair',        '英國短毛貓', NULL),
(2435099, 'Scottish Fold',            '蘇格蘭折耳貓', NULL),
(2435099, 'Ragdoll',                  '布偶貓',     NULL),
(2435099, 'Siamese',                  '暹羅貓',     NULL),
(2435099, 'Maine Coon',               '緬因貓',     NULL),
(2435099, 'Calico',                   '三花貓',     NULL)
ON CONFLICT (taxon_id, name_en) DO NOTHING;
