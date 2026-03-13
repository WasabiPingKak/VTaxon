# VTaxon

將 Vtuber 角色形象特徵對應至生物分類學體系，以分類樹呈現角色間的關聯。

🌐 **https://vtaxon.com**

## 核心概念

VTaxon 將 Vtuber 角色的「形象特徵」用兩套獨立的分類系統來描述：

### 1. **現實生物分類**
使用標準的生物分類學（從 GBIF 取得），將角色特徵對應到真實存在的動物。例如：
- 青狐角色 → 紅狐 (*Vulpes vulpes*)

在分類樹中，共同祖先越近的角色會被歸在更接近的位置。例如紅狐和家貓都屬於食肉目。

### 2. **奇幻生物獨立分類系統**
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

### 3. **結合使用**
一個角色可以同時擁有**現實物種 trait** 和**奇幻生物 trait**。**奇幻生物不需要對應現實物種**，兩套系統完全獨立。

複合種（多個 trait）角色會同時出現在多棵分類樹中。

## 使用流程

1. **登入** — 使用 Google（YouTube）/ Twitch OAuth 帳號登入
2. **標註特徵** — 搜尋現實物種和/或選擇奇幻生物來描述角色
3. **瀏覽分類樹** — 查看所有已建檔角色按分類層級組織的樣子

## 技術棧

- **前端**：React + Vite
- **後端**：Python Flask
- **資料庫**：PostgreSQL（Supabase）
- **認證**：Supabase Auth（OAuth → JWT）
- **後端部署**：Google Cloud Run（asia-east1）
- **前端部署**：Firebase Hosting
- **CI/CD**：GitHub Actions
- **直播偵測**：Twitch EventSub、YouTube PubSubHubbub (WebSub)
- **外部 API**：GBIF Species API、Wikidata、TaiCOL

## 部署架構

| 環境 | Git 分支 | 後端 | 前端 |
|------|---------|------|------|
| Staging | `develop` | vtaxon-api-staging | vtaxon-staging.web.app |
| Production | `main` | vtaxon-api-prod | vtaxon.com |

push 到對應分支即自動觸發 CI/CD 部署。

## 開發環境啟動

### 資料庫初始化

```bash
# 使用 Python 腳本初始化（需要 psycopg2）
python scripts/init_db.py --target staging    # Staging 環境
python scripts/init_db.py --target prod       # Production 環境
```

### 後端（Flask）

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # 填入 Supabase 憑證與 DATABASE_URL
python run.py
```

健康檢查：`curl http://localhost:5000/health`

### 前端（React + Vite）

```bash
cd frontend
npm install
cp .env.example .env    # 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
npm run dev
```

開啟瀏覽器至 http://localhost:5173

## 前端頁面

| 路由 | 頁面 | 說明 |
|------|------|------|
| `/` | HomePage | 首頁（分類樹視覺化） |
| `/login` | LoginPage | Google / Twitch OAuth 登入 |
| `/profile` | CharacterPage | 角色檔案（trait 管理、個人資料編輯） |
| `/account` | → `/profile?tab=account` | 帳號設定（重導） |
| `/settings` | → `/profile` | 設定頁（重導） |
| `/profile/edit` | → `/profile` | 編輯頁（重導） |
| `/search` | SearchPage | GBIF 物種搜尋 + 一鍵新增 trait |
| `/directory` | DirectoryPage | VTuber 目錄（篩選、搜尋） |
| `/breeds` | → `/profile?tab=species` | 品種瀏覽（重導） |
| `/stats` | StatsPage | 公開統計數據 |
| `/admin` | AdminPage | 管理後台（使用者、檢舉、建議審核） |
| `/vtuber/:userId` | VTuberProfilePage | 公開角色個人頁（SEO） |
| `/privacy` | PrivacyPolicyPage | 隱私權政策 |
| `/terms` | TermsOfServicePage | 服務條款 |
| `/about` | AboutPage | 關於本服務 |
| `/changelog` | ChangelogPage | 更新日誌 |
| `/notifications` | NotificationsPage | 通知中心 |
| `*` | NotFoundPage | 404 頁面 |

## API 端點

### 健康檢查 & SEO

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/health` | — | 健康檢查 + DB 連線狀態 |
| GET | `/api/health` | — | 健康檢查（別名） |
| GET | `/api/sitemap.xml` | — | XML Sitemap |

### 認證 & 使用者

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/api/auth/callback` | JWT | OAuth 完成後建立/更新使用者 |
| POST | `/api/auth/link-token` | JWT | 跨 email OAuth 帳號綁定 token |
| GET | `/api/users/recent` | — | 取得最近新增的使用者 |
| GET | `/api/users/me` | JWT | 取得當前登入者資料 |
| PATCH | `/api/users/me` | JWT | 更新個人資料 |
| GET | `/api/users/<id>` | — | 公開查看角色資料 |
| GET | `/api/users/directory` | — | VTuber 目錄列表（含篩選與 facets） |
| GET | `/api/users/me/oauth-accounts` | JWT | 列出已綁定的 OAuth 帳號 |
| POST | `/api/users/me/oauth-accounts/sync` | JWT | 同步 OAuth 帳號 |
| POST | `/api/users/me/oauth-accounts/<id>/refresh` | JWT | 重新整理 OAuth token |
| PATCH | `/api/users/me/oauth-accounts/<id>` | JWT | 更新 OAuth 帳號設定 |
| DELETE | `/api/users/me/oauth-accounts/<id>` | JWT | 解除 OAuth 帳號綁定 |

### 物種

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/species/search?q=` | — | GBIF 物種搜尋 |
| GET | `/api/species/search/stream?q=` | — | NDJSON 串流物種搜尋 |
| GET | `/api/species/match?q=` | — | 精確匹配物種名稱 |
| GET | `/api/species/<taxon_id>` | — | 取得單一物種 |
| GET | `/api/species/<taxon_id>/children` | — | 亞種查詢 |
| GET | `/api/species/<taxon_id>/children/stream` | — | NDJSON 串流亞種查詢 |
| POST | `/api/species/cache/clear` | Admin | 清除中文名快取 |
| POST | `/api/species/name-reports` | JWT | 提交物種名稱檢舉 |
| GET | `/api/species/name-reports` | Admin | 列出物種名稱檢舉 |
| PATCH | `/api/species/name-reports/<id>` | Admin | 處理物種名稱檢舉 |

### Trait 標註

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/api/traits` | JWT | 新增 trait |
| GET | `/api/traits?user_id=` | — | 查詢角色 traits |
| PATCH | `/api/traits/<id>` | JWT | 更新 trait |
| DELETE | `/api/traits/<id>` | JWT | 刪除 trait |

### 奇幻生物

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/fictional-species` | — | 列出奇幻生物 |
| POST | `/api/fictional-species/requests` | JWT | 建議新增奇幻生物 |
| GET | `/api/fictional-species/requests` | Admin | 列出建議清單 |
| PATCH | `/api/fictional-species/requests/<id>` | Admin | 審核建議 |

### 分類樹

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/taxonomy/tree` | — | 現實物種分類樹 |
| GET | `/api/taxonomy/fictional-tree` | — | 奇幻生物分類樹 |
| DELETE | `/api/taxonomy/cache` | Admin | 清除分類樹快取 |

### 品種

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/breeds/categories` | — | 有品種的物種列表 |
| GET | `/api/breeds?taxon_id=` | — | 查詢物種品種 |
| GET | `/api/breeds/search?q=` | — | 搜尋品種 |
| POST | `/api/breeds` | Admin | 新增品種 |
| POST | `/api/breeds/requests` | JWT | 建議新增品種 |
| GET | `/api/breeds/requests` | Admin | 列出品種建議 |
| PATCH | `/api/breeds/requests/<id>` | Admin | 審核品種建議 |

### 通知

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/notifications` | JWT | 取得通知列表 |
| GET | `/api/notifications/grouped` | JWT | 取得分組通知 |
| GET | `/api/notifications/unread-count` | JWT | 未讀通知數量 |
| POST | `/api/notifications/read` | JWT | 標記通知為已讀 |

### 統計

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/stats/overview` | — | 公開統計數據（使用者數、物種數等） |

### 直播

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/live-status` | — | 取得目前正在直播的使用者 |
| POST | `/api/webhooks/twitch` | — | Twitch EventSub webhook 回呼 |
| GET | `/api/webhooks/youtube` | — | YouTube PubSubHubbub 訂閱驗證 |
| POST | `/api/webhooks/youtube` | — | YouTube PubSubHubbub 推播通知 |
| POST | `/api/livestream/youtube-check-offline` | Cron | 檢查 YouTube 直播是否已結束 |
| POST | `/api/livestream/youtube-renew-subs` | Cron | 續訂 YouTube WebSub 訂閱 |
| GET | `/api/livestream/twitch-subs` | Admin | 列出 Twitch EventSub 訂閱 |
| POST | `/api/livestream/rebuild-twitch-subs` | Admin | 重建 Twitch EventSub 訂閱 |
| GET | `/api/livestream/youtube-subs` | Admin | 列出 YouTube WebSub 帳號 |
| POST | `/api/livestream/rebuild-youtube-subs` | Admin | 重建 YouTube WebSub 訂閱 |

### 管理後台

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/api/admin/request-counts` | Admin | 待處理建議數量統計 |
| GET | `/api/admin/export-fictional` | Admin | 匯出奇幻生物資料 |
| GET | `/api/admin/export-breeds` | Admin | 匯出品種資料 |
| POST | `/api/admin/transition-fictional` | Admin | 奇幻生物建議狀態轉換 |
| POST | `/api/admin/transition-breeds` | Admin | 品種建議狀態轉換 |

### 檢舉 & 黑名單

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| POST | `/api/reports` | — | 提交檢舉 |
| GET | `/api/reports` | Admin | 列出檢舉 |
| PATCH | `/api/reports/<id>` | Admin | 處理檢舉 |
| GET | `/api/reports/<id>/blacklist-preview` | Admin | 預覽封禁資訊 |
| POST | `/api/reports/<id>/ban` | Admin | 封禁使用者 |
| GET | `/api/reports/blacklist` | Admin | 黑名單列表 |
| DELETE | `/api/reports/blacklist/<id>` | Admin | 移除黑名單 |

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
│   │   ├── routes/             # API 路由（auth, users, species, traits, fictional, taxonomy, breeds, reports, notifications, admin, stats, livestream, seo）
│   │   └── services/           # 業務邏輯（gbif, wikidata, taicol, taxonomy_zh, notifications, email, twitch, youtube_pubsub）
│   ├── seeds/                  # 種子資料（fictional_species, breeds）
│   ├── Dockerfile              # Cloud Run 部署用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/                # Supabase client、API wrapper、AuthContext、ToastContext
│   │   ├── components/         # 共用元件
│   │   │   ├── graph/          # 分類樹視覺化（Canvas、FilterPanel、FocusHUD）
│   │   │   ├── settings/       # 帳號設定子元件（Profile、Accounts、Species、Fictional、SnsLinks）
│   │   │   ├── stats/          # 統計圖表元件（DonutChart、GrowthChart、Treemap）
│   │   │   └── directory/      # 目錄篩選 & 卡片元件
│   │   ├── hooks/              # 自訂 Hooks（useTreeLayout, useGraphInteraction, useLiveStatus, useIsMobile 等）
│   │   └── pages/              # 14 個頁面
│   ├── scripts/prerender.mjs   # SEO 預渲染腳本
│   └── vite.config.js          # dev proxy → localhost:5000
├── scripts/
│   ├── init_db.py              # DB 初始化腳本（staging / prod）
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
│   ├── stats-page-design.md       # 統計頁設計
│   └── ux-redesign-species-traits.md  # 物種標註 UX 重設計
├── firebase.json               # Firebase Hosting 設定
└── CLAUDE.md                   # 專案規格書
```

## 文件

- [中文名稱策略](docs/chinese-names-strategy.md)
- [ER Diagram](docs/er-diagram.mermaid)
- [統計頁設計](docs/stats-page-design.md)
- [物種標註 UX 重設計](docs/ux-redesign-species-traits.md)
