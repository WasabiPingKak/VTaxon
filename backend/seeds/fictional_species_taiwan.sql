-- ============================================================
-- Fictional Species — 台灣民間傳說 (Taiwanese Folk Legends)
-- Run this in Supabase SQL Editor after fictional_species.sql
-- 新增 7 筆資料
-- ============================================================

-- === 台灣民間傳說 (Taiwanese Folk Legends) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Tiger Lord',          '虎爺',         '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Tiger Lord',          '廟宇神桌下的守護虎神，掌管財運與兒童平安，台灣廟宇信仰的人氣神獸'),
('Mo-sin-a',            '魔神仔',       '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Mo-sin-a',            '出沒於山林的神秘精怪，會迷惑人心使登山者迷路，台灣最著名的鄉野傳說'),
('Wind Lion Lord',      '風獅爺',       '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Wind Lion Lord',      '金門特有的鎮風辟邪石獸，矗立於村落入口抵禦東北季風與煞氣'),
('Girl in Red',         '紅衣小女孩',   '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Girl in Red',         '1998年登山錄影帶中拍到的紅衣身影，台灣最著名的現代都市傳說'),
('Water Ghost',         '水鬼',         '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Water Ghost',         '溺水身亡的亡魂，徘徊於水域尋找替死鬼以求超生輪迴'),
('Generals Qi and Ba',  '七爺八爺',     '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Generals Qi and Ba',  '城隍廟前的高矮陰差將軍（謝必安、范無救），台灣廟會陣頭的超人氣形象'),
('Carp Spirit',         '鯉魚精',       '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Carp Spirit',         '日月潭傳說中的巨大鯉魚精怪，與潭中拉魯島的形成有關'),
('Yam Monster',         '山藥怪物',     '東方神話', '台灣民間傳說', '東方神話|台灣民間傳說|Yam Monster',         '達悟族傳說中由山藥化為人形的怪物，能長出翅膀飛行並施展法術，出自蘭嶼紅頭部落的口傳故事')
ON CONFLICT(name) DO NOTHING;
