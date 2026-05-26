-- 新增虛構物種：宇宙熊 (Galaxy Bear) — 人造生命 / 附魂體
-- 來源：使用者建議申請（帕比沫沫 2026-05-26）

-- === staging ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Galaxy Bear', '宇宙熊', '人造生命', '附魂體', '人造生命|附魂體|Galaxy Bear',
 '生活在宇宙銀行裡的熊熊，顏色不限定，通常擁有人形熊耳，而非完全獸族，熱愛生活，職業多變。')
ON CONFLICT(name) DO NOTHING;

-- === public ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Galaxy Bear', '宇宙熊', '人造生命', '附魂體', '人造生命|附魂體|Galaxy Bear',
 '生活在宇宙銀行裡的熊熊，顏色不限定，通常擁有人形熊耳，而非完全獸族，熱愛生活，職業多變。')
ON CONFLICT(name) DO NOTHING;
