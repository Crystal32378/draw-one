# Draw One｜V2E Mobile Round Handoff — 2026-08-22

作者：飛寶（Fable 5）。接手的工作對話先讀這份＋
`2026-08-21-v2c-v2e-sound-weather-handoff.md`（架構與契約）＋
`docs/testing/qa-cheatsheet.md`（dev 後門）。

> **FREEZE（2026-08-22 本輪收尾）：`43bd5e2` ＝ V2E final frozen baseline。**
> Gate 軌跡：福 final gate → FIX REQUIRED（唯一 blocker：malformed weather key
> 穿透 prototype chain）→ 修復 43bd5e2 → 大Ｇ代福 delta gate **PASS**。
> GitHub 無 CI，全套數字記作本機 evidence：pool 60／slip 14／arrival 27／
> sound 62／e2e 51，0 failed。本輪已關，往後改動＝新 delta，重新走 gate。

## 座標

- Branch：`fable/v2e-touch-sound` @ **43bd5e2**（已 push）
- **Frozen baseline：43bd5e2（V2E final，大Ｇ代福 delta gate 2026-08-22）**；
  前一凍結點 24fab12，其後 7 個 delta 全數 gated（見下）
- 測試全綠：e2e 51／sound 62／arrival 27／pool 60／slip 14
- 本機 LAN server 供 iPhone 測試：`cd ~/Documents/奧德賽/draw-one-v2b && python3 -m http.server 8788 --bind 0.0.0.0`
  → `http://<Mac IP>:8788/paper/arrival.html`（IP 用 `ipconfig getifaddr en0` 查）

## 已完成（24fab12 之後的 delta，全數 gated @ 43bd5e2）

| SHA | 內容 |
|---|---|
| e1f10cc | 刻字回聲：拿了票，void 刻字尾綴天氣字（常日不刻） |
| 158e457 | iOS 產圖隱形字：SVG-image @font-face 無限 FOIT → 重繪到取樣簽名穩定 |
| 2574ac0 | 匾同規格字隨匾（>3字 ×3/字數）＋max-height:720 殿內收斂＋tube-wrap 削 headroom |
| cb2ef3b | iOS 選字劫持 pull→禁 user-select/callout；提示上移；換幕 auto-scroll（stickStage/slipStage） |
| d1ba4a7 | 步向案前：進殿聖號一息後鏡頭走到案前框住儀式（半露筒攔截捲頁的根治） |
| 43bd5e2 | 天氣 key own-property 檢查：toString/constructor/__proto__ 穿透 prototype chain（福 gate blocker）——sound 走 Object.hasOwn、刻字走 isValidWeather，亂值同常日；regression E12＋2 條 source contract，red-test 驗過舊碼全紅 |
| （文件）| qa-cheatsheet 加一事一籤逃生說明、E11 手機迴歸擴充 |

## 驗收紀錄（本輪已關）

1. ~~Crystal iPhone 真機走一輪~~ — 過（正常路徑全通：takeaway、native share/
   fallback、weather/draw separation、ticket lifecycle、刻字、Slip 靜默、
   月老 fail-closed；frozen 架構未觸碰）。
2. ~~交福 gate~~ — 福 final gate 揪出唯一 blocker（malformed weather key），
   修復 43bd5e2 後大Ｇ代福 delta gate PASS。
3. 凍結時已知的殘餘風險：iOS lifecycle 已標準處理；真機音量僅 Crystal
   校過 speaker，**未校 AirPods**。

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
