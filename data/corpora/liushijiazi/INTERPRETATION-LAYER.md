# 六十甲子（北港朝天宮）— Historical Interpretation Layer

**corpus:** liushijiazi | **layer:** historical_interpretation | **edition:** 北港朝天宮官方籤詩圖檔（六十甲子籤；2024-08-05 批次為主、第59籤 2025-06-21 批次）

> 狀態：**DRAFT v0.4（evidence-driven confidence）**，福第二輪 re-review 後修正；資料層停更不 merge

## 收錄範圍

- 北港官方圖檔既有判詞層六欄位：卦名／五行方位／聖意／籤解／卦運勢／籤閣聖意
- 只逐字收官方圖檔既有內容；不收其他網站解釋、不做現代白話、不摘要、不改寫、不補 AI 解讀
- 廟公的話、卦頭故事、圖示等收於 `source_texts.json` 附錄（appendix_*），不入 entries

## Source hierarchy

1. **北港官方籤詩圖檔（matsu.org.tw）= production witness**
2. **OCR-A**＝本輪批次（2026-08-27，autoglm 中文逐字，`ocr_bg_2026-08-27.jsonl`）
3. **OCR-B'**＝Study 03 legacy commentary_layers（`attestations.json`）＝同一官方影像的另一條 transcription path（secondary observation）
4. **recheck pass**＝#35 卦名第二 OCR 重讀（另條 path，非人類核圖）

## Evidence-driven confidence（v0.4 核心）

| transcription_confidence | 程式可驗證條件 |
|---|---|
| PROBABLE | 兩條 OCR path 同欄位轉錄 normalize 後 exact 相等（agreement.mode=exact）；validator A6 強制 |
| CANDIDATE | 僅單次 OCR 觀察（ocr_single_pass / ocr_recheck_single） |
| UNRESOLVED | OCR 自標 □（textual_box）/ 圖檔無此欄位（structural_absent）/ 已知形近誤讀異常（ocr_anomaly: #3 天水註卦、#25 浮山咸卦） |

- agreement 以 normalized-exact-equality 為唯一自動升級路徑；diff 相似度存 `agreement.similarity` 供人工審查
- `manual_image_confirmation` 全 false（無人類核圖）

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 60/60；entries 360/360 |

## Data Gate

`validate_liushijiazi_layer.py` 八項 assertion：A1 字元集／A1b segment trace（短欄位）／A2 cross-slip／A3 uncertainty／A4 structure／A5 encoding/**A6 evidence coherence（confidence ⇄ evidence basis 強制一致）**／**A7 anomaly gate**。GATE PASS。

## 檔案（data/corpora/liushijiazi/）

`interpretation_layer.json`｜`source_texts.json`｜`ocr_bg_2026-08-27.jsonl`（OCR-A）｜`build_liushijiazi_layer.py`｜`validate_liushijiazi_layer.py`｜`INTERPRETATION-LAYER.md`｜`QA_SUMMARY.md`

## 定位

archival / provenance layer；The Slip 仍是主體。CANDIDATE 349 筆升 PROBABLE 的路徑：補第二條獨立 OCR pass 且 exact agree，或人類核圖（manual_image_confirmation=true 專用路徑）。