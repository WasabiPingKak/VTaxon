-- ============================================================
-- VTaxon Database Schema
-- Run this in Supabase SQL Editor to initialize all tables
-- ============================================================

-- 1. users — 角色主體
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    organization TEXT,
    country_flags JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    primary_platform TEXT CHECK (primary_platform IN ('youtube', 'twitch')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. auth_id_aliases — 跨 email OAuth 帳號綁定別名
-- 當使用者用不同 email 的 OAuth 綁定第二個平台時，
-- Supabase 會建立新的 auth.users 記錄。此表將新的 auth ID 映射回原本的 VTaxon user。
CREATE TABLE auth_id_aliases (
    auth_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_id_aliases_user_id ON auth_id_aliases(user_id);

-- 2. oauth_accounts — 平台帳號連結
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('youtube', 'twitch')),
    provider_account_id TEXT NOT NULL,
    provider_display_name TEXT,
    provider_avatar_url TEXT,
    channel_url TEXT,
    show_on_profile BOOLEAN NOT NULL DEFAULT true,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_account_id)
);

CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);

-- 3. species_cache — GBIF 分類資料快取
CREATE TABLE species_cache (
    taxon_id INTEGER PRIMARY KEY,  -- = GBIF usageKey
    scientific_name TEXT NOT NULL,
    common_name_en TEXT,
    common_name_zh TEXT,
    taxon_rank TEXT,
    taxon_path TEXT,               -- Materialized Path, '|' 分隔
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_ TEXT,
    family TEXT,
    genus TEXT,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 前綴查詢索引（親緣距離計算用）
CREATE INDEX idx_species_cache_taxon_path ON species_cache(taxon_path text_pattern_ops);

-- 4. fictional_species — 奇幻生物獨立分類
CREATE TABLE fictional_species (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    origin TEXT NOT NULL,          -- Level 1: 東方神話、西方神話...
    sub_origin TEXT,               -- Level 2: 日本神話、北歐神話... (nullable)
    category_path TEXT,            -- Materialized Path, '|' 分隔
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fictional_species_category_path ON fictional_species(category_path text_pattern_ops);

-- 5. vtuber_traits — 角色與物種的多對多關聯
CREATE TABLE vtuber_traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    taxon_id INTEGER REFERENCES species_cache(taxon_id),
    fictional_species_id INTEGER REFERENCES fictional_species(id),
    display_name TEXT NOT NULL,    -- 使用者看到的名稱，如「龍」
    trait_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL)
);

CREATE INDEX idx_vtuber_traits_user_id ON vtuber_traits(user_id);
CREATE INDEX idx_vtuber_traits_taxon_id ON vtuber_traits(taxon_id);
CREATE INDEX idx_vtuber_traits_fictional_species_id ON vtuber_traits(fictional_species_id);

-- 同一角色不能重複標註同一現實物種
CREATE UNIQUE INDEX idx_vtuber_traits_user_taxon
    ON vtuber_traits(user_id, taxon_id)
    WHERE taxon_id IS NOT NULL;

-- 同一角色不能重複標註同一奇幻生物
CREATE UNIQUE INDEX idx_vtuber_traits_user_fictional
    ON vtuber_traits(user_id, fictional_species_id)
    WHERE fictional_species_id IS NOT NULL;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_id_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE fictional_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE vtuber_traits ENABLE ROW LEVEL SECURITY;

-- users: 所有人可讀，本人可改自己的資料
CREATE POLICY "users_select_all" ON users
    FOR SELECT USING (true);

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- auth_id_aliases: 後端 service_role 讀寫，一般使用者可讀自己的
CREATE POLICY "aliases_select_own" ON auth_id_aliases
    FOR SELECT USING (auth.uid() = auth_id OR auth.uid() = user_id);

-- oauth_accounts: 只有本人可讀寫自己的帳號連結
CREATE POLICY "oauth_select_own" ON oauth_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "oauth_insert_own" ON oauth_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oauth_delete_own" ON oauth_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- species_cache: 所有人可讀，只有後端 service_role 可寫（不需要額外 policy）
CREATE POLICY "species_cache_select_all" ON species_cache
    FOR SELECT USING (true);

-- fictional_species: 所有人可讀
CREATE POLICY "fictional_species_select_all" ON fictional_species
    FOR SELECT USING (true);

-- vtuber_traits: 所有人可讀，本人可增刪改自己的 trait
CREATE POLICY "traits_select_all" ON vtuber_traits
    FOR SELECT USING (true);

CREATE POLICY "traits_insert_own" ON vtuber_traits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "traits_update_own" ON vtuber_traits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "traits_delete_own" ON vtuber_traits
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- updated_at 自動更新觸發器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vtuber_traits_updated_at
    BEFORE UPDATE ON vtuber_traits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
