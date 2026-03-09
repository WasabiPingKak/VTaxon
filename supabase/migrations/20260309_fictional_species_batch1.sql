-- 虛構物種請求 批次處理 #1 (2026-03-09)
-- 新增 17 個虛構物種 + 新增 sub_origin「凱爾特神話」
-- 請求狀態由管理者手動個別回應，此腳本僅處理分類資料
-- Production (public schema) + Staging (staging schema)

-- ============================================================
-- Production (public)
-- ============================================================

-- 奇幻文學→通用 (4 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Incubus', '夢魔', '奇幻文學', '通用', '奇幻文學|通用|魔族|Incubus', '西方傳說中於夜間造訪沉睡者的男性惡魔，為魅魔（Succubus）的男性對應。常以俊美青年的形象現身。'),
('Mandrake', '曼德拉草', '奇幻文學', '通用', '奇幻文學|通用|魔法生物|Mandrake', '傳說中具有人形根部的魔法植物，拔起時會發出致命的尖叫聲。原型為真實植物毒茄蔘（Mandragora officinarum），在中世紀歐洲鍊金術與奇幻作品中廣泛出現。'),
('Ent', '樹人', '奇幻文學', '通用', '奇幻文學|通用|魔法生物|Ent', '奇幻作品中由古老樹木化為的巨大生命體，行動緩慢但力量驚人。以托爾金《魔戒》中的樹鬍（Treebeard）為最著名的形象。'),
('Half-elven', '半精靈', '奇幻文學', '通用', '奇幻文學|通用|精靈族|Half-elven', '精靈與人類的混血後代，兼具雙方的特徵。壽命長於人類但短於精靈，在奇幻作品中常面臨種族認同的抉擇。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→希臘神話 (3 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Charon', '卡戎', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Charon', '希臘神話中冥河的擺渡人，負責將亡者的靈魂渡過冥河（斯提克斯河），送往冥界。死者需以錢幣支付船資。'),
('Demigod', '半神', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Demigod', '神與凡人所生的後代，擁有超越常人的力量但並非完全的神。希臘神話中的代表有赫拉克勒斯、珀爾修斯等，需經歷試煉方能成神。'),
('Dryad', '樹精', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Dryad', '希臘神話中棲息於樹木中的女性精靈（Nymph），與特定的樹木共生共死。常以美麗少女的形象現身於森林之中。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→歐洲民間傳說 (3 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Goetic Demon', '所羅門魔神', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|魔物|Goetic Demon', '出自中世紀魔法書《所羅門之鑰》的七十二柱魔神，各具獨特的外貌、階級與能力。屬於歐洲神秘學與惡魔學體系。'),
('Wyvern', '雙足飛龍', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|西方龍|Wyvern', '歐洲紋章學與傳說中的龍形生物，僅有雙足（後腿）與雙翼，無前腿。體型通常較西方龍小，尾部常帶有毒刺。'),
('Grim Reaper', '死神', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|不死族|Grim Reaper', '中世紀歐洲文化中死亡的擬人化形象，身披黑袍、手持鐮刀，負責在人死後收割靈魂並引導至彼岸。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→凱爾特神話 (1 筆，新 sub_origin)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Fey', '費伊', '西方神話', '凱爾特神話', '西方神話|凱爾特神話|Fey', '凱爾特傳說中與自然緊密連結的超自然存在，泛指精靈、仙靈等妖精族群。棲息於人界與異界的交界處。')
ON CONFLICT(name) DO NOTHING;

-- 現代虛構→克蘇魯神話 (1 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Outer God', '外神', '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Outer God', '克蘇魯神話體系中超越人類理解的至高存在，如阿撒托斯（Azathoth）、猶格·索托斯（Yog-Sothoth）。居於宇宙之外，凡人目睹即陷入瘋狂。')
ON CONFLICT(name) DO NOTHING;

-- 東方神話→中國神話 (1 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Pangu', '盤古', '東方神話', '中國神話', '東方神話|中國神話|神靈|Pangu', '中國神話中開天闢地的創世巨神。自混沌中誕生，以巨斧劈開天地，身軀化為山川河海，是萬物之始。')
ON CONFLICT(name) DO NOTHING;

-- 人造生命→機械生命 (2 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Teddy Bear', '泰迪熊', '人造生命', '機械生命', '人造生命|機械生命|Teddy Bear', '以熊為原型的填充玩偶，常繫有蝴蝶結。源自 20 世紀初的英美文化，作為擬生物體被賦予生命的形象廣泛出現於各類創作中。'),
('Mechanical Bird', '機械鳥', '人造生命', '機械生命', '人造生命|機械生命|Mechanical Bird', '以鳥類為原型的精密機械裝置，如音樂盒上的自動鳥或發條鳥。結合工藝美學與機械構造的人造生命體。')
ON CONFLICT(name) DO NOTHING;

-- 非物質生命→能量態生命 (2 筆)
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Plant Spirit', '植物精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|自然精靈|Plant Spirit', '由植物的生命力凝聚而成的精靈體，是自然能量的具現化存在。與元素精靈類似，但特別與植物和森林的生長力量相連。'),
('Chrono Spirit', '時間精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|自然精靈|Chrono Spirit', '誕生於時間洪流中的精靈體，擁有感知或穿梭時間的能力。作為時間這一抽象概念的具現化存在。')
ON CONFLICT(name) DO NOTHING;


-- ============================================================
-- Staging (staging)
-- ============================================================

-- 奇幻文學→通用 (4 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Incubus', '夢魔', '奇幻文學', '通用', '奇幻文學|通用|魔族|Incubus', '西方傳說中於夜間造訪沉睡者的男性惡魔，為魅魔（Succubus）的男性對應。常以俊美青年的形象現身。'),
('Mandrake', '曼德拉草', '奇幻文學', '通用', '奇幻文學|通用|魔法生物|Mandrake', '傳說中具有人形根部的魔法植物，拔起時會發出致命的尖叫聲。原型為真實植物毒茄蔘（Mandragora officinarum），在中世紀歐洲鍊金術與奇幻作品中廣泛出現。'),
('Ent', '樹人', '奇幻文學', '通用', '奇幻文學|通用|魔法生物|Ent', '奇幻作品中由古老樹木化為的巨大生命體，行動緩慢但力量驚人。以托爾金《魔戒》中的樹鬍（Treebeard）為最著名的形象。'),
('Half-elven', '半精靈', '奇幻文學', '通用', '奇幻文學|通用|精靈族|Half-elven', '精靈與人類的混血後代，兼具雙方的特徵。壽命長於人類但短於精靈，在奇幻作品中常面臨種族認同的抉擇。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→希臘神話 (3 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Charon', '卡戎', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Charon', '希臘神話中冥河的擺渡人，負責將亡者的靈魂渡過冥河（斯提克斯河），送往冥界。死者需以錢幣支付船資。'),
('Demigod', '半神', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Demigod', '神與凡人所生的後代，擁有超越常人的力量但並非完全的神。希臘神話中的代表有赫拉克勒斯、珀爾修斯等，需經歷試煉方能成神。'),
('Dryad', '樹精', '西方神話', '希臘神話', '西方神話|希臘神話|神族|Dryad', '希臘神話中棲息於樹木中的女性精靈（Nymph），與特定的樹木共生共死。常以美麗少女的形象現身於森林之中。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→歐洲民間傳說 (3 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Goetic Demon', '所羅門魔神', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|魔物|Goetic Demon', '出自中世紀魔法書《所羅門之鑰》的七十二柱魔神，各具獨特的外貌、階級與能力。屬於歐洲神秘學與惡魔學體系。'),
('Wyvern', '雙足飛龍', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|西方龍|Wyvern', '歐洲紋章學與傳說中的龍形生物，僅有雙足（後腿）與雙翼，無前腿。體型通常較西方龍小，尾部常帶有毒刺。'),
('Grim Reaper', '死神', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|不死族|Grim Reaper', '中世紀歐洲文化中死亡的擬人化形象，身披黑袍、手持鐮刀，負責在人死後收割靈魂並引導至彼岸。')
ON CONFLICT(name) DO NOTHING;

-- 西方神話→凱爾特神話 (1 筆，新 sub_origin)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Fey', '費伊', '西方神話', '凱爾特神話', '西方神話|凱爾特神話|Fey', '凱爾特傳說中與自然緊密連結的超自然存在，泛指精靈、仙靈等妖精族群。棲息於人界與異界的交界處。')
ON CONFLICT(name) DO NOTHING;

-- 現代虛構→克蘇魯神話 (1 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Outer God', '外神', '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Outer God', '克蘇魯神話體系中超越人類理解的至高存在，如阿撒托斯（Azathoth）、猶格·索托斯（Yog-Sothoth）。居於宇宙之外，凡人目睹即陷入瘋狂。')
ON CONFLICT(name) DO NOTHING;

-- 東方神話→中國神話 (1 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Pangu', '盤古', '東方神話', '中國神話', '東方神話|中國神話|神靈|Pangu', '中國神話中開天闢地的創世巨神。自混沌中誕生，以巨斧劈開天地，身軀化為山川河海，是萬物之始。')
ON CONFLICT(name) DO NOTHING;

-- 人造生命→機械生命 (2 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Teddy Bear', '泰迪熊', '人造生命', '機械生命', '人造生命|機械生命|Teddy Bear', '以熊為原型的填充玩偶，常繫有蝴蝶結。源自 20 世紀初的英美文化，作為擬生物體被賦予生命的形象廣泛出現於各類創作中。'),
('Mechanical Bird', '機械鳥', '人造生命', '機械生命', '人造生命|機械生命|Mechanical Bird', '以鳥類為原型的精密機械裝置，如音樂盒上的自動鳥或發條鳥。結合工藝美學與機械構造的人造生命體。')
ON CONFLICT(name) DO NOTHING;

-- 非物質生命→能量態生命 (2 筆)
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Plant Spirit', '植物精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|自然精靈|Plant Spirit', '由植物的生命力凝聚而成的精靈體，是自然能量的具現化存在。與元素精靈類似，但特別與植物和森林的生長力量相連。'),
('Chrono Spirit', '時間精靈', '非物質生命', '能量態生命', '非物質生命|能量態生命|自然精靈|Chrono Spirit', '誕生於時間洪流中的精靈體，擁有感知或穿梭時間的能力。作為時間這一抽象概念的具現化存在。')
ON CONFLICT(name) DO NOTHING;
