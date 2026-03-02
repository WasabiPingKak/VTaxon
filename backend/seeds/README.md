# Seeds 種子資料說明

所有 SQL 檔案都在 Supabase SQL Editor 中執行，執行前請確認 `supabase/init.sql` 的 schema 已經建好。

## 檔案說明

### `fictional_species.sql`
**用途**：初始化奇幻生物分類資料（`fictional_species` 表）。

包含東方神話（日本、中國）、西方神話（希臘、北歐等）等分類體系的預建資料。

**何時執行**：首次部署後執行一次。資料為靜態預建，不需要重複執行。

---

### `breeds.sql`
**用途**：匯入品種資料（`breeds` 表），涵蓋家犬（915 種）、家貓（134 種）、家馬（668 種）。

由 `scripts/fetch_breeds_wikidata.py` 自動生成。中文名稱優先順序：Wikipedia zh-tw > Wikidata zh-tw > Wikidata zh。

檔案開頭會先確保母物種存在於 `species_cache`（ON CONFLICT DO NOTHING），再插入品種資料。所有 INSERT 使用 `ON CONFLICT DO UPDATE`，可安全重複執行。

**何時執行**：
- 首次部署後執行一次
- 重新生成品種資料後（重新跑 `scripts/fetch_breeds_wikidata.py`），直接再執行一次即可覆蓋

**前置條件**：`breeds` 表需有 `wikidata_id` 和 `source` 欄位（`init.sql` 已包含）。

---

### `test_data.sql`
**用途**：插入分類樹測試用的假資料，包含 `species_cache`（多種動物）和 `users` + `vtuber_traits`（測試用虛擬 Vtuber）。

所有測試使用者的 `organization` 設為 `'__TEST__'`，方便辨識和清除。

**何時執行**：本地開發或 staging 環境需要測試分類樹功能時。**不要在 production 執行**。

---

### `cleanup_test_data.sql`
**用途**：清除 `test_data.sql` 插入的測試資料。

刪除所有 `organization = '__TEST__'` 的使用者，`vtuber_traits` 會透過 `ON DELETE CASCADE` 自動清除。`species_cache` 保留不動（可能被真實使用者共用）。

**何時執行**：測試完畢後，執行此檔一鍵清除測試資料。

---

### `backfill_path_zh.sql`
**用途**：為 `species_cache` 中已存在的物種回填 `path_zh`（分類路徑中文名 JSON）。

以手動條列的方式覆蓋常見分類（哺乳綱食肉目、鳥綱、爬行綱等）。**注意：此檔只覆蓋明確列出的分類，未列出的不會被填入**。未覆蓋的項目會在分類樹 API（`/taxonomy/tree`）首次存取時透過靜態表 + Wikidata 自動回填。

**何時執行**：
- 新增 `path_zh` 欄位後執行一次（批次填入）
- 清空 `path_zh` 後需要快速回填時

---

## 執行順序建議（首次部署）

```
1. supabase/init.sql          -- 建表
2. fictional_species.sql      -- 奇幻生物
3. breeds.sql                 -- 品種資料
4. (可選) test_data.sql       -- 測試資料
5. (可選) backfill_path_zh.sql -- 中文路徑回填
```

## 重新生成品種資料

```bash
# 1. 執行腳本（需要 Python 環境 + requests + opencc）
python scripts/fetch_breeds_wikidata.py

# 2. 產出的 SQL 會自動寫入 backend/seeds/breeds.sql

# 3. 到 Supabase SQL Editor 執行 breeds.sql
```
