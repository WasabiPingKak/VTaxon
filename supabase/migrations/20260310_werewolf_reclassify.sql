-- 狼人分類調整：不死族 → 魔物
-- Werewolf 是活人受詛咒變身的生物，不屬於不死族

-- PUBLIC
UPDATE public.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|Werewolf'
WHERE name = 'Werewolf';

-- STAGING
UPDATE staging.fictional_species
SET category_path = '西方神話|歐洲民間傳說|魔物|Werewolf'
WHERE name = 'Werewolf';
