# 六十甲子 QA Summary（v0.4 evidence-driven）

## Final Confidence Table（fresh rebuild 實際結果）

| transcription_confidence | 數量 | evidence criterion |
|---|---|---|
| PROBABLE | 3 | 雙 OCR pass normalize-exact agreement（validator A6 強制） |
| CANDIDATE | 349 | 單次 OCR 觀察（ocr_single_pass / ocr_recheck_single），升級需第二 pass 或人工核圖 |
| UNRESOLVED | 8 | textual_box ×5 / ocr_anomaly ×2（#3 天水註卦、#25 浮山咸卦）/ structural_absent ×1（#59 籤閣聖意） |
| 合計 | 360 | |

### 逐欄分布

| 欄位 | PROBABLE | CANDIDATE | UNRESOLVED |
|---|---|---|---|
| 卦名 | 0 | 58 | 2 |
| 五行方位 | 3 | 56 | 1 |
| 聖意 | 0 | 56 | 4 |
| 籤解 | 0 | 60 | 0 |
| 卦運勢 | 0 | 60 | 0 |
| 籤閣聖意 | 0 | 59 | 1 |

- PROBABLE 3 = #8/#16/#19 五行方位（兩條 OCR pass exact agree）
- #35 卦名「坤卦」＝ocr_recheck_single → CANDIDATE（如實：非人類核圖）
- manual_image_confirmation 全 false
- Gate：A1–A7 全 PASS（含 A6 evidence coherence / A7 anomaly gate）

## Reproducibility

clean clone 後依序執行 build、validate 即得同表；rebuild 與提交版本 byte-identical。
