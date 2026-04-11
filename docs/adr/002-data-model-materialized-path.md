# ADR-002: 資料模型 — Materialized Path 分類樹

**狀態**：Accepted
**日期**：2026-01-15

## 背景

生物分類學是天然的樹狀結構（界→門→綱→目→科→屬→種）。VTaxon 需要：

1. API 回傳整棵分類樹給前端時，每筆資料能自帶完整祖先鏈，前端不需再查或自行組樹
2. 後端在新增 trait 時判斷兩個物種的祖先-後代關係（衝突檢測）

## 選項

### A. Adjacency List（parent_id）
- 優點：簡單、更新容易
- 缺點：API 要回傳整棵樹給前端時，需在後端 JOIN 或前端自行組樹

### B. Nested Set（lft / rgt）
- 優點：子樹查詢 O(1)
- 缺點：插入 / 移動節點需大量更新、GBIF 資料結構不穩定時維護成本高

### C. Materialized Path
- 優點：每筆 entry 自帶完整祖先鏈，API 序列化簡單、前端直接 `split('|')` 即可建樹；祖先檢測只需 Python 的 `startswith`
- 缺點：路徑長度隨深度增長、移動節點需更新所有後代路徑

## 決定

選擇 **方案 C — Materialized Path**，使用 `|` 分隔符。

### 路徑格式

固定 7 位置對應 7 個標準分類階級，缺失階級用空字串填充：

```
Kingdom|Phylum|Class|Order|Family|Genus|Species
Animalia|Chordata|Mammalia|Carnivora|Canidae|Vulpes|Vulpes vulpes
Animalia|Cnidaria|||||                  ← 只到門的高階分類
```

亞種、亞門等非標準階級在第 8 位以後附加科學名稱。

### 雙分類系統

| 表 | 路徑欄位 | 用途 |
|----|---------|------|
| `species_cache` | `taxon_path` | 現實物種（GBIF） |
| `fictional_species` | `category_path` | 虛構物種（自建） |

兩套分類系統完全獨立，不共用路徑空間。

### 祖先-後代衝突檢測

`backend/app/services/traits.py` 的 `_validate_real_species()` 利用路徑前綴比對：

```python
# 新物種是現有特徵的後代（更具體）→ 自動替換
if new_path.startswith(existing_path + "|"):
    db.session.delete(existing_trait)

# 新物種是現有特徵的祖先（更寬泛）→ 拒絕 409
elif existing_path.startswith(new_path + "|"):
    return 409  # ancestor_blocked
```

設計原則：**允許精化（自動升級），禁止泛化（阻止回退）**。

### Partial Unique Index

```sql
CREATE UNIQUE INDEX uq_vtuber_traits_user_taxon
  ON vtuber_traits (user_id, taxon_id) WHERE taxon_id IS NOT NULL;

CREATE UNIQUE INDEX uq_vtuber_traits_user_fictional
  ON vtuber_traits (user_id, fictional_species_id) WHERE fictional_species_id IS NOT NULL;
```

同一使用者不能重複標同一物種，但現實 / 虛構分開追蹤。

## 後果

- 路徑重建函式 `_build_taxon_path()` / `_realign_taxon_path()` 需處理 GBIF 資料的不一致性（缺失階級、亞門等）
- 移動物種節點需更新所有後代的 `taxon_path`——但 GBIF 資料變動極少
- 目前架構是「整棵樹一次給前端」，沒有「依子樹分頁載入」的 API

## 實作現況

`init.sql` / `init_staging.sql` 中存在兩個 `text_pattern_ops` 索引：

```sql
CREATE INDEX idx_species_cache_taxon_path
  ON species_cache(taxon_path text_pattern_ops);

CREATE INDEX idx_fictional_species_category_path
  ON fictional_species(category_path text_pattern_ops);
```

**這兩個索引目前未被任何 SQL 查詢使用**。原因是現行架構選擇「整棵樹一次給前端」，後端沒有「給定前綴撈子樹」的 API；後端僅有的祖先比對發生在 `services/traits.py` 內，使用 Python 的 `startswith`，不是 SQL `LIKE`。

也就是說，Materialized Path 在這個專案的真實價值是：

1. **API 序列化便利**：每筆 entry 自帶完整祖先鏈，前端 `split('|')` 即可直接建樹
2. **後端祖先檢測**：`startswith` 比對不需 JOIN

**索引保留**而非刪除，因為：

- 索引佔用空間極小（`species_cache` ~7k 列、`fictional_species` 更少）
- 若未來改為 viewport-based loading（只先載骨架、節點展開時 lazy fetch 子樹），就會出現 `WHERE taxon_path LIKE 'prefix%'` 查詢，屆時索引立即可用
- 拿掉再加回來需要一次 migration，沒必要折騰

> ⚠️ 修改本 ADR 或 schema 前請先 grep 一次 `taxon_path.*like` / `category_path.*like`，確認沒有新增的查詢依賴這些索引。
