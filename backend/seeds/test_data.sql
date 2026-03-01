-- ============================================================
-- VTaxon 分類樹測試資料
-- 用途：驗證分類樹瀏覽功能（截斷、複合種、邊界情況等）
-- 清除：執行 cleanup_test_data.sql 即可一鍵移除
-- ============================================================

-- ============================================================
-- 1. species_cache — 物種快取（ON CONFLICT DO NOTHING）
-- ============================================================

INSERT INTO species_cache (taxon_id, scientific_name, common_name_en, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus, path_zh) VALUES
-- 犬科 Canidae
(5219173, 'Canis lupus',          'Gray Wolf',       '灰狼',   'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus',          'Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis',           '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'),
(5219174, 'Canis lupus familiaris','Domestic Dog',    '家犬',   'SUBSPECIES', 'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus|Canis lupus familiaris','Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis', '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'),
(5219243, 'Vulpes vulpes',        'Red Fox',         '赤狐',   'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes vulpes',       'Animalia','Chordata','Mammalia','Carnivora','Canidae','Vulpes',          '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"狐屬"}'),
(5219252, 'Vulpes lagopus',       'Arctic Fox',      '北極狐', 'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes lagopus',      'Animalia','Chordata','Mammalia','Carnivora','Canidae','Vulpes',          '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"狐屬"}'),

-- 貓科 Felidae
(2435099, 'Felis catus',          'Domestic Cat',    '家貓',   'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus',          'Animalia','Chordata','Mammalia','Carnivora','Felidae','Felis',           '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"貓屬"}'),
(5219436, 'Panthera leo',         'Lion',            '獅',     'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera leo',       'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'),
(5219404, 'Panthera tigris',      'Tiger',           '虎',     'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera tigris',    'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'),
(5219426, 'Panthera pardus',      'Leopard',         '豹',     'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera pardus',    'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'),
(2435146, 'Acinonyx jubatus',     'Cheetah',         '獵豹',   'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Acinonyx|Acinonyx jubatus',  'Animalia','Chordata','Mammalia','Carnivora','Felidae','Acinonyx',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"獵豹屬"}'),
(2435168, 'Lynx lynx',            'Eurasian Lynx',   '猞猁',   'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Lynx|Lynx lynx',             'Animalia','Chordata','Mammalia','Carnivora','Felidae','Lynx',            '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"猞猁屬"}'),
(5219368, 'Panthera onca',        'Jaguar',          '美洲豹', 'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera onca',     'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'),
(2435190, 'Puma concolor',        'Cougar',          '美洲獅', 'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Felidae|Puma|Puma concolor',          'Animalia','Chordata','Mammalia','Carnivora','Felidae','Puma',            '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"美洲獅屬"}'),

-- 鳥綱 Aves
(9103371, 'Gallus gallus domesticus','Chicken',      '雞',     'SUBSPECIES', 'Animalia|Chordata|Aves|Galliformes|Phasianidae|Gallus|Gallus gallus|Gallus gallus domesticus','Animalia','Chordata','Aves','Galliformes','Phasianidae','Gallus',  '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"雞形目","family":"雉科","genus":"原雞屬"}'),
(2480016, 'Melopsittacus undulatus','Budgerigar',     '虎皮鸚鵡','SPECIES',   'Animalia|Chordata|Aves|Psittaciformes|Psittacidae|Melopsittacus|Melopsittacus undulatus','Animalia','Chordata','Aves','Psittaciformes','Psittacidae','Melopsittacus', '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"鸚形目","family":"鸚鵡科","genus":null}'),
(2497546, 'Bubo bubo',            'Eurasian Eagle-Owl','雕鴞', 'SPECIES',    'Animalia|Chordata|Aves|Strigiformes|Strigidae|Bubo|Bubo bubo',            'Animalia','Chordata','Aves','Strigiformes','Strigidae','Bubo',           '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"鴞形目","family":"鴟鴞科","genus":"鵰鴞屬"}'),
(2481660, 'Aptenodytes forsteri', 'Emperor Penguin',  '皇帝企鵝','SPECIES',  'Animalia|Chordata|Aves|Sphenisciformes|Spheniscidae|Aptenodytes|Aptenodytes forsteri','Animalia','Chordata','Aves','Sphenisciformes','Spheniscidae','Aptenodytes', '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"企鵝目","family":"企鵝科","genus":"王企鵝屬"}'),

-- 爬蟲綱 Reptilia
(2470630, 'Varanus komodoensis',  'Komodo Dragon',   '科莫多龍','SPECIES',   'Animalia|Chordata|Reptilia|Squamata|Varanidae|Varanus|Varanus komodoensis','Animalia','Chordata','Reptilia','Squamata','Varanidae','Varanus',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"爬蟲綱","order":"有鱗目","family":"巨蜥科","genus":"巨蜥屬"}'),
(5220203, 'Chelonia mydas',       'Green Sea Turtle', '綠蠵龜', 'SPECIES',   'Animalia|Chordata|Reptilia|Testudines|Cheloniidae|Chelonia|Chelonia mydas','Animalia','Chordata','Reptilia','Testudines','Cheloniidae','Chelonia',     '{"kingdom":"動物界","phylum":"脊索動物門","class":"爬蟲綱","order":"龜鱉目","family":"海龜科","genus":"海龜屬"}'),

-- 植物界 Plantae
(2917691, 'Citrus reticulata',    'Mandarin Orange',  '柑橘',  'SPECIES',    'Plantae|Tracheophyta|Magnoliopsida|Sapindales|Rutaceae|Citrus|Citrus reticulata','Plantae','Tracheophyta','Magnoliopsida','Sapindales','Rutaceae','Citrus',     '{"kingdom":"植物界","phylum":"維管束植物門","class":"木蘭綱","order":"無患子目","family":"芸香科","genus":"柑橘屬"}'),
(3020642, 'Prunus serrulata',     'Japanese Cherry',   '櫻花',  'SPECIES',    'Plantae|Tracheophyta|Magnoliopsida|Rosales|Rosaceae|Prunus|Prunus serrulata','Plantae','Tracheophyta','Magnoliopsida','Rosales','Rosaceae','Prunus',          '{"kingdom":"植物界","phylum":"維管束植物門","class":"木蘭綱","order":"薔薇目","family":"薔薇科","genus":"李屬"}'),
(3119195, 'Helianthus annuus',    'Common Sunflower',  '向日葵','SPECIES',    'Plantae|Tracheophyta|Magnoliopsida|Asterales|Asteraceae|Helianthus|Helianthus annuus','Plantae','Tracheophyta','Magnoliopsida','Asterales','Asteraceae','Helianthus', '{"kingdom":"植物界","phylum":"維管束植物門","class":"木蘭綱","order":"菊目","family":"菊科","genus":"向日葵屬"}'),

-- 昆蟲綱 Insecta
(1311477, 'Apis mellifera',       'Western Honey Bee', '西方蜜蜂','SPECIES',  'Animalia|Arthropoda|Insecta|Hymenoptera|Apidae|Apis|Apis mellifera',       'Animalia','Arthropoda','Insecta','Hymenoptera','Apidae','Apis',          '{"kingdom":"動物界","phylum":"節肢動物門","class":"昆蟲綱","order":"膜翅目","family":"蜜蜂科","genus":"蜜蜂屬"}'),
(5137108, 'Papilio machaon',      'Old World Swallowtail','鳳蝶','SPECIES',   'Animalia|Arthropoda|Insecta|Lepidoptera|Papilionidae|Papilio|Papilio machaon','Animalia','Arthropoda','Insecta','Lepidoptera','Papilionidae','Papilio', '{"kingdom":"動物界","phylum":"節肢動物門","class":"昆蟲綱","order":"鱗翅目","family":"鳳蝶科","genus":"鳳蝶屬"}'),

-- 犬科補充（用於分散25名使用者）
(5219237, 'Canis latrans',        'Coyote',           '郊狼',  'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis latrans',        'Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis',           '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'),
(5219289, 'Nyctereutes procyonoides','Raccoon Dog',   '貉',    'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Nyctereutes|Nyctereutes procyonoides','Animalia','Chordata','Mammalia','Carnivora','Canidae','Nyctereutes', '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"貉屬"}'),
(5219303, 'Lycaon pictus',        'African Wild Dog',  '非洲野犬','SPECIES',  'Animalia|Chordata|Mammalia|Carnivora|Canidae|Lycaon|Lycaon pictus',       'Animalia','Chordata','Mammalia','Carnivora','Canidae','Lycaon',          '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"非洲野犬屬"}'),
(5219354, 'Chrysocyon brachyurus','Maned Wolf',        '鬃狼',  'SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Chrysocyon|Chrysocyon brachyurus','Animalia','Chordata','Mammalia','Carnivora','Canidae','Chrysocyon',    '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"鬃狼屬"}'),
(5219262, 'Vulpes zerda',         'Fennec Fox',        '耳廓狐','SPECIES',    'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes zerda',        'Animalia','Chordata','Mammalia','Carnivora','Canidae','Vulpes',          '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"狐屬"}'),

-- ======= 科/屬層級測試（較高分類階層） =======
-- 犬科 Canidae（FAMILY 級）
(9701,    'Canidae',              'Dogs',              '犬科',  'FAMILY',     'Animalia|Chordata|Mammalia|Carnivora|Canidae',                            'Animalia','Chordata','Mammalia','Carnivora','Canidae', NULL,             '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科"}'),
-- 貓科 Felidae（FAMILY 級）
(9703,    'Felidae',              'Cats',              '貓科',  'FAMILY',     'Animalia|Chordata|Mammalia|Carnivora|Felidae',                            'Animalia','Chordata','Mammalia','Carnivora','Felidae', NULL,             '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科"}'),
-- 熊科 Ursidae（FAMILY 級）
(9678,    'Ursidae',              'Bears',             '熊科',  'FAMILY',     'Animalia|Chordata|Mammalia|Carnivora|Ursidae',                            'Animalia','Chordata','Mammalia','Carnivora','Ursidae', NULL,             '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"熊科"}'),
-- 犬屬 Canis（GENUS 級）
(2435098, 'Canis',                NULL,                '犬屬',  'GENUS',      'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis',                      'Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis',           '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'),
-- 豹屬 Panthera（GENUS 級）
(2435194, 'Panthera',             NULL,                '豹屬',  'GENUS',      'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera',                   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',        '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'),
-- 鴉科 Corvidae（FAMILY 級）— 鳥綱新科
(5264,    'Corvidae',             'Crows and Jays',    '鴉科',  'FAMILY',     'Animalia|Chordata|Aves|Passeriformes|Corvidae',                           'Animalia','Chordata','Aves','Passeriformes','Corvidae', NULL,            '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"雀形目","family":"鴉科"}'),
-- 食肉目 Carnivora（ORDER 級）
(732,     'Carnivora',            'Carnivores',        '食肉目','ORDER',      'Animalia|Chordata|Mammalia|Carnivora',                                    'Animalia','Chordata','Mammalia','Carnivora', NULL, NULL,                 '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目"}')
ON CONFLICT (taxon_id) DO NOTHING;


-- ============================================================
-- 2. users — 測試使用者（organization = '__TEST__'）
-- ============================================================

INSERT INTO users (id, display_name, avatar_url, role, organization, country_flags) VALUES
-- 犬科使用者（25 個，測試 >20 截斷）
('00000000-7e57-0001-0000-000000000001', '狼星 WolfStar',       'https://i.pravatar.cc/150?u=test01', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000002', '銀狼 SilverWolf',     'https://i.pravatar.cc/150?u=test02', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0001-0000-000000000003', '嚎月 Howler',         'https://i.pravatar.cc/150?u=test03', 'user', '__TEST__', '["us"]'),
('00000000-7e57-0001-0000-000000000004', '北極星 Polaris',       'https://i.pravatar.cc/150?u=test04', 'user', '__TEST__', '["ca"]'),
('00000000-7e57-0001-0000-000000000005', '小柴 Shiba',          'https://i.pravatar.cc/150?u=test05', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0001-0000-000000000006', '赤狐醬 RedFox',       'https://i.pravatar.cc/150?u=test06', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000007', '白狐 WhiteFox',       'https://i.pravatar.cc/150?u=test07', 'user', '__TEST__', '["kr"]'),
('00000000-7e57-0001-0000-000000000008', '郊狼小隊 CoyoteSquad', 'https://i.pravatar.cc/150?u=test08', 'user', '__TEST__', '["us"]'),
('00000000-7e57-0001-0000-000000000009', '野犬族 WildPack',     'https://i.pravatar.cc/150?u=test09', 'user', '__TEST__', '["za"]'),
('00000000-7e57-0001-0000-000000000010', '毛毛 Fluffy',         'https://i.pravatar.cc/150?u=test10', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000011', '阿柴二號 ShibaII',    'https://i.pravatar.cc/150?u=test11', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0001-0000-000000000012', '貉子 Tanuki',         'https://i.pravatar.cc/150?u=test12', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0001-0000-000000000013', '鬃狼大叔 ManedUncle', 'https://i.pravatar.cc/150?u=test13', 'user', '__TEST__', '["br"]'),
('00000000-7e57-0001-0000-000000000014', '耳廓狐 Fennec',       'https://i.pravatar.cc/150?u=test14', 'user', '__TEST__', '["eg"]'),
('00000000-7e57-0001-0000-000000000015', '狼影 WolfShadow',     'https://i.pravatar.cc/150?u=test15', 'user', '__TEST__', '["de"]'),
('00000000-7e57-0001-0000-000000000016', '月牙狼 Crescent',     'https://i.pravatar.cc/150?u=test16', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000017', '犬神 Inugami',        'https://i.pravatar.cc/150?u=test17', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0001-0000-000000000018', '柯基王 CorgiKing',    'https://i.pravatar.cc/150?u=test18', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-0001-0000-000000000019', '雪狐 SnowFox',        'https://i.pravatar.cc/150?u=test19', 'user', '__TEST__', '["fi"]'),
('00000000-7e57-0001-0000-000000000020', '獵犬 Hunter',         'https://i.pravatar.cc/150?u=test20', 'user', '__TEST__', '["au"]'),
('00000000-7e57-0001-0000-000000000021', '狗勾 Doggo',          'https://i.pravatar.cc/150?u=test21', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000022', '黑狼 DarkWolf',       'https://i.pravatar.cc/150?u=test22', 'user', '__TEST__', '["us"]'),
('00000000-7e57-0001-0000-000000000023', '浪浪 Stray',          'https://i.pravatar.cc/150?u=test23', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0001-0000-000000000024', '拉不拉多 LabraDog',   'https://i.pravatar.cc/150?u=test24', 'user', '__TEST__', '["us"]'),
('00000000-7e57-0001-0000-000000000025', '秋田犬 AkitaInu',     'https://i.pravatar.cc/150?u=test25', 'user', '__TEST__', '["jp"]'),

-- 貓科使用者（10 個）
('00000000-7e57-0002-0000-000000000001', '貓貓 Neko',           'https://i.pravatar.cc/150?u=test26', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0002-0000-000000000002', '獅心 LionHeart',      'https://i.pravatar.cc/150?u=test27', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-0002-0000-000000000003', '白虎 WhiteTiger',     'https://i.pravatar.cc/150?u=test28', 'user', '__TEST__', '["cn"]'),
('00000000-7e57-0002-0000-000000000004', '黑豹 BlackPanther',   'https://i.pravatar.cc/150?u=test29', 'user', '__TEST__', '["us"]'),
('00000000-7e57-0002-0000-000000000005', '閃電豹 Lightning',    'https://i.pravatar.cc/150?u=test30', 'user', '__TEST__', '["ke"]'),
('00000000-7e57-0002-0000-000000000006', '山貓 Lynx',           'https://i.pravatar.cc/150?u=test31', 'user', '__TEST__', '["se"]'),
('00000000-7e57-0002-0000-000000000007', '美洲獅 Puma',         'https://i.pravatar.cc/150?u=test32', 'user', '__TEST__', '["ar"]'),
('00000000-7e57-0002-0000-000000000008', '虎紋 Stripes',        'https://i.pravatar.cc/150?u=test33', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0002-0000-000000000009', '美洲豹 Jaguar',       'https://i.pravatar.cc/150?u=test34', 'user', '__TEST__', '["mx"]'),
('00000000-7e57-0002-0000-000000000010', '三花貓 Calico',       'https://i.pravatar.cc/150?u=test35', 'user', '__TEST__', '["tw"]'),

-- 鳥綱使用者（5 個）
('00000000-7e57-0003-0000-000000000001', '小雞 Chicky',         'https://i.pravatar.cc/150?u=test36', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0003-0000-000000000002', '鸚鵡學舌 Parrot',     'https://i.pravatar.cc/150?u=test37', 'user', '__TEST__', '["au"]'),
('00000000-7e57-0003-0000-000000000003', '貓頭鷹博士 DrOwl',    'https://i.pravatar.cc/150?u=test38', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-0003-0000-000000000004', '企鵝先生 MrPenguin',  'https://i.pravatar.cc/150?u=test39', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0003-0000-000000000005', '鳳凰 Phoenix',        'https://i.pravatar.cc/150?u=test40', 'user', '__TEST__', '["tw"]'),

-- 其他動物使用者（5 個）
('00000000-7e57-0004-0000-000000000001', '龍蜥 Komodo',         'https://i.pravatar.cc/150?u=test41', 'user', '__TEST__', '["id"]'),
('00000000-7e57-0004-0000-000000000002', '海龜 SeaTurtle',      'https://i.pravatar.cc/150?u=test42', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0004-0000-000000000003', '蜜蜂女王 QueenBee',   'https://i.pravatar.cc/150?u=test43', 'user', '__TEST__', '["nz"]'),
('00000000-7e57-0004-0000-000000000004', '蝶舞 Butterfly',      'https://i.pravatar.cc/150?u=test44', 'user', '__TEST__', '["tw"]'),

-- 植物使用者（3 個）
('00000000-7e57-0005-0000-000000000001', '橘子 Orange',         'https://i.pravatar.cc/150?u=test45', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-0005-0000-000000000002', '櫻 Sakura',           'https://i.pravatar.cc/150?u=test46', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-0005-0000-000000000003', '向日葵 Sunflower',    'https://i.pravatar.cc/150?u=test47', 'user', '__TEST__', '["ua"]'),

-- 高階分類使用者（只選到科/屬/目）
('00000000-7e57-0006-0000-000000000001', '犬科代表 DogFam',      'https://i.pravatar.cc/150?u=test51', 'user', '__TEST__', '["tw"]'),   -- 犬科 FAMILY
('00000000-7e57-0006-0000-000000000002', '貓科代表 CatFam',      'https://i.pravatar.cc/150?u=test52', 'user', '__TEST__', '["jp"]'),   -- 貓科 FAMILY
('00000000-7e57-0006-0000-000000000003', '熊之子 BearCub',       'https://i.pravatar.cc/150?u=test53', 'user', '__TEST__', '["ru"]'),   -- 熊科 FAMILY
('00000000-7e57-0006-0000-000000000004', '犬屬通 GenericDog',    'https://i.pravatar.cc/150?u=test54', 'user', '__TEST__', '["us"]'),   -- 犬屬 GENUS
('00000000-7e57-0006-0000-000000000005', '大貓 BigCat',          'https://i.pravatar.cc/150?u=test55', 'user', '__TEST__', '["in"]'),   -- 豹屬 GENUS
('00000000-7e57-0006-0000-000000000006', '烏鴉 Crow',            'https://i.pravatar.cc/150?u=test56', 'user', '__TEST__', '["tw"]'),   -- 鴉科 FAMILY
('00000000-7e57-0006-0000-000000000007', '肉食獸 Predator',      'https://i.pravatar.cc/150?u=test57', 'user', '__TEST__', '["ke"]'),   -- 食肉目 ORDER

-- 邊界測試使用者
('00000000-7e57-ed6e-0000-000000000001', '超級無敵巨大宇宙霹靂長名稱的Vtuber角色使用者名字很長很長的人 LongNameVtuber', NULL, 'user', '__TEST__', '["tw"]'),  -- 超長名稱 + 無頭像
('00000000-7e57-ed6e-0000-000000000002', '國際人 Global',       'https://i.pravatar.cc/150?u=test49', 'user', '__TEST__', '["tw","jp","us","gb","kr"]'),  -- 多國旗
('00000000-7e57-ed6e-0000-000000000003', '品種犬 BreedDog',     'https://i.pravatar.cc/150?u=test50', 'user', '__TEST__', '["tw"]')  -- 有品種名
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. vtuber_traits — 角色物種關聯
-- ============================================================

INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
-- 犬科 traits（25 個使用者，分散到不同犬科物種）
-- 灰狼 (8 users)
('00000000-7e57-a001-0000-000000000001', '00000000-7e57-0001-0000-000000000001', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000002', '00000000-7e57-0001-0000-000000000002', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000003', '00000000-7e57-0001-0000-000000000003', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000004', '00000000-7e57-0001-0000-000000000015', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000005', '00000000-7e57-0001-0000-000000000016', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000006', '00000000-7e57-0001-0000-000000000017', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000007', '00000000-7e57-0001-0000-000000000022', 5219173, NULL, NULL),
('00000000-7e57-a001-0000-000000000008', '00000000-7e57-0001-0000-000000000023', 5219173, NULL, NULL),
-- 家犬 (7 users)
('00000000-7e57-a002-0000-000000000001', '00000000-7e57-0001-0000-000000000005', 5219174, NULL, NULL),    -- 柴犬 (breed_id set below)
('00000000-7e57-a002-0000-000000000002', '00000000-7e57-0001-0000-000000000011', 5219174, NULL, NULL),    -- 柴犬 (breed_id set below)
('00000000-7e57-a002-0000-000000000003', '00000000-7e57-0001-0000-000000000018', 5219174, NULL, NULL),    -- 柯基犬 (breed_id set below)
('00000000-7e57-a002-0000-000000000004', '00000000-7e57-0001-0000-000000000020', 5219174, '獵犬', NULL),  -- legacy breed_name fallback
('00000000-7e57-a002-0000-000000000005', '00000000-7e57-0001-0000-000000000021', 5219174, NULL, NULL),    -- 無品種
('00000000-7e57-a002-0000-000000000006', '00000000-7e57-0001-0000-000000000024', 5219174, NULL, NULL),    -- 拉布拉多 (breed_id set below)
('00000000-7e57-a002-0000-000000000007', '00000000-7e57-0001-0000-000000000025', 5219174, NULL, NULL),    -- 秋田犬 (breed_id set below)
-- 赤狐 (3 users)
('00000000-7e57-a003-0000-000000000001', '00000000-7e57-0001-0000-000000000006', 5219243, NULL, NULL),
('00000000-7e57-a003-0000-000000000002', '00000000-7e57-0001-0000-000000000010', 5219243, NULL, NULL),
('00000000-7e57-a003-0000-000000000003', '00000000-7e57-0001-0000-000000000004', 5219243, NULL, NULL),
-- 北極狐 (2 users)
('00000000-7e57-a004-0000-000000000001', '00000000-7e57-0001-0000-000000000007', 5219252, NULL, NULL),
('00000000-7e57-a004-0000-000000000002', '00000000-7e57-0001-0000-000000000019', 5219252, NULL, NULL),
-- 郊狼 (2 users)
('00000000-7e57-a005-0000-000000000001', '00000000-7e57-0001-0000-000000000008', 5219237, NULL, NULL),
('00000000-7e57-a005-0000-000000000002', '00000000-7e57-0001-0000-000000000009', 5219237, NULL, NULL),
-- 貉 (1 user)
('00000000-7e57-a006-0000-000000000001', '00000000-7e57-0001-0000-000000000012', 5219289, NULL, NULL),
-- 鬃狼 (1 user)
('00000000-7e57-a007-0000-000000000001', '00000000-7e57-0001-0000-000000000013', 5219354, NULL, NULL),
-- 耳廓狐 (1 user)
('00000000-7e57-a008-0000-000000000001', '00000000-7e57-0001-0000-000000000014', 5219262, NULL, NULL),
-- 非洲野犬 (1 user)
('00000000-7e57-a008-0000-000000000002', '00000000-7e57-0001-0000-000000000025', 5219303, NULL, NULL),

-- 貓科 traits（10 個使用者）
('00000000-7e57-a010-0000-000000000001', '00000000-7e57-0002-0000-000000000001', 2435099, NULL, NULL),       -- 家貓
('00000000-7e57-a010-0000-000000000002', '00000000-7e57-0002-0000-000000000002', 5219436, NULL, NULL),       -- 獅
('00000000-7e57-a010-0000-000000000003', '00000000-7e57-0002-0000-000000000003', 5219404, NULL, NULL),       -- 虎
('00000000-7e57-a010-0000-000000000004', '00000000-7e57-0002-0000-000000000004', 5219426, NULL, NULL),       -- 豹
('00000000-7e57-a010-0000-000000000005', '00000000-7e57-0002-0000-000000000005', 2435146, NULL, NULL),       -- 獵豹
('00000000-7e57-a010-0000-000000000006', '00000000-7e57-0002-0000-000000000006', 2435168, NULL, NULL),       -- 猞猁
('00000000-7e57-a010-0000-000000000007', '00000000-7e57-0002-0000-000000000007', 2435190, NULL, NULL),       -- 美洲獅
('00000000-7e57-a010-0000-000000000008', '00000000-7e57-0002-0000-000000000008', 5219404, NULL, '白色變種'), -- 虎（第二個）
('00000000-7e57-a010-0000-000000000009', '00000000-7e57-0002-0000-000000000009', 5219368, NULL, NULL),       -- 美洲豹
('00000000-7e57-a010-0000-000000000010', '00000000-7e57-0002-0000-000000000010', 2435099, NULL, NULL),       -- 家貓（三花貓，breed_id set below）

-- 鳥綱 traits（5 個使用者）
('00000000-7e57-a020-0000-000000000001', '00000000-7e57-0003-0000-000000000001', 9103371, NULL, NULL),       -- 雞
('00000000-7e57-a020-0000-000000000002', '00000000-7e57-0003-0000-000000000002', 2480016, NULL, NULL),       -- 鸚鵡
('00000000-7e57-a020-0000-000000000003', '00000000-7e57-0003-0000-000000000003', 2497546, NULL, NULL),       -- 貓頭鷹
('00000000-7e57-a020-0000-000000000004', '00000000-7e57-0003-0000-000000000004', 2481660, NULL, NULL),       -- 企鵝

-- 其他動物 traits
('00000000-7e57-a030-0000-000000000001', '00000000-7e57-0004-0000-000000000001', 2470630, NULL, NULL),       -- 科莫多龍
('00000000-7e57-a030-0000-000000000002', '00000000-7e57-0004-0000-000000000002', 5220203, NULL, NULL),       -- 綠蠵龜
('00000000-7e57-a030-0000-000000000003', '00000000-7e57-0004-0000-000000000003', 1311477, NULL, NULL),       -- 蜜蜂
('00000000-7e57-a030-0000-000000000004', '00000000-7e57-0004-0000-000000000004', 5137108, NULL, NULL),       -- 蝴蝶

-- 植物 traits
('00000000-7e57-a040-0000-000000000001', '00000000-7e57-0005-0000-000000000001', 2917691, NULL, NULL),       -- 柑橘
('00000000-7e57-a040-0000-000000000002', '00000000-7e57-0005-0000-000000000002', 3020642, NULL, NULL),       -- 櫻花
('00000000-7e57-a040-0000-000000000003', '00000000-7e57-0005-0000-000000000003', 3119195, NULL, NULL),       -- 向日葵

-- 複合種 traits（5 個使用者擁有額外的第二物種）
-- 鳳凰：鸚鵡 + 赤狐（鳥+獸）
('00000000-7e57-a050-0000-000000000001', '00000000-7e57-0003-0000-000000000005', 2480016, NULL, '鳳凰的鳥型態'),
('00000000-7e57-a050-0000-000000000002', '00000000-7e57-0003-0000-000000000005', 5219243, NULL, '鳳凰的狐型態'),
-- 國際人：家貓 + 家犬（雙寵物）
('00000000-7e57-a050-0000-000000000003', '00000000-7e57-ed6e-0000-000000000002', 2435099, NULL, NULL),
('00000000-7e57-a050-0000-000000000004', '00000000-7e57-ed6e-0000-000000000002', 5219174, NULL, NULL),
-- 蜜蜂女王：蜜蜂 + 向日葵（跨界複合）
('00000000-7e57-a050-0000-000000000005', '00000000-7e57-0004-0000-000000000003', 3119195, NULL, '花蜜來源'),

-- 高階分類 traits（只選到科/屬/目，測試較短 taxon_path）
('00000000-7e57-a070-0000-000000000001', '00000000-7e57-0006-0000-000000000001', 9701,    NULL, NULL),  -- 犬科 FAMILY
('00000000-7e57-a070-0000-000000000002', '00000000-7e57-0006-0000-000000000002', 9703,    NULL, NULL),  -- 貓科 FAMILY
('00000000-7e57-a070-0000-000000000003', '00000000-7e57-0006-0000-000000000003', 9678,    NULL, NULL),  -- 熊科 FAMILY
('00000000-7e57-a070-0000-000000000004', '00000000-7e57-0006-0000-000000000004', 2435098, NULL, NULL),  -- 犬屬 GENUS
('00000000-7e57-a070-0000-000000000005', '00000000-7e57-0006-0000-000000000005', 2435194, NULL, NULL),  -- 豹屬 GENUS
('00000000-7e57-a070-0000-000000000006', '00000000-7e57-0006-0000-000000000006', 5264,    NULL, NULL),  -- 鴉科 FAMILY
('00000000-7e57-a070-0000-000000000007', '00000000-7e57-0006-0000-000000000007', 732,     NULL, NULL),  -- 食肉目 ORDER

-- 邊界測試 traits
-- 超長名稱使用者 → 灰狼
('00000000-7e57-a060-0000-000000000001', '00000000-7e57-ed6e-0000-000000000001', 5219173, NULL, NULL),
-- 品種犬 → 家犬（breed_id set below）
('00000000-7e57-a060-0000-000000000002', '00000000-7e57-ed6e-0000-000000000003', 5219174, NULL, '測試品種名顯示')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3b. breed_id 關聯更新（需在 breeds 種子之後執行）
-- ============================================================

-- 家犬品種關聯
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=5219174 AND name_en='Shiba Inu')
  WHERE id IN ('00000000-7e57-a002-0000-000000000001', '00000000-7e57-a002-0000-000000000002');
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=5219174 AND name_en='Pembroke Welsh Corgi')
  WHERE id = '00000000-7e57-a002-0000-000000000003';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=5219174 AND name_en='Labrador Retriever')
  WHERE id = '00000000-7e57-a002-0000-000000000006';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=5219174 AND name_en='Akita Inu')
  WHERE id = '00000000-7e57-a002-0000-000000000007';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=5219174 AND name_en='Pomeranian')
  WHERE id = '00000000-7e57-a060-0000-000000000002';

-- 家貓品種關聯
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Calico')
  WHERE id = '00000000-7e57-a010-0000-000000000010';
