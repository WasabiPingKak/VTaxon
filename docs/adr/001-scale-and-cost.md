# ADR-001: 規模定位與成本策略

**狀態**：Accepted
**日期**：2026-01-15

## 背景

VTaxon 的目標使用者是台灣 Vtuber 社群，預估活躍使用者在數百至千人等級。使用者標註自己的物種特徵後幾乎不再寫入，讀取流量集中在分類樹瀏覽，且分類資料變動頻率低。

專案由個人開發者維運，需要在功能完整性與營運成本之間取得平衡。

## 選項

### A. 全託管 SaaS 堆疊（Firebase 全家桶）
- 優點：零後端維運
- 缺點：複雜查詢受限、vendor lock-in、成本隨流量增長不可控

### B. 傳統 VPS（DigitalOcean / Linode）
- 優點：完全控制
- 缺點：需自行維護 OS / DB / SSL、固定月費

### C. Serverless + 託管 DB（Cloud Run + Supabase）
- 優點：scale-to-zero、免費額度足夠、保留完整後端彈性
- 缺點：冷啟動延遲、進程內狀態不共享

## 決定

選擇 **方案 C**：Cloud Run 單 service + Supabase 免費方案，月成本趨近 $0。

核心原則：**能用 in-memory 解決的不引入外部服務**。

| 元件 | 當前實作 | 擴展切換點 |
|------|---------|-----------|
| 快取 | 進程內 TTL cache（300s） | 環境變數切換至 Redis |
| Rate Limiting | `memory://`（Flask-Limiter） | `RATE_LIMIT_STORAGE_URL` 切換至 Redis |
| 背景任務 | Cloud Tasks（僅 WebSub 續訂） | 擴充 queue 即可 |
| 水平擴展 | Cloud Run max-instances=1 | 調整 max-instances |

## 後果

- Cloud Run 冷啟動約 2-3 秒，Flask 啟動需精簡 import、延遲載入非必要模組
- Gunicorn 2 workers，每個 worker 持有獨立 cache 副本——在目前規模下可接受
- Supabase 免費方案有 500MB 儲存限制，需注意 species_cache 資料量
- 未來若社群擴大至數千人以上，需評估 Redis + 多 instance 方案
