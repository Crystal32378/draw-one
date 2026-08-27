# 關帝百籤 transcription verification — 交付說明 v4（2026-08-27 福 re-gate 修正版）

**corpus:** guandi｜**witness:** NLC 道藏第 4379 冊 PDF（Wikimedia Commons）｜**狀態:** DRAFT，待福 re-review（與六十甲子 Task 1 一起）

---

## 1. 本輪修正了什麼（narrow re-gate，不重跑研究）

福 re-gate 意見逐項落實：

| 福的意見 | 修正 |
|---|---|
| OCR-B/OCR-C 是同一影像的兩條 transcription path，非獨立 textual witnesses | 拆 `transcription_grade`（A/B/LOW）與 `textual_witness_confidence`（全 `single_witness_not_verified`）；加 `witness_independence` 結構 |
| wikisource 底本獨立性未證明 | `witness_independence.wikisource_independence = unproven`；textual witness count = 1 |
| 不再稱 textual authenticity 的 VERIFIED | 移除 VERIFIED 語義；A/B 保留為 transcription grade |
| matching 限定同一 slip/對應 page | page-scoped：句子只在 cand_pages 內比對；驗證 page 外命中 = 0 |
| 考慮順序與位置 | cand_pages 來自 numbering 定位（100/100）；報告含 per-line 命中頁 |
| 不 normalize 掉 □ | strip_punct keep_box 保留 □；verbatim 不變 |
| 不併 裡/裏/里 | FAN2JIAN 移除 裡/裏→里 映射 |
| #70 未確認句 line-level UNRESOLVED | line_status=unresolved 記錄於 notes；slip 維持 PROBABLE（低信心 candidate） |
| 「裹/里」7 處 | 保留 source literal「裹」，不 canonicalize，繼續標 candidate_variant |
| reproducibility | EVIDENCE_MANIFEST.md：PDF 來源/下載/重跑方式；repo 只含 OCR 輸出與工具 |

## 2. Final Result（v4）

| transcription_grade | 數量 | 籤號 |
|---|---|---|
| A（雙 OCR path 一致） | 16 | 2,3,6,9,12,14,17,19,22,28,38,43,46,61,63,76 |
| B（單 OCR path） | 29 | 1,7,11,16,18,23,26,27,29,31,34,39,41,44,51,52,66,68,69,72,73,77,79,83,84,92,93,96,97 |
| LOW（有句無 OCR path） | 55 | 其餘 |

- transcription_status：100/100 PROBABLE（wikisource 原狀）
- textual_witness_confidence：100/100 single_witness_not_verified
- #70：LOW／PROBABLE／line-level UNRESOLVED 明確

## 3. 未確認句分類（55 籤 69 句）

candidate_variant 28（含「裹/里」7 處高頻候選 #24/35/54/57/62/90/91）／partial 18／no_reliable 23——明細 `variant_analysis.md`

## 4. 四項清單

- **What I know**：v4 語義修正完成（grade/textual 分離）；page-scoped matching 生效（外命中 0）；#70 line-level 正確；「裹/里」7 處保留 literal 未改；clean checkout 可重跑（manifest 提供外部證據來源）
- **What I assume**：wikisource 底本與 NLC 影像同屬道藏系統但獨立性未證明（unproven 誠實標記）；2-gram 0.9 門檻保守
- **What I did not test**：candidate_variant 28 句人工核圖；「裹/里」7 處的影像判讀；wikisource 底本溯源
- **What the next reviewer must verify**：grade A/B 的抽樣覆核；candidate_variant 清單合理性；「transcription path 一致 ≠ textual VERIFIED」的語義是否接受；clean checkout 重跑結果

## 5. 檔案（research/guandi-verification-2026-08-27/）

verification_report_v4.json/.md｜slip_texts.verified_v4.json（DRAFT）｜variant_analysis｜QA_SUMMARY.md｜EVIDENCE_MANIFEST.md｜slip_page_map.json｜ocr/（OCR 輸出）｜verify_guandi_daozang.py / analyze_guandi_variants.py


## 福 re-review III 追加（duplicate marker fail-closed）

- 根因：衝突偵測條件錯誤（`num in seen.values()` 恆 False），duplicate 從未被偵測
- 修正：`num in seen` ＋ duplicate 時**該籤既有 region 一併 drop**（invalid_slips 記錄）；verifier/variant analyzer 均使用 dropped regions（無 fallback）
- hostile regression Test 3b：同頁注入 duplicate #4 → #4 invalid、#5 不受影響 → 全 PASS
- 重算：C path conflict=1（該頁籤本為 LOW）；grade A0/B27/LOW73、variant candidate27/partial8/no_reliable78 維持
