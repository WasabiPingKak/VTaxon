# VTaxon

將 Vtuber 角色形象特徵對應至生物分類學體系，以分類樹呈現角色間的關聯。

**[vtaxon.com](https://vtaxon.com)**

## 核心概念

VTaxon 將 Vtuber 角色的「形象特徵」用兩套獨立的分類系統來描述：

### 1. 現實生物分類
使用標準的生物分類學（從 GBIF 取得），將角色特徵對應到真實存在的動物。例如：
- 青狐角色 → 紅狐 (*Vulpes vulpes*)

在分類樹中，共同祖先越近的角色會被歸在更接近的位置。例如紅狐和家貓都屬於食肉目。

### 2. 奇幻生物獨立分類系統
為無法對應現實物種的幻想生物（龍、鳳凰、九尾狐等）建立獨立分類體系，以**文化來源**為主軸：

```
東方神話
├── 日本神話 → 九尾狐、河童、天狗...
├── 中國神話 → 麒麟、鳳凰、饕餮...
└── (其他)

西方神話
├── 北歐神話 → Fenrir、Jörmungandr...
├── 希臘神話 → Minotaur、Hydra...
└── (其他)

克蘇魯神話 → Cthulhu、Shoggoth...
奇幻文學 → 寶箱怪、哥布林...
```

同樣以分類路徑的共同前綴來組織。例如九尾狐和河童共同祖先是「日本神話」。

### 3. 結合使用
一個角色可以同時擁有**現實物種 trait** 和**奇幻生物 trait**。**奇幻生物不需要對應現實物種**，兩套系統完全獨立。

複合種（多個 trait）角色會同時出現在多棵分類樹中。

## 使用流程

1. **登入** — 使用 Google（YouTube）/ Twitch OAuth 帳號登入
2. **標註特徵** — 搜尋現實物種和/或選擇奇幻生物來描述角色
3. **瀏覽分類樹** — 查看所有已建檔角色按分類層級組織的樣子

## Tech Stack

| Layer        | Technology                                                          |
| ------------ | ------------------------------------------------------------------- |
| Frontend     | React 18, TypeScript, Vite, D3 (分類樹視覺化)                       |
| Backend      | Python Flask, SQLAlchemy, marshmallow (validation), Flask-Limiter   |
| Database     | PostgreSQL（Supabase，staging / public schema 隔離）                |
| Auth         | Supabase Auth（OAuth → JWT，ES256 JWKS 驗證）                       |
| Hosting      | Google Cloud Run (backend, asia-east1), Firebase Hosting (frontend) |
| Linting      | Ruff (backend), ESLint + TypeScript (frontend)                      |
| Testing      | pytest (backend, 506 tests)                                         |
| CI/CD        | GitHub Actions（deploy-staging.yml, deploy-prod.yml）               |
| External API | GBIF Species API, Wikidata, TaiCOL (中文名稱)                       |

## 架構

```
Browser --> Firebase Hosting (React SPA)
                |
                v
           Cloud Run (Flask API)
                |
                ├──> Supabase PostgreSQL
                ├──> GBIF Species API (生物分類查詢)
                ├──> Wikidata / TaiCOL (中文名稱)
                ├──> Twitch EventSub (直播狀態)
                └──> YouTube PubSubHubbub (直播狀態)
```

- Staging / Production 透過 PostgreSQL schema 隔離（`staging` / `public`）
- SSR：Cloud Run 對 `/vtuber/:id` 路由注入 OGP meta tags，提供社群分享預覽
- JWT 驗證使用 Supabase JWKS（ES256 公鑰），支援 key rotation 自動重試


## 部署架構

| 環境       | Git 分支  | 後端 Cloud Run     | 前端                   |
| ---------- | --------- | ------------------ | ---------------------- |
| Staging    | `develop` | vtaxon-api-staging | vtaxon-staging.web.app |
| Production | `main`    | vtaxon-api-prod    | vtaxon.com             |

push 到對應分支即自動觸發 CI/CD 部署。

## 快速開始

### 前置需求

- [Node.js](https://nodejs.org/) >= 18
- [Python](https://www.python.org/) >= 3.11
- [Firebase CLI](https://firebase.google.com/docs/cli)（前端部署用）
- Supabase 專案（PostgreSQL + Auth）

### 安裝

1. **Clone 專案**

   ```bash
   git clone https://github.com/WasabiPingKak/VTaxon.git
   cd VTaxon
   ```

2. **後端**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env      # 填入環境變數
   ```

3. **前端**

   ```bash
   cd frontend
   npm install
   cp .env.example .env      # 填入 Supabase URL 和 Key
   ```

### 環境變數

完整欄位參考 `backend/.env.example` 和 `frontend/.env.example`，主要分組：

| 分組     | 變數                                                                                    | 說明                                           |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | Supabase 連線與認證                            |
| Database | `DATABASE_URL`                                                                          | PostgreSQL 連線字串                            |
| Twitch   | `TWITCH_CLIENT_ID`                                                                      | Twitch API（頻道資料同步）                     |
| Email    | `RESEND_API_KEY`, `ADMIN_NOTIFY_EMAILS`, `EMAIL_FROM`                                   | Resend 通知信                                  |
| Flask    | `FLASK_ENV`                                                                             | 環境切換（development / staging / production） |
| 前端     | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`                                           | Supabase 前端連線                              |

### 資料庫初始化

```bash
python scripts/init_db.py --target staging    # Staging 環境
python scripts/init_db.py --target prod       # Production 環境
```

### 本地開發

```bash
# 後端（在 backend/ 目錄下）
python run.py

# 前端（在 frontend/ 目錄下）
npm run dev
```

- 後端健康檢查：`curl http://localhost:5000/health`
- 前端：http://localhost:5173

### 測試與 Lint

```bash
# 後端測試
cd backend
pip install pytest
pytest tests -q

# 手動 Lint
cd backend && ruff check .
cd frontend && npm run lint
```

目前後端共 506 個測試案例（行覆蓋率 70%），涵蓋 JWT/JWKS 驗證、權限裝飾器、GBIF 物種搜尋、中文名稱 fallback、OAuth、Webhooks、SSR、外部 API 整合（Twitch/YouTube/Wikidata/TaiCOL）、moderation 等核心邏輯。CI pipeline 會在每次部署前自動執行。

## 前端頁面

| 路由              | 頁面                     | 說明                                 |
| ----------------- | ------------------------ | ------------------------------------ |
| `/`               | HomePage                 | 首頁（分類樹視覺化）                 |
| `/login`          | LoginPage                | Google / Twitch OAuth 登入           |
| `/profile`        | CharacterPage            | 角色檔案（trait 管理、個人資料編輯） |
| `/account`        | → `/profile?tab=account` | 帳號設定（重導）                     |
| `/settings`       | → `/profile`             | 設定頁（重導）                       |
| `/profile/edit`   | → `/profile`             | 編輯頁（重導）                       |
| `/search`         | SearchPage               | GBIF 物種搜尋 + 一鍵新增 trait       |
| `/directory`      | DirectoryPage            | VTuber 目錄（篩選、搜尋）            |
| `/breeds`         | → `/profile?tab=species` | 品種瀏覽（重導）                     |
| `/admin`          | AdminPage                | 管理後台（使用者、檢舉、建議審核）   |
| `/vtuber/:userId` | VTuberProfilePage        | 公開角色個人頁（SSR + SEO）          |
| `/privacy`        | PrivacyPolicyPage        | 隱私權政策                           |
| `/terms`          | TermsOfServicePage       | 服務條款                             |
| `/about`          | AboutPage                | 關於本服務                           |
| `/changelog`      | ChangelogPage            | 更新日誌                             |
| `/notifications`  | NotificationsPage        | 通知中心                             |
| `*`               | NotFoundPage             | 404 頁面                             |

## API 文件

本地開發啟動後，Swagger UI 可在 `/apidocs/` 查看完整端點文件（OpenAPI spec：`/apispec.json`）。

## 專案結構

```
VTaxon/
├── .github/workflows/          # CI/CD（deploy-staging.yml, deploy-prod.yml）
├── backend/
│   ├── app/
│   │   ├── __init__.py         # App factory + blueprint 註冊
│   │   ├── config.py           # 環境設定（dev/staging/prod/test）
│   │   ├── extensions.py       # SQLAlchemy instance
│   │   ├── auth.py             # JWT 驗證（JWKS ES256 + HS256 fallback）
│   │   ├── cache.py            # Redis / in-memory 快取
│   │   ├── limiter.py          # Rate limiting
│   │   ├── models.py           # ORM models
│   │   ├── routes/             # API 路由
│   │   │   ├── admin.py        # 管理後台
│   │   │   ├── auth.py         # 認證
│   │   │   ├── breeds.py       # 品種
│   │   │   ├── directory.py    # VTuber 目錄
│   │   │   ├── fictional.py    # 奇幻生物
│   │   │   ├── livestream.py   # 直播狀態
│   │   │   ├── notifications.py # 通知
│   │   │   ├── oauth.py        # OAuth 帳號管理
│   │   │   ├── reports.py      # 檢舉 & 黑名單
│   │   │   ├── seo.py          # Sitemap
│   │   │   ├── species.py      # 物種搜尋
│   │   │   ├── ssr.py          # SSR（OGP meta injection）
│   │   │   ├── subscriptions.py # 直播訂閱管理（cron + admin）
│   │   │   ├── taxonomy.py     # 分類樹
│   │   │   ├── traits.py       # Trait 標註
│   │   │   ├── users.py        # 使用者
│   │   │   └── webhooks.py     # Twitch / YouTube webhook
│   │   └── services/           # 業務邏輯
│   │       ├── chinese_names.py # 中文名稱整合查詢
│   │       ├── email.py        # Resend email 通知
│   │       ├── gbif.py         # GBIF Species API
│   │       ├── http_client.py  # 共用 HTTP client
│   │       ├── notifications.py # 通知邏輯
│   │       ├── species_cache.py # 物種快取
│   │       ├── taicol.py       # TaiCOL 中文名稱
│   │       ├── taxonomy_zh.py  # 分類階層中文翻譯
│   │       ├── twitch.py       # Twitch API
│   │       ├── wikidata.py     # Wikidata 查詢
│   │       └── youtube_pubsub.py # YouTube PubSubHubbub
│   ├── seeds/                  # 種子資料（fictional_species, breeds）
│   ├── tests/                  # pytest 測試（506 cases）
│   ├── Dockerfile              # Cloud Run 部署用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/                # Supabase client、API wrapper、AuthContext、ToastContext
│   │   ├── components/         # 共用元件
│   │   │   ├── graph/          # 分類樹視覺化（Canvas、FilterPanel、FocusHUD）
│   │   │   ├── settings/       # 帳號設定子元件
│   │   │   └── directory/      # 目錄篩選 & 卡片元件
│   │   ├── hooks/              # 自訂 Hooks（useTreeLayout, useGraphInteraction, useLiveStatus 等）
│   │   ├── types/              # TypeScript 型別定義
│   │   └── pages/              # 13 個頁面
│   ├── scripts/prerender.mjs   # SEO 預渲染腳本
│   └── vite.config.js          # dev proxy → localhost:5000
├── scripts/
│   ├── init_db.py              # DB 初始化腳本（staging / prod）
│   ├── backup_db.sh            # 資料庫備份
│   ├── inject_seeds.sh         # 種子資料注入
│   ├── fetch_breeds_wikidata.py # 品種資料抓取
│   ├── backfill_alternative_names.py  # 別名回填
│   ├── fix_subspecies_paths.py        # 亞種路徑修正
│   ├── rebuild-twitch-subs.sh         # 重建 Twitch 訂閱
│   └── rebuild-youtube-subs.sh        # 重建 YouTube 訂閱
├── supabase/
│   ├── init.sql                # 完整 DB schema（public）
│   ├── init_staging.sql        # Staging schema
│   └── migrations/             # 增量 DB migration 腳本
├── docs/
│   ├── changelogs/             # 版本更新日誌
│   ├── chinese-names-strategy.md  # 中文名稱解析策略
│   ├── er-diagram.mermaid         # ER 圖
│   ├── fictional-species-reorganization.md  # 奇幻生物分類重整
│   ├── fictional_species_tree.md  # 奇幻生物分類樹設計
│   └── ux-redesign-species-traits.md  # 物種標註 UX 重設計
├── firebase.json               # Firebase Hosting 設定
└── CLAUDE.md                   # 專案規格書
```

