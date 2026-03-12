-- Live stream status table (staging)
CREATE TABLE IF NOT EXISTS staging.live_streams (
    id            SERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES staging.users(id) ON DELETE CASCADE,
    provider      TEXT NOT NULL CHECK (provider IN ('youtube', 'twitch')),
    stream_id     TEXT,
    stream_title  TEXT,
    stream_url    TEXT,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_staging_live_streams_user_id ON staging.live_streams(user_id);

-- Live stream status table (production)
CREATE TABLE IF NOT EXISTS public.live_streams (
    id            SERIAL PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider      TEXT NOT NULL CHECK (provider IN ('youtube', 'twitch')),
    stream_id     TEXT,
    stream_title  TEXT,
    stream_url    TEXT,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_public_live_streams_user_id ON public.live_streams(user_id);
