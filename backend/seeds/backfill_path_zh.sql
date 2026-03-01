-- ============================================================
-- Backfill path_zh for existing species_cache rows
-- Run once after adding the path_zh column:
--   ALTER TABLE species_cache ADD COLUMN path_zh JSONB DEFAULT '{}'::jsonb;
--
-- This covers common taxonomy from the static table.
-- Remaining entries will be filled by _cache_species() on next access.
-- ============================================================

-- Helper: build path_zh from known Chinese names
-- Mammals (Carnivora)
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '動物界', 'phylum', '脊索動物門', 'class', '哺乳綱',
    'order', '食肉目', 'family',
    CASE family
        WHEN 'Canidae' THEN '犬科'
        WHEN 'Felidae' THEN '貓科'
        WHEN 'Ursidae' THEN '熊科'
        WHEN 'Mustelidae' THEN '鼬科'
        WHEN 'Procyonidae' THEN '浣熊科'
        WHEN 'Herpestidae' THEN '獴科'
        WHEN 'Viverridae' THEN '靈貓科'
        WHEN 'Hyaenidae' THEN '鬣狗科'
        ELSE family
    END,
    'genus',
    CASE genus
        WHEN 'Canis' THEN '犬屬'
        WHEN 'Vulpes' THEN '狐屬'
        WHEN 'Felis' THEN '貓屬'
        WHEN 'Panthera' THEN '豹屬'
        WHEN 'Lynx' THEN '猞猁屬'
        WHEN 'Puma' THEN '美洲獅屬'
        WHEN 'Acinonyx' THEN '獵豹屬'
        WHEN 'Ursus' THEN '熊屬'
        WHEN 'Ailuropoda' THEN '大貓熊屬'
        ELSE NULL
    END
)
WHERE order_ = 'Carnivora' AND kingdom = 'Animalia'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Mammals (non-Carnivora common orders)
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '動物界', 'phylum', '脊索動物門', 'class', '哺乳綱',
    'order',
    CASE order_
        WHEN 'Primates' THEN '靈長目'
        WHEN 'Rodentia' THEN '齧齒目'
        WHEN 'Chiroptera' THEN '翼手目'
        WHEN 'Artiodactyla' THEN '偶蹄目'
        WHEN 'Perissodactyla' THEN '奇蹄目'
        WHEN 'Cetacea' THEN '鯨目'
        WHEN 'Proboscidea' THEN '長鼻目'
        WHEN 'Lagomorpha' THEN '兔形目'
        WHEN 'Diprotodontia' THEN '雙門齒目'
        ELSE order_
    END,
    'family', family,
    'genus', NULL
)
WHERE class = 'Mammalia' AND order_ != 'Carnivora' AND kingdom = 'Animalia'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Birds (Aves)
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '動物界', 'phylum', '脊索動物門', 'class', '鳥綱',
    'order',
    CASE order_
        WHEN 'Passeriformes' THEN '雀形目'
        WHEN 'Galliformes' THEN '雞形目'
        WHEN 'Psittaciformes' THEN '鸚形目'
        WHEN 'Strigiformes' THEN '鴞形目'
        WHEN 'Sphenisciformes' THEN '企鵝目'
        WHEN 'Falconiformes' THEN '隼形目'
        WHEN 'Accipitriformes' THEN '鷹形目'
        WHEN 'Anseriformes' THEN '雁形目'
        WHEN 'Columbiformes' THEN '鴿形目'
        ELSE order_
    END,
    'family',
    CASE family
        WHEN 'Corvidae' THEN '鴉科'
        WHEN 'Phasianidae' THEN '雉科'
        WHEN 'Psittacidae' THEN '鸚鵡科'
        WHEN 'Strigidae' THEN '鴟鴞科'
        WHEN 'Spheniscidae' THEN '企鵝科'
        WHEN 'Accipitridae' THEN '鷹科'
        ELSE family
    END,
    'genus', NULL
)
WHERE class = 'Aves' AND kingdom = 'Animalia'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Reptilia
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '動物界', 'phylum', '脊索動物門', 'class', '爬蟲綱',
    'order',
    CASE order_
        WHEN 'Squamata' THEN '有鱗目'
        WHEN 'Testudines' THEN '龜鱉目'
        WHEN 'Crocodylia' THEN '鱷目'
        ELSE order_
    END,
    'family', family,
    'genus', NULL
)
WHERE class = 'Reptilia' AND kingdom = 'Animalia'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Insecta
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '動物界', 'phylum', '節肢動物門', 'class', '昆蟲綱',
    'order',
    CASE order_
        WHEN 'Hymenoptera' THEN '膜翅目'
        WHEN 'Lepidoptera' THEN '鱗翅目'
        WHEN 'Coleoptera' THEN '鞘翅目'
        WHEN 'Diptera' THEN '雙翅目'
        WHEN 'Hemiptera' THEN '半翅目'
        WHEN 'Odonata' THEN '蜻蛉目'
        ELSE order_
    END,
    'family', family,
    'genus', NULL
)
WHERE class = 'Insecta' AND kingdom = 'Animalia'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Plantae
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom', '植物界', 'phylum', '維管束植物門', 'class', '木蘭綱',
    'order',
    CASE order_
        WHEN 'Rosales' THEN '薔薇目'
        WHEN 'Sapindales' THEN '無患子目'
        WHEN 'Asterales' THEN '菊目'
        WHEN 'Fabales' THEN '豆目'
        WHEN 'Lamiales' THEN '唇形目'
        WHEN 'Poales' THEN '禾本目'
        ELSE order_
    END,
    'family',
    CASE family
        WHEN 'Rosaceae' THEN '薔薇科'
        WHEN 'Rutaceae' THEN '芸香科'
        WHEN 'Asteraceae' THEN '菊科'
        WHEN 'Fabaceae' THEN '豆科'
        ELSE family
    END,
    'genus', NULL
)
WHERE kingdom = 'Plantae'
  AND (path_zh IS NULL OR path_zh = '{}'::jsonb);

-- Catch-all: set empty path_zh to at least have kingdom
UPDATE species_cache SET path_zh = jsonb_build_object(
    'kingdom',
    CASE kingdom
        WHEN 'Animalia' THEN '動物界'
        WHEN 'Plantae' THEN '植物界'
        WHEN 'Fungi' THEN '真菌界'
        ELSE kingdom
    END
)
WHERE path_zh IS NULL OR path_zh = '{}'::jsonb;
