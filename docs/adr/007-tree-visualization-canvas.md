# ADR-007: 分類樹視覺化 — Canvas + D3

**狀態**：Accepted
**日期**：2026-02-15

## 背景

VTaxon 的核心 UI 是一棵互動式分類樹，需要：

1. 顯示數百至數千個節點
2. 支援平滑縮放、拖曳、點擊展開
3. 節點大小反映該分類下的角色數量
4. 即時顯示直播狀態

## 選項

### A. SVG（D3 標準做法）
- 優點：DOM 元素可存取、事件處理簡單、CSS 動畫
- 缺點：數千個 DOM 節點效能差、每個節點是獨立元素

### B. Canvas 2D + D3 佈局
- 優點：無 DOM 瓶頸、繪製效能優秀、單一畫布元素
- 缺點：需自行實作命中測試、無原生無障礙支援

### C. WebGL（Three.js / PixiJS）
- 優點：GPU 加速、適合超大規模
- 缺點：學習曲線高、開發成本大、目前規模不需要

## 決定

選擇 **方案 B — Canvas 2D + D3 佈局計算**。

### 架構分層

```
useTreeLayout.ts     → D3 hierarchy 佈局計算
GraphCanvas.tsx      → Canvas 容器 + d3-zoom 整合
renderers.ts         → 純 Canvas 2D 繪製邏輯（無 React 依賴）
useGraphInteraction  → 互動邏輯（點擊、hover、視埠）
useNodeAnimation.ts  → 節點展開/收合動畫
treeUtils.ts         → 樹形結構工具函式
```

### 效能最佳化

| 技術 | 實作 | 目的 |
|------|------|------|
| **LOD** | 縮放 ≤ 0.2 時只畫圓點，不繪製標籤 | 遠景減少繪製量 |
| **視埠裁剪** | `isInViewport()` 帶邊距預取 | 只繪製可見區域 |
| **空間 Hash Grid** | CELL_SIZE=80，數值 key | O(1) 點擊命中測試 |
| **面積比例** | `sqrt(count/maxCount)` 映射 MIN_R(5)~MAX_R(30) | 視覺比例正確 |
| **預算分層** | 5 個子節點用圓點、6+ 隱藏 | 減少擁擠區域雜亂 |
| **動畫** | 300ms easeOutCubic，requestAnimationFrame | 流暢的節點展開 |

### 空間 Hash Grid 詳解

```typescript
const CELL_SIZE = 80;
function cellKey(cx: number, cy: number): number {
    return cx * 100003 + cy;  // 數值 key 避免字串連接開銷
}
```

點擊時搜尋 3×3 鄰域格子中的候選節點，時間複雜度 O(1)。

### Vendor 分包

```javascript
// vite.config.js
manualChunks: {
    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
    'vendor-supabase': ['@supabase/supabase-js'],
    'vendor-d3': ['d3-hierarchy', 'd3-selection', 'd3-zoom'],
}
```

D3 相關模組獨立打包，只在分類樹頁面需要時載入。

## 後果

- Canvas 繪製效能優秀，數千節點仍流暢
- 無原生 DOM 元素意味著無法使用 screen reader，需另外考慮無障礙方案
- 所有互動（hover、click）需自行實作命中測試
- D3 只用於佈局計算（`d3-hierarchy`）和縮放控制（`d3-zoom`），不綁定 DOM
