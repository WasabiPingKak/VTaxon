# ADR-009: 前端狀態管理與 API 模式

**狀態**：Accepted
**日期**：2026-02-01

## 背景

VTaxon 前端是 React SPA，需要管理認證狀態、API 資料、分類樹互動狀態等。需要在簡潔性和擴展性之間取得平衡。

## 決定

### 狀態管理：React Context + 組件本地狀態

**不引入 Redux / Zustand 等外部狀態管理庫**，理由：

1. 全域共享狀態只有認證和通知，Context API 足夠
2. 分類樹的互動狀態（展開節點、選中項目等）僅限單一頁面，用 `useState` 即可
3. API 資料用會話級 Map 快取，不需要 normalized store

| 層級 | 工具 | 用途 |
|------|------|------|
| 全域 | `AuthContext` | 認證會話、使用者資料、登入/登出/帳號聯結 |
| 全域 | `ToastContext` | Toast 通知（info/success/error，5 秒自動消失） |
| 頁面 | `useState` | 分類樹展開狀態、篩選條件、排序、選中項目 |
| Hook | `useLiveStatus` | 直播狀態（60 秒輪詢，頁面隱藏時暫停） |

### API 模式：雙軌搜尋

**標準模式**（`api.ts` — `searchSpecies()`）：
- 一次性 JSON 回應
- 適合結果集小或已快取的場景

**串流模式**（`api.ts` — `searchSpeciesStream()`）：
- NDJSON 逐行解析，收到一筆就透過 `onResult` callback 渲染
- `ReadableStream.getReader()` + `TextDecoder` 處理分包邊界
- 支援 `AbortSignal` 取消
- 完成後將完整結果存入快取

**端點對應**：

| 用途 | 標準端點 | 串流端點 |
|------|---------|---------|
| 物種搜尋 | `/species/search` | `/species/search/stream` |
| 子分類載入 | `/species/{id}/children` | `/species/{id}/children/stream` |

### 路由：React Router + Lazy Loading

所有頁面使用 `React.lazy()` + `Suspense` 實現代碼分割：

```typescript
const HomePage = lazy(() => import('./pages/HomePage'));
// ...
<Suspense fallback={<LoadingFallback />}>
    <Routes>...</Routes>
</Suspense>
```

首頁（分類樹）使用全屏 Canvas，其他頁面使用標準佈局容器。

### 認證狀態同步

`AuthContext` 在 Supabase `onAuthStateChange` 事件觸發時：

1. `TOKEN_REFRESHED` → 跳過（避免不必要的 re-render）
2. 其他事件 → `syncUser()` 同步使用者資料到後端

帳號聯結使用簽名的 link token 機制，暫存於 `sessionStorage`。

## 後果

- 無外部狀態管理依賴，bundle size 更小
- 頁面間不共享分類樹狀態——切換頁面後返回需重新載入（可接受，因為有快取）
- 會話級 Map 快取最多 100 entries，避免記憶體洩漏
- 未來若需要跨頁面共享複雜狀態，可考慮 Zustand（輕量且 API 簡單）
