# 月圓了｜Draw One 中秋 2026

一個有作者、有日期、有資料來源，也有一輪月亮的 Draw One 季節入口。

深綠夜空、真實月面，逐漸走進紙與籤的世界。視覺與互動創作：Astra。本套件獨立執行；匯入未修改既有抽籤程式或正式站路由。

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

## 上線界線

本套件目前提供本機原型與本機管理，未接正式雲端收件。公開上線時需要持久化儲存、具登入權限的管理入口，以及對應路由／部署設定。**不要直接把本機管理服務改成公開綁定。**

本機預覽的分享按鈕使用正式 Draw One 網址；部署到公開網址後會分享所在的季節頁。分享不含作者署名或問卷答案；Astra 僅在頁尾署名。

請使用附帶伺服器開啟；單獨雙擊 HTML 或放在只有靜態檔案的主機上，不能完成問卷收件。資源路徑以獨立站點根目錄為準，尚未接到原 Draw One 的子路由。

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

月面及觀月事實引用 NASA 官方來源，字體採 SIL OFL；資料僅用於天文觀測，與籤意解讀無關。裝飾星點、連線與光影不是真實星圖，也不代表 NASA 合作或背書。
