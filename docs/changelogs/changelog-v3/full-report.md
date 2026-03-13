# VTaxon 改動整理（changelog-v2 → changelog-v3）

以功能面向分類，依使用者體感影響排序。

---

## 1. 直播狀態偵測（全新功能）

### 後端 — Twitch EventSub
- **Twitch 直播偵測完整實作**：透過 EventSub webhook 接收 stream.online / stream.offline 事件，即時更新資料庫中的直播狀態
- Twitch 開播時透過 **Helix API 抓取直播標題**，顯示於前端資訊卡
- 新增 Twitch EventSub **分批重建腳本**，避免一次性重建訂閱造成 Cloud Run timeout
- CI/CD 補齊 Twitch secrets 與 WEBHOOK_BASE_URL，修正路由衝突

### 後端 — YouTube PubSubHubbub
- **YouTube PubSubHubbub 直播偵測完整實作**：透過 WebSub 訂閱 YouTube 頻道 feed，偵測新影片/直播發布事件
- channel_url 更新時**自動觸發直播訂閱**（YouTube WebSub / Twitch EventSub），使用者不需手動操作

### 前端 — 分類樹 Canvas
- Canvas 節點下方加 **LIVE 紅色徽章**（含脈動白點動畫）
- **直播中節點光暈效果**：直播中的 VTuber 節點外圈加紅色光暈
- 直播中節點顏色優先權提升為最高，確保直播狀態在視覺上最突出

### 前端 — 側邊欄與篩選
- Canvas 側邊欄新增**「直播中」篩選按鈕**，一鍵篩選出所有正在直播的 VTuber
- 直播篩選啟用時**自動展開**直播節點的樹路徑，方便快速定位
- 側邊欄自動載入物種分類 + 直播狀態指示器

### 前端 — 直播置頂專區
- **強化直播狀態視覺效果**：置頂專區 + 紅框卡片 + Canvas 光暈
- 支援**雙平台同時直播**的資訊卡顯示（YouTube + Twitch 同時開播時並列顯示）

### 前端 — VTuber 詳細面板
- VtuberDetailPanel 直播狀態強化：**頭像紅框 + LIVE 徽章 + 直播連結**
- VTuber 個人頁面新增直播狀態顯示

### 後端 — 直播訂閱狀態追蹤
- oauth_accounts 新增 **live_sub_status / live_sub_at** 欄位，記錄 Twitch EventSub / YouTube WebSub 訂閱結果
- 新增**重新訂閱 API**，供使用者在訂閱失敗時自助修復

### 前端 — 直播訂閱狀態 UI
- 訂閱失敗時帳號設定頁顯示**警告 Banner**，提供「重新訂閱」按鈕一鍵修復
- 訂閱成功時 ChannelCard 顯示**綠點「直播通知已啟用」**

### 前端 — YouTube 權限引導
- YouTube 權限未授權時顯示**說明 modal**（含截圖引導），引導使用者授權 youtube.readonly
- 替換 YouTube 權限說明截圖為有標註箭頭的版本，更直觀
- YouTube 權限 modal 觸發條件修正：移到 provider_token 檢查之外
- YouTube 權限警告條件改為只檢查 channel_url
- YouTube 權限警告改為帳號設定頁 **inline 區塊**（取代 modal），減少干擾

---

## 2. 圖鑑頁面改進

### 排序功能擴充
- 圖鑑頁新增**「活躍優先」「組織」排序**模式 + 全模式直播置頂
- **活躍優先排序 + 動態 Badge**：依登錄時間排序，並顯示「N分鐘前」「N小時前」「N天前」等時間標籤
- 每日隨機排序（同一天固定順序）

### 直播優先 Toggle
- 圖鑑頁直播優先改為**可選 Toggle Pill**，預設不置頂，由使用者自行決定是否將直播中的角色排在最前

### 時間 Badge 樣式
- 登錄順序 badge 改用**配色漸變**取代透明度，視覺更清晰
- 登錄順序 badge 7~30 天改用「N週前」顯示
- 登錄順序 badge 依時間遞減透明度
- 直播結束 30 分鐘內顯示「N分鐘前」取代「剛結束」
- 直播結束 60 分鐘內顯示分鐘數，修正「0小時前」問題
- 直播活動時間標籤加上「出沒」後綴

### 列表修正
- 圖鑑列表組織欄允許換行 + 物種欄加 tooltip

---

## 3. 分類樹 UI

### 節點配色重構
- **重新分配 user 節點配色語意**：依用途（當前使用者、直播中、一般）區分顏色
- Navbar「定位自己」按鈕改回桃紅色（當前使用者語意）

### 其他 UI 調整
- 移除 FocusHUD 方向鍵切換提示文字
- FloatingToolbar 深色薄捲軸，貼合網站主題

---

## 4. 直播狀態顯示修正

- 直播狀態「尚未開台」改為「無資料」，語意更準確
- 直播中節點顏色優先權提升為最高

---

## 5. 虛構物種

### 新增虛構物種（1 個）
- **貓亞人（Cat Demihuman）**：新增虛構物種

---

## 6. 帳號設定

- 帳號設定頁顯示**實際頻道連結**，取代原本的「已設定頻道連結」純文字

---

## 7. 使用者體驗修正

- YouTube 使用者頭像 fallback：avatar_url 為 null 時補上 Google 帳號頭像

---

## 8. 更新日誌系統

- 新增 changelog-v2 更新日誌，重整 changelog 目錄結構
- 修正 changelog-v1 import 路徑
- changelog 頁面加入**折疊功能**與排版優化
- changelog 附魂體物種名稱改用中文

---

## 9. 維運工具

- 新增本機 **DB 備份腳本**（pg_dump public schema）
- 新增 DB 備份使用指南（scripts/BACKUP.md）
- 更新 README.md 對齊目前實作狀態
