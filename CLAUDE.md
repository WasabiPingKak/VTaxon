# VTaxon — 開發指引

本檔案是給 Claude Code 的開發規則與 repo 導覽。專案介紹請見 `README.md`，架構決策請見 `docs/adr/`。

## Repo 結構

```
VTaxon/
├── .github/workflows/          # CI/CD（CI / Deploy Staging, Deploy Production）
├── backend/
│   ├── app/
│   │   ├── __init__.py         # App factory + blueprint 註冊
│   │   ├── config.py           # 環境設定（dev/staging/prod/test）
│   │   ├── extensions.py       # SQLAlchemy instance
│   │   ├── auth.py             # JWT 驗證（JWKS ES256 + HS256 fallback）
│   │   ├── cache.py            # Redis / in-memory 快取
│   │   ├── constants.py        # 字串常數（status、visibility 等）
│   │   ├── limiter.py          # Rate limiting
│   │   ├── models.py           # ORM models（15 張表）
│   │   ├── routes/             # API 路由（按功能拆分）
│   │   ├── services/           # 業務邏輯（按功能拆分）
│   │   └── utils/              # 工具模組（KMS、Cloud Tasks、加密欄位）
│   ├── seeds/                  # 種子資料（fictional_species, breeds）
│   ├── tests/                  # pytest 測試
│   ├── Dockerfile              # Cloud Run 部署用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/                # Supabase client、API wrapper、AuthContext、ToastContext
│   │   ├── components/         # 共用元件（graph/、settings/、directory/）
│   │   ├── hooks/              # 自訂 Hooks
│   │   ├── types/              # TypeScript 型別定義
│   │   └── pages/              # 頁面元件
│   ├── scripts/prerender.mjs   # SEO 預渲染腳本
│   └── vite.config.js          # dev proxy → localhost:5000
├── scripts/                    # 維運腳本（DB init、backup、seeds、訂閱重建）
├── supabase/
│   ├── init.sql                # 完整 DB schema（public）
│   ├── init_staging.sql        # Staging schema
│   └── migrations/             # 增量 DB migration 腳本
├── docs/
│   ├── adr/                    # 架構決策紀錄（9 份）
│   ├── changelogs/             # 版本更新日誌
│   └── claude-skills/          # Claude Code 自訂 skill 定義
└── firebase.json               # Firebase Hosting 設定
```

## 前端路由

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

## 資料模型導覽

15 張表，完整 schema 見 `backend/app/models.py` 或 `supabase/init.sql`。

| 表 | 用途 |
|----|------|
| `users` | 角色主體（1 user = 1 Vtuber） |
| `oauth_accounts` | 平台帳號連結（YouTube / Twitch） |
| `auth_id_aliases` | 跨 email OAuth 別名映射 |
| `vtuber_traits` | 角色 ↔ 物種多對多關聯（核心表） |
| `species_cache` | GBIF 分類資料快取（Materialized Path） |
| `breeds` | 品種（物種的子層級） |
| `fictional_species` | 奇幻生物獨立分類（Materialized Path） |
| `live_streams` | 直播狀態記錄 |
| `notifications` | 站內通知 |
| `fictional_species_requests` | 使用者建議新增奇幻生物 |
| `breed_requests` | 使用者建議新增品種 |
| `species_name_reports` | 物種名稱錯誤回報 |
| `user_reports` | 使用者檢舉 |
| `blacklist` | 黑名單 |
| `admin_alert_events` | 系統告警事件 |

關鍵關聯：`users` ←1:N→ `vtuber_traits` ←N:1→ `species_cache` 或 `fictional_species`

## 技術棧（影響開發行為的部分）

- **後端**：Python 3.12 Flask + SQLAlchemy，mypy strict mode
- **前端**：React + Vite + TypeScript，tsc 型別檢查
- **Linting**：Ruff（後端）、ESLint（前端）
- **測試**：pytest（後端）、Vitest（前端）
- **資料庫**：PostgreSQL（Supabase），staging/public schema 隔離
- **認證**：Supabase Auth（JWT，ES256 JWKS 驗證）

## 開發指令

```bash
# 後端測試
cd backend && pytest tests -x -q

# 後端 lint
cd backend && ruff check .
cd backend && ruff format --check .

# 後端型別檢查
cd backend && mypy app

# 前端 lint
cd frontend && npm run lint

# 前端型別檢查
cd frontend && npx tsc --noEmit
```

## Coding Conventions

### Type Hints（後端）

- mypy strict mode，所有函式必須有完整的參數和回傳型別標註
- 使用 Python 3.12 現代語法：`str | None`（不用 `Optional`）、`list[dict]`（不用 `List[Dict]`）
- mypy 設定在 `backend/pyproject.toml`，`warn_unused_ignores = false`（CI 與本地 stubs 差異）

### 字串常數

report type、status、visibility 等字串常數定義在 `backend/app/constants.py`，禁止在程式碼中使用 magic string。

### Commit Message

使用 `type: 描述` 格式，中文描述。常見 type：`feat`、`fix`、`refactor`、`test`、`docs`、`chore`。

## 禁止事項

- **不要猜測 bug 原因**：讀 error log、追蹤 code path，假設被推翻就換方向
- **不要在主 worktree 開 feature branch**：必須用 `EnterWorktree`（見全域 `~/.claude/CLAUDE.md`）
- **不要直接在 `develop` 上 commit 程式碼**：程式碼修改走 feature branch → merge

## DB Schema 變更規則

- 任何 ALTER TABLE / CREATE TABLE 都必須在 `supabase/migrations/` 建立 migration 腳本
- SQL 中要分別寫 `staging.table_name` 和 `public.table_name` 兩段
- 修改 `supabase/init.sql` 只影響全新建庫，不會自動 migrate 已上線的 DB

## 效能注意事項

- Supabase 免費方案，注意儲存空間限制
- Cloud Run 冷啟動延遲：精簡 import、延遲載入非必要模組
- `taxon_path` 欄位需要 `varchar_pattern_ops` 索引以支援前綴查詢

## Claude Code 設定

- **Bash 權限萬用字元格式**：`Bash(git *)` 用空格分隔，不可用冒號 `Bash(git:*)`
