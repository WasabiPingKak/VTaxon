# DB 備份指南

## 前置條件

1. 本機已安裝 PostgreSQL client tools（需要 `pg_dump` 指令）
2. `backend/.env` 中有正確的 `DATABASE_URL`（指向 prod Supabase）

## 基本用法

```bash
# 備份為 custom format（.dump），適合用 pg_restore 還原
bash scripts/backup_db.sh

# 備份為純 SQL 文字檔，可直接閱讀或用 psql 匯入
bash scripts/backup_db.sh --sql
```

## 備份檔位置

備份檔會存在專案根目錄的 `backups/`：

```
backups/
  vtaxon_prod_20260313_143022.dump   ← custom format
  vtaxon_prod_20260313_150000.sql    ← SQL format
```

此目錄已加入 `.gitignore`，不會被 commit。

## 還原方式

### Custom format（.dump）

```bash
pg_restore --host=<host> --port=<port> --username=<user> \
  --dbname=<dbname> --schema=public --clean --if-exists \
  backups/vtaxon_prod_XXXXXXXX_XXXXXX.dump
```

### SQL format（.sql）

```bash
psql --host=<host> --port=<port> --username=<user> \
  --dbname=<dbname> < backups/vtaxon_prod_XXXXXXXX_XXXXXX.sql
```

## 自動備份（GitHub Actions）

專案已設定 GitHub Actions 排程自動備份（`.github/workflows/backup-db.yml`）。

### 排程

- 每週一、四 UTC 16:00（台灣時間 00:00）自動執行
- 也可在 GitHub Actions 頁面手動觸發（workflow_dispatch）

### GitHub Secret

需要在 repo 的 Settings → Secrets and variables → Actions 設定：

| Secret 名稱 | 說明 |
|-------------|------|
| `DATABASE_URL_PROD` | Production 資料庫連線字串（已用於 deploy-prod workflow） |

此 secret 已在部署 workflow 中使用，通常不需額外設定。

### 備份檔存放

- 存為 GitHub Artifact，保留 90 天
- 在 GitHub Actions → Backup Database → 對應 run 的 Artifacts 區塊下載

### 手動觸發

GitHub repo → Actions → Backup Database → Run workflow

## 什麼時候該備份

- 執行 DB migration 之前
- 大量刪除或修改資料之前
- 上線重大功能之前

## 備份範圍

- 只備份 `public` schema（production 資料）
- 不包含 owner / privilege 資訊（`--no-owner --no-privileges`）
- 不包含 `staging` schema
