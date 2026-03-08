-- 花枝鼠 Rattus norvegicus (taxon_id=2439261) — species_cache + 8 品種
-- Production (public schema) + Staging (staging schema)

-- ============================================================
-- Production (public)
-- ============================================================
INSERT INTO public.species_cache (taxon_id, scientific_name, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus)
VALUES (2439261, 'Rattus norvegicus', '褐家鼠', 'SPECIES',
  'Animalia|Chordata|Mammalia|Rodentia|Muridae|Rattus|Rattus norvegicus',
  'Animalia', 'Chordata', 'Mammalia', 'Rodentia', 'Muridae', 'Rattus')
ON CONFLICT (taxon_id) DO NOTHING;

INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Fancy Rat', '花枝鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Standard', '標準型', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Dumbo', '飛耳鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Rex', '捲毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Hairless', '無毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Satin', '緞毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Tailless', '無尾鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO public.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Bristle Coat', '鋼毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;

-- ============================================================
-- Staging (staging)
-- ============================================================
INSERT INTO staging.species_cache (taxon_id, scientific_name, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus)
VALUES (2439261, 'Rattus norvegicus', '褐家鼠', 'SPECIES',
  'Animalia|Chordata|Mammalia|Rodentia|Muridae|Rattus|Rattus norvegicus',
  'Animalia', 'Chordata', 'Mammalia', 'Rodentia', 'Muridae', 'Rattus')
ON CONFLICT (taxon_id) DO NOTHING;

INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Fancy Rat', '花枝鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Standard', '標準型', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Dumbo', '飛耳鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Rex', '捲毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Hairless', '無毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Satin', '緞毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Tailless', '無尾鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
INSERT INTO staging.breeds (taxon_id, name_en, name_zh, source) VALUES (2439261, 'Bristle Coat', '鋼毛鼠', 'manual')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET name_zh = EXCLUDED.name_zh, source = EXCLUDED.source;
