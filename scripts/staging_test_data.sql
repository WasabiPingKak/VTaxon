-- ============================================================
-- VTaxon Staging 測試資料 v2
-- 用途：完整測試側邊欄所有篩選功能 + 不同分類階層的使用者節點
-- 清除：執行本檔最下方的 CLEANUP 區塊即可一鍵移除
--
-- 識別標記：所有測試使用者的 bio = '__TEST_DATA__'
--           所有測試物種的 taxon_id 在 9999901~9999930
--           品種 name_en 以 '__TEST__' 開頭
--           虛構物種使用現有種子資料（不新增）
-- ============================================================

BEGIN;

-- 設定 search_path 為 staging schema
SET search_path TO staging, public;

-- ──────────────────────────────────────────────
-- 1. species_cache — 涵蓋多個分類階層
-- ──────────────────────────────────────────────
-- SPECIES 級 (9999901-9999910)
-- GENUS   級 (9999911-9999916)
-- FAMILY  級 (9999917-9999920)
-- ORDER   級 (9999921-9999923)
-- CLASS   級 (9999924-9999926)

INSERT INTO species_cache (taxon_id, scientific_name, common_name_en, common_name_zh, taxon_rank, taxon_path, kingdom, phylum, class, order_, family, genus, path_zh)
VALUES
  -- ── SPECIES 級 ──
  (9999901, 'Felis catus',              'Domestic Cat',    '家貓',   'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis catus',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Felis',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"貓屬"}'::jsonb),

  (9999902, 'Panthera leo',             'Lion',            '獅',     'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera leo',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'::jsonb),

  (9999903, 'Canis lupus familiaris',   'Domestic Dog',    '家犬',   'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis|Canis lupus familiaris',
   'Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'::jsonb),

  (9999904, 'Oryctolagus cuniculus',    'European Rabbit', '穴兔',   'SPECIES',
   'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Oryctolagus|Oryctolagus cuniculus',
   'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Oryctolagus',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"穴兔屬"}'::jsonb),

  (9999905, 'Corvus corax',             'Common Raven',    '渡鴉',   'SPECIES',
   'Animalia|Chordata|Aves|Passeriformes|Corvidae|Corvus|Corvus corax',
   'Animalia','Chordata','Aves','Passeriformes','Corvidae','Corvus',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"雀形目","family":"鴉科","genus":"鴉屬"}'::jsonb),

  (9999906, 'Felis silvestris',         'Wildcat',         '野貓',   'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis|Felis silvestris',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Felis',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"貓屬"}'::jsonb),

  (9999907, 'Panthera tigris',          'Tiger',           '虎',     'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera|Panthera tigris',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'::jsonb),

  (9999908, 'Vulpes vulpes',            'Red Fox',         '赤狐',   'SPECIES',
   'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes vulpes',
   'Animalia','Chordata','Mammalia','Carnivora','Canidae','Vulpes',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"狐屬"}'::jsonb),

  (9999909, 'Ara macao',                'Scarlet Macaw',   '金剛鸚鵡','SPECIES',
   'Animalia|Chordata|Aves|Psittaciformes|Psittacidae|Ara|Ara macao',
   'Animalia','Chordata','Aves','Psittaciformes','Psittacidae','Ara',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"鸚形目","family":"鸚鵡科","genus":"金剛鸚鵡屬"}'::jsonb),

  (9999910, 'Chelonia mydas',           'Green Sea Turtle','綠蠵龜', 'SPECIES',
   'Animalia|Chordata|Reptilia|Testudines|Cheloniidae|Chelonia|Chelonia mydas',
   'Animalia','Chordata','Reptilia','Testudines','Cheloniidae','Chelonia',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"爬蟲綱","order":"龜鱉目","family":"海龜科","genus":"海龜屬"}'::jsonb),

  -- ── GENUS 級（taxon_path 只到屬）──
  (9999911, 'Felis',                    NULL,              '貓屬',   'GENUS',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Felis',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Felis',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"貓屬"}'::jsonb),

  (9999912, 'Panthera',                 NULL,              '豹屬',   'GENUS',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae|Panthera',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae','Panthera',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科","genus":"豹屬"}'::jsonb),

  (9999913, 'Corvus',                   NULL,              '鴉屬',   'GENUS',
   'Animalia|Chordata|Aves|Passeriformes|Corvidae|Corvus',
   'Animalia','Chordata','Aves','Passeriformes','Corvidae','Corvus',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"雀形目","family":"鴉科","genus":"鴉屬"}'::jsonb),

  (9999914, 'Vulpes',                   NULL,              '狐屬',   'GENUS',
   'Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes',
   'Animalia','Chordata','Mammalia','Carnivora','Canidae','Vulpes',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"狐屬"}'::jsonb),

  (9999915, 'Canis',                    NULL,              '犬屬',   'GENUS',
   'Animalia|Chordata|Mammalia|Carnivora|Canidae|Canis',
   'Animalia','Chordata','Mammalia','Carnivora','Canidae','Canis',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科","genus":"犬屬"}'::jsonb),

  (9999916, 'Lepus',                    NULL,              '兔屬',   'GENUS',
   'Animalia|Chordata|Mammalia|Lagomorpha|Leporidae|Lepus',
   'Animalia','Chordata','Mammalia','Lagomorpha','Leporidae','Lepus',
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目","family":"兔科","genus":"兔屬"}'::jsonb),

  -- ── FAMILY 級（taxon_path 只到科）──
  (9999917, 'Felidae',                  NULL,              '貓科',   'FAMILY',
   'Animalia|Chordata|Mammalia|Carnivora|Felidae',
   'Animalia','Chordata','Mammalia','Carnivora','Felidae',NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"貓科"}'::jsonb),

  (9999918, 'Canidae',                  NULL,              '犬科',   'FAMILY',
   'Animalia|Chordata|Mammalia|Carnivora|Canidae',
   'Animalia','Chordata','Mammalia','Carnivora','Canidae',NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目","family":"犬科"}'::jsonb),

  (9999919, 'Corvidae',                 NULL,              '鴉科',   'FAMILY',
   'Animalia|Chordata|Aves|Passeriformes|Corvidae',
   'Animalia','Chordata','Aves','Passeriformes','Corvidae',NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"雀形目","family":"鴉科"}'::jsonb),

  (9999920, 'Psittacidae',              NULL,              '鸚鵡科', 'FAMILY',
   'Animalia|Chordata|Aves|Psittaciformes|Psittacidae',
   'Animalia','Chordata','Aves','Psittaciformes','Psittacidae',NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱","order":"鸚形目","family":"鸚鵡科"}'::jsonb),

  -- ── ORDER 級（taxon_path 只到目）──
  (9999921, 'Carnivora',                NULL,              '食肉目', 'ORDER',
   'Animalia|Chordata|Mammalia|Carnivora',
   'Animalia','Chordata','Mammalia','Carnivora',NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"食肉目"}'::jsonb),

  (9999922, 'Lagomorpha',               NULL,              '兔形目', 'ORDER',
   'Animalia|Chordata|Mammalia|Lagomorpha',
   'Animalia','Chordata','Mammalia','Lagomorpha',NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱","order":"兔形目"}'::jsonb),

  (9999923, 'Testudines',               NULL,              '龜鱉目', 'ORDER',
   'Animalia|Chordata|Reptilia|Testudines',
   'Animalia','Chordata','Reptilia','Testudines',NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"爬蟲綱","order":"龜鱉目"}'::jsonb),

  -- ── CLASS 級（taxon_path 只到綱）──
  (9999924, 'Mammalia',                 NULL,              '哺乳綱', 'CLASS',
   'Animalia|Chordata|Mammalia',
   'Animalia','Chordata','Mammalia',NULL,NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"哺乳綱"}'::jsonb),

  (9999925, 'Aves',                     NULL,              '鳥綱',   'CLASS',
   'Animalia|Chordata|Aves',
   'Animalia','Chordata','Aves',NULL,NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"鳥綱"}'::jsonb),

  (9999926, 'Reptilia',                 NULL,              '爬蟲綱', 'CLASS',
   'Animalia|Chordata|Reptilia',
   'Animalia','Chordata','Reptilia',NULL,NULL,NULL,
   '{"kingdom":"動物界","phylum":"脊索動物門","class":"爬蟲綱"}'::jsonb)
ON CONFLICT (taxon_id) DO NOTHING;

-- ──────────────────────────────────────────────
-- 2. breeds（品種，掛在 species 底下）
-- ──────────────────────────────────────────────
INSERT INTO breeds (taxon_id, name_en, name_zh, breed_group, source)
VALUES
  (9999901, '__TEST__ Ragdoll',            '布偶貓',   '長毛', 'test'),
  (9999901, '__TEST__ British Shorthair',  '英國短毛貓','短毛', 'test'),
  (9999903, '__TEST__ Shiba Inu',          '柴犬',     '日本犬','test'),
  (9999903, '__TEST__ Siberian Husky',     '西伯利亞哈士奇','工作犬','test')
ON CONFLICT (taxon_id, name_en) DO NOTHING;

-- ──────────────────────────────────────────────
-- 3. users（40 筆）
-- ──────────────────────────────────────────────
-- bio = '__TEST_DATA__' 作為識別標記
--
-- 設計矩陣:
--   國旗: TW(10), JP(7), US(5), KR(3), GB(2), 多國旗(3), 無國旗(10)
--   性別: 男(10), 女(12), 自訂文字(6), 未設定(12)
--   狀態: active(16), hiatus(10), preparing(6), 未設定(8)
--   組織: 有org=企業勢(14), 無org=個人勢(26)
--   出道日期: 有(28), 無(12)
--   建立時間: 分散在 2024-01~2025-12

INSERT INTO users (id, display_name, avatar_url, role, organization, bio, country_flags, profile_data, created_at, updated_at)
VALUES
  -- ─── Group A: 種(SPECIES)級使用者 (user 01-15) ───

  -- 家貓 (01-04)
  ('a0000001-ae50-0000-0000-000000000001', '貓咪大王',     NULL, 'user', '喵喵社',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-03-15"}'::jsonb,
   '2024-01-10 08:00:00+08', '2024-01-10 08:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000002', '白貓公主',     NULL, 'user', '喵喵社',     '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-06-01"}'::jsonb,
   '2024-03-20 12:00:00+08', '2024-03-20 12:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000003', '橘貓戰士',     NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2023-12-25"}'::jsonb,
   '2024-06-15 09:30:00+08', '2024-06-15 09:30:00+08'),

  ('a0000001-ae50-0000-0000-000000000004', '黑貓魔女',     NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-01-01"}'::jsonb,
   '2025-01-05 18:00:00+08', '2025-01-05 18:00:00+08'),

  -- 獅子 (05-06)
  ('a0000001-ae50-0000-0000-000000000005', '獅王雷歐',     NULL, 'user', '百獸團',     '__TEST_DATA__', '["KR"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-02-14"}'::jsonb,
   '2024-02-01 07:00:00+08', '2024-02-01 07:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000006', '小獅妹',       NULL, 'user', '百獸團',     '__TEST_DATA__', '["KR"]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2024-05-05"}'::jsonb,
   '2024-05-01 16:00:00+08', '2024-05-01 16:00:00+08'),

  -- 家犬 (07-08)
  ('a0000001-ae50-0000-0000-000000000007', '柴犬太郎',     NULL, 'user', '汪汪企劃',   '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-04-01"}'::jsonb,
   '2024-04-01 09:00:00+08', '2024-04-01 09:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000008', '哈士奇公爵',   NULL, 'user', '汪汪企劃',   '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-07-15"}'::jsonb,
   '2024-07-10 13:00:00+08', '2024-07-10 13:00:00+08'),

  -- 穴兔 (09)
  ('a0000001-ae50-0000-0000-000000000009', '月兔姬',       NULL, 'user', NULL,          '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-09-15"}'::jsonb,
   '2024-09-01 08:00:00+08', '2024-09-01 08:00:00+08'),

  -- 渡鴉 (10)
  ('a0000001-ae50-0000-0000-000000000010', '闇鴉使者',     NULL, 'user', '暗影組織',   '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-10-31"}'::jsonb,
   '2024-10-15 22:00:00+08', '2024-10-15 22:00:00+08'),

  -- 野貓 (11)
  ('a0000001-ae50-0000-0000-000000000011', '山貓獵人',     NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-08-10"}'::jsonb,
   '2024-08-01 14:00:00+08', '2024-08-01 14:00:00+08'),

  -- 虎 (12)
  ('a0000001-ae50-0000-0000-000000000012', '白虎將軍',     NULL, 'user', '百獸團',     '__TEST_DATA__', '["TW","JP"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-11-01"}'::jsonb,
   '2024-11-01 10:00:00+08', '2024-11-01 10:00:00+08'),

  -- 赤狐 (13)
  ('a0000001-ae50-0000-0000-000000000013', '紅狐娘',       NULL, 'user', NULL,          '__TEST_DATA__', '["US"]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2024-03-01"}'::jsonb,
   '2024-03-01 15:00:00+08', '2024-03-01 15:00:00+08'),

  -- 金剛鸚鵡 (14)
  ('a0000001-ae50-0000-0000-000000000014', '彩虹鸚鵡',     NULL, 'user', NULL,          '__TEST_DATA__', '["US"]'::jsonb,
   '{"gender":"無性別","activity_status":"active","debut_date":"2025-02-14"}'::jsonb,
   '2025-02-14 08:00:00+08', '2025-02-14 08:00:00+08'),

  -- 綠蠵龜 (15)
  ('a0000001-ae50-0000-0000-000000000015', '海龜仙人',     NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2023-06-01"}'::jsonb,
   '2024-06-01 06:00:00+08', '2024-06-01 06:00:00+08'),

  -- ─── Group B: 屬(GENUS)級使用者 (user 16-21) ───

  -- 貓屬 (16)
  ('a0000001-ae50-0000-0000-000000000016', '泛貓少女',     NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"preparing"}'::jsonb,
   '2025-03-01 10:00:00+08', '2025-03-01 10:00:00+08'),

  -- 豹屬 (17)
  ('a0000001-ae50-0000-0000-000000000017', '豹紋歌姬',     NULL, 'user', '百獸團',     '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-01-15"}'::jsonb,
   '2025-01-15 12:00:00+08', '2025-01-15 12:00:00+08'),

  -- 鴉屬 (18)
  ('a0000001-ae50-0000-0000-000000000018', '烏鴉先知',     NULL, 'user', NULL,          '__TEST_DATA__', '["GB"]'::jsonb,
   '{"gender":"流動","activity_status":"active","debut_date":"2025-03-20"}'::jsonb,
   '2025-03-20 09:00:00+08', '2025-03-20 09:00:00+08'),

  -- 狐屬 (19)
  ('a0000001-ae50-0000-0000-000000000019', '狐狸博士',     NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2024-12-01"}'::jsonb,
   '2024-12-01 20:00:00+08', '2024-12-01 20:00:00+08'),

  -- 犬屬 (20)
  ('a0000001-ae50-0000-0000-000000000020', '犬族戰士',     NULL, 'user', '汪汪企劃',   '__TEST_DATA__', '["US"]'::jsonb,
   '{"activity_status":"preparing"}'::jsonb,
   '2025-04-01 08:00:00+08', '2025-04-01 08:00:00+08'),

  -- 兔屬 (21)
  ('a0000001-ae50-0000-0000-000000000021', '兔兔俠',       NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"不適用","activity_status":"preparing"}'::jsonb,
   '2025-05-01 10:00:00+08', '2025-05-01 10:00:00+08'),

  -- ─── Group C: 科(FAMILY)級使用者 (user 22-25) ───

  -- 貓科 (22)
  ('a0000001-ae50-0000-0000-000000000022', '貓科代言人',   NULL, 'user', '百獸團',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-08-08"}'::jsonb,
   '2024-08-08 08:08:00+08', '2024-08-08 08:08:00+08'),

  -- 犬科 (23)
  ('a0000001-ae50-0000-0000-000000000023', '犬科總長',     NULL, 'user', '汪汪企劃',   '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2024-06-15"}'::jsonb,
   '2024-06-15 14:00:00+08', '2024-06-15 14:00:00+08'),

  -- 鴉科 (24)
  ('a0000001-ae50-0000-0000-000000000024', '鴉科學者',     NULL, 'user', NULL,          '__TEST_DATA__', '["GB"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-06-01"}'::jsonb,
   '2025-06-01 11:00:00+08', '2025-06-01 11:00:00+08'),

  -- 鸚鵡科 (25)
  ('a0000001-ae50-0000-0000-000000000025', '鸚鵡大師',     NULL, 'user', NULL,          '__TEST_DATA__', '["US"]'::jsonb,
   '{"activity_status":"hiatus"}'::jsonb,
   '2025-07-01 09:00:00+08', '2025-07-01 09:00:00+08'),

  -- ─── Group D: 目(ORDER)級使用者 (user 26-28) ───

  -- 食肉目 (26)
  ('a0000001-ae50-0000-0000-000000000026', '肉食派對長',   NULL, 'user', NULL,          '__TEST_DATA__', '["TW","KR"]'::jsonb,
   '{"gender":"Agender","activity_status":"active","debut_date":"2024-04-20"}'::jsonb,
   '2024-04-20 16:00:00+08', '2024-04-20 16:00:00+08'),

  -- 兔形目 (27)
  ('a0000001-ae50-0000-0000-000000000027', '兔形目守護者', NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2024-09-01"}'::jsonb,
   '2024-09-01 07:00:00+08', '2024-09-01 07:00:00+08'),

  -- 龜鱉目 (28)
  ('a0000001-ae50-0000-0000-000000000028', '龜仙人二號',   NULL, 'user', '水族館',     '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2025-04-01"}'::jsonb,
   '2025-04-01 12:00:00+08', '2025-04-01 12:00:00+08'),

  -- ─── Group E: 綱(CLASS)級使用者 (user 29-31) ───

  -- 哺乳綱 (29)
  ('a0000001-ae50-0000-0000-000000000029', '哺乳類大使',   NULL, 'user', '百獸團',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2024-07-07"}'::jsonb,
   '2024-07-07 07:07:00+08', '2024-07-07 07:07:00+08'),

  -- 鳥綱 (30)
  ('a0000001-ae50-0000-0000-000000000030', '鳥人間',       NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"activity_status":"active"}'::jsonb,
   '2025-08-01 08:00:00+08', '2025-08-01 08:00:00+08'),

  -- 爬蟲綱 (31)
  ('a0000001-ae50-0000-0000-000000000031', '爬蟲領主',     NULL, 'user', '水族館',     '__TEST_DATA__', '["US"]'::jsonb,
   '{"gender":"女","activity_status":"preparing","debut_date":"2025-09-01"}'::jsonb,
   '2025-09-01 10:00:00+08', '2025-09-01 10:00:00+08'),

  -- ─── Group F: 虛構物種使用者 (user 32-35) ───

  ('a0000001-ae50-0000-0000-000000000032', '狐仙大人',     NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-01-01"}'::jsonb,
   '2024-01-01 00:00:00+08', '2024-01-01 00:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000033', '精靈弓手',     NULL, 'user', '異世界公會', '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2024-11-11"}'::jsonb,
   '2024-11-11 11:11:00+08', '2024-11-11 11:11:00+08'),

  ('a0000001-ae50-0000-0000-000000000034', '史萊姆勇者',   NULL, 'user', '異世界公會', '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"去性別","activity_status":"preparing","debut_date":"2025-04-01"}'::jsonb,
   '2025-04-01 12:00:00+08', '2025-04-01 12:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000035', '龍族末裔',     NULL, 'user', NULL,          '__TEST_DATA__', '["KR"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-05-05"}'::jsonb,
   '2025-05-05 17:00:00+08', '2025-05-05 17:00:00+08'),

  -- ─── Group G: 複合種（同時有現實+虛構 trait）(user 36-37) ───

  ('a0000001-ae50-0000-0000-000000000036', '半妖貓娘',     NULL, 'user', NULL,          '__TEST_DATA__', '["TW","JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-06-15"}'::jsonb,
   '2025-06-15 15:00:00+08', '2025-06-15 15:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000037', '機械狼人',     NULL, 'user', '暗影組織',   '__TEST_DATA__', '["US","GB"]'::jsonb,
   '{"gender":"Nonbinary","activity_status":"active","debut_date":"2025-07-01"}'::jsonb,
   '2025-07-01 20:00:00+08', '2025-07-01 20:00:00+08'),

  -- ─── Group H: 品種(BREED)級使用者 (user 38-39) ───

  ('a0000001-ae50-0000-0000-000000000038', '布偶貓小姐',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2025-08-01"}'::jsonb,
   '2025-08-01 08:00:00+08', '2025-08-01 08:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000039', '柴犬小次郎',   NULL, 'user', NULL,          '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2025-03-01"}'::jsonb,
   '2025-03-01 14:00:00+08', '2025-03-01 14:00:00+08'),

  -- ─── Group I: 無 trait 使用者（測試 has_traits 篩選）(user 40) ───

  ('a0000001-ae50-0000-0000-000000000040', '新人未設定',   NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{}'::jsonb,
   '2025-10-01 10:00:00+08', '2025-10-01 10:00:00+08')
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────
-- 4. oauth_accounts（混合平台）
-- ──────────────────────────────────────────────
INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id, provider_display_name)
VALUES
  -- YouTube only (user 01,03,05,09,10,12,16,22,26,29,32,35,38)
  ('b0000001-ae50-0000-0000-000000000001', 'a0000001-ae50-0000-0000-000000000001', 'youtube', 'UC_TEST_0001', '貓咪大王'),
  ('b0000001-ae50-0000-0000-000000000003', 'a0000001-ae50-0000-0000-000000000003', 'youtube', 'UC_TEST_0003', '橘貓戰士'),
  ('b0000001-ae50-0000-0000-000000000005', 'a0000001-ae50-0000-0000-000000000005', 'youtube', 'UC_TEST_0005', '獅王雷歐'),
  ('b0000001-ae50-0000-0000-000000000009', 'a0000001-ae50-0000-0000-000000000009', 'youtube', 'UC_TEST_0009', '月兔姬'),
  ('b0000001-ae50-0000-0000-000000000010', 'a0000001-ae50-0000-0000-000000000010', 'youtube', 'UC_TEST_0010', '闇鴉使者'),
  ('b0000001-ae50-0000-0000-000000000012', 'a0000001-ae50-0000-0000-000000000012', 'youtube', 'UC_TEST_0012', '白虎將軍'),
  ('b0000001-ae50-0000-0000-000000000016', 'a0000001-ae50-0000-0000-000000000016', 'youtube', 'UC_TEST_0016', '泛貓少女'),
  ('b0000001-ae50-0000-0000-000000000022', 'a0000001-ae50-0000-0000-000000000022', 'youtube', 'UC_TEST_0022', '貓科代言人'),
  ('b0000001-ae50-0000-0000-000000000026', 'a0000001-ae50-0000-0000-000000000026', 'youtube', 'UC_TEST_0026', '肉食派對長'),
  ('b0000001-ae50-0000-0000-000000000029', 'a0000001-ae50-0000-0000-000000000029', 'youtube', 'UC_TEST_0029', '哺乳類大使'),
  ('b0000001-ae50-0000-0000-000000000032', 'a0000001-ae50-0000-0000-000000000032', 'youtube', 'UC_TEST_0032', '狐仙大人'),
  ('b0000001-ae50-0000-0000-000000000035', 'a0000001-ae50-0000-0000-000000000035', 'youtube', 'UC_TEST_0035', '龍族末裔'),
  ('b0000001-ae50-0000-0000-000000000038', 'a0000001-ae50-0000-0000-000000000038', 'youtube', 'UC_TEST_0038', '布偶貓小姐'),

  -- Twitch only (user 04,06,11,13,15,19,21,25,27,30,33,34,39,40)
  ('b0000001-ae50-0000-0000-000000000004', 'a0000001-ae50-0000-0000-000000000004', 'twitch', 'TW_TEST_0004', '黑貓魔女'),
  ('b0000001-ae50-0000-0000-000000000006', 'a0000001-ae50-0000-0000-000000000006', 'twitch', 'TW_TEST_0006', '小獅妹'),
  ('b0000001-ae50-0000-0000-000000000011', 'a0000001-ae50-0000-0000-000000000011', 'twitch', 'TW_TEST_0011', '山貓獵人'),
  ('b0000001-ae50-0000-0000-000000000013', 'a0000001-ae50-0000-0000-000000000013', 'twitch', 'TW_TEST_0013', '紅狐娘'),
  ('b0000001-ae50-0000-0000-000000000015', 'a0000001-ae50-0000-0000-000000000015', 'twitch', 'TW_TEST_0015', '海龜仙人'),
  ('b0000001-ae50-0000-0000-000000000019', 'a0000001-ae50-0000-0000-000000000019', 'twitch', 'TW_TEST_0019', '狐狸博士'),
  ('b0000001-ae50-0000-0000-000000000021', 'a0000001-ae50-0000-0000-000000000021', 'twitch', 'TW_TEST_0021', '兔兔俠'),
  ('b0000001-ae50-0000-0000-000000000025', 'a0000001-ae50-0000-0000-000000000025', 'twitch', 'TW_TEST_0025', '鸚鵡大師'),
  ('b0000001-ae50-0000-0000-000000000027', 'a0000001-ae50-0000-0000-000000000027', 'twitch', 'TW_TEST_0027', '兔形目守護者'),
  ('b0000001-ae50-0000-0000-000000000030', 'a0000001-ae50-0000-0000-000000000030', 'twitch', 'TW_TEST_0030', '鳥人間'),
  ('b0000001-ae50-0000-0000-000000000033', 'a0000001-ae50-0000-0000-000000000033', 'twitch', 'TW_TEST_0033', '精靈弓手'),
  ('b0000001-ae50-0000-0000-000000000034', 'a0000001-ae50-0000-0000-000000000034', 'twitch', 'TW_TEST_0034', '史萊姆勇者'),
  ('b0000001-ae50-0000-0000-000000000039', 'a0000001-ae50-0000-0000-000000000039', 'twitch', 'TW_TEST_0039', '柴犬小次郎'),
  ('b0000001-ae50-0000-0000-000000000040', 'a0000001-ae50-0000-0000-000000000040', 'twitch', 'TW_TEST_0040', '新人未設定'),

  -- Both platforms (user 02,07,08,14,17,18,20,23,24,28,31,36,37)
  ('b0000001-ae50-0000-0000-000000000002', 'a0000001-ae50-0000-0000-000000000002', 'youtube', 'UC_TEST_0002', '白貓公主'),
  ('b0000001-ae50-0000-0000-000000000102', 'a0000001-ae50-0000-0000-000000000002', 'twitch',  'TW_TEST_0002', '白貓公主'),
  ('b0000001-ae50-0000-0000-000000000007', 'a0000001-ae50-0000-0000-000000000007', 'youtube', 'UC_TEST_0007', '柴犬太郎'),
  ('b0000001-ae50-0000-0000-000000000107', 'a0000001-ae50-0000-0000-000000000007', 'twitch',  'TW_TEST_0007', '柴犬太郎'),
  ('b0000001-ae50-0000-0000-000000000008', 'a0000001-ae50-0000-0000-000000000008', 'youtube', 'UC_TEST_0008', '哈士奇公爵'),
  ('b0000001-ae50-0000-0000-000000000108', 'a0000001-ae50-0000-0000-000000000008', 'twitch',  'TW_TEST_0008', '哈士奇公爵'),
  ('b0000001-ae50-0000-0000-000000000014', 'a0000001-ae50-0000-0000-000000000014', 'youtube', 'UC_TEST_0014', '彩虹鸚鵡'),
  ('b0000001-ae50-0000-0000-000000000114', 'a0000001-ae50-0000-0000-000000000014', 'twitch',  'TW_TEST_0014', '彩虹鸚鵡'),
  ('b0000001-ae50-0000-0000-000000000017', 'a0000001-ae50-0000-0000-000000000017', 'youtube', 'UC_TEST_0017', '豹紋歌姬'),
  ('b0000001-ae50-0000-0000-000000000117', 'a0000001-ae50-0000-0000-000000000017', 'twitch',  'TW_TEST_0017', '豹紋歌姬'),
  ('b0000001-ae50-0000-0000-000000000018', 'a0000001-ae50-0000-0000-000000000018', 'youtube', 'UC_TEST_0018', '烏鴉先知'),
  ('b0000001-ae50-0000-0000-000000000118', 'a0000001-ae50-0000-0000-000000000018', 'twitch',  'TW_TEST_0018', '烏鴉先知'),
  ('b0000001-ae50-0000-0000-000000000020', 'a0000001-ae50-0000-0000-000000000020', 'youtube', 'UC_TEST_0020', '犬族戰士'),
  ('b0000001-ae50-0000-0000-000000000120', 'a0000001-ae50-0000-0000-000000000020', 'twitch',  'TW_TEST_0020', '犬族戰士'),
  ('b0000001-ae50-0000-0000-000000000023', 'a0000001-ae50-0000-0000-000000000023', 'youtube', 'UC_TEST_0023', '犬科總長'),
  ('b0000001-ae50-0000-0000-000000000123', 'a0000001-ae50-0000-0000-000000000023', 'twitch',  'TW_TEST_0023', '犬科總長'),
  ('b0000001-ae50-0000-0000-000000000024', 'a0000001-ae50-0000-0000-000000000024', 'youtube', 'UC_TEST_0024', '鴉科學者'),
  ('b0000001-ae50-0000-0000-000000000124', 'a0000001-ae50-0000-0000-000000000024', 'twitch',  'TW_TEST_0024', '鴉科學者'),
  ('b0000001-ae50-0000-0000-000000000028', 'a0000001-ae50-0000-0000-000000000028', 'youtube', 'UC_TEST_0028', '龜仙人二號'),
  ('b0000001-ae50-0000-0000-000000000128', 'a0000001-ae50-0000-0000-000000000028', 'twitch',  'TW_TEST_0028', '龜仙人二號'),
  ('b0000001-ae50-0000-0000-000000000031', 'a0000001-ae50-0000-0000-000000000031', 'youtube', 'UC_TEST_0031', '爬蟲領主'),
  ('b0000001-ae50-0000-0000-000000000131', 'a0000001-ae50-0000-0000-000000000031', 'twitch',  'TW_TEST_0031', '爬蟲領主'),
  ('b0000001-ae50-0000-0000-000000000036', 'a0000001-ae50-0000-0000-000000000036', 'youtube', 'UC_TEST_0036', '半妖貓娘'),
  ('b0000001-ae50-0000-0000-000000000136', 'a0000001-ae50-0000-0000-000000000036', 'twitch',  'TW_TEST_0036', '半妖貓娘'),
  ('b0000001-ae50-0000-0000-000000000037', 'a0000001-ae50-0000-0000-000000000037', 'youtube', 'UC_TEST_0037', '機械狼人'),
  ('b0000001-ae50-0000-0000-000000000137', 'a0000001-ae50-0000-0000-000000000037', 'twitch',  'TW_TEST_0037', '機械狼人')
ON CONFLICT (provider, provider_account_id) DO NOTHING;

-- ──────────────────────────────────────────────
-- 5. vtuber_traits — 現實物種
-- ──────────────────────────────────────────────
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id, breed_id)
VALUES
  -- Group A: SPECIES 級
  ('c0000001-ae50-0000-0000-000000000001', 'a0000001-ae50-0000-0000-000000000001', 9999901, NULL, NULL), -- 貓咪大王 → 家貓
  ('c0000001-ae50-0000-0000-000000000002', 'a0000001-ae50-0000-0000-000000000002', 9999901, NULL, NULL), -- 白貓公主 → 家貓
  ('c0000001-ae50-0000-0000-000000000003', 'a0000001-ae50-0000-0000-000000000003', 9999901, NULL, NULL), -- 橘貓戰士 → 家貓
  ('c0000001-ae50-0000-0000-000000000004', 'a0000001-ae50-0000-0000-000000000004', 9999901, NULL, NULL), -- 黑貓魔女 → 家貓
  ('c0000001-ae50-0000-0000-000000000005', 'a0000001-ae50-0000-0000-000000000005', 9999902, NULL, NULL), -- 獅王雷歐 → 獅
  ('c0000001-ae50-0000-0000-000000000006', 'a0000001-ae50-0000-0000-000000000006', 9999902, NULL, NULL), -- 小獅妹 → 獅
  ('c0000001-ae50-0000-0000-000000000007', 'a0000001-ae50-0000-0000-000000000007', 9999903, NULL, NULL), -- 柴犬太郎 → 家犬
  ('c0000001-ae50-0000-0000-000000000008', 'a0000001-ae50-0000-0000-000000000008', 9999903, NULL, NULL), -- 哈士奇公爵 → 家犬
  ('c0000001-ae50-0000-0000-000000000009', 'a0000001-ae50-0000-0000-000000000009', 9999904, NULL, NULL), -- 月兔姬 → 穴兔
  ('c0000001-ae50-0000-0000-000000000010', 'a0000001-ae50-0000-0000-000000000010', 9999905, NULL, NULL), -- 闇鴉使者 → 渡鴉
  ('c0000001-ae50-0000-0000-000000000011', 'a0000001-ae50-0000-0000-000000000011', 9999906, NULL, NULL), -- 山貓獵人 → 野貓
  ('c0000001-ae50-0000-0000-000000000012', 'a0000001-ae50-0000-0000-000000000012', 9999907, NULL, NULL), -- 白虎將軍 → 虎
  ('c0000001-ae50-0000-0000-000000000013', 'a0000001-ae50-0000-0000-000000000013', 9999908, NULL, NULL), -- 紅狐娘 → 赤狐
  ('c0000001-ae50-0000-0000-000000000014', 'a0000001-ae50-0000-0000-000000000014', 9999909, NULL, NULL), -- 彩虹鸚鵡 → 金剛鸚鵡
  ('c0000001-ae50-0000-0000-000000000015', 'a0000001-ae50-0000-0000-000000000015', 9999910, NULL, NULL), -- 海龜仙人 → 綠蠵龜

  -- Group B: GENUS 級
  ('c0000001-ae50-0000-0000-000000000016', 'a0000001-ae50-0000-0000-000000000016', 9999911, NULL, NULL), -- 泛貓少女 → 貓屬
  ('c0000001-ae50-0000-0000-000000000017', 'a0000001-ae50-0000-0000-000000000017', 9999912, NULL, NULL), -- 豹紋歌姬 → 豹屬
  ('c0000001-ae50-0000-0000-000000000018', 'a0000001-ae50-0000-0000-000000000018', 9999913, NULL, NULL), -- 烏鴉先知 → 鴉屬
  ('c0000001-ae50-0000-0000-000000000019', 'a0000001-ae50-0000-0000-000000000019', 9999914, NULL, NULL), -- 狐狸博士 → 狐屬
  ('c0000001-ae50-0000-0000-000000000020', 'a0000001-ae50-0000-0000-000000000020', 9999915, NULL, NULL), -- 犬族戰士 → 犬屬
  ('c0000001-ae50-0000-0000-000000000021', 'a0000001-ae50-0000-0000-000000000021', 9999916, NULL, NULL), -- 兔兔俠 → 兔屬

  -- Group C: FAMILY 級
  ('c0000001-ae50-0000-0000-000000000022', 'a0000001-ae50-0000-0000-000000000022', 9999917, NULL, NULL), -- 貓科代言人 → 貓科
  ('c0000001-ae50-0000-0000-000000000023', 'a0000001-ae50-0000-0000-000000000023', 9999918, NULL, NULL), -- 犬科總長 → 犬科
  ('c0000001-ae50-0000-0000-000000000024', 'a0000001-ae50-0000-0000-000000000024', 9999919, NULL, NULL), -- 鴉科學者 → 鴉科
  ('c0000001-ae50-0000-0000-000000000025', 'a0000001-ae50-0000-0000-000000000025', 9999920, NULL, NULL), -- 鸚鵡大師 → 鸚鵡科

  -- Group D: ORDER 級
  ('c0000001-ae50-0000-0000-000000000026', 'a0000001-ae50-0000-0000-000000000026', 9999921, NULL, NULL), -- 肉食派對長 → 食肉目
  ('c0000001-ae50-0000-0000-000000000027', 'a0000001-ae50-0000-0000-000000000027', 9999922, NULL, NULL), -- 兔形目守護者 → 兔形目
  ('c0000001-ae50-0000-0000-000000000028', 'a0000001-ae50-0000-0000-000000000028', 9999923, NULL, NULL), -- 龜仙人二號 → 龜鱉目

  -- Group E: CLASS 級
  ('c0000001-ae50-0000-0000-000000000029', 'a0000001-ae50-0000-0000-000000000029', 9999924, NULL, NULL), -- 哺乳類大使 → 哺乳綱
  ('c0000001-ae50-0000-0000-000000000030', 'a0000001-ae50-0000-0000-000000000030', 9999925, NULL, NULL), -- 鳥人間 → 鳥綱
  ('c0000001-ae50-0000-0000-000000000031', 'a0000001-ae50-0000-0000-000000000031', 9999926, NULL, NULL)  -- 爬蟲領主 → 爬蟲綱
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 6. vtuber_traits — 虛構物種
-- ──────────────────────────────────────────────
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000032'::uuid, 'a0000001-ae50-0000-0000-000000000032'::uuid, NULL, id
FROM fictional_species WHERE name = 'Nine-tailed Fox' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000033'::uuid, 'a0000001-ae50-0000-0000-000000000033'::uuid, NULL, id
FROM fictional_species WHERE name = 'Elf (Fantasy)' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000034'::uuid, 'a0000001-ae50-0000-0000-000000000034'::uuid, NULL, id
FROM fictional_species WHERE name = 'Slime' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000035'::uuid, 'a0000001-ae50-0000-0000-000000000035'::uuid, NULL, id
FROM fictional_species WHERE name = 'Dragon (Eastern)' LIMIT 1
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 7. vtuber_traits — 複合種（現實 + 虛構 各一筆）
-- ──────────────────────────────────────────────
-- 半妖貓娘: 家貓(現實) + 貓又(虛構)
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
VALUES ('c0000001-ae50-0000-0000-000000000036', 'a0000001-ae50-0000-0000-000000000036', 9999901, NULL)
ON CONFLICT DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000136'::uuid, 'a0000001-ae50-0000-0000-000000000036'::uuid, NULL, id
FROM fictional_species WHERE name = 'Nekomata' LIMIT 1
ON CONFLICT DO NOTHING;

-- 機械狼人: 家犬(現實) + 狼人(虛構)
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
VALUES ('c0000001-ae50-0000-0000-000000000037', 'a0000001-ae50-0000-0000-000000000037', 9999903, NULL)
ON CONFLICT DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id)
SELECT 'c0000001-ae50-0000-0000-000000000137'::uuid, 'a0000001-ae50-0000-0000-000000000037'::uuid, NULL, id
FROM fictional_species WHERE name = 'Werewolf' LIMIT 1
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 8. vtuber_traits — 品種級（breed_id 關聯）
-- ──────────────────────────────────────────────
-- 布偶貓小姐 → 家貓 + 布偶貓品種
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id, breed_id)
SELECT 'c0000001-ae50-0000-0000-000000000038'::uuid, 'a0000001-ae50-0000-0000-000000000038'::uuid, 9999901, NULL, id
FROM breeds WHERE taxon_id = 9999901 AND name_en = '__TEST__ Ragdoll' LIMIT 1
ON CONFLICT DO NOTHING;

-- 柴犬小次郎 → 家犬 + 柴犬品種
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id, breed_id)
SELECT 'c0000001-ae50-0000-0000-000000000039'::uuid, 'a0000001-ae50-0000-0000-000000000039'::uuid, 9999903, NULL, id
FROM breeds WHERE taxon_id = 9999903 AND name_en = '__TEST__ Shiba Inu' LIMIT 1
ON CONFLICT DO NOTHING;

-- user 40 (新人未設定) 不建立任何 trait

-- ──────────────────────────────────────────────
-- 9. 布偶貓大軍 — 20 個品種級使用者 (user 41-60)
--    全部掛在 家貓(9999901) + 布偶貓品種(__TEST__ Ragdoll)
--    篩選維度分散：國旗/性別/狀態/組織/平台 各有不同
-- ──────────────────────────────────────────────

INSERT INTO users (id, display_name, avatar_url, role, organization, bio, country_flags, profile_data, created_at, updated_at)
VALUES
  ('a0000001-ae50-0000-0000-000000000041', '布偶貓01號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-01-20"}'::jsonb,
   '2024-01-20 08:00:00+08', '2024-01-20 08:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000042', '布偶貓02號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-02-10"}'::jsonb,
   '2024-02-10 09:00:00+08', '2024-02-10 09:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000043', '布偶貓03號',   NULL, 'user', NULL,          '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-03-05"}'::jsonb,
   '2024-03-05 10:00:00+08', '2024-03-05 10:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000044', '布偶貓04號',   NULL, 'user', NULL,          '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2024-04-15"}'::jsonb,
   '2024-04-15 11:00:00+08', '2024-04-15 11:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000045', '布偶貓05號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["US"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-05-20"}'::jsonb,
   '2024-05-20 12:00:00+08', '2024-05-20 12:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000046', '布偶貓06號',   NULL, 'user', NULL,          '__TEST_DATA__', '["KR"]'::jsonb,
   '{"gender":"流動","activity_status":"active","debut_date":"2024-06-10"}'::jsonb,
   '2024-06-10 13:00:00+08', '2024-06-10 13:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000047', '布偶貓07號',   NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2024-07-25"}'::jsonb,
   '2024-07-25 14:00:00+08', '2024-07-25 14:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000048', '布偶貓08號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2024-08-30"}'::jsonb,
   '2024-08-30 15:00:00+08', '2024-08-30 15:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000049', '布偶貓09號',   NULL, 'user', NULL,          '__TEST_DATA__', '["GB"]'::jsonb,
   '{"activity_status":"preparing"}'::jsonb,
   '2024-09-15 16:00:00+08', '2024-09-15 16:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000050', '布偶貓10號',   NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-10-10"}'::jsonb,
   '2024-10-10 17:00:00+08', '2024-10-10 17:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000051', '布偶貓11號',   NULL, 'user', NULL,          '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"男","activity_status":"hiatus","debut_date":"2024-11-05"}'::jsonb,
   '2024-11-05 18:00:00+08', '2024-11-05 18:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000052', '布偶貓12號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"女","activity_status":"active","debut_date":"2024-12-20"}'::jsonb,
   '2024-12-20 19:00:00+08', '2024-12-20 19:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000053', '布偶貓13號',   NULL, 'user', NULL,          '__TEST_DATA__', '["US"]'::jsonb,
   '{"gender":"Nonbinary","activity_status":"active","debut_date":"2025-01-10"}'::jsonb,
   '2025-01-10 08:00:00+08', '2025-01-10 08:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000054', '布偶貓14號',   NULL, 'user', NULL,          '__TEST_DATA__', '["TW","JP"]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2025-02-15"}'::jsonb,
   '2025-02-15 09:00:00+08', '2025-02-15 09:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000055', '布偶貓15號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["KR"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2025-03-10"}'::jsonb,
   '2025-03-10 10:00:00+08', '2025-03-10 10:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000056', '布偶貓16號',   NULL, 'user', NULL,          '__TEST_DATA__', '[]'::jsonb,
   '{"gender":"女","activity_status":"preparing"}'::jsonb,
   '2025-04-05 11:00:00+08', '2025-04-05 11:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000057', '布偶貓17號',   NULL, 'user', NULL,          '__TEST_DATA__', '["TW"]'::jsonb,
   '{"gender":"男","activity_status":"active","debut_date":"2025-05-20"}'::jsonb,
   '2025-05-20 12:00:00+08', '2025-05-20 12:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000058', '布偶貓18號',   NULL, 'user', '喵喵社',     '__TEST_DATA__', '["JP"]'::jsonb,
   '{"gender":"女","activity_status":"hiatus","debut_date":"2025-06-15"}'::jsonb,
   '2025-06-15 13:00:00+08', '2025-06-15 13:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000059', '布偶貓19號',   NULL, 'user', NULL,          '__TEST_DATA__', '["US"]'::jsonb,
   '{"activity_status":"active","debut_date":"2025-07-10"}'::jsonb,
   '2025-07-10 14:00:00+08', '2025-07-10 14:00:00+08'),

  ('a0000001-ae50-0000-0000-000000000060', '布偶貓20號',   NULL, 'user', NULL,          '__TEST_DATA__', '["GB"]'::jsonb,
   '{"gender":"女","activity_status":"preparing","debut_date":"2025-08-01"}'::jsonb,
   '2025-08-01 15:00:00+08', '2025-08-01 15:00:00+08')
ON CONFLICT (id) DO NOTHING;

-- oauth_accounts for 布偶貓大軍
INSERT INTO oauth_accounts (id, user_id, provider, provider_account_id, provider_display_name)
VALUES
  -- YouTube only (41,42,48,50,55,57)
  ('b0000001-ae50-0000-0000-000000000041', 'a0000001-ae50-0000-0000-000000000041', 'youtube', 'UC_TEST_0041', '布偶貓01號'),
  ('b0000001-ae50-0000-0000-000000000042', 'a0000001-ae50-0000-0000-000000000042', 'youtube', 'UC_TEST_0042', '布偶貓02號'),
  ('b0000001-ae50-0000-0000-000000000048', 'a0000001-ae50-0000-0000-000000000048', 'youtube', 'UC_TEST_0048', '布偶貓08號'),
  ('b0000001-ae50-0000-0000-000000000050', 'a0000001-ae50-0000-0000-000000000050', 'youtube', 'UC_TEST_0050', '布偶貓10號'),
  ('b0000001-ae50-0000-0000-000000000055', 'a0000001-ae50-0000-0000-000000000055', 'youtube', 'UC_TEST_0055', '布偶貓15號'),
  ('b0000001-ae50-0000-0000-000000000057', 'a0000001-ae50-0000-0000-000000000057', 'youtube', 'UC_TEST_0057', '布偶貓17號'),
  -- Twitch only (44,46,47,49,51,53,56,59)
  ('b0000001-ae50-0000-0000-000000000044', 'a0000001-ae50-0000-0000-000000000044', 'twitch', 'TW_TEST_0044', '布偶貓04號'),
  ('b0000001-ae50-0000-0000-000000000046', 'a0000001-ae50-0000-0000-000000000046', 'twitch', 'TW_TEST_0046', '布偶貓06號'),
  ('b0000001-ae50-0000-0000-000000000047', 'a0000001-ae50-0000-0000-000000000047', 'twitch', 'TW_TEST_0047', '布偶貓07號'),
  ('b0000001-ae50-0000-0000-000000000049', 'a0000001-ae50-0000-0000-000000000049', 'twitch', 'TW_TEST_0049', '布偶貓09號'),
  ('b0000001-ae50-0000-0000-000000000051', 'a0000001-ae50-0000-0000-000000000051', 'twitch', 'TW_TEST_0051', '布偶貓11號'),
  ('b0000001-ae50-0000-0000-000000000053', 'a0000001-ae50-0000-0000-000000000053', 'twitch', 'TW_TEST_0053', '布偶貓13號'),
  ('b0000001-ae50-0000-0000-000000000056', 'a0000001-ae50-0000-0000-000000000056', 'twitch', 'TW_TEST_0056', '布偶貓16號'),
  ('b0000001-ae50-0000-0000-000000000059', 'a0000001-ae50-0000-0000-000000000059', 'twitch', 'TW_TEST_0059', '布偶貓19號'),
  -- Both platforms (43,45,52,54,58,60)
  ('b0000001-ae50-0000-0000-000000000043', 'a0000001-ae50-0000-0000-000000000043', 'youtube', 'UC_TEST_0043', '布偶貓03號'),
  ('b0000001-ae50-0000-0000-000000000143', 'a0000001-ae50-0000-0000-000000000043', 'twitch',  'TW_TEST_0043', '布偶貓03號'),
  ('b0000001-ae50-0000-0000-000000000045', 'a0000001-ae50-0000-0000-000000000045', 'youtube', 'UC_TEST_0045', '布偶貓05號'),
  ('b0000001-ae50-0000-0000-000000000145', 'a0000001-ae50-0000-0000-000000000045', 'twitch',  'TW_TEST_0045', '布偶貓05號'),
  ('b0000001-ae50-0000-0000-000000000052', 'a0000001-ae50-0000-0000-000000000052', 'youtube', 'UC_TEST_0052', '布偶貓12號'),
  ('b0000001-ae50-0000-0000-000000000152', 'a0000001-ae50-0000-0000-000000000052', 'twitch',  'TW_TEST_0052', '布偶貓12號'),
  ('b0000001-ae50-0000-0000-000000000054', 'a0000001-ae50-0000-0000-000000000054', 'youtube', 'UC_TEST_0054', '布偶貓14號'),
  ('b0000001-ae50-0000-0000-000000000154', 'a0000001-ae50-0000-0000-000000000054', 'twitch',  'TW_TEST_0054', '布偶貓14號'),
  ('b0000001-ae50-0000-0000-000000000058', 'a0000001-ae50-0000-0000-000000000058', 'youtube', 'UC_TEST_0058', '布偶貓18號'),
  ('b0000001-ae50-0000-0000-000000000158', 'a0000001-ae50-0000-0000-000000000058', 'twitch',  'TW_TEST_0058', '布偶貓18號'),
  ('b0000001-ae50-0000-0000-000000000060', 'a0000001-ae50-0000-0000-000000000060', 'youtube', 'UC_TEST_0060', '布偶貓20號'),
  ('b0000001-ae50-0000-0000-000000000160', 'a0000001-ae50-0000-0000-000000000060', 'twitch',  'TW_TEST_0060', '布偶貓20號')
ON CONFLICT (provider, provider_account_id) DO NOTHING;

-- vtuber_traits for 布偶貓大軍 — 全部掛 家貓(9999901) + 布偶貓品種
INSERT INTO vtuber_traits (id, user_id, taxon_id, fictional_species_id, breed_id)
SELECT
  ('c0000001-ae50-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  ('a0000001-ae50-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  9999901, NULL, b.id
FROM breeds b, generate_series(41, 60) AS n
WHERE b.taxon_id = 9999901 AND b.name_en = '__TEST__ Ragdoll'
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- 驗證查詢（執行後確認資料正確）
-- ============================================================
-- SET search_path TO staging, public;
-- SELECT count(*) AS test_users         FROM users          WHERE bio = '__TEST_DATA__';        -- 預期 60
-- SELECT count(*) AS test_species       FROM species_cache  WHERE taxon_id BETWEEN 9999901 AND 9999926;  -- 預期 26
-- SELECT count(*) AS test_breeds        FROM breeds         WHERE name_en LIKE '__TEST__%';     -- 預期 4
-- SELECT count(*) AS test_oauth         FROM oauth_accounts WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__');
-- SELECT count(*) AS test_traits        FROM vtuber_traits  WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__');
-- SELECT count(*) AS test_real_traits   FROM vtuber_traits  WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__') AND taxon_id IS NOT NULL;
-- SELECT count(*) AS test_fict_traits   FROM vtuber_traits  WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__') AND fictional_species_id IS NOT NULL;
--
-- 各分類階層使用者數:
-- SELECT sc.taxon_rank, count(DISTINCT vt.user_id) AS user_count
-- FROM vtuber_traits vt
-- JOIN species_cache sc ON vt.taxon_id = sc.taxon_id
-- WHERE vt.user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__')
-- GROUP BY sc.taxon_rank ORDER BY sc.taxon_rank;
-- 預期: CLASS=3, FAMILY=4, GENUS=6, ORDER=3, SPECIES=37 (含品種22人+複合種2人)

-- ============================================================
-- 篩選器覆蓋矩陣摘要
-- ============================================================
-- 國旗:   TW(13+多國旗), JP(11), US(8), KR(5+多國旗), GB(4+多國旗), 無國旗(11), 多國旗(4)
-- 性別:   男(17), 女(22), 自訂文字(8), 未設定(13)
-- 狀態:   active(26), hiatus(16), preparing(9), 未設定(9)
-- 組織:   企業勢(21), 個人勢(39)
-- 平台:   YouTube only(19), Twitch only(22), 雙平台(19)
-- 分類層: SPECIES(15+22品種+2複合), GENUS(6), FAMILY(4), ORDER(3), CLASS(3)
-- 物種:   有trait(59), 無trait(1)
-- 品種:   布偶貓(21, 含原user38), 柴犬(1)


-- ============================================================
-- ▼▼▼ CLEANUP — 一鍵移除所有測試資料 ▼▼▼
-- 複製以下區塊單獨執行即可清除
-- ============================================================
-- BEGIN;
-- SET search_path TO staging, public;
-- DELETE FROM vtuber_traits    WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__');
-- DELETE FROM oauth_accounts   WHERE user_id IN (SELECT id FROM users WHERE bio = '__TEST_DATA__');
-- DELETE FROM users            WHERE bio = '__TEST_DATA__';
-- DELETE FROM breeds           WHERE name_en LIKE '__TEST__%';
-- DELETE FROM species_cache    WHERE taxon_id BETWEEN 9999901 AND 9999926;
-- COMMIT;
