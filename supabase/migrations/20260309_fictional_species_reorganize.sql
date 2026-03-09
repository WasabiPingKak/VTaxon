-- ============================================================
-- Migration: Fictional Species Reorganization
-- Date: 2026-03-09
-- Purpose: Add "type" layer between sub_origin and species
--          Update category_path from 3 segments to 4 segments
--          Fix name/path inconsistencies
--          Add 2 new species, handle Western Dragon as type node
-- ============================================================

-- ============================================================
-- PUBLIC SCHEMA
-- ============================================================

-- === 一、日本神話 (19 種 → 4 群) ===
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Kitsune' WHERE name = 'Kitsune';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Tanuki' WHERE name = 'Tanuki';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Nekomata' WHERE name = 'Nekomata';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Bakeneko' WHERE name = 'Bakeneko';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Jorogumo' WHERE name = 'Jorogumo';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Kamaitachi' WHERE name = 'Kamaitachi';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Inugami' WHERE name = 'Inugami';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Yatagarasu' WHERE name = 'Yatagarasu';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|妖獸|Nue' WHERE name = 'Nue';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Oni' WHERE name = 'Oni';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Kappa' WHERE name = 'Kappa';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Yuki-onna' WHERE name = 'Yuki-onna';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Tengu' WHERE name = 'Tengu';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|靈體|Shikigami' WHERE name = 'Shikigami';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|靈體|Zashiki-warashi' WHERE name = 'Zashiki-warashi';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|靈體|Tsukumogami' WHERE name = 'Tsukumogami';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|靈體|Tennyo' WHERE name = 'Tennyo';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|神獸|Dragon (Eastern)' WHERE name = 'Dragon (Eastern)';
UPDATE public.fictional_species SET category_path = '東方神話|日本神話|神獸|Yamata no Orochi' WHERE name = 'Yamata no Orochi';

-- === 二、中國神話 (22 種 → 6 群) ===
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Azure Dragon' WHERE name = 'Azure Dragon';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|四聖獸|White Tiger' WHERE name = 'White Tiger';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Vermilion Bird' WHERE name = 'Vermilion Bird';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Black Tortoise' WHERE name = 'Black Tortoise';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|龍族|Dragon (Chinese)' WHERE name = 'Dragon (Chinese)';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|龍族|Chi Dragon' WHERE name = 'Chi Dragon';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|龍族|Jiao Dragon' WHERE name = 'Jiao Dragon';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|龍族|Dragon Turtle' WHERE name = 'Dragon Turtle';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Qilin' WHERE name = 'Qilin';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Pixiu' WHERE name = 'Pixiu';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Bai Ze' WHERE name = 'Bai Ze';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Phoenix (Fenghuang)' WHERE name = 'Phoenix (Fenghuang)';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|凶獸|Taotie' WHERE name = 'Taotie';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|凶獸|Qiongqi' WHERE name = 'Qiongqi';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|凶獸|Hundun' WHERE name = 'Hundun';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|凶獸|Taowu' WHERE name = 'Taowu';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|凶獸|Nian' WHERE name = 'Nian';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|妖異|Nine-tailed Fox' WHERE name = 'Nine-tailed Fox';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|妖異|Jiangshi' WHERE name = 'Jiangshi';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|神靈|Pangu' WHERE name = 'Pangu';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|神靈|Lu Wu' WHERE name = 'Lu Wu';
UPDATE public.fictional_species SET category_path = '東方神話|中國神話|神靈|Yaksha' WHERE name = 'Yaksha';

-- === 四、希臘神話 (14 種 → 4 群) ===
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神獸|Phoenix (Western)' WHERE name = 'Phoenix (Western)';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神獸|Pegasus' WHERE name = 'Pegasus';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神獸|Cerberus' WHERE name = 'Cerberus';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Centaur' WHERE name = 'Centaur';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Minotaur' WHERE name = 'Minotaur';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Chimera' WHERE name = 'Chimera';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Harpy' WHERE name = 'Harpy';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Siren' WHERE name = 'Siren';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Medusa' WHERE name = 'Medusa';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Cyclops' WHERE name = 'Cyclops';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神族|Titan' WHERE name = 'Titan';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神族|Demigod' WHERE name = 'Demigod';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神族|Charon' WHERE name = 'Charon';
UPDATE public.fictional_species SET category_path = '西方神話|希臘神話|神族|Dryad' WHERE name = 'Dryad';

-- === 五、北歐神話 (name/path 不一致修正，維持 3 段) ===
UPDATE public.fictional_species SET category_path = '西方神話|北歐神話|Dragon (Norse)' WHERE name = 'Dragon (Norse)';
UPDATE public.fictional_species SET category_path = '西方神話|北歐神話|Dwarf (Norse)' WHERE name = 'Dwarf (Norse)';

-- === 六、歐洲民間傳說 (15 種 → 5 群 + 西方龍特殊處理) ===

-- 西方龍：變為類型節點 (3 段)
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|西方龍' WHERE name = 'Dragon (Western)';
-- 雙足飛龍：移到西方龍下
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|西方龍|Wyvern' WHERE name = 'Wyvern';
-- 不死族
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Vampire' WHERE name = 'Vampire';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Werewolf' WHERE name = 'Werewolf';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Grim Reaper' WHERE name = 'Grim Reaper';
-- 神獸幻獸
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Unicorn' WHERE name = 'Unicorn';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Griffin' WHERE name = 'Griffin';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Manticore' WHERE name = 'Manticore';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Wolpertinger' WHERE name = 'Wolpertinger';
-- 魔物
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Gargoyle' WHERE name = 'Gargoyle';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Kobold' WHERE name = 'Kobold';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Troll' WHERE name = 'Troll';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Baphomet' WHERE name = 'Baphomet';
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Goetic Demon' WHERE name = 'Goetic Demon';
-- 精靈仙族
UPDATE public.fictional_species SET category_path = '西方神話|歐洲民間傳說|精靈仙族|Fairy' WHERE name = 'Fairy';

-- === 八、埃及神話 (20 種 → 5 群) ===
-- 神獸
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sphinx (Egyptian)' WHERE name = 'Sphinx (Egyptian)';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Ammit' WHERE name = 'Ammit';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Criosphinx' WHERE name = 'Criosphinx';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Hieracosphinx' WHERE name = 'Hieracosphinx';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Serpopard' WHERE name = 'Serpopard';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sha' WHERE name = 'Sha';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sacred Scarab' WHERE name = 'Sacred Scarab';
-- 蛇類
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Apep' WHERE name = 'Apep';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Uraeus' WHERE name = 'Uraeus';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Winged Serpent' WHERE name = 'Winged Serpent';
-- 鳥類
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|鳥類|Bennu' WHERE name = 'Bennu';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|鳥類|Ba Bird' WHERE name = 'Ba Bird';
-- 神靈
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Anubis' WHERE name = 'Anubis';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Bastet Cat' WHERE name = 'Bastet Cat';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Horus Falcon' WHERE name = 'Horus Falcon';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Thoth Ibis' WHERE name = 'Thoth Ibis';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Sobek Crocodile' WHERE name = 'Sobek Crocodile';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Sekhmet Lioness' WHERE name = 'Sekhmet Lioness';
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|神靈|Medjed' WHERE name = 'Medjed';
-- 亡靈
UPDATE public.fictional_species SET category_path = '西方神話|埃及神話|亡靈|Mummy (Egyptian)' WHERE name = 'Mummy (Egyptian)';

-- === 九、奇幻文學通用 (19 種 → 6 群) ===
-- 魔族
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔族|Demon (Fantasy)' WHERE name = 'Demon (Fantasy)';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔族|Succubus' WHERE name = 'Succubus';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔族|Incubus' WHERE name = 'Incubus';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔族|Demon Lord' WHERE name = 'Demon Lord';
-- 精靈族
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|精靈族|Elf (Fantasy)' WHERE name = 'Elf (Fantasy)';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|精靈族|Light Elf' WHERE name = 'Light Elf';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|精靈族|Dark Elf' WHERE name = 'Dark Elf';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|精靈族|Half-elven' WHERE name = 'Half-elven';
-- 不死族
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|不死族|Lich' WHERE name = 'Lich';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|不死族|Skeleton' WHERE name = 'Skeleton';
-- 天界
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|天界|Angel' WHERE name = 'Angel';
-- 亞人種
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|亞人種|Goblin' WHERE name = 'Goblin';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|亞人種|Orc' WHERE name = 'Orc';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|亞人種|Mermaid' WHERE name = 'Mermaid';
-- 魔法生物
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Slime' WHERE name = 'Slime';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Golem' WHERE name = 'Golem';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Mimic' WHERE name = 'Mimic';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Mandrake' WHERE name = 'Mandrake';
UPDATE public.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Ent' WHERE name = 'Ent';

-- === 十三、能量態生命 (12 種 → 3 群) ===
-- 元素精靈
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Elemental Spirit' WHERE name = 'Elemental Spirit';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Fire Elemental' WHERE name = 'Fire Elemental';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Water Elemental' WHERE name = 'Water Elemental';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Wind Elemental' WHERE name = 'Wind Elemental';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Earth Elemental' WHERE name = 'Earth Elemental';
-- 能量存在
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Lightning Being' WHERE name = 'Lightning Being';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Light Spirit' WHERE name = 'Light Spirit';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Shadow Elemental' WHERE name = 'Shadow Elemental';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Will-o-the-Wisp' WHERE name = 'Will-o-the-Wisp';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Star Spirit' WHERE name = 'Star Spirit';
-- 自然精靈
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|自然精靈|Plant Spirit' WHERE name = 'Plant Spirit';
UPDATE public.fictional_species SET category_path = '非物質生命|能量態生命|自然精靈|Chrono Spirit' WHERE name = 'Chrono Spirit';

-- === 新增 2 筆物種 ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Dragon (Four-legged)', '四足飛龍', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|西方龍|Dragon (Four-legged)', '四足雙翼的經典西方龍形象，區別於雙足飛龍（Wyvern）'),
('Fallen Angel', '墮天使', '奇幻文學', '通用', '奇幻文學|通用|天界|Fallen Angel', '墮落的天使，失去神恩後投身黑暗的存在，兼具天使與魔族的特質')
ON CONFLICT(name) DO NOTHING;

-- === 修正 Chimera (Artificial) 換行符 ===
UPDATE public.fictional_species
SET category_path = '人造生命|生物合成|Chimera (Artificial)'
WHERE name = 'Chimera (Artificial)';


-- ============================================================
-- STAGING SCHEMA
-- ============================================================

-- === 一、日本神話 (19 種 → 4 群) ===
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Kitsune' WHERE name = 'Kitsune';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Tanuki' WHERE name = 'Tanuki';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Nekomata' WHERE name = 'Nekomata';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Bakeneko' WHERE name = 'Bakeneko';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Jorogumo' WHERE name = 'Jorogumo';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Kamaitachi' WHERE name = 'Kamaitachi';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Inugami' WHERE name = 'Inugami';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Yatagarasu' WHERE name = 'Yatagarasu';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|妖獸|Nue' WHERE name = 'Nue';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Oni' WHERE name = 'Oni';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Kappa' WHERE name = 'Kappa';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Yuki-onna' WHERE name = 'Yuki-onna';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|鬼怪|Tengu' WHERE name = 'Tengu';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|靈體|Shikigami' WHERE name = 'Shikigami';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|靈體|Zashiki-warashi' WHERE name = 'Zashiki-warashi';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|靈體|Tsukumogami' WHERE name = 'Tsukumogami';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|靈體|Tennyo' WHERE name = 'Tennyo';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|神獸|Dragon (Eastern)' WHERE name = 'Dragon (Eastern)';
UPDATE staging.fictional_species SET category_path = '東方神話|日本神話|神獸|Yamata no Orochi' WHERE name = 'Yamata no Orochi';

-- === 二、中國神話 (22 種 → 6 群) ===
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Azure Dragon' WHERE name = 'Azure Dragon';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|四聖獸|White Tiger' WHERE name = 'White Tiger';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Vermilion Bird' WHERE name = 'Vermilion Bird';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|四聖獸|Black Tortoise' WHERE name = 'Black Tortoise';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|龍族|Dragon (Chinese)' WHERE name = 'Dragon (Chinese)';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|龍族|Chi Dragon' WHERE name = 'Chi Dragon';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|龍族|Jiao Dragon' WHERE name = 'Jiao Dragon';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|龍族|Dragon Turtle' WHERE name = 'Dragon Turtle';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Qilin' WHERE name = 'Qilin';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Pixiu' WHERE name = 'Pixiu';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Bai Ze' WHERE name = 'Bai Ze';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|瑞獸|Phoenix (Fenghuang)' WHERE name = 'Phoenix (Fenghuang)';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|凶獸|Taotie' WHERE name = 'Taotie';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|凶獸|Qiongqi' WHERE name = 'Qiongqi';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|凶獸|Hundun' WHERE name = 'Hundun';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|凶獸|Taowu' WHERE name = 'Taowu';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|凶獸|Nian' WHERE name = 'Nian';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|妖異|Nine-tailed Fox' WHERE name = 'Nine-tailed Fox';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|妖異|Jiangshi' WHERE name = 'Jiangshi';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|神靈|Pangu' WHERE name = 'Pangu';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|神靈|Lu Wu' WHERE name = 'Lu Wu';
UPDATE staging.fictional_species SET category_path = '東方神話|中國神話|神靈|Yaksha' WHERE name = 'Yaksha';

-- === 四、希臘神話 (14 種 → 4 群) ===
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神獸|Phoenix (Western)' WHERE name = 'Phoenix (Western)';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神獸|Pegasus' WHERE name = 'Pegasus';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神獸|Cerberus' WHERE name = 'Cerberus';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Centaur' WHERE name = 'Centaur';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Minotaur' WHERE name = 'Minotaur';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Chimera' WHERE name = 'Chimera';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|複合獸|Harpy' WHERE name = 'Harpy';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Siren' WHERE name = 'Siren';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Medusa' WHERE name = 'Medusa';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|妖魔|Cyclops' WHERE name = 'Cyclops';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神族|Titan' WHERE name = 'Titan';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神族|Demigod' WHERE name = 'Demigod';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神族|Charon' WHERE name = 'Charon';
UPDATE staging.fictional_species SET category_path = '西方神話|希臘神話|神族|Dryad' WHERE name = 'Dryad';

-- === 五、北歐神話 (name/path 不一致修正，維持 3 段) ===
UPDATE staging.fictional_species SET category_path = '西方神話|北歐神話|Dragon (Norse)' WHERE name = 'Dragon (Norse)';
UPDATE staging.fictional_species SET category_path = '西方神話|北歐神話|Dwarf (Norse)' WHERE name = 'Dwarf (Norse)';

-- === 六、歐洲民間傳說 (15 種 → 5 群 + 西方龍特殊處理) ===
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|西方龍' WHERE name = 'Dragon (Western)';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|西方龍|Wyvern' WHERE name = 'Wyvern';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Vampire' WHERE name = 'Vampire';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Werewolf' WHERE name = 'Werewolf';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|不死族|Grim Reaper' WHERE name = 'Grim Reaper';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Unicorn' WHERE name = 'Unicorn';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Griffin' WHERE name = 'Griffin';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Manticore' WHERE name = 'Manticore';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|神獸幻獸|Wolpertinger' WHERE name = 'Wolpertinger';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Gargoyle' WHERE name = 'Gargoyle';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Kobold' WHERE name = 'Kobold';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Troll' WHERE name = 'Troll';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Baphomet' WHERE name = 'Baphomet';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|魔物|Goetic Demon' WHERE name = 'Goetic Demon';
UPDATE staging.fictional_species SET category_path = '西方神話|歐洲民間傳說|精靈仙族|Fairy' WHERE name = 'Fairy';

-- === 八、埃及神話 (20 種 → 5 群) ===
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sphinx (Egyptian)' WHERE name = 'Sphinx (Egyptian)';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Ammit' WHERE name = 'Ammit';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Criosphinx' WHERE name = 'Criosphinx';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Hieracosphinx' WHERE name = 'Hieracosphinx';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Serpopard' WHERE name = 'Serpopard';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sha' WHERE name = 'Sha';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神獸|Sacred Scarab' WHERE name = 'Sacred Scarab';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Apep' WHERE name = 'Apep';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Uraeus' WHERE name = 'Uraeus';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|蛇類|Winged Serpent' WHERE name = 'Winged Serpent';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|鳥類|Bennu' WHERE name = 'Bennu';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|鳥類|Ba Bird' WHERE name = 'Ba Bird';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Anubis' WHERE name = 'Anubis';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Bastet Cat' WHERE name = 'Bastet Cat';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Horus Falcon' WHERE name = 'Horus Falcon';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Thoth Ibis' WHERE name = 'Thoth Ibis';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Sobek Crocodile' WHERE name = 'Sobek Crocodile';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Sekhmet Lioness' WHERE name = 'Sekhmet Lioness';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|神靈|Medjed' WHERE name = 'Medjed';
UPDATE staging.fictional_species SET category_path = '西方神話|埃及神話|亡靈|Mummy (Egyptian)' WHERE name = 'Mummy (Egyptian)';

-- === 九、奇幻文學通用 (19 種 → 6 群) ===
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔族|Demon (Fantasy)' WHERE name = 'Demon (Fantasy)';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔族|Succubus' WHERE name = 'Succubus';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔族|Incubus' WHERE name = 'Incubus';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔族|Demon Lord' WHERE name = 'Demon Lord';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|精靈族|Elf (Fantasy)' WHERE name = 'Elf (Fantasy)';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|精靈族|Light Elf' WHERE name = 'Light Elf';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|精靈族|Dark Elf' WHERE name = 'Dark Elf';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|精靈族|Half-elven' WHERE name = 'Half-elven';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|不死族|Lich' WHERE name = 'Lich';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|不死族|Skeleton' WHERE name = 'Skeleton';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|天界|Angel' WHERE name = 'Angel';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|亞人種|Goblin' WHERE name = 'Goblin';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|亞人種|Orc' WHERE name = 'Orc';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|亞人種|Mermaid' WHERE name = 'Mermaid';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Slime' WHERE name = 'Slime';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Golem' WHERE name = 'Golem';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Mimic' WHERE name = 'Mimic';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Mandrake' WHERE name = 'Mandrake';
UPDATE staging.fictional_species SET category_path = '奇幻文學|通用|魔法生物|Ent' WHERE name = 'Ent';

-- === 十三、能量態生命 (12 種 → 3 群) ===
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Elemental Spirit' WHERE name = 'Elemental Spirit';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Fire Elemental' WHERE name = 'Fire Elemental';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Water Elemental' WHERE name = 'Water Elemental';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Wind Elemental' WHERE name = 'Wind Elemental';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|元素精靈|Earth Elemental' WHERE name = 'Earth Elemental';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Lightning Being' WHERE name = 'Lightning Being';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Light Spirit' WHERE name = 'Light Spirit';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Shadow Elemental' WHERE name = 'Shadow Elemental';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Will-o-the-Wisp' WHERE name = 'Will-o-the-Wisp';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|能量存在|Star Spirit' WHERE name = 'Star Spirit';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|自然精靈|Plant Spirit' WHERE name = 'Plant Spirit';
UPDATE staging.fictional_species SET category_path = '非物質生命|能量態生命|自然精靈|Chrono Spirit' WHERE name = 'Chrono Spirit';

-- === 新增 2 筆物種 ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Dragon (Four-legged)', '四足飛龍', '西方神話', '歐洲民間傳說', '西方神話|歐洲民間傳說|西方龍|Dragon (Four-legged)', '四足雙翼的經典西方龍形象，區別於雙足飛龍（Wyvern）'),
('Fallen Angel', '墮天使', '奇幻文學', '通用', '奇幻文學|通用|天界|Fallen Angel', '墮落的天使，失去神恩後投身黑暗的存在，兼具天使與魔族的特質')
ON CONFLICT(name) DO NOTHING;

-- === 修正 Chimera (Artificial) 換行符 ===
UPDATE staging.fictional_species
SET category_path = '人造生命|生物合成|Chimera (Artificial)'
WHERE name = 'Chimera (Artificial)';
