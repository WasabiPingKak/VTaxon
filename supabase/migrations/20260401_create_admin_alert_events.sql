-- Migration: Add admin_alert_events table for alert digest system

-- ===================== staging schema =====================

CREATE TABLE IF NOT EXISTS staging.admin_alert_events (
    id serial PRIMARY KEY,
    alert_type text NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    context jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    notified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_staging_alert_events_unnotified
    ON staging.admin_alert_events (created_at)
    WHERE notified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_staging_alert_events_type_notified
    ON staging.admin_alert_events (alert_type, notified_at DESC)
    WHERE notified_at IS NOT NULL;

-- ===================== public schema =====================

CREATE TABLE IF NOT EXISTS public.admin_alert_events (
    id serial PRIMARY KEY,
    alert_type text NOT NULL,
    severity text NOT NULL,
    title text NOT NULL,
    context jsonb DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    notified_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_public_alert_events_unnotified
    ON public.admin_alert_events (created_at)
    WHERE notified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_public_alert_events_type_notified
    ON public.admin_alert_events (alert_type, notified_at DESC)
    WHERE notified_at IS NOT NULL;
