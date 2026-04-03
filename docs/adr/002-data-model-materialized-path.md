# ADR-002: 資料模型 — Materialized Path 分類樹

**狀態**：Accepted
**日期**：2026-01-15

## 背景

生物分類學是天然的樹狀結構（界→門→綱→目→科→屬→種）。VTaxon 需要：

1. 快速查詢某節點的所有後代（分類樹展開）
2. 判斷兩個物種的祖先-後代關係（衝突檢測）
3. 前綴查詢取得子樹（分類樹 API）

## 選項

### A. Adjacency List（parent_id）
- 優點：簡單、更新容易
- 缺點：查詢子樹需遞迴 CTE，深層查詢效能差

### B. Nested Set（lft / rgt）
- 優點：子樹查詢 O(1)
- 缺點：插入 / 移動節點需大量更新、GBIF 資料結構不穩定時維護成本高

### C. Materialized Path
- 優點：前綴查詢配合 `text_pattern_ops` 索引高效、祖先檢測只需 `startswith`、易於理解
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

### 索引策略

```sql
CREATE INDEX idx_species_cache_taxon_path
  ON species_cache (taxon_path varchar_pattern_ops);
```

`varchar_pattern_ops` 讓 `LIKE 'prefix%'` 查詢走索引，支援前綴查詢。

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
- 分類樹 API 可用 `WHERE taxon_path LIKE 'prefix%'` 高效取得子樹
