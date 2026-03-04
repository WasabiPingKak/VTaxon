-- Add report_type column to user_reports
-- 'impersonation' = existing behavior (偽冒帳號)
-- 'not_vtuber' = new type (非 VTuber / ACG 相關)
ALTER TABLE user_reports ADD COLUMN report_type TEXT NOT NULL DEFAULT 'impersonation';
