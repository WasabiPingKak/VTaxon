-- 新增虛構物種：化身 (Avatar) — 東方神話 / 印度神話
-- 來源：使用者建議申請（希螺納多 2026-10-14）
-- 注意：「印度神話」為新的 sub_origin，前端排序清單（FictionalSpeciesPicker / classifyPrompt）已同步新增

-- === staging ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Avatar', '化身', '東方神話', '印度神話', '東方神話|印度神話|神靈|Avatar',
 '印度教中的神性概念，梵語 avatāra 直譯為降臨、降生，指神靈轉世於人間的肉身存有。根據《薄伽梵歌》與諸《往世書》的記載，神靈（尤其是毗濕奴、濕婆、夏克提）藉由化身降臨人間，並建立正法。')
ON CONFLICT(name) DO NOTHING;

-- === public ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description) VALUES
('Avatar', '化身', '東方神話', '印度神話', '東方神話|印度神話|神靈|Avatar',
 '印度教中的神性概念，梵語 avatāra 直譯為降臨、降生，指神靈轉世於人間的肉身存有。根據《薄伽梵歌》與諸《往世書》的記載，神靈（尤其是毗濕奴、濕婆、夏克提）藉由化身降臨人間，並建立正法。')
ON CONFLICT(name) DO NOTHING;
