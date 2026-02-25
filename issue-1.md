# Issue #1: 專案初始化與資料庫 Schema 建立

## 目標

建立 VTaxon 專案的基礎結構，包含前後端骨架與資料庫 schema，使後續功能開發有明確的起點。

## 任務清單

### 專案結構
- [ ] 初始化 Flask 後端專案（含基本的 app factory pattern）
- [ ] 初始化 React 前端專案
- [ ] 設定 `.gitignore`、`README.md`
- [ ] 放入 `CLAUDE.md`（專案上下文文件）
- [ ] 放入 `docs/data-model.md`（資料模型設計文件）

### 資料庫
- [ ] 建立 PostgreSQL 連線設定（支援 Supabase / Neon 連線字串）
- [ ] 建立 migration：`users` 表
- [ ] 建立 migration：`oauth_accounts` 表（含 UNIQUE constraint on provider + provider_account_id）
- [ ] 建立 migration：`species_cache` 表（含 `varchar_pattern_ops` 索引 on taxon_path）
- [ ] 建立 migration：`vtuber_traits` 表（含 UNIQUE constraint on user_id + taxon_id）

### 驗證
- [ ] 後端能啟動並連上資料庫
- [ ] 前端能啟動並顯示空白頁面
- [ ] Migration 能正常執行，4 張表都建立成功

## 不包含
- OAuth 登入流程（下一個 issue）
- GBIF API 串接（下一個 issue）
- 任何前端 UI（下一個 issue）

## 參考
- 資料模型詳見 `docs/data-model.md`
- 架構決策詳見 `CLAUDE.md`
