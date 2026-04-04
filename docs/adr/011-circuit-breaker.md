# ADR-011: 外部服務 Circuit Breaker

**狀態**：Accepted
**日期**：2026-04-04

## 背景

VTaxon 後端呼叫 5 個外部服務（GBIF、Wikidata、TaiCOL、YouTube Data API、Twitch Helix），每個呼叫預設 10 秒 timeout。`http_client.py` 的 Retry 機制（最多重試 2 次，指數退避）可處理瞬時錯誤，但當外部服務**持續性故障**（如 YouTube quota 用完、GBIF 維護停機）時，每個使用者請求仍需等待 10 秒才能回傳錯誤，且重試機制會加倍延遲。

## 選項

### A. 引入第三方 Circuit Breaker 套件（pybreaker、tenacity）
- 優點：功能完整、社群維護
- 缺點：新增依賴、API 較重、不一定符合專案需求

### B. 自建輕量 Circuit Breaker 模組
- 優點：零依賴、完全控制、符合專案規模
- 缺點：需自行維護

### C. 不做 Circuit Breaker，靠降低 timeout 解決
- 優點：零開發成本
- 缺點：無法區分「暫時性錯誤」與「持續性故障」，且降低 timeout 會增加正常請求的誤判

## 決策

選擇 **B. 自建輕量 Circuit Breaker**。

專案規模小（單一 Cloud Run 實例），不需要分散式狀態同步，in-process `threading.Lock` 足夠。三態狀態機（CLOSED → OPEN → HALF_OPEN）搭配 `guard()` / `record_success()` / `record_failure()` API，可靈活整合到不同的呼叫模式。

## 設計

### 架構位置

```
Caller → CB.guard() → HTTP 呼叫（含 Retry） → CB.record_success/failure
```

Retry 處理瞬時錯誤（單次請求層級），Circuit Breaker 處理持續性故障（跨請求層級）。兩者互補。

### 服務配置

| 服務 | failure_threshold | recovery_timeout | 特殊規則 |
|------|:-:|:-:|------|
| GBIF | 5 | 60s | — |
| Wikidata | 5 | 120s | — |
| TaiCOL | 5 | 120s | — |
| YouTube | 3 | 300s | HTTP 403 即時開路（quota 當天不會恢復） |
| Twitch | 5 | 60s | — |

### 降級策略

- **面向前端的服務**（GBIF 物種搜尋）：路由層捕捉 `CircuitOpenError`，回傳 HTTP 503 + 中文錯誤訊息
- **enrichment 服務**（Wikidata、TaiCOL）：回傳 `None` / 空值，搜尋結果缺少中文名但不中斷
- **背景服務**（YouTube、Twitch 直播偵測）：靜默跳過，等 recovery 後自動恢復

### 關鍵檔案

- `backend/app/services/circuit_breaker.py` — 核心模組（CircuitBreaker 類別 + 5 個實例）
- 各 service 檔案透過 `_gbif_get()` / `_taicol_get()` helper 或直接 `guard()`/`record_*()` 整合

## 後果

- 持續性故障時使用者等待時間從 10s+ 降至 < 1ms（快速失敗）
- YouTube quota 用完時不再浪費剩餘 quota 在無效的重試上
- 新增 ~200 行程式碼 + 25 個測試，零外部依賴
- 未來可擴展：新增 admin 端點查看 CB 狀態、接入告警系統
