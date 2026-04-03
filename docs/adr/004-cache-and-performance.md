# ADR-004: 快取與效能策略

**狀態**：Accepted
**日期**：2026-02-01

## 背景

VTaxon 的分類樹資料變動頻率低（使用者偶爾標註物種），但瀏覽頻率高。外部 API（GBIF、Wikidata）回應延遲不穩定。Cloud Run scale-to-zero 的特性讓外部快取服務（Redis）的常駐成本不划算。

## 決定

### 後端快取：進程內 TTL Cache

**實作**（`backend/app/cache.py`）：

```python
_tree_cache = TTLCache()            # 分類樹
_fictional_tree_cache = TTLCache()  # 虛構物種樹
_stats_cache = TTLCache()           # 統計資料
```

- 預設 TTL：300 秒
- 寫入操作後手動 `invalidate_*_cache()` 清除相關快取
- API 隔離：`get_cache()` / `set_cache()` / `invalidate_cache()`

**限制**：Gunicorn 多 worker 時每個 worker 持有獨立副本。在 2 workers 的規模下可接受。

### 後端效能：分類樹 API

**三層 JOIN + batch load**（`backend/app/routes/species.py`）：
- 一次查詢載入分類樹 + 使用者資料 + 直播狀態，避免 N+1
- TTL cache 減少重複查詢

### 後端效能：NDJSON Streaming

**問題**：物種搜尋需即時呼叫 GBIF API + 中文名稱豐富化，延遲可達數秒。

**解法**（`backend/app/services/species_cache.py`）：
- 搜尋結果以 NDJSON（Newline-Delimited JSON）格式逐行串流
- `Content-Type: application/x-ndjson` + `X-Accel-Buffering: no`
- 前端收到一行就渲染一筆結果，不需等待完整回應

**端點**：
- `/species/search/stream` — 物種搜尋
- `/species/{taxonId}/children/stream` — 子分類載入

### 前端快取：會話級 Map

**實作**（`frontend/src/lib/api.ts`）：

```typescript
const MAX_CACHE = 100;
const searchCache = new Map<string, SpeciesCache[]>();
const childrenCache = new Map<number, SpeciesCache[]>();
const treeCache = new Map<string, TreeEntry[]>();
```

- 有限容量（100 entries），LRU-like 淘汰（刪最舊的 key）
- 頁面重整時清除
- NDJSON 串流完成後將完整結果存入快取

### 前端效能：Canvas 分類樹

**實作**（`frontend/src/components/graph/`）：

| 最佳化 | 實作 | 效果 |
|--------|------|------|
| LOD（Level of Detail） | 縮放 ≤ 0.2 時只畫點圈 | 高縮放級別減少 GPU 壓力 |
| 視埠裁剪 | `isInViewport()` 帶邊距預取 | 只繪製可見區域節點 |
| 空間 Hash Grid | CELL_SIZE=80，數值 key 避免字串連接 | O(1) 點擊命中測試 |
| 面積比例半徑 | `sqrt(count/maxCount)` 映射 5-30px | 視覺比例正確 |
| 節點動畫 | 300ms easeOutCubic，從父節點展開 | 流暢過渡 |
| 預算分層 | 5 個以上子節點用圓點、6+ 隱藏 | 減少擁擠區域雜亂 |

### HTTP 重試策略

**實作**（`backend/app/services/http_client.py`）：
- 共用 `requests.Session` + `HTTPAdapter`
- 重試：最多 3 次（1 原始 + 2 重試）、backoff 0.5s
- 僅重試 GET 請求的 5xx 錯誤

## 後果

- 進程內快取在 scale-up 時效能不會劣化，但一致性窗口變大（最多 300s stale）
- NDJSON streaming 提升了感知效能，但前端需處理逐行解析和中斷邏輯
- Canvas 渲染效能優秀但犧牲了無障礙存取（accessibility）
- 未來若需跨 worker 一致性，可透過環境變數切換至 Redis，程式碼已預留介面
