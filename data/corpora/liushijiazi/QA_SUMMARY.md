# 六十甲子 Historical Interpretation Layer — Transcription QA Summary（v0.3，福 re-gate 修正版）

## 概況

- **corpus**: liushijiazi（北港朝天宮六十甲子籤）
- **edition**: 北港朝天宮官方籤詩圖檔（2024-08-05 批次為主、第59籤 2025-06-21 批次）（production witness）
- **layer_class**: living_tradition
- **field_types**: 卦名／五行方位／聖意／籤解／卦運勢／籤閣聖意（六欄位；廟公的話／卦頭故事／圖示收 source_texts 附錄，待福 review 是否納入）
- **schema v0.2**（福 re-gate）：新增 confidence 四欄

## Coverage

| 項目 | 覆蓋 | 說明 |
|---|---|---|
| slip coverage | 60 / 60 | 六欄位各 60 筆 = 360 entries |
| 缺欄位 | 0 | #59 籤閣聖意為 structural_absent（圖檔無此欄） |

## Final Confidence Table（v0.3）

| 欄位 | PROBABLE | UNRESOLVED | 缺欄 |
|---|---|---|---|
| 卦名 | 58 | 2（#3 天水註卦、#25 浮山咸卦：ocr_anomaly） | 0 |
| 五行方位 | 59 | 1（#9 占□月：textual_box） | 0 |
| 聖意 | 56 | 4（#22/#25/#32/#42：textual_box） | 0 |
| 籤解 | 60 | 0 | 0 |
| 卦運勢 | 60 | 0 | 0 |
| 籤閣聖意 | 59 | 1（#59：structural_absent） | 0 |
| **總計** | **352** | **8** | **0** |

## Confidence 四欄（名實相符，福 re-gate）

| 欄位 | 語義 | 現況 |
|---|---|---|
| `transcription_confidence` | PROBABLE / UNRESOLVED | 352 / 8 |
| `source_observation_status` | ocr_single_pass / ocr_recheck / structural_absent / human_image_confirmed | 358 / 1（#35）/ 1（#59）/ 0 |
| `manual_image_confirmation` | boolean（人類直接核圖） | **全 false**（#35 是第二 OCR 重讀，非人類核圖——如實標 ocr_recheck） |
| `unresolved_reason_code` | textual_box / structural_absent / ocr_anomaly / parse_artifact | 5 / 1 / 2 / 0 |

**UNRESOLVED 8 筆明細**

| # | 欄位 | reason_code | 說明 |
|---|---|---|---|
| 3 | 卦名 | ocr_anomaly | 「天水註卦」疑「天水訟卦」形近誤讀（註/訟），不猜字待核圖 |
| 9 | 五行方位 | textual_box | OCR 自標「占□月」 |
| 22 | 聖意 | textual_box | 表格 OCR 含 □ |
| 25 | 卦名 | ocr_anomaly | 「浮山咸卦」疑「澤山咸卦」形近誤讀（浮/澤），不猜字待核圖 |
| 25 | 聖意 | textual_box | OCR 自標 □ |
| 32 | 聖意 | textual_box | OCR 讀出內容疑誤讀 |
| 42 | 聖意 | textual_box | OCR 自標「多□□（原文字跡模糊）」 |
| 59 | 籤閣聖意 | structural_absent | 圖檔未設置此欄位（2025 批次版式） |

> #42 卦名/五行方位原含 markdown 殘留（**火風鼎卦**  ###），v0.3 已清乾淨（PROBABLE，verbatim「火風鼎卦」）。

## Data Gate（8 assertions）

`validate_liushijiazi_layer.py` v0.3：**GATE PASS**

| Assertion | 內容 | 結果 |
|---|---|---|
| A1 / A1b / A2 | 字元集 / segment trace（短欄位）/ cross-slip | PASS |
| A3 | uncertainty（UNRESOLVED 語義） | PASS |
| A4 | 60×6、14 欄位、confidence 合法值 | PASS |
| A5 | encoding | PASS |
| A6 | evidence coherence（manual confirmation 一致性；UNRESOLVED 必有 reason code） | PASS |
| A7 | anomaly gate（#3/#25 卦名必須 UNRESOLVED+ocr_anomaly） | PASS |

## Reproducibility（clean checkout）

- `python3 data/corpora/liushijiazi/build_liushijiazi_layer.py .` → 360 entries
- `python3 data/corpora/liushijiazi/validate_liushijiazi_layer.py .` → GATE PASS
- 輸入全在 repo 內（ocr_bg_2026-08-27.jsonl / attestations.json / slips.json）；全新 clone 實測通過；rebuild 與提交版本 byte-identical

## 誠實聲明

- PROBABLE 352 = OCR-A 逐字轉錄，**未逐字人工對原圖**；manual_image_confirmation 全 false
- 不因「沒有 □」就給 PROBABLE（#3/#25 異常已標 ocr_anomaly）
- 欄位範圍（六欄位）為 ASSUMPTION 待福 review；聖意網格直排小字有 OCR 風險
