# 中文名稱資料來源策略

## 背景

GBIF API 幾乎不提供中文俗名（vernacular names），即使是大熊貓等知名物種也僅有拼音版本。為了讓 VTaxon UI 顯示繁體中文名稱，需要整合其他資料來源。

## 問題一：GBIF 搜尋重複結果

### 原因

`/v1/species/search` 端點會搜尋 GBIF **所有已註冊的 checklist 資料集**，而非僅搜尋權威的 GBIF Backbone Taxonomy。同一物種在不同資料集中各有一筆紀錄：

- 每筆結果 `key` 不同（來自不同資料集）
- `nubKey` 相同（皆指向同一 Backbone 物種）
- 差異：來源資料集、學名格式（有無命名者）、高階分類用詞（Animalia vs Metazoa）

### 解法

| 方案 | API 端點 | 說明 |
|------|---------|------|
| `/species/match` | 精確匹配 | 回傳單一 Backbone 權威結果，附信心分數 |
| `/species/suggest` | 自動補全 | 回傳 Backbone 結果，適合即時搜尋 |
| `/species/search` + 去重 | 模糊搜尋 | 用 `nubKey` 去重或限定 Backbone datasetKey |

**決策**：搜尋用 `/species/suggest`（輸入時自動補全），選定後用 `/species/match` 取得完整分類資料。

## 問題二：中文名稱來源

### 資料來源評估

#### TaiCOL（臺灣物種名錄）

- **API**：`https://api.taicol.tw/v2/taxon?scientific_name=...`
- **優點**：繁體中文品質極高（台灣分類學家策展）；`/v2/higherTaxa` 可一次取得整條分類階層中文名
- **覆蓋**：台灣有紀錄物種 ~68,000+，非台灣物種不完整
- **匹配方式**：以學名比對（TaiCOL ID 與 GBIF ID 不互通）
- **認證**：不需要
- **測試結果**：石虎✓、貓✓、犬✓、智人✓、狼✓、大貓熊✓、大猩猩✓

#### Wikidata

- **API**：`wbsearchentities` / `wbgetentities` / SPARQL
- **優點**：全球覆蓋（~330 萬筆有 GBIF taxon ID P846）；支援 zh-tw 標籤且與 zh-hant/zh 有區分
- **覆蓋**：常見物種良好，冷門物種可能缺中文標籤
- **匹配方式**：可直接用 GBIF taxon ID 查詢（Wikidata 屬性 P846）
- **認證**：不需要（建議設定 User-Agent）
- **批次能力**：`wbgetentities` 一次 50 筆；SPARQL 支援 VALUES 批次查詢
- **zh-tw 特色**：石虎（非豹貓）、大貓熊（非大熊貓）

#### GBIF vernacularNames

- **結論**：不可用。中文覆蓋趨近於零。

### 決策：三層 fallback 策略

```
優先級 1：Wikidata（用 GBIF taxon ID 直接查 zh-tw 標籤，覆蓋廣）
優先級 2：TaiCOL（用學名查 common_name_c，品質高但範圍限台灣物種）
優先級 3：本地靜態對照表（高階分類兜底：界/門/綱/目/科/屬）
```

### 查詢流程

1. GBIF `/species/suggest` 提供搜尋自動補全
2. 使用者選定後，GBIF `/species/match` 取得 `usageKey` + 完整分類階層
3. Wikidata `haswbstatement:P846={usageKey}` → `wbgetentities` 取 zh-tw 標籤
4. 若 Wikidata 無結果 → TaiCOL `/v2/taxon?scientific_name=...` 取 `common_name_c`
5. 若仍無結果 → 高階分類（界到科）使用本地靜態對照表

### 高階分類中文名對照表（常用）

| 英文 | 中文 | 階層 |
|------|------|------|
| Animalia | 動物界 | Kingdom |
| Plantae | 植物界 | Kingdom |
| Fungi | 真菌界 | Kingdom |
| Chordata | 脊索動物門 | Phylum |
| Arthropoda | 節肢動物門 | Phylum |
| Mammalia | 哺乳綱 | Class |
| Aves | 鳥綱 | Class |
| Reptilia | 爬蟲綱 | Class |
| Amphibia | 兩棲綱 | Class |
| Actinopterygii | 條鰭魚綱 | Class |
| Insecta | 昆蟲綱 | Class |
| Carnivora | 食肉目 | Order |
| Primates | 靈長目 | Order |
| Rodentia | 齧齒目 | Order |
| Felidae | 貓科 | Family |
| Canidae | 犬科 | Family |
| ... | ... | ... |

（完整對照表見 `backend/app/services/taxonomy_zh.py`）

## 資料儲存

- 中文名稱快取於 `species_cache.common_name_zh` 欄位
- 高階分類中文名不另建表，由靜態對照表 + Wikidata/TaiCOL 即時補充
- 英文學名始終保留於 `scientific_name` 欄位，供親緣演算法使用
