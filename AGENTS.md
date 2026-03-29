# AGENTS.md

本檔案供所有 AI Agent（Claude、ChatGPT、Copilot 等）掃描此 repo 時參考。

## Project Overview

VTaxon 是一個面向 Vtuber 社群的公開服務，將 Vtuber 角色的形象特徵對應到現實世界的生物分類學體系（界、門、綱、目、科、屬、種），以分類樹的形式呈現角色之間的關聯。使用者透過 YouTube / Twitch OAuth 登入後，可標註自己角色的物種特徵（支援複合種），並瀏覽所有已建檔角色的分類樹。

**已上線運作**：https://vtaxon.com/

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript, Vite |
| Backend | Flask + Python, SQLAlchemy, Supabase PostgreSQL, GBIF Species API, Wikidata / TaiCOL |
| Auth | Supabase Auth (OAuth → JWT, ES256 JWKS) |
| Infrastructure | Google Cloud Run (asia-east1), Firebase Hosting, GitHub Actions CI/CD |

### Architecture

- **生物分類資料**：GBIF API 即時查詢 + PostgreSQL 快取（`species_cache` 表）
- **幻想物種**：獨立分類系統（`fictional_species` 表），以文化來源為主軸
- **角色粒度**：一個頻道 = 一個角色，支援複合種（多物種特徵等權）

## Encoding

- 本專案所有檔案一律使用 **UTF-8（無 BOM）**
- 讀寫檔案時必須明確指定 `encoding="utf-8"`（Python）或等效參數
- Terminal 輸出預設 UTF-8；若在 Windows cmd/PowerShell 環境下遇到亂碼，先執行 `chcp 65001`
- **若掃描本 repo 時出現亂碼，是掃描端環境的編碼設定問題，非本專案檔案編碼錯誤**
