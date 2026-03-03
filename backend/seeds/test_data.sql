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
ON CONFLICT (taxon_id) DO UPDATE SET
  common_name_zh = EXCLUDED.common_name_zh,
  path_zh = EXCLUDED.path_zh;


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

-- 貓科使用者（22 個，含 12 個品種貓）
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
-- 品種貓使用者（12 個，全部掛家貓 Felis catus，各自指定不同品種）
('00000000-7e57-0002-0000-000000000011', '藍貓 BlueCat',         'https://i.pravatar.cc/150?u=test60', 'user', '__TEST__', '["gb"]'),   -- 英國短毛貓
('00000000-7e57-0002-0000-000000000012', '銀漸層 SilverShade',   'https://i.pravatar.cc/150?u=test61', 'user', '__TEST__', '["us"]'),   -- 美國短毛貓
('00000000-7e57-0002-0000-000000000013', '波波 PersianPuff',     'https://i.pravatar.cc/150?u=test62', 'user', '__TEST__', '["ir"]'),   -- 波斯貓
('00000000-7e57-0002-0000-000000000014', '暹暹 SiamSiam',        'https://i.pravatar.cc/150?u=test63', 'user', '__TEST__', '["th"]'),   -- 暹羅貓
('00000000-7e57-0002-0000-000000000015', '布偶公主 RagPrincess',  'https://i.pravatar.cc/150?u=test64', 'user', '__TEST__', '["us"]'),   -- 布偶貓
('00000000-7e57-0002-0000-000000000016', '摺耳醬 FoldChan',      'https://i.pravatar.cc/150?u=test65', 'user', '__TEST__', '["gb"]'),   -- 蘇格蘭摺耳貓
('00000000-7e57-0002-0000-000000000017', '藍眼公爵 BlueDuke',    'https://i.pravatar.cc/150?u=test66', 'user', '__TEST__', '["ru"]'),   -- 俄羅斯藍貓
('00000000-7e57-0002-0000-000000000018', '大毛 BigFluff',        'https://i.pravatar.cc/150?u=test67', 'user', '__TEST__', '["us"]'),   -- 緬因貓
('00000000-7e57-0002-0000-000000000019', '豹紋 LeopardPrint',    'https://i.pravatar.cc/150?u=test68', 'user', '__TEST__', '["us"]'),   -- 孟加拉貓
('00000000-7e57-0002-0000-000000000020', '阿比 Abby',            'https://i.pravatar.cc/150?u=test69', 'user', '__TEST__', '["et"]'),   -- 阿比西尼亞貓
('00000000-7e57-0002-0000-000000000021', '花花 HuaHua',          'https://i.pravatar.cc/150?u=test70', 'user', '__TEST__', '["tw"]'),   -- 狸花貓
('00000000-7e57-0002-0000-000000000022', '短腿 ShortLegs',       'https://i.pravatar.cc/150?u=test71', 'user', '__TEST__', '["us"]'),   -- 曼赤肯貓

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

-- 貓科 traits（22 個使用者）
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
-- 品種貓 traits（12 個，全掛家貓 taxon_id=2435099，breed_id 在下方設定）
('00000000-7e57-a010-0000-000000000011', '00000000-7e57-0002-0000-000000000011', 2435099, NULL, NULL),       -- 英國短毛貓
('00000000-7e57-a010-0000-000000000012', '00000000-7e57-0002-0000-000000000012', 2435099, NULL, NULL),       -- 美國短毛貓
('00000000-7e57-a010-0000-000000000013', '00000000-7e57-0002-0000-000000000013', 2435099, NULL, NULL),       -- 波斯貓
('00000000-7e57-a010-0000-000000000014', '00000000-7e57-0002-0000-000000000014', 2435099, NULL, NULL),       -- 暹羅貓
('00000000-7e57-a010-0000-000000000015', '00000000-7e57-0002-0000-000000000015', 2435099, NULL, NULL),       -- 布偶貓
('00000000-7e57-a010-0000-000000000016', '00000000-7e57-0002-0000-000000000016', 2435099, NULL, NULL),       -- 蘇格蘭摺耳貓
('00000000-7e57-a010-0000-000000000017', '00000000-7e57-0002-0000-000000000017', 2435099, NULL, NULL),       -- 俄羅斯藍貓
('00000000-7e57-a010-0000-000000000018', '00000000-7e57-0002-0000-000000000018', 2435099, NULL, NULL),       -- 緬因貓
('00000000-7e57-a010-0000-000000000019', '00000000-7e57-0002-0000-000000000019', 2435099, NULL, NULL),       -- 孟加拉貓
('00000000-7e57-a010-0000-000000000020', '00000000-7e57-0002-0000-000000000020', 2435099, NULL, NULL),       -- 阿比西尼亞貓
('00000000-7e57-a010-0000-000000000021', '00000000-7e57-0002-0000-000000000021', 2435099, NULL, NULL),       -- 狸花貓
('00000000-7e57-a010-0000-000000000022', '00000000-7e57-0002-0000-000000000022', 2435099, NULL, NULL),       -- 曼赤肯貓

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
-- 品種貓 breed_id 關聯
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='British Shorthair')
  WHERE id = '00000000-7e57-a010-0000-000000000011';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='American Shorthair')
  WHERE id = '00000000-7e57-a010-0000-000000000012';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Persian cat')
  WHERE id = '00000000-7e57-a010-0000-000000000013';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Siamese')
  WHERE id = '00000000-7e57-a010-0000-000000000014';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Ragdoll')
  WHERE id = '00000000-7e57-a010-0000-000000000015';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Scottish Fold')
  WHERE id = '00000000-7e57-a010-0000-000000000016';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Russian Blue')
  WHERE id = '00000000-7e57-a010-0000-000000000017';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Maine coon')
  WHERE id = '00000000-7e57-a010-0000-000000000018';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Bengal cat')
  WHERE id = '00000000-7e57-a010-0000-000000000019';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Abyssinian')
  WHERE id = '00000000-7e57-a010-0000-000000000020';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Dragon Li')
  WHERE id = '00000000-7e57-a010-0000-000000000021';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2435099 AND name_en='Munchkin cat')
  WHERE id = '00000000-7e57-a010-0000-000000000022';


-- ============================================================
-- 4. 章魚目 Octopoda — 測試科/屬/種混合
-- ============================================================

-- 4a. species_cache — 章魚目相關分類
INSERT INTO species_cache (taxon_id, scientific_name, common_name_en, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus, path_zh) VALUES
-- 科級
(8800001, 'Octopodidae',             'Octopuses',               '章魚科',       'FAMILY',  'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae',                                           'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae', NULL,              '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科"}'),
(8800002, 'Argonautidae',            'Paper Nautiluses',        '船蛸科',       'FAMILY',  'Animalia|Mollusca|Cephalopoda|Octopoda|Argonautidae',                                          'Animalia','Mollusca','Cephalopoda','Octopoda','Argonautidae', NULL,             '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"船蛸科"}'),
-- 屬級
(8800003, 'Octopus',                 NULL,                      '章魚屬',       'GENUS',   'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Octopus',                                   'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Octopus',          '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"章魚屬"}'),
(8800004, 'Hapalochlaena',           NULL,                      '藍圈章魚屬',   'GENUS',   'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Hapalochlaena',                             'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Hapalochlaena',    '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"藍圈章魚屬"}'),
-- 種級
(8800005, 'Octopus vulgaris',        'Common Octopus',          '真蛸',         'SPECIES', 'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Octopus|Octopus vulgaris',                  'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Octopus',          '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"章魚屬"}'),
(8800006, 'Octopus cyanea',          'Day Octopus',             '白斑章魚',     'SPECIES', 'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Octopus|Octopus cyanea',                    'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Octopus',          '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"章魚屬"}'),
(8800007, 'Enteroctopus dofleini',   'Giant Pacific Octopus',   '北太平洋巨型章魚','SPECIES','Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Enteroctopus|Enteroctopus dofleini',      'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Enteroctopus',     '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"巨型章魚屬"}'),
(8800008, 'Hapalochlaena lunulata',  'Greater Blue-ringed Octopus','大藍圈章魚', 'SPECIES', 'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Hapalochlaena|Hapalochlaena lunulata',     'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Hapalochlaena',    '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"藍圈章魚屬"}'),
(8800009, 'Thaumoctopus mimicus',    'Mimic Octopus',           '擬態章魚',     'SPECIES', 'Animalia|Mollusca|Cephalopoda|Octopoda|Octopodidae|Thaumoctopus|Thaumoctopus mimicus',         'Animalia','Mollusca','Cephalopoda','Octopoda','Octopodidae','Thaumoctopus',     '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"章魚科","genus":"擬態章魚屬"}'),
(8800010, 'Argonauta argo',          'Greater Argonaut',        '船蛸',         'SPECIES', 'Animalia|Mollusca|Cephalopoda|Octopoda|Argonautidae|Argonauta|Argonauta argo',                 'Animalia','Mollusca','Cephalopoda','Octopoda','Argonautidae','Argonauta',       '{"kingdom":"動物界","phylum":"軟體動物門","class":"頭足綱","order":"章魚目","family":"船蛸科","genus":"船蛸屬"}')
ON CONFLICT (taxon_id) DO UPDATE SET
  common_name_zh = EXCLUDED.common_name_zh,
  path_zh = EXCLUDED.path_zh;

-- 4b. users — 章魚目測試使用者
INSERT INTO users (id, display_name, avatar_url, role, organization, country_flags) VALUES
('00000000-7e57-0007-0000-000000000001', '章魚燒 Takoyaki',       'https://i.pravatar.cc/150?u=octo01', 'user', '__TEST__', '["jp"]'),   -- 章魚科 FAMILY
('00000000-7e57-0007-0000-000000000002', '船蛸姬 PaperNaut',      'https://i.pravatar.cc/150?u=octo02', 'user', '__TEST__', '["tw"]'),   -- 船蛸科 FAMILY
('00000000-7e57-0007-0000-000000000003', '八爪大王 OctoKing',     'https://i.pravatar.cc/150?u=octo03', 'user', '__TEST__', '["kr"]'),   -- 章魚屬 GENUS
('00000000-7e57-0007-0000-000000000004', '藍環毒姬 BlueRing',     'https://i.pravatar.cc/150?u=octo04', 'user', '__TEST__', '["au"]'),   -- 藍圈章魚屬 GENUS
('00000000-7e57-0007-0000-000000000005', '墨墨 InkInk',           'https://i.pravatar.cc/150?u=octo05', 'user', '__TEST__', '["tw"]'),   -- 真蛸 SPECIES
('00000000-7e57-0007-0000-000000000006', '蛸壺 TakoPot',          'https://i.pravatar.cc/150?u=octo06', 'user', '__TEST__', '["jp"]'),   -- 真蛸 SPECIES
('00000000-7e57-0007-0000-000000000007', '晝行者 DayWalker',      'https://i.pravatar.cc/150?u=octo07', 'user', '__TEST__', '["ph"]'),   -- 白斑章魚 SPECIES
('00000000-7e57-0007-0000-000000000008', '巨腕 GiantArm',         'https://i.pravatar.cc/150?u=octo08', 'user', '__TEST__', '["us"]'),   -- 北太平洋巨型章魚 SPECIES
('00000000-7e57-0007-0000-000000000009', '擬態師 Mimic',          'https://i.pravatar.cc/150?u=octo09', 'user', '__TEST__', '["id"]'),   -- 擬態章魚 SPECIES
('00000000-7e57-0007-0000-000000000010', '漂流者 Drifter',        'https://i.pravatar.cc/150?u=octo10', 'user', '__TEST__', '["tw"]')    -- 船蛸 SPECIES
ON CONFLICT (id) DO NOTHING;

-- 4c. vtuber_traits — 章魚目角色物種關聯
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a080-0000-000000000001', '00000000-7e57-0007-0000-000000000001', 8800001, NULL, NULL),  -- 章魚科 FAMILY
('00000000-7e57-a080-0000-000000000002', '00000000-7e57-0007-0000-000000000002', 8800002, NULL, NULL),  -- 船蛸科 FAMILY
('00000000-7e57-a080-0000-000000000003', '00000000-7e57-0007-0000-000000000003', 8800003, NULL, NULL),  -- 章魚屬 GENUS
('00000000-7e57-a080-0000-000000000004', '00000000-7e57-0007-0000-000000000004', 8800004, NULL, NULL),  -- 藍圈章魚屬 GENUS
('00000000-7e57-a080-0000-000000000005', '00000000-7e57-0007-0000-000000000005', 8800005, NULL, NULL),  -- 真蛸 SPECIES
('00000000-7e57-a080-0000-000000000006', '00000000-7e57-0007-0000-000000000006', 8800005, NULL, NULL),  -- 真蛸 SPECIES
('00000000-7e57-a080-0000-000000000007', '00000000-7e57-0007-0000-000000000007', 8800006, NULL, NULL),  -- 白斑章魚 SPECIES
('00000000-7e57-a080-0000-000000000008', '00000000-7e57-0007-0000-000000000008', 8800007, NULL, NULL),  -- 北太平洋巨型章魚 SPECIES
('00000000-7e57-a080-0000-000000000009', '00000000-7e57-0007-0000-000000000009', 8800009, NULL, NULL),  -- 擬態章魚 SPECIES
('00000000-7e57-a080-0000-000000000010', '00000000-7e57-0007-0000-000000000010', 8800010, NULL, NULL)   -- 船蛸 SPECIES
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. 兔科 Leporidae — 品種兔 + 野兔 + 高階分類 + 複合種
-- 測試情境：
--   a) >20 截斷（25 個穴兔使用者）
--   b) 品種多樣性（15 種品種 + 同品種聚合 3x 荷蘭垂耳兔）
--   c) 無品種（5 人）、legacy breed_name（1 人）、breed_id+breed_name 共存（1 人）
--   d) admin 角色、無頭像、多國旗、trait_note
--   e) 野兔 — 不同屬（兔屬 Lepus、林兔屬 Sylvilagus）
--   f) 高階分類（兔形目 ORDER、兔科 FAMILY、穴兔屬/兔屬 GENUS）
--   g) 複合種（兔+貓跨科、兔+月兔虛構、穴兔+雪兔同科異屬）
-- ============================================================

-- 5a. species_cache — 兔科相關分類
INSERT INTO species_cache (taxon_id, scientific_name, common_name_en, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus, path_zh) VALUES
-- 穴兔（家兔母種，品種掛載點）
(2436940, 'Oryctolagus cuniculus',    'European Rabbit',     '穴兔',       'SPECIES', 'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Oryctolagus|Oryctolagus cuniculus', 'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Oryctolagus', '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"穴兔屬"}'),
-- 兔科 FAMILY
(8810001, 'Leporidae',                'Hares and Rabbits',   '兔科',       'FAMILY',  'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae',                                    'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae', NULL,           '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科"}'),
-- 兔形目 ORDER
(8810002, 'Lagomorpha',               'Lagomorphs',          '兔形目',     'ORDER',   'Animalia|Chordata|Mammalia|Lagomorpha',                                               'Animalia','Chordata','Mammalia','Lagomorpha', NULL, NULL,                '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目"}'),
-- 穴兔屬 GENUS
(8810003, 'Oryctolagus',              NULL,                  '穴兔屬',     'GENUS',   'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Oryctolagus',                         'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Oryctolagus', '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"穴兔屬"}'),
-- 兔屬 GENUS（與穴兔屬同科不同屬）
(8810004, 'Lepus',                    NULL,                  '兔屬',       'GENUS',   'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Lepus',                               'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Lepus',       '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"兔屬"}'),
-- 歐洲野兔 SPECIES（兔屬）
(8810005, 'Lepus europaeus',          'European Hare',       '歐洲野兔',   'SPECIES', 'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Lepus|Lepus europaeus',                'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Lepus',       '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"兔屬"}'),
-- 雪兔 SPECIES（兔屬，用於複合種測試）
(8810006, 'Lepus timidus',            'Mountain Hare',       '雪兔',       'SPECIES', 'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Lepus|Lepus timidus',                  'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Lepus',       '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"兔屬"}'),
-- 東部棉尾兔 SPECIES（林兔屬，第三個屬）
(8810007, 'Sylvilagus floridanus',    'Eastern Cottontail',  '東部棉尾兔', 'SPECIES', 'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Sylvilagus|Sylvilagus floridanus',    'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Sylvilagus',  '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"林兔屬"}')
ON CONFLICT (taxon_id) DO UPDATE SET
  common_name_zh = EXCLUDED.common_name_zh,
  path_zh = EXCLUDED.path_zh;

-- 5b. fictional_species — 月兔（複合種測試用）
INSERT INTO fictional_species (id, name, name_zh, origin, sub_origin, category_path, description) VALUES
(99001, 'Moon Rabbit', '月兔', '東方神話', '中國神話', '東方神話|中國神話|月兔', '傳說居住在月亮上的兔子，中國神話中在月宮搗製不死之藥，日本神話中則搗年糕')
ON CONFLICT (id) DO NOTHING;

-- 5c. users — 兔科測試使用者
INSERT INTO users (id, display_name, avatar_url, role, organization, country_flags) VALUES
-- ── 穴兔品種使用者（25 個，測試 >20 截斷）──
-- 荷蘭垂耳兔 x3（同品種聚合測試）
('00000000-7e57-0008-0000-000000000001', '垂耳妹 LopChan',        'https://i.pravatar.cc/150?u=rabbit01', 'user',  '__TEST__', '["tw"]'),
('00000000-7e57-0008-0000-000000000002', '荷蘭寶 DutchBun',       'https://i.pravatar.cc/150?u=rabbit02', 'user',  '__TEST__', '["nl"]'),
('00000000-7e57-0008-0000-000000000003', '垂耳萌 LopMoe',         'https://i.pravatar.cc/150?u=rabbit03', 'user',  '__TEST__', '["jp"]'),
-- 荷蘭侏儒兔 x2
('00000000-7e57-0008-0000-000000000004', '侏儒兔 DwarfBun',       'https://i.pravatar.cc/150?u=rabbit04', 'user',  '__TEST__', '["tw"]'),
('00000000-7e57-0008-0000-000000000005', '小小兔 TinyBun',        'https://i.pravatar.cc/150?u=rabbit05', 'user',  '__TEST__', '["jp"]'),
-- 各品種各 1 人
('00000000-7e57-0008-0000-000000000006', '獅子丸 LionMaru',       'https://i.pravatar.cc/150?u=rabbit06', 'user',  '__TEST__', '["tw"]'),   -- 獅子兔
('00000000-7e57-0008-0000-000000000007', '迷你力克 MiniRexChan',  'https://i.pravatar.cc/150?u=rabbit07', 'user',  '__TEST__', '["us"]'),   -- 迷你力克斯兔
('00000000-7e57-0008-0000-000000000008', '安哥拉毛 AngoraFluff',  'https://i.pravatar.cc/150?u=rabbit08', 'user',  '__TEST__', '["gb"]'),   -- 安哥拉兔
('00000000-7e57-0008-0000-000000000009', '道奇醬 DodgeChan',      'https://i.pravatar.cc/150?u=rabbit09', 'user',  '__TEST__', '["tw"]'),   -- 道奇兔
('00000000-7e57-0008-0000-000000000010', '佛萊明 Fleming',        'https://i.pravatar.cc/150?u=rabbit10', 'user',  '__TEST__', '["be"]'),   -- 佛萊明巨兔
('00000000-7e57-0008-0000-000000000011', '海棠眼 HototEye',       'https://i.pravatar.cc/150?u=rabbit11', 'user',  '__TEST__', '["fr"]'),   -- 海棠兔
('00000000-7e57-0008-0000-000000000012', '喜馬拉雅 HimaChan',     'https://i.pravatar.cc/150?u=rabbit12', 'user',  '__TEST__', '["in"]'),   -- 喜馬拉雅兔
('00000000-7e57-0008-0000-000000000013', '波蘭白 PolishWhite',    'https://i.pravatar.cc/150?u=rabbit13', 'user',  '__TEST__', '["pl"]'),   -- 波蘭兔
('00000000-7e57-0008-0000-000000000014', '加州兔 CaliBun',        'https://i.pravatar.cc/150?u=rabbit14', 'user',  '__TEST__', '["us"]'),   -- 加州兔
('00000000-7e57-0008-0000-000000000015', '紐西蘭 NZBun',          'https://i.pravatar.cc/150?u=rabbit15', 'user',  '__TEST__', '["nz"]'),   -- 紐西蘭白兔
-- 無品種穴兔 x5（純 species，無 breed_id）
('00000000-7e57-0008-0000-000000000016', '白兔先生 MrWhite',      'https://i.pravatar.cc/150?u=rabbit16', 'user',  '__TEST__', '["tw"]'),
('00000000-7e57-0008-0000-000000000017', '兔兔 BunBun',           'https://i.pravatar.cc/150?u=rabbit17', 'user',  '__TEST__', '["jp"]'),
('00000000-7e57-0008-0000-000000000018', '蹦蹦 Bounce',           'https://i.pravatar.cc/150?u=rabbit18', 'user',  '__TEST__', '["kr"]'),
('00000000-7e57-0008-0000-000000000019', '兔耳 LongEar',          'https://i.pravatar.cc/150?u=rabbit19', 'user',  '__TEST__', '["tw"]'),
('00000000-7e57-0008-0000-000000000020', '胖兔 Chubby',           'https://i.pravatar.cc/150?u=rabbit20', 'user',  '__TEST__', '["us"]'),
-- 邊界情境使用者
('00000000-7e57-0008-0000-000000000021', '老品種兔 OldBreed',     'https://i.pravatar.cc/150?u=rabbit21', 'user',  '__TEST__', '["tw"]'),   -- legacy breed_name only（無 breed_id）
('00000000-7e57-0008-0000-000000000022', '兔管理員 BunAdmin',     'https://i.pravatar.cc/150?u=rabbit22', 'admin', '__TEST__', '["tw"]'),   -- admin 角色 + 品種
('00000000-7e57-0008-0000-000000000023', '月影兔 MoonBun',        NULL,                                   'user',  '__TEST__', '["tw"]'),   -- NULL 頭像 + 品種
('00000000-7e57-0008-0000-000000000024', '國際兔 GlobalBun',      'https://i.pravatar.cc/150?u=rabbit24', 'user',  '__TEST__', '["tw","jp","us","nl","de"]'),  -- 多國旗
('00000000-7e57-0008-0000-000000000025', '兔備注 NoteBun',        'https://i.pravatar.cc/150?u=rabbit25', 'user',  '__TEST__', '["tw"]'),   -- breed_id + breed_name 共存

-- ── 野兔使用者（3 個，不同屬測試） ──
('00000000-7e57-0008-0000-000000000026', '歐兔 EuroHare',         'https://i.pravatar.cc/150?u=rabbit26', 'user',  '__TEST__', '["de"]'),   -- 歐洲野兔 Lepus
('00000000-7e57-0008-0000-000000000027', '雪兔兔 SnowHare',       'https://i.pravatar.cc/150?u=rabbit27', 'user',  '__TEST__', '["fi"]'),   -- 雪兔 Lepus
('00000000-7e57-0008-0000-000000000028', '棉尾 Cottontail',       'https://i.pravatar.cc/150?u=rabbit28', 'user',  '__TEST__', '["us"]'),   -- 東部棉尾兔 Sylvilagus

-- ── 高階分類使用者（4 個，FAMILY/ORDER/GENUS）──
('00000000-7e57-0008-0000-000000000029', '兔科代表 LepoFam',      'https://i.pravatar.cc/150?u=rabbit29', 'user',  '__TEST__', '["tw"]'),   -- 兔科 FAMILY
('00000000-7e57-0008-0000-000000000030', '兔目代表 LagoOrder',    'https://i.pravatar.cc/150?u=rabbit30', 'user',  '__TEST__', '["tw"]'),   -- 兔形目 ORDER
('00000000-7e57-0008-0000-000000000031', '穴兔屬通 OryGeneric',   'https://i.pravatar.cc/150?u=rabbit31', 'user',  '__TEST__', '["tw"]'),   -- 穴兔屬 GENUS
('00000000-7e57-0008-0000-000000000032', '兔屬通 LepusGeneric',   'https://i.pravatar.cc/150?u=rabbit32', 'user',  '__TEST__', '["tw"]'),   -- 兔屬 GENUS

-- ── 複合種使用者（3 個）──
('00000000-7e57-0008-0000-000000000033', '貓兔 CatBun',           'https://i.pravatar.cc/150?u=rabbit33', 'user',  '__TEST__', '["tw"]'),   -- 穴兔 + 家貓（跨科）
('00000000-7e57-0008-0000-000000000034', '月兔精 MoonSpirit',     'https://i.pravatar.cc/150?u=rabbit34', 'user',  '__TEST__', '["jp"]'),   -- 穴兔 + 月兔虛構（real + fictional）
('00000000-7e57-0008-0000-000000000035', '雙兔 TwinBun',          'https://i.pravatar.cc/150?u=rabbit35', 'user',  '__TEST__', '["tw"]')    -- 穴兔 + 雪兔（同科異屬）
ON CONFLICT (id) DO NOTHING;

-- 5d. vtuber_traits — 穴兔品種 traits（25 人）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
-- 荷蘭垂耳兔 x3（breed_id set below）
('00000000-7e57-a090-0000-000000000001', '00000000-7e57-0008-0000-000000000001', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000002', '00000000-7e57-0008-0000-000000000002', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000003', '00000000-7e57-0008-0000-000000000003', 2436940, NULL, NULL),
-- 荷蘭侏儒兔 x2（breed_id set below）
('00000000-7e57-a090-0000-000000000004', '00000000-7e57-0008-0000-000000000004', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000005', '00000000-7e57-0008-0000-000000000005', 2436940, NULL, NULL),
-- 各品種 x1（breed_id set below）
('00000000-7e57-a090-0000-000000000006', '00000000-7e57-0008-0000-000000000006', 2436940, NULL, NULL),       -- 獅子兔
('00000000-7e57-a090-0000-000000000007', '00000000-7e57-0008-0000-000000000007', 2436940, NULL, NULL),       -- 迷你力克斯兔
('00000000-7e57-a090-0000-000000000008', '00000000-7e57-0008-0000-000000000008', 2436940, NULL, NULL),       -- 安哥拉兔
('00000000-7e57-a090-0000-000000000009', '00000000-7e57-0008-0000-000000000009', 2436940, NULL, NULL),       -- 道奇兔
('00000000-7e57-a090-0000-000000000010', '00000000-7e57-0008-0000-000000000010', 2436940, NULL, NULL),       -- 佛萊明巨兔
('00000000-7e57-a090-0000-000000000011', '00000000-7e57-0008-0000-000000000011', 2436940, NULL, NULL),       -- 海棠兔
('00000000-7e57-a090-0000-000000000012', '00000000-7e57-0008-0000-000000000012', 2436940, NULL, NULL),       -- 喜馬拉雅兔
('00000000-7e57-a090-0000-000000000013', '00000000-7e57-0008-0000-000000000013', 2436940, NULL, NULL),       -- 波蘭兔
('00000000-7e57-a090-0000-000000000014', '00000000-7e57-0008-0000-000000000014', 2436940, NULL, NULL),       -- 加州兔
('00000000-7e57-a090-0000-000000000015', '00000000-7e57-0008-0000-000000000015', 2436940, NULL, NULL),       -- 紐西蘭白兔
-- 無品種穴兔 x5（純 species，不設 breed_id）
('00000000-7e57-a090-0000-000000000016', '00000000-7e57-0008-0000-000000000016', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000017', '00000000-7e57-0008-0000-000000000017', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000018', '00000000-7e57-0008-0000-000000000018', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000019', '00000000-7e57-0008-0000-000000000019', 2436940, NULL, NULL),
('00000000-7e57-a090-0000-000000000020', '00000000-7e57-0008-0000-000000000020', 2436940, NULL, NULL),
-- 邊界情境 traits
('00000000-7e57-a090-0000-000000000021', '00000000-7e57-0008-0000-000000000021', 2436940, '迷你垂耳兔', NULL),       -- legacy breed_name only（不設 breed_id）
('00000000-7e57-a090-0000-000000000022', '00000000-7e57-0008-0000-000000000022', 2436940, NULL, NULL),               -- admin + breed_id（set below）
('00000000-7e57-a090-0000-000000000023', '00000000-7e57-0008-0000-000000000023', 2436940, NULL, NULL),               -- NULL avatar + breed_id（set below）
('00000000-7e57-a090-0000-000000000024', '00000000-7e57-0008-0000-000000000024', 2436940, NULL, NULL),               -- 多國旗 + breed_id（set below）
('00000000-7e57-a090-0000-000000000025', '00000000-7e57-0008-0000-000000000025', 2436940, '力克斯兔', '毛質如絲絨般柔滑')  -- breed_id + breed_name 共存 + trait_note（set below）
ON CONFLICT (id) DO NOTHING;

-- 5e. vtuber_traits — 野兔 traits（3 人，不同屬的物種）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a090-0000-000000000026', '00000000-7e57-0008-0000-000000000026', 8810005, NULL, NULL),       -- 歐洲野兔 Lepus europaeus
('00000000-7e57-a090-0000-000000000027', '00000000-7e57-0008-0000-000000000027', 8810006, NULL, NULL),       -- 雪兔 Lepus timidus
('00000000-7e57-a090-0000-000000000028', '00000000-7e57-0008-0000-000000000028', 8810007, NULL, '北美常見野兔')  -- 東部棉尾兔 Sylvilagus
ON CONFLICT (id) DO NOTHING;

-- 5f. vtuber_traits — 高階分類 traits（4 人）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a091-0000-000000000001', '00000000-7e57-0008-0000-000000000029', 8810001, NULL, NULL),       -- 兔科 FAMILY
('00000000-7e57-a091-0000-000000000002', '00000000-7e57-0008-0000-000000000030', 8810002, NULL, NULL),       -- 兔形目 ORDER
('00000000-7e57-a091-0000-000000000003', '00000000-7e57-0008-0000-000000000031', 8810003, NULL, NULL),       -- 穴兔屬 GENUS
('00000000-7e57-a091-0000-000000000004', '00000000-7e57-0008-0000-000000000032', 8810004, NULL, NULL)        -- 兔屬 GENUS
ON CONFLICT (id) DO NOTHING;

-- 5g. vtuber_traits — 複合種 traits
-- 貓兔：穴兔 + 家貓（跨科複合）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a092-0000-000000000001', '00000000-7e57-0008-0000-000000000033', 2436940, NULL, '兔子型態'),
('00000000-7e57-a092-0000-000000000002', '00000000-7e57-0008-0000-000000000033', 2435099, NULL, '貓咪型態')
ON CONFLICT (id) DO NOTHING;
-- 月兔精：穴兔（real）+ 月兔（fictional）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a092-0000-000000000003', '00000000-7e57-0008-0000-000000000034', 2436940, NULL, '現實兔形態')
ON CONFLICT (id) DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-a092-0000-000000000004', '00000000-7e57-0008-0000-000000000034', 99001,   '月宮兔形態')
ON CONFLICT (id) DO NOTHING;
-- 雙兔：穴兔 + 雪兔（同科異屬複合）
INSERT INTO vtuber_traits (id, user_id, taxon_id, breed_name, trait_note) VALUES
('00000000-7e57-a092-0000-000000000005', '00000000-7e57-0008-0000-000000000035', 2436940, NULL, '家兔外觀'),
('00000000-7e57-a092-0000-000000000006', '00000000-7e57-0008-0000-000000000035', 8810006, NULL, '雪兔毛色')
ON CONFLICT (id) DO NOTHING;

-- 5h. breed_id 關聯更新（需在 breeds 種子之後執行）
-- 荷蘭垂耳兔 x3
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Holland Lop')
  WHERE id IN ('00000000-7e57-a090-0000-000000000001', '00000000-7e57-a090-0000-000000000002', '00000000-7e57-a090-0000-000000000003');
-- 荷蘭侏儒兔 x2
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Netherland Dwarf')
  WHERE id IN ('00000000-7e57-a090-0000-000000000004', '00000000-7e57-a090-0000-000000000005');
-- 各品種 x1
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Lionhead rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000006';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Mini Rex')
  WHERE id = '00000000-7e57-a090-0000-000000000007';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Angora rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000008';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Dutch rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000009';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Flemish Giant')
  WHERE id = '00000000-7e57-a090-0000-000000000010';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Blanc de Hotot')
  WHERE id = '00000000-7e57-a090-0000-000000000011';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Himalayan rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000012';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Polish rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000013';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Californian rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000014';
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='New Zealand white rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000015';
-- 邊界情境 breed_id
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Jersey Wooly')
  WHERE id = '00000000-7e57-a090-0000-000000000022';   -- admin + 品種
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Netherland Dwarf')
  WHERE id = '00000000-7e57-a090-0000-000000000023';   -- NULL avatar + 品種
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Mini Lop')
  WHERE id = '00000000-7e57-a090-0000-000000000024';   -- 多國旗 + 品種
UPDATE vtuber_traits SET breed_id = (SELECT id FROM breeds WHERE taxon_id=2436940 AND name_en='Rex rabbit')
  WHERE id = '00000000-7e57-a090-0000-000000000025';   -- breed_id + breed_name 共存（breed_id 優先顯示）
