# VTaxon MVP 開發進度

> 最後更新：2026-03-04

## 已完成的階段

### Phase 1：後端基礎建設 ✅

| 項目 | 檔案 | 說明 |
|------|------|------|
| 環境變數 | `backend/.env.example` | Supabase URL/Key/JWT Secret + DB URL |
| Config | `backend/app/config.py` | 環境設定（dev/staging/prod/test），含 DB_SCHEMA 支援 |
| ORM Models | `backend/app/models.py` | 10 張表的 SQLAlchemy model |
| JWT 驗證 | `backend/app/auth.py` | `login_required` 裝飾器（JWKS ES256 驗證 + HS256 fallback）、`admin_required` 裝飾器 |
| App Factory | `backend/app/__init__.py` | 整合 CORS、Blueprint 註冊、`/health` + `/api/health` |
| 依賴 | `backend/requirements.txt` | flask-cors, PyJWT, cryptography, requests, opencc 等 |

### Phase 2：使用者 API ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/auth/callback` | POST | Supabase OAuth 完成後建立/更新使用者 |
| `/api/users/me` | GET | 取得當前登入者資料 |
| `/api/users/me` | PATCH | 更新個人資料（display_name, avatar_url, bio, country_flags, social_links 等） |
| `/api/users/<id>` | GET | 公開查看任一角色 |
| `/api/users/directory` | GET | VTuber 目錄列表（含篩選、facets） |
| `/api/users/me/oauth-accounts` | GET | 列出已綁定 OAuth 帳號 |
| `/api/users/me/oauth-accounts/sync` | POST | 同步 Supabase identities |
| `/api/users/me/oauth-accounts/<id>/refresh` | POST | 重新整理 OAuth token |
| `/api/users/me/oauth-accounts/<id>` | PATCH/DELETE | 更新/解除 OAuth 帳號 |

**檔案**：`backend/app/routes/auth.py`, `backend/app/routes/users.py`

### Phase 3：GBIF 物種查詢 + 快取 ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/species/search?q=` | GET | 模糊搜尋物種（呼叫 GBIF suggest API） |
| `/api/species/search/stream?q=` | GET | NDJSON 串流搜尋（逐筆回傳 + 即時中文名enrichment） |
| `/api/species/match?q=` | GET | 精確匹配物種名稱（GBIF match API） |
| `/api/species/<taxon_id>` | GET | 取得單一物種（先查快取，miss 再查 GBIF） |
| `/api/species/<taxon_id>/children` | GET | 亞種查詢 |
| `/api/species/<taxon_id>/children/stream` | GET | NDJSON 串流亞種查詢 |
| `/api/species/cache/clear` | POST | 清除中文名快取（Admin） |

- GBIF client 自動組裝 `taxon_path`（`Animalia|Chordata|Mammalia|...`）
- 中文名三層 fallback：Wikidata（P846 → zh-tw label）→ TaiCOL → 靜態表（taxonomy_zh.py）
- 查詢結果自動快取到 `species_cache` 表

**檔案**：`backend/app/services/gbif.py`, `backend/app/services/wikidata.py`, `backend/app/services/taicol.py`, `backend/app/services/taxonomy_zh.py`, `backend/app/routes/species.py`

### Phase 4：Trait 標註 API ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/traits` | POST | 新增 trait（需登入，支援現實物種 & 奇幻生物） |
| `/api/traits?user_id=xxx` | GET | 查詢某角色的所有 trait |
| `/api/traits/<id>` | PATCH | 更新 trait（breed_id, breed_name, trait_note） |
| `/api/traits/<id>` | DELETE | 刪除自己的 trait（需登入 + 權限檢查） |

- 重複標註同一物種會回傳 409 Conflict

**檔案**：`backend/app/routes/traits.py`

### Phase 5：親緣距離計算（已移除）

> 此功能已於 2026-03-02 移除。相關檔案（`kinship.py` route/service、`KinshipPage.jsx`）已刪除。

### Phase 6：前端建設 ✅

| 頁面 | 檔案 | 說明 |
|------|------|------|
| Supabase Auth | `src/lib/supabase.js`, `src/lib/AuthContext.jsx` | Google / Twitch OAuth 登入，JWT session 管理 |
| API Client | `src/lib/api.js` | 自動帶 JWT 的 fetch wrapper，含 NDJSON 串流支援 |
| Navbar | `src/components/Navbar.jsx` | 導覽列（登入/登出狀態、頭像） |
| 首頁 | `src/pages/HomePage.jsx` | 歡迎頁面 + CTA |
| 登入頁 | `src/pages/LoginPage.jsx` | Google / Twitch 登入按鈕 |
| 角色檔案 | `src/pages/CharacterPage.jsx` | trait 管理、個人資料編輯（含 bio、社群連結、影片嵌入） |
| 帳號設定 | `src/pages/AccountPage.jsx` | OAuth 帳號管理（綁定/解綁/重新整理） |
| 物種搜尋 | `src/pages/SearchPage.jsx`, `src/components/SpeciesSearch.jsx` | GBIF 物種搜尋 + 一鍵新增 trait |
| VTuber 目錄 | `src/pages/DirectoryPage.jsx` | 角色列表（篩選、搜尋、分頁） |
| 品種瀏覽 | `src/pages/BreedsPage.jsx` | 品種分類瀏覽 + 搜尋 |
| 管理後台 | `src/pages/AdminPage.jsx` | 使用者管理、檢舉處理、建議審核 |
| 公開角色頁 | `src/pages/VTuberProfilePage.jsx` | SEO 友善的公開角色個人頁 |
| 隱私權政策 | `src/pages/PrivacyPolicyPage.jsx` | 中英文隱私權政策 |
| 服務條款 | `src/pages/TermsOfServicePage.jsx` | 中英文服務條款 |
| 關於 | `src/pages/AboutPage.jsx` | 關於本服務 |

### Phase 7：部署 ✅

| 項目 | 檔案 | 說明 |
|------|------|------|
| Dockerfile | `backend/Dockerfile` | Python 3.12 slim + gunicorn，port 8080 |
| CI/CD Staging | `.github/workflows/deploy-staging.yml` | develop push → Cloud Run + Firebase Hosting |
| CI/CD Prod | `.github/workflows/deploy-prod.yml` | main push → Cloud Run + Firebase Hosting |
| Firebase 設定 | `firebase.json`, `.firebaserc` | prod + staging 兩個 hosting target |
| DB 初始化 | `scripts/init_db.py` | 支援 `--target staging/prod`、`--schema-only`、`--seed-only` |
| Staging Schema | `supabase/init_staging.sql` | staging schema 所有表 |
| DB Schema | `supabase/init.sql` | 完整建表 SQL（含 RLS、索引、觸發器） |
| 奇幻生物種子 | `backend/seeds/fictional_species*.sql` | 107+ 筆奇幻生物（東方、西方、埃及、台灣、現代虛構等） |
| 品種種子 | `backend/seeds/breeds.sql` | 犬貓馬兔天竺鼠品種（由 Wikidata 抓取） |

### Phase 8：進階功能 ✅

| 項目 | 說明 |
|------|------|
| 奇幻生物 API | CRUD + 建議審核（`/api/fictional-species`） |
| 品種 API | 查詢、搜尋、建議審核（`/api/breeds`） |
| 分類樹 API | 現實物種 + 奇幻生物分類樹（`/api/taxonomy/tree`, `/api/taxonomy/fictional-tree`） |
| 檢舉系統 | 檢舉、審核、封禁、黑名單（`/api/reports`） |
| SEO | sitemap.xml、meta tags（react-helmet-async）、公開角色頁 |
| 中文名三層 fallback | Wikidata → TaiCOL → 靜態表，含串流 NDJSON 即時回傳 |
| 品種資料抓取 | `scripts/fetch_breeds_wikidata.py`（Wikidata SPARQL → zh-tw Wikipedia 轉換） |
| 全站中文化 | 所有 UI 文字為繁體中文 |

---

## 目前狀態

- **Staging** 和 **Production** 環境皆已部署並運行
- Staging：https://vtaxon-staging.web.app
- Production：https://vtaxon.web.app
- Google OAuth 驗證申請進行中

## 專案結構

```
VTaxon/
├── .github/workflows/          # CI/CD
│   ├── deploy-staging.yml      # develop → staging
│   └── deploy-prod.yml         # main → production
├── backend/
│   ├── app/
│   │   ├── __init__.py         # App factory
│   │   ├── config.py           # 環境設定
│   │   ├── extensions.py       # SQLAlchemy
│   │   ├── auth.py             # JWT 驗證
│   │   ├── models.py           # ORM models
│   │   ├── routes/             # auth, users, species, traits, fictional, taxonomy, breeds, reports, seo
│   │   └── services/           # gbif, wikidata, taicol, taxonomy_zh
│   ├── seeds/                  # SQL 種子資料
│   ├── Dockerfile
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── lib/                # supabase, api, AuthContext, ToastContext, countries
│   │   ├── components/         # Navbar, SpeciesSearch, ChannelCard, CountryPicker 等
│   │   ├── pages/              # 12 個頁面
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── scripts/
│   ├── init_db.py              # DB 初始化
│   └── fetch_breeds_wikidata.py
├── supabase/
│   ├── init.sql                # DB schema (public)
│   └── init_staging.sql        # DB schema (staging)
├── docs/
│   └── chinese-names-strategy.md
├── firebase.json
├── CLAUDE.md
└── PROGRESS.md
```
