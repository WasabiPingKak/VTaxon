# ADR-003: 認證與安全架構

**狀態**：Accepted
**日期**：2026-01-15

## 背景

VTaxon 需要讓 Vtuber 透過 YouTube / Twitch 平台帳號登入，確認身份後編輯自己的物種資料。系統需要：

1. 支援多平台 OAuth（YouTube / Twitch）
2. 單一使用者可綁定多個平台帳號
3. 安全儲存 OAuth token（用於直播狀態查詢等功能）
4. 前後端分離架構下的 JWT 驗證

## 決定

### 認證層：Supabase Auth

前端使用 Supabase Auth SDK 處理 OAuth 流程，後端驗證 Supabase 發出的 JWT。

**前端流程**（`frontend/src/lib/AuthContext.tsx`）：
1. 使用者點擊登入 → `supabase.auth.signInWithOAuth()`
2. OAuth callback → Supabase 發出 JWT
3. 前端取得 `provider_token`，呼叫 YouTube API 取得頻道資料
4. 呼叫後端 `/auth/callback` 建立 / 更新 VTaxon 使用者
5. 後續 API 請求帶 `Authorization: Bearer <JWT>`

**帳號聯結**：透過簽名的 link token 機制，防止跨帳戶聯結。`sessionStorage` 暫存 `vtaxon_pending_link`。

### JWT 驗證：ES256 + JWKS

**後端實作**（`backend/app/auth.py`）：
- 從 Supabase JWKS 端點取得 ES256 公鑰
- JWKS 快取 TTL 1 小時（`_JWKS_TTL = 3600`）
- 驗證失敗時自動 `force_refresh` JWKS 並重試一次（處理 key rotation）
- `@login_required` / `@admin_required` 裝飾器保護端點

### OAuth Token 加密：Google Cloud KMS

**實作檔案**：
- `backend/app/utils/kms_crypto.py` — 加解密函式
- `backend/app/utils/encrypted_type.py` — SQLAlchemy `EncryptedText` 自訂型別

**設計**：
- `access_token` / `refresh_token` 透過 KMS 對稱金鑰加密後 base64 存入 DB
- SQLAlchemy `TypeDecorator` 讓 ORM 層透明加解密
- 開發環境無 KMS 時自動降級為明文儲存
- 舊的未加密值自動偵測並逐步遷移

### Webhook 簽名驗證

| 平台 | 演算法 | 實作位置 |
|------|--------|---------|
| Twitch EventSub | HMAC-SHA256 | `backend/app/services/twitch.py` |
| YouTube PubSubHubbub | HMAC-SHA1 | `backend/app/services/youtube_pubsub.py` |

兩者皆使用 `hmac.compare_digest()` 防止時序攻擊。

### 前端安全標頭

Firebase Hosting 設定（`firebase.json`）：

- **CSP**：限制 `script-src`、`connect-src`、`frame-src` 白名單
- **HSTS**：`max-age=63072000; includeSubDomains; preload`（2 年）
- **其他**：`X-Content-Type-Options: nosniff`、`X-Frame-Options: SAMEORIGIN`、`Permissions-Policy` 禁用攝影機/麥克風/定位

### 權限模型

- `users.role`：`admin` | `user`
- 頻道主只能編輯自己的資料（JWT 中的 `user_id` 比對）
- Admin 擁有全域讀寫權限
- `auth_id_aliases` 表處理 Supabase 跨 email OAuth 建立的多個 auth.users 映射回同一 VTaxon user

## 後果

- Supabase 免費方案的 auth 功能足夠，但受限於其 OAuth provider 支援範圍
- KMS 加密增加了外部依賴，但 token 安全性是剛需
- JWKS 快取 + retry 機制確保 key rotation 不會導致服務中斷
- `EncryptedText` TypeDecorator 讓加密對業務邏輯透明，但 DB 內的值無法直接查詢
