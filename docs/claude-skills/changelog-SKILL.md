---
name: changelog
description: 產出更新日誌：搜尋 commit → 完整報告 → 使用者版 changelog → 推特文案
user_invocable: true
---

# /changelog — 更新日誌產出流程

接受兩個參數：**起始日期** 和 **結束日期**（格式 YYYY-MM-DD）。

用法：`/changelog 2026-03-07 2026-03-10`

## 流程

### Step 1：蒐集 commit

執行以下指令蒐集所有 commit（含所有分支 merge 進 develop / main 的內容）：

```bash
git log --since=<start-date> --until=<end-date> --all --oneline --no-merges
```

以**功能面向**分類整理所有改動（不是按 commit 順序），依使用者體感影響排序。

### Step 2：產出完整報告

將整理結果寫入 `docs/changelogs/<end-date>/full-report.md`。

格式參考 `docs/changelogs/2026-03-10/full-report.md`：
- 以功能面向分章節（物種搜尋、分類樹、虛構物種…）
- 每個改動都列出，包含技術細節
- 依使用者體感影響排序

**寫完後暫停，請使用者確認 full-report 內容再繼續。**

### Step 3：產出使用者版 changelog

根據使用者確認的 full-report，精煉為 `docs/changelogs/<end-date>/changelog.md`。

格式參考 `docs/changelogs/2026-03-10/changelog.md`：
- 去掉技術細節，著重使用者體感改善
- 用使用者看得懂的語言描述
- 保留 markdown 格式（h2 分章節、ul 列點、strong 強調、table 對照）

**寫完後暫停，請使用者確認 changelog 內容再繼續。**

### Step 4：產出推特文案

根據使用者確認的 changelog，轉為推特文案 `docs/changelogs/<end-date>/twitter.md`。

格式參考 `docs/changelogs/2026-03-10/twitter.md`：
- 去掉所有 markdown 格式符號（#、**、- 等）
- 用全形符號（━、・、▸、〈〉）和全形空白縮排取代 markdown
- 章節標題用 ━━━ 全形線分隔
- 子列表用全形空白縮排

**寫完後暫停，請使用者確認推特文案。**

### Step 5：提示更新前端

提醒使用者在 `frontend/src/pages/ChangelogPage.jsx` 新增這個版本：

1. 在檔案頂部加一行 import：
   ```js
   import changelog_<date_underscored> from '../../../docs/changelogs/<end-date>/changelog.md?raw';
   ```

2. 在 `versions` 陣列開頭加一筆：
   ```js
   {
     date: '<顯示日期>',
     title: '<版本摘要>',
     content: changelog_<date_underscored>,
   },
   ```
