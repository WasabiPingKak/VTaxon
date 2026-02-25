CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255) NOT NULL,
    avatar_url   VARCHAR(2048),
    role         VARCHAR(20) NOT NULL DEFAULT 'user'
                 CHECK (role IN ('admin', 'user')),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
