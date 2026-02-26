# VTaxon

將 Vtuber 角色形象特徵對應至生物分類學體系，量化角色間的親緣相似度。

## 核心概念

VTaxon 將 Vtuber 角色的「形象特徵」用兩套獨立的分類系統來描述：

### 1. **現實生物分類**
使用標準的生物分類學（從 GBIF 取得），將角色特徵對應到真實存在的動物。例如：
- 青狐角色 → 紅狐 (*Vulpes vulpes*)

**親緣距離計算**：比較兩個角色的物種分類路徑，共同祖先越近距離越小。例如紅狐和家貓都屬於食肉目，距離 = 3 層。

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

**親緣距離計算**：同樣使用分類路徑的最長共同前綴。例如九尾狐和河童共同祖先是「日本神話」，距離 = 1 層。

### 3. **結合使用**
一個角色可以同時擁有**現實物種 trait** 和**奇幻生物 trait**。**奇幻生物不需要對應現實物種**，兩套系統完全獨立。

複合種（多個 trait）的每個 trait 各自獨立查詢，產生多組排行，UI 並列顯示。例如同時具備「海蛞蝓 + 麻雀」特徵的角色，會分別輸出：
```
以「海蛞蝓」為基準的最近角色排行
以「麻雀」為基準的最近角色排行
```

## 使用流程

1. **登入** — 使用 Google（YouTube）/ Twitch OAuth 帳號登入
2. **標註特徵** — 搜尋現實物種和/或選擇奇幻生物來描述角色
3. **瀏覽分類樹** — 查看所有已建檔角色按分類層級組織的樣子
4. **親緣檢索** — 給定某角色，系統自動找出分類學上最接近的角色

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
| GET | `/api/kinship/<user_id>` | — | 親緣距離排行（`?include_human=true` 可含人類） |

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
│   │   └── services/            # 業務邏輯（GBIF client、親緣計算）
│   ├── seeds/                   # 種子資料
│   ├── migrations/              # SQL migrations（歷史紀錄）
│   ├── Dockerfile               # Cloud Run 部署用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/                 # Supabase client、API wrapper、AuthContext
│   │   ├── components/          # 共用元件（Navbar、SpeciesSearch）
│   │   └── pages/               # 頁面（Home、Login、Profile、Search、Kinship）
│   └── vite.config.js           # dev proxy → localhost:5000
├── supabase/
│   └── init.sql                 # 完整 DB schema
└── CLAUDE.md                    # 專案規格書
```

## 文件

- [資料模型](docs/data-model.md)
- [ER Diagram](docs/er-diagram.mermaid)
- [開發進度](PROGRESS.md)
