-- ============================================================
-- VTaxon 測試資料清除腳本
-- 執行後將移除所有 organization = '__TEST__' 的使用者
-- vtuber_traits 會透過 ON DELETE CASCADE 自動清除
-- species_cache 保留（可能被真實使用者共用）
-- ============================================================

DELETE FROM users WHERE organization = '__TEST__';
