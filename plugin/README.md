# Draw One · ChatGPT Plugin 私人測試版

只使用產品既有的 260 支籤與來源欄位。沒有 AI 解讀、神諭、反思對話、付費功能或私有研究內容。

## 啟動與檢查

Node.js 22 或以上。從本目錄執行：

```sh
npm ci
npm run build
npm test
npm start
```

本機 MCP：`http://127.0.0.1:8787/mcp`。`npm run build` 先跑原有 fail-closed 建置，再以固定欄位白名單產生公開籤池與最小報告，並複製抽籤規則；啟動時再次核對籤池 SHA-256。資料改動後必須重新建置。

## 資料與隱私

問題留在 widget 的 browser localStorage（空白問題使用 sessionStorage），沿用產品 `draw-policy.js` 的一事一籤與跨籤系不重抽規則。問題不送往 MCP；伺服器不保存使用者資料。ChatGPT 中使用者自己輸入的對話仍由 ChatGPT 處理。MCP 工具結果會提供籤詩原文、版本名稱與核對狀態給 ChatGPT；不提供 source_locator、edition_id、source_file、source_sha256、研究定位與校勘帳本。

此版本沒有帳號或跨装置同步；不同裝置、儲存分區或清除資料後不共享綁定。若宿主禁用瀏覽器儲存，只能保留當次 widget 的記憶體綁定，介面會提示。抽籤工具 `draw_one_slip` 與取回工具 `get_draw_one_slip` 設為 app-only；模型使用 `open_draw_one` 開啟介面，使用者自行按抽籤。

工具保留 `VERIFIED`、`PROBABLE`，介面顯示「已對勘／待複核」，不把抄錄狀態轉成神明或預言的可信度。`interpretation` 保持 null，Astra 未審核的反思文字不接入。

## 部署與 ChatGPT 接入

部署只上傳本 `plugin/` 目錄到獨立 Node.js Vercel 專案，使用 `api/mcp.mjs` 與 `vercel.json`。不要更動原網站專案或 production 分支；不要上傳整個 repo 或私有研究。

需要一個 ChatGPT 能存取的 HTTPS `/mcp` 端點；Vercel 登入保護的 preview URL 不能直接供 ChatGPT 使用。測試端點僅提供既有公開籤資料，沒有帳號或秘密資料，沒有認證。

取得 HTTPS URL 後，在 ChatGPT Settings → Security and login 開啟 Developer mode，到 Plugins 加入 MCP 連線。名稱 Draw One，描述「抽一支籤，閱讀原文、版本與來源狀態」。開新對話選用 Plugin，輸入「開啟 Draw One」。

官方接入：https://developers.openai.com/plugins/build/app-quickstart

## 驗證邊界

MCP HTTP 測試可在本機完成。真正 ChatGPT iframe、host bridge、儲存分區及工具 app-only 限制必須在 ChatGPT 測一次後才能宣稱完成接入。公開目錄提交、隱私政策與正式發布另行審閱。
