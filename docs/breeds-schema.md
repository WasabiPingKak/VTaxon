# 品種（Breeds）表 Schema 設計

> 本階段僅設計 schema，待分類法 UI 穩定後再實作。

## 背景

部分物種（如貓、犬）擁有大量人工培育品種。品種不屬於生物分類學的正式階層，但對 Vtuber 角色標註有重要意義（例如「英國短毛貓」vs.「暹羅貓」）。

## Schema

```sql
-- 品種表：記錄人工培育品種，掛在 species_cache 下
CREATE TABLE breeds (
    id          SERIAL PRIMARY KEY,
    taxon_id    INTEGER NOT NULL REFERENCES species_cache(taxon_id),
    name_en     TEXT NOT NULL,                -- 英文品種名
    name_zh     TEXT,                         -- 中文品種名
    breed_group TEXT,                         -- 品種群（如 Shorthair、Herding）
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(taxon_id, name_en)
);

-- 在 vtuber_traits 新增 breed_id（可選）
ALTER TABLE vtuber_traits
    ADD COLUMN breed_id INTEGER REFERENCES breeds(id);
```

## 關聯說明

- `breeds.taxon_id` → `species_cache.taxon_id`：品種必須掛在一個具體物種下
- `vtuber_traits.breed_id` → `breeds.id`：角色特徵可選擇指定品種（nullable）
- 一個物種可有多個品種；一個品種只屬於一個物種

## 未來考量

- 品種資料來源：可手動管理，或從外部 API（如 TheCatAPI、TheDogAPI）匯入
- 品種圖片：未來可加 `image_url` 欄位
- 品種搜尋：前端選定物種後，可進一步選擇品種
