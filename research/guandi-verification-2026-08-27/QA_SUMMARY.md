# 關帝百籤 — Transcription Verification QA Summary（v0.5 slip-region，福第二輪 re-review）

## witness 語義（不變）

- OCR-B/OCR-C = 同一 NLC 影像的兩條 transcription path；wikisource 底本獨立性 unproven
- textual_witness_confidence 全部 `single_witness_not_verified`

## matching（v0.5 核心：slip-region scoped）

由每條 transcription path 自行切出 per-slip region（`slip_regions.py`，deterministic＋fail-closed）：

1. 逐行偵測籤序 marker（整行≈「第N」，允許 markdown 裝飾）
2. marker 後至下一 marker 前的內容歸該籤；頁首無主行→unassigned 不歸任何人
3. 同編號同頁重複 → 衝突 drop；某籤缺自身 marker → 該頁不提供 evidence
4. **neighboring slip text cannot satisfy current slip evidence**（hostile regression 全 PASS，含真實 p15 案例）

segmentation stats：B path conflict=0、empty_region_pages=13；C path empty=11。

## Final Confidence Table（slip-region 重算結果）

| transcription_grade | transcription_confidence | 數量 |
|---|---|---|
| A（雙 path 全命中） | HIGH | **0** |
| B（單 path 支撐全部四句） | MEDIUM | 27 |
| LOW（有 line-level UNRESOLVED） | LOW | 73 |

B 籤號：3,6,7,11,12,14,22,26,28,29,31,38,41,43,44,51,52,61,63,66,68,69,72,73,76,79,96

- transcription_status 100/100 PROBABLE（wikisource 原狀）；#70 line-level UNRESOLVED 明確
- text|ual_witness_confidence 全部 single_witness_not_verified

> grade A 從 16 歸零＝舊 page-scoped 讓相鄰籤文字可能互相提供匹配；region 化後不再發生。這是誠實結果而非損失。

## 未確認句 Variant 分類（slip-region boundary 下重算）

| 分類 | 句數 |
|---|---|
| candidate_variant | 27 |
| partial_fragment | 8 |
| no_reliable_fragment | 78 |

「裹/里」7 處保留 source literal、不 canonicalize，仍是人工核對優先項。

## Hostile Regression

`regression_test.py`：10 項檢查全 PASS（synthetic 同頁雙籤分割、雙向 cross-contamination 拒絕、fail-closed 缺 marker、真實 p15 案例）。

## Reproducibility

EVIDENCE_MANIFEST.md 提供 PDF 來源與重跑指令；clean clone `verify_guandi_daozang.py .` + `analyze_guandi_variants.py .` + `regression_test.py` 可完整重現（byte-identical 驗證於 push 前 local 完成）。