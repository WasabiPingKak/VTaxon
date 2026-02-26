CREATE TABLE IF NOT EXISTS fictional_species (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,       -- 例：九尾狐、Western Dragon
    origin       VARCHAR(255) NOT NULL,       -- Level 1：東方神話、西方神話...
    sub_origin   VARCHAR(255),                -- Level 2：日本神話、北歐神話...（可為 NULL）
    category_path VARCHAR(1024) NOT NULL,     -- 東方神話|日本神話|九尾狐
    description  TEXT,                        -- 選填描述
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fictional_category_path
    ON fictional_species (category_path varchar_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_fictional_origin
    ON fictional_species (origin);
