-- 為 fictional_species 新增中文名稱欄位
ALTER TABLE fictional_species ADD COLUMN IF NOT EXISTS name_zh TEXT;
