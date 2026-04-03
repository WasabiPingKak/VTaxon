# VTaxon

[![Deploy Staging](https://img.shields.io/github/actions/workflow/status/WasabiPingKak/VTaxon/deploy-staging.yml?branch=develop&label=staging)](https://github.com/WasabiPingKak/VTaxon/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://img.shields.io/github/actions/workflow/status/WasabiPingKak/VTaxon/deploy-prod.yml?branch=main&label=production)](https://github.com/WasabiPingKak/VTaxon/actions/workflows/deploy-prod.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/WasabiPingKak/a1472baf67f4ff32a86fb429a4d668d8/raw/vtaxon-coverage.json)](https://github.com/WasabiPingKak/VTaxon/actions/workflows/deploy-staging.yml)

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
| Backend      | Python Flask, SQLAlchemy, Pydantic v2 (validation), Flask-Limiter  |
| Database     | PostgreSQL（Supabase，staging / public schema 隔離）                |
| Auth         | Supabase Auth（OAuth → JWT，ES256 JWKS 驗證）                       |
| Hosting      | Google Cloud Run (backend, asia-east1), Firebase Hosting (frontend) |
| Linting      | Ruff (backend), ESLint + TypeScript (frontend)                      |
| Testing      | pytest (backend)                                                     |
| CI/CD        | GitHub Actions（CI / Deploy Staging, Deploy Production）             |
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
- [Python](https://www.python.org/) >= 3.12
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

測試涵蓋 JWT/JWKS 驗證、權限裝飾器、GBIF 物種搜尋、中文名稱 fallback、OAuth、Webhooks、SSR、外部 API 整合（Twitch/YouTube/Wikidata/TaiCOL）、moderation 等核心邏輯。CI pipeline 會在每次部署前自動執行，覆蓋率見上方 badge。

## API 文件

本地開發啟動後，Swagger UI 可在 `/apidocs/` 查看完整端點文件（OpenAPI spec：`/apispec.json`）。

