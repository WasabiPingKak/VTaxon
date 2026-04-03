# Architecture Decision Records (ADR)

本目錄記錄 VTaxon 專案的架構決策。每份 ADR 說明一個決策的背景、選項評估、最終決定與後果。

## 索引

| ADR | 標題 | 狀態 |
|-----|------|------|
| [001](001-scale-and-cost.md) | 規模定位與成本策略 | Accepted |
| [002](002-data-model-materialized-path.md) | 資料模型 — Materialized Path 分類樹 | Accepted |
| [003](003-auth-and-security.md) | 認證與安全架構 | Accepted |
| [004](004-cache-and-performance.md) | 快取與效能策略 | Accepted |
| [005](005-chinese-name-fallback.md) | 中文名稱多來源 Fallback | Accepted |
| [006](006-live-detection-webhooks.md) | 直播狀態偵測 — Webhook 架構 | Accepted |
| [007](007-tree-visualization-canvas.md) | 分類樹視覺化 — Canvas + D3 | Accepted |
| [008](008-deployment-and-cicd.md) | 部署架構與 CI/CD | Accepted |
| [009](009-frontend-state-and-api.md) | 前端狀態管理與 API 模式 | Accepted |

## 格式

每份 ADR 包含：

- **狀態**：Proposed / Accepted / Deprecated / Superseded
- **背景**：為什麼需要做這個決策
- **選項**：評估過的方案
- **決定**：最終選擇與理由
- **後果**：帶來的影響與未來擴展路徑
