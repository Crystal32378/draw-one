# 月圓了｜Draw One 中秋 2026

一個有作者、有日期、有資料來源，也有一輪月亮的 Draw One 季節入口。

深綠夜空、真實月面，逐漸走進紙與籤的世界。視覺與互動創作：Astra。本套件可在本機執行，也提供 Netlify Preview 接線；不修改既有抽籤程式或 Draw One 的 Vercel 正式站。

## 打開作品

Node.js 22 以上；執行原型不需要安裝套件。

```sh
cd seasonal/mid-autumn-2026
npm start
```

開啟 **http://localhost:4173/**。`PORT=4180 npm start` 可更換埠。前台伺服器只監聽本機 127.0.0.1。

內容包括中秋祝福、觀月札記、抽籤後的三段旅程，以及三題匿名回饋。抽籤與返回廟埕的按鈕連向既有 Draw One。AI 對話標為新體驗預告，沒有偽裝已接上正式聊天服務。

月面緩慢浮動、月暈呼吸、星光漸成紙上墨點。可暫停動態，也尊重系統減少動態設定。全頁使用 Noto Serif TC 與 Noto Sans TC，主要文字與問卷選項維持大字。

## 問卷去哪裡看？

在另一個終端執行：

```sh
cd seasonal/mid-autumn-2026
npm run admin
```

開啟 **http://localhost:4175/**，可以看前兩題的選項分布、逐筆閱讀第三題，並匯出 UTF-8 CSV。時間以台北時區顯示。

回覆儲存在本機 `data/feedback.jsonl`。前台與管理頁預設讀寫同一目錄；它已排除 Git，沒有公開讀取端點。若改存其他位置，兩個程序都設定相同的 `FEEDBACK_DIR`：

```sh
FEEDBACK_DIR=/absolute/private/path npm start
FEEDBACK_DIR=/absolute/private/path npm run admin
```

前兩題必填，第三題可留白，最多 200 個 Unicode 字元。確認寫入成功後，整個填答邀請與表單退場，才顯示完成卡；失敗會保留答案。相同送出重試不重複存入。

管理服務是本機只讀工具，驗證 loopback Host、Origin 與 Fetch Metadata，不接受其他來源讀取，不提供刪除操作。CSV 對公式開頭做跳脫。

## Netlify Preview 與私有 Forms 後台

本次僅建立 draft Preview，不 merge PR、不執行 Production Publish。部署專案為 `draw-one-midautumn-2026`（Decode team）；Netlify Forms 自動偵測已啟用。Preview URL 與讀回／刪除測試證據交付在 Draw One PR #35。

公開版資料流：

```text
瀏覽器的三題表單
  → POST /（application/x-www-form-urlencoded）
  → Netlify Forms：draw-one-midautumn-2026
  → Netlify 私有 Forms 後台（登入後查看／匯出 CSV）
```

[開啟 Netlify Forms 後台](https://app.netlify.com/projects/draw-one-midautumn-2026/forms)。Preview 的回答不會寫入本機 JSONL，也不會出現在本機 admin；本機工具仍獨立保留。

- 頁面內有不可見的 static form，供 Netlify 在部署時偵測。名稱為 `draw-one-midautumn-2026`，含 `q1`、`q2`、`q3`、`submission-id` 與 honeypot `bot-field`。
- 真正的問卷有 hidden `form-name`，AJAX 用 `URLSearchParams` 編碼。三題文字、選項、視覺及成功狀態不變。
- `feedback-config.js` 在本機預設為 `local`；Netlify build 的公開產物改為 `netlify`，沒有依 hostname 猜測，也不會在雲端失敗後偷偷改寫本機 API。
- 只有成功 HTTP 回應才顯示完成卡；HTTP 錯誤、斷線與逾時保留回答，沒有自動重送。空 honeypot 以外的值不會送出。
- 保留按鈕防重複點擊與穩定 `submission-id`。**Netlify Forms 未提供本機 JSONL 的 UUID 去重保證**；若網路在遠端已收件後中斷，再按重試可能有重複紀錄，需以 `submission-id` 辨識。不能將此平台行為描述成 exactly-once。
- Netlify 可能將提交列入 Spam；後台同時可檢查 verified 與 spam。未新增 email 或 webhook 通知。

### 部署與公開範圍

從 Draw One repo 根目錄執行：

```sh
netlify deploy --context deploy-preview \
  --site 17b9efec-4782-474c-9a18-7aa384d09a7e \
  --alias pr-35
```

這是 CLI draft Preview；不加 `--prod`、`--prod-if-unlocked`，也不從 Netlify UI 按 Publish。repo 根目錄的 `netlify.toml` 以 `npm --prefix seasonal/mid-autumn-2026` 建置，publish 明確設為 `seasonal/mid-autumn-2026/dist/netlify`；production context 的 build command 故意失敗，以避免誤觸正式建置。這個 build guard 不是平台層的發布權限鎖，操作者仍須遵守 Preview-only 範圍。

`build-netlify.mjs` 以固定 allowlist 複製前端檔案及圖片／字體／授權，重建乾淨輸出。公開產物不包含 `admin/`、server、測試、`.env`、`.git`、CSV、JSONL 或任何既有回覆；沒有 SPA catch-all 或公開讀取回答的 API。`.netlify/` 與 `dist/` 均排除 Git。

本機工具仍照前述指令使用；兩種資料儲存互相獨立。若需公開正式發布，另經審定後處理，這一回合不做。

## 驗證與來源

```sh
npm ci
npm test
npm run test:ui
```

UI 測試使用本機 Google Chrome；4174、4176 埠與 `/tmp/drawone-midautumn-*` 下的測試目錄只供合成測試，與實際回覆分離。

- [驗證紀錄](docs/VERIFICATION.md)
- [資料、影像與字體來源](docs/PROVENANCE.md)
- [匯入檔案雜湊](docs/SHA256SUMS)
- [桌面全頁](evidence/prototype-1440-full.png)
- [手機全頁](evidence/prototype-390-full.png)
- [送出完成畫面](evidence/prototype-mobile-thanks.png)

Netlify 接線依據：[Forms setup](https://docs.netlify.com/manage/forms/setup/)、[Form submissions](https://docs.netlify.com/manage/forms/submissions/)、[CLI draft deploy](https://cli.netlify.com/commands/deploy/)。

月面及觀月事實引用 NASA 官方來源，字體採 SIL OFL；資料僅用於天文觀測，與籤意解讀無關。裝飾星點、連線與光影不是真實星圖，也不代表 NASA 合作或背書。
