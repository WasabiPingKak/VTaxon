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

1. **登入** — 使用 YouTube / Twitch OAuth 帳號登入
2. **標註特徵** — 選擇現實物種和/或奇幻生物來描述角色
3. **瀏覽分類樹** — 查看所有已建檔角色按分類層級組織的樣子
4. **親緣檢索** — 給定某角色，系統自動找出分類學上最接近的角色

## 開發環境啟動

### 後端（Flask）

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env    # 填入 DATABASE_URL 等設定
python run.py
```

健康檢查：`curl http://localhost:5000/health`

### 前端（React + Vite）

```bash
cd frontend
npm install
npm run dev
```

開啟瀏覽器至 http://localhost:5173

## 資料庫 Migrations

連上 Supabase SQL Editor 或 psql，依序執行以下 SQL：

```bash
backend/migrations/001_users.sql              # 使用者表
backend/migrations/002_oauth_accounts.sql     # OAuth 帳號連結
backend/migrations/003_species_cache.sql      # 現實生物分類快取（GBIF）
backend/migrations/004_vtuber_traits.sql      # 角色特徵（現實物種）
backend/migrations/005_fictional_species.sql  # 奇幻生物獨立分類
backend/migrations/006_alter_vtuber_traits.sql # 擴展特徵表支援奇幻生物
```

## 文件

- [資料模型](docs/data-model.md)
- [ER Diagram](docs/er-diagram.mermaid)
