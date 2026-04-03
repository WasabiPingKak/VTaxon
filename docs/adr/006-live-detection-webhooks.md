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
- `live_streams` 的 UNIQUE 約束確保不會重複記錄同一直播
