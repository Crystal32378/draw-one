# 關帝百籤 — Transcription Verification QA Summary（2026-08-27 最終）

## 概況

- **corpus**: guandi（關帝百籤，《護國嘉濟江東王靈籤》）
- **edition**: ed-guandi-daozang-fuye-1225（傅燁撰，道藏本）
- **production witness**: NLC 道藏第 4379 冊 PDF（Wikimedia Commons，free access，94 頁）
- **witness hierarchy**:
  1. NLC 道藏 PDF（production witness）
  2. OCR-B = pdf-ocr（83 頁全量，p12–94）
  3. OCR-C = autoglm 頁面 OCR（第一輪 52 頁 + 第二輪補跑 23 頁 = 70 頁）
  4. wikisource transcription（既有 PROBABLE 轉錄）

## Coverage

| 項目 | 數量 |
|---|---|
| 籤數 | 100 / 100 |
| 頁碼定位（numbering） | 100 / 100（94 籤序標記 + 6 詩句補定位） |
| 籤詩四句 transcription | 100 / 100 |
| OCR 覆蓋（B） | 83 / 83 頁 |
| OCR 覆蓋（C） | 70 / 83 頁（其餘 13 頁為 PROBABLE 籤獨佔頁，C 未跑） |

## Final Confidence Table

| 等級 | 數量 | 判準 | 籤號 |
|---|---|---|---|
| VERIFIED-A（三源一致） | 16 | 四句全雙 OCR 命中（wikisource × B × C） | 2,3,6,9,12,14,17,19,22,28,38,43,46,61,63,76 |
| VERIFIED-B（雙源一致） | 29 | 四句至少一 OCR 命中，非全雙（wikisource × 單一 OCR；另一 OCR 未讀到或形近誤讀） | 1,7,11,16,18,23,26,27,29,31,34,39,41,44,51,52,66,68,69,72,73,77,79,83,84,92,93,96,97 |
| PROBABLE（未確認句） | 55 | 有句子兩 OCR 皆未命中（維持原狀態，未升） | 4,5,8,10,13,15,20,21,24,25,30,32,33,35,36,37,40,42,45,47,48,49,50,53,54,55,56,57,58,59,60,62,64,65,67,70,71,74,75,78,80,81,82,85,86,87,88,89,90,91,94,95,98,99,100 |
| UNRESOLVED | 0 | （wikisource 轉錄本身無內部可疑） | — |

> #70 按 evidence 判斷維持 PROBABLE（未確認句：「與君定約為霖日，正是蘊隆中伏時。」）——非預設，是該句兩 OCR 皆未可靠命中。

## VERIFIED 的 witness 驗證（第二 witness 是否成立）

補跑第二輪 autoglm（23 頁）後，VERIFIED 45 的證據狀態：

| 項目 | 數量 | 說明 |
|---|---|---|
| 全雙命中句 | — | VERIFIED-A 16 籤每句 b+c 都命中 |
| 單 witness 句 | 20 | 另一 OCR 未讀到（品質差/漏讀），wikisource + 單一 OCR 一致 |
| OCR 間分歧句 | 17 | 另一 OCR 讀近似（rate 0.7–0.85）但字不同；**全部為形近/異體誤讀**（玉→王、辯→辨、鹽→塩、日→曰、晴→睛、滂→澇、灰→厌 等），無實質 textual variant |

**結論：VERIFIED 45 的第二 witness 成立**（每句都有 wikisource 之外的獨立 OCR 支持）；17 句分歧為 OCR 引擎字形差異，已記錄於 notes 供抽查。未發現需降級的證據。

## PROBABLE 55 未確認句分析（69 句）

| 分類 | 句數 | 說明 |
|---|---|---|
| candidate_variant | 28 | fragment 高可信（rate≥0.8）且差異 ≤3 字——**候選 textual variant，需人工核對影像** |
| partial_fragment | 18 | fragment 部分可信（rate 0.7–0.8） |
| no_reliable_fragment | 23 | OCR 未可靠讀到（直排打散/漏讀），需人工核對影像 |

### candidate_variant 重點（28 句）

- **「裹/里」高頻候選（7 句）**：#24 夏裹、#35 門裹、#54 叢裹、#57 鬧裹、#62 城裹、#90 城裹、#91 妙裹——wikisource 讀「裹」，OCR 讀「里」；「裹」疑為「裏/裡」形近誤植，**需核對道藏影像**（p31/p39/p50/p52/p61/p83/p84 附近）
- 其餘單字差異：寃/冤、着/者、強/强、達/逹、奈/柰、輸/轮、绿/緣、協/恊、頼/賴（異體繁簡）；底/心、昊/吳、膈/隔、烏/鸟、偽/撝、落/凌、冷/嶺、是/见（形近或真異文）——逐句明細見 `guandi_variant_analysis.md`

> 分類語義：candidate_variant 是「wikisource 與 OCR 的單字差異候選」，**不代表 wikisource 錯**；升 VERIFIED 或修正 verbatim 前需人工核對影像。

## 誠實聲明

- VERIFIED 45 = 籤詩四句在影像 OCR（2-gram ≥0.9）確認；A/B 分級反映 witness 強度；**未逐字人工對原圖**
- PROBABLE 55 未升：未確認句需人工核對（28 candidate_variant 優先）
- 未為了維持舊數字調整 gate；#70 按 evidence 判斷
- 2-gram 命中率 0.9 門檻偏嚴（單字誤讀即 fail），VERIFIED 是保守下限
