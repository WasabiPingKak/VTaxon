---
name: changelog
description: 產出更新日誌：搜尋 commit → 完整報告 → 使用者版 changelog → 推特文案
user_invocable: true
---

# /changelog — 更新日誌產出流程

以 main 分支上的**版本 tag** 控制區間。

用法：
- `/changelog` — 不下參數，自動找出最新的 tag 作為 `<end-tag>`，前一個 tag 作為 `<start-tag>`
- `/changelog v0.2.0` — 產出 v0.2.0 的 changelog（從上一個 tag 到 v0.2.0 之間的改動）
- `/changelog v0.1.0 v0.3.0` — 產出從 v0.1.0 到 v0.3.0 之間的改動

## 流程

### Step 0：建立新 tag 並確認區間

1. 列出所有版本 tag：`git tag --sort=-version:refname`
2. 詢問使用者要為目前最新的 commit 打上什麼 tag 名稱（例如 `changelog-v3`）。
3. 在 main 分支的最新 commit 上建立該 tag：`git tag <new-tag>`，並推送到遠端：`git push origin <new-tag>`。
4. 新建立的 tag 即為 `<end-tag>`，前一個既有的 tag 為 `<start-tag>`。
5. 若沒有前一個 tag，則用第一筆 commit 作為起點。
6. 向使用者確認區間後繼續。

### Step 1：蒐集 commit

執行以下指令蒐集區間內所有 commit（含所有分支 merge 進 develop / main 的內容）：

```bash
git log <start-tag>..<end-tag> --all --oneline --no-merges
```

以**功能面向**分類整理所有改動（不是按 commit 順序），依使用者體感影響排序。

### Step 2：產出完整報告

將整理結果寫入 `docs/changelogs/<end-tag>/full-report.md`。

格式參考 `docs/changelogs/changelog-v3/full-report.md`：
- 以功能面向分章節（物種搜尋、分類樹、虛構物種…）
- 每個改動都列出，包含技術細節
- 依使用者體感影響排序

**寫完後暫停，請使用者確認 full-report 內容再繼續。**

### Step 3：產出使用者版 changelog

根據使用者確認的 full-report，精煉為 `docs/changelogs/<end-tag>/changelog.md`。

格式參考 `docs/changelogs/changelog-v3/changelog.md`：
- 去掉技術細節，著重使用者體感改善
- 用使用者看得懂的語言描述
- 保留 markdown 格式（h2 分章節、ul 列點、strong 強調、table 對照）

**寫完後暫停，請使用者確認 changelog 內容再繼續。**

### Step 4：產出推特文案

根據使用者確認的 changelog，轉為推特文案 `docs/changelogs/<end-tag>/twitter.md`。

格式參考 `docs/changelogs/changelog-v3/twitter.md`：
- 去掉所有 markdown 格式符號（#、**、- 等）
- 用全形符號（━、・、▸、〈〉）和全形空白縮排取代 markdown
- 章節標題用 ━━━ 全形線分隔
- 子列表用全形空白縮排

**寫完後暫停，請使用者確認推特文案。**

### Step 5：建立 meta.json

在 `docs/changelogs/<end-tag>/meta.json` 建立 metadata 檔案：

```json
{
  "date": "<上線日期，格式 YYYY/M/D，只放結束日期不放區間>",
  "title": "<版本摘要>"
}
```

前端 `ChangelogPage.jsx` 使用 `import.meta.glob` 自動掃描所有 changelog 目錄，不需要手動修改。
