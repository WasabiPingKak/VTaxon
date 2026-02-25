# VTaxon

將 Vtuber 角色形象特徵對應至生物分類學體系，量化角色間的親緣相似度。

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

> TODO: 設定 Supabase 後依序執行以下 SQL：

```bash
# 連上 Supabase SQL Editor 或 psql，依序執行：
backend/migrations/001_users.sql
backend/migrations/002_oauth_accounts.sql
backend/migrations/003_species_cache.sql
backend/migrations/004_vtuber_traits.sql
```

## 文件

- [資料模型](docs/data-model.md)
- [ER Diagram](docs/er-diagram.mermaid)
