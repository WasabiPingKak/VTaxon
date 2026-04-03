# ADR-010: GBIF usageKey 重新分配與重複記錄處理

**狀態**：Proposed
**日期**：2026-04-03

## 背景

VTaxon 使用 GBIF 的 `usageKey`（整數）作為 `species_cache` 表的 primary key（`taxon_id`），並以此作為 FK 關聯到 `vtuber_traits`、`breeds` 等表。

然而 GBIF 會因為分類修訂、資料清理等原因，對同一物種重新分配 usageKey。例如「家犬 *Canis lupus familiaris*」原本 key 為 `A`，某天 GBIF 改為 `B`。此時：

1. **舊記錄（key=A）不會消失**：`vtuber_traits`、`breeds` 等表的 FK 仍指向 A
2. **新記錄（key=B）被建立**：使用者再次搜尋同一物種時，GBIF 回傳新 key，系統新增一筆 cache
3. **結果**：同一物種在 `species_cache` 中有兩筆記錄，分類樹上出現重複節點

### 影響範圍

| 表 / 功能 | 受影響程度 | 說明 |
|-----------|-----------|------|
| `species_cache` | 直接受影響 | 同一物種產生兩筆記錄 |
| `vtuber_traits` | 間接受影響 | 新舊使用者可能綁定不同 key，同一物種在分類樹上分裂成兩個節點 |
| `breeds` | **已有 fallback** | 查不到時會用 `scientific_name` 比對其他 `taxon_id` |
| 分類樹 API | 間接受影響 | 兩個 key 各自產生獨立子樹 |

## 選項

### A. 維持現狀 + 局部 Fallback（目前做法）

- 僅在 `breeds` 查詢時以 `scientific_name` 做 fallback
- 其他表不處理，依賴 GBIF key 穩定性
- **優點**：零開發成本
- **缺點**：分類樹重複節點問題無解、隨時間累積風險

### B. 定期 Reconciliation Job

建立排程任務，定期比對 `species_cache` 中相同 `scientific_name` 但不同 `taxon_id` 的記錄：

1. 向 GBIF API 查詢該物種的當前 accepted key
2. 將所有相關表的 FK 統一指向當前 key
3. 刪除過期的 cache 記錄

- **優點**：根本解決重複問題、所有表一致
- **缺點**：需處理 FK 更新的事務安全性、排程維運成本

### C. 寫入時即時偵測合併

在 `_cache_species()` 寫入新記錄前，先查詢是否已有相同 `scientific_name` 的舊記錄：

1. 若有，更新舊記錄的 `taxon_id` 為新 key（或反向更新 FK）
2. 合併後只保留一筆記錄

- **優點**：即時處理、不需排程
- **缺點**：修改 PK 的操作複雜且危險；同名不同物種（如亞種）可能誤合併

### D. 引入 Stable ID 層

新增 `canonical_species` 表作為穩定的內部 ID，`species_cache` 的 GBIF key 降級為可變的外部參考：

```
canonical_species (stable_id PK, scientific_name UNIQUE)
  ↑ 1:N
species_cache (taxon_id PK, stable_id FK)
  ↑
vtuber_traits, breeds 等表改為 FK → stable_id
```

- **優點**：徹底解耦、不怕 GBIF 換 key
- **缺點**：大規模 schema 變更、所有 FK 需 migration、過度設計風險

## 決定

選擇 **方案 A（維持現狀）**，並做以下補強：

1. **擴展 fallback 範圍**：未來若在分類樹或其他功能發現實際影響，優先將 breeds 的 `scientific_name` fallback 模式推廣到受影響的查詢
2. **監控**：若發現分類樹出現重複節點，再評估升級為方案 B（Reconciliation Job）
3. **本 ADR 記錄此已知風險**，避免未來重複調查

### 選擇理由

- GBIF key 重新分配在實務上極少發生（大多數物種的 key 多年不變）
- 目前 VTaxon 收錄的物種數量有限（< 1000），重複機率低
- 方案 B/C/D 的開發成本與目前的風險不成比例
- breeds 的 fallback 已證明此模式可行，需要時可快速推廣

## 後果

- 此問題仍為已知風險，尚未根本解決
- `breeds.py` 的 `scientific_name` fallback 是唯一的防護線，其他功能仍依賴 key 穩定性
- 若未來物種數量增長或 GBIF 大規模重整 key，需重新評估升級為方案 B
- 程式碼中的相關註解（`models.py:149-156`、`breeds.py:90-92`）指向本 ADR
