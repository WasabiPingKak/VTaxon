-- 補建 staging.notifications 表
-- init_staging.sql 漏掉了這張表，導致 staging 環境中
-- 批量轉移回報狀態（transition-fictional / transition-breeds）時
-- 因找不到 notifications 表而失敗

-- ============================================================
-- Staging only（public.notifications 已存在於 init.sql）
-- ============================================================

CREATE TABLE IF NOT EXISTS staging.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES staging.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reference_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    status TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stg_notifications_user_id
    ON staging.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_stg_notifications_user_unread
    ON staging.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_stg_notifications_type_ref
    ON staging.notifications(type, reference_id);
