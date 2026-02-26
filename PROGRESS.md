# VTaxon MVP 開發進度

> 最後更新：2026-02-26

## 已完成的階段

### Phase 1：後端基礎建設 ✅

| 項目 | 檔案 | 說明 |
|------|------|------|
| 環境變數 | `backend/.env.example` | Supabase URL/Key/JWT Secret + DB URL |
| Config | `backend/app/config.py` | 讀取所有 Supabase 相關環境變數 |
| ORM Models | `backend/app/models.py` | 5 張表的 SQLAlchemy model（User, OAuthAccount, SpeciesCache, FictionalSpecies, VtuberTrait），含 `to_dict()` 序列化 |
| JWT 驗證 | `backend/app/auth.py` | `login_required` 裝飾器（驗 Supabase HS256 JWT）、`admin_required` 裝飾器 |
| App Factory | `backend/app/__init__.py` | 整合 CORS、Blueprint 註冊、`/health` 含 DB 連線檢查 |
| 依賴 | `backend/requirements.txt` | 新增 flask-cors, PyJWT, cryptography, requests |

### Phase 2：使用者 API ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/auth/callback` | POST | Supabase OAuth 完成後建立/更新使用者 |
| `/api/users/me` | GET | 取得當前登入者資料 |
| `/api/users/me` | PATCH | 更新 display_name / avatar_url |
| `/api/users/<id>` | GET | 公開查看任一角色 |

**檔案**：`backend/app/routes/auth.py`, `backend/app/routes/users.py`

### Phase 3：GBIF 物種查詢 + 快取 ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/species/search?q=cat` | GET | 模糊搜尋物種（呼叫 GBIF API） |
| `/api/species/<taxon_id>` | GET | 取得單一物種（先查快取，miss 再查 GBIF） |

- GBIF client 自動組裝 `taxon_path`（`Animalia|Chordata|Mammalia|...`）
- 查詢結果自動快取到 `species_cache` 表

**檔案**：`backend/app/services/gbif.py`, `backend/app/routes/species.py`

### Phase 4：Trait 標註 API ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/traits` | POST | 新增 trait（需登入，支援現實物種 & 奇幻生物） |
| `/api/traits?user_id=xxx` | GET | 查詢某角色的所有 trait |
| `/api/traits/<id>` | DELETE | 刪除自己的 trait（需登入 + 權限檢查） |

- 重複標註同一物種會回傳 409 Conflict

**檔案**：`backend/app/routes/traits.py`

### Phase 5：親緣距離計算 ✅

| Endpoint | Method | 說明 |
|----------|--------|------|
| `/api/kinship/<user_id>` | GET | 回傳每個 trait 的最近角色排行 |

- `?include_human=true` 可包含人類比較結果（預設隱藏）
- 現實物種與奇幻生物**分開計算、分開回傳**
- 每個 trait 獨立產生一組排行結果
- 距離 = `taxon_path` / `category_path` 的 LCP 共同層數差

**檔案**：`backend/app/services/kinship.py`, `backend/app/routes/kinship.py`

### Phase 6：前端建設 ✅

| 頁面/元件 | 檔案 | 說明 |
|-----------|------|------|
| Supabase Auth | `src/lib/supabase.js`, `src/lib/AuthContext.jsx` | Google / Twitch OAuth 登入，JWT session 管理 |
| API Client | `src/lib/api.js` | 自動帶 JWT 的 fetch wrapper |
| Navbar | `src/components/Navbar.jsx` | 導覽列（登入/登出狀態） |
| 首頁 | `src/pages/HomePage.jsx` | 歡迎頁面 + CTA |
| 登入頁 | `src/pages/LoginPage.jsx` | Google / Twitch 登入按鈕 |
| 角色檔案 | `src/pages/ProfilePage.jsx` | 顯示 trait 列表、新增/刪除 trait、編輯名稱 |
| 物種搜尋 | `src/pages/SearchPage.jsx`, `src/components/SpeciesSearch.jsx` | GBIF 物種搜尋 + 一鍵新增 trait |
| 親緣結果 | `src/pages/KinshipPage.jsx` | 每個 trait 獨立顯示最近角色排行，含人類 toggle |

- 路由：`/`, `/login`, `/profile`, `/search`, `/kinship/:userId`

### Phase 7：部署 + 種子資料 ✅

| 項目 | 檔案 | 說明 |
|------|------|------|
| Dockerfile | `backend/Dockerfile` | Python 3.12 slim + gunicorn，port 8080（Cloud Run） |
| Docker 忽略 | `backend/.dockerignore` | 排除 .env, __pycache__, .git |
| 奇幻生物種子 | `backend/seeds/fictional_species.sql` | 38 筆預建資料（東方神話 13、西方神話 12、奇幻 8 等） |
| DB Schema | `supabase/init.sql` | 完整建表 SQL（含 RLS、索引、觸發器） |
| 前端環境 | `frontend/.env.example` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` |

---

## 下一步待做事項

以下是 MVP 已完成但仍需要在後續會話中處理的事項：

### 高優先
1. **端對端測試**：用實際 Supabase 連線測試完整流程（登入 → 標註 → 親緣查詢）
2. **前端 `.env` 設定**：填入真實的 Supabase URL 和 Anon Key
3. **奇幻生物 seed 匯入**：在 Supabase SQL Editor 執行 `seeds/fictional_species.sql`
4. **前端奇幻生物搜尋**：目前前端只有現實物種搜尋，需新增奇幻生物的瀏覽/選擇 UI
5. **Cloud Run 部署**：設定 GCP 專案 + 環境變數 + 部署

### 中優先
6. **分類樹瀏覽頁面**：以樹狀結構呈現所有已建檔角色
7. **錯誤處理優化**：統一的 error handler + 前端 loading/error 狀態
8. **GBIF 中文名稱**：目前 GBIF API 不直接回傳中文名，考慮整合 TaiCOL
9. **CSS/UI 美化**：目前用 inline style，可考慮 Tailwind 或 CSS modules

### 低優先
10. **OAuth 帳號表管理**：`oauth_accounts` 表的 CRUD（記錄 YouTube/Twitch 帳號連結）
11. **分頁**：traits 和 kinship 結果的分頁機制
12. **效能優化**：kinship 計算可改用 SQL 前綴查詢加速

---

## 專案結構總覽

```
VTaxon/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory + blueprint 註冊
│   │   ├── config.py            # 環境設定（dev/prod/test）
│   │   ├── extensions.py        # SQLAlchemy instance
│   │   ├── auth.py              # JWT 驗證 + 權限裝飾器
│   │   ├── models.py            # 5 張表的 ORM model
│   │   ├── routes/
│   │   │   ├── auth.py          # /api/auth/*
│   │   │   ├── users.py         # /api/users/*
│   │   │   ├── species.py       # /api/species/*
│   │   │   ├── traits.py        # /api/traits/*
│   │   │   └── kinship.py       # /api/kinship/*
│   │   └── services/
│   │       ├── gbif.py          # GBIF API client + 快取邏輯
│   │       └── kinship.py       # LCP 距離計算引擎
│   ├── seeds/
│   │   └── fictional_species.sql  # 奇幻生物種子資料
│   ├── migrations/              # SQL migrations (先前已有)
│   ├── Dockerfile               # Cloud Run 部署用
│   ├── requirements.txt
│   └── run.py                   # 入口點
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.js      # Supabase client
│   │   │   ├── api.js           # API fetch wrapper
│   │   │   └── AuthContext.jsx  # 認證 context + hooks
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── SpeciesSearch.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   └── KinshipPage.jsx
│   │   ├── App.jsx              # 路由設定
│   │   └── main.jsx             # 入口
│   ├── vite.config.js           # dev proxy → localhost:5000
│   └── package.json
├── supabase/
│   └── init.sql                 # 完整 DB schema
└── CLAUDE.md                    # 專案規格書
```

## API 端點一覽

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/health` | - | 健康檢查 + DB 連線狀態 |
| POST | `/api/auth/callback` | JWT | 建立/更新使用者 |
| GET | `/api/users/me` | JWT | 取得自己的資料 |
| PATCH | `/api/users/me` | JWT | 更新自己的資料 |
| GET | `/api/users/<id>` | - | 公開查看角色 |
| GET | `/api/species/search?q=` | - | GBIF 物種搜尋 |
| GET | `/api/species/<taxon_id>` | - | 取得單一物種 |
| POST | `/api/traits` | JWT | 新增 trait |
| GET | `/api/traits?user_id=` | - | 查詢角色 traits |
| DELETE | `/api/traits/<id>` | JWT | 刪除 trait |
| GET | `/api/kinship/<user_id>` | - | 親緣距離排行 |
