# ADR-005: 中文名稱多來源 Fallback

**狀態**：Accepted
**日期**：2026-02-01

## 背景

VTaxon 面向台灣使用者，物種名稱需要顯示繁體中文。然而：

- GBIF 本身不提供中文名稱
- 單一外部來源的覆蓋率不足（Wikidata 約 60%、TaiCOL 偏台灣本土物種）
- 外部來源偶爾有錯誤（如 Wikidata 上某些物種的中文名稱是簡體或錯誤）
- 高階分類（門、綱、目）的中文名稱相對固定，可用靜態表

## 決定

採用四層 Fallback Chain，依優先順序逐層嘗試：

### Fallback Chain

**實作**（`backend/app/services/chinese_names.py`）：

```
Layer 0: 靜態覆蓋表（手動修正已知錯誤）
  ↓ miss
Layer 1: TaiCOL（台灣物種名錄，by scientific name）
  ↓ miss
Layer 2: Wikidata（by GBIF taxon ID，P846 屬性）
  ↓ miss
Layer 3: 靜態分類表（高階分類的中文名稱）
```

### 各層細節

| 層 | 來源 | 查詢方式 | 覆蓋範圍 | 特殊處理 |
|----|------|---------|---------|---------|
| 0 | 靜態覆蓋 | taxon_id 對照 | 已知錯誤修正 | — |
| 1 | TaiCOL | scientific name | 台灣本土物種 | 防護：total > 5000 時跳過（TaiCOL 的 bug） |
| 2 | Wikidata | GBIF ID (P846) | 全球物種 | 語言優先：`zh-tw` → `zh-hant` → `zh`；OpenCC s2twp 簡轉繁 |
| 3 | 靜態表 | scientific name | 門/綱/目/科 | 僅高階分類 |

### Wikidata 批量查詢

`get_chinese_names_batch(gbif_ids)` 支援每次最多 50 筆的批量查詢，用於分類樹 API 等需要一次取得多筆中文名稱的場景。

### 快取持久化

查詢到的中文名稱會寫入 `species_cache` 表的 `common_name_zh` 欄位，後續查詢直接從 DB 取得，不再呼叫外部 API。`path_zh` (jsonb) 儲存路徑各階級的中文名稱。

## 後果

- 四層 fallback 讓中文名稱覆蓋率達到 80%+
- TaiCOL 有回傳全量資料的 bug（查詢未識別的 taxon_group 時），需要 total ≤ 5000 的防護
- Wikidata 的中文名稱可能是簡體，需要 OpenCC 轉換
- 靜態覆蓋表需要手動維護，但案例很少
- 首次查詢某物種時可能較慢（需呼叫外部 API），之後從 DB 快取讀取
