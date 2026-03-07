-- Migration: Add status column to notifications table for multi-stage workflow

-- staging schema
ALTER TABLE staging.notifications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_notifications_type_ref ON staging.notifications(type, reference_id);

-- public schema
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_notifications_type_ref ON public.notifications(type, reference_id);

-- Backfill existing notifications (optional, best-effort)
UPDATE staging.notifications SET status = 'approved' WHERE status IS NULL AND title LIKE '%已批准%';
UPDATE staging.notifications SET status = 'rejected' WHERE status IS NULL AND title LIKE '%已駁回%' AND type != 'report';
UPDATE staging.notifications SET status = 'confirmed' WHERE status IS NULL AND title LIKE '%已確認%';
UPDATE staging.notifications SET status = 'dismissed' WHERE status IS NULL AND title LIKE '%已駁回%' AND type = 'report';

UPDATE public.notifications SET status = 'approved' WHERE status IS NULL AND title LIKE '%已批准%';
UPDATE public.notifications SET status = 'rejected' WHERE status IS NULL AND title LIKE '%已駁回%' AND type != 'report';
UPDATE public.notifications SET status = 'confirmed' WHERE status IS NULL AND title LIKE '%已確認%';
UPDATE public.notifications SET status = 'dismissed' WHERE status IS NULL AND title LIKE '%已駁回%' AND type = 'report';
