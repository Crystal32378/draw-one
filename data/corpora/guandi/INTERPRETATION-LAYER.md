# 關帝百首 — Historical Interpretation Layer

**corpus:** guandi | **layer:** historical_interpretation | **edition:** 《護國嘉濟江東王靈籤》（傅燁撰，道藏本／維基文庫 transcription）

## 收錄範圍

- 同版兩個欄位：**解曰**（四言八句解讖詩）＋ **聖意**（三言判詞）
- 只逐字收來源既有內容，不收其他網站解釋、不做現代白話、不摘要、不改寫、不補 AI 解讀

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 100/100 |
| 解曰 | 100 筆 |
| 聖意 | 100 筆 |
| 總 entry | 200 筆 |
| 缺欄位 | 0 |

## 資料結構

每筆 entry 含：`corpus` / `slip_no` / `edition` / `field_type`（解曰｜聖意）/ `verbatim_text` / `source_locator` / `transcription_status` / `layer_class`（=historical）/ `variants_or_notes`

**transcription_status 分布：199 PROBABLE ＋ 1 UNRESOLVED**

## UNRESOLVED / variants 清單

| # | field | 狀態 | 說明 |
|---|---|---|---|
| 100 | 解曰 | UNRESOLVED | 「□□」為道藏本缺字（識典古籍 DZ1305 亦作「□□」）；chance.org.tw 雷雨師流通本作「更修陰騭，神必佑之」，缺字疑為「神必佑」 |
| 100 | 解曰 | variant | 「視福神」識典古籍作「禍福神」、「几百」作「凡百」，疑為維基文庫 transcription 誤讀；逐字保留維基文庫原文 |
| 39 | 聖意 | variant | 維基文庫原標「聖息」，應為「聖意」之欄位名 typo |
| 43 | 聖意 | variant | 維基文庫原標「聖意；」用分號，應為「聖意：」之標點 typo |

## Second-witness anomaly sweep

以 chance.org.tw《雷雨師一百籤》為 second witness，逐籤對照維基文庫 transcription（去標點、逐字對齊）。共 180 處差異，多屬 chance 的版本異文／異體字（如 冨/富、隲/騭、饉/謹、愈/癒），不逐一標記。以下為**維基文庫側**的怪字／誤讀，已標進 `variants_or_notes`，逐字保留原文、不校正：

| # | field | 維基文庫 | chance 作 | 判斷 |
|---|---|---|---|---|
| 26 | 聖意 | 辛信還 | 人信還 | 「辛」疑為「人」之誤讀 |
| 43 | 聖意 | 行人歸二失物還 | 失物在。行人還 | 缺標點＋疑誤讀 |
| 58 | 解曰 | 求名爻得 | 求名必得 | 「爻」疑為「必」之誤讀 |
| 68 | 解曰 | 責心不止 | 貪心不止 | 「責」疑為「貪」之誤讀 |
| 100 | 解曰 | 視福神／几百 | 禍福神／凡百 | 「視」「几」疑誤讀（另見上表） |

## Provenance / Reproducibility

- **source_locator**：`zh.wikisource.org/wiki/護國嘉濟江東王靈籤/{1–100}`，每筆可回查
- **transcription_status**：199 PROBABLE（基於維基文庫全文一手抓取）＋ 1 UNRESOLVED（#100 解曰缺字）。道藏影像（ctext）逐籤核對後方可升 VERIFIED
- **抽樣逐字對照**：#5 / #25 / #50 / #75 / #95 重新抓取維基文庫，解曰＋聖意逐字一致
- **異體字**（如「冨」「隲」）原樣保存，不 canonicalize

## 定位

本層是 archival / provenance interpretation layer。完整收錄不代表 UI 之後會全部展示；The Slip 仍是主體，Interpretation 是來源註腳。
