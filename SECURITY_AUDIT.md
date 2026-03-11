# VTaxon 安全性審計報告

**審計日期**: 2026-03-06
**審計範圍**: 全棧（後端 Flask API、前端 React SPA、CI/CD 基礎設施）
**嚴重性等級**: CRITICAL > HIGH > MEDIUM > LOW

---

## 摘要

| 嚴重性 | 數量 | 說明 |
|--------|------|------|
| CRITICAL | ~~2~~ 0 | ~~帳號接管、JWT 算法降級~~ 已全數修復 |
| HIGH | ~~3~~ 0 | ~~CORS 萬用字元、缺少 Rate Limiting、缺少安全標頭~~ 已全數修復 |
| MEDIUM | ~~5~~ 0 | ~~快取刷新濫用、JWKS 無 TTL、SQL 字串拼接、Health 端點資訊洩漏、錯誤訊息洩漏~~ 已全數修復 |
| LOW | 5 | 依賴未鎖定版本、localStorage 認證狀態、前端快取無上限、enum 未集中管理、provider 欄位無約束 |

---

## ~~CRITICAL-1: AuthIdAlias 帳號接管漏洞~~ ✅ 已修復

**狀態**: 已修復（2026-03-06）

**修復方式**: 以 HMAC-SHA256 簽章的 link token 取代裸 `link_to_user_id`。
- 新增 `POST /api/auth/link-token` 端點（需登入），簽發包含 `user_id`、`exp`（10 分鐘 TTL）、`nonce` 的 token
- `auth_callback()` 不再接受 `link_to_user_id`，改為驗證 `link_token`，驗簽失敗回傳 400
- 前端 `linkProvider()` 在 OAuth redirect 前先取得簽章 token 存入 localStorage
- 密鑰複用 `SUPABASE_JWT_SECRET`（透過 Google Secret Manager 管理）

---

## ~~CRITICAL-2: JWT HS256 降級攻擊風險~~ ✅ 已修復

**狀態**: 已修復（2026-03-06）

**修復方式**:
- JWKS 驗證硬編碼 `algorithms=['ES256']`，不再從 token header 讀取演算法（消除 algorithm confusion 反模式）
- HS256 fallback 改為預設關閉，需設定環境變數 `ALLOW_HS256_FALLBACK=1` 才啟用（緊急降級用）
- fallback 觸發時記錄 WARNING log
- `_get_signing_key()` 移除不必要的 RSA fallback（Supabase 使用 EC key）

---

## ~~HIGH-1: CORS 萬用字元配置~~ ✅ 已修復

**狀態**: 已修復（2026-03-06）

**修復方式**:
- `ALLOWED_ORIGINS` 預設值從 `'*'` 改為空字串
- `ProductionConfig.init_app()` 檢查：未設定時啟動報錯
- CORS 初始化邏輯：空字串時不啟用通配符，僅 development 模式允許寬鬆 CORS

---

## ~~HIGH-2: 缺少 Rate Limiting~~ ✅ 已修復

**狀態**: 已修復（2026-03-06）

**修復方式**:
- 新增 `flask-limiter` 套件，使用 `memory://` storage（Cloud Run 單 instance）
- 全域預設：100 req/min per IP
- Auth 端點：10 req/min per IP
- Species 搜尋：30 req/min per IP
- Taxonomy：30 req/min per IP
- Reports 檢舉：5 req/min per IP

---

## ~~HIGH-3: 缺少 HTTP 安全標頭~~ ✅ 已修復

**狀態**: 已修復（2026-03-06）

**修復方式**:
- Firebase Hosting（prod + staging）加入全域安全標頭：HSTS、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy
- Flask API 加入 `@after_request` hook：X-Content-Type-Options: nosniff、X-Frame-Options: DENY、Referrer-Policy
- CSP 留待後續處理（SPA 的 CSP 較複雜，避免影響正常功能）

---

## ~~MEDIUM-1: 快取刷新無權限控制~~ ✅ 已修復

**狀態**: 已修復（2026-03-11）

**修復方式**: `?refresh=1` 參數現在需要 admin 身份驗證。非 admin 使用者或未登入者的 refresh 請求會被忽略，直接返回快取。同時適用於 `/tree` 和 `/fictional-tree` 端點。

---

## ~~MEDIUM-2: JWKS 快取無 TTL / 無失敗重試~~ ✅ 已修復

**狀態**: 已修復（2026-03-11）

**修復方式**:
- JWKS 快取加入 1 小時 TTL（使用 `time.monotonic()` 計時）
- TTL 過期後自動重新拉取 JWKS
- JWT 驗證失敗時，自動 force refresh JWKS 並重試一次（處理 key rotation 場景）
- 拉取失敗時仍返回過期快取（graceful degradation）

---

## ~~MEDIUM-3: SQL 字串拼接（Country Filter）~~ ✅ 已修復

**狀態**: 已修復（2026-03-11）

**修復方式**: 將 f-string SQL 拼接改為 SQLAlchemy `text().bindparams()` 參數化查詢。country code 值透過 bind parameters 傳入，消除 SQL injection 反模式。

---

## ~~MEDIUM-4: Health 端點資訊洩漏~~ ✅ 已修復

**狀態**: 已修復（2026-03-11）

**修復方式**:
- 移除 `environment` 欄位
- DB 錯誤時只回傳 `"database": "error"`，詳細錯誤記錄到 server log

---

## ~~MEDIUM-5: 例外訊息洩漏到前端~~ ✅ 已修復

**狀態**: 已修復（2026-03-11）

**修復方式**: 所有外部 API 錯誤（GBIF search/match/children、OAuth sync）改為記錄詳細錯誤到 server log，回傳通用中文錯誤訊息給使用者。

---

## LOW-1: 依賴版本未精確鎖定

**檔案**: `backend/requirements.txt`

**問題**: 使用 `>=` 而非精確版本鎖定（如 `==` 或 lock file），可能在部署時引入破壞性更新。

```
flask>=3.0
PyJWT>=2.8
cryptography>=42.0
```

**修復建議**: 使用 `pip freeze > requirements.lock` 或導入 `pip-tools` 進行依賴鎖定。

---

## LOW-2: localStorage 儲存認證狀態（風險已降低）

**檔案**: `frontend/src/lib/AuthContext.jsx`

**問題**: `vtaxon_pending_link` 儲存在 localStorage，如果遭受 XSS 攻擊可能被讀取。

**目前狀態**: CRITICAL-1 修復後，localStorage 中存的是 HMAC 簽章的 link token（含 10 分鐘 TTL），而非裸 user UUID。即使被 XSS 讀取，token 也會在 10 分鐘後失效，且僅能用於綁定操作。風險已大幅降低。

**進一步改善建議**: 可改用 sessionStorage（隨分頁關閉清除）。

---

## LOW-3: 前端 API 快取無上限

**檔案**: `frontend/src/lib/api.js`

**問題**: Species search 和 taxonomy children 的記憶體快取（Map）沒有大小限制和 TTL，長時間使用可能導致記憶體成長。

**修復建議**: 加入 TTL（1 小時）和最大筆數限制（500 筆）。

---

## LOW-4: Flask SECRET_KEY 預設值

**檔案**: `backend/app/config.py:5`

**問題**: `SECRET_KEY` 有 hardcoded 預設值 `'dev-secret-key'`。雖然目前未用於 JWT 驗證（使用 Supabase JWKS），但如果未來啟用 Flask session，此預設值會成為嚴重風險。

```python
SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
```

**修復建議**: Production 環境移除預設值，改為 `os.environ['SECRET_KEY']`（缺少時直接報錯）。

---

## LOW-5: Provider 欄位缺少 DB 約束

**檔案**: `backend/app/models.py` (OAuthAccount.provider)

**問題**: `provider` 欄位為 Text 類型，無 CHECK constraint 限制為 `'youtube'` / `'twitch'`。

**修復建議**: 加入 `CheckConstraint("provider IN ('youtube', 'twitch')")`。

---

## 正面發現（已做好的安全措施）

- JWT Bearer token 認證（非 cookie），天然免疫 CSRF
- SQLAlchemy ORM 查詢普遍使用參數化（country filter 已改為 bindparams）
- 分頁結果有上限限制（100/50）
- OAuth account 有 ownership 驗證（`account.user_id != current_user_id` 檢查）
- IntegrityError race condition 處理
- Staging 有 `X-Robots-Tag: noindex`
- 外部連結皆有 `rel="noopener noreferrer"`
- 環境變數透過 Google Secret Manager 管理
- 前端未使用 `dangerouslySetInnerHTML`

---

## 修復優先順序

### 上線前必修（第一優先）
1. ~~**修復 AuthIdAlias 帳號接管漏洞** — CRITICAL-1~~ ✅
2. ~~**設定 Production CORS origins** — HIGH-1~~ ✅
3. ~~**移除或限制 JWT HS256 fallback** — CRITICAL-2~~ ✅
4. ~~**加入 Rate Limiting** — HIGH-2~~ ✅

### 上線後第一週
5. ~~加入 HTTP 安全標頭 — HIGH-3~~ ✅
6. ~~限制 cache refresh 為 admin — MEDIUM-1~~ ✅
7. ~~加入 JWKS TTL — MEDIUM-2~~ ✅
8. ~~清理錯誤訊息洩漏 — MEDIUM-4, MEDIUM-5~~ ✅

### 後續改善
9. ~~SQL parameterization 重構 — MEDIUM-3~~ ✅
10. 依賴版本鎖定 — LOW-1
11. 前端快取改善 — LOW-3
12. SECRET_KEY 預設值移除 — LOW-4
