# Draw One 交接：三殿解曰接進正式流程（飛寶，2026-11-15 深夜）

分支 `fable/review-library-takeover`，接在 Murphy 的 `4d4acf2` 之後：先原樣套用 Murphy 交接包（tree `d55deed`，與 manifest 相符），再往上做。**main 與正式站沒動，沒有合併，沒有部署正式站。**

## 這一輪做了什麼

### 1. 觀音、關帝的解曰：200 首全部進正式資料流（不再靠本機 server 注入）

顯示政策（Crystal 2026-11-15）：**待複核不等於隱藏；古字照舊，不以現代用字取代；缺字留 □，不補。**

- `scripts/build-interpretation-pool.mjs`：四種來源狀態都上紙，各用自己的詞（已對勘／待複核／候選讀法／有缺字），不升級。
  - 來源狀態是 UNRESOLVED／CANDIDATE 的，帶 `doubt: "unsettled_transcription"`。
  - 在疑字帳（`data/corpora/guandi/jieyue_holds.json`，檔名沒改）上的，帶 `doubt: <reason_code>`。**這份帳現在的意思是「上紙並標示有疑」，不再是「不顯示」。**
  - 仍然 fail-closed 的：custody（文字被改、兩首對調）、版本、來源有註記卻不在帳上、「已定」狀態的文字裡出現 □、U+FFFD／控制字元。
  - custody token 一個都沒重產——文字本身一字未動，只是原本被擋下的 37 首現在帶著標記出來。
  - 觀音多帶 `locator`（附錄二頁碼，取自來源欄；取不到就 build 失敗，不猜）。
- pool schema `interpretation-pool/0.2`；`assets/jieyue-guard.js` 的契約與 content_version 同步。不認得的 doubt 代碼→不顯示（不會無標記地上紙）。
- `paper/arrival.html` 摺頁：原文＋來源（觀音含頁碼）＋狀態；有疑的多一句（疑在哪一類、沒補沒改）；每一首都有「到校對館看這一籤」連結（`corpus-review-<殿>.html?q=<籤號>`）。求籤頁只有這些，詳細疑點都在校對館。
- 數字：觀音 100 首（16 已核圖；6 首標缺字／候選：12, 20, 35, 44, 65, 77）；關帝 100 首（0 已核圖；31 首標疑字／缺字，含 #53、#100）。

### 2. 六十甲子（聖母殿）：**還沒有真正的解籤可上紙**——這是剩下最大的一塊

- 摺頁仍是「廟方解說・暫未上紙」＋官方網站連結，新增一條「到校對館看這一籤已整理的欄位」。
- 沒有為卦名／五行方位做 pool：120 短欄裡有不少錯置、混欄、OCR 疑讀（見 `build-corpus-review.mjs` 的逐籤旗標），而且它們不是解籤；硬放進求籤頁會像是有解說、其實沒有。
- 下一步建議（需要 Crystal 決定方向，不是技術問題）：
  1. 聖意（60 欄）若能對到公版古本，逐欄核後可以比照觀音／關帝上紙。
  2. 籤解／卦運勢／籤閣聖意（長篇白話）要先查明是誰寫的、能不能轉載；查明前不轉載、不摘要、不改寫。
  3. 若要先上卦名／五行方位：在 MANIFEST 加第三個 corpus、欄位改成可設定、把 Murphy 的旗標搬進資料檔（現在寫死在產生器裡）再接 guard。

### 3. 廟埕公告＋校對館前台

- 廟埕中軸「本廟沿革」下方多一塊告示「徵求校對」→ 公告頁（採用句：「已做第一輪整理，邀請您一起複核。」）→「進校對館」。走埕的 release 判定（`data-notice`），不會被 setPointerCapture 吞掉；已在 390 與 800 寬實測可開。
- 校對館四頁（`node scripts/build-corpus-review.mjs` 產生）：只加樣式（紙色、宋體標題、狀態章、手機卡片），結構、欄位收合、搜尋、篩選、資料都沒動；Murphy 的兩套測試照過。新增 `?q=` 深連結（只讀網址）。入口頁加一句校對原則。
- **校對館四頁是靜態 HTML，可以隨站部署；`/review`（760 欄全量）仍只限本機，不可公開。**

## 沒做的（請別當成做了）

- 六十甲子的解說上紙（見上）。長篇註解的來源／轉載權逐欄處理：沒做。
- 觀音、關帝原圖映射與頁內嵌圖：沒做，校對館仍顯示「原圖尚未接入」。
- 鳥聲：沒有再改，也沒有人耳試聽。「打嗝」是否解決不知道。
- 實機（iPhone／Android／LINE）：沒測。瀏覽器測試都是桌機 Chromium 模擬。
- `docs/interpretation-three-halls.md`、`docs/RESEARCH_STATUS.md` 仍是舊敘述（寫著 70／30 暫緩等），只在檔頭加了指向本文件的提示，沒有重寫。
- `scripts/serve-corpus-review.mjs` 的本機注入（會蓋過正式摺頁、並在沿革下再加一條連結）沒有移除；它現在是多餘的，但 Murphy 的測試還依賴它，留給 Murphy 決定。
- 關帝籤詩待決 5 處（#59、#62／65／87／89）沒動。
- 沒有合併 main、沒有部署正式站。

## 測試（本分支最終樹，2026-11-15）

- 非瀏覽器：draw-pool 60、slip-render 14、arrival 52、sound 68、interpretation-pool 85（原 76；12 條改寫成新政策的斷言，另加 9 條）、舊籤簿相容（260 id）、關帝字級修正、corpus-review 5、public-corpus-review 4——全過。
- 瀏覽器（Chromium）：interpretation-e2e 38／38；arrival-ink-e2e 230／230（Murphy 的環境跑不了，這裡第一次實跑，含麻雀、#42、#43）；sound-e2e 49／51——2 條失敗是沙箱連不到 Google Fonts，main 基準同樣失敗，與本輪無關。
- 沒驗的：人耳、實機、真實字型。

## 怎麼接

```sh
git fetch origin fable/review-library-takeover && git switch fable/review-library-takeover
node scripts/build-interpretation-pool.mjs   # 重建 pools；guard 的 content_version 要跟著報告檔更新
node scripts/build-corpus-review.mjs         # 重建校對館四頁
node scripts/test-interpretation-pool.mjs && node scripts/test-corpus-review.mjs && node scripts/test-public-corpus-review.mjs
PW_CORE=<playwright-core> CHROMIUM=<chrome> node scripts/test-interpretation-e2e.mjs
```

改了解曰來源文字（例如核圖後更正一個字）→ 要有意識地 `--write-custody`，再重建、更新 guard 版本。把一首從疑字帳拿掉＝宣告它核過了，請附證據。

---

# 2026-11-16 補記：聖意整合後的最後一輪前台與整合檢查（飛寶）

分支 `fable/reading-final`，接在 `3a476cc` 之後：先原樣套用 Murphy 的 `draw-one-reading-layer.patch`（tree `f086017`，10 檔 hash 全部與 manifest 相符），再往上做。main 與正式站沒動。

## 找到並修掉的整合問題

1. **聖意腳本沒載到會拖垮整張籤（中等風險，已修）**：`renderJieyue` 第一行直接呼叫 `window.SHENGYI_VIEW.render(...)`。那兩支腳本只要有一支沒載到或丟例外，解曰、收籤都跟著壞。現在包在 try 裡：聖意出事只空聖意那一格。瀏覽器測試新增兩條（丟例外／腳本缺席）。
2. **聖意兩支腳本用絕對路徑 `/assets/…`**，其他資產都是 `../assets/…`。改成同一種相對路徑：從 `/` 或 `/paper/arrival.html` 進來都解析到 `/assets/`（已用模擬正式站改寫規則的本機 server 驗過，兩個入口零個失敗請求），本機直接開檔也能跑。校對館連結維持 Murphy 修好的 `/paper/…`。

## 前台潤飾（資料沒動）

- 聖意那一格：原生 details 保留、預設收合；標題拆成「聖意」＋狀態兩段，照解曰那一行的層次排（小一號、內縮一條細線）。
- 摺頁順序改成：解曰原文 → 來源 → 聖意 → 其餘說明 → 連結。聖母殿的「其他解說請見廟方原圖」因此緊貼它的官方連結。
- 校對館連結在摺頁底只留一條（聖意格裡重複的那條用 CSS 收起，DOM 還在）。
- 觀音／關帝的聖意來源改短：「同解曰所據…・附錄二 pNNN」，不重複整段書目。
- 求籤頁不放疑點長說明（Murphy 已移除，照 Crystal 的方向保留）；狀態詞與「待核對」仍在標題與來源行。

## 測試（最終樹）

- 離線：draw-pool 60、slip-render 14、arrival 52、sound 68、interpretation-pool 85、shengyi-pool、review-root-routes、corpus-review、public-corpus-review、舊籤簿相容、關帝字級修正——全過；四個產生器重跑後產物無差異。
- 瀏覽器（桌機 Chromium 模擬）：interpretation-e2e 45／45（新增聖意三殿、#39 不硬補、換籤不殘留、聖意層故障隔離）；arrival-ink-e2e 231／231（單獨跑兩次皆過；與其他瀏覽器套件連續跑時曾有一次 6 條因機器忙而逾時失敗）；sound-e2e 49／51（2 條為沙箱連不到 Google Fonts，main 基準同樣失敗）。
- 另驗：390×601、800×700、360×640 三種尺寸，點開聖意後每一條連結都能捲到收籤列上方且點得到；無橫向捲動。

## 仍未完成

- 手機實機（iPhone／Android／LINE）、真實字型、鳥聲人耳：都沒驗。鳥聲照指示維持現狀。
- 聖母殿 #39 聖意待重新轉錄；六十甲子 180 欄長篇解說仍只連廟方來源。
- 校對館的六十甲子頁還沒採用求籤頁那 59 筆聖意的切界（Murphy 已註明），兩邊對同一籤的聖意顯示範圍可能不同。
- 觀音／關帝原圖映射未接。關帝籤詩待決 5 處未動。
- 線上預覽：飛寶這邊的 Vercel 連接無權建立專案，沒有開出網址。
