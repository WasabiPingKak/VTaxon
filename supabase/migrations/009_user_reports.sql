-- 009: User reports (impersonation reporting) & blacklist
-- Run in Supabase SQL Editor

-- ── user_reports ────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_reports (
    id          SERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason      TEXT NOT NULL,
    evidence_url TEXT,
    status      TEXT NOT NULL DEFAULT 'pending',
    admin_note  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);

-- ── blacklist ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS blacklist (
    id               SERIAL PRIMARY KEY,
    identifier_type  TEXT NOT NULL,
    identifier_value TEXT NOT NULL,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    reason           TEXT,
    banned_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(identifier_type, identifier_value)
);

-- ── RLS ────────────────────────────────────────────
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- user_reports: anyone can INSERT (anonymous reporting)
CREATE POLICY "user_reports_insert_anon"
    ON user_reports FOR INSERT
    WITH CHECK (true);

-- user_reports: reporters can SELECT their own reports
CREATE POLICY "user_reports_select_own"
    ON user_reports FOR SELECT
    USING (reporter_id = auth.uid());

-- user_reports: service_role has full access (backend uses service_role)
-- (Supabase service_role bypasses RLS by default, so no explicit policy needed)

-- blacklist: only service_role can access (no user-facing policies)
-- (Supabase service_role bypasses RLS by default)
