-- ============================================================
-- Backfill: 將 fictional_species 的英文 origin / sub_origin 改為中文
-- 僅影響原始 fictional_species.sql 的 38 筆資料
-- expansion.sql 已使用中文，不受影響
-- ============================================================

-- === origin ===
UPDATE fictional_species SET origin = '東方神話'  WHERE origin = 'Eastern Mythology';
UPDATE fictional_species SET origin = '西方神話'  WHERE origin = 'Western Mythology';
UPDATE fictional_species SET origin = '奇幻文學'  WHERE origin = 'Fantasy';

-- === sub_origin ===
UPDATE fictional_species SET sub_origin = '日本神話'     WHERE sub_origin = 'Japanese Mythology';
UPDATE fictional_species SET sub_origin = '中國神話'     WHERE sub_origin = 'Chinese Mythology';
UPDATE fictional_species SET sub_origin = '希臘神話'     WHERE sub_origin = 'Greek Mythology';
UPDATE fictional_species SET sub_origin = '北歐神話'     WHERE sub_origin = 'Norse Mythology';
UPDATE fictional_species SET sub_origin = '歐洲民間傳說' WHERE sub_origin = 'European Folklore';
UPDATE fictional_species SET sub_origin = '通用'         WHERE sub_origin = 'General';

-- === category_path（同步更新，保持一致）===
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Eastern Mythology',  '東方神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Western Mythology',  '西方神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Fantasy',            '奇幻文學');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Japanese Mythology', '日本神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Chinese Mythology',  '中國神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Greek Mythology',    '希臘神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'Norse Mythology',    '北歐神話');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'European Folklore',  '歐洲民間傳說');
UPDATE fictional_species SET category_path = REPLACE(category_path, 'General',            '通用');
