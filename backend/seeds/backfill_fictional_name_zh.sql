-- ============================================================
-- 回填 fictional_species.name_zh（繁體中文名稱）
-- 執行前請先跑 migrations/005_fictional_name_zh.sql 加欄位
-- 可安全重複執行（UPDATE 覆蓋）
-- ============================================================

-- === Eastern Mythology — Japanese ===
UPDATE fictional_species SET name_zh = '東方龍'   WHERE name = 'Dragon (Eastern)'       AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '妖狐'     WHERE name = 'Kitsune'                AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '狸貓'     WHERE name = 'Tanuki'                 AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '鬼'       WHERE name = 'Oni'                    AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '天狗'     WHERE name = 'Tengu'                  AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '貓又'     WHERE name = 'Nekomata'               AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '河童'     WHERE name = 'Kappa'                  AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '化貓'     WHERE name = 'Bakeneko'               AND origin = 'Eastern Mythology';

-- === Eastern Mythology — Chinese ===
UPDATE fictional_species SET name_zh = '中國龍'   WHERE name = 'Dragon (Chinese)'       AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '鳳凰'     WHERE name = 'Phoenix (Fenghuang)'    AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '麒麟'     WHERE name = 'Qilin'                  AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '殭屍'     WHERE name = 'Jiangshi'               AND origin = 'Eastern Mythology';
UPDATE fictional_species SET name_zh = '貔貅'     WHERE name = 'Pixiu'                  AND origin = 'Eastern Mythology';

-- === Western Mythology — Greek ===
UPDATE fictional_species SET name_zh = '不死鳥'   WHERE name = 'Phoenix (Western)'      AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '半人馬'   WHERE name = 'Centaur'                AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '牛頭人'   WHERE name = 'Minotaur'               AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '鷹身女妖' WHERE name = 'Harpy'                  AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '海妖'     WHERE name = 'Siren'                  AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '地獄犬'   WHERE name = 'Cerberus'               AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '梅杜莎'   WHERE name = 'Medusa'                 AND origin = 'Western Mythology';

-- === Western Mythology — Norse ===
UPDATE fictional_species SET name_zh = '北歐龍'   WHERE name = 'Dragon (Norse)'         AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '精靈'     WHERE name = 'Elf (Norse)'            AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '矮人'     WHERE name = 'Dwarf (Norse)'          AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '芬里爾'   WHERE name = 'Fenrir'                 AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '女武神'   WHERE name = 'Valkyrie'               AND origin = 'Western Mythology';

-- === Western Mythology — European Folklore ===
UPDATE fictional_species SET name_zh = '西方龍'   WHERE name = 'Dragon (Western)'       AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '吸血鬼'   WHERE name = 'Vampire'                AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '狼人'     WHERE name = 'Werewolf'               AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '妖精'     WHERE name = 'Fairy'                  AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '獨角獸'   WHERE name = 'Unicorn'                AND origin = 'Western Mythology';
UPDATE fictional_species SET name_zh = '獅鷲'     WHERE name = 'Griffin'                AND origin = 'Western Mythology';

-- === Fantasy — General ===
UPDATE fictional_species SET name_zh = '天使'     WHERE name = 'Angel'                  AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '惡魔'     WHERE name = 'Demon (Fantasy)'        AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '史萊姆'   WHERE name = 'Slime'                  AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '魅魔'     WHERE name = 'Succubus'               AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '巫妖'     WHERE name = 'Lich'                   AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '魔像'     WHERE name = 'Golem'                  AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '人魚'     WHERE name = 'Mermaid'                AND origin = 'Fantasy';
UPDATE fictional_species SET name_zh = '精靈'     WHERE name = 'Elf (Fantasy)'          AND origin = 'Fantasy';
