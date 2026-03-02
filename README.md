# VTaxon

將 Vtuber 角色形象特徵對應至生物分類學體系，以分類樹呈現角色間的關聯。

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

## 開發環境啟動

### 資料庫初始化

連上 Supabase SQL Editor，依序執行：

```bash
supabase/init.sql                        # 建立所有表、索引、RLS、觸發器
backend/seeds/fictional_species.sql      # 匯入奇幻生物種子資料（38 筆）
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

## API 端點

| Method | Path | 認證 | 說明 |
|--------|------|------|------|
| GET | `/health` | — | 健康檢查 + DB 連線狀態 |
| POST | `/api/auth/callback` | JWT | OAuth 完成後建立/更新使用者 |
| GET | `/api/users/me` | JWT | 取得當前登入者資料 |
| PATCH | `/api/users/me` | JWT | 更新 display_name / avatar_url |
| GET | `/api/users/<id>` | — | 公開查看角色資料 |
| GET | `/api/species/search?q=` | — | GBIF 物種模糊搜尋 |
| GET | `/api/species/<taxon_id>` | — | 取得單一物種分類資料 |
| POST | `/api/traits` | JWT | 新增角色 trait |
| GET | `/api/traits?user_id=` | — | 查詢角色的所有 trait |
| DELETE | `/api/traits/<id>` | JWT | 刪除自己的 trait |

## 專案結構

```
VTaxon/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory + blueprint 註冊
│   │   ├── config.py            # 環境設定（dev/prod/test）
│   │   ├── extensions.py        # SQLAlchemy instance
│   │   ├── auth.py              # JWT 驗證 + 權限裝飾器
│   │   ├── models.py            # 5 張表的 ORM model
│   │   ├── routes/              # API 路由
│   │   └── services/            # 業務邏輯（GBIF client）
│   ├── seeds/                   # 種子資料
│   ├── migrations/              # SQL migrations（歷史紀錄）
│   ├── Dockerfile               # Cloud Run 部署用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/                 # Supabase client、API wrapper、AuthContext
│   │   ├── components/          # 共用元件（Navbar、SpeciesSearch）
│   │   └── pages/               # 頁面（Home、Login、Profile、Search）
│   └── vite.config.js           # dev proxy → localhost:5000
├── supabase/
│   └── init.sql                 # 完整 DB schema
└── CLAUDE.md                    # 專案規格書
```

## 文件

- [資料模型](docs/data-model.md)
- [ER Diagram](docs/er-diagram.mermaid)
- [開發進度](PROGRESS.md)
