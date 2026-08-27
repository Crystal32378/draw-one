# 關帝百籤 — Transcription Verification QA Summary（v4，2026-08-27 福 re-gate 修正版）

## 概況

- **corpus**: guandi（關帝百籤，《護國嘉濟江東王靈籤》）
- **edition**: ed-guandi-daozang-fuye-1225（傅燁撰，道藏本）
- **production witness**: NLC 道藏第 4379 冊 PDF（Wikimedia Commons，free access，94 頁）
- **witness 語義（修正）**:
  - OCR-B（pdf-ocr）與 OCR-C（autoglm）= **同一份 NLC 影像的兩條 transcription path**，非獨立 textual witnesses
  - wikisource 底本與 NLC 影像的獨立性**未證明**
  - textual witness 數量 = 1 → **textual_witness_confidence 全部 `single_witness_not_verified`**（不稱 VERIFIED）

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 100 / 100 |
| 頁碼定位（numbering） | 100 / 100（94 籤序標記 + 6 詩句補定位） |
| 籤詩四句 transcription | 100 / 100 |
| matching boundary | page-scoped（限定 cand_pages，全 corpus 外命中 0） |

## Final Confidence Table（v4）

| transcription_grade | transcription_confidence | 數量 | 判準 |
|---|---|---|---|
| A | HIGH | 16 | 每句兩條 OCR path 都命中（wikisource × B × C 一致） |
| B | MEDIUM | 29 | 每句至少一條 OCR path 命中（wikisource × B 或 C） |
| LOW | LOW | 55 | 有句子兩條 OCR path 皆未命中（line-level UNRESOLVED） |

- **transcription_status**：100/100 維持 PROBABLE（wikisource 轉錄原狀；LOW grade = 低信心 candidate，非 UNRESOLVED）
- **textual_witness_confidence**：100/100 = `single_witness_not_verified`（只有一份 production witness，不設 textual VERIFIED）
- **#70**：grade LOW、status PROBABLE、line-level UNRESOLVED「與君定約為霖日，正是蘊隆中伏時。」（notes 明確記錄）

## 未確認句 Variant 分類（55 籤、69 句）

| 分類 | 句數 | 說明 |
|---|---|---|
| candidate_variant | 28 | fragment 高可信（rate≥0.8）且差異 ≤3 字——候選 textual variant，需人工核對影像 |
| partial_fragment | 18 | fragment 部分可信（rate 0.7–0.8） |
| no_reliable_fragment | 23 | OCR 未可靠讀到（直排打散/漏讀） |

**「裹/里」7 處**（#24/35/54/57/62/90/91）：保留 wikisource source literal「裹」，不 canonicalize、不改字；繼續標 candidate_variant，待人工核對影像。

## matching 修正確認

- page-scoped：句子只在該籤 cand_pages 內比對（驗證：page 外命中 0）
- 不 normalize □：□ 保留於 verbatim
- 不併 裡/裏/里：FAN2JIAN 已移除相關映射（這些正是 candidate variant 觀察重點）

## 誠實聲明

- transcription_grade A/B 是「transcription path 一致度」，**不是 textual authenticity 的 VERIFIED**
- textual authenticity 只有單一 witness（NLC 影像），wikisource 底本獨立性未證明 → 全部 single_witness_not_verified
- 未逐字人工對原圖；candidate_variant 28 句需人工核對（「裹/里」7 處優先）
- 未為了數字調整 gate；reproducibility 依 EVIDENCE_MANIFEST.md（PDF 不入 repo，OCR 輸出已提交）
