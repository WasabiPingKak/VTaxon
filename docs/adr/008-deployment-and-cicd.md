# ADR-008: 部署架構與 CI/CD

**狀態**：Accepted
**日期**：2026-01-15

## 背景

VTaxon 採用前後端分離架構，需要獨立部署前端靜態資源和後端 API。需要 staging / production 雙環境、自動化部署、以及 schema 隔離。

## 決定

### 部署拓撲

| 環境 | Git 分支 | 後端 | 前端 | DB Schema |
|------|---------|------|------|-----------|
| Staging | `develop` | Cloud Run `vtaxon-api-staging` | `vtaxon-staging.web.app` | `staging` |
| Production | `main` | Cloud Run `vtaxon-api-prod` | `vtaxon.com` | `public` |

### 後端：Cloud Run

**Docker 多階段 build**（`backend/Dockerfile`）：

```dockerfile
# Builder: 安裝依賴
FROM python:3.12-slim AS builder
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt gunicorn

# Runtime: 最小化 image
FROM python:3.12-slim
RUN adduser --disabled-password --uid 1001 appuser
COPY --from=builder /install /usr/local
USER appuser
CMD ["gunicorn --bind 0.0.0.0:8080 --workers ${WEB_CONCURRENCY} ..."]
```

- 非 root user（appuser, UID 1001）
- `WEB_CONCURRENCY=2`（可覆蓋）
- Gunicorn timeout 30 秒

**Cloud Run 設定**：
- Region：asia-east1
- Min instances：0（scale-to-zero）
- Max instances：1（成本控制）
- 環境變數與 Secret 透過 `--set-env-vars` / `--set-secrets` 注入

### 前端：Firebase Hosting

- SPA 路由重寫：所有非 API 路徑回落至 `/index.html`
- API 反向代理：`/api/**` → Cloud Run 後端
- 靜態資源快取：`/assets/**` 設為 `max-age=31536000, immutable`
- Staging 加上 `X-Robots-Tag: noindex` 防止搜尋引擎索引

### DB Schema 隔離

**實作**（`backend/app/__init__.py`）：

```python
db_schema = app.config.get("DB_SCHEMA", "")
if db_schema:
    connect_args["options"] = f"-c search_path={db_schema}"
```

同一個 Supabase 實例，透過 PostgreSQL `search_path` 隔離 staging / production 資料。

### DB Migration

- **不使用 Alembic**：手寫 SQL migration，放在 `supabase/migrations/`
- 每份 migration 必須同時處理 `staging.*` 和 `public.*` 兩段 SQL
- `supabase/init.sql` 是全新建庫的初始化腳本，不影響已上線的 DB

### CI/CD：GitHub Actions

**Pipeline 流程**（`.github/workflows/deploy-staging.yml` / `deploy-prod.yml`）：

```
Push → Lint (Ruff + mypy + ESLint + tsc)
     → Test (pytest + Vitest)
     → Docker build & push (Artifact Registry)
     → gcloud run deploy
     → Firebase deploy (前端)
```

- Lint 和 Test 平行執行
- PR 時自動產生覆蓋率報告和動態徽章
- 後端測試目標覆蓋率 70%

### Git 分支策略

```
feature/xxx (worktree) → merge → develop → merge → main
                                    ↓                 ↓
                               auto deploy       auto deploy
                               (staging)         (production)
```

- 程式碼修改必須走 feature branch（worktree）→ develop → main
- 文件 / changelog 等非程式碼修改可直接 commit 到目標分支

## 後果

- Scale-to-zero 讓閒置時成本為 $0，但冷啟動延遲 2-3 秒
- 單一 Supabase 實例的 schema 隔離簡化維運，但 migration 需同時寫兩段 SQL
- 手寫 migration 靈活但缺乏版本追蹤——目前 migration 數量少，可控
- Firebase Hosting 的 API 反向代理讓前端不需處理 CORS
