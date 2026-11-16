# Draw One｜進度與接手入口

更新：2026-11-16（台灣）。這是找最新版、已完成工作及待辦的入口；歷史 handoff 保留原文，遇到狀態差異以本頁日期與實際 Git refs／部署查核為準。

## 先找這三個位置

- **正式網站**：[Draw One](https://draw-one-crystals-projects-0006cdef.vercel.app/)；第二網址 https://draw-one-one.vercel.app/ 。
- **目前正式版來源**：[fable/reading-final](https://github.com/Crystal32378/draw-one/tree/fable/reading-final)，已部署的精確 commit [`a98991a`](https://github.com/Crystal32378/draw-one/commit/a98991a4fd1556ce6eeb7c9914168b7a19aa5b3c)。
- **GitHub main**：本次核對仍為 [`a7b0dc5`](https://github.com/Crystal32378/draw-one/commit/a7b0dc55ce18307b2bf5e20c227d12158b16bbf1)。**main 尚未包含已部署的新版本，不要把 clone 預設分支當作線上最新版。** 本次只補文件，不合併、不重新部署。

## 11/15 工作已保存在哪裡

昨天交接的 18 檔整合包已由 [`4d9a63d`](https://github.com/Crystal32378/draw-one/commit/4d9a63d) 接入；逐檔 SHA-256 與原交接 manifest 的 18/18 檔相符。聖意整合包由 [`020f626`](https://github.com/Crystal32378/draw-one/commit/020f626) 接入，後續前台整合為 `a98991a`。以上皆已在遠端 `fable/reading-final` 的歷史中，不需重套舊 patch。

依用途閱讀（以下固定到已部署版本，避免分支後續更新造成混淆）：

1. [11/15 廟埕與資料門檻延續](https://github.com/Crystal32378/draw-one/blob/a98991a4fd1556ce6eeb7c9914168b7a19aa5b3c/docs/handoffs/2026-11-15-corpus-experience-continuation.md)
2. [飛寶接手整理](https://github.com/Crystal32378/draw-one/blob/a98991a4fd1556ce6eeb7c9914168b7a19aa5b3c/docs/handoffs/2026-11-15-fable-takeover-handoff.md)
3. [三殿解籤與校對館完整交接](https://github.com/Crystal32378/draw-one/blob/a98991a4fd1556ce6eeb7c9914168b7a19aa5b3c/docs/handoffs/2026-11-15-fable-latest-handoff.md)
4. [聖意整合與顯示邊界](https://github.com/Crystal32378/draw-one/blob/a98991a4fd1556ce6eeb7c9914168b7a19aa5b3c/docs/handoffs/2026-11-15-shengyi-integration.md)

歷史交接寫「尚未推送／尚未部署」描述的是當時，不是目前狀態。早期本機工作區仍保留未提交候選，不要直接整批提交或覆蓋較新的整合結果。

## 已完成

- 廟埕、徵求校對公告與三殿閱讀流程整合；三隻麻雀、長凳／腳踏車落點及原鳥聲保留。
- 觀音／關帝解曰與聖意顯示來源、候選狀態與疑字；不把待複核升級成已驗證。
- 校對館獨立入口與三組頁面、搜尋、進度篩選、欄位收合及窄畫面卡片。
- 已核定籤詩修正與原籤／筆記相容性整合；缺字不自行補齊。
- 11/16 第五輪預覽驗收後，經 Crystal 同意更新正式網站；保留舊部署供回復。

## 驗收證據與界線

- 牛牛：桌機瀏覽器實走；390×844、390×601 wrapper＋合成 PointerEvent 模擬，非手機／LINE 實機。三殿、校對館與收籤／重看／筆記通過；先前 404 是測試程式錯改網址，已撤回。
- Crystal：已自行走過桌機、聲音與開頁；表示稍後補手機及 LINE 實測。
- 正式部署後：兩正式網址共 70/70 HTTP 與檔案雜湊核對通過；隔離瀏覽器的 hosted 流程 45/45 通過。涵蓋抽籤、入簿、筆記重載、同題跨殿原籤、三殿解讀、缺文不補、故障隔離及測試問題／筆記未外傳。
- Hosted 測試只把原 file:// 的網路白名單改為精確 HTTPS 靜態資產 URL；產品程式未為測試修改。這不是全 260 籤逐字學術驗證，也不是手機或 LINE 認證。

## 下一輪待辦（未完成）

- 手機／LINE 內建瀏覽器實測：新頁、聲音、短視窗高度與實際觸控。
- 聖母殿 **59 筆短聖意候選**已在求籤頁，但尚未同步校對館；校對館目前保留欄位與來源位置，不以空欄暗示研究完成。
- 清除搜尋鈕目前只清輸入，需要再按搜尋才復原清單。
- 同頁與新頁兩種校對館連結：統一使用語意，再看 LINE 行為。
- 看過即自動入簿與「收進籤簿」按鈕的關係需確認，不先把既有設計當 bug 改掉。
- 自訂折疊按鈕與 details 的鍵盤／輔助科技行為，需專項檢查。
- 保留 [#42](https://github.com/Crystal32378/draw-one/issues/42)、[#43](https://github.com/Crystal32378/draw-one/issues/43)、[#44](https://github.com/Crystal32378/draw-one/issues/44) 的後續體驗事項；既有測試通過不代表所有原驗收條件已逐一完成。
- 精確原圖對應與可公開呈現範圍仍須逐項核對，不拿別籤圖片替代。

## 發布與接手規則

正式站使用經挑選的公開 runtime／校對館檔案，另保留舊公開前端深連結；**不是把整個 repository 當網站上傳**。不得公開私人 /review、完整研究資料、原始私人 JSON、憑證或使用者問題／筆記。本頁不收錄私人測試紀錄、個人裝置路徑或登入資訊。

Netlify 中秋站與 ChatGPT plugin 本次沒有更新。下一位接手先核對遠端 refs、正式網址與最新決策，再選獨立工作分支。不要為了讓 main 看起來一致而直接合併，也不要重做既有研究。
