-- ============================================================
-- VTaxon 虛構物種樹測試資料
-- 用途：驗證虛構物種樹狀圖功能（雙樹並排、展開收合、Focus 切換等）
-- 前置：需先執行 fictional_species.sql 種子資料
-- 清除：執行 cleanup_test_data.sql 即可一鍵移除
--       （所有使用者 organization = '__TEST__'，traits 透過 CASCADE 自動清除）
-- ============================================================

-- ============================================================
-- 1. users — 虛構物種專用測試使用者
--    UUID 前綴 00000000-7e57-f... (f = fictional)
-- ============================================================

INSERT INTO users (id, display_name, avatar_url, role, organization, country_flags) VALUES
-- ── 純虛構使用者（只有 fictional trait，沒有 real trait）──
('00000000-7e57-f001-0000-000000000001', '妖狐仙 KitsuneXian',       'https://i.pravatar.cc/150?u=ftest01', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f001-0000-000000000002', '天狗面 TenguMask',         'https://i.pravatar.cc/150?u=ftest02', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f001-0000-000000000003', '鬼太郎 OniTaro',           'https://i.pravatar.cc/150?u=ftest03', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f001-0000-000000000004', '河童水手 KappaSailor',     'https://i.pravatar.cc/150?u=ftest04', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f001-0000-000000000005', '雪女霜 YukiFrost',         'https://i.pravatar.cc/150?u=ftest05', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f001-0000-000000000006', '龍王 DragonKing',          'https://i.pravatar.cc/150?u=ftest06', 'user', '__TEST__', '["cn"]'),
('00000000-7e57-f001-0000-000000000007', '鳳凰羽 FengFeather',      'https://i.pravatar.cc/150?u=ftest07', 'user', '__TEST__', '["cn"]'),
('00000000-7e57-f001-0000-000000000008', '麒麟兒 QilinKid',          'https://i.pravatar.cc/150?u=ftest08', 'user', '__TEST__', '["cn"]'),
('00000000-7e57-f001-0000-000000000009', '九尾 NineTails',           'https://i.pravatar.cc/150?u=ftest09', 'user', '__TEST__', '["cn"]'),
('00000000-7e57-f001-0000-000000000010', '殭屍道長 JiangshiMaster', 'https://i.pravatar.cc/150?u=ftest10', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f001-0000-000000000011', '不死鳥 PhoenixWest',      'https://i.pravatar.cc/150?u=ftest11', 'user', '__TEST__', '["gr"]'),
('00000000-7e57-f001-0000-000000000012', '半人馬 CentaurArcher',    'https://i.pravatar.cc/150?u=ftest12', 'user', '__TEST__', '["gr"]'),
('00000000-7e57-f001-0000-000000000013', '梅杜莎 MedusaGaze',       'https://i.pravatar.cc/150?u=ftest13', 'user', '__TEST__', '["gr"]'),
('00000000-7e57-f001-0000-000000000014', '女武神 ValkyrieX',        'https://i.pravatar.cc/150?u=ftest14', 'user', '__TEST__', '["no"]'),
('00000000-7e57-f001-0000-000000000015', '芬里爾 FenrirFang',       'https://i.pravatar.cc/150?u=ftest15', 'user', '__TEST__', '["is"]'),
('00000000-7e57-f001-0000-000000000016', '吸血鬼伯爵 VampCount',    'https://i.pravatar.cc/150?u=ftest16', 'user', '__TEST__', '["ro"]'),
('00000000-7e57-f001-0000-000000000017', '狼人 WerewolfHowl',       'https://i.pravatar.cc/150?u=ftest17', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-f001-0000-000000000018', '獨角獸 UniStar',          'https://i.pravatar.cc/150?u=ftest18', 'user', '__TEST__', '["fr"]'),
('00000000-7e57-f001-0000-000000000019', '天使長 ArchAngel',        'https://i.pravatar.cc/150?u=ftest19', 'user', '__TEST__', '["va"]'),
('00000000-7e57-f001-0000-000000000020', '史萊姆王 SlimeKing',      'https://i.pravatar.cc/150?u=ftest20', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f001-0000-000000000021', '精靈公主 ElfPrincess',    'https://i.pravatar.cc/150?u=ftest21', 'user', '__TEST__', '["tw"]'),

-- ── 密集群組測試：多人掛在同一個虛構種（>5 觸發 grid layout）──
('00000000-7e57-f002-0000-000000000001', '妖狐壹 Kitsune1',         'https://i.pravatar.cc/150?u=ftest30', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f002-0000-000000000002', '妖狐貳 Kitsune2',         'https://i.pravatar.cc/150?u=ftest31', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f002-0000-000000000003', '妖狐參 Kitsune3',         'https://i.pravatar.cc/150?u=ftest32', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f002-0000-000000000004', '妖狐肆 Kitsune4',         'https://i.pravatar.cc/150?u=ftest33', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f002-0000-000000000005', '妖狐伍 Kitsune5',         'https://i.pravatar.cc/150?u=ftest34', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f002-0000-000000000006', '妖狐陸 Kitsune6',         'https://i.pravatar.cc/150?u=ftest35', 'user', '__TEST__', '["jp"]'),

-- ── 複合種測試：同時擁有 real + fictional trait ──
-- （重用既有測試使用者；若不存在則新增）
('00000000-7e57-f003-0000-000000000001', '龍狐 DragonFox',           'https://i.pravatar.cc/150?u=ftest40', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f003-0000-000000000002', '吸血貓 VampCat',          'https://i.pravatar.cc/150?u=ftest41', 'user', '__TEST__', '["ro","tw"]'),
('00000000-7e57-f003-0000-000000000003', '天使犬 AngelDog',         'https://i.pravatar.cc/150?u=ftest42', 'user', '__TEST__', '["us"]'),
('00000000-7e57-f003-0000-000000000004', '蝴蝶精靈 ButterflyElf',  'https://i.pravatar.cc/150?u=ftest43', 'user', '__TEST__', '["tw"]'),

-- ── 多虛構 trait 測試：一個使用者擁有 >1 fictional trait ──
('00000000-7e57-f004-0000-000000000001', '百變妖 ShapeShifter',     'https://i.pravatar.cc/150?u=ftest50', 'user', '__TEST__', '["jp","cn"]'),

-- ── 奇幻文學補充使用者（覆蓋剩餘 12 個種）──
('00000000-7e57-f006-0000-000000000001', '惡魔醬 DemonChan',         'https://i.pravatar.cc/150?u=ftest60', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f006-0000-000000000002', '魅魔夜 SuccubusNight',    'https://i.pravatar.cc/150?u=ftest61', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f006-0000-000000000003', '巫妖王 LichLord',         'https://i.pravatar.cc/150?u=ftest62', 'user', '__TEST__', '["us"]'),
('00000000-7e57-f006-0000-000000000004', '鐵魔像 IronGolem',        'https://i.pravatar.cc/150?u=ftest63', 'user', '__TEST__', '["de"]'),
('00000000-7e57-f006-0000-000000000005', '人魚姬 MermaidHime',      'https://i.pravatar.cc/150?u=ftest64', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f006-0000-000000000006', '魔王大人 DemonLordSama',  'https://i.pravatar.cc/150?u=ftest65', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f006-0000-000000000007', '哥布林商人 GoblinTrader', 'https://i.pravatar.cc/150?u=ftest66', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f006-0000-000000000008', '寶箱怪 TrapChest',        'https://i.pravatar.cc/150?u=ftest67', 'user', '__TEST__', '["us"]'),
('00000000-7e57-f006-0000-000000000009', '骷髏騎士 SkullKnight',    'https://i.pravatar.cc/150?u=ftest68', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-f006-0000-000000000010', '獸人戰士 OrcWarrior',     'https://i.pravatar.cc/150?u=ftest69', 'user', '__TEST__', '["kr"]'),
('00000000-7e57-f006-0000-000000000011', '光之精靈 LightElf',       'https://i.pravatar.cc/150?u=ftest70', 'user', '__TEST__', '["se"]'),
('00000000-7e57-f006-0000-000000000012', '暗之精靈 DarkElf',        'https://i.pravatar.cc/150?u=ftest71', 'user', '__TEST__', '["fi"]'),

-- ── 非物質生命 — 能量態生命（10 種全覆蓋）──
('00000000-7e57-f007-0000-000000000001', '元素精靈 ElemSpirit',       'https://i.pravatar.cc/150?u=ftest80', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f007-0000-000000000002', '焰魂 FireSoul',            'https://i.pravatar.cc/150?u=ftest81', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f007-0000-000000000003', '水靈 AquaSpirit',          'https://i.pravatar.cc/150?u=ftest82', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f007-0000-000000000004', '風語者 WindWhisper',       'https://i.pravatar.cc/150?u=ftest83', 'user', '__TEST__', '["kr"]'),
('00000000-7e57-f007-0000-000000000005', '岩靈 EarthGuard',          'https://i.pravatar.cc/150?u=ftest84', 'user', '__TEST__', '["au"]'),
('00000000-7e57-f007-0000-000000000006', '雷光 ThunderFlash',        'https://i.pravatar.cc/150?u=ftest85', 'user', '__TEST__', '["us"]'),
('00000000-7e57-f007-0000-000000000007', '聖光使 LightBearer',       'https://i.pravatar.cc/150?u=ftest86', 'user', '__TEST__', '["va"]'),
('00000000-7e57-f007-0000-000000000008', '暗影 ShadowVeil',          'https://i.pravatar.cc/150?u=ftest87', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-f007-0000-000000000009', '幽光 WispGlow',            'https://i.pravatar.cc/150?u=ftest88', 'user', '__TEST__', '["ie"]'),
('00000000-7e57-f007-0000-000000000010', '星之子 StarChild',         'https://i.pravatar.cc/150?u=ftest89', 'user', '__TEST__', '["jp"]'),

-- ── 非物質生命 — 意識態生命（7 種全覆蓋）──
('00000000-7e57-f008-0000-000000000001', '幽幽子 GhostChan',         'https://i.pravatar.cc/150?u=ftest90', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f008-0000-000000000002', '鬧鬼靈 PolterX',           'https://i.pravatar.cc/150?u=ftest91', 'user', '__TEST__', '["gb"]'),
('00000000-7e57-f008-0000-000000000003', '怨念 WraithSorrow',        'https://i.pravatar.cc/150?u=ftest92', 'user', '__TEST__', '["kr"]'),
('00000000-7e57-f008-0000-000000000004', '夢行者 DreamWalker',       'https://i.pravatar.cc/150?u=ftest93', 'user', '__TEST__', '["tw"]'),
('00000000-7e57-f008-0000-000000000005', '合一 OneForAll',           'https://i.pravatar.cc/150?u=ftest94', 'user', '__TEST__', '["us"]'),
('00000000-7e57-f008-0000-000000000006', '夢魘使 NightmareX',       'https://i.pravatar.cc/150?u=ftest95', 'user', '__TEST__', '["de"]'),
('00000000-7e57-f008-0000-000000000007', '思念 ThoughtEcho',         'https://i.pravatar.cc/150?u=ftest96', 'user', '__TEST__', '["tw"]'),

-- ── 非物質生命 — 資訊態生命（2 種）──
('00000000-7e57-f009-0000-000000000001', '小智 AIChan',              'https://i.pravatar.cc/150?u=ftest97', 'user', '__TEST__', '["jp"]'),
('00000000-7e57-f009-0000-000000000002', '病毒醬 VirusChan',         'https://i.pravatar.cc/150?u=ftest98', 'user', '__TEST__', '["tw"]'),

-- ── 邊界測試使用者 ──
('00000000-7e57-f005-0000-000000000001', '超級無敵霹靂長名稱の虛構物種使用者テスト LongNameFictional', NULL, 'user', '__TEST__', '["tw"]'),  -- 超長名稱 + 無頭像
('00000000-7e57-f005-0000-000000000002', '只有虛構沒有名 NoAvatar', NULL, 'user', '__TEST__', '[]')  -- 無頭像 + 空國旗

ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. vtuber_traits — 虛構物種關聯
--    trait UUID 前綴 00000000-7e57-f1.. (fictional traits)
-- ============================================================

-- ── A. 東方神話 — 日本神話：多種分布 ──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Kitsune（妖狐）：7 人掛載（>5 觸發 grid layout）
('00000000-7e57-f1a0-0000-000000000001', '00000000-7e57-f001-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000002', '00000000-7e57-f002-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000003', '00000000-7e57-f002-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000004', '00000000-7e57-f002-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000005', '00000000-7e57-f002-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000006', '00000000-7e57-f002-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
('00000000-7e57-f1a0-0000-000000000007', '00000000-7e57-f002-0000-000000000006', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
-- Tengu（天狗）：1 人
('00000000-7e57-f1a0-0000-000000000010', '00000000-7e57-f001-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Tengu'), NULL),
-- Oni（鬼）：1 人
('00000000-7e57-f1a0-0000-000000000011', '00000000-7e57-f001-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Oni'), NULL),
-- Kappa（河童）：1 人
('00000000-7e57-f1a0-0000-000000000012', '00000000-7e57-f001-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Kappa'), NULL),
-- Yuki-onna（雪女）：1 人
('00000000-7e57-f1a0-0000-000000000013', '00000000-7e57-f001-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Yuki-onna'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── B. 東方神話 — 中國神話：多種分布 ──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Dragon (Chinese)（中國龍）：1 人
('00000000-7e57-f1b0-0000-000000000001', '00000000-7e57-f001-0000-000000000006', (SELECT id FROM fictional_species WHERE name='Dragon (Chinese)'), NULL),
-- Phoenix (Fenghuang)（鳳凰）：1 人
('00000000-7e57-f1b0-0000-000000000002', '00000000-7e57-f001-0000-000000000007', (SELECT id FROM fictional_species WHERE name='Phoenix (Fenghuang)'), NULL),
-- Qilin（麒麟）：1 人
('00000000-7e57-f1b0-0000-000000000003', '00000000-7e57-f001-0000-000000000008', (SELECT id FROM fictional_species WHERE name='Qilin'), NULL),
-- Nine-tailed Fox（九尾狐）：1 人
('00000000-7e57-f1b0-0000-000000000004', '00000000-7e57-f001-0000-000000000009', (SELECT id FROM fictional_species WHERE name='Nine-tailed Fox'), NULL),
-- Jiangshi（殭屍）：1 人
('00000000-7e57-f1b0-0000-000000000005', '00000000-7e57-f001-0000-000000000010', (SELECT id FROM fictional_species WHERE name='Jiangshi'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── C. 西方神話 — 希臘神話 ──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Phoenix (Western)（不死鳥）：1 人
('00000000-7e57-f1c0-0000-000000000001', '00000000-7e57-f001-0000-000000000011', (SELECT id FROM fictional_species WHERE name='Phoenix (Western)'), NULL),
-- Centaur（半人馬）：1 人
('00000000-7e57-f1c0-0000-000000000002', '00000000-7e57-f001-0000-000000000012', (SELECT id FROM fictional_species WHERE name='Centaur'), NULL),
-- Medusa（梅杜莎）：1 人
('00000000-7e57-f1c0-0000-000000000003', '00000000-7e57-f001-0000-000000000013', (SELECT id FROM fictional_species WHERE name='Medusa'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── D. 西方神話 — 北歐神話 ──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Valkyrie（女武神）：1 人
('00000000-7e57-f1d0-0000-000000000001', '00000000-7e57-f001-0000-000000000014', (SELECT id FROM fictional_species WHERE name='Valkyrie'), NULL),
-- Fenrir（芬里爾）：1 人
('00000000-7e57-f1d0-0000-000000000002', '00000000-7e57-f001-0000-000000000015', (SELECT id FROM fictional_species WHERE name='Fenrir'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── E. 西方神話 — 歐洲民間傳說 ──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Vampire（吸血鬼）：1 人
('00000000-7e57-f1e0-0000-000000000001', '00000000-7e57-f001-0000-000000000016', (SELECT id FROM fictional_species WHERE name='Vampire'), NULL),
-- Werewolf（狼人）：1 人
('00000000-7e57-f1e0-0000-000000000002', '00000000-7e57-f001-0000-000000000017', (SELECT id FROM fictional_species WHERE name='Werewolf'), NULL),
-- Unicorn（獨角獸）：1 人
('00000000-7e57-f1e0-0000-000000000003', '00000000-7e57-f001-0000-000000000018', (SELECT id FROM fictional_species WHERE name='Unicorn'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── F. 奇幻文學（15 個種全覆蓋）──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- Angel（天使）：1 人
('00000000-7e57-f1f0-0000-000000000001', '00000000-7e57-f001-0000-000000000019', (SELECT id FROM fictional_species WHERE name='Angel'), NULL),
-- Slime（史萊姆）：1 人
('00000000-7e57-f1f0-0000-000000000002', '00000000-7e57-f001-0000-000000000020', (SELECT id FROM fictional_species WHERE name='Slime'), NULL),
-- Elf (Fantasy)（精靈）：1 人
('00000000-7e57-f1f0-0000-000000000003', '00000000-7e57-f001-0000-000000000021', (SELECT id FROM fictional_species WHERE name='Elf (Fantasy)'), NULL),
-- Demon（惡魔）：1 人
('00000000-7e57-f1f0-0000-000000000004', '00000000-7e57-f006-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Demon (Fantasy)'), NULL),
-- Succubus（魅魔）：1 人
('00000000-7e57-f1f0-0000-000000000005', '00000000-7e57-f006-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Succubus'), NULL),
-- Lich（巫妖）：1 人
('00000000-7e57-f1f0-0000-000000000006', '00000000-7e57-f006-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Lich'), NULL),
-- Golem（魔像）：1 人
('00000000-7e57-f1f0-0000-000000000007', '00000000-7e57-f006-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Golem'), NULL),
-- Mermaid（人魚）：1 人
('00000000-7e57-f1f0-0000-000000000008', '00000000-7e57-f006-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Mermaid'), NULL),
-- Demon Lord（魔王）：1 人
('00000000-7e57-f1f0-0000-000000000009', '00000000-7e57-f006-0000-000000000006', (SELECT id FROM fictional_species WHERE name='Demon Lord'), NULL),
-- Goblin（哥布林）：1 人
('00000000-7e57-f1f0-0000-000000000010', '00000000-7e57-f006-0000-000000000007', (SELECT id FROM fictional_species WHERE name='Goblin'), NULL),
-- Mimic（寶箱怪）：1 人
('00000000-7e57-f1f0-0000-000000000011', '00000000-7e57-f006-0000-000000000008', (SELECT id FROM fictional_species WHERE name='Mimic'), NULL),
-- Skeleton（骷髏人）：1 人
('00000000-7e57-f1f0-0000-000000000012', '00000000-7e57-f006-0000-000000000009', (SELECT id FROM fictional_species WHERE name='Skeleton'), NULL),
-- Orc（半獸人）：1 人
('00000000-7e57-f1f0-0000-000000000013', '00000000-7e57-f006-0000-000000000010', (SELECT id FROM fictional_species WHERE name='Orc'), NULL),
-- Light Elf（光精靈）：1 人
('00000000-7e57-f1f0-0000-000000000014', '00000000-7e57-f006-0000-000000000011', (SELECT id FROM fictional_species WHERE name='Light Elf'), NULL),
-- Dark Elf（暗精靈）：1 人
('00000000-7e57-f1f0-0000-000000000015', '00000000-7e57-f006-0000-000000000012', (SELECT id FROM fictional_species WHERE name='Dark Elf'), NULL)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. 複合種 traits — 同時擁有 real + fictional
--    先插入 real trait，再插入 fictional trait
--    驗證：detail panel 可顯示雙樹 tab、FocusHUD 可切換
-- ============================================================

-- 龍狐：赤狐（real） + 東方龍（fictional）
INSERT INTO vtuber_traits (id, user_id, taxon_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000001', '00000000-7e57-f003-0000-000000000001', 5219243, '赤狐型態')
ON CONFLICT (id) DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000002', '00000000-7e57-f003-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Dragon (Eastern)'), '龍型態')
ON CONFLICT (id) DO NOTHING;

-- 吸血貓：家貓（real） + 吸血鬼（fictional）
INSERT INTO vtuber_traits (id, user_id, taxon_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000003', '00000000-7e57-f003-0000-000000000002', 2435099, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000004', '00000000-7e57-f003-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Vampire'), '吸血鬼型態')
ON CONFLICT (id) DO NOTHING;

-- 天使犬：家犬（real） + 天使（fictional）
INSERT INTO vtuber_traits (id, user_id, taxon_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000005', '00000000-7e57-f003-0000-000000000003', 5219174, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000006', '00000000-7e57-f003-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Angel'), '天使型態')
ON CONFLICT (id) DO NOTHING;

-- 蝴蝶精靈：蝴蝶（real） + 精靈（fictional）— 跨界複合
INSERT INTO vtuber_traits (id, user_id, taxon_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000007', '00000000-7e57-f003-0000-000000000004', 5137108, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f101-0000-000000000008', '00000000-7e57-f003-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Elf (Fantasy)'), '精靈型態')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. 多虛構 trait — 一個使用者擁有 2+ fictional traits
--    驗證：FocusHUD 可左右切換多個虛構 entry
-- ============================================================

INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- 百變妖：妖狐 + 吸血鬼 + 史萊姆（3 個虛構，跨 3 個 origin）
('00000000-7e57-f102-0000-000000000001', '00000000-7e57-f004-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Kitsune'), '妖狐型態'),
('00000000-7e57-f102-0000-000000000002', '00000000-7e57-f004-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Vampire'), '吸血鬼型態'),
('00000000-7e57-f102-0000-000000000003', '00000000-7e57-f004-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Slime'), '史萊姆型態')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. 邊界測試 traits
-- ============================================================

INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- 超長名稱 + 無頭像 → 妖狐
('00000000-7e57-f103-0000-000000000001', '00000000-7e57-f005-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Kitsune'), NULL),
-- 無頭像 + 空國旗 → 史萊姆
('00000000-7e57-f103-0000-000000000002', '00000000-7e57-f005-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Slime'), NULL)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. 非物質生命 traits — 3 個子來源 22 種全覆蓋
--    驗證：非物質生命分支完整展開、各子來源正確分群
-- ============================================================

-- ── 能量態生命（10 種）──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f1a1-0000-000000000001', '00000000-7e57-f007-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Elemental Spirit'), NULL),
('00000000-7e57-f1a1-0000-000000000002', '00000000-7e57-f007-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Fire Elemental'), NULL),
('00000000-7e57-f1a1-0000-000000000003', '00000000-7e57-f007-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Water Elemental'), NULL),
('00000000-7e57-f1a1-0000-000000000004', '00000000-7e57-f007-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Wind Elemental'), NULL),
('00000000-7e57-f1a1-0000-000000000005', '00000000-7e57-f007-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Earth Elemental'), NULL),
('00000000-7e57-f1a1-0000-000000000006', '00000000-7e57-f007-0000-000000000006', (SELECT id FROM fictional_species WHERE name='Lightning Being'), NULL),
('00000000-7e57-f1a1-0000-000000000007', '00000000-7e57-f007-0000-000000000007', (SELECT id FROM fictional_species WHERE name='Light Spirit'), NULL),
('00000000-7e57-f1a1-0000-000000000008', '00000000-7e57-f007-0000-000000000008', (SELECT id FROM fictional_species WHERE name='Shadow Elemental'), NULL),
('00000000-7e57-f1a1-0000-000000000009', '00000000-7e57-f007-0000-000000000009', (SELECT id FROM fictional_species WHERE name='Will-o-the-Wisp'), NULL),
('00000000-7e57-f1a1-0000-000000000010', '00000000-7e57-f007-0000-000000000010', (SELECT id FROM fictional_species WHERE name='Star Spirit'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── 意識態生命（7 種）──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f1a2-0000-000000000001', '00000000-7e57-f008-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Ghost'), NULL),
('00000000-7e57-f1a2-0000-000000000002', '00000000-7e57-f008-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Poltergeist'), NULL),
('00000000-7e57-f1a2-0000-000000000003', '00000000-7e57-f008-0000-000000000003', (SELECT id FROM fictional_species WHERE name='Wraith'), NULL),
('00000000-7e57-f1a2-0000-000000000004', '00000000-7e57-f008-0000-000000000004', (SELECT id FROM fictional_species WHERE name='Dream Entity'), NULL),
('00000000-7e57-f1a2-0000-000000000005', '00000000-7e57-f008-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Collective Consciousness'), NULL),
('00000000-7e57-f1a2-0000-000000000006', '00000000-7e57-f008-0000-000000000006', (SELECT id FROM fictional_species WHERE name='Nightmare'), NULL),
('00000000-7e57-f1a2-0000-000000000007', '00000000-7e57-f008-0000-000000000007', (SELECT id FROM fictional_species WHERE name='Thought Form'), NULL)
ON CONFLICT (id) DO NOTHING;

-- ── 資訊態生命（2 種）──
INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
('00000000-7e57-f1a3-0000-000000000001', '00000000-7e57-f009-0000-000000000001', (SELECT id FROM fictional_species WHERE name='AI'), NULL),
('00000000-7e57-f1a3-0000-000000000002', '00000000-7e57-f009-0000-000000000002', (SELECT id FROM fictional_species WHERE name='Computer Virus'), NULL)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. 讓既有 real-tree 測試使用者也擁有 fictional trait
--    驗證：同一使用者在兩棵樹上同時出現
-- ============================================================

INSERT INTO vtuber_traits (id, user_id, fictional_species_id, trait_note) VALUES
-- 鳳凰（鳥類測試使用者）已有鸚鵡+赤狐 real trait → 再加不死鳥 fictional
('00000000-7e57-f104-0000-000000000001', '00000000-7e57-0003-0000-000000000005', (SELECT id FROM fictional_species WHERE name='Phoenix (Western)'), '鳳凰的虛構面'),
-- 犬神 Inugami（犬科使用者）已有灰狼 real trait → 再加犬神 fictional
('00000000-7e57-f104-0000-000000000002', '00000000-7e57-0001-0000-000000000017', (SELECT id FROM fictional_species WHERE name='Inugami'), '犬神的虛構面'),
-- 貓貓 Neko（貓科使用者）已有家貓 real trait → 再加化貓 fictional
('00000000-7e57-f104-0000-000000000003', '00000000-7e57-0002-0000-000000000001', (SELECT id FROM fictional_species WHERE name='Bakeneko'), '貓又化身')
ON CONFLICT (id) DO NOTHING;
