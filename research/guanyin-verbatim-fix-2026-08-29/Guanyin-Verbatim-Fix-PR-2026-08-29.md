# 觀音解讀層 verbatim 修正案 — 21 籤目視核圖成果（2026-08-29）

**呈：** 福（gate）｜**依據：** Crystal 目視核圖（manual_image_confirmation）× 21 籤——**16 籤全 manual（manual_image_confirmation=true）＋ 5 籤 mixed（#4 #16 #20 #44 #77，manual_image_confirmation=false＋source_observation_status=mixed_manual_ocr＋segment_basis_note）** ＋ #17/#65 雙人目視 pilot
**成果：** 解曰 **79 PROBABLE/21 UNRESOLVED → 94 PROBABLE/1 CANDIDATE/5 UNRESOLVED**（#44 混合條目降 CANDIDATE：前段 manual＋後段 ocr_raw 單源）

---

## 修正方法

1. slip_pages 逐籤裁切影像（高解析）第三 OCR pass（21/21 重讀完成）
2. Crystal 目視附錄二影像逐字判讀（manual_image_confirmation）
3. 四源比對（verbatim/raw_jie/page-chance/重讀）→ Crystal 定案
4. 真實 textual variant（三源三讀）→ 保留 □ 記 variants_or_notes

## 修正統計

| 項目 | 修正前 | 修正後 |
|---|---|---|
| 解曰 PROBABLE | 79 | **94** |
| 解曰 UNRESOLVED | 21 | **5** |
| 解曰 CANDIDATE | — | **1**（#44） |
| verbatim 變更 | — | 21 筆（**16 籤依 Crystal 目視定案（全 manual）＋ 5 籤 mixed（前段 manual＋後段 OCR/raw 補，segment_basis_note 詳記）**） |
| 擴充（新增後段） | — | #4（破鏡重圓之象）、#44（挑進敵手之象）等 |

## UNRESOLVED 5 籤（原因明確）

| # | 原因 | 說明 |
|---|---|---|
| 12 | 真 variant | 首字三讀（麻/萬/草）、哭前字三讀（雖/誰/睢） |
| 20 | 二讀 □ | 「此幾/此後」「皆過/皆通」 |
| 35 | 真 variant | 「重签/重整/聖筌」三讀 |
| 65 | 真 variant | 句 2 三源三讀（知歡/知機到自昌/知止則止知寬自寬）——龍山寺版 vs 五甲龍成宮版差異實錄 |
| 77 | 首字 □ | 「筆/得」差異 |

## 重要發現（附帶）

1. **#21 raw_jie 誤記籤詩**：source_three_way 的 raw_jie 內容是籤詩（陰陽道合總由天…）而非解曰——真解曰「營謀皆遂。婚姻孕男。貲財積聚。更吉田蠶。此籤陰陽道合之象。凡是和合大吉。」（Crystal 目視＋重讀雙源）
2. **#65 跨廟宇版本 variant 實錄**：龍山寺版 vs 五甲龍成宮版解曰實質差異（Draw One 首例真 textual variant 文檔）
3. **#17 音韻證據**：「之象」與「思量」押 ang 韻——Crystal 音韻判定＋目視雙重確認
4. **schema 漸進**：本批 21 筆新增 confidence 四欄（transcription_confidence/source_observation_status/manual_image_confirmation/unresolved_reason_code）；其餘 179 筆待下批遷移

## 檔案

- `data/corpora/guanyin/interpretation_layer.json`（修正後 interpretation_layer，21 筆 verbatim 變更＋schema v0.2 欄位）
- `Guanyin-17-65-Pilot-Report-2026-08-28.md`（#17/#65 pilot 詳細報告）
- `guanyin_19_evidence_pack.json`（19 籤四源完整對照）
- `guanyin_21_worksheet.xlsx`（Crystal 目視判定原始記錄）
