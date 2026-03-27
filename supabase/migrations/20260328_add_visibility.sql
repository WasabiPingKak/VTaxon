-- Migration: Add visibility system to users table
-- Supports shadow-ban (hidden), appeal (pending_review), and VTuber declaration

-- ===================== staging schema =====================
ALTER TABLE staging.users
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS visibility_reason text,
  ADD COLUMN IF NOT EXISTS visibility_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS visibility_changed_by uuid,
  ADD COLUMN IF NOT EXISTS vtuber_declaration_at timestamptz,
  ADD COLUMN IF NOT EXISTS appeal_note text;

-- Index for filtering visible users in tree/directory queries
CREATE INDEX IF NOT EXISTS idx_staging_users_visibility
  ON staging.users (visibility);

-- ===================== public schema =====================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'visible',
  ADD COLUMN IF NOT EXISTS visibility_reason text,
  ADD COLUMN IF NOT EXISTS visibility_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS visibility_changed_by uuid,
  ADD COLUMN IF NOT EXISTS vtuber_declaration_at timestamptz,
  ADD COLUMN IF NOT EXISTS appeal_note text;

CREATE INDEX IF NOT EXISTS idx_public_users_visibility
  ON public.users (visibility);
