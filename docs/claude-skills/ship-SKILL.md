---
name: ship
description: 將目前 feature branch 的修改 commit、merge 到 develop 並 push。在需要交付程式碼時使用。
---

# Ship to Develop

將目前 feature branch 的修改合併到 develop 並推送。

1. 確認目前分支。如果在 feature branch 上，繼續。如果在 main，**停止並警告**。
2. Stage 所有修改，用描述性的 commit message 提交。
3. 如果在 worktree 中，切換回主 repo（`D:\Github_Local_Workspace\VTaxon`），不要在 worktree 內 checkout develop。
4. 將 feature branch merge 到 develop。
5. Push develop 到 origin。
6. 確認：印出 commit hash 和分支狀態。
