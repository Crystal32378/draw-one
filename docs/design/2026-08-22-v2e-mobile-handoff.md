# Draw One｜V2E Mobile Round Handoff — 2026-08-22

作者：飛寶（Fable 5）。接手的工作對話先讀這份＋
`2026-08-21-v2c-v2e-sound-weather-handoff.md`（架構與契約）＋
`docs/testing/qa-cheatsheet.md`（dev 後門）。

## 座標

- Branch：`fable/v2e-touch-sound` @ **d1ba4a7**（已 push）
- 福已 gate 的 frozen baseline：**24fab12**（V2E）；其上累積 **6 個 delta 未 gate**（見下）
- 測試全綠：e2e 42／sound 60／arrival 27／pool 60／slip 14
- 本機 LAN server 供 iPhone 測試：`cd ~/Documents/奧德賽/draw-one-v2b && python3 -m http.server 8788 --bind 0.0.0.0`
  → `http://<Mac IP>:8788/paper/arrival.html`（IP 用 `ipconfig getifaddr en0` 查）

## 已完成（24fab12 之後的 6 個 delta，內容都驗過本機 WebKit/chromium）

| SHA | 內容 |
|---|---|
| e1f10cc | 刻字回聲：拿了票，void 刻字尾綴天氣字（常日不刻） |
| 158e457 | iOS 產圖隱形字：SVG-image @font-face 無限 FOIT → 重繪到取樣簽名穩定 |
| 2574ac0 | 匾同規格字隨匾（>3字 ×3/字數）＋max-height:720 殿內收斂＋tube-wrap 削 headroom |
| cb2ef3b | iOS 選字劫持 pull→禁 user-select/callout；提示上移；換幕 auto-scroll（stickStage/slipStage） |
| d1ba4a7 | 步向案前：進殿聖號一息後鏡頭走到案前框住儀式（半露筒攔截捲頁的根治） |
| （文件）| qa-cheatsheet 加一事一籤逃生說明、E11 手機迴歸擴充 |

## 需要驗收

1. **Crystal iPhone 真機走一輪**（最後一次卡在「滑不動」，d1ba4a7 後未重測）：
   薄門檻拿票 → 進天上聖母 → 鏡頭步向案前 → 按住上抽（不卡、不跳選字）→
   換幕自動端上取籤詩 → 紙 → 收籤 → 籤簿帶走 → **share 圖上有字**。
   提醒她：重測抽籤要寫新問題（一事一籤）。
2. 全過後 → **交福 mini gate**（6 delta 打包；描述照上表＋殘餘風險：
   iOS lifecycle 已標準處理、真機音量僅 Crystal 校過 speaker 未校 AirPods）。

## 尚待解決／等開題

- **deploy**（Crystal 開題）：「複製連結」、Discord 群組導流（她每天分享日籤到
  Discord——share artifact 有真實日常觀眾）、免 LAN server 的真機測試全靠它。
- 小螢幕取捨已接受待複核：籤枝全拉出頭 140→86px；進殿鏡頭走位的節奏
  （650ms 一息）聽 Crystal 真機手感再微調。
- Future（未拍板勿假決策）：Temporal/Ritual states、bell、錄音資產邊界、
  常日是否永遠＝cloudy。

## 這輪的工程教訓（別再踩）

- 半露的互動元件停在捲頁熱區＝手勢衝突——擠像素救不了，要用空間語言
  （鏡頭跟身體）解。
- 手機三症狀（按不出來/籤筒消失/滑不動）同根：殿內直欄溢出摺線＋
  touch-action:none 的筒。
- 聲音層註解禁寫 S1 grep 字面（第三次了）。
- 主 clone `draw-one-repo` 有未提交變更勿動；`~/Documents/奧德賽 2` 絕對不清；
  專案不搬家（大G 拍板，搬家 SOP 在專案記憶）。
