-- 補建 notifications 表（staging + prod）
-- init_staging.sql 漏掉了這張表，導致 staging 環境中
-- 批量轉移回報狀態（transition-fictional / transition-breeds）時
-- 因找不到 notifications 表而失敗
-- prod 使用 IF NOT EXISTS 確保冪等

-- ============================================================
-- Production (public)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reference_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    status TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type_ref
    ON public.notifications(type, reference_id);

-- ============================================================
-- Staging (staging)
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
