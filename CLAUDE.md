# VTaxon — Vtuber 生物分類系統

## 專案簡介

VTaxon 是一個面向 Vtuber 社群的公開服務，將 Vtuber 角色的形象特徵對應到現實世界的生物分類學體系（界、門、綱、目、科、屬、種），以分類樹的形式呈現角色之間的關聯。

## 核心功能

- **物種標註**：頻道主透過 OAuth 登入後，標註自己角色的物種特徵（支援複合種，一個角色可有多個物種特徵）。
- **分類樹瀏覽**：以生物分類階層呈現所有已建檔的角色。

## 架構決策

| 項目 | 決策 |
|------|------|
| 帳號識別 | OAuth 多平台連結（YouTube / Twitch），一個 user = 一個角色 |
| 生物分類資料 | GBIF API 即時查詢 + 本地 PostgreSQL 快取 |
| 幻想物種 | 獨立分類系統（來源→子體系→葉節點），與現實分類完全獨立 |
| 角色粒度 | 一個頻道 = 一個角色 |
| 權限 | 頻道主編輯自己的資料 + 管理者（admin）全域權限 |
| 複合種 | 只記錄包含哪些物種，不記錄比例，所有 trait 等權 |
| 認證方式 | Supabase Auth（OAuth → JWT） |
| 部署方案 | Flask on Google Cloud Run；前端 Firebase Hosting |

## 技術棧

- **前端**：React + Vite + TypeScript
- **後端**：Python 3.12 Flask + SQLAlchemy
- **型別檢查**：mypy strict mode（後端）、tsc（前端）
- **資料庫**：PostgreSQL（Supabase）
- **認證**：Supabase Auth（OAuth → JWT）
- **後端部署**：Google Cloud Run（asia-east1）
- **前端部署**：Firebase Hosting
- **CI/CD**：GitHub Actions（develop → staging，main → production）
- **Linting**：Ruff（後端）、ESLint（前端）
- **外部 API**：GBIF Species API（生物分類查詢）、Wikidata / TaiCOL（中文名稱）

## 認證流程

1. **登入**：前端呼叫 Supabase Auth SDK，使用者透過 YouTube / Twitch OAuth 登入，取得 JWT。
2. **API 驗證**：前端在每次 API 請求的 `Authorization: Bearer <JWT>` 標頭帶上 JWT。Flask 後端使用 Supabase JWKS（ES256 公鑰）驗證簽章，驗證失敗時自動刷新 JWKS 並重試一次（處理 key rotation）。
3. **權限檢查**：從 JWT 中取得 `user_id`，查詢 `users` 表的 `role` 欄位判斷權限（`admin` 或 `user`）。

## 資料模型（14 張表）

### users
角色主體。一筆 user = 一個 Vtuber 角色。
- `id` (uuid, PK), `display_name`, `avatar_url`, `role` (admin|user), `organization` (text, nullable), `org_type` (varchar(20), default 'indie': indie|corporate|club), `bio` (text, nullable), `country_flags` (jsonb, default []), `social_links` (jsonb, default {}), `primary_platform` (youtube|twitch, nullable), `profile_data` (jsonb, default {}), `last_live_at` (timestamptz, nullable), `visibility` (text, default 'visible': visible|hidden|pending_review), `visibility_reason` (text, nullable), `visibility_changed_at` (timestamptz, nullable), `visibility_changed_by` (uuid, nullable), `vtuber_declaration_at` (timestamptz, nullable), `appeal_note` (text, nullable), `live_primary_real_trait_id` (FK → vtuber_traits, nullable), `live_primary_fictional_trait_id` (FK → vtuber_traits, nullable), `created_at`, `updated_at`

### oauth_accounts
平台帳號連結，一個 user 可綁定多個平台。
- `id` (uuid, PK), `user_id` (FK → users), `provider` (youtube|twitch), `provider_account_id` (UNIQUE with provider), `provider_display_name`, `provider_avatar_url`, `channel_url`, `show_on_profile` (boolean, default true), `access_token` (EncryptedText), `refresh_token` (EncryptedText), `token_expires_at`, `live_sub_status` (text, nullable), `live_sub_at` (timestamptz, nullable), `created_at`

### species_cache
從 GBIF 拉回的分類資料快取。
- `taxon_id` (int, PK, = GBIF usageKey), `scientific_name`, `common_name_en`, `common_name_zh`, `alternative_names_zh`, `taxon_rank`, `taxon_path` (Materialized Path, 用 `|` 分隔), `kingdom`, `phylum`, `class`, `order_`, `family`, `genus`, `path_zh` (jsonb, default {}), `cached_at`

### fictional_species
奇幻生物獨立分類表，以文化來源為主軸的分類體系。
- `id` (serial, PK), `name`, `name_zh` (繁體中文名稱, nullable), `origin` (Level 1：東方神話、西方神話...), `sub_origin` (Level 2：日本神話、北歐神話..., nullable), `category_path` (Materialized Path, 用 `|` 分隔), `description`, `created_at`

### auth_id_aliases
跨 email OAuth 帳號綁定別名。Supabase 用不同 email OAuth 綁定第二個平台時會建立新的 auth.users，此表映射回原 VTaxon user。
- `auth_id` (uuid, PK), `user_id` (FK → users), `created_at`

### breeds
品種（物種的子層級）。
- `id` (serial, PK), `taxon_id` (FK → species_cache), `name_en`, `name_zh`, `breed_group`, `wikidata_id`, `source`, `created_at`

### fictional_species_requests
使用者建議新增的虛構物種。
- `id` (serial, PK), `user_id` (FK → users), `name_zh`, `name_en`, `suggested_origin`, `suggested_sub_origin`, `description`, `status`, `admin_note`, `created_at`

### breed_requests
使用者建議新增的品種。
- `id` (serial, PK), `user_id` (FK → users), `taxon_id` (FK → species_cache), `name_zh`, `name_en`, `description`, `status`, `admin_note`, `created_at`

### species_name_reports
使用者回報物種名稱錯誤或缺漏。
- `id` (serial, PK), `user_id` (FK → users), `taxon_id` (FK → species_cache), `report_type` (missing_zh|wrong_zh), `current_name_zh`, `suggested_name_zh`, `description`, `status`, `admin_note`, `created_at`

### user_reports
使用者檢舉。
- `id` (serial, PK), `reporter_id` (FK → users), `reported_user_id` (FK → users), `reason`, `evidence_url`, `report_type`, `status`, `admin_note`, `created_at`

### blacklist
黑名單。
- `id` (serial, PK), `identifier_type`, `identifier_value`, `user_id` (FK → users), `reason`, `banned_by` (FK → users), `created_at`

### notifications
站內通知。
- `id` (serial, PK), `user_id` (FK → users), `type` (text), `reference_id` (int), `title`, `message`, `status`, `is_read` (boolean, default false), `created_at`

### live_streams
直播狀態記錄（每個 user 每個平台最多一筆 active stream）。
- `id` (serial, PK), `user_id` (FK → users), `provider` (youtube|twitch), `stream_id`, `stream_title`, `stream_url`, `started_at`, `created_at`
- UNIQUE constraint: (user_id, provider)

### vtuber_traits
角色與物種的多對多關聯。一筆 trait 可關聯現實物種或奇幻生物（至少一個）。
- `id` (uuid, PK), `user_id` (FK → users), `taxon_id` (FK → species_cache, nullable), `fictional_species_id` (FK → fictional_species, nullable), `display_name` (text, DB 欄位保留但 ORM 已移除), `breed_name`, `breed_id` (FK → breeds, nullable), `trait_note`, `created_at`, `updated_at`
- CHECK constraint: `taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL`
- Partial unique index: (user_id, taxon_id) WHERE taxon_id IS NOT NULL
- Partial unique index: (user_id, fictional_species_id) WHERE fictional_species_id IS NOT NULL

## 外部 API 參考

- **GBIF Species API**: https://www.gbif.org/developer/species — 生物分類查詢、模糊匹配
- **TaiCOL**: https://taicol.tw/ — 繁體中文名稱與台灣本土物種（備用）
- **TimeTree**: http://timetree.org/ — 演化分歧時間（未來進階用）

## 部署架構

| 環境 | Git 分支 | 後端 Cloud Run | 前端 |
|------|---------|---------------|------|
| Staging | `develop` | vtaxon-api-staging | vtaxon-staging.web.app |
| Production | `main` | vtaxon-api-prod | vtaxon.com |

- Push `develop` → 自動部署到 staging；Merge `develop` → `main` → 自動部署到 production
- Feature branch / worktree 規則見全域 `~/.claude/CLAUDE.md`
- Staging 使用 DB 的 `staging` schema，Production 使用 `public` schema（同一個 Supabase 專案）
- CI/CD：`.github/workflows/deploy-staging.yml` / `deploy-prod.yml`
- DB 初始化腳本：`scripts/init_db.py`（支援 `--target staging/prod`）

## Debugging

- When debugging, do NOT guess root causes speculatively. Read the actual error logs and trace the code path before proposing fixes. If a hypothesis is disproven, move on — don't keep guessing.

## 開發注意事項

- **DB schema 變更必須同時處理 staging 和 prod**：任何 ALTER TABLE、CREATE TABLE 等 schema 變更，都必須在 `supabase/migrations/` 建立 migration 腳本，且 SQL 中要分別寫 `staging.table_name` 和 `public.table_name` 兩段。修改 `supabase/init.sql` 只影響全新建庫，不會自動 migrate 已上線的資料庫。
- 資料庫選用 Supabase 免費方案，注意儲存空間限制。
- Google Cloud Run 有冷啟動延遲，Flask 應用應盡量縮短啟動時間（精簡 import、延遲載入非必要模組）。
- 奇幻生物使用獨立分類系統（`fictional_species` 表），分類由管理者手動預建。
- `taxon_path` 欄位需要 `varchar_pattern_ops` 索引以支援前綴查詢。
- **Type hints 規範**：後端全面啟用 mypy strict mode，所有新增函式必須有完整的參數和回傳型別標註。使用 Python 3.12 現代語法（`str | None` 不用 `Optional`，`list[dict]` 不用 `List[Dict]`）。mypy 設定在 `backend/pyproject.toml`，`warn_unused_ignores = false`（因 CI 與本地 stubs 差異）。
- **字串常數集中管理**：report type、status、visibility 等字串常數定義在 `backend/app/constants.py`，不要在程式碼中使用 magic string。
- **`.claude/settings.local.json` 權限格式**：Bash 萬用字元規則必須用空格分隔，不可用冒號。正確：`Bash(git *)`，錯誤：`Bash(git:*)`。使用者可能會請求重新檢查格式，屆時掃描所有 `:*)` 並改為 ` *)`。
