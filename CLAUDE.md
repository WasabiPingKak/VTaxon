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
| 幻想物種 | 使用者自選現實物種作為 proxy（例：龍 → 科摩多巨蜥） |
| 角色粒度 | 一個頻道 = 一個角色 |
| 權限 | 頻道主編輯自己的資料 + 管理者（admin）全域權限 |
| 複合種 | 只記錄包含哪些物種，不記錄比例，所有 trait 等權 |

## 技術棧

- **前端**：React
- **後端**：Python Flask
- **資料庫**：PostgreSQL（Supabase 或 Neon 免費方案）
- **外部 API**：GBIF Species API（生物分類查詢）

## 資料模型（4 張表）

### users
角色主體。一筆 user = 一個 Vtuber 角色。
- `id` (uuid, PK), `display_name`, `avatar_url`, `role` (admin|user), `created_at`, `updated_at`

### oauth_accounts
平台帳號連結，一個 user 可綁定多個平台。
- `id` (uuid, PK), `user_id` (FK → users), `provider` (youtube|twitch), `provider_account_id` (UNIQUE with provider), `access_token`, `refresh_token`, `token_expires_at`, `created_at`

### species_cache
從 GBIF 拉回的分類資料快取。
- `taxon_id` (int, PK, = GBIF usageKey), `scientific_name`, `common_name_en`, `common_name_zh`, `taxon_rank`, `taxon_path` (Materialized Path, 用 `|` 分隔), `kingdom`, `phylum`, `class`, `order_`, `family`, `genus`, `cached_at`

### vtuber_traits
角色與物種的多對多關聯。
- `id` (uuid, PK), `user_id` (FK → users), `taxon_id` (FK → species_cache), `display_name` (使用者看到的名稱，如「龍」), `trait_note`, `created_at`, `updated_at`
- UNIQUE constraint: (user_id, taxon_id)

## 親緣距離計算

- 單一物種：比較兩者 `taxon_path` 的最長共同前綴（Longest Common Prefix），距離 = 總階層數 - 共同階層數。
- 複合種：所有 trait 配對的距離取平均。`distance(A, B) = (1 / (n * m)) * Σ Σ taxon_distance(a, b)`
- 系統排除人類 (Homo sapiens)，僅記錄動物或幻想物種特徵。

## 外部 API 參考

- **GBIF Species API**: https://www.gbif.org/developer/species — 生物分類查詢、模糊匹配
- **TaiCOL**: https://taicol.tw/ — 繁體中文名稱與台灣本土物種（備用）
- **TimeTree**: http://timetree.org/ — 演化分歧時間（未來進階用）

## 開發注意事項

- 資料庫選用免費方案（Supabase / Neon），注意儲存空間限制。
- 幻想物種目前用 proxy species 做法，資料表結構已預留未來擴充空間（可加 `is_fictional` 欄位）。
- `taxon_path` 欄位需要 `varchar_pattern_ops` 索引以支援前綴查詢。
