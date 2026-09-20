# ADR-006: 直播狀態偵測 — Webhook 架構

**狀態**：Accepted
**日期**：2026-03-15

## 背景

VTaxon 希望在分類樹上即時顯示哪些 Vtuber 正在直播。需要支援 Twitch 和 YouTube 兩個平台，且盡量不消耗 API 額度。

## 選項

### A. 輪詢（Polling）
- 優點：實作簡單
- 缺點：延遲高、API 額度消耗大、Cloud Run 不適合跑常駐排程

### B. Webhook（Push）
- 優點：即時、幾乎零 API 額度消耗
- 缺點：需處理簽名驗證、訂閱管理、平台差異

## 決定

選擇 **方案 B — 純 Webhook 架構**，兩個平台分別整合：

### Twitch EventSub

**實作**（`backend/app/services/twitch.py`、`backend/app/routes/webhooks.py`）：

- **訂閱事件**：`stream.online` / `stream.offline`
- **驗證**：HMAC-SHA256（`Twitch-Eventsub-Message-Signature` 標頭）
- **認證**：Client Credentials flow，app access token 快取至過期
- **冪等處理**：409 Conflict 視為訂閱已存在（成功）
- **stream.online**：INSERT `live_streams` + 更新 `users.last_live_at`（IntegrityError 回退更新）
- **stream.offline**：DELETE `live_streams` 記錄

### YouTube PubSubHubbub

**實作**（`backend/app/services/youtube_pubsub.py`、`backend/app/routes/webhooks.py`）：

- **訂閱**：向 `pubsubhubbub.appspot.com` 發送 subscribe 請求
- **驗證**：HMAC-SHA1（`X-Hub-Signature` 標頭）
- **Atom Feed 解析**：從推送通知中提取 `yt:videoId` 和 `yt:channelId`
- **直播確認**：收到通知後呼叫 YouTube Data API 確認影片是否正在直播（`liveBroadcastContent == "live"` + `actualStartTime` 有值 + `actualEndTime` 無值）
- **@handle 正規化**：`/@handle` 格式的頻道 URL 會透過 API 解析為 `/channel/UCxxx` 格式

### 訂閱續訂：Cloud Tasks

YouTube PubSubHubbub 訂閱有效期有限，需定期續訂。

**實作**（`backend/app/utils/cloud_tasks_client.py`）：
- 使用 Google Cloud Tasks 佇列（`websub-subscribe`）批量分發續訂任務
- 目標：Cloud Run 服務自身的內部端點
- Fallback：Cloud Tasks 完全失敗時回退至同步模式

#### 佇列與排程設定（2026-09-20 補充）

佇列與排程都不在程式碼裡，由 `scripts/setup-websub-queue.sh` 建立與更新。staging 與 prod 共用同一個佇列。

| 設定 | 值 | 理由 |
|---|---|---|
| `maxAttempts` | 3 | 花費 = 頻道數 × 重試次數 × 每次卡住秒數，重試次數是最大的槓桿 |
| `minBackoff` / `maxDoublings` | 300s / 3 | hub 變慢時是整段時間都慢，馬上重打等於在同一個壞時段連打 |
| `maxConcurrentDispatches` | 1 | prod 是單一 instance、2 個 gunicorn sync worker，每個卡住的請求佔住一整個 worker，要留一個給使用者與 webhook |
| `maxDispatchesPerSecond` | 1 | 配合上一項，避免任務堆在 gunicorn 的等待佇列 |
| 續訂排程 | 每天 04:00（台北） | hub 租約固定 5 天，每天續訂要連續失敗 4 輪才會斷訊 |

**不要用 GCP 預設值建立佇列** 。預設是 `maxAttempts=100`、`minBackoff=0.1s`、同時派發 1000。2026-09 hub 回應變慢時，
每個頻道的續訂都卡滿逾時後被重試 100 次，prod 每日計費時間從約 0.25 小時變成最高 15.6 小時，持續 17 天才因帳單通知被發現。

#### 訂閱結果三態與驗證確認

`subscribe_channel()` 回傳 `LiveSubStatus`，寫入 `oauth_accounts.live_sub_status`：

- `subscribed`：hub 回 202/204
- `pending`：請求已送達但等不到回應（read timeout）。hub 忙碌時常常其實有收，只是很慢才回。
  `youtube-subscribe-one` 這時回 200，不讓 Cloud Tasks 重試
- `failed`：請求沒送到（連線失敗）或 hub 明確拒絕，回 500 讓 Cloud Tasks 重試

hub 之後會對 callback 發驗證 GET（`hub.mode=subscribe`），`GET /api/webhooks/youtube` 收到時把對應帳號翻成 `subscribed`。
無論帳號找不找得到、狀態更新成不成功，都一律回傳 `hub.challenge`，因為剛連結帳號時驗證可能比帳號 commit 更早到。

#### 續訂健康檢查

Cloud Tasks 模式下 `youtube-renew-subs` 只知道「派發成功」，後續 `subscribe-one` 大量失敗不會回報到任何地方。
每小時的 `alert-digest` cron 會先跑 `youtube_check_sub_health()`，從帳號上的訂閱狀態判斷：

- 超過 3 天沒有任何訂閱嘗試（續訂沒跑到）
- 狀態是 `failed`
- 狀態是 `pending` 且超過 6 小時沒被驗證確認

異常數達 5 個且佔比達 20% 記 `WEBSUB_RENEW_FAIL` warning，達 50% 記 critical。

### 前端 Live 狀態

**實作**（`frontend/src/hooks/useLiveStatus.ts`）：
- 60 秒輪詢 `/api/live` 端點取得當前直播清單
- 頁面隱藏時暫停輪詢，顯示時立即重新整理

### 資料模型

```sql
-- 每個 user 每個平台最多一筆 active stream
CREATE TABLE live_streams (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    provider VARCHAR(20),  -- youtube | twitch
    stream_id TEXT,
    stream_title TEXT,
    stream_url TEXT,
    started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    UNIQUE (user_id, provider)
);
```

## 後果

- Webhook 架構幾乎零 API 額度消耗，但需要公開端點和簽名驗證
- YouTube PubSubHubbub 不如 Twitch EventSub 可靠，需要額外的 API 確認步驟
- 訂閱續訂依賴 Cloud Tasks，需確保 Cloud Tasks API 已啟用（曾因未啟用導致靜默失敗）
- 佇列的重試設定直接決定 hub 異常時的花費上限，重建佇列一律用 `scripts/setup-websub-queue.sh`，不要手動建立
- `live_sub_status` 多了 `pending`：代表「已送出、等 hub 確認」，前端不把它當成失敗
- `live_streams` 的 UNIQUE 約束確保不會重複記錄同一直播
