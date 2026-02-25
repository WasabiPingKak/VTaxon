CREATE TABLE IF NOT EXISTS oauth_accounts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider             VARCHAR(20) NOT NULL CHECK (provider IN ('youtube', 'twitch')),
    provider_account_id  VARCHAR(255) NOT NULL,
    provider_display_name VARCHAR(255),
    provider_avatar_url  VARCHAR(2048),
    access_token         TEXT,
    refresh_token        TEXT,
    token_expires_at     TIMESTAMP WITH TIME ZONE,
    created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    CONSTRAINT uq_provider_account UNIQUE (provider, provider_account_id)
);
