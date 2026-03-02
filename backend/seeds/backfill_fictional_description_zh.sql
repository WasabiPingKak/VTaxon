-- ============================================================
-- Backfill: 將 fictional_species 的英文 description 改為中文
-- 僅影響原始 fictional_species.sql 的 38 筆
-- expansion.sql 已是中文，不受影響
-- ============================================================

-- === 東方神話 — 日本神話 ===
UPDATE fictional_species SET description = '日本龍（竜），與水和天候相關的神獸' WHERE name = 'Dragon (Eastern)';
UPDATE fictional_species SET description = '擁有變身能力的狐狸精靈' WHERE name = 'Kitsune';
UPDATE fictional_species SET description = '善於惡作劇的狸貓妖怪' WHERE name = 'Tanuki';
UPDATE fictional_species SET description = '日本民間傳說中的鬼怪或惡鬼' WHERE name = 'Oni';
UPDATE fictional_species SET description = '鳥喙人身的山中精怪' WHERE name = 'Tengu';
UPDATE fictional_species SET description = '尾巴分叉的貓妖' WHERE name = 'Nekomata';
UPDATE fictional_species SET description = '棲息於河川的龜殼水妖' WHERE name = 'Kappa';
UPDATE fictional_species SET description = '具有變身能力的貓妖' WHERE name = 'Bakeneko';

-- === 東方神話 — 中國神話 ===
UPDATE fictional_species SET description = '中國龍（長龍），象徵權力與吉祥的神獸' WHERE name = 'Dragon (Chinese)';
UPDATE fictional_species SET description = '百鳥之王，象徵祥瑞的神鳥' WHERE name = 'Phoenix (Fenghuang)';
UPDATE fictional_species SET description = '象徵吉祥的瑞獸' WHERE name = 'Qilin';
UPDATE fictional_species SET description = '以跳躍方式移動的復活屍體' WHERE name = 'Jiangshi';
UPDATE fictional_species SET description = '有翼獅形招財瑞獸' WHERE name = 'Pixiu';

-- === 西方神話 — 希臘神話 ===
UPDATE fictional_species SET description = '浴火重生的火焰鳥' WHERE name = 'Phoenix (Western)';
UPDATE fictional_species SET description = '上半身為人、下半身為馬的生物' WHERE name = 'Centaur';
UPDATE fictional_species SET description = '牛頭人身的怪物' WHERE name = 'Minotaur';
UPDATE fictional_species SET description = '鳥身人面的風之精靈' WHERE name = 'Harpy';
UPDATE fictional_species SET description = '以歌聲魅惑水手的海中生物' WHERE name = 'Siren';
UPDATE fictional_species SET description = '守護冥界入口的三頭犬' WHERE name = 'Cerberus';
UPDATE fictional_species SET description = '蛇髮女妖，凝視會使人石化' WHERE name = 'Medusa';

-- === 西方神話 — 北歐神話 ===
UPDATE fictional_species SET description = '北歐巨龍，如尼德霍格' WHERE name = 'Dragon (Norse)';
UPDATE fictional_species SET description = '北歐神話中的光精靈或暗精靈' WHERE name = 'Elf (Norse)';
UPDATE fictional_species SET description = '北歐傳說中的鍛造大師' WHERE name = 'Dwarf (Norse)';
UPDATE fictional_species SET description = '北歐神話中的巨狼' WHERE name = 'Fenrir';
UPDATE fictional_species SET description = '挑選戰死英靈的神聖女戰士' WHERE name = 'Valkyrie';

-- === 西方神話 — 歐洲民間傳說 ===
UPDATE fictional_species SET description = '噴火飛翼巨龍' WHERE name = 'Dragon (Western)';
UPDATE fictional_species SET description = '吸食血液的不死生物' WHERE name = 'Vampire';
UPDATE fictional_species SET description = '能變身為狼的人類' WHERE name = 'Werewolf';
UPDATE fictional_species SET description = '擁有翅膀的小型魔法生物' WHERE name = 'Fairy';
UPDATE fictional_species SET description = '額頭長有螺旋角的神馬' WHERE name = 'Unicorn';
UPDATE fictional_species SET description = '獅身鷹首的有翼神獸' WHERE name = 'Griffin';

-- === 奇幻文學 ===
UPDATE fictional_species SET description = '有翼的神聖天界存在' WHERE name = 'Angel';
UPDATE fictional_species SET description = '黑暗的超自然邪惡存在' WHERE name = 'Demon (Fantasy)';
UPDATE fictional_species SET description = '不定形的膠狀生物' WHERE name = 'Slime';
UPDATE fictional_species SET description = '以魅惑為武器的魔族' WHERE name = 'Succubus';
UPDATE fictional_species SET description = '以魔法維持不死的亡靈法師' WHERE name = 'Lich';
UPDATE fictional_species SET description = '由魔法驅動的人造構裝體' WHERE name = 'Golem';
UPDATE fictional_species SET description = '上半身為人、下半身為魚的水中生物' WHERE name = 'Mermaid';
UPDATE fictional_species SET description = '尖耳的魔法人形種族' WHERE name = 'Elf (Fantasy)';
