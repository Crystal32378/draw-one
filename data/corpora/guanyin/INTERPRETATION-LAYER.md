# 觀音百首 — Historical Interpretation Layer

**corpus:** guanyin | **layer:** historical_interpretation | **edition:** 艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像）

## 收錄範圍

- 同版兩個欄位：**解曰**（解，四言判詞）＋ **聖意**（事項判詞，家宅／自身／求財／交易／婚姻／六甲／行人／田蠶／六畜／尋人／公訟／移徙／失物／疾病／山墳等）
- 只逐字收附錄二既有內容，不收其他網站解釋、不做現代白話、不摘要、不改寫、不補 AI 解讀

## Source hierarchy（production witness 鐵律）

1. **薛皓文 2008 附錄二原始影像 = production witness（唯一權威）**
2. 附錄二的兩個 OCR（整頁 OCR + 逐籤渲染圖 OCR）是 transcription **候選**，不是答案——直排掃描有亂序＋形近字誤讀
3. **chance.org.tw 只是 comparison witness**：只協助發現異文、檢查事項項目與順序，**不拿 chance 覆蓋或反推附錄二**

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 100/100 |
| 解曰 | 100 筆 |
| 聖意 | 100 筆 |
| 總 entry | 200 筆 |
| 缺欄位 | 0 |

## 資料結構

每筆 entry 含：`corpus` / `slip_no` / `edition` / `field_type`（解曰｜聖意）/ `verbatim_text` / `source_locator` / `transcription_status` / `layer_class`（=living_tradition）/ `variants_or_notes`

**transcription_status 分布：解曰 85 PROBABLE ＋ 15 UNRESOLVED；聖意 100 PROBABLE（verbatim 為附錄二 raw）**

## UNRESOLVED 清單（解曰 15 籤）

| # | 現狀 | 卡點 |
|---|---|---|
| 5 | 望中心事。西方可求。百事營謀。立地堪□。 | 與 chance「欲望心事／不如莫動／立地可謀」實質差異，末字三方分歧 |
| 9 | 心中正直。理順法寬。天無私意。莫空盧。 | page「天無私意莫空盧」vs raw「天無私極與空虛」分歧 |
| 10 | 機緣若遇。何事不成。春無限。前似真。 | raw「春無限請似真」vs page「春無限前似眞」分歧 |
| 12 | 換麻得絲。是笑誰哭。要見分明。是見為福。 | raw「萬換得絲」vs page「蔴換得絲」；「是笑誰哭」vs「是笑雖哭」 |
| 14 | 任意無慮。遠達亨衢。道心自在。任意所如。 | page「從心無慮」vs 還原「任意無慮」分歧 |
| 17 | 心中不定。枉費看經。恰似畫餅。充飢之象。 | raw「枉費思量」vs page「枉費看經」；「畫餅充飢之象」混入總斷 |
| 20 | 佛神護佑。百事無虛。想平生事。到底勝初。 | raw「到成勝」vs page「到底勝」分歧 |
| 21 | 陰陽道合。總由天。女嫁男婚。豈偶然。但看龍蛇。堪運動。熊羆葉夢。喜團圓。 | 此為七言詩體，非四言判詞，欄位歸屬待核 |
| 31 | 守己安靜。即是待他。時至必定。□全。 | 「通全／遇全」三方分歧 |
| 35 | 不須憂疑。自有□期。□前程。更換可宜。 | raw「期問」vs page「期間」分歧 |
| 44 | 欺求心事。如同著祺。要知勝負。先著莫疑。 | raw「批求心事／如同棋」vs page「欺求心事／著祺」分歧 |
| 48 | □化為鵬。諸禽不能。桂花時節。財祿□成。 | page「鷗烏化鵬」vs raw「鵑鵑化鵑」；「財祿成」缺字 |
| 65 | 得止且止。知歡割自。己肉痛本。一般。 | 字序語義不通，chance 作「知止則止，知寬自寬，割自身肉，疾痛一般」 |
| 77 | □夢說夢。聲名虛望。只好待時。貴人接引。 | 首字「如」兩 OCR 均未見，chance 作「如夢說夢」 |
| 96 | 這此福曰。諸人皆現。可用誠心。福德即到。 | 「福曰」疑「福份」誤讀，page/raw 均不穩 |

## Sampled Direct Source-Image Verification（3 籤）

| # | 核對項目 | source image 結果 | 影響 |
|---|---|---|---|
| 1 | 解曰末句 | 「報與君知」（非 chance「先報君知」） | 回退誤修正，以附錄二為準 |
| 4 | 解曰首句 | 「五五念五」（非 chance「淘沙成金」） | 確認附錄二原文，chance 為另一版本 |
| 62 | 解曰全文 | 「諸事平穩，四方名顯，改換從新，凶存吉現」 | 三方一致，PROBABLE 確認 |

## Provenance / Reproducibility

- **source_locator**：`薛皓文2008附錄二 p{130–179}（籤 #N）`，每筆可回查原始掃描（appendix2_png 與逐籤 slip_pages/slip_XXX.png）
- **transcription_status**：解曰 85 PROBABLE（整頁 OCR + raw 兩獨立 OCR 一致或語義通順，尚未逐字人工對原圖）＋ 15 UNRESOLVED（三方分歧或字不通，留「□」不猜字）；聖意 100 筆 verbatim 為附錄二 raw，直排順序亂，原始順序待逐籤 source image 還原
- **異體字**（如「𫝹」「冨」）原樣保存，不 canonicalize、不簡繁轉換
- **chance substantive-variant**：解曰 98 籤逐條記錄 chance 與附錄二的實質差異於 `variants_or_notes`（chance 是艋舺版另一轉錄，非 production witness）

## 定位

本層是 archival / provenance interpretation layer。完整收錄不代表 UI 之後會全部展示；The Slip 仍是主體，Interpretation 是來源註腳。聖意原始直排順序與解曰 UNRESOLVED 15 籤，是下一輪 source image 逐籤核對的明確 backlog。
