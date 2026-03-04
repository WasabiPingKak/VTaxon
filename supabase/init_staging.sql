-- ============================================================
-- VTaxon Staging Schema
-- 在同一個 Supabase 資料庫建立 staging schema，
-- 複製所有表結構（不含資料），用於 staging 環境隔離。
-- 在 Supabase SQL Editor 執行此檔案。
-- ============================================================

CREATE SCHEMA IF NOT EXISTS staging;

-- ============================================================
-- 1. users — 角色主體
-- ============================================================
CREATE TABLE staging.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    organization TEXT,
    bio TEXT,
    country_flags JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    primary_platform TEXT CHECK (primary_platform IN ('youtube', 'twitch')),
    profile_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. auth_id_aliases — 跨 email OAuth 帳號綁定別名
-- ============================================================
CREATE TABLE staging.auth_id_aliases (
    auth_id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES staging.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stg_auth_id_aliases_user_id ON staging.auth_id_aliases(user_id);

-- ============================================================
-- 3. oauth_accounts — 平台帳號連結
-- ============================================================
CREATE TABLE staging.oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES staging.users(id) ON DELETE CASCADE,
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

CREATE INDEX idx_stg_oauth_accounts_user_id ON staging.oauth_accounts(user_id);

-- ============================================================
-- 4. species_cache — GBIF 分類資料快取
-- ============================================================
CREATE TABLE staging.species_cache (
    taxon_id INTEGER PRIMARY KEY,
    scientific_name TEXT NOT NULL,
    common_name_en TEXT,
    common_name_zh TEXT,
    taxon_rank TEXT,
    taxon_path TEXT,
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_ TEXT,
    family TEXT,
    genus TEXT,
    path_zh JSONB DEFAULT '{}'::jsonb,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stg_species_cache_taxon_path ON staging.species_cache(taxon_path text_pattern_ops);

-- ============================================================
-- 5. fictional_species — 奇幻生物獨立分類
-- ============================================================
CREATE TABLE staging.fictional_species (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    name_zh TEXT,
    origin TEXT NOT NULL,
    sub_origin TEXT,
    category_path TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stg_fictional_species_category_path ON staging.fictional_species(category_path text_pattern_ops);

-- ============================================================
-- 6. breeds — 品種
-- ============================================================
CREATE TABLE staging.breeds (
    id SERIAL PRIMARY KEY,
    taxon_id INTEGER NOT NULL REFERENCES staging.species_cache(taxon_id),
    name_en TEXT NOT NULL,
    name_zh TEXT,
    breed_group TEXT,
    wikidata_id TEXT,
    source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (taxon_id, name_en)
);

CREATE INDEX idx_stg_breeds_taxon_id ON staging.breeds(taxon_id);
CREATE INDEX idx_stg_breeds_name_zh_pattern ON staging.breeds(name_zh text_pattern_ops);
CREATE INDEX idx_stg_breeds_name_en_lower ON staging.breeds(lower(name_en) text_pattern_ops);

-- ============================================================
-- 7. fictional_species_requests — 使用者建議新增的虛構物種
-- ============================================================
CREATE TABLE staging.fictional_species_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    name_zh TEXT NOT NULL,
    name_en TEXT,
    suggested_origin TEXT,
    suggested_sub_origin TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. breed_requests — 使用者建議新增的品種
-- ============================================================
CREATE TABLE staging.breed_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    taxon_id INTEGER REFERENCES staging.species_cache(taxon_id),
    name_zh TEXT,
    name_en TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. vtuber_traits — 角色與物種的多對多關聯
-- ============================================================
CREATE TABLE staging.vtuber_traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES staging.users(id) ON DELETE CASCADE,
    taxon_id INTEGER REFERENCES staging.species_cache(taxon_id),
    fictional_species_id INTEGER REFERENCES staging.fictional_species(id),
    display_name TEXT,
    breed_name TEXT,
    breed_id INTEGER REFERENCES staging.breeds(id) ON DELETE SET NULL,
    trait_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL)
);

CREATE INDEX idx_stg_vtuber_traits_user_id ON staging.vtuber_traits(user_id);
CREATE INDEX idx_stg_vtuber_traits_taxon_id ON staging.vtuber_traits(taxon_id);
CREATE INDEX idx_stg_vtuber_traits_fictional_species_id ON staging.vtuber_traits(fictional_species_id);
CREATE INDEX idx_stg_vtuber_traits_breed_id ON staging.vtuber_traits(breed_id);

CREATE UNIQUE INDEX idx_stg_vtuber_traits_user_taxon
    ON staging.vtuber_traits(user_id, taxon_id)
    WHERE taxon_id IS NOT NULL;

CREATE UNIQUE INDEX idx_stg_vtuber_traits_user_fictional
    ON staging.vtuber_traits(user_id, fictional_species_id)
    WHERE fictional_species_id IS NOT NULL;

-- ============================================================
-- 10. user_reports — 使用者檢舉
-- ============================================================
CREATE TABLE staging.user_reports (
    id SERIAL PRIMARY KEY,
    reporter_id UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    evidence_url TEXT,
    report_type TEXT NOT NULL DEFAULT 'impersonation',
    status TEXT NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stg_user_reports_status ON staging.user_reports(status);

-- ============================================================
-- 11. blacklist — 黑名單
-- ============================================================
CREATE TABLE staging.blacklist (
    id SERIAL PRIMARY KEY,
    identifier_type TEXT NOT NULL,
    identifier_value TEXT NOT NULL,
    user_id UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    reason TEXT,
    banned_by UUID REFERENCES staging.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(identifier_type, identifier_value)
);

-- ============================================================
-- 觸發器：reuse public.update_updated_at() 函式
-- ============================================================
CREATE TRIGGER trg_stg_users_updated_at
    BEFORE UPDATE ON staging.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_stg_vtuber_traits_updated_at
    BEFORE UPDATE ON staging.vtuber_traits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 注意：Staging schema 不設 RLS。
-- Flask backend 使用 service_role 連線，不透過 PostgREST。
-- ============================================================
