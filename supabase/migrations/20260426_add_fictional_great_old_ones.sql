-- 新增虛構物種：舊日支配者 (Great Old Ones) — 克蘇魯神話
-- 來源：使用者建議申請

-- === staging ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Great Old Ones', '舊日支配者', '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Great Old Ones',
 '宇宙中強大而古老的種族，肉軀由不同於凡間之物的不明物質構成。能力遠超凡人想像，凡人目睹即陷入瘋狂，但仍有外星種族與神秘宗教崇拜祂們。')
ON CONFLICT(name) DO NOTHING;

-- === public ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Great Old Ones', '舊日支配者', '現代虛構', '克蘇魯神話', '現代虛構|克蘇魯神話|Great Old Ones',
 '宇宙中強大而古老的種族，肉軀由不同於凡間之物的不明物質構成。能力遠超凡人想像，凡人目睹即陷入瘋狂，但仍有外星種族與神秘宗教崇拜祂們。')
ON CONFLICT(name) DO NOTHING;
