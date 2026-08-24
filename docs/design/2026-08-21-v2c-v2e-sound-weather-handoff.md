# Draw One｜V2C–V2E Handoff — Sound × Weather Ticket × Exit

日期：2026-08-21｜作者：飛寶（Fable 5）｜狀態：V2C（38ed950）與 V2E（24fab12）
均為福 Final Gate 一次過的 frozen baseline。接手前先讀完本文件與
`docs/testing/qa-cheatsheet.md`。

## A. Baselines

- **V2C @ 38ed950**（fable/v2c-sound）＝聲音層 Phase A＋四天氣＋Exit/帶走。
- **V2E @ 24fab12**（fable/v2e-touch-sound，行為基準 57c1352）＝手感聲＋
  一天一張票入口 ritual＋QA cheat sheet。
- 均未 merge、未 deploy；merge 由福執行。
- 測試：sound 60 source contracts／e2e 37／arrival 27／pool 60／slip 14。
  無 package.json——全部 zero-dep Node 腳本；e2e 需 playwright-core（無則 SKIP）。

## B. 聲音層架構（sound-layer:begin/end 標記，主 script 之前的獨立 block）

- **治理**：零 mechanics 引用（S1 grep 鎖死）；API 不收神明身分；
  hall 變換參數只有一份字面值（SPACES.hall）；天氣永不進 SPACES／draw-policy／
  resolveDraw；全噪音合成——零音檔、零振盪器、零 setInterval。
  **注意：聲音層註解不能寫任何被 S1 grep 禁的字面**（抽籤 policy 名、神明名、
  振盪器英文名、節拍器英文名）——本輪三次被自己的測試抓到。
- **骨架**（四張票共用）：air bed（brown→LP）＋風（BP140 無 pan）＋
  牆外世界（distant，陰近晴遠）＋葉鏈（BP→dyn→flut→spaceLP→viewLP→viewGain→
  spaceGain→pan；樹冠雨從 spaceLP 匯入＝跟樹 pan、跟收窄）＋exBus（雨石地／
  簷滴／晴 voices，同一扇窗收窄）＋殿內 presence（SPACES 常數，天氣無關）。
- **天氣票 WEATHERS**：sunny／cloudy／rain／wind。cloudy＝taste-gate 基準＝
  常日預設。憲法：每張票 leafPeak > windPeak（世界被風吹動，不是 whoosh）。
- **雨勢三旋鈕**（都踩過坑）：wash 音量＝雨的身體、粒子密度＝顆粒、
  簷滴間隔＝個性。水感=半正弦軟起音＋簷滴高 Q 上滑「啵」；
  米粒感=硬起音；西北雨=wash 太大或密度太高。
- **手感層**：pull／stickOut／paperOut，走 master 不走 world
  （世界閉嘴時手上的紙有聲）；paperOut 只掛 takeBtn。
- **陣風**：隨機 setTimeout、票定間隔、首發 ×0.3；葉晚 100–300ms。

## C. 入口 ritual（D 拍板：一天一張票）

- `arrival.ticket.v1` {date, weather|null}：今天第一次來在門檻拿，
  當日沿用直落埕，跨日作廢。不答＝常日（存 null）。
- 初訪＝三條規矩＋天氣四字＋入內；回訪薄門檻＝日期節氣＋天氣＋入內。
- 不 preview：拿票在 AudioContext 啟動前（S5 鎖死順序）。
- 票是環境不是朝向：boot neutrality（facing 永不持久化）原樣。
- 刻字回聲：拿了票，void 刻字尾綴天氣字（常日不刻）。
- 誠實動線不可換票；dev 後門見 qa-cheatsheet（?weather= 試聽不寫票、?newday=1 撕票）。

## D. Exit／帶走這支籤

- 收籤＝句點：slip-away 600ms＋一拍靜＋回埕空氣展開；無旁白、無新 prompt。
- 帶走＝籤簿中每張紙的能力（existing 才顯示）；不分享問題／筆記／visit／文案。
- 產圖 pipeline（工程學費都在註解裡）：computed-style 全內聯＋pseudo 實體化
  （不讀 stylesheet——file:// 讀不到）；量測副本先殺 slip-settle 動畫
  （否則抄到第 0 幀 opacity:0）；deBase 剝掉絕對化的 url() 引用（否則 taint）；
  **data URI 不用 blob URL**（blob＋foreignObject 會 taint canvas）；
  字型用 css2 `text=` 子集 base64 內嵌。

## E. Residual risks（福已接受，非 blocker）

- iOS Safari 產圖（foreignObject→canvas 老雷區）＋真機聲音——local server
  即可驗（`python3 -m http.server 8788 --bind 0.0.0.0`，iPhone 同 Wi-Fi）。
- 「複製連結」未做＝等 deploy（deploy 是治理事件，Crystal 開題）。

## F. 未拍板／future（勿假決策）

- Temporal/Ritual sound states（晨鐘暮鼓課誦）——時間來源哲學未決。
- distant bell experiment——連 dev flag 都沒做。
- 錄音資產永久排除與否——truth 潔癖邊界未討論。
- 常日是否永遠＝cloudy 參數——目前票存 null、setter 落 cloudy，語意保留彈性。

## G. 團隊慣例（不變）

福＝工程 gate 與 merge；蝦蝦＝解讀層考證（勿碰 corpus）；Crystal＝味覺與治理拍板。
交驗：390×844 截圖＋SHA＋regression 表＋殘餘風險；每輪自審，砍掉的要說明。
截圖工具鏈在 `~/Documents/奧德賽/shotkit/`（playwright-core＋
cached chromium-1228「Google Chrome for Testing」）。
worktree `~/Documents/奧德賽/draw-one-v2b`；主 clone 勿動。

讓它繼續像地方，不像作品。
