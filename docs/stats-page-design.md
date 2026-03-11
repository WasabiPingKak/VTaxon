# 統計頁面設計文件

## 概述

新增 `/stats` 路由頁面，以圖表形式呈現 VTaxon 平台的各項統計數據。與分類樹的互動式探索不同，此頁面著重於**數據摘要與視覺化呈現**。

## 技術選型

| 項目 | 決策 | 理由 |
|------|------|------|
| 圖表渲染 | **純 SVG + D3** | 與現有 TaxonomyGraph 風格一致、零額外依賴、客製化彈性最大 |
| 後端 API | 單一 `/api/stats/overview` 端點 | 減少前端請求次數，一次取得所有統計 |
| 快取策略 | 伺服器端 5 分鐘 TTL | 與現有 tree cache 策略一致 |
| 響應式 | `useIsMobile()` hook | 沿用現有模式 |

## 開發分期

### 第一期（核心）

1. Hero 數字卡片
2. 最熱門物種 Top 10
3. 現實 vs 奇幻比例
4. 分類階層分佈

### 第二期（擴充）

5. 國家/地區分佈
6. 用戶成長趨勢
7. 平台 / 組織類型 / 活動狀態分佈
8. 最熱門奇幻物種 Top 10

---

## 統計項目清單

### 第一期

#### 1. Hero 數字卡片

一排四個摘要數字，作為頁面最上方的總覽區。

| 卡片 | 資料來源 | 查詢 |
|------|---------|------|
| VTuber 總數 | `users` | `COUNT(*)` |
| 已標註物種的 VTuber 數 | `vtuber_traits` | `COUNT(DISTINCT user_id)` |
| 物種總數（被使用的） | `vtuber_traits` JOIN `species_cache` | `COUNT(DISTINCT taxon_id) WHERE taxon_id IS NOT NULL` |
| 奇幻生物總數（被使用的） | `vtuber_traits` JOIN `fictional_species` | `COUNT(DISTINCT fictional_species_id) WHERE fictional_species_id IS NOT NULL` |

**UI 規格：**
- 四個卡片水平排列（手機版 2×2 grid）
- 數字用大字體（2rem+），標籤用小字體
- 卡片背景 `rgba(20,28,43,0.75)` + `backdrop-filter: blur(12px)`
- 數字顏色 `#38bdf8`

#### 2. 最熱門物種 Top 10（水平長條圖）

顯示最多 VTuber 選擇的現實物種。

**資料查詢：**
```sql
SELECT sc.taxon_id,
       COALESCE(sc.common_name_zh, sc.scientific_name) AS name,
       sc.scientific_name,
       COUNT(DISTINCT vt.user_id) AS user_count
FROM vtuber_traits vt
JOIN species_cache sc ON vt.taxon_id = sc.taxon_id
WHERE vt.taxon_id IS NOT NULL
GROUP BY sc.taxon_id, sc.common_name_zh, sc.scientific_name
ORDER BY user_count DESC
LIMIT 10;
```

**UI 規格：**
- 水平長條圖（Horizontal Bar Chart）
- 左側顯示物種中文名（或學名 fallback）
- 長條填充 `#38bdf8`，hover 時亮度增加
- 右側顯示數字
- 長條寬度相對於最大值的百分比

#### 3. 現實 vs 奇幻比例（甜甜圈圖）

**資料查詢：**
```sql
SELECT
  COUNT(CASE WHEN taxon_id IS NOT NULL AND fictional_species_id IS NULL THEN 1 END) AS real_only,
  COUNT(CASE WHEN taxon_id IS NULL AND fictional_species_id IS NOT NULL THEN 1 END) AS fictional_only,
  COUNT(CASE WHEN taxon_id IS NOT NULL AND fictional_species_id IS NOT NULL THEN 1 END) AS both
FROM vtuber_traits;
```

**UI 規格：**
- 甜甜圈圖（Donut Chart），中心顯示總 trait 數
- 三色段：現實物種 `#38bdf8`、奇幻生物 `#a78bfa`、兩者皆有 `#34d399`
- 右側或下方顯示圖例 + 百分比

#### 4. 分類階層分佈（Treemap）

以 Kingdom → Class 層級顯示物種分佈的面積比例。

**資料查詢：**
```sql
SELECT sc.kingdom,
       COALESCE((sc.path_zh->>'kingdom'), sc.kingdom) AS kingdom_zh,
       sc.class AS class_name,
       COALESCE((sc.path_zh->>'class'), sc.class) AS class_zh,
       COUNT(DISTINCT vt.user_id) AS user_count
FROM vtuber_traits vt
JOIN species_cache sc ON vt.taxon_id = sc.taxon_id
WHERE vt.taxon_id IS NOT NULL AND sc.kingdom IS NOT NULL
GROUP BY sc.kingdom, sc.path_zh->>'kingdom', sc.class, sc.path_zh->>'class'
ORDER BY user_count DESC;
```

**UI 規格：**
- Treemap（矩形樹圖），使用 `d3-hierarchy` 的 `treemap()` 佈局
- 第一層（Kingdom）用不同色系區分
- 第二層（Class）在同色系內用明暗區分
- 每個區塊顯示中文名稱 + 數量
- Hover 顯示完整路徑 tooltip

---

### 第二期

#### 5. 國家/地區分佈（水平長條圖）

**資料來源：** `users.country_flags` (JSONB array)

```sql
SELECT flag AS country_code, COUNT(*) AS user_count
FROM users, jsonb_array_elements_text(country_flags) AS flag
WHERE jsonb_array_length(country_flags) > 0
GROUP BY flag
ORDER BY user_count DESC
LIMIT 15;
```

**UI 規格：**
- 水平長條圖，左側顯示國旗 emoji + 國家名稱
- 與熱門物種 Top 10 同樣的長條圖元件

#### 6. 用戶成長趨勢（折線圖）

**資料來源：** `users.created_at` 按月分組

```sql
SELECT DATE_TRUNC('month', created_at) AS month,
       COUNT(*) AS new_users,
       SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS cumulative
FROM users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

**UI 規格：**
- 雙 Y 軸折線圖：左軸＝每月新增、右軸＝累計
- 每月新增用柱狀圖（bar），累計用折線（line）
- X 軸為月份
- 填充漸層底色

#### 7. 平台 / 組織類型 / 活動狀態分佈（甜甜圈圖 ×3）

三個小型甜甜圈圖橫向排列。

**平台分佈：**
```sql
SELECT provider, COUNT(DISTINCT user_id) AS user_count
FROM oauth_accounts
GROUP BY provider;
```

**組織類型：**
```sql
SELECT COALESCE(org_type, 'unknown') AS org_type, COUNT(*) AS user_count
FROM users
GROUP BY org_type;
```

**活動狀態：**
```sql
SELECT COALESCE(profile_data->>'activity_status', 'unknown') AS status, COUNT(*) AS user_count
FROM users
GROUP BY profile_data->>'activity_status';
```

**UI 規格：**
- 三個甜甜圈圖水平排列（手機版堆疊）
- 每個圖表下方顯示圖例
- 配色各自獨立但風格統一

#### 8. 最熱門奇幻物種 Top 10（水平長條圖）

與第 2 項同樣格式，但資料來自奇幻物種。

```sql
SELECT fs.id, fs.name_zh, fs.name, fs.origin,
       COUNT(DISTINCT vt.user_id) AS user_count
FROM vtuber_traits vt
JOIN fictional_species fs ON vt.fictional_species_id = fs.id
WHERE vt.fictional_species_id IS NOT NULL
GROUP BY fs.id, fs.name_zh, fs.name, fs.origin
ORDER BY user_count DESC
LIMIT 10;
```

---

## 後端 API 設計

### `GET /api/stats/overview`

公開端點（不需認證），回傳所有統計資料。

**快取：** 伺服器端 5 分鐘 TTL，與 tree cache 同策略。

**回應格式：**
```json
{
  "totals": {
    "users": 42,
    "tagged_users": 38,
    "species_used": 127,
    "fictional_used": 15
  },
  "top_species": [
    {
      "taxon_id": 2435099,
      "name": "貓",
      "scientific_name": "Felis catus",
      "count": 12
    }
  ],
  "top_fictional": [
    {
      "id": 3,
      "name_zh": "龍",
      "name": "Dragon",
      "origin": "跨文化",
      "count": 8
    }
  ],
  "trait_type_ratio": {
    "real_only": 85,
    "fictional_only": 23,
    "both": 5
  },
  "taxonomy_distribution": [
    {
      "kingdom": "Animalia",
      "kingdom_zh": "動物界",
      "class": "Mammalia",
      "class_zh": "哺乳綱",
      "count": 65
    }
  ],
  "by_country": [
    { "code": "TW", "count": 20 },
    { "code": "JP", "count": 15 }
  ],
  "growth_monthly": [
    { "month": "2025-12", "new_users": 5, "cumulative": 30 }
  ],
  "by_platform": { "youtube": 30, "twitch": 18 },
  "by_org_type": { "indie": 25, "corporate": 12, "club": 5, "unknown": 0 },
  "by_status": { "active": 30, "hiatus": 5, "preparing": 7, "unknown": 0 },
  "avg_traits_per_user": 2.3
}
```

---

## 前端架構

### 檔案結構

```
frontend/src/
├── pages/
│   └── StatsPage.jsx              # 統計頁面主元件
├── components/
│   └── stats/
│       ├── HeroCards.jsx           # 數字卡片區
│       ├── HorizontalBarChart.jsx  # 通用水平長條圖（SVG）
│       ├── DonutChart.jsx          # 通用甜甜圈圖（SVG）
│       ├── TreemapChart.jsx        # Treemap 圖表（SVG + d3-hierarchy）
│       ├── GrowthChart.jsx         # 成長趨勢折線+柱狀複合圖（SVG）
│       └── ChartCard.jsx           # 圖表外框容器（標題 + 卡片樣式）
└── lib/
    └── api.js                      # 新增 getStats() 方法
```

### 路由

```jsx
// App.jsx
const StatsPage = lazy(() => import('./pages/StatsPage'));
// ...
<Route path="/stats" element={<StatsPage />} />
```

### Navbar 連結

在 Navbar 的導航項目中加入「統計」連結，指向 `/stats`。

### 共用圖表元件設計原則

- 所有圖表元件接收 `data` prop，純展示、無 side effect
- 響應式：透過 `ResizeObserver` 或容器寬度 prop 動態調整 SVG viewBox
- 動畫：使用 CSS transition 或 D3 transition 做入場動畫
- 無障礙：SVG 內加 `<title>` 和 `aria-label`

---

## 設計風格

### 配色

| 用途 | 色碼 |
|------|------|
| 主色（長條、折線） | `#38bdf8` |
| 奇幻物種 | `#a78bfa` |
| 成功/正向 | `#34d399` |
| 警告 | `#facc15` |
| 粉紅強調 | `#f472b6` |
| 卡片背景 | `rgba(20,28,43,0.75)` |
| 頁面背景 | `#080d15` |
| 文字主色 | `rgba(255,255,255,0.9)` |
| 文字次色 | `rgba(255,255,255,0.5)` |
| 邊框 | `rgba(255,255,255,0.08)` |

### Treemap 色票（按 Kingdom）

| Kingdom | 主色 | 子層級以明暗變化 |
|---------|------|----------------|
| Animalia（動物界） | `#38bdf8` 系 | `#38bdf8` → `#0ea5e9` → `#0284c7` |
| Plantae（植物界） | `#34d399` 系 | `#34d399` → `#10b981` → `#059669` |
| Fungi（真菌界） | `#a78bfa` 系 | `#a78bfa` → `#8b5cf6` → `#7c3aed` |
| 其他 | `#94a3b8` 系 | 灰色系 |

### 字體與間距

- 卡片 border-radius: `12px`
- 卡片 padding: `24px`（手機 `16px`）
- 圖表區塊間距: `24px`
- 數字字體大小: `2.5rem`（Hero）、`1rem`（圖表標籤）
- 標題: `1.25rem`、font-weight `600`
