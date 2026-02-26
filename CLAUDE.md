# VTaxon — Vtuber 生物分類系統

## 專案簡介

VTaxon 是一個面向 Vtuber 社群的公開服務，將 Vtuber 角色的形象特徵對應到現實世界的生物分類學體系（界、門、綱、目、科、屬、種），藉此量化角色之間的「親緣相似度」。

## 核心功能

- **物種標註**：頻道主透過 OAuth 登入後，標註自己角色的物種特徵（支援複合種，一個角色可有多個物種特徵）。
- **分類樹瀏覽**：以生物分類階層呈現所有已建檔的角色。
- **親緣檢索**：給定角色 A，找出資料庫中分類學上最接近的角色。

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
| 部署方案 | Flask on Google Cloud Run；前端待定（Vercel / Cloudflare Pages） |

## 技術棧

- **前端**：React + Vite
- **後端**：Python Flask
- **資料庫**：PostgreSQL（Supabase）
- **認證**：Supabase Auth（OAuth → JWT）
- **後端部署**：Google Cloud Run
- **外部 API**：GBIF Species API（生物分類查詢）

## 認證流程

1. **登入**：前端呼叫 Supabase Auth SDK，使用者透過 YouTube / Twitch OAuth 登入，取得 JWT。
2. **API 驗證**：前端在每次 API 請求的 `Authorization: Bearer <JWT>` 標頭帶上 JWT。Flask 後端使用 Supabase JWT secret 在本地驗證簽章，不需要每次回呼 Supabase。
3. **權限檢查**：從 JWT 中取得 `user_id`，查詢 `users` 表的 `role` 欄位判斷權限（`admin` 或 `user`）。

## 資料模型（5 張表）

### users
角色主體。一筆 user = 一個 Vtuber 角色。
- `id` (uuid, PK), `display_name`, `avatar_url`, `role` (admin|user), `created_at`, `updated_at`

### oauth_accounts
平台帳號連結，一個 user 可綁定多個平台。
- `id` (uuid, PK), `user_id` (FK → users), `provider` (youtube|twitch), `provider_account_id` (UNIQUE with provider), `access_token`, `refresh_token`, `token_expires_at`, `created_at`

### species_cache
從 GBIF 拉回的分類資料快取。
- `taxon_id` (int, PK, = GBIF usageKey), `scientific_name`, `common_name_en`, `common_name_zh`, `taxon_rank`, `taxon_path` (Materialized Path, 用 `|` 分隔), `kingdom`, `phylum`, `class`, `order_`, `family`, `genus`, `cached_at`

### fictional_species
奇幻生物獨立分類表，以文化來源為主軸的分類體系。
- `id` (serial, PK), `name`, `origin` (Level 1：東方神話、西方神話...), `sub_origin` (Level 2：日本神話、北歐神話..., nullable), `category_path` (Materialized Path, 用 `|` 分隔), `description`, `created_at`

### vtuber_traits
角色與物種的多對多關聯。一筆 trait 可關聯現實物種或奇幻生物（至少一個）。
- `id` (uuid, PK), `user_id` (FK → users), `taxon_id` (FK → species_cache, nullable), `fictional_species_id` (FK → fictional_species, nullable), `display_name` (使用者看到的名稱，如「龍」), `trait_note`, `created_at`, `updated_at`
- CHECK constraint: `taxon_id IS NOT NULL OR fictional_species_id IS NOT NULL`
- Partial unique index: (user_id, taxon_id) WHERE taxon_id IS NOT NULL
- Partial unique index: (user_id, fictional_species_id) WHERE fictional_species_id IS NOT NULL

## 親緣距離計算

現實物種與奇幻生物的距離**分開計算、分開顯示**：

### 現實物種距離
- 每個現實物種 trait 各自獨立計算，產生一組最近角色排行。
- 距離 = `taxon_path` 的 LCP 共同層數差（總階層數 - 共同前綴層數）。
- 複合種角色（n 個現實 trait）→ 產生 n 組獨立結果，UI 分別顯示。

### 奇幻生物距離
- 每個奇幻生物 trait 各自獨立計算，產生一組最近角色排行。
- 距離 = `category_path` 的 LCP 共同層數差。
- 複合種角色（m 個奇幻 trait）→ 產生 m 組獨立結果，UI 分別顯示。

### 共通規則
- 系統**不在資料層排除**人類 (Homo sapiens)——人類作為有效 trait 可被記錄。
- UI 預設不顯示含人類 trait 的比較結果，但提供選項讓使用者手動啟用。
- 若某 trait 類型在雙方之一不存在，則該類不產生結果。

## 外部 API 參考

- **GBIF Species API**: https://www.gbif.org/developer/species — 生物分類查詢、模糊匹配
- **TaiCOL**: https://taicol.tw/ — 繁體中文名稱與台灣本土物種（備用）
- **TimeTree**: http://timetree.org/ — 演化分歧時間（未來進階用）

## 開發注意事項

- 資料庫選用 Supabase 免費方案，注意儲存空間限制。
- Google Cloud Run 有冷啟動延遲，Flask 應用應盡量縮短啟動時間（精簡 import、延遲載入非必要模組）。
- 奇幻生物使用獨立分類系統（`fictional_species` 表），分類由管理者手動預建。
- `taxon_path` 欄位需要 `varchar_pattern_ops` 索引以支援前綴查詢。
