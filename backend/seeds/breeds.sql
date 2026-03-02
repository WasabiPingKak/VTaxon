-- ============================================================
-- VTaxon 品種種子資料（由 scripts/fetch_breeds_wikidata.py 自動生成）
-- 中文名優先順序：Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh
-- ============================================================

-- 前置：確保母物種存在於 species_cache
INSERT INTO species_cache (taxon_id, scientific_name, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus) VALUES (5219174, 'Canis lupus familiaris', '家犬', 'SUBSPECIES', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus', 'Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Canis')
ON CONFLICT (taxon_id) DO NOTHING;
INSERT INTO species_cache (taxon_id, scientific_name, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus) VALUES (2435099, 'Felis catus', '家貓', 'SPECIES', 'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus', 'Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Felidae', 'Felis')
ON CONFLICT (taxon_id) DO NOTHING;
INSERT INTO species_cache (taxon_id, scientific_name, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus) VALUES (2440886, 'Equus caballus Linnaeus, 1758', '家馬', 'SPECIES', 'Animalia|Chordata|Mammalia|Perissodactyla|Equidae|Equus|Equus caballus', 'Animalia', 'Chordata', 'Mammalia', 'Perissodactyla', 'Equidae', 'Equus')
ON CONFLICT (taxon_id) DO NOTHING;

-- 家犬 (taxon_id=5219174): 915 品種, 329 有中文名
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Abruzzo-Maremma Sheepdog', '馬雷馬－阿布魯佐牧羊犬', 'Q21074', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Abyssinian Sand Terrier', NULL, 'Q1806071', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Adirondack Pointing Dog', NULL, 'Q11849763', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Affenpinscher', '猴面犬', 'Q7254', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Afghan Hound', '阿富汗獵狗', 'Q21080', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Afghan Spaniel', NULL, 'Q124567732', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Afghan mastiff', NULL, 'Q516648', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'African village dog', '非洲村犬', 'Q13548384', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Africanis', NULL, 'Q516079', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Agassaei', NULL, 'Q136174423', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Agassin', NULL, 'Q390751', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Aidi', NULL, 'Q37904', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Airedale Terrier', '艾爾谷㹴', 'Q37617', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Akbash', '阿克巴什犬', 'Q38175', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Akita', '秋田犬', 'Q29164', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Aksaray Malaklisi dog', NULL, 'Q16245559', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alano', NULL, 'Q15782013', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alano Español', NULL, 'Q37690', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alapaha Blue Blood Bulldog', '阿拉帕哈藍血鬥牛犬', 'Q37489', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alaskan Klee Kai', NULL, 'Q38152', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alaskan Malamute', '阿拉斯加雪橇犬', 'Q21206', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Albanian Mountain Dog', NULL, 'Q124567696', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Albanian Wolfdog', NULL, 'Q17192231', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alicant Dog', NULL, 'Q124567733', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alopekis', NULL, 'Q3635150', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Alpine Dachsbracke', '阿爾卑斯達克斯布拉克犬', 'Q37498', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ameri-Indian Alaskan Husky', NULL, 'Q22058498', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Akita', NULL, 'Q37534', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Alsatian', NULL, 'Q38145', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Blue Gascon Hound', NULL, 'Q15263587', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Bulldog', '美國鬥牛犬', 'Q37604', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Bully', '美國惡霸犬', 'Q5570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Cocker Spaniel', '美國可卡犬', 'Q38063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American English Coonhound', NULL, 'Q37578', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Eskimo Dog', '美國愛斯基摩犬', 'Q37699', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Hairless Terrier', '美國無毛㹴', 'Q37508', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Leopard Hound', NULL, 'Q465537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Mastiff', NULL, 'Q38192', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Pit Bull Terrier', '美國比特鬥牛㹴', 'Q37612', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Squirrel Dog', NULL, 'Q20379394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Staffordshire Terrier', '美國斯塔福郡㹴', 'Q37688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Staghound', '美國獵鹿犬', 'Q37473', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Water Spaniel', '美國水獵犬', 'Q37856', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Wolfdog', NULL, 'Q56325548', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American Working Red', NULL, 'Q60691679', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'American foxhound', '美國獵狐犬', 'Q37514', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Anatolian Greyhound', NULL, 'Q25477063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Anatolian Shepherd', NULL, 'Q37541', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Andalusian Hound', '安達盧西亞波登科犬', 'Q39262', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Anglo-Russian Hound', NULL, 'Q10411807', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Anglo-Spanish Greyhound', NULL, 'Q17192490', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Antebellum Bulldog', NULL, 'Q38134', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Appalachian Sighthound', NULL, 'Q124567743', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Appenzeller Sennenhund', '阿彭策爾山犬', 'Q37697', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Argentine Pila Dog', NULL, 'Q3092983', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Argentine Polar Dog', NULL, 'Q9058633', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ariege Pointer', '阿列日指示犬', 'Q37664', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ariégeois', NULL, 'Q37487', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Armant dog', NULL, 'Q37872', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Armenian Gampr dog', NULL, 'Q38219', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Artois Hound', NULL, 'Q37758', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Assyrian Mastiff', NULL, 'Q113570342', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Aurora Husky', NULL, 'Q11293746', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Aussiedoodle', NULL, 'Q108123375', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australasian Bosdog', NULL, 'Q38455', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Barb', NULL, 'Q11293235', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Cattle Dog', '澳洲牧牛犬', 'Q37595', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Cobberdog', NULL, 'Q65229742', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Kelpie', '澳洲凱皮犬', 'Q37520', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Shepherd', '澳洲牧羊犬', 'Q37629', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Silky Terrier', '澳洲絲毛㹴', 'Q37524', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Staghound', NULL, 'Q11853557', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Stumpy Tail Cattle Dog', '澳洲短尾牧牛犬', 'Q37503', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian Terrier', '澳大利亞㹴', 'Q37530', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Australian stock dog', NULL, 'Q12208606', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Austrian Black and Tan Hound', NULL, 'Q11385', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Austrian Pinscher', '奧地利平雪犬', 'Q38426', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Auvergne Shepherd', NULL, 'Q28495327', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Awa Ken', NULL, 'Q11657560', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Azawakh', '阿扎瓦克犬', 'Q37859', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Azores Cattle Dog', '亞述爾群島牧牛犬', 'Q37730', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Baganda Dog', NULL, 'Q11327564', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bajan Toy Terrier', NULL, 'Q11336781', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bakharwal Dog', NULL, 'Q37653', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bakhmull', NULL, 'Q1770291', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Balla Terrier', NULL, 'Q124567760', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bangara Mastiff', NULL, 'Q124567715', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Barak hound', NULL, 'Q37692', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Barbado da Terceira', NULL, 'Q168788', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Barbet', '巴貝犬', 'Q37585', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Barrocal Algarvio', NULL, 'Q9649372', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Basati alaunt', NULL, 'Q121384636', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Basenji', '巴仙吉犬', 'Q37871', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Basque Shepherd Dog', NULL, 'Q38653', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Basset Artésien Normand', NULL, 'Q37561', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Basset Bleu de Gascogne', NULL, 'Q37552', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Batak Dog', NULL, 'Q11327736', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bavarian Mountain Hound', NULL, 'Q37576', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Beagle-Harrier', NULL, 'Q37478', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Beaglier', NULL, 'Q16975130', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bearded Collie', '古代長鬚牧羊犬', 'Q37619', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Beauceron', '博斯牧羊犬', 'Q37720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bedlington Terrier', '貝林登㹴', 'Q37582', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Belgian Griffons', NULL, 'Q11337107', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Belgian Malinois', '比利時瑪連萊犬', 'Q38494', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Belgian Mastiff', NULL, 'Q1072469', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Belgian Pointer', NULL, 'Q898953', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Belgian Shepherd', '比利時牧羊犬', 'Q37624', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bergamasco Shepherd', NULL, 'Q38238', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Berger de Crau', NULL, 'Q10428393', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Berner Laufhund', NULL, 'Q38773', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bernese Mountain Dog', '伯恩山犬', 'Q37608', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bernese hound', NULL, 'Q37491', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Beskydský bundáš', NULL, 'Q11139299', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bichon Frisé', '比熊犬', 'Q37600', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bichon Yorkie', NULL, 'Q11330541', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Biewer Terrier', '比沃爾㹴犬', 'Q37575', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Billy', NULL, 'Q37637', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bisben', NULL, 'Q37546', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bisharin Greyhound', NULL, 'Q11330537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Mouth Cur', '黑口柯犬', 'Q38556', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Norwegian Elkhound', NULL, 'Q38961', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Pointer', NULL, 'Q11334594', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Russian Terrier', '俄羅斯黑㹴', 'Q38634', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Slovakian Shepherd', NULL, 'Q38520', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black Spitz', NULL, 'Q136400684', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black and Tan Coonhound', '黑褐獵浣熊犬', 'Q37537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black and Tan Terrier', NULL, 'Q1800312', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Black and Tan Virginia Foxhound', NULL, 'Q38353', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Blue Gascony Griffon', NULL, 'Q37991', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Blue Lacy', '藍雷西犬', 'Q37579', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Blue Picardy Spaniel', '藍色皮卡第獵犬', 'Q37798', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bluetick Coonhound', NULL, 'Q37568', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boerboel', NULL, 'Q37589', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boerenfox terrier', NULL, 'Q2446076', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bohemian Shepherd', NULL, 'Q37746', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bohemian Spotted Dog', NULL, 'Q3270663', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bolognese', '博洛尼亞比熊犬', 'Q37566', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bolonka Franzuska', NULL, 'Q891548', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bone-mouth', '中國沙皮犬', 'Q14766993', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Borador', NULL, 'Q2910591', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Border Terrier', '邊境㹴', 'Q37558', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Borneo dog', NULL, 'Q11854538', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Borzoi', '俄羅斯獵狼犬', 'Q37866', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boston Terrier', '波士頓㹴', 'Q37550', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bouvier des Ardennes', '阿登牧牛犬', 'Q37741', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bouvier des Flandres', '法蘭德斯牧牛犬', 'Q37896', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boxador', NULL, 'Q5732926', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boxer', '拳師犬', 'Q38496', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Boykin Spaniel', NULL, 'Q37848', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bracco Italiano', '義大利布拉科犬', 'Q38255', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Branchiero siciliano', NULL, 'Q56325365', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque Charles X', NULL, 'Q11307797', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque Français', NULL, 'Q37728', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque Saint-Germain', NULL, 'Q37657', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque d''Auvergne', NULL, 'Q37727', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque du Bourbonnais', NULL, 'Q37632', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Braque du Puy', NULL, 'Q37656', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Brazilian Bull-mastiff', NULL, 'Q18464858', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Brazilian Terrier', '巴西㹴', 'Q38621', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Briard', '伯瑞犬', 'Q37821', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Briquet Griffon Vendéen', NULL, 'Q37645', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Briquet de Provence', NULL, 'Q15789896', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Brittany', '布列塔尼獵犬', 'Q38156', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Brittany Spaniel', NULL, 'Q11334726', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Broholmer', '丹麥布羅荷馬獒', 'Q37737', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bruno Jura Hound', NULL, 'Q38038', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Buckhound', NULL, 'Q107303989', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bucovina Shepherd Dog', NULL, 'Q37917', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bulgae', '火狗 (妖怪)', 'Q12599182', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bulgarian Hound', NULL, 'Q2503464', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bulgarian Scenthound', NULL, 'Q3621454', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bulgarian Shepherd Dog', NULL, 'Q59617570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bull Arab', '牛阿拉伯犬', 'Q1106478', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bull Boxer', NULL, 'Q11334880', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bull Terrier', '牛頭㹴', 'Q38322', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bull and Terrier', '鬥牛梗混種犬', 'Q38510', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bullbras', NULL, 'Q57305587', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bulldog', '英國鬥牛犬', 'Q38383', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bullmastiff', '英國鬥牛獒', 'Q38080', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bullnese', NULL, 'Q11334853', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bully Kutta', NULL, 'Q37680', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Burgos Retriever', NULL, 'Q38199', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Burmese Spitz Dog', NULL, 'Q135442535', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Buryat-Mongolian Wolfhound', '蒙古獒', 'Q3343819', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Bắc Hà dog', '北河犬', 'Q113640408', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ca Mè Mallorquí', NULL, 'Q59537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ca de Conills', '梅諾卡獵兔犬', 'Q44116', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cairn Terrier', '凱恩㹴', 'Q37888', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Calupoh', NULL, 'Q57257840', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Camas Cur', NULL, 'Q11294751', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Campeiro Bulldog', NULL, 'Q38509', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Camus cur', NULL, 'Q124567702', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Can de Chira', NULL, 'Q3574099', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Can de Palleiro', NULL, 'Q3322296', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Canaan Dog', '迦南犬', 'Q38602', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Canadian Eskimo Dog', '加拿大愛斯基摩犬', 'Q29040', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Canadian cur', NULL, 'Q124567707', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cane Corso', NULL, 'Q21082', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cane Pecoraio Varbutu', NULL, 'Q30898853', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cane Toccatore', NULL, 'Q5032220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Canis Panther', NULL, 'Q11294475', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cantabrian Water Dog', '坎塔布里亞水犬', 'Q29047', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Capheaton Terrier', NULL, 'Q20379450', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cardigan Welsh Corgi', '卡提根威爾斯柯基犬', 'Q29072', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Carea Castellano Manchego', NULL, 'Q22286992', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Carolina Dog', '卡羅萊納犬', 'Q37721', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Carolina cur', NULL, 'Q124567759', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Carpathian Shepherd Dog', NULL, 'Q1092646', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Catahoula Leopard Dog', '卡塔胡拉豹犬', 'Q11294205', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Catalan Sheepdog', NULL, 'Q29058', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Caucasian Shepherd Dog', '高加索牧羊犬', 'Q38576', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cavalier King Charles Spaniel', '查理斯王小獵犬', 'Q38072', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Celtic Hounds', NULL, 'Q3556229', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Central Asian Shepherd Dog', '中亞牧羊犬', 'Q38570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cesky Fousek', NULL, 'Q37666', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cesky Terrier', NULL, 'Q38642', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cesky Wire-haired Pointing Griffon', NULL, 'Q18456185', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chamuco', NULL, 'Q18418019', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chesapeake Bay Retriever', '切薩皮克灣尋回犬', 'Q29084', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chien Blanc du Roi', NULL, 'Q107444456', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chien Français Blanc et Noir', '法國黑白獵犬', 'Q38468', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chihuahua', '吉娃娃', 'Q653', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chilean Dogo', NULL, 'Q107337867', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chilean Fox Terrier', NULL, 'Q38563', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinese Chongqing Dog', '重慶犬', 'Q37673', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinese Crested Dog', '中國冠毛犬', 'Q37892', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinese Happa Dog', NULL, 'Q33989855', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinese Hound', NULL, 'Q124567710', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinese Imperial Dog', NULL, 'Q38560', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chinook', '奇努克犬', 'Q37722', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chippiparai', NULL, 'Q37667', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chortai', '霍爾泰獵犬', 'Q37678', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chow Chow', '鬆獅犬', 'Q29013', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chuandong Hound', NULL, 'Q60983318', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Chukotka sled dog', '楚科奇雪橇犬', 'Q38440', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cimarrón Uruguayo', NULL, 'Q37644', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Circassian Orloff Wolfhound', NULL, 'Q11306146', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cirneco dell''Etna', '埃特納獵兔犬', 'Q38262', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Clallam-Indian Dog', NULL, 'Q11299068', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Clumber Spaniel', '西班牙小獵犬', 'Q37851', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Colima Dog', NULL, 'Q11302754', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Combai', NULL, 'Q29028', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Comforter', NULL, 'Q11294788', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Common Indian Dog', NULL, 'Q11302708', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Continental Toy Spaniel', NULL, 'Q5165328', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cordoba Fighting Dog', '科多巴斗犬', 'Q38566', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Coton de Tulear', '圖利亞爾棉花犬', 'Q38295', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Creeper Terrier', NULL, 'Q124567761', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cretan Hound', '克里特獵犬', 'Q38074', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Croatian Sheepdog', NULL, 'Q38537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cur dog', NULL, 'Q124567719', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Curly Coated Retriever', '捲毛尋回犬', 'Q38375', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cursinu', NULL, 'Q37771', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cyprus Poodle', NULL, 'Q11296921', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Czechoslovakian Wolfdog', '捷克斯洛伐克狼犬', 'Q38651', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Cão de gado transmontano', NULL, 'Q326532', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Daitō Inu', NULL, 'Q11436155', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dalmatian', '大麥町', 'Q17504', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Damchi', NULL, 'Q29106', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dandie Dinmont Terrier', '丹迪丁蒙㹴', 'Q38336', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Danish Spitz', '丹麥尖嘴犬', 'Q1779696', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Danish Swedish Farmdog', '丹麥–瑞典農場犬', 'Q29127', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Decker Terrier', NULL, 'Q16354627', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Deltari ilir', NULL, 'Q130521262', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'DenMark Feist', NULL, 'Q11320864', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Denmark Feist', NULL, 'Q60792414', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Deutsche Bracke', NULL, 'Q37838', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dinka Greyhound', NULL, 'Q11320176', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dobermann', '杜賓犬', 'Q38358', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dogo Argentino', '阿根廷杜告犬', 'Q37909', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dogo Sardesco', NULL, 'Q38459', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dogo español', NULL, 'Q24702349', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dogue Brasileiro', '巴西杜哥犬', 'Q1780869', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dogue de Bordeaux', NULL, 'Q37878', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dong-gyeong', '東慶犬', 'Q12593214', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Double-nosed Andean tiger hound', NULL, 'Q4355059', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Drentse Patrijshond', NULL, 'Q37827', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Drever', NULL, 'Q37775', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dumfriesshire Hound', NULL, 'Q5313816', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dunker', NULL, 'Q37650', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dutch Shepherd', NULL, 'Q29114', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dutch Smoushond', '荷蘭斯毛斯犬', 'Q37969', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Dutch Tulip Dog', NULL, 'Q38008', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'East Siberian Laika', NULL, 'Q38416', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'East-European Shepherd', '東歐牧羊犬', 'Q38504', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ecuadorian Hairless Dog', NULL, 'Q4353907', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Egyptian Hairless Dog', NULL, 'Q11289968', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Cocker Spaniel', '英國可卡犬', 'Q38533', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Foxhound', '英國獵狐犬', 'Q37789', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Mastiff', '英國獒犬', 'Q38418', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Pointer', '指標犬', 'Q769804', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Setter', '英國雪達犬', 'Q38309', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Shepherd', NULL, 'Q37830', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Springer Spaniel', '史賓格犬', 'Q29022', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Toy Terrier', '英國玩具㹴', 'Q37782', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English Water Spaniel', '英國水犬', 'Q38550', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'English bull terrier', NULL, 'Q65328825', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Entlebucher Mountain Dog', '恩特布山犬', 'Q37986', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Erbi Txakur', NULL, 'Q12257588', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Estonian Hound', NULL, 'Q38729', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Estrela Mountain Dog', '埃斯特雷拉山犬', 'Q38096', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Eurasier', NULL, 'Q37946', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Farm collie', NULL, 'Q5435550', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Faroese Sheepdog', NULL, 'Q65044709', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fawn Brittany Basset', NULL, 'Q37570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fawn Brittany Griffon', NULL, 'Q37993', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fell Hound', NULL, 'Q11332773', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Field Spaniel', '菲爾德獵犬', 'Q29177', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Field labrador', NULL, 'Q12269704', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fila Brasileiro', '巴西菲拉犬', 'Q37808', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Finnish Hound', NULL, 'Q37840', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Finnish Lapphund', NULL, 'Q29188', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Finnish Spitz', '芬蘭狐狸犬', 'Q29195', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Flat-Coated Retriever', '平毛尋回犬', 'Q29200', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Formosan Mountain Dog', '台灣犬', 'Q29212', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fox Terrier', '狐狸㹴', 'Q39220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Français Blanc et Orange', NULL, 'Q38472', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Bulldog', '法國鬥牛犬', 'Q29149', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Charnaigre Dog', NULL, 'Q2961129', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Hound', NULL, 'Q1450712', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Pointing Dog - Pyrenean type', NULL, 'Q15284257', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Pointing Dog Gascogne Type', NULL, 'Q112086063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Spaniel', '法國獚', 'Q29160', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'French Tricolour Hound', NULL, 'Q38475', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Frenchton', NULL, 'Q108893184', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Friesian Windhund', NULL, 'Q124567749', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fu Quan', '福犬', 'Q123807528', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Fuegian dog', '雅加犬', 'Q6072879', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Galgo Español', '西班牙靈𤟥', 'Q37920', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gascon Saintongeois', '桑通日加斯科涅犬', 'Q37997', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gaucho sheepdog', NULL, 'Q4354350', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gegar', NULL, 'Q25881', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Georgian Shepherd', NULL, 'Q38691', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gerberian Shepsky', NULL, 'Q99718718', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Longhaired Pointer', NULL, 'Q37834', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Pinscher', '德國賓莎犬', 'Q37793', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Shepherd', '德國牧羊犬', 'Q38280', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Shorthaired Pointer', '德國短毛指示犬', 'Q38084', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Silky Pinscher', NULL, 'Q124567757', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Spaniel', NULL, 'Q37824', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Spitz', '德國尖嘴犬', 'Q38655', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Spitz Mittel', NULL, 'Q5408020', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'German Wirehaired Pointer', '德國硬毛指示獵犬', 'Q37811', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Giant Schnauzer', '巨型雪納瑞', 'Q38688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Glen of Imaal Terrier', '峽谷㹴', 'Q38189', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Glenwherry Collie', NULL, 'Q124567718', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Golden Retriever', '黃金獵犬', 'Q38686', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gollie', NULL, 'Q12314116', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gordon Setter', '哥頓塞特犬', 'Q38301', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gorskaja', NULL, 'Q11303705', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gos Rater Valencià', '瓦倫西亞捕鼠㹴', 'Q38206', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gos d''atura aranès', NULL, 'Q44117', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gotland Hound', NULL, 'Q4353893', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gran Mastín de Borínquen', NULL, 'Q38741', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Grand Fauve de Bretagne', NULL, 'Q96379844', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Grand Gascon Saintongeois', NULL, 'Q14309341', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Grand Griffon Vendéen', NULL, 'Q37941', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Great Anglo-French Tricolour Hound', NULL, 'Q38724', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Great Anglo-French White and Black Hound', NULL, 'Q38722', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Great Anglo-French White and Orange Hound', NULL, 'Q38734', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Great Dane', '大丹犬', 'Q5414', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Great Gascony Blue', '加斯科涅大藍犬', 'Q37769', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Greater Swiss Mountain Dog', '大瑞士山犬', 'Q38121', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Grecian Greyhound', NULL, 'Q3272034', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gredin Spaniel', NULL, 'Q11300750', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Greek Harehound', '希臘野兔獵犬', 'Q38233', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Greek Shepherd', NULL, 'Q10520346', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Greenland Dog', '格陵蘭犬', 'Q38515', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Greyster', '格雷斯特犬', 'Q11701407', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Griffon Belge', NULL, 'Q38055', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Griffon Bruxellois', '布魯塞爾格里芬犬', 'Q38889', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Griffon Nivernais', NULL, 'Q38409', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Griffon à poil laineux', NULL, 'Q38001', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Groenendael', '比利時牧羊犬', 'Q38399', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Großspitz', NULL, 'Q16639970', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Guatemalan Dogo', '瓜地馬拉杜告犬', 'Q38442', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Guicho', NULL, 'Q12390229', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gull Dong', NULL, 'Q38744', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Gull Terr', NULL, 'Q38737', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hairless Khala', NULL, 'Q1779842', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Halden Hound', NULL, 'Q37982', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hamiltonstövare', NULL, 'Q37978', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Han Dog', NULL, 'Q11327165', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hanover Hound', NULL, 'Q38041', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Harlequin Pinscher', NULL, 'Q38006', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Harrier', NULL, 'Q38107', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Havanese', '哈瓦那犬', 'Q38449', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hedehund', NULL, 'Q10519107', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hertha pointer', NULL, 'Q15815452', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Himalayan Sheepdog', '喜馬拉雅牧羊犬', 'Q38938', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hmong bobtail dog', '赫蒙族短尾犬', 'Q113714849', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hokkaido inu', '北海道犬', 'Q23853', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hovawart', NULL, 'Q38368', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hungarian sheepdog', NULL, 'Q38865', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Huntaway', NULL, 'Q38425', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Huslia Husky', NULL, 'Q124567728', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hygen Hound', NULL, 'Q38016', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Hälleforshund', NULL, 'Q4353804', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ibizan Hound', '伊比薩獵犬', 'Q37755', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Icelandic Sheepdog', NULL, 'Q38710', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Illyrian Shepherd', NULL, 'Q8413492', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Inca Dog', NULL, 'Q124567692', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Indian Husky', NULL, 'Q11325204', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Indian Spitz', '印度尖嘴犬', 'Q38921', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Indian Tailles Dog', NULL, 'Q11287637', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Inn kwe', NULL, 'Q11864916', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish Red and White Setter', '愛爾蘭紅白塞特犬', 'Q38289', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish Setter', '愛爾蘭長毛獵犬', 'Q38761', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish Staffordshire Bull Terrier', NULL, 'Q21170233', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish Terrier', '愛爾蘭㹴', 'Q38644', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish Water Spaniel', '愛爾蘭水獵犬', 'Q38162', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Irish wolfhound', '愛爾蘭獵狼犬', 'Q38668', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Istrian Coarse-haired Hound', NULL, 'Q38211', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Istrian Shorthaired Hound', NULL, 'Q38638', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Italian Greyhound', '義大利靈𤟥犬', 'Q38503', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Italian Rough-haired Segugio', NULL, 'Q39273', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Iwate Inu', NULL, 'Q11474636', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Izcuintli, itzcuintli', NULL, 'Q11286620', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jack Russell Terrier', '傑克羅素㹴犬', 'Q38287', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jagdterrier', NULL, 'Q37899', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Japanese Chin', '日本狆', 'Q38146', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Japanese Spitz', '日本狐狸犬', 'Q38126', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Japanese Terrier', '日本㹴', 'Q37976', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jeju dog', '濟州犬', 'Q492644', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jonangi', NULL, 'Q38013', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Juan Fernández Sheepdog', NULL, 'Q124567734', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jämthund', NULL, 'Q38105', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Jōmon Dog', '繩文犬', 'Q11608113', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kai Ken', '甲斐犬', 'Q38223', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kanawar Dog', NULL, 'Q124567727', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kangal Shepherd Dog', '坎高牧羊犬', 'Q38508', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kanni', NULL, 'Q38958', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Karakachan Dog', '卡拉卡恰犬', 'Q38452', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Karaman', NULL, 'Q12908317', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Karelian Bear Dog', '卡累利阿熊犬', 'Q37950', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Karelo-Finnish Laika', NULL, 'Q2642504', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kars dog', NULL, 'Q101002797', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Karst Shepherd', NULL, 'Q37954', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kattai dog', NULL, 'Q135329578', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kawakami Ken', NULL, 'Q11477572', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kazakh tazy', NULL, 'Q38092', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Keeshond', '荷蘭卷尾獅毛狗', 'Q38843', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kemmer stock cur', NULL, 'Q124567703', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kentucky Shell Heap Dog', NULL, 'Q11301287', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kerry Beagle', NULL, 'Q37974', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kerry Blue Terrier', '凱利藍㹴', 'Q38025', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'King Charles Spaniel', '查理士王小獵犬', 'Q38132', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'King Shepherd', NULL, 'Q38899', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kintamani', '金塔馬尼犬', 'Q1742290', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kishu', '紀州犬', 'Q38342', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kitler', NULL, 'Q25746', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Klamath-Indian Dog', NULL, 'Q11299059', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kleinspitz', NULL, 'Q38784', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Komondor', '可蒙犬', 'Q38675', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kooikerhondje', '科克爾犬', 'Q38716', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Koolie', NULL, 'Q38951', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Korean Jindo Dog', '珍島犬', 'Q29170', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Korean Mastiff', NULL, 'Q38924', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Koshi', NULL, 'Q11636366', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Koshikiyama Inu', NULL, 'Q11574216', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Koyun dog', NULL, 'Q18343866', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kromfohrländer', NULL, 'Q38403', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kumiş', NULL, 'Q6979096', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kunma Dog', '昆馬犬', 'Q135885052', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kunming wolfdog', '昆明犬', 'Q38948', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kurdish Mastiff', NULL, 'Q54869543', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kurdistan Greyhound', NULL, 'Q124567746', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Kuvasz', '庫瓦茲犬', 'Q38467', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Königsberger Paukenhund', NULL, 'Q1796295', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Labrador Retriever', '拉布拉多犬', 'Q38726', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Labrit', NULL, 'Q11874326', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Laconian', NULL, 'Q130313860', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Laconian Hound', NULL, 'Q124567769', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Laekenois', NULL, 'Q37815', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lagotto Romagnolo', '羅馬涅水獵犬', 'Q38910', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Laizhou Red Dog', '萊州紅犬', 'Q123030292', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lakeland Foxhound', NULL, 'Q104623400', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lakeland Terrier', '萊克蘭㹴犬', 'Q38110', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lancashire Heeler', NULL, 'Q37972', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Landseer', '蘭德希爾犬', 'Q38950', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Laobé', NULL, 'Q3217682', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lapponian Herder', NULL, 'Q38362', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lapponian Shepherd', NULL, 'Q18345166', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Large Münsterländer', NULL, 'Q38777', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Large Vendeen Griffon Basset', NULL, 'Q38000', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Latvian Hound', NULL, 'Q11347155', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Leavitt Bulldog', NULL, 'Q15444134', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Leonberger', NULL, 'Q38487', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Leopard Tree Dog', NULL, 'Q38032', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lessinia and Lagorai Shepherd', NULL, 'Q30896831', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Levesque', NULL, 'Q1821832', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Levriero meridionale', NULL, 'Q6535835', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lhasa Apso', '拉薩犬', 'Q38352', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Liangshan Dog', '涼山犬', 'Q111913522', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Limer', NULL, 'Q39283', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lithuanian Hound', NULL, 'Q38901', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lobito Herreño', NULL, 'Q11698989', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Long haired dachshund', NULL, 'Q3516970', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Long-haired Inca Dog', NULL, 'Q124567691', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Longhaired Whippet', NULL, 'Q38045', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lottatore Brindisino', NULL, 'Q18126660', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lucas Terrier', NULL, 'Q15618573', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lucernese Hound', NULL, 'Q37964', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lupo Italiano', NULL, 'Q38023', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lyme Mastiff', NULL, 'Q124567726', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Lài dog', NULL, 'Q113697158', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Löwchen', '小獅子犬', 'Q38027', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Magyar agár', NULL, 'Q38871', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Majestic Tree Hound', NULL, 'Q6737720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Majorca Shepherd Dog', '皮羅·德·巴斯特·馬羅奎因犬', 'Q37649', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mallorcan ratter', '馬略卡捕鼠犬', 'Q37659', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Maltese', '馬爾濟斯', 'Q38751', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Maltese Fox Terrier', NULL, 'Q124567762', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Maltese Little Lion-dog', NULL, 'Q11341375', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Maltese Pocket Dog', NULL, 'Q11341373', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Manchester Terrier', '曼徹斯特梗', 'Q38387', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Maneto', '馬內托犬', 'Q38103', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mantiqueira Shepherd', NULL, 'Q10346001', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Marxdorfer Wolfshund', NULL, 'Q2491457', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Medelyan', '梅德良犬', 'Q30891717', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Medium-sized Anglo-French Hound', NULL, 'Q124083023', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Meitei Hui', NULL, 'Q137826232', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mexican lapdog', NULL, 'Q133854503', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mi-Ki', NULL, 'Q107210039', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature American Shepherd', '迷你美國牧羊犬', 'Q6865130', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Australian Shepherd', NULL, 'Q38004', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Bull Terrier', '迷你牛頭㹴', 'Q37967', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Fox Terrier', '迷你狐狸㹴', 'Q6865135', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Pinscher', '迷你平雪犬', 'Q38990', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Schnauzer', '迷你雪納瑞', 'Q38999', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Shar Pei', NULL, 'Q14533392', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Miniature Siberian Husky', NULL, 'Q11342375', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mioritic', NULL, 'Q37832', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mojee', '黑狼犬', 'Q124022669', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Molossian', '獒犬', 'Q38608', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Molossian hound', '摩洛斯犬', 'Q13217219', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Molossus of Epirus', NULL, 'Q10587816', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Montenegrin Mountain Hound', NULL, 'Q38631', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Morkie', NULL, 'Q3324148', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Moscow Watchdog', NULL, 'Q38518', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Moscow Water Dog', '莫斯科水犬', 'Q6915548', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mountain Cur', '山地柯犬', 'Q38892', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mountain Feist', NULL, 'Q130439903', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mountain View Cur', NULL, 'Q38894', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mucuchies', NULL, 'Q37963', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mudhol Hound', NULL, 'Q37670', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mudi', NULL, 'Q38690', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mullins'' feist', NULL, 'Q124567704', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Multi-Colored Poodle', NULL, 'Q113957592', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Murcian Ratter', '穆爾西亞捕鼠犬', 'Q20735288', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Murray River Curly Coated Retriever', '墨累河尋回犬', 'Q39045', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Mâtin', NULL, 'Q11883725', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Naga Dog', NULL, 'Q11323744', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'National Deerhound', NULL, 'Q10389421', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Native Irish Pedigree Dog Breeds', NULL, 'Q117050890', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Neapolitan Mastiff', '那不勒斯獒犬', 'Q38529', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Nenets Herding Laika', NULL, 'Q3438758', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'New Guinea singing dog', '新幾內亞唱犬', 'Q38884', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'New Zealand Heading Dog', NULL, 'Q13551303', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Newfoundland dog', '紐芬蘭犬', 'Q38706', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Nootka Dog', NULL, 'Q11325171', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norfolk Terrier', '諾福克㹴', 'Q38940', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norman Hound', NULL, 'Q107448371', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Normand-Poitevin', NULL, 'Q23473', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norrbottenspets', '北博滕尖嘴犬', 'Q38925', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'North-Easthrly Haaling Laika', NULL, 'Q19704923', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Northern Inuit Dog', NULL, 'Q39113', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Northern terrier', NULL, 'Q124567763', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Northwest farm terrier', NULL, 'Q124567765', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norwegian Buhund', NULL, 'Q38478', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norwegian Elkhound', '挪威獵鹿犬', 'Q38803', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norwegian Lundehund', NULL, 'Q38895', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Norwich Terrier', '諾里奇梗', 'Q38934', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Nova Scotia Duck Tolling Retriever', '新斯科細亞誘鴨尋回犬', 'Q38824', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Old Croatian Sighthound', NULL, 'Q39118', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Old Danish Pointer', '古丹麥指示犬', 'Q37494', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Old English sheepdog', '英國古代牧羊犬', 'Q37704', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Old Time Farm Shepherd', NULL, 'Q7085220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Old Welsh Grey Sheepdog', NULL, 'Q7085403', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Olde English Bulldogge', NULL, 'Q38168', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Oriental Shar Pei', NULL, 'Q11292565', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Original Cajun Squirrel Dog', NULL, 'Q124567705', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Original Fila Brasileiro', NULL, 'Q57258179', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Otterhound', '奧達獵犬', 'Q38922', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pachón Navarro', NULL, 'Q39334', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Paisley Terrier', NULL, 'Q38980', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pampas Deerhound', NULL, 'Q10389422', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pandikona', NULL, 'Q1990683', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Papillon', '蝴蝶犬', 'Q38115', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pardog', NULL, 'Q3895786', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pariah dog', '流浪犬', 'Q12206278', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Parson Russell Terrier', '帕森羅素㹴', 'Q38880', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pastor Americano', NULL, 'Q44008', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pastore Fonnese', NULL, 'Q2410835', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Patagonian Bearded Greyhound', NULL, 'Q124986589', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Patagonian Sheepdog', NULL, 'Q9053651', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Patterdale Terrier', NULL, 'Q38800', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Patti', NULL, 'Q123243328', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pekingese', '獅子狗', 'Q38959', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pembroke Welsh Corgi', '彭布羅克威爾斯柯基犬', 'Q38783', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perdigueiro Galego', NULL, 'Q15128787', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perro de Presa Mallorquin', NULL, 'Q37676', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perro de pastor garafiano', NULL, 'Q38182', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perro fino Colombiano', NULL, 'Q17446281', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perro majorero', NULL, 'Q37572', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Perro pampa argentino', NULL, 'Q107331639', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Peruvian Hairless Dog', NULL, 'Q38874', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Peruvian Inca Orchid', NULL, 'Q11337512', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Petit Basset Griffon Vendéen', '迷你貝吉格里芬凡丁犬', 'Q39080', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Petit Bleu de Gascogne', NULL, 'Q38176', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Petit Gascon Saintongeois', NULL, 'Q39331', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Petit brabançon', NULL, 'Q13631411', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Phalène', '垂耳蝴蝶犬', 'Q39254', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pharaoh Hound', '法老獵犬', 'Q38808', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Philippines Islands Dog', NULL, 'Q124567723', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Phu Quoc ridgeback dog', '富國脊背犬', 'Q39116', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Picardy Shepherd', '伯格·德·皮卡第犬', 'Q37635', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Picardy Spaniel', NULL, 'Q38030', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Piccolo Segugio dell''Appennino', NULL, 'Q7190591', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pit Bullmastiff', NULL, 'Q11331516', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pit Monster', NULL, 'Q58058018', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Plains-Indian Dog', NULL, 'Q11335964', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Plott Hound', NULL, 'Q39195', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Podenco Canario', '加那利波登科犬', 'Q38932', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Podengo Galego', NULL, 'Q11860269', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Poitevin hound', NULL, 'Q38185', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Poligar Hound', NULL, 'Q124567693', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Polish Greyhound', NULL, 'Q5429', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Polish Hound', NULL, 'Q38217', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Polish Hunting Dog', NULL, 'Q38051', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Polish Hunting Spaniel', NULL, 'Q55454389', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Polish Lowland Sheepdog', '波蘭低地牧羊犬', 'Q38836', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Poltalloch Terrier', NULL, 'Q11339332', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pomeranian Wolf-dog', NULL, 'Q124567735', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pomsky', NULL, 'Q10351150', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pont-Audemer Spaniel', '龐特奧德梅爾獚', 'Q37844', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Poochon', NULL, 'Q19698220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Porcelaine', '波瓷獵犬', 'Q39083', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Portuguese Cattle Dog', '卡斯特羅拉博雷羅犬', 'Q38099', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Portuguese Podengo', '葡萄牙波登科犬', 'Q39063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Portuguese Pointer', '葡萄牙指示犬', 'Q38165', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Portuguese Sheepdog', NULL, 'Q37734', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Portuguese water dog', '葡萄牙水獵犬', 'Q38559', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Posavac Hound', NULL, 'Q39078', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Powinder Dog', NULL, 'Q11339009', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Prapsos', NULL, 'Q11335525', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pražský Krysařík', NULL, 'Q38906', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Presa Canario', '加那利犬', 'Q37750', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pudelpointer', NULL, 'Q38930', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pueblo Dog', NULL, 'Q11350809', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Puli', '普利犬', 'Q38864', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pulin', NULL, 'Q28063845', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pumi', '普米犬', 'Q38919', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pungsan', '豐山犬', 'Q29174', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pyrenean Mastiff', NULL, 'Q38766', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pyrenean Mountain Dog', '庇里牛斯山犬', 'Q37803', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pyrenean Sheepdog Long-haired', NULL, 'Q10345998', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pyrenean Sheepdog Smooth-faced', NULL, 'Q16039619', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Pyrenean Shepherd', '比利牛斯山牧羊犬', 'Q37786', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rafeiro do Alentejo', '阿連特茹獒犬', 'Q39073', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rajapalayam', NULL, 'Q38312', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ramanadhapuram Mandai', NULL, 'Q120207747', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ramanathapuram mandai dog', NULL, 'Q64828740', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rampur Greyhound', '拉姆普爾靈𤟥犬', 'Q38179', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rare breed', NULL, 'Q7294537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rastreador-brasileiro', NULL, 'Q38202', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rat Terrier', '捕鼠㹴', 'Q38431', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ratonero Basco', '比利亞努科捕鼠犬', 'Q37711', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ratonero Bodeguero Andaluz', '安達盧西亞酒窖捕鼠犬', 'Q38209', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ratonero Palmero', NULL, 'Q104806099', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Red Decoy Dog', NULL, 'Q11349773', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Redbone Coonhound', '紅骨浣熊獵犬', 'Q38820', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Renascence Bulldogge', NULL, 'Q134054153', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rhodesian Ridgeback', '羅得西亞背脊犬', 'Q39026', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Romanian Raven Shepherd Dog', NULL, 'Q37795', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rothbury Terrier', NULL, 'Q11350379', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rottweiler', '羅威那', 'Q39093', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Rough Collie', NULL, 'Q38650', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ruby Spaniel', NULL, 'Q11349073', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Running Walker Coonhound', NULL, 'Q18456988', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russian Hound', NULL, 'Q10657975', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russian Setter', NULL, 'Q124567708', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russian Spaniel', NULL, 'Q39103', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russkaya tsvetnaya bolonka', '俄羅斯彩色波隆卡犬', 'Q38263', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russkiy Toy', '俄羅斯玩具犬', 'Q39176', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Russo-European Laika', '俄歐拉伊卡犬', 'Q39332', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ryukyu Inu', '琉球犬', 'Q5401146', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Saarloos wolfdog', NULL, 'Q39306', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sabueso Español', NULL, 'Q39126', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Saint-Usuge Spaniel', NULL, 'Q4898', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Saluki', '薩路基犬', 'Q39108', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Samoyed', '薩摩耶犬', 'Q39002', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'San''in Shiba Inu', NULL, 'Q11471124', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sanshu', NULL, 'Q2222597', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sapsali', '薩普薩里犬', 'Q29178', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sarabi Mastiff', NULL, 'Q19775816', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sarail hound', NULL, 'Q107804694', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Satsuma Dog', '薩摩犬 (日本)', 'Q11622336', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Savoy Sheepdog', NULL, 'Q819593', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schafpudel', NULL, 'Q38436', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schapendoes', NULL, 'Q39157', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schillerstövare', NULL, 'Q38728', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schipperke', '史其派克犬', 'Q39010', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schwarzer', NULL, 'Q1513816', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schweizer Laufhund', NULL, 'Q38975', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schweizerischer Niederlaufhund', NULL, 'Q38731', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Schwyz Hound', NULL, 'Q39280', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Scotch collie', '蘇格蘭牧羊犬', 'Q39587', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Scottish Deerhound', '勒車犬', 'Q37929', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Scottish Terrier', '蘇格蘭㹴', 'Q39035', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sealyham Terrier', '西里漢姆㹴', 'Q39068', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Segugio Cravin', NULL, 'Q7446356', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Segugio Italiano', NULL, 'Q17521154', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Segugio Italiano a Pelo Raso', NULL, 'Q39152', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Segugio Maremmano', NULL, 'Q1752116', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Segugio dell''Appennino', NULL, 'Q1762702', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Seppala Siberian Sleddog', '塞佩萊西伯利亞雪橇犬', 'Q3955667', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Serbian Hound', NULL, 'Q37574', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Serbian Tricolour Hound', NULL, 'Q37780', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Serbian Yellow Hound', NULL, 'Q136400687', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Serbian sheep dog', NULL, 'Q10676839', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Serrano Bulldog', NULL, 'Q10437609', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sertanejo Dog', NULL, 'Q25865', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Seskar Seal Dog', NULL, 'Q16830750', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shakhi', NULL, 'Q11307644', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shar Pei', '沙皮狗', 'Q38972', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shelburne Terrier', NULL, 'Q124567701', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shepweiler', NULL, 'Q105429234', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shetland Sheepdog', '喜樂蒂牧羊犬', 'Q39058', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shiba Inu', '柴犬', 'Q39315', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shih Tzu', '西施犬', 'Q39357', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shikoku Ken', '四國犬', 'Q39147', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shilluk Greyhound', NULL, 'Q11308363', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shiloh Shepherd', NULL, 'Q39229', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shorty Bull', NULL, 'Q18484673', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Shropshre Terrier', NULL, 'Q11308054', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Siberian Husky', '西伯利亞哈士奇', 'Q39295', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Siberian Sheepdog', NULL, 'Q124567737', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sicilian Sheepdog', NULL, 'Q3655285', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sila Shepherd', NULL, 'Q21193030', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Silken Windhound', '絲毛風獵犬', 'Q39207', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Silken Windsprite', NULL, 'Q1719885', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Silky Spitz', NULL, 'Q110006522', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sioux Dog', NULL, 'Q11314025', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Skye Terrier', '斯凱㹴', 'Q39052', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sloughi', NULL, 'Q37925', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Slovak Cuvac', NULL, 'Q38963', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Slovakian Rough-haired Pointer', '斯洛伐克剛毛指示犬', 'Q39210', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Slovenský kopov', NULL, 'Q38102', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Smaland Hound', NULL, 'Q38738', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Small Greek Domestic Dog', NULL, 'Q39182', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Small Međimurje Dog', NULL, 'Q2943769', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Small Münsterländer', NULL, 'Q38036', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Smithfield (dog)', NULL, 'Q16861551', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Smooth Collie', NULL, 'Q38790', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Smooth Fox Terrier', '平毛狐狸㹴', 'Q38787', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Soft-coated Wheaten Terrier', '愛爾蘭軟毛梗', 'Q38047', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'South African Mastiff', NULL, 'Q130520291', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Spanish Mastiff', NULL, 'Q37939', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Spanish Water Dog', '西班牙水獵犬', 'Q39200', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sparta Sheepdog', NULL, 'Q11312704', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Spino siciliano', NULL, 'Q30898772', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Spinone Italiano', NULL, 'Q39161', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sporting Lucas Terrier', NULL, 'Q7579584', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'St. Bernard', '聖伯納犬', 'Q38090', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'St. Domingo Dog', NULL, 'Q11314826', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'St. Hubert', NULL, 'Q124212270', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'St. Hubert Jura Hound', NULL, 'Q11314828', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Stabijhoun', '斯塔比犬', 'Q39192', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Staffordshire Bull Terrier', '斯塔福郡鬥牛㹴', 'Q39285', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Staghound', NULL, 'Q107444250', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Standard Schnauzer', '標準雪納瑞', 'Q39605', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Steinbracke', NULL, 'Q1485154', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Stephens Cur', '史蒂芬斯柯犬', 'Q39139', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Stichelhaar', NULL, 'Q37773', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Strathdoon dingo killer', NULL, 'Q11312417', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Strobel', NULL, 'Q2356500', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Styrian Coarse-haired Hound', NULL, 'Q39214', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sulimov dog', NULL, 'Q2165917', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Sussex Spaniel', NULL, 'Q39138', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Svensk vit älghund', NULL, 'Q4356976', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Swedish Lapphund', NULL, 'Q39130', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Swedish Vallhund', '瑞典牧牛犬', 'Q39075', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tahitian Dog', NULL, 'Q29033666', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Taigan', NULL, 'Q39239', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Taimyr', NULL, 'Q109018451', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Takayasu Inu', NULL, 'Q11669145', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Talbot', NULL, 'Q39390', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Targhee Hound)', NULL, 'Q124567729', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tarsus Çatalburuns', NULL, 'Q5758089', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tatra Shepherd Dog', NULL, 'Q39096', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tatranský durič', NULL, 'Q111780168', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Techichi', NULL, 'Q9356247', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Teddy Roosevelt Terrier', NULL, 'Q39412', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Telomian', NULL, 'Q37464', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tenterfield Terrier', NULL, 'Q39185', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Terceira Mastiff', NULL, 'Q16893163', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Terry', NULL, 'Q11319417', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tervuren', '比利時特弗倫犬', 'Q38679', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Thai Bangkaew Dog', '泰國邦考犬', 'Q37880', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Thai Ridgeback', NULL, 'Q39172', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tibetan Hound', NULL, 'Q124567697', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tibetan Mastiff', '藏獒', 'Q39322', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tibetan Spaniel', '西藏獵犬', 'Q39181', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tibetan Terrier', '西藏㹴', 'Q38796', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tibetan kyi apso', '西藏奇阿普索犬', 'Q16892010', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Timber-wolf Dog', NULL, 'Q11319007', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Timon''s Biter', NULL, 'Q11318976', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tong gau', '唐狗', 'Q17023476', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tonya Finosu', NULL, 'Q109535791', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tornjak', NULL, 'Q39133', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tosa', '土佐鬥犬', 'Q38991', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Bull Terrier', NULL, 'Q11321010', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Fox Terrier', '玩具狐狸㹴', 'Q37510', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Manchester Terrier', '玩具曼徹斯特㹴', 'Q39407', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Mi-Ki', NULL, 'Q11321009', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Munchkin', NULL, 'Q11321011', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Toy Poodle', NULL, 'Q11831662', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Trailhound', NULL, 'Q11322087', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Transcaucasian Mountain Dog', NULL, 'Q124567714', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Transylvanian hound', NULL, 'Q38394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Treeing Cur', '樹獵柯犬', 'Q39148', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Treeing Feist', '樹獵費斯特犬', 'Q6924947', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Treeing Tennessee Brindle', '田納西樹獵虎斑犬', 'Q38443', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Treeing Walker Coonhound', NULL, 'Q39244', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tripuri Dog', NULL, 'Q11322026', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Turkish Greyhound', NULL, 'Q121029394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Turkmen Alabai', NULL, 'Q1748928', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Tyrolean Hound', NULL, 'Q39084', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'U.S. state dogs', NULL, 'Q1423562', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ukrainian Sheepdog', NULL, 'Q124567731', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Ukrainian Vivcharka', NULL, 'Q38546', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Vaghari Dog', NULL, 'Q19394150', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Valdueza', NULL, 'Q113403824', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Valley Bulldog', NULL, 'Q3435318', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Victorian Bulldog', NULL, 'Q124567712', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Villano de las Encartaciones', NULL, 'Q39251', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Vizsla', '維斯拉犬', 'Q38819', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Volpino Italiano', '義大利狐狸犬', 'Q38196', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Waeller', NULL, 'Q39265', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Walker Foxhound', NULL, 'Q124567698', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Water drawer', NULL, 'Q124567722', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Weimaraner', '魏瑪犬', 'Q38965', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Black-and-Tan Sheepdog', NULL, 'Q124567716', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Blue-Grey', NULL, 'Q124567717', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Corgi', '威爾斯柯基犬', 'Q858459', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Harrier', NULL, 'Q104640130', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Hillman', NULL, 'Q11288588', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Hound', NULL, 'Q3398688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Sheepdog', NULL, 'Q39278', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Springer Spaniel', '威爾斯激飛獵犬', 'Q39047', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Welsh Terrier', '威爾斯㹴', 'Q39041', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'West Country Harrier', NULL, 'Q107448399', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'West Greenland Dog', NULL, 'Q11288509', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'West Highland White Terrier', '西高地白㹴', 'Q17510', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'West Siberian Laika', NULL, 'Q39435', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Westfal Terrier', NULL, 'Q11902355', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Westphalian Dachsbracke', '威斯特法倫達克斯布拉克犬', 'Q39095', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wetterhoun', '維特荷恩犬', 'Q20860', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Whippet', '惠比特犬', 'Q39122', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'White English Bulldog', NULL, 'Q39405', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'White Greek sheepdog', NULL, 'Q11900149', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'White Shepherd Dog', NULL, 'Q11698316', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'White Swiss Shepherd', NULL, 'Q37934', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wire Fox Terrier', '剛毛狐狸㹴', 'Q39491', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wire-haired Beagle', NULL, 'Q124567700', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wirehaired Pointing Griffon', '剛毛指示格里芬犬', 'Q38869', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wirehaired Vizsla', '匈牙利剛毛維茲拉', 'Q39608', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Working Pit Bulldog', NULL, 'Q60691642', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Wurttemberg Pointer', NULL, 'Q11902537', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Xarnego Valenciano', NULL, 'Q59540', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Xiasi Dog', '下司犬', 'Q1000049', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Xigou', '細犬', 'Q10874713', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Xoloitzcuintle', '墨西哥無毛犬', 'Q38856', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Yakki Dog', NULL, 'Q11345046', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Yakushima Inu', NULL, 'Q11465645', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Yakutian Laika', '雅庫特萊卡犬', 'Q38020', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Yorkshire Terrier', '約克夏㹴', 'Q39330', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Yugoslavian Shepherd Dog', '薩普蘭尼那克犬', 'Q39408', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Zande Dog', NULL, 'Q11324615', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Zanzibar Greyhound', NULL, 'Q11306443', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Zerdava', NULL, 'Q6003137', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Zlatiborski ovčar', NULL, 'Q11903191', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Zuchon', NULL, 'Q19283661', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'aquarius', NULL, 'Q11282857', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'artésien-normand', NULL, 'Q20379411', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'badger dog', NULL, 'Q25615871', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'basset', '巴吉度犬', 'Q2887401', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'basset d''Artois', NULL, 'Q810500', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'basset hound', '巴吉度獵犬', 'Q37716', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'beagle', '米格魯犬', 'Q21102', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'bloodhound', '尋血獵犬', 'Q21098', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'border collie', '邊境牧羊犬', 'Q37710', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'collie', '柯利犬', 'Q1196071', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'continental bulldog', '大陸鬥牛犬', 'Q37764', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'dachshund', '臘腸犬', 'Q29099', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'dingo', '澳洲野犬', 'Q38584', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'dropper', NULL, 'Q11323390', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'greyhound', '靈𤟥犬', 'Q38571', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'griffon', NULL, 'Q1028186', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'gråhund', NULL, 'Q1398538', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'hairless dog', '無毛犬', 'Q1958596', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'miniature dachshund', '迷你臘腸犬', 'Q12664827', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'mongrel', '混種狗', 'Q38945', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'nureongi', '黃毛犬', 'Q1135818', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'odis', NULL, 'Q20379893', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'pocket beagle', NULL, 'Q124567699', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'podenco palmero', NULL, 'Q123241766', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'poodle', '貴賓犬', 'Q38904', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'pug', '巴哥犬', 'Q38698', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'tumbler', '不倒翁犬', 'Q11316517', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'westiepoo', NULL, 'Q99640545', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'wire-haired dachshund', NULL, 'Q3516971', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (5219174, 'Český horský pes', NULL, 'Q39258', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);

-- 家貓 (taxon_id=2435099): 134 品種, 83 有中文名
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Abyssinian', '阿比西尼亞貓', 'Q7955', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Aegean cat', '愛琴海貓', 'Q7957', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Altai', NULL, 'Q138504967', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American Bobtail', '美國短尾貓', 'Q7874', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American Curl', '美國反耳貓', 'Q7960', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American Ringtail', NULL, 'Q17998065', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American Shorthair', '美國短毛貓', 'Q7962', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American Wirehair', '美國鋼毛貓', 'Q7964', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'American burmese', NULL, 'Q2928526', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Anatoli', NULL, 'Q42539', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Antipodean', NULL, 'Q7967', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Arabian Mau', NULL, 'Q7970', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ashera', NULL, 'Q1812184', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Asian', '亞洲貓', 'Q7974', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Australian Mist', '澳大利亞霧貓', 'Q7989', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Balinese cat', '峇里貓', 'Q9665', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Bambino', '巴比諾貓', 'Q9667', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Bengal cat', '孟加拉貓', 'Q42583', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Birman cat', '伯曼貓', 'Q42563', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Bohemian Rex', NULL, 'Q2778716', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Bombay', '孟買貓', 'Q42566', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Brazilian Shorthair', '巴西短毛貓', 'Q29280', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'British Longhair', '英國長毛貓', 'Q29268', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'British Semi-longhair', NULL, 'Q29285', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'British Shorthair', '英國短毛貓', 'Q29273', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Burmese', '緬甸貓', 'Q42573', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Burmilla', '波米拉貓', 'Q29258', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'California Rex', NULL, 'Q25456918', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'California Spangled', '加州閃亮貓', 'Q42556', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ceylon', NULL, 'Q2947192', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Chantilly', '查達利貓', 'Q392693', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Chartreux', '夏特貓', 'Q42588', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Chausie', '獅子貓', 'Q42546', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Colorpoint Shorthair', NULL, 'Q4115865', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Cornish Rex', '柯尼斯捲毛貓', 'Q42559', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Cymric', '威爾斯貓', 'Q42578', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Cyprus cat', '塞普勒斯短毛貓', 'Q5200515', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Deutsche Langhaarkatze', NULL, 'Q1203311', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Devon Rex', '德文捲毛貓', 'Q42570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Donskoy cat', '頓斯科伊貓', 'Q7303', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Dragon Li', '狸花貓', 'Q7334', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Egyptian Mau', '埃及貓', 'Q7295', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Elf cat', NULL, 'Q16722061', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'European Burmese', NULL, 'Q2928528', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'European Shorthair', '歐洲短毛貓', 'Q20793', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Exotic Shorthair', '異國短毛貓', 'Q42555', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'FoldEx cat', NULL, 'Q17632871', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Foreign White', '外國白貓', 'Q42727', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'German Rex', '德國捲毛貓', 'Q42551', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Havana Brown', '哈瓦那棕貓', 'Q42645', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Highlander cat', NULL, 'Q25471053', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Himalayan', '喜馬拉雅貓', 'Q42959', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Himalayan Persian', NULL, 'Q61358047', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Japanese Bobtail', '日本短尾貓', 'Q42673', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Javanese', '爪哇貓', 'Q42661', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Jianzhou cat', '簡州貓', 'Q131191857', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kanaani cat', NULL, 'Q125490258', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Karelian Bobtail', NULL, 'Q4214935', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kashmir cat', NULL, 'Q25471052', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Khao Manee', NULL, 'Q42700', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kinkalow', NULL, 'Q16663434', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kohana', NULL, 'Q97546690', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kohona', NULL, 'Q3816165', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Korat', '科拉特貓', 'Q42691', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Kurilian Bobtail', '千島短尾貓', 'Q7338', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'LaPerm', '拉邦貓', 'Q42639', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Lambkin', NULL, 'Q56411069', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Lykoi Cat', NULL, 'Q16913794', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Maine coon', '緬因貓', 'Q42659', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Mandalay', NULL, 'Q25395892', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Manx', '曼島貓', 'Q42675', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Mekong Bobtail', '湄公河短尾貓', 'Q16889346', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Minskin', NULL, 'Q3039052', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Minuet cat', '拿破崙貓', 'Q6965006', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Modern Siamese', NULL, 'Q11949692', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Munchkin cat', '曼赤肯貓', 'Q686698', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Nebelung', '尼比龍貓', 'Q42647', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Neva Masquerade', NULL, 'Q42599', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Norwegian Forest Cat', '挪威森林貓', 'Q42667', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ocicat', '歐西貓', 'Q42685', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ojos Azules', '歐斯亞史烈斯貓', 'Q42640', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Oregon Rex', '俄勒岡捲毛貓', 'Q42676', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Oriental Bicolour', '東方雙色貓', 'Q7102323', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Oriental Longhair', '東方長毛貓', 'Q2099338', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Oriental Shorthair', '東方短毛貓', 'Q42696', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Owyhee Bob', NULL, 'Q25456868', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Pantherina', NULL, 'Q138505024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Persian cat', '波斯貓', 'Q42610', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Peterbald', '彼得禿貓', 'Q42663', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Pixie-bob', '北美洲短毛貓', 'Q42693', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Raas', NULL, 'Q17517549', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ragamuffin', '襤褸貓', 'Q42637', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ragdoll', '布偶貓', 'Q42688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Rex mutation', NULL, 'Q42949', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Russian Blue', '俄羅斯藍貓', 'Q42654', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Russian White, Black and Tabby', '俄羅斯白貓、黑貓和虎斑貓', 'Q13035968', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Safari', NULL, 'Q42704', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Savannah', '薩凡納貓', 'Q42670', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Scottish Fold', '蘇格蘭摺耳貓', 'Q42636', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Selkirk Rex', '塞爾凱克鬈毛貓', 'Q42642', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Serengeti cat', '塞倫蓋蒂貓', 'Q7308', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Seychellois', NULL, 'Q3481000', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Siamese', '暹羅貓', 'Q42604', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Siberian', '西伯利亞貓', 'Q42630', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Singapura', '新加坡貓', 'Q42679', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Skookum', NULL, 'Q3486361', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Sokoke', '肯亞貓', 'Q2075066', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Somali', '索馬利貓', 'Q42715', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Sphynx', '斯芬克斯貓', 'Q42712', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Suffolk', NULL, 'Q132158203', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Suphalak', NULL, 'Q21002394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Tennessee Rex', NULL, 'Q25456853', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Thai', '傳統暹羅貓', 'Q42732', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Thai Lilac', NULL, 'Q119884431', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Tiffanie', '亞洲半長毛貓', 'Q7986', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Tonkinese', '東奇尼貓', 'Q42726', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Toybob', NULL, 'Q30595152', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Toyger', '玩具虎貓', 'Q7323', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Traditional Persian', NULL, 'Q7832303', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Turkish Angora', '土耳其安哥拉貓', 'Q42720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Turkish Van', '土耳其梵貓', 'Q42724', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ukrainian Levkoy', '烏克蘭勒夫科伊貓', 'Q2642315', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ural rex', NULL, 'Q42706', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'Ussuri', NULL, 'Q7902130', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'York Chocolate', '約克巧克力貓', 'Q2166017', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'chinchilla Persian', NULL, 'Q10666939', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'domestic long-haired cat', '混種長毛貓', 'Q42549', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'domestic short-haired cat', '混種短毛貓', 'Q12648', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'dwelf', NULL, 'Q16889351', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'genetta', NULL, 'Q56411080', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'mixed breed cat', NULL, 'Q116193823', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'moggy', '雜種貓', 'Q126478118', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'snowshoe', '雪鞋貓', 'Q42633', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2435099, 'squitten', NULL, 'Q7582359', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);

-- 家馬 (taxon_id=2440886): 668 品種, 124 有中文名
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'AQPS', NULL, 'Q2873068', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abaco Barb', NULL, 'Q304345', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abaga', NULL, 'Q60753111', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abeya', NULL, 'Q28464784', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abstang', NULL, 'Q2822051', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abtenauer', NULL, 'Q2822067', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Abyssinian horse', NULL, 'Q319790', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Adaev', NULL, 'Q495079', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ader', NULL, 'Q15720716', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Aegidienberger', NULL, 'Q380595', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Aenos', NULL, 'Q2875325', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Akhal-Teke', '汗血馬', 'Q472753', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Alaca', NULL, 'Q30765778', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Albanian horse', NULL, 'Q1663342', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Altai horse', NULL, 'Q2840316', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Alter Real', NULL, 'Q447136', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Altwürttemberger', NULL, 'Q21083524', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Bashkir Curly', '北美捲毛馬', 'Q463463', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Belgian Draft', NULL, 'Q114245734', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Cream Draft', '美國奶油馬', 'Q338051', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Drum Horse', NULL, 'Q10477023', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Indian horse', NULL, 'Q2842957', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Miniature Horse', '美洲矮種馬', 'Q463466', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Paint Horse', '美洲佩恩特馬', 'Q692939', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Paint Pony Registry', NULL, 'Q20493020', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Quarter Horse', '美洲奎特馬', 'Q466602', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Saddlebred', '美國騎乘種馬', 'Q466701', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Shetland Pony', NULL, 'Q1935178', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Sugarbush Harlequin Draft', NULL, 'Q10683450', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Walking Pony', NULL, 'Q467218', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American Warmblood', NULL, 'Q2843081', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American White Draught Horse', NULL, 'Q124332026', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American creme and white horse registry', NULL, 'Q2962919', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'American spotted paso', NULL, 'Q10408138', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Amurski horse', NULL, 'Q2844063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Amyrakikos', NULL, 'Q124332056', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anadolu Pony', NULL, 'Q2845100', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Andalusian horse', '安達盧西亞馬', 'Q489798', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Andean', NULL, 'Q10411382', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Andravida horse', NULL, 'Q2846250', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Angevin horse', NULL, 'Q2849573', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anglo European', NULL, 'Q15868311', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anglo-Arabian', '英倫-阿拉伯種馬', 'Q541046', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anglo-Kabarda', NULL, 'Q2849686', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anglo-Norman horse', '盎格魯-諾曼馬', 'Q164220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Anglo-barb horse', NULL, 'Q112797073', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Appaloosa', '阿帕盧薩馬', 'Q620656', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Appaloosa Sport Horse', NULL, 'Q620657', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'AraAppaloosa', NULL, 'Q546030', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Arab-Barb', NULL, 'Q623720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Araber-Haflinger', NULL, 'Q167620', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Arabian horse', '阿拉伯馬', 'Q184138', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Arabo-friesian', NULL, 'Q583013', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ardennes horse', '亞爾丁馬', 'Q638976', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Arenberg-Nordkirchen', NULL, 'Q641693', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Argentinian Warmblood', NULL, 'Q3478173', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Arravani', NULL, 'Q452434', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Asturcón', NULL, 'Q752222', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Augeron horse', NULL, 'Q2870909', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Australian Draught Horse', '澳大利亞挽馬', 'Q3536621', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Australian Pony', NULL, 'Q548300', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Australian Stock Horse', NULL, 'Q782748', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Australian Warmblood', NULL, 'Q783377', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Austrian Warmblood', NULL, 'Q306739', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Auvergne horse', NULL, 'Q2962921', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Auxois', NULL, 'Q789720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Avelignese', NULL, 'Q9300289', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Axios horses', NULL, 'Q18610767', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Azteca horse', '阿茲臺克馬', 'Q786828', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bachmat', NULL, 'Q9163860', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bagual', NULL, 'Q53550116', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baguio', NULL, 'Q56306142', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baise', NULL, 'Q115562501', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baixadeiro', NULL, 'Q2880009', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bajau', NULL, 'Q56314973', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bakhtiari', NULL, 'Q106292681', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baladi horse', NULL, 'Q50074959', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bale horse', NULL, 'Q50199157', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bali Pony', NULL, 'Q2880829', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Balikun horse', '巴里坤馬', 'Q2880873', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Balkan Pony', NULL, 'Q106286965', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baltic Ardennes', NULL, 'Q1821223', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baltic Trotter', NULL, 'Q106270820', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Baluchi horse', NULL, 'Q2881686', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ban-ei Race Horse', NULL, 'Q22009216', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Banat', NULL, 'Q57416603', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bangladesh native horse', NULL, 'Q23021680', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Banker horse', '班克爾馬', 'Q2877469', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Barb horse', '巴布馬', 'Q251505', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bardigiano', NULL, 'Q808022', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Barock Pinto', NULL, 'Q39075724', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Barraquand horse', NULL, 'Q2962897', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bashkir horse', '巴什基爾馬', 'Q809802', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Basque Mountain Horse', NULL, 'Q4867852', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Basseri horse', NULL, 'Q104537147', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Basuto pony', NULL, 'Q810676', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Batak Pony', NULL, 'Q810706', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bavarian Warmblood', NULL, 'Q812464', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Beberbecker', NULL, 'Q18426411', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Beledougou', NULL, 'Q50886018', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Belgian Draught', '比利時馬', 'Q896476', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Belgian Sport Horse', NULL, 'Q2962944', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Belgian Trotter', NULL, 'Q54161541', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Belgian Warmblood', NULL, 'Q792317', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bergmann', NULL, 'Q56306340', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Berrichon horse', NULL, 'Q2899121', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bhimthadi horse', NULL, 'Q22009243', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bhirum pony', NULL, 'Q2900684', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bhutia Horse', NULL, 'Q16516592', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bidet breton', NULL, 'Q17354041', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bisbino horse', NULL, 'Q106246612', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Black Forest Horse', NULL, 'Q545962', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Blazer horse', NULL, 'Q2906307', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bobo horse', NULL, 'Q50377950', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Boer Pony', NULL, 'Q10432050', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Boer pony', NULL, 'Q890298', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bohai', '渤海馬', 'Q16534460', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bolivian Pony', NULL, 'Q20492863', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Borneo Pony', NULL, 'Q20492866', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Borta', NULL, 'Q104537263', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Bosnian Mountain Horse', '波斯尼亞山馬', 'Q894451', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Boulonnais', '布洛涅馬', 'Q588252', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brandenburger', NULL, 'Q371087', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brantome line', NULL, 'Q24901611', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brazilian Sport Horse', NULL, 'Q2962952', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brazilian pony', NULL, 'Q10355766', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brennou horse', NULL, 'Q137386752', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Breton horse', NULL, 'Q514553', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'British Miniature Horse', NULL, 'Q124025960', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'British Spotted pony', NULL, 'Q2381641', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'British Warmblood', NULL, 'Q9180807', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Brumby', NULL, 'Q850232', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Budyonny horse', '布瓊尼馬', 'Q663150', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Burguete horse', NULL, 'Q4998734', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Burmese Pony', NULL, 'Q3030767', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Busa Pony', NULL, 'Q106231567', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Byelorussian Harness', NULL, 'Q3031304', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Caballo Polo Argentino', NULL, 'Q18417577', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Calabrese horse', NULL, 'Q1026186', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Calvinia', NULL, 'Q19544019', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Camargue horse', NULL, 'Q846312', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Camarillo White Horse', NULL, 'Q2934634', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Campeiro', NULL, 'Q1030707', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Campolina', NULL, 'Q1031529', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian Cutting Horse Association', NULL, 'Q665646', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian Pacer', NULL, 'Q2935807', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian Rustic Pony', NULL, 'Q2935808', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian Sport Horse', NULL, 'Q122917939', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian Warmblood', NULL, 'Q10543261', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canadian horse', '加拿大馬', 'Q573906', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Canik', NULL, 'Q16535519', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cape Harness', NULL, 'Q3536637', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Carneddau pony', NULL, 'Q56307437', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Carolina Marsh Tacky', NULL, 'Q2939938', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Carrossier noir du Cotentin', NULL, 'Q57416349', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Carthusian', NULL, 'Q1425368', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Caspian horse', '裡海馬', 'Q1735178', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Castillonnais', NULL, 'Q2941446', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Catria horse', NULL, 'Q2962930', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cauchois horse', NULL, 'Q56847517', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cavallo Appenninico', NULL, 'Q3620866', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cavallo Romano della Maremma Laziale', NULL, 'Q2962905', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cavallo del Delta', NULL, 'Q22009217', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cayuse', NULL, 'Q5055481', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cerbat Mustang', NULL, 'Q25028482', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chaidamu', '柴達木馬', 'Q21658875', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chakouyi', '岔口驛馬', 'Q21511963', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chapman Horse', NULL, 'Q10448369', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chara', NULL, 'Q28033231', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Charentais horse', NULL, 'Q2957707', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Charolais horse', NULL, 'Q2961142', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chernomor', NULL, 'Q16538999', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cherokee', NULL, 'Q56307485', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cheval des Marquises', NULL, 'Q2962948', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cheval du Morvan', NULL, 'Q2962953', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cheval lorrain', NULL, 'Q2962966', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chilean horse', NULL, 'Q2963620', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chincoteague pony', NULL, 'Q739739', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chinese Guoxia', NULL, 'Q930399', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chinese Kazakh Horse', NULL, 'Q21658885', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chinese Mongolian', NULL, 'Q21658892', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Choctaw Horse', NULL, 'Q2964310', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chumbivilcas', NULL, 'Q23021850', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chumysh', NULL, 'Q56307541', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Chyanta', NULL, 'Q106255992', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Clay Trotting Horses', NULL, 'Q5130040', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cleveland Bay', NULL, 'Q284617', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Clydesdale horse', '克萊茲代爾馬', 'Q844058', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Coffin Bay Pony', NULL, 'Q2981825', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Coldblood trotter', NULL, 'Q1509851', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Colorado Ranger', '科羅拉多遊俠', 'Q1111322', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Comtois horse', '孔圖瓦馬', 'Q1122935', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Conestoga Horse', NULL, 'Q56305136', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Connemara pony', NULL, 'Q848812', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Constantine Barb', NULL, 'Q112805489', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Corlay horse', NULL, 'Q16539045', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Corsican horse', NULL, 'Q2962916', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Costa Rican Saddle Horse', NULL, 'Q3367777', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Criollo horse', '克里奧爾馬', 'Q1140113', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Crioulo', NULL, 'Q50824538', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Croatian Coldblood', NULL, 'Q3536627', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Croatian trotter', NULL, 'Q16113692', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cuban Paso', NULL, 'Q10549757', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cuban Pinto', NULL, 'Q10549758', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cuban trotter', NULL, 'Q10549760', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Cumberland Island horse', NULL, 'Q5193913', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Czech warm blood', NULL, 'Q3114092', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Czechoslovakian Small Riding Pony', NULL, 'Q5201876', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dales pony', NULL, 'Q901301', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Danish Sport Pony', NULL, 'Q4571047', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Danish Warmblood', NULL, 'Q1270362', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Danish trotter', NULL, 'Q56308040', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Danube Delta horse', NULL, 'Q5221258', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dareshuri', NULL, 'Q10466822', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Darkhad', NULL, 'Q56301801', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dartmoor Pony', NULL, 'Q656152', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Datong horse', NULL, 'Q21512415', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dawand', NULL, 'Q104552881', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Deli pony', NULL, 'Q3021600', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Deliboz', NULL, 'Q1184220', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Desert Norman Horse', NULL, 'Q107626052', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Domestic mountain pony', NULL, 'Q106232360', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dongola horse', NULL, 'Q3036272', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dutch Draft', NULL, 'Q45775', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dutch Miniature', NULL, 'Q21008213', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dutch Warmblood', '荷蘭溫血馬', 'Q1468737', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dutch harness horse', NULL, 'Q5317450', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dzhab', NULL, 'Q4160688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dølehest', '德勒赫斯特馬', 'Q749070', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Dülmener', NULL, 'Q523878', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'East Bulgarian', NULL, 'Q3658161', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Edelbluthaflinger', NULL, 'Q1283242', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Edles Warmblut', NULL, 'Q1285445', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Egyptian Arabian', NULL, 'Q10480320', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Einsiedler', NULL, 'Q55465308', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Emscherbrücher', NULL, 'Q1339662', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'English Halfblut', NULL, 'Q106245358', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Eriskay Pony', NULL, 'Q2246627', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Erlenbach horse', NULL, 'Q16539040', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Esperia Pony', NULL, 'Q952024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Estonian Draft', NULL, 'Q10489232', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Estonian Sport Horse', NULL, 'Q56308925', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Estonian horse', NULL, 'Q1370382', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Exmoor pony', '凱爾特矮種馬', 'Q971182', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Falabella', '法拉貝拉馬', 'Q613922', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Faroe pony', NULL, 'Q549091', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Fell pony', '費爾小型馬', 'Q946221', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ferghana horse', '汗血馬', 'Q1151796', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Finnhorse', '芬蘭馬', 'Q1001507', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Finnish Warmblood', NULL, 'Q13570672', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Fjord horse', '挪威峽灣馬', 'Q857040', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Flemish Horse', NULL, 'Q2962962', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Fleuve', NULL, 'Q23301444', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Florida Cracker Horse', NULL, 'Q2682498', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Foutanké', 'fouta', 'Q2734946', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Frederiksborg horse', '腓特烈堡馬', 'Q288482', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Freiberger', '弗朗什‒蒙塔涅斯馬', 'Q673441', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'French Anglo Arab', NULL, 'Q7029480', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'French Saddle Pony', NULL, 'Q3396204', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'French Trotter', '法國小跑馬', 'Q1452492', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Friesian Sporthorse', '弗里斯蘭運動馬', 'Q5504460', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Friesian horse', '弗里斯蘭馬', 'Q388952', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Furioso-North Star', NULL, 'Q655269', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Galiceno', NULL, 'Q1428661', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Galician Pony', NULL, 'Q3047733', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Galloway pony', NULL, 'Q5230023', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Galshar', NULL, 'Q56301777', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Garrano', '加拉諾馬', 'Q257478', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gayoe', NULL, 'Q3099678', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gelderland horse', '海爾德蘭馬', 'Q1008894', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gemlik', NULL, 'Q30765776', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Georgian Grande Horse', NULL, 'Q5548019', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'German Classic Pony', NULL, 'Q444304', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'German Part-bred Shetland Pony', NULL, 'Q1205877', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'German Riding Pony', NULL, 'Q959446', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'German Trotter', NULL, 'Q131405219', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'German Warmblood', NULL, 'Q1206002', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Giara horse', NULL, 'Q1522758', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gidran', NULL, 'Q285445', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Golden American Saddlebred', NULL, 'Q10507012', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Goonhilly', NULL, 'Q57416589', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gotland Pony', '哥特蘭矮種馬', 'Q1027725', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Groningen horse', '格羅寧根馬', 'Q1547347', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Guangxi', NULL, 'Q4848667', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Guba', NULL, 'Q1304225', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Guizhou pony', NULL, 'Q5616956', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Gypsy Vanner horse', '吉普賽馬', 'Q516970', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hack horses', NULL, 'Q1567117', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hackney horse', '哈克尼馬', 'Q635926', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hackney pony', '哈克尼矮馬', 'Q3112880', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Haflinger', '哈福林格馬', 'Q609630', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Half-bred horses of Dombes', NULL, 'Q3416037', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hanoverian horse', '漢諾威馬', 'Q1501738', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hebridean pony', NULL, 'Q10518891', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Heck horse', '海克馬', 'Q1593072', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hegardt Horse', NULL, 'Q16357561', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Heihe horse', NULL, 'Q5699153', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Henan', NULL, 'Q60832226', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Henson horse', NULL, 'Q3133284', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hequ horse', '河曲馬', 'Q10522273', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Herati', NULL, 'Q104635450', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hessisches Warmblut', NULL, 'Q203017', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Highland pony', '高地小馬', 'Q1617933', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hirzai', NULL, 'Q5771894', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hispano-Bretón', NULL, 'Q3816660', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hispano-Árabe', NULL, 'Q1620679', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hokkaido Pony', '道產子', 'Q1129904', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Holsteiner horse', '荷爾斯泰因馬', 'Q571149', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hrvatski toplokrvnjak', NULL, 'Q55078175', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hucul pony', '胡克爾馬', 'Q733396', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hungarian Sport Horse', NULL, 'Q1162521', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hutovo-Blato', NULL, 'Q106232206', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Hınıs', NULL, 'Q6964775', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Iberoamericano', NULL, 'Q17590879', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Icelandic horse', '冰島馬', 'Q262924', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Indian Country Bred', NULL, 'Q6020111', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Indian Half-Bred', NULL, 'Q4068833', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Indonesian Racing Horse', NULL, 'Q25383219', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Iomud', NULL, 'Q606912', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Iranian Arabian', NULL, 'Q10624485', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Irish Draught', '愛爾蘭挽馬', 'Q1672841', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Irish Hobby', NULL, 'Q3040564', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Irish Pony', NULL, 'Q115559024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Irish Sport Horse', NULL, 'Q1665430', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Irish cob', NULL, 'Q115558917', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Israeli Local Horse', NULL, 'Q16539056', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Italian Heavy Draft', NULL, 'Q954597', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Italian trotter', NULL, 'Q3540808', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jaca Navarra', NULL, 'Q3157059', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jaf', NULL, 'Q11716031', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Japanese Miniature Horse', NULL, 'Q105365084', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Japanese Pony', NULL, 'Q105365643', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Japanese Riding Horse', NULL, 'Q105365560', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Japanese Sport Horse', NULL, 'Q105365409', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jata', NULL, 'Q60848678', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Java Pony', NULL, 'Q1684157', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Javakhuri Harness Horse', NULL, 'Q56320400', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jeju horse', '濟州馬', 'Q2962169', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jianchang', '建昌馬', 'Q21658879', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jilin', NULL, 'Q21658880', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jinjiang', '晉江馬', 'Q11089376', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jofi', NULL, 'Q104587237', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Jutland horse', NULL, 'Q1684175', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kabarda horse', NULL, 'Q327058', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kachchhi-Sindhit', NULL, 'Q124350194', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kafa', NULL, 'Q56305294', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kaimanawa horse', NULL, 'Q3191969', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kajlan', NULL, 'Q60848661', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kalmyk horse', NULL, 'Q7711671', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kandachime', NULL, 'Q11457439', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karabair', NULL, 'Q1728868', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karabakh horse', NULL, 'Q748655', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karacabey horse', NULL, 'Q3192903', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karachay horse', NULL, 'Q4214444', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karelian horse', NULL, 'Q57416424', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Karst horse', NULL, 'Q113495559', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kathiawari', '卡提阿瓦馬', 'Q1105488', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kazakh horse', '哈薩克馬', 'Q1737477', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kentucky Mountain Saddle Horse', '肯塔基山地騎乘馬', 'Q917234', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kerry Bog Pony', NULL, 'Q3031152', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kiger Mustang', NULL, 'Q2033384', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kinsky horse', NULL, 'Q1327356', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kisber Felver', NULL, 'Q247126', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kiso', '木曾馬', 'Q3396189', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kladruber', '克拉德魯伯馬', 'Q1573904', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Knabstrupper', '納布斯楚珀馬', 'Q1776843', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kohband', NULL, 'Q104638411', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Konik', '柯尼克波蘭小馬', 'Q206557', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kuc felinski', NULL, 'Q11750693', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kundido horse', NULL, 'Q19544915', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kuningan', NULL, 'Q28032993', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kurdish horse', NULL, 'Q30749697', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kushum', NULL, 'Q1794559', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kustanair', NULL, 'Q928206', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kuznet', NULL, 'Q4244865', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Kyrgyz Horse', NULL, 'Q3197329', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'La Hague horse', NULL, 'Q57396208', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lac La Croix Indian Pony', NULL, 'Q3396205', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Landais pony', NULL, 'Q910340', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lao', NULL, 'Q58307765', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Latvian horse', NULL, 'Q930158', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lavradeiro', NULL, 'Q30937261', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lesbos horse', NULL, 'Q56300081', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Liebenthaler', NULL, 'Q10561413', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lijiang pony', NULL, 'Q6547011', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Limousin horse', NULL, 'Q2962963', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lincolnshire Dray Horse', NULL, 'Q134173680', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lipizzaner', '利皮贊馬', 'Q217671', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lippitt Morgan', NULL, 'Q65153831', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lithuanian Heavy Draught', NULL, 'Q1567310', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ljutomer Trotter', NULL, 'Q56303296', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lofoten pony', NULL, 'Q125462643', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lokai', NULL, 'Q248295', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lombok Pony', NULL, 'Q22009294', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Losino horse', NULL, 'Q3259807', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lundy', NULL, 'Q2381430', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Lusitano', '盧西塔諾馬', 'Q937595', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Luxembourg Warmblood', NULL, 'Q21008211', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'M''Bayar', NULL, 'Q2424191', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'M''Par', NULL, 'Q25060015', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Maine', NULL, 'Q56863148', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Makassar', NULL, 'Q57416671', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Malakan', NULL, 'Q39076316', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mallorquín', NULL, 'Q804888', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Malopolski', NULL, 'Q3063148', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mangalarga', NULL, 'Q954107', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mangalarga Marchador', NULL, 'Q180552', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Manipuri pony', NULL, 'Q6749849', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Manx', NULL, 'Q104828074', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Maremmano', NULL, 'Q1894708', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Marismeño', NULL, 'Q6765615', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Marwari horse', '馬爾瓦里', 'Q202616', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mazari', NULL, 'Q104635429', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'McCurdy Plantation Horse', NULL, 'Q107573844', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mecklenburger', NULL, 'Q1502781', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Menorquín horse', NULL, 'Q1777854', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Merak-Saktenpata', NULL, 'Q25381025', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Merlerault horse', NULL, 'Q57416212', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Messara', NULL, 'Q906428', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mezen horse', NULL, 'Q18293821', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Međimurje horse', NULL, 'Q15074171', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Miniature Shetland pony', NULL, 'Q1936983', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Miquelon horse', NULL, 'Q46998024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Misaki', NULL, 'Q517359', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Missouri Fox Trotter', '密蘇里狐步馬', 'Q1759668', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Miyako horse', '宮古馬', 'Q580658', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Monchino', NULL, 'Q3751412', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mongolian horse', '蒙古馬', 'Q1195193', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Montana Traveler', NULL, 'Q3322423', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Monterufolino', NULL, 'Q1424315', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Morab', NULL, 'Q1800149', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Morgan horse', '摩根馬', 'Q1179217', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Morna', NULL, 'Q60848645', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Morocco Spotted Horse', NULL, 'Q10589202', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mossi', NULL, 'Q100502686', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mountain Pleasure Horse', NULL, 'Q22286238', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Moyle horse', NULL, 'Q3327025', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Muniqi', NULL, 'Q30749739', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Murgese', NULL, 'Q1953691', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Myngad', NULL, 'Q56301806', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Mérens horse', '梅朗斯馬', 'Q605306', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Namaqua', NULL, 'Q106245160', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Namaqua Pony', NULL, 'Q97585924', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Namib Desert Horse', NULL, 'Q316038', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nangchen horse', '囊謙馬', 'Q2962932', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Narragansett Pacer', '納拉甘西特順邊馬', 'Q3336123', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Narym Pony', NULL, 'Q3336163', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'National Show Horse', NULL, 'Q3336940', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Navarrin horse', '納瓦爾種馬', 'Q2962973', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Neapolitan horse', '那不勒斯馬', 'Q916364', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'New Forest pony', NULL, 'Q1469817', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Newfoundland pony', NULL, 'Q33333', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nez Perce Horse', '內茲珀斯馬', 'Q2962951', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ngua Noi', NULL, 'Q16480453', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nisean horse', NULL, 'Q7040219', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nivernais horse', NULL, 'Q3342285', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nokota horse', NULL, 'Q529139', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Noma pony', NULL, 'Q3034120', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nonius horse', NULL, 'Q600108', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nooitgedacht pony', NULL, 'Q3343392', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Nordlandshest/Lyngshest', NULL, 'Q3044064', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Norfolk Trotter', '諾福克快步馬', 'Q3030340', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Noriker horse', '諾里克馬', 'Q1390589', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Norman Cob', NULL, 'Q1703923', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'North American Single-Footing Horse', NULL, 'Q22286429', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'North American Spotted Draft Horse', NULL, 'Q107531631', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'North Swedish Horse', '北瑞典馬', 'Q175171', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'NorthAmerican Sportpony', NULL, 'Q7053593', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Northeastern horse', NULL, 'Q50840788', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Novokirghiz', NULL, 'Q3345528', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Novoolexandrian Draught', NULL, 'Q55322201', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ob pony', NULL, 'Q3347900', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Oberlander horse', NULL, 'Q3347946', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Old English Black', NULL, 'Q3350189', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Oldenburg horse', NULL, 'Q166777', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ondorshil', NULL, 'Q58309289', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Oran Barb', NULL, 'Q112842634', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Orlov Trotter', '奧爾洛夫小跑馬', 'Q516612', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Orlov-Rostopchin Sport Horse', NULL, 'Q4400446', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ostfriesen and Alt-Oldenburger', '奧斯特弗裡森和艾爾特-奧爾登堡馬', 'Q432976', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pahlavan', NULL, 'Q107125316', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Palatinate-Ardennes', NULL, 'Q22623', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pampa Horse', NULL, 'Q2962902', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Panje', NULL, 'Q2049536', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pantaneiro', NULL, 'Q3362455', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Paraguayan Criollo', NULL, 'Q50826153', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Paso Fino', '巴蘇馬', 'Q636775', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Patibarcina', NULL, 'Q56304401', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Peneia Pony', NULL, 'Q1819727', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pentro horse', NULL, 'Q2962933', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Percheron', '佩爾什馬', 'Q1232528', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Persano horse', NULL, 'Q3900138', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Persian plateau horse', NULL, 'Q30749725', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Peruvian Paso', '秘魯帕索馬', 'Q76962', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Petiso Argentino', NULL, 'Q3377024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pindos Pony', NULL, 'Q94070', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pinkafö', NULL, 'Q68918710', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pintabian', NULL, 'Q623782', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pirenenc Català', NULL, 'Q21030977', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pleven horse', NULL, 'Q3622878', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Podveleski', NULL, 'Q106231503', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Poitevin horse', NULL, 'Q250799', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Polesskaya horse', NULL, 'Q52063251', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Polish Arabian horse', NULL, 'Q60521871', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Polish Coldblood', NULL, 'Q11822656', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Polish Halfbred Horse', NULL, 'Q55979203', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Polish Riding Pony', NULL, 'Q60852968', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Poney de selle belge', NULL, 'Q28656918', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Poney du Logone', NULL, 'Q385628', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pony of the Americas', '美洲小馬', 'Q1149746', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Posavac horse', NULL, 'Q1632550', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pottok', NULL, 'Q1890204', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pryor Mountain Mustang', NULL, 'Q7253272', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pura Raza Española', NULL, 'Q693336', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Purosangue Orientale', NULL, 'Q3925977', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Pónei da Terceira', NULL, 'Q3396198', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Qatgani', NULL, 'Q3412447', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Qazal', NULL, 'Q104638279', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Quarab', NULL, 'Q631742', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Quarter pony', NULL, 'Q7269269', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Racking horse', NULL, 'Q847090', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Retuerta horse', NULL, 'Q2839815', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rhenish-German Cold-Blood', NULL, 'Q1477772', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rhinelander horse', NULL, 'Q372084', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rhodos pony', NULL, 'Q56305247', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Riding Pony', NULL, 'Q4412725', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Riwoche horse', '類烏齊馬', 'Q279781', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rocky Mountain Horse', NULL, 'Q304702', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rodope horse', NULL, 'Q56305201', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Romanian Sporthorse', NULL, 'Q7362578', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Romanian Trotter', NULL, 'Q56318547', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Romanian draft horse', NULL, 'Q48815066', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Rottaler', NULL, 'Q2168973', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Russian Don', NULL, 'Q1153736', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Russian Heavy Draft', '俄羅斯重草馬', 'Q1428389', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Russian Trotter', NULL, 'Q2177186', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sable Island Pony', '塞布林島馬', 'Q1481264', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sachsen-Anhaltiner Warmblut', NULL, 'Q104529408', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Salerno horse', NULL, 'Q931385', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Samand', NULL, 'Q104638297', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Samolaco horse', NULL, 'Q7410017', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'San Fratello horse', NULL, 'Q2411022', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sandalwood Pony', NULL, 'Q2139019', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sarcidano horse', NULL, 'Q3663935', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sardinian Anglo-Arab', NULL, 'Q1299835', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Schleswig horse', NULL, 'Q665180', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Selale', NULL, 'Q50281578', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sella Italiano', NULL, 'Q428039', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Selle Français', NULL, 'Q1070901', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Senner', NULL, 'Q2271184', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shagya Arabian', NULL, 'Q654338', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shan Horse', NULL, 'Q25394905', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shandan horse', NULL, 'Q21658898', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shetland pony', '設德蘭矮種馬', 'Q214720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shire horse', '夏爾馬', 'Q40728', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Shishan', NULL, 'Q115563273', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Siciliano indigeno', NULL, 'Q1405325', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Silesian horse', NULL, 'Q3887213', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sistani', NULL, 'Q137351660', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Skyros Pony', NULL, 'Q1723604', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Slovak Warmblood', NULL, 'Q47341194', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Slovenian Cold-blood', NULL, 'Q63845505', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Slovenian warmblood', NULL, 'Q50003252', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sokolsky horse', NULL, 'Q607258', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sorraia', '索拉亞馬', 'Q927650', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'South African Miniature', NULL, 'Q65145634', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'South African Saddlehorse', NULL, 'Q65145965', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'South African Warmblood', NULL, 'Q60847426', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Soviet Heavy Draft', NULL, 'Q2043450', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spanish Jennet Horse', '西班牙珍妮特馬', 'Q7573235', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spanish Mustang', NULL, 'Q3328902', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spanish Sport Horse', NULL, 'Q5737882', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spanish Trotter', NULL, 'Q16681303', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spanish-Norman horse', '西班牙-諾曼馬', 'Q7573129', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spiti Horse', '斯皮蒂馬', 'Q20817994', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sport Horse Breeding of Great Britain', NULL, 'Q108104154', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Spotted Saddle horse', NULL, 'Q3494202', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sri Lankan pony', NULL, 'Q25381104', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Standardbred', '標準馬', 'Q467024', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Stara Planina', NULL, 'Q12274319', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Strelets', NULL, 'Q10681661', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Studbook La Silla', NULL, 'Q77255176', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sudan Country-Bred', NULL, 'Q56318712', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Suffolk Punch', '薩福克馬', 'Q788030', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sulphur', NULL, 'Q107548129', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sumbawa Pony', NULL, 'Q919647', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Swedish Ardennes', NULL, 'Q2860721', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Swedish Warmblood', NULL, 'Q1111861', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Swiss Pony', NULL, 'Q11744810', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Swiss Warmblood', NULL, 'Q676115', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Sztumski', NULL, 'Q124331104', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Taishuh', '對州馬', 'Q3030606', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tanghan', NULL, 'Q106256394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tatar Pony', NULL, 'Q10691358', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tattu', NULL, 'Q106255722', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tawleed', NULL, 'Q7689300', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tennessee Walking Horse', '田納西走馬', 'Q1708738', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tersk horse', NULL, 'Q1280354', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tes', NULL, 'Q56301789', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Thai Pony', NULL, 'Q20493063', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Thoroughbred', '純種馬', 'Q210826', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tibetan pony', '藏馬', 'Q1892822', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tiger horse', '虎馬', 'Q3528307', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Timor Pony', '帝汶馬', 'Q739107', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tokara horse', NULL, 'Q904899', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tolfetano', NULL, 'Q3530581', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tori horse', NULL, 'Q1363090', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Trait du Nord', NULL, 'Q1432465', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Trakehner', '特雷克納', 'Q843585', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Trochador', NULL, 'Q50406210', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Trote y Galope', NULL, 'Q50415398', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Trotter-type Finnhorse', NULL, 'Q104531751', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Turkish Arabian horse', NULL, 'Q30749691', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Turkoman horse', NULL, 'Q2460049', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tusheti horse', NULL, 'Q12865144', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tuva', '圖瓦馬', 'Q21890474', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Tuva Harness Horse', NULL, 'Q21890471', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ujumqin', NULL, 'Q58381284', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ukrainian Riding Horse', NULL, 'Q646188', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Unmol Horse', NULL, 'Q3551917', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Uruguayan Criollo', NULL, 'Q50819352', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ushi-uma', NULL, 'Q11288883', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Uzunyayla', NULL, 'Q3552821', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Venezuelan Criollo', NULL, 'Q50798197', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Ventasso horse', NULL, 'Q2962956', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Virginia Highlander', NULL, 'Q3560695', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Vlaamperd', NULL, 'Q951720', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Vladimir Heavy Draft', NULL, 'Q2298984', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Voronej', NULL, 'Q4087547', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Vyatka horse', NULL, 'Q2987038', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Waler horse', NULL, 'Q663694', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Walkaloosa', '步態盧薩馬', 'Q3565394', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Warlander', '沃蘭德馬', 'Q7969488', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Waziri', NULL, 'Q56216319', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Welara', NULL, 'Q1742067', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Welsh Mountain Pony', NULL, 'Q18562203', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Welsh Pony and Cob', '威爾斯矮種馬', 'Q1096752', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Welsh Pony of Cob Type', NULL, 'Q10719570', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Welsh cob', NULL, 'Q2748830', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Wenshan', NULL, 'Q60833828', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Western Sudan pony', NULL, 'Q3396202', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Westphalian Pony', NULL, 'Q104524541', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Westphalian horse', NULL, 'Q195395', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Wielkopolski', NULL, 'Q1460188', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Wild horses of Livno', NULL, 'Q12635582', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Windsor Grey', NULL, 'Q8024613', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Württemberger', NULL, 'Q551732', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Xilingol horse', '錫林郭勒馬', 'Q8044438', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yabu', NULL, 'Q56310298', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yakutian horse', '雅庫特馬', 'Q2424289', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yargha', NULL, 'Q104638288', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yili horse', NULL, 'Q8053600', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yonaguni horse', '與那國馬', 'Q2569531', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yorkshire Coach Horse', NULL, 'Q8055688', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yushu', '玉樹馬', 'Q22009882', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Yuta horse', '尤塔馬', 'Q25394891', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zabaikal', NULL, 'Q20492957', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zangersheide', NULL, 'Q146898', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zaniskari', '藏斯卡馬', 'Q3062589', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zanthe horse', NULL, 'Q56305240', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zhongdian', NULL, 'Q58307781', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Zweibrücker', NULL, 'Q232350', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'castilian horse', NULL, 'Q2941429', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'mustang', '美洲野馬', 'Q211848', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'tatar horse', NULL, 'Q116710876', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'warmblood trotter', NULL, 'Q11880004', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Çukurova', NULL, 'Q28033221', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
INSERT INTO breeds (taxon_id, name_en, name_zh, wikidata_id, source) VALUES (2440886, 'Žemaitukas', NULL, 'Q393792', 'wikidata')
ON CONFLICT (taxon_id, name_en) DO UPDATE SET wikidata_id = EXCLUDED.wikidata_id, source = EXCLUDED.source, name_zh = COALESCE(EXCLUDED.name_zh, breeds.name_zh);
