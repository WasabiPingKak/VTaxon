# ADR-005: 中文名稱多來源 Fallback

**狀態**：Accepted
**日期**：2026-02-01
**最後更新**：2026-06-30

## 背景

VTaxon 面向台灣使用者，物種名稱需要顯示繁體中文。然而：

- GBIF 本身不提供中文名稱
- 單一外部來源的覆蓋率不足（Wikidata 約 60%、TaiCOL 偏台灣本土物種）
- 外部來源偶爾有錯誤（如 Wikidata 上某些物種的中文名稱是簡體或錯誤）
- 高階分類（門、綱、目）的中文名稱相對固定，可用靜態表
- GBIF 與 TaiCOL 的分類名稱有時不同步（GBIF 改名但 TaiCOL 仍用舊名）

## 決定

採用五層 Fallback Chain，依優先順序逐層嘗試。

### Fallback Chain

**實作**（`backend/app/services/chinese_names/resolution.py`）：

```
Layer 0: 靜態覆蓋表（手動修正已知錯誤）
  ↓ miss
Layer 1: TaiCOL（台灣物種名錄，by scientific name）
  ↓ miss
Layer 2: Wikidata（by GBIF taxon ID，P846 屬性）
  ↓ miss
Layer 3: GBIF synonyms → TaiCOL 重試（處理分類不同步）
  ↓ miss
Layer 4: 靜態分類表（高階分類的中文名稱）
```

### 各層細節

| 層 | 來源 | 查詢方式 | 覆蓋範圍 | 特殊處理 |
|----|------|---------|---------|---------|
| 0 | 靜態覆蓋 | taxon_id 對照 | 已知錯誤修正（~10 筆） | — |
| 1 | TaiCOL | scientific name | 台灣本土物種 | 防護：total > 5000 時跳過（TaiCOL 的 bug） |
| 2 | Wikidata | GBIF ID (P846) | 全球物種 | 語言 fallback + OpenCC + CJK 驗證（見下方） |
| 3 | GBIF synonyms | taxon_id → synonyms → TaiCOL | GBIF/TaiCOL 分類不同步的物種 | 最多嘗試 10 個同義名 |
| 4 | 靜態表 | scientific name | 界/門/綱/目/科/屬（~200 筆） | 僅高階分類；屬級 miss 時再走 GBIF match → Wikidata |

### Layer 2: Wikidata 查詢細節

Wikidata 查詢分兩步：

1. **找 entity**：用 `haswbstatement:P846={taxon_id}` 搜尋 Wikidata entity QID
2. **取 label**：用 QID 拿 `zh-tw` → `zh-hant` → `zh` 三層語言 fallback 的 label

**防禦邏輯**（`wikidata.py`）：

| 問題 | 處理 |
|------|------|
| zh-tw 標籤實際是簡體 | 所有回傳值過 OpenCC `s2twp`（簡體→台灣繁體） |
| `languagefallback` 回傳拉丁學名 | `_has_cjk()` 驗證必須含 CJK 字元，否則視為 miss |
| Wikidata 回屬級名稱（帶「屬」後綴） | species/subspecies 級自動去掉結尾「屬」字 |

### Layer 3: GBIF synonym fallback

處理 GBIF 與 TaiCOL 分類名稱不同步的情境。

**實際案例**：GBIF 將蝴蝶 *Everes argiades* 改名為 *Elkalyce argiades*，但 TaiCOL 仍收錄舊名 *Everes argiades*。直接用新名查 TaiCOL 會 miss。

**做法**（`resolution.py:_resolve_via_gbif_synonyms`）：

1. 向 GBIF 拿該 taxon_id 的 synonyms（最多 10 筆）
2. 逐一用 synonym 的 `canonicalName` 去 TaiCOL 查中文名
3. 查到即回傳，不再嘗試後續 synonym

### 別名解析

除了主要中文名稱，系統也解析別名（`_resolve_alternative_names`）：

1. TaiCOL 的 `alternative_name_c` 欄位
2. Wikidata 的 `zh-tw` / `zh-hant` / `zh` aliases

別名清洗（`clean_alt_names`）移除：與主名重複的、結尾帶「屬」或「科」的、不含 CJK 字元的、NFC 正規化後的重複項。

僅 SPECIES / SUBSPECIES / VARIETY / FORM 級才解析別名，高階分類回傳 None。

### 快取與持久化

```
_resolve_chinese_name()     ← @lru_cache(maxsize=500)，同 process 內秒回
        ↓ 首次 miss
外部 API 查詢（TaiCOL / Wikidata / GBIF）
        ↓ 查到
寫入 DB species_cache.common_name_zh + alternative_names_zh
        ↓
下次同物種：LRU（同 process）→ DB（跨 process）→ 外部 API
```

- `_resolve_chinese_name` 和 `_resolve_rank_zh` 都有 `@lru_cache(maxsize=500)`
- 查到的結果由 `enrichment.py:_enrich_chinese_names` → `_cache_enriched_species` 寫回 DB
- `path_zh`（JSONB）儲存路徑各階級的中文名稱，API 序列化時直接用

### 高階分類中文名稱（enrichment 階段）

`_enrich_chinese_names()` 在物種級 fallback 之外，還負責填充路徑中每一階的中文名：

1. **靜態表**：`get_taxonomy_zh_for_ranks()` 一次查 kingdom/phylum/class/order/family/genus
2. **genus fallback**：靜態表 miss 時走 `_resolve_genus_zh()` → GBIF match → Wikidata
3. **高階分類回填**：如果物種級 `common_name_zh` 仍為空，用對應 rank 的 `{rank}_zh` 回填

### Circuit Breaker 整合

每個外部服務都有獨立的 Circuit Breaker 保護（見 [ADR-011](011-circuit-breaker.md)）：

| 服務 | CB 實例 | failure_threshold | recovery_timeout |
|------|--------|:-:|:-:|
| TaiCOL | `taicol_cb` | 5 | 120s |
| Wikidata | `wikidata_cb` | 5 | 120s |
| GBIF（synonym 查詢） | `gbif_cb` | 5 | 60s |

CB OPEN 時該層直接跳過，不阻塞使用者請求。enrichment 服務（TaiCOL、Wikidata）的降級策略是回傳空值，搜尋結果缺少中文名但不中斷。

### Wikidata 批量查詢

`get_chinese_names_batch(gbif_ids)` 支援每次最多 50 筆的批量查詢（Wikidata `wbgetentities` API 限制），用於分類樹 API 等需要一次取得多筆中文名稱的場景。

## 關鍵檔案

| 檔案 | 職責 |
|------|------|
| `services/chinese_names/resolution.py` | 核心 fallback chain + LRU cache |
| `services/chinese_names/enrichment.py` | 批量 enrichment + 別名清洗 |
| `services/chinese_names/taicol_search.py` | TaiCOL 中文搜尋整合 |
| `services/wikidata.py` | Wikidata API client + OpenCC 轉換 |
| `services/taicol.py` | TaiCOL API client + Circuit Breaker |
| `services/taxonomy_zh.py` | 靜態覆蓋表 + 靜態分類表（~200 筆） |

## 後果

- 五層 fallback 讓中文名稱覆蓋率達到 80%+
- TaiCOL 有回傳全量資料的 bug（查詢未識別的 taxon_group 時），需要 total ≤ 5000 的防護
- Wikidata 的中文名稱可能是簡體，需要 OpenCC 轉換；`languagefallback` 可能回傳拉丁名，需 CJK 驗證
- GBIF synonym fallback 解決了分類名稱不同步的問題，但增加了一次額外的 GBIF API 呼叫
- 靜態覆蓋表需要手動維護，但案例很少（~10 筆）
- 首次查詢某物種時可能較慢（需呼叫外部 API），之後從 LRU cache 或 DB 讀取
- 三個外部服務各自有 Circuit Breaker，持續故障時自動降級而非阻塞
