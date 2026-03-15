# VTaxon 改動整理（changelog-v3 → changelog-v4）

以功能面向分類，依使用者體感影響排序。

---

## 1. 分類樹 — 視覺預算機制（全新功能）

### 核心機制
- **視覺預算機制**：依 VTuber 登記的物種數量增加自動降低顯示等級，減少分類樹視覺雜訊。閾值分為三級：1~4 種正常顯示、5 種以圓點取代、6 種以上折疊隱藏
- **+N 位 badge**：超過閾值的 VTuber 以父節點上的「+N 位」badge 呈現，點擊可展開查看所有隱藏節點
- **代表物種豁免**：使用者設定的**代表物種**不受視覺預算限制，至少會有一個節點會永遠以正常等級顯示

### 視覺預算細節修正
- 數量同步、配色區分（dot tier 有獨立配色）、定位修復、dot tier 直播狀態正確顯示
- breed 節點補上 drawBudgetBadge，品種節點也能顯示隱藏的 VTuber 數量
- 所有定位/聚焦入口（搜尋、定位自己、URL 跳轉）會自動展開 budget group，確保隱藏節點可被找到
- +N 位 badge 支援獨立點擊，節點收合時自動重置 budget group
- badge hover 效果與父節點 hover 分離，避免視覺干擾
- grid layout 排除 dot tier 節點，避免 grid connector 畫出不正確的長垂直線
- 展開 +N 位後，dot vtubers 併入 grid 排列而非獨立顯示
- drawBudgetBadge 補上 state 參數修復 ReferenceError

### 代表物種 fallback
- 未設定代表物種的使用者自動以第一個 trait 作為代表，確保直播篩選與視覺預算機制正常運作

---

## 2. 分類樹 — 排版優化

### 移除「未指定品種」虛擬節點
- 移除分類樹中的「未指定品種」虛擬節點，簡化樹結構

### 間距與重疊修正
- 統一 block-based 壓縮處理 grid / breedGrid / nonGrid 之間的間距
- 壓縮 vtuber grid 與 breed 節點之間的多餘間距
- 不同類型 block 間距不足導致線圖交錯的問題修正
- intermediate level 在 vtuber 與 breed 共存時不再錯誤啟用
- intermediate level vtuber 節點高度計算改進，避免與子節點重疊
- intermediate level 改用 push-down 策略，避免 vtuber 文字重疊

---

## 3. SEO 優化

- **VTuber 個人頁面動態 meta tag**：/vtuber/:userId 頁面會注入動態 og:title、og:description、og:image 等 meta tag，分享連結時能正確預覽 VTuber 的名稱與頭像

---

## 4. 前端效能與體驗修正

### 效能優化
- D3 轉換清理、TreeNode memo 優化，減少不必要的 re-render
- 前端效能優化與記憶體洩漏修復

### UI 體驗
- 統一所有可滾動面板的卷軸樣式（套用 .vtaxon-scroll），視覺一致
- 手機版進階設定與篩選 BottomSheet UI 優化
- navbar 圖鑑計數在新增/刪除 trait 後自動更新，不再需要重新整理頁面
- 儲存個人資料後「有未儲存的變更」狀態正確清除

---

## 5. 後端修正

- **/api/live-status 500 修復**：primaries dict key 為 UUID 物件無法 JSON 序列化，改為字串 key
- **Twitch EventSub 409 修復**：重複訂閱返回 409 時不再誤判為 failed，正確識別為已訂閱狀態

---

## 6. 維運工具

- 加入 **detect-secrets** pre-commit hook，防止意外提交敏感資訊（API key、密碼等）
