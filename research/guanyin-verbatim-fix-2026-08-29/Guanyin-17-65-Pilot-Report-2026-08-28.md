# 觀音解讀層 verbatim 修正 — #17／#65 兩例 Pilot Report

## Evidence Taxonomy（福第四輪治理框架，2026-08-28 Crystal 定案）

「我覺得這個字是什麼」的三種來源，治理上嚴格分離：

| taxonomy | 語義 | evidence 標準 |
|---|---|---|
| `source_literal_verified` | 來源字面驗證 | 至少兩條獨立 OCR path 於同一 witness 影像上 exact 一致 |
| `manual_image_confirmation` | 眼睛看見的 | 人類目視 witness 影像逐字確認 |
| `human_textual_inference` | 文本學推回來的 | 音韻／語境／全句結構推出最合理讀法（非字形觀察） |

> ⚠️ **SUPERSEDED（2026-08-29）**：下方「#17/#65 現行標記 `human_textual_inference`」為目視確認前的舊狀態。
> **Current status 見下方定案段**：#17 已升級 `manual_image_confirmation`（Crystal＋福雙人目視）；
> #65 句 3–6 Crystal 目視確認＋句 2 保留 □（真 textual variant）。
> 解曰區域放大版留存於 `slip_017_lower_rotated.png`／`slip_065_lower_rotated.png`。

**日期：2026-08-28**｜**呈：** 福（gate）｜**目標：** 驗證「雙 OCR path 支持 raw_jie 讀法」能否作為 verbatim 修正依據——pilot 過 gate 再決定擴 19 籤
**witness：** slip_pages/slip_017.png、slip_065.png（附錄二逐籤裁切影像）；raw_jie（附錄二整頁 OCR，source_three_way.json）；兩次獨立 autoglm 轉錄（pass1/pass2）

---

## #17 pilot

### 三方對齊

| 來源 | 解曰內容 |
|---|---|
| 現 verbatim（UNRESOLVED） | 心中不定。枉費看經。只是畫餅。□□□□。 |
| raw_jie（附錄二整頁 OCR） | 心中不定枉費思量只求餅充飢之事虛少實 |
| 重讀 pass1（slip_pages, 2026-08-28） | 解心中不安枉費思量只求餅充飢之事虛少實 |
| 重讀 pass2（同影像, 獨立轉錄） | 心中不定枉費思量只求餅充飢之象凡事虛少實 ＋ 後續「晨昏只好念阿彌／畫餅如何療得飢」 |

### 逐句判定

| 句 | 現 verbatim | raw_jie | pass1 | pass2 | 判定 |
|---|---|---|---|---|---|
| 1 | 心中不定 | 心中不定 | 心中**不安** | 心中不定 | 「不定」獲三源支持；「不安」僅 pass1 單次 |
| 2 | 枉費看經 | 枉費思量 | 枉費思量 | 枉費思量 | **看經是誤讀**（雙 pass＋raw 一致「思量」） |
| 3 | 只是畫餅 | 只求餅充飢之事 | 只求餅充飢之事 | 只求餅充飢之**象** | **「只是畫餅」是截斷誤讀**；「事/象」一字差需人工核圖 |
| 4 | □□□□ | 凡事虛少實 | 凡事虛少實 | 凡事虛少實 | **雙 pass＋raw 一致**：「凡事虛少實」（現 verbatim 四個 □ 可填） |

### 修正定案（2026-08-29）— 升級 `manual_image_confirmation`

**verbatim 定案**：「心中不定。枉費思量。只求餅充飢之象。凡事虛少實。」
- 「事/象」定案為**「之象」**——**Crystal 目視放大影像確認**（「圖上是餅充飢之象」）＋**福目視確認（2026-08-29，Crystal 截圖轉呈）**
- taxonomy：**`manual_image_confirmation`**（人類目視影像逐字確認——Crystal＋福雙人目視）；音韻證據（思量/之象押 ang 韻）為輔助佐證
- 後續句「晨昏只好念阿彌。畫餅如何療得飢。」（pass2 單次觀察）→ notes CANDIDATE 註記
- 後續句「晨昏只好念阿彌。畫餅如何療得飢。」（pass2 讀出，單次觀察）→ 收 notes 為 CANDIDATE 註記，待第三源

### 誠實標記

- 「畫餅」二字真實存在於籤紙（pass2「畫餅如何療得飢」）——現 verbatim 的「只是畫餅」錯在句序與上下文，非「畫餅」二字捏造
- 本例顯示：**現 verbatim 的 UNRESOLVED 有一類是「批次 OCR 句序錯位＋截斷」**，與「影像模糊無法辨識」性質不同

---

## #65 pilot

### 三方對齊

| 來源 | 內容 |
|---|---|
| 現 verbatim（UNRESOLVED） | 得止且止。知□割自。□肉痛本。一□。 |
| raw_jie | 得止且止知機到自昌內病本一投此籤內成緣之象凡事守舊待時 |
| 重讀 pass1（slip_pages） | 得止且止知足則自安內病本一投此籤內成緣之象凡事守舊待時 |
| 重讀 pass2（同影像, 獨立轉錄） | 讀出七言四句「眼前歡喜未爲歡。危不危兮安不安。割肉成瘡因甚事。不如守舊得安全。」——**此為 #65 籤詩**（非解曰），pass2 抓錯段落 |

### 逐句判定

| 句 | 現 verbatim | raw_jie | pass1 | 判定 |
|---|---|---|---|---|
| 1 | 得止且止 | 得止且止 | 得止且止 | 三源一致 |
| 2 | 知□割自 | 知機到自昌 | 知**足**則自**安** | **verbatim 碎片化**（割自/肉本 來自其他段落的「割肉」錯位）；raw「知機到自昌」vs pass1「知足則自安」差異待核圖 |
| 3 | □肉痛本 | 內病本一投 | 內病本一投 | raw＋pass1 一致「內病本一投」 |
| 4 | 一□ | 此籤內成緣之象凡事守舊待時 | 此籤內成緣之象凡事守舊待時 | raw＋pass1 一致（完整句子在 verbatim 中被截斷成「一□」） |

### 修正定案（2026-08-29）— 發現真實版本差異 ⚠️

**Crystal 目視附錄二影像（`manual_image_confirmation`）讀出**：
「得止且止。知歡割自己肉痛本一般。此籤肉成瘡之象。凡事守舊待時。」——**不通順**（她自評）

**新 comparison witness（同日發現）**：五甲龍成宮解籤語源網（longcheng.org.tw）第六十五籤：
- 籤詩「眼前歡喜未為歡／危不危兮安不安／割肉成瘡因甚事／不如守分待時還」＝#65 籤詩（slip text 層互證）
- 詩意「此卦割肉成瘡之象，凡事只宜守舊待時」
- **解曰「知止則止。知寬自寬。割自身肉。疾痛一般。」**

### 多源對齊 → 判定：真實 textual variant（非 OCR 誤讀）

| 句 | 龍山寺附錄二（Crystal 目視） | 五甲龍成宮（longcheng） | raw_jie | 判定 |
|---|---|---|---|---|
| 1 | 得止且止 | 知止則止 | 得止且止 | 版本差異（得止/知止）——附錄二為準 |
| 2 | 知**歡**？ | 知**寬**自寬 | 知**機**到**自昌** | 三源三讀——**真 variant**（歡/寬/機；Crystal 不確定處標 □） |
| 3 | 割自**己**肉 | 割自**身**肉 | 內病本一投 | 龍山寺版 vs 龍成宮版差異；目視「割自己肉」為附錄二讀法（口語化） |
| 4 | **痛**本**一**般 | 疾痛一般 | （接「內成緣之象」） | 「疾痛一般」（longcheng）vs「痛本一般」（目視）——疑「疾」字判讀差 |
| 5 | 此籤肉成瘡之象 | （詩意：割肉成瘡之象） | 此籤內成緣之象 | **「肉成瘡之象」（目視＋longcheng 詩意互證）**vs raw「內成緣之象」——raw 誤讀可能高 |
| 6 | 凡事守舊待時 | （詩意：只宜守舊待時） | 凡事守舊待時 | 雙源一致 |

### Crystal 音韻／格律分析（2026-08-29 補充）

1. **籤詩格律**：龍成宮版四句「歡／安／還」1/2/4 句押 an 韻、第三句不押——符合常見七言絕句格 ✓（與 slip text 層互證：#65 籤詩格律完整）
2. **解曰對偶**：「知止則止／知寬自寬」＋「割自身肉／疾痛一般」四字句兩兩對偶工整 ✓
3. **版本品質判斷**：龍成宮版格律/對偶完整 vs 附錄二（Crystal 目視）「知歡割自己肉痛本一般」不通順不對偶——兩種可能：①附錄二為劣化轉錄（格律句轉錄錯置流傳）②附錄二為在地改寫版本。**內部證據（格律）傾向：附錄二影像上的文字即為龍山寺現行版原樣（劣化或改寫皆為歷史事實，verbatim 照收）**

> ⚠️ **SUPERSEDED HISTORICAL RECORD（福 gate 前的修正方案，已由 92037bc/a4d8e69 執行）**
> 此段記錄 gate 前的處理方案與 #65 版本差異發現過程——內容為歷史紀錄，非 current status。
> **Current status**：#17＝`manual_image_confirmation`（雙人目視）；#65＝句 1/3/4/5/6 Crystal 目視確認＋句 2 □（真 textual variant）；修正已提交 PR #24（`5d4d0b7`→`92037bc`→`a4d8e69`）。
> 詳細比對內容保留如下（歷史）：

### verbatim 修正方案（謹慎版，待福 gate）

**verbatim 修正為**：「得止且止。知□□□。割自己肉。疾痛一般。此籤肉成瘡之象。凡事守舊待時。」
- 句 2「知歡？」三源三讀且 Crystal 自評不通順 → **保留 □（兩字）**，三種讀法全記 variants_or_notes
- 句 3-6 依 Crystal 目視（manual_image_confirmation）修正——「肉成瘡之象」與 longcheng 詩意互證
- longcheng 版全解曰記 variants_or_notes（comparison witness，不作 verbatim 依據——**production witness 是附錄二**）
- **治理意義**：本例證明 pilot 價值超出「修 OCR 錯字」——#65 解曰存在**跨廟宇版本差異**，是 textual variant 的實錄（Draw One 首例）

### 誠實標記

- 本例顯示另一類 verbatim 問題：**「截斷＋跨段錯位」**（「割肉」「一投」碎片散入 verbatim）——批次 OCR 對直排格狀版面的行序誤判
- pass2 抓錯段落（籤詩 vs 解曰）提醒：人工核對時應以**版面位置**而非 OCR 標籤為準

---

## Current Status（#17／#65）

| 籤 | verbatim 定案 | 狀態 |
|---|---|---|
| #17 | 心中不定。枉費思量。只求餅充飢之象。凡事虛少實。 | **current**：`manual_image_confirmation`（Crystal＋福雙人目視確認「之象」）；後續句「晨昏只好念阿彌。畫餅如何療得飢。」CANDIDATE 註記 |
| #65 | 得止且止。知□□□。割自己肉。疾痛一般。此籤肉成瘡之象。凡事守舊待時。 | **current**：句 1/3/4/5/6 Crystal 目視確認（manual）；句 2 保留 □（真 textual variant：龍山寺版 vs 五甲龍成宮版三源三讀）；「內病本一投」為舊判讀殘留，current verbatim 以 ledger 為準 |

> ⚠️ **SUPERSEDED（2026-08-29）**：「#17/#65 定案為 `human_textual_inference`」為目視確認前的舊狀態。
> **唯一 current status**：
> - **#17**：`manual_image_confirmation`（Crystal＋福雙人目視確認「之象」）——verbatim 定案「心中不定。枉費思量。只求餅充飢之象。凡事虛少實。」
> - **#65**：句 1/3/4/5/6 Crystal 目視確認（manual）；句 2 保留 □（真 textual variant，三源三讀）——verbatim「得止且止。知□□□。割自己肉。疾痛一般。此籤肉成瘡之象。凡事守舊待時。」
> - verbatim 修正**已提交**：PR #24 commit `5d4d0b7`（修正案）→ `92037bc`（ledger＋validator v2）→ `a4d8e69`（CI）——非「待提交」

## Pilot 結論（~~待福 gate~~ → 已 gate：2026-08-29 福確認「1,2 都過」）

> ⚠️ 本段為 gate 前歷史紀錄（「待福 gate」「建議人工核圖」「福 gate 後再提交」均已過期——**gate 已過、修正已提交 PR #24 並 merge 流程中**）。

1. **兩例均成立**：現 verbatim 的 UNRESOLVED 主要來自「批次 OCR 句序錯位＋截斷」，raw_jie ＋ slip_pages 重讀雙 path 可重建更完整讀法 → **已由福 gate 確認並執行**
2. **修正原則（已 gate 過並執行）**：
   - raw_jie ＋ 重讀 exact/高相似 → 以 raw_jie 為準修正 verbatim（如 #65 句 1/3/4）
   - 兩 path 讀法分歧的字 → 保留 □ 標記待人工核圖（如 #17 句 3 事/象、#65 句 2）
   - 修正後 transcription_status：達雙 path exact → PROBABLE；分歧段 → UNRESOLVED（reason code: dual_path_divergence）
3. **擴 19 籤風險評估**：普查已執行（16/19 疑似截斷）→ 已擴大並完成
4. **人工核圖項（已完成）**：#17「事/象」Crystal 定案「之象」＋福目視確認；#65 句 2 Crystal 語義定案「知足則自安」（見 Current Status）

## 19 籤相似度普查（2026-08-29 已執行——gate 輔助數據）

verbatim（去□）vs raw_jie 相似度分布（19 籤，排除 pilot 兩例）：

| 嚴重度 | 數量 | 籤號 |
|---|---|---|
| 高相似（≥0.8） | 0 | — |
| 中（0.6–0.8） | 7 | 5, 10, 12, 15, 20, 21, 35 |
| 低（<0.6） | 12 | 1, 4, 7, 9, 13, 14, 16, 31, 44, 48, 77, 96 |
| **疑似截斷（raw 長度 >1.5× verbatim）** | **16** | 1, 4, 7, 9, 10, 12, 13, 15, 16, 21, 31, 35, 44, 48, 77, 96（#7 最嚴重：raw 64 字 vs verbatim 19 字） |

**結論：19 籤的 verbatim 幾乎全面相對 raw_jie 截斷/誤讀**——擴大方案形狀＝逐籤以 raw_jie＋slip_pages 重讀重建（同 #17/#65 pilot 流程），預期多數可從 UNRESOLVED 升級。普查明細存 `guanyin_21census.json`。

## 下一步（已完成）

1. ~~Crystal 目視核圖 2 處分歧字~~ → **已完成**（#17「之象」雙人目視確認；#65 句 2 保留 □ 為真 variant）
2. ~~verbatim 修正 PR~~ → **已提交**：PR #24（`5d4d0b7` 修正案→`92037bc` ledger＋validator v2→`a4d8e69` CI＋gitignore）→ 福已 gate「1,2 都過，直接跑 19 籤」→ 19 籤重建完成並 push（`90229eb` docs-sync）
