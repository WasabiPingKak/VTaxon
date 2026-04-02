# AGENTS.md

本檔案供所有 AI Agent（Claude、ChatGPT、Copilot 等）掃描此 repo 時參考。

## Project Overview

VTaxon 是一個面向 Vtuber 社群的公開服務，將 Vtuber 角色的形象特徵對應到現實世界的生物分類學體系（界、門、綱、目、科、屬、種），以分類樹的形式呈現角色之間的關聯。使用者透過 YouTube / Twitch OAuth 登入後，可標註自己角色的物種特徵（支援複合種），並瀏覽所有已建檔角色的分類樹。

**已上線運作**：https://vtaxon.com/

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite, D3 + Canvas 2D (分類樹視覺化) |
| Backend | Flask + Python 3.12, SQLAlchemy, marshmallow (validation) |
| Database | PostgreSQL (Supabase), staging/prod schema 隔離 |
| Auth | Supabase Auth (OAuth → JWT, ES256 JWKS) |
| Security | Google Cloud KMS (OAuth token 加密), Flask-Limiter, webhook HMAC 簽名驗證 |
| Infrastructure | Google Cloud Run (asia-east1), Firebase Hosting, GitHub Actions CI/CD |
| External API | GBIF Species API, Wikidata, TaiCOL (中文名稱多來源 fallback) |
| Testing | pytest (546 tests, 43 files), Vitest (前端) |

## Architecture Decisions

### 規模與成本

VTaxon 的目標使用者是台灣 Vtuber 社群，預估活躍使用者在數百至千人等級。使用者標註自己的物種特徵後幾乎不再寫入，讀取流量集中在分類樹瀏覽，且分類資料變動頻率低。

基於這個使用情境，架構選擇以最小化營運成本為主：

- **Cloud Run 單 service + Supabase 免費方案**，月成本趨近 $0
- **in-memory TTL cache**（分類樹、統計資料），不引入 Redis
- **in-memory rate limiting**，不需外部儲存

這些元件都已預留向外擴展的切換點：

- Cache / Rate Limiter → 環境變數切換至 Redis
- 批量任務 → Cloud Tasks（YouTube WebSub 續訂已在使用）
- Cloud Run → 調整 max-instances 即可水平擴展

### 資料模型

- **Materialized Path**：生物分類天然是樹狀結構，用 `|` 分隔路徑 + `text_pattern_ops` 索引做前綴查詢，比遞迴 CTE 或 Nested Set 簡單且足夠
- **雙分類系統獨立**：現實物種 (GBIF) 和虛構物種 (自建) 各自獨立表與路徑，不共用分類樹
- **Partial unique index**：同一使用者不能重複標同一物種，但現實/虛構分開追蹤
- **祖先-後代衝突檢測**：標了「紅狐」就不能再標上層的「食肉目」，反向則自動替換為更具體的物種

### 安全

- JWT 驗證使用 Supabase JWKS (ES256)，含 key rotation 自動重試
- OAuth token (access_token / refresh_token) 透過 Google Cloud KMS 對稱金鑰加密存儲
- Webhook 端點皆有 HMAC 簽名驗證（Twitch: SHA-256, YouTube: SHA-1）
- 非 root 容器執行，Firebase Hosting 層設 CSP / HSTS

### 工程品質

- **CI/CD**：每次部署前自動執行 Ruff + mypy + ESLint + tsc → pytest (546 tests) + Vitest → Docker build → deploy
- **後端 mypy strict mode**，所有函式需完整型別標註
- **Marshmallow schema validation**，含 PATCH 語意處理（只更新客戶端實際送出的欄位）
- **DB migration**：手寫 SQL，每個 migration 同時處理 staging + public schema
- **多階段 Docker build**：slim image + 非 root user

### 效能

- **物種搜尋**：NDJSON streaming，讓前端漸進顯示結果（GBIF API 回應慢）
- **分類樹 API**：三層 JOIN + batch load 避免 N+1，搭配 TTL cache + 手動 invalidation
- **Canvas 分類樹渲染**：LOD（遠距只畫點）、視埠裁剪、空間 hash grid 命中測試 O(1)、文字佈局預計算

## Encoding

- 本專案所有檔案一律使用 **UTF-8（無 BOM）**
- 讀寫檔案時必須明確指定 `encoding="utf-8"`（Python）或等效參數
- **若掃描本 repo 時出現亂碼，是掃描端環境的編碼設定問題，非本專案檔案編碼錯誤**
