-- 修正含有換行符的 category_path 和 description
-- Ghoul (Lovecraftian): category_path 含 \r\n
-- Doppelgänger: description 含 \r\n

-- === Staging ===
UPDATE staging.fictional_species
SET category_path = '現代虛構|克蘇魯神話|Ghoul (Lovecraftian)'
WHERE name = 'Ghoul (Lovecraftian)';

UPDATE staging.fictional_species
SET description = '源自德國民間傳說的神秘存在，能完美複製他人的外貌與行為，以人類的姿態潛伏於社會之中。在歐洲傳說中，目擊自己的分身常被視為不祥之兆。'
WHERE name = 'Doppelgänger';

-- === Production ===
UPDATE public.fictional_species
SET category_path = '現代虛構|克蘇魯神話|Ghoul (Lovecraftian)'
WHERE name = 'Ghoul (Lovecraftian)';

UPDATE public.fictional_species
SET description = '源自德國民間傳說的神秘存在，能完美複製他人的外貌與行為，以人類的姿態潛伏於社會之中。在歐洲傳說中，目擊自己的分身常被視為不祥之兆。'
WHERE name = 'Doppelgänger';
