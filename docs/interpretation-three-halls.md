# 三殿歷史解讀層 — 盤點與上紙規則

**日期：** 2026-11-14　**分支：** `fable/interp-three-halls`　**範圍：** 網頁版（`paper/arrival.html`）。ChatGPT plugin、正式站部署不在此輪。

這份文件回答三件事：三套解讀資料各自能不能公開、公開的怎麼標、暫緩的為什麼暫緩。
數字以 `node scripts/build-interpretation-pool.mjs` 的輸出與 `data/production/*.report.json` 為準。

## 一、盤點結果

| 殿 | 資料 | 來源／版本 | 授權 | 核對狀態 | 這一輪 |
|---|---|---|---|---|---|
| 觀世音 | 解曰 100、聖意 100 | 艋舺龍山寺《觀世音靈籤》，薛皓文 2008 附錄二籤紙影像 | 傳統籤文；已於 PR #34 上線 | 解曰：94 PROBABLE（其中 13 人工核圖）、5 UNRESOLVED、1 CANDIDATE | **解曰上 94**（13 已核圖／81 待複核），**6 暫緩**（#12 #20 #35 #44 #65 #77）。聖意不上。規則未改，artifact 與 main byte-identical。 |
| 關帝 | 解曰 100、聖意 100（PR #23，未合併、無 review 紀錄） | 《護國嘉濟江東王靈籤》傅燁撰，道藏本；維基文庫轉錄 | 道藏本原文 public domain（`historical_editions.json`：`reuse_status: public_domain_supported`） | 解曰：99 PROBABLE、1 UNRESOLVED（#100 缺字）。**沒有任何一首經人工核對道藏影像** | **解曰上 70**（全部標「待複核」），**30 暫緩**。聖意不上。 |
| 天上聖母（六十甲子） | 卦名／五行方位／聖意／籤解／卦運勢／籤閣聖意，共 360 筆 | 北港朝天宮官方籤詩圖檔（廟方現代解說） | **未確認**（`sources.json`：`license_status: unsure`、`item_license_status: unresolved`，「未見再製授權聲明」） | 349 CANDIDATE（單次 OCR）、3 PROBABLE、8 UNRESOLVED；人工核圖 0；layer 自標 DRAFT | **整套暫緩，一字不上。** 頁面只說原因，並連到北港朝天宮官方網站。 |

### 為什麼聖意一律不上

聖意是事項吉凶格（求財／婚姻／疾病…）。那是預測語體，和「反思、不是預言」的產品線衝突。
這是 PR #34 就定下的規則（G1），這一輪沿用到關帝。

### 關帝為什麼只上 70 首

PR #23 的資料是維基文庫轉錄的直接抓取。上游的 second-witness sweep 標了 3 處解曰（#58 #68 #100）。
這一輪把 97 首可上的解曰逐首讀過一遍，發現轉錄裡還有不少形近誤讀的痕跡沒被標到，例如：

- 「几事」「几百」（疑「凡」）：#5 #6 #10 #25 #31 #47 #52 #94
- 「叉」「鈴」（疑「必」）：#52 #56 #66 #71
- 「次」（疑「決」）：#36 #67　「責」（疑「貪」，同 #68 型）：#46 #88
- 其他單字：#11 #12 #33 #38 #47 #69 #75 #80 #83 #85 #87
- 體例／標點異常：#73（逗號切在四字句中間）、#91（全首不作四言八句）

這些**只是讀校時的懷疑，不是 second witness，更不是校正**。處理方式是保守的那一種：

- 來源檔 `interpretation_layer.json` 一個字都沒動。
- 把這 27 首加上上游已標的 #58 #68 列進 `data/corpora/guandi/jieyue_holds.json`（每筆有 `flagged_by` 說明是誰標的、憑什麼）。
- #100 因狀態 UNRESOLVED 自動排除。
- 列在暫緩名單上的籤，頁面顯示「此籤暫未上紙」和原因，不顯示文字、不補字。

另有幾處把握較低、**沒有**暫緩但請核對者留意的：#4「悔無及己」、#34／#43「激括」、#53「南烏北巢」、#77「否盡遍循」、#96「成無憂慮」、#98「營謀艱力」。它們目前以「待複核」上紙。

**要把關帝升級，需要的是：** 用識典古籍 DZ1305 或道藏影像做一次全量對勘（不是抽樣）。對過的籤從暫緩名單移除、可標已核圖。
同一份維基文庫轉錄也是關帝**籤詩本文**（draw pool）的來源，例如 #37「心裹事」的「裹」同樣可疑——那不在這一輪範圍，但建議一併核。

### 六十甲子為什麼整套暫緩

兩個獨立的理由，任何一個都足夠：

1. **授權。** 籤解／卦運勢／籤閣聖意是廟方的現代解說文字，不是古籍。corpus package 自己寫著「license 全 unresolved → 不得直接 production reuse」。這需要 Crystal 決定（或向廟方確認），不是工程能替她決定的。
2. **轉錄品質。** 349/360 是單次 OCR，沒有人看過圖。樣本裡就有明顯的辨識錯誤。

build 會從 corpus package 重新計算這兩個理由（G9）。授權確認了但還是單次 OCR → 仍暫緩，理由如實縮成一個；兩個理由都消失 → build 直接失敗，逼人重新決策，不留一張過期的告示。

## 二、頁面上怎麼呈現

三殿同一格：紙下方一行摺頁，預設收合，不在紙上、不進「帶走這支籤」的圖、不進「複製籤文」。

| 情況 | 收合時 | 展開後 |
|---|---|---|
| 上紙・已核圖（觀音 13） | 解曰　艋舺龍山寺版・已核圖 | 原文逐字；「據…，人工核圖確認」。**文案與 PR #34 福 re-review 拍板的原版完全相同，不加說明句** |
| 上紙・待複核（觀音 81） | 解曰　艋舺龍山寺版・待複核 | 原文逐字；「據…，待複核」。同上，未加字 |
| 上紙・待複核（關帝 70） | 解曰　道藏本・待複核 | 原文逐字；「據《護國嘉濟江東王靈籤》（傅燁撰，道藏本），維基文庫轉錄，待複核」；**多一句定位**（見下） |
| 單籤暫緩（觀音 6、關帝 30） | 解曰　此籤暫未上紙 | 只有原因（缺字／疑似認錯的字／體例有疑）。沒有任何解曰文字 |
| 整套暫緩（六十甲子 60） | 廟方解說　暫未上紙 | 兩個原因＋「不轉載、不摘要，也不另寫一段來代替」＋北港朝天宮官方連結 |
| guard 對不上（版本／custody／被竄改） | 整行不出現 | — |

頁面上屬於抽一自己的字只有標示語（`JIEYUE_COPY`），不含任何吉凶判斷；解曰文字只有一個入口：`rec.text`。

### 關帝殿多的那一句

> 這是道藏本原有的判語，照原文收錄——是前人的讀法，不是抽一的話，也不是對你這件事的預測。還沒有逐籤對過道藏影像，可能有錯字。

PR #34 當時決定觀音摺頁「不加免責句」，這一輪觀音照舊。關帝加這一句的理由是文本性質不同：
觀音的解曰多是勸解（「不如待時」「切莫妄為」），關帝道藏本的解曰多是斷語（「求財必豐」「百事大吉」，
也有 #35「夫妻離散，骨肉西東。事皆不遂，有始無終」這樣重的話）。原文照收是對來源誠實；
但沒有這一句，摺頁打開就像抽一在替人斷吉凶。要不要留，是文案決策——拿掉只需把
`JIEYUE_COPY.corpus.guandi.about` 設為 `null`。

## 三、資料流與閘門

```
data/corpora/{guanyin,guandi}/interpretation_layer.json
data/corpora/guandi/jieyue_holds.json            ← 關帝暫緩名單（人工維護、有理由）
data/corpora/{guanyin,guandi}/jieyue_custody.json ← 逐籤 custody
data/corpora/liushijiazi/{interpretation_layer,sources}.json  ← 只讀來算暫緩理由
        │  node scripts/build-interpretation-pool.mjs   （全部閘門過了才寫檔）
        ▼
assets/interpretation-pool.guanyin.js   window.INTERPRETATION_POOL          （未變）
assets/interpretation-pool.guandi.js    window.INTERPRETATION_POOL_GUANDI
assets/interpretation-holds.js          window.INTERPRETATION_HOLDS          （只有理由代碼，沒有被暫緩的文字）
        │  assets/jieyue-guard.js：resolve / resolveFrom / holdFor（頁面與測試共用）
        ▼
paper/arrival.html  renderJieyue
```

沿用 G1–G7（欄位、狀態、壞字、誠實狀態詞、版本鎖、不改寫、逐籤 custody），新增：

- **G8** 關帝：解曰若帶 variants／異常註記，必須在暫緩名單上，否則 build 失敗；名單指到不存在的籤也失敗。
- **G9** 六十甲子的暫緩理由由資料重算，理由消失則 build 失敗。

改了暫緩名單 → 關帝 `content_version` 會變 → 要同步 `assets/jieyue-guard.js` 的 `CONTRACTS.guandi.content_version`（測試會擋）。

## 四、PR #32「紙落定即入籤簿」整合

- 以 merge 併入（保留原 commit），與解曰摺頁無衝突：`showSlip` 先 `ensureBookEntry`、後 `renderJieyue`。
- 同問原籤（一事一籤綁定）、私人籤簿、筆記規則未動。資料仍只在本機 `localStorage`；這一輪沒有新增任何對外請求（六十甲子的官方連結是使用者自己點才開的一般連結，不帶任何資料）。
- `test-sound-e2e` 裡一條舊斷言（「新抽的籤沒有帶走列」）與 PR #32 的新契約相反，已改為新契約。

## 五、需要 Crystal 決定的事

1. **六十甲子廟方解說的授權**——要不要向北港朝天宮確認轉載？在那之前維持暫緩。
2. **關帝 PR #23**——資料尚未經福 review。這個 preview 把它併進來做展示；要不要合併進 main、要不要先做全量對勘，請你和福、蝦蝦決定。
3. **關帝殿那一句定位要不要留**（見上）。更根本的一題：關帝解曰的斷語口吻，適不適合這個「反思、不是預言」的產品——這一輪照「歷史原文、標明來源」上了 preview，請你看過真紙再定。
4. **「收進籤簿・回埕」的字**（PR #32 留下的問題，仍未改）。
