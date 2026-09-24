# 作品來源與保存

Draw One 中秋 2026 季節入口。視覺與互動創作：Astra；產品方向與審定：Crystal。

此套件由獨立原型匯入，原型完成 commit：`5bc39160b9c73165b406fcaf19991e4f5b018730`。程式、前端、字體與選定截圖逐一比對 SHA-256 後 copy-first 保存。`SHA256SUMS` 涵蓋匯入檔案；不包含這份說明、README 或後續補充文件。

## 天文與圖像

- [NASA 2026 年 9 月觀星指南](https://science.nasa.gov/solar-system/skywatching/whats-up-september-2026-skywatching-tips-from-nasa/)：9 月 26 日收穫月、土星與海王星的觀賞提示；依原文日期標示，未當成台灣即時星圖。
- [NASA Moon Phase and Libration, 2026](https://svs.gsfc.nasa.gov/5587/)：月面影格 6450，2026-09-26 17:00 UTC。Credit: NASA's Scientific Visualization Studio。影格由 LRO 探測資料視覺化而來，非即時攝影。`moon-source.json` 保留官方 metadata。
- [台灣政府 115 年辦公日曆](https://www.dgpa.gov.tw/information?pid=12574&uid=82)：中秋日期為 9 月 25 日。

原始月面檔案隨作品保存；CSS 調色、圓形裁切、浮動及月暈僅是作品呈現。裝飾星點與連線不模擬真實天體位置、星座或運動。NASA 資料用於觀月，與籤意解讀無關；非 NASA 合作或背書。

## 字體

Noto Serif TC 與 Noto Sans TC，沿用 Draw One 的字體系統。頁面固定文案所需字元由 Google Fonts 提供子集；SIL Open Font License 與字體檔皆放在 `public/assets/`。`scripts/prepare-fonts.py` 可重新取得子集。沒有將任何問卷回覆送給字體服務。

## 資料界線

此匯入不包含問卷回覆、瀏覽器私有資料、`.env`、node_modules、原型 `.git` 或私人研究檔。測試中的回答都是明確的合成測試資料。
