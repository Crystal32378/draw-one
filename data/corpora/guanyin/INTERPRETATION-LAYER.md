# 觀音百首 — Historical Interpretation Layer

**corpus:** guanyin | **layer:** historical_interpretation | **edition:** 艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像）

## 收錄範圍

- 同版兩個欄位：**解曰**（解，四言判詞）＋ **聖意**（事項判詞，家宅／自身／求財／交易／婚姻／六甲／行人／田蠶／六畜／尋人／公訟／移徙／失物／疾病／山墳等）
- 只逐字收附錄二既有內容，不收其他網站解釋、不做現代白話、不摘要、不改寫、不補 AI 解讀

## Source hierarchy（production witness 鐵律）

1. **薛皓文 2008 附錄二原始影像 = production witness（唯一權威）**
2. 附錄二的兩個 OCR（整頁「此籤」行 + 逐籤渲染圖 OCR）是 transcription **候選**，不是答案——直排掃描有亂序＋形近字誤讀
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

**transcription_status 分布：解曰 80 PROBABLE ＋ 20 UNRESOLVED；聖意 100 PROBABLE（verbatim 為附錄二 raw）**

## Authority Hierarchy 窄修記錄（2026-08 Gate FIX REQUIRED 後）

福 Gate 點名兩類問題，已逐一修正：

1. **chance／語義推定曾進入 verbatim**（違反 authority hierarchy）——#1、#5、#7、#13、#16、#18、#25、#41、#48 共 9 籤，將 chance 讀法／語義補字移出 verbatim，改以附錄二 raw／page 為準，chance 只留 witness。
2. **UNRESOLVED 未保留 uncertainty**——#9、#10、#12、#14、#17、#20、#21、#44、#65、#96 共 10 籤，verbatim 改為保留 raw 原讀＋缺字「□」，不再以語義推定補滿。

另：#4 第二句「騎龍跨虎」raw「時龍跨虎」／page「騎龍跨虎」／chance「騎龍踏虎」／source image「財施跨虎」四方分歧，標「□龍跨虎」不視為穩定。

**修正後 5 籤由 PROBABLE 降 UNRESOLVED**（#1、#4、#7、#13、#16）。

## Data Gate（機器可抓 contract）

`validate_interpretation_layer.py` 五項 assertion，把 authority hierarchy 變成可回歸驗證的 gate：

| Assertion | 檢查內容 |
|---|---|
| A1 traceability | verbatim 每個字（繁簡正規化後）必須 traceable 到 source（raw ∪ page），不憑空補字 |
| A2 chance isolation | chance 獨有字不得進 verbatim（chance 只能留 variants_or_notes 的 witness） |
| A3 uncertainty | UNRESOLVED entry 必須含「□」或 note 標記分歧／缺字／未確 |
| A4 structure | 100 籤、每籤 2 筆、9 欄位齊全、layer_class 一致 |
| A5 encoding | 無 U+FFFD／mojibake／異常控制字符 |

輸入：`interpretation_layer.json` + `source_three_way.json`（raw_jie／page_ocr／chance_jie 三方）。繁簡／異體經正規化（為↔爲、換↔换 等），只抓語義差異，不誤抓 OCR 繁簡混雜。

## UNRESOLVED 清單（解曰 20 籤）

| # | verbatim（缺字以□標記） |
|---|---|
| 1 | 急速非速。言來時値。觀音降事。報與君知。 |
| 4 | 五五念五。□龍跨虎。事雖勞心。於中有補。 |
| 5 | 望中心事。令可方求。百事營謀。正堪截□。 |
| 7 | 退身可得。進步難為。只宜守□。切莫高扳。 |
| 9 | 心中正直。原法寬□。天無私極。□空虛□。 |
| 10 | 機緣若遇。何事不成。春無限□。□似真□。 |
| 12 | □換得絲。是笑□哭。要見分明。是見為福。 |
| 13 | 因□得赦。病遇良醫。龍門得□。名顯□□。 |
| 14 | 從心無慮。遠達亨衢。道心自在。任意所如。 |
| 16 | 得處□□。損中有□。□□□凶。君子得吉。 |
| 17 | 心中不定。枉費看經。只是畫餅。□□□□。 |
| 20 | 佛神護佑。百事無虛。想平生事。到□勝初。 |
| 21 | 陰陽道合總由天。女嫁男婚豈偶然。但看龍蛇堪運動。熊羆葉夢喜團圓。 |
| 31 | 守己安靜。即是待他。時至必定。□全。 |
| 35 | 不須憂疑。自有□期。□前程。更換可宜。 |
| 44 | □求心事。如同□。要知勝負。先□□□。 |
| 48 | □□化□。諸禽不能。騰化時節。□□□□。 |
| 65 | 得止且止。知□割自。□肉痛本。一□。 |
| 77 | □夢說夢。聲名虛望。只好待時。貴人接引。 |
| 96 | 這此福□。諸人皆現。可用誠心。福德即到。 |

## Sampled Direct Source-Image Verification（3 籤）

| # | 核對項目 | source image 結果 | 影響 |
|---|---|---|---|
| 1 | 解曰末句 | 「報與君知」（非 chance「先報君知」） | 以附錄二為準 |
| 4 | 解曰首句 | 「五五念五」（非 chance「淘沙成金」） | 確認附錄二原文 |
| 62 | 解曰全文 | 「諸事平穩，四方名顯，改換從新，凶存吉現」 | 三方一致，PROBABLE 確認 |

## Provenance / Reproducibility

- **source_locator**：`薛皓文2008附錄二 p{130–179}（籤 #N）`，每筆可回查原始掃描（appendix2_png 與逐籤 slip_pages/slip_XXX.png）
- **transcription_status**：解曰 80 PROBABLE（整頁 OCR + raw 兩獨立 OCR 一致或語義通順）＋ 20 UNRESOLVED（三方分歧或字不通，留「□」不猜字）；聖意 100 筆 verbatim 為附錄二 raw，直排順序亂，原始順序待逐籤 source image 還原
- **異體字**（如「𫝹」「冨」）原樣保存，不 canonicalize、不簡繁轉換（繁簡正規化僅用於 gate 判等，不改變 verbatim 文字）
- **chance substantive-variant**：逐條記錄 chance 與附錄二的實質差異於 `variants_or_notes`（chance 是艋舺版另一轉錄，非 production witness）

## 定位

本層是 archival / provenance interpretation layer。完整收錄不代表 UI 之後會全部展示；The Slip 仍是主體，Interpretation 是來源註腳。聖意原始直排順序與解曰 UNRESOLVED 20 籤，是下一輪 source image 逐籤核對的明確 backlog。
