-- ============================================================
-- Fictional Species — 埃及神話 (Egyptian Mythology)
-- Run this in Supabase SQL Editor after fictional_species.sql
-- 新增 20 筆資料
-- ============================================================

-- === 神獸 / 混合獸 (Mythical Beasts) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Sphinx (Egyptian)',    '斯芬克斯',       '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Sphinx (Egyptian)',          '人面獅身像，智慧與守護的象徵，會出謎題考驗旅人'),
('Ammit',               '阿米特',         '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Ammit',           '鱷魚頭、獅子前軀、河馬後軀的混合獸，在冥界審判中吞噬罪人之心'),
('Criosphinx',          '羊頭斯芬克斯',   '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Criosphinx',      '公羊頭獅身的神獸，阿蒙神殿前的守護者'),
('Hieracosphinx',       '鷹頭斯芬克斯',   '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Hieracosphinx',   '鷹頭獅身的神獸，荷魯斯神力的化身'),
('Serpopard',           '蛇頸豹',         '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Serpopard',        '擁有蛇般長頸的豹，出現於古埃及納爾邁調色盤雕刻'),
('Sha',                 '賽特神獸',       '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Sha',              '賽特神的聖獸，形似犬但無法對應任何現實動物，方形長耳為其特徵')
ON CONFLICT(name) DO NOTHING;

-- === 蛇類 / 爬蟲類 (Serpents) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Apep',                '阿佩普',         '西方神話', '埃及神話', '西方神話|埃及神話|蛇類|Apep',             '混沌巨蛇，每夜試圖吞噬太陽船，太陽神拉的永恆宿敵'),
('Uraeus',              '烏拉尤斯聖蛇',   '西方神話', '埃及神話', '西方神話|埃及神話|蛇類|Uraeus',           '法老王冠上的守護眼鏡蛇，瓦吉特女神的化身，能噴射火焰'),
('Winged Serpent',      '有翼蛇',         '西方神話', '埃及神話', '西方神話|埃及神話|蛇類|Winged Serpent',   '擁有翅膀的蛇，守護乳香產地的神聖生物')
ON CONFLICT(name) DO NOTHING;

-- === 鳥類 / 飛行類 (Birds) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Bennu',               '貝努鳥',         '西方神話', '埃及神話', '西方神話|埃及神話|鳥類|Bennu',            '埃及版鳳凰，太陽與重生的象徵，棲於赫利奧波利斯的聖柳之上'),
('Ba Bird',             '巴鳥',           '西方神話', '埃及神話', '西方神話|埃及神話|鳥類|Ba Bird',          '人頭鳥身的靈體，代表死者靈魂的化身，可自由往返陰陽兩界')
ON CONFLICT(name) DO NOTHING;

-- === 神靈形態 (Divine Forms) — 動漫 / Vtuber 高人氣 ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Anubis',              '阿努比斯',       '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Anubis',           '胡狼頭人身的冥界引路者與亡者守護神，動漫與遊戲中的超人氣形象'),
('Bastet Cat',          '巴斯特聖貓',     '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Bastet Cat',       '貓首人身的家庭與豐饒守護者，古埃及最受崇敬的神聖動物之一'),
('Horus Falcon',        '荷魯斯之鷹',     '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Horus Falcon',     '鷹首人身的天空與王權之神化身，鷹眼象徵全知之眼'),
('Thoth Ibis',          '托特聖䴉',       '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Thoth Ibis',       '朱鷺首人身的智慧與書寫之神化身，月亮與知識的守護者'),
('Sobek Crocodile',     '索貝克聖鱷',     '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Sobek Crocodile',  '鱷魚首人身的尼羅河與力量之神化身，象徵法老的軍事力量'),
('Sekhmet Lioness',     '塞赫邁特獅',     '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Sekhmet Lioness',  '獅首人身的戰爭與治癒女神化身，太陽神之眼的怒焰化身')
ON CONFLICT(name) DO NOTHING;

-- === 亡靈 / 其他 (Undead & Others) ===
INSERT INTO fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Mummy (Egyptian)',    '木乃伊',         '西方神話', '埃及神話', '西方神話|埃及神話|亡靈|Mummy (Egyptian)',            '經防腐術保存並以咒語復活的亡者，擁有不死詛咒的永恆存在'),
('Sacred Scarab',       '聖甲蟲',         '西方神話', '埃及神話', '西方神話|埃及神話|神獸|Sacred Scarab',    '凱布利神的化身，推動糞球如推動太陽橫越天空，象徵重生與輪迴'),
('Medjed',              '梅傑德',         '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Medjed',           '《死者之書》中記載的神秘存在，外形如披布幽靈，因日本迷因文化爆紅')
ON CONFLICT(name) DO NOTHING;
