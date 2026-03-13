-- Migration: 新增「貓亞人 (Cat Demihuman)」虛構物種
-- Date: 2026-03-14

-- Staging schema
INSERT INTO staging.fictional_species (name, name_zh, origin, sub_origin, category_path, description)
VALUES (
    'Cat Demihuman',
    '貓亞人',
    '奇幻文學',
    '通用',
    '奇幻文學|通用|亞人種|Cat Demihuman',
    '擁有貓咪耳朵、尾巴等特徵的人形物種，比獸人更接近人類的體態。'
)
ON CONFLICT(name) DO NOTHING;

-- Production schema
INSERT INTO public.fictional_species (name, name_zh, origin, sub_origin, category_path, description)
VALUES (
    'Cat Demihuman',
    '貓亞人',
    '奇幻文學',
    '通用',
    '奇幻文學|通用|亞人種|Cat Demihuman',
    '擁有貓咪耳朵、尾巴等特徵的人形物種，比獸人更接近人類的體態。'
)
ON CONFLICT(name) DO NOTHING;
