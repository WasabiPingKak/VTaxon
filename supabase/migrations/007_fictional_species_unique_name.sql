-- Migration: 清除重複的 fictional_species 並加上 UNIQUE 約束
-- 問題：name 欄位無 UNIQUE，重複執行 seed SQL 會產生重複資料

-- Step 1: 刪除重複記錄（保留每個 name 中 id 最小的那筆）
DELETE FROM fictional_species
WHERE id NOT IN (
    SELECT MIN(id) FROM fictional_species GROUP BY name
);

-- Step 2: 加上 UNIQUE 約束，防止未來重複
ALTER TABLE fictional_species ADD CONSTRAINT fictional_species_name_unique UNIQUE (name);
