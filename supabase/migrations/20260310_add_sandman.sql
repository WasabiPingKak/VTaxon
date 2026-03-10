-- Migration: 新增睡魔 (Sandman) 虛構物種
-- Date: 2026-03-10
-- Request ID: #33

-- === Staging ===
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description)
VALUES (
    'Sandman',
    '睡魔',
    '西方神話',
    '日耳曼傳說',
    '西方神話|日耳曼傳說|睡魔|Sandman',
    '日耳曼民間傳說中的催眠精靈，夜晚往兒童眼中撒沙誘導睡眠並帶來夢境'
)
ON CONFLICT(name) DO NOTHING;

-- === Production ===
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description)
VALUES (
    'Sandman',
    '睡魔',
    '西方神話',
    '日耳曼傳說',
    '西方神話|日耳曼傳說|睡魔|Sandman',
    '日耳曼民間傳說中的催眠精靈，夜晚往兒童眼中撒沙誘導睡眠並帶來夢境'
)
ON CONFLICT(name) DO NOTHING;
