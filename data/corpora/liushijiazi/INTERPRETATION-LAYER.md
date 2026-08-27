# 六十甲子（北港朝天宮）— Historical Interpretation Layer

**corpus:** liushijiazi | **layer:** historical_interpretation | **edition:** 北港朝天宮官方籤詩圖檔（六十甲子籤；2024-08-05 批次為主、第59籤 2025-06-21 批次）

> 狀態：**DRAFT（build + gate 完成，待福 review）**——資料層停更等 gate，不 merge（與 PR #23/#24 慣例同）

## 收錄範圍

- 北港官方圖檔既有判詞層，六欄位：**卦名**（含卦象記號）、**五行方位**、**聖意**（事項判詞，含討海／作塭／魚苗等北港漁業特有事項）、**籤解**、**卦運勢**、**籤閣聖意**
- 只逐字收官方圖檔既有內容，不收其他網站解釋、不做現代白話、不摘要、不改寫、不補 AI 解讀
- 廟公的話、卦頭故事、圖示等北港特有文化層：收於 `source_texts.json` 附錄（appendix_*），**不進 entries**——欄位範圍決策為 ASSUMPTION，待福 review

## Source hierarchy（production witness 鐵律）

1. **北港朝天宮官方籤詩圖檔（matsu.org.tw）= production witness（唯一權威）**
2. **OCR-A**（2026-08-27 批次，autoglm image recognition 中文逐字）＝ verbatim 來源
3. **OCR-B**（Study 03 commentary_layers）＝ comparison witness，分歧記錄於 variants_or_notes，不覆蓋
4. **第二 OCR 重讀**（#35 卦名、#59 籤閣聖意）= 補充 witness，note 標示

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 60/60 |
| 欄位 × 籤 | 6 × 60 = 360 entries |
| 缺欄位 | 0 |

## 資料結構

每筆 entry 含：`corpus` / `slip_no` / `ganzhi` / `edition` / `field_type`（六欄位之一）/ `verbatim_text` / `source_locator` / `transcription_status` / `layer_class`（=living_tradition）/ `variants_or_notes`

**transcription_status：354 PROBABLE ＋ 6 UNRESOLVED**（明細見 `liushijiazi_qa_summary.md`）

## Data Gate（機器可抓 contract）

`validate_liushijiazi_layer.py` 六項 assertion（adapter from 觀音版）：

| Assertion | 檢查內容 | 結果 |
|---|---|---|
| A1 character coverage | verbatim 每個字（繁簡正規化後）必須在 per-slip source（OCR full ∪ poem）字元集內 | PASS |
| A1b segment trace | 短欄位 ≥2 字片段必須是 per-slip source 的 substring（聖意直排亂序不適用，對齊觀音層） | PASS |
| A2 cross-slip check | 短欄位片段不得僅存在於他籤 source | PASS |
| A3 uncertainty | UNRESOLVED：textual 必含「□」；structural 可無 □（note 需標 structural／缺欄） | PASS |
| A4 structure | 60 籤、每籤 6 筆、10 欄位齊全、layer_class 一致 | PASS |
| A5 encoding | 無 U+FFFD／mojibake／異常控制字符 | PASS |

輸入：`interpretation_layer.json` + `source_texts.json`（per-slip：ocr_full／poem／legacy_layers／appendix）。

## UNRESOLVED 處理原則

- OCR 自標 □（無法辨識）→ verbatim 保留 □，標 UNRESOLVED（textual）
- 圖檔確認無此欄位 → structural，note 標「圖檔未設置此欄位」
- 兩 OCR 分歧 → verbatim 採 OCR-A raw，分歧記錄 notes；不語義補字

## Provenance / Reproducibility

- **source_locator**：`北港朝天宮官網圖檔（slip #N 干支）<url>`，每筆可回查原圖
- **build**：`python3 build_liushijiazi_layer.py <work_dir>`（讀 bg_ocr_full.jsonl + attestations.json + slips.json → 寫 layer + source_texts）
- **gate**：`python3 validate_liushijiazi_layer.py <work_dir>`（exit 0 = PASS）
- **OCR 原始輸出**：`bg_ocr_full.jsonl`（60 籤全量，含 status；#35/#59 有第二 OCR 重讀 witness）

## 定位

本層是 archival / provenance interpretation layer。完整收錄不代表 UI 之後會全部展示；The Slip 仍是主體，Interpretation 是來源註腳。北港版聖意含漁業特有事項（討海／作塭／魚苗），為北港 edition 特徵，與通用網路版不同——不 canonicalize，原樣保留。
