# 關帝百籤 VERIFIED 升級 — 交付說明 v2（2026-08-27 最終）

**corpus:** guandi｜**witness:** NLC 道藏第 4379 冊 PDF（Wikimedia Commons）｜**狀態:** DRAFT，待福 review（與六十甲子 Task 1 一起）

---

## 1. 本輪做了什麼

依 Phase Handoff Task 2：「關帝 100 首 verification（升 VERIFIED）——逐籤對 source image」。

1. **production witness**：Wikimedia Commons `NLC892-411999005947-9653 道藏 第4379冊.pdf`（中國國圖藏《道藏》，94 頁，free access）＝《護國嘉濟江東王靈籤》全本（宋濂碑文＋傅燁序＋100 籤）
2. **全量 OCR**：pdf-ocr 83 頁（OCR-B）＋ autoglm 頁面 OCR 兩輪 70 頁（OCR-C：第一輪 52 頁針對首輪 UNRESOLVED、第二輪補跑 23 頁針對 VERIFIED 籤頁）
3. **三方比對**：wikisource transcription × OCR-B × OCR-C（2-gram 命中率 ≥0.9／句）
4. **witness 驗證**：對 VERIFIED 籤的「未雙命中句」分析另一 OCR 讀到什麼 → 17 句 OCR 間分歧全部為形近/異體誤讀，無實質 variant
5. **variant 分類**：55 PROBABLE 的 69 未確認句 → candidate_variant 28 / partial 18 / no_reliable 23

## 2. Final Result

| 等級 | 數量 | 判準 |
|---|---|---|
| VERIFIED-A（三源一致） | 16 | 四句全雙 OCR（wikisource×B×C） |
| VERIFIED-B（雙源一致） | 29 | 四句至少一 OCR（wikisource×B 或 C） |
| PROBABLE | 55 | 有未確認句（含 28 candidate_variant 需人工核對） |
| UNRESOLVED | 0 | — |

- **#70 維持 PROBABLE**（按 evidence：未確認句「與君定約為霖日，正是蘊隆中伏時。」兩 OCR 皆未可靠命中）
- **numbering 100/100 定位**（94 籤序標記 + 6 補定位）
- **locator 100/100 更新**（NLC PDF 頁碼）

## 3. 重要發現：candidate_variant 28 句

**「裹/里」高頻候選（7 句）**：#24 夏裹、#35 門裹、#54 叢裹、#57 鬧裹、#62 城裹、#90 城裹、#91 妙裹——wikisource「裹」vs OCR「里」，疑 wikisource 形近誤植「裏/裡」，**需核對道藏影像後決定 verbatim 修正或標 UNRESOLVED**。

其餘 21 句為單字差異（異體繁簡 11 + 形近/真異文 10），明細見 `guandi_variant_analysis.md`。

> 分類語義：candidate_variant ≠ wikisource 錯誤；是「需人工核對影像的差異候選」。

## 4. 方法論誠實聲明

- VERIFIED = 籤詩四句在影像 OCR（2-gram ≥0.9）命中；A/B 分級反映 witness 強度
- **VERIFIED 45 的第二 witness 成立**：每句有 wikisource 之外的獨立 OCR 支持；17 句分歧為 OCR 引擎字形差異（玉→王、辯→辨、鹽→塩等），已記錄
- **未逐字人工對原圖**：VERIFIED 45 是「兩獨立 OCR × wikisource 交叉」結果，非人類目視
- PROBABLE 55 未升、未為維持舊數字調整 gate、#70 按 evidence 判斷

## 5. 四項清單

- **What I know**：NLC PDF 即關帝籤全本（免費可重現）；VERIFIED 45（A16/B29）皆有 OCR witness 支持且無實質分歧；55 PROBABLE 有 69 未確認句（28 候選 variant 含 7 處「裹/里」）；100/100 numbering/locator 完成
- **What I assume**：2-gram 0.9 門檻保守（單字誤讀即 fail）；NLC 本與 ctext 本同版（PROBABLE，未機械比對）；「裹/里」7 處疑 wikisource 誤植（需影像確認）
- **What I did not test**：逐字人工對原圖（45 VERIFIED 抽樣覆核 + 55 PROBABLE 69 句）；candidate_variant 28 句的影像核對
- **What the next reviewer must verify**：candidate_variant 28 句（尤其「裹/里」7 處）；VERIFIED 抽樣對原圖；A/B 分級是否採納；「OCR 交叉一致」作為 VERIFIED 判準是否接受

## 6. 下一步（backlog）

1. **人工核對 candidate_variant 28 句**（`daozang_pages/` PNG，優先「裹/里」7 處）→ 決定 verbatim 修正或 UNRESOLVED
2. partial/no_reliable 41 句逐句人工核對（或第三輪更高解析度 OCR）
3. 福 review PASS 後 merge（與六十甲子 Task 1 一起驗收）
