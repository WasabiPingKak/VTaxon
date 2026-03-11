-- 新增索普德特（Sopdet）— 天狼星的埃及神話神格化身
-- Related: fictional_species_requests #34

-- === Staging ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Sopdet', '索普德特', '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Sopdet', '天狼星（Sirius）的神格化身，古埃及的豐饒與新年女神。天狼星偕日升標誌尼羅河汛期來臨，與伊西斯（Isis）形象相連，常見的形象為頭戴星冠的女性或犬狼耳飾的神靈')
ON CONFLICT(name) DO NOTHING;

-- === Production ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Sopdet', '索普德特', '西方神話', '埃及神話', '西方神話|埃及神話|神靈|Sopdet', '天狼星（Sirius）的神格化身，古埃及的豐饒與新年女神。天狼星偕日升標誌尼羅河汛期來臨，與伊西斯（Isis）形象相連，常見的形象為頭戴星冠的女性或犬狼耳飾的神靈')
ON CONFLICT(name) DO NOTHING;
