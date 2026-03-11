-- ============================================================
-- Fictional Species Expansion — 非物質生命 / 人造生命 / 現代虛構
-- Run this in Supabase SQL Editor after fictional_species.sql
-- 新增 47 筆資料，不影響現有 42 筆
-- ============================================================

-- ============================================================
-- 非物質生命 (Non-material Life)
-- ============================================================

-- === 能量態生命 (Energy-based Life) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Elemental Spirit',  '元素精靈',   '非物質生命', '能量態生命', '非物質生命|能量態生命|元素精靈|Elemental Spirit',  '元素力量凝聚的生命泛稱'),
('Fire Elemental',    '火元素精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|元素精靈|Fire Elemental',    '火焰型態的能量生命'),
('Water Elemental',   '水元素精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|元素精靈|Water Elemental',   '水流型態的能量生命'),
('Wind Elemental',    '風元素精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|元素精靈|Wind Elemental',    '氣流型態的能量生命'),
('Earth Elemental',   '土元素精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|元素精靈|Earth Elemental',   '大地型態的能量生命'),
('Lightning Being',   '雷電生命',   '非物質生命', '能量態生命', '非物質生命|能量態生命|能量存在|Lightning Being',   '電弧型態的能量存在'),
('Light Spirit',      '光靈',       '非物質生命', '能量態生命', '非物質生命|能量態生命|能量存在|Light Spirit',      '光能凝聚的精神體'),
('Shadow Elemental',  '暗影元素',   '非物質生命', '能量態生命', '非物質生命|能量態生命|能量存在|Shadow Elemental',  '暗能量或虛空構成的生命'),
('Will-o-the-Wisp',   '鬼火',       '非物質生命', '能量態生命', '非物質生命|能量態生命|能量存在|Will-o-the-Wisp',  '漂浮的幽光能量體'),
('Star Spirit',       '星靈',       '非物質生命', '能量態生命', '非物質生命|能量態生命|能量存在|Star Spirit',       '宇宙能量凝聚的存在')
ON CONFLICT(name) DO NOTHING;

-- === 意識態生命 (Consciousness-based Life) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Ghost',                    '幽靈',       '非物質生命', '意識態生命', '非物質生命|意識態生命|Ghost',                    '死後殘留的意識體'),
('Poltergeist',              '騷靈',       '非物質生命', '意識態生命', '非物質生命|意識態生命|Poltergeist',              '具有干涉物質能力的意識體'),
('Wraith',                   '怨靈',       '非物質生命', '意識態生命', '非物質生命|意識態生命|Wraith',                   '強烈負面情感凝聚的意識'),
('Dream Entity',             '夢境生物',   '非物質生命', '意識態生命', '非物質生命|意識態生命|Dream Entity',             '存在於夢境中的意識體'),
('Collective Consciousness', '集體意識體', '非物質生命', '意識態生命', '非物質生命|意識態生命|Collective Consciousness', '多個意識融合的共同體'),
('Nightmare',                '夢魘',       '非物質生命', '意識態生命', '非物質生命|意識態生命|Nightmare',                '寄生於恐懼的意識存在'),
('Thought Form',             '思念體',     '非物質生命', '意識態生命', '非物質生命|意識態生命|Thought Form',             '由念力或信念具現化的存在')
ON CONFLICT(name) DO NOTHING;

-- === 資訊態生命 (Information-based Life) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('AI',             '人工智慧',   '非物質生命', '資訊態生命', '非物質生命|資訊態生命|AI',             '人造的數位智慧體'),
('Computer Virus', '電腦病毒',   '非物質生命', '資訊態生命', '非物質生命|資訊態生命|Computer Virus', '自我複製的惡意程式生命')
ON CONFLICT(name) DO NOTHING;

-- ============================================================
-- 人造生命 (Artificial Life)
-- ============================================================

-- === 機械生命 (Mechanical Life) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Robot',     '機器人',   '人造生命', '機械生命', '人造生命|機械生命|Robot',     '金屬機械構成的人造生命'),
('Android',   '仿生人',   '人造生命', '機械生命', '人造生命|機械生命|Android',   '外觀高度仿人的機械生命'),
('Cyborg',    '改造人',   '人造生命', '機械生命', '人造生命|機械生命|Cyborg',    '生物體與機械融合的存在'),
('Automaton', '自動機械', '人造生命', '機械生命', '人造生命|機械生命|Automaton', '發條或蒸氣驅動的古典機械生命'),
('Doll', '人偶', '人造生命', '附魂體', '人造生命|附魂體|Doll', '被賦予生命的人形玩偶')
ON CONFLICT(name) DO NOTHING;

-- === 附魂體 (Soul-bound) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Cursed Doll', '詛咒娃娃', '人造生命', '附魂體', '人造生命|附魂體|Cursed Doll', '靈魂因詛咒而寄宿於娃娃中的存在')
ON CONFLICT(name) DO NOTHING;

-- === 生物合成 (Bio-synthetic Life) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Homunculus',            '人造人',     '人造生命', '生物合成', '人造生命|生物合成|Homunculus',            '鍊金術創造的人工生命'),
('Clone',                 '複製人',     '人造生命', '生物合成', '人造生命|生物合成|Clone',                 '以生物技術複製的生命'),
('Chimera (Artificial)',  '人造嵌合體', '人造生命', '生物合成', '人造生命|生物合成|Chimera (Artificial)',   '人工拼合多種生物的造物')
ON CONFLICT(name) DO NOTHING;

-- ============================================================
-- 現代虛構 (Modern Fiction)
-- ============================================================

-- === 克蘇魯神話 (Cthulhu Mythos) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Deep One',             '深潛者',     '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Deep One',             '海底智慧種族，可與人類混血'),
('Shoggoth',             '修格斯',     '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Shoggoth',             '不定形原生質生物，由古老者創造'),
('Mi-go',                '米戈',       '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Mi-go',                '真菌型外星生物，擅長外科手術'),
('Elder Thing',          '古老者',     '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Elder Thing',          '地球最古老的智慧種族'),
('Ghoul (Lovecraftian)', '食屍鬼',     '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Ghoul (Lovecraftian)', '穴居的食腐種族，曾為人類'),
('Star-spawn',           '星之眷族',   '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Star-spawn',           '追隨舊日支配者的宇宙生物')
ON CONFLICT(name) DO NOTHING;

-- === 都市傳說 (Urban Legends) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Mothman',       '天蛾人',       '現代虛構', '都市傳說', '現代虛構|都市傳說|Mothman',       '災難預兆的飛行怪物，目擊於西維吉尼亞'),
('Chupacabra',    '卓柏卡布拉',   '現代虛構', '都市傳說', '現代虛構|都市傳說|Chupacabra',    '吸食牲畜血液的神秘生物'),
('Shadow People', '影人',         '現代虛構', '都市傳說', '現代虛構|都市傳說|Shadow People', '出沒於暗處的人形黑影存在'),
('Cryptid',       '未確認生物',   '現代虛構', '都市傳說', '現代虛構|都市傳說|Cryptid',       '未被科學證實的神秘生物泛稱'),
('Jackalope',     '鹿角兔',       '現代虛構', '都市傳說', '現代虛構|都市傳說|Jackalope',     '北美民間傳說中長有鹿角的野兔，源自懷俄明州'),
('Skyfish',       '飛棍',         '現代虛構', '都市傳說', '現代虛構|都市傳說|Skyfish',       '高速飛行的棒狀未確認生物，又稱飛棍或天竿魚'),
('Loch Ness Monster', '尼斯湖水怪', '現代虛構', '都市傳說', '現代虛構|都市傳說|Loch Ness Monster', '蘇格蘭尼斯湖中的傳說水怪，暱稱尼西')
ON CONFLICT(name) DO NOTHING;

-- === 科幻 (Science Fiction) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Alien',          '外星人',   '現代虛構', '科幻', '現代虛構|科幻|Alien',          '來自外太空的智慧人形種族'),
('Alien Creature', '外星生物', '現代虛構', '科幻', '現代虛構|科幻|Alien Creature', '來自外太空的非人形生命泛稱')
ON CONFLICT(name) DO NOTHING;
