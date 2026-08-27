# 關帝百籤 — Evidence Inventory（2026-08-27 最終）

## 1. Witness 清單

| witness_id | 名稱 | 角色 | 存取 | 覆蓋 | 備註 |
|---|---|---|---|---|---|
| W1 | NLC 道藏第 4379 冊 PDF（Wikimedia Commons `NLC892-411999005947-9653 道藏 第4379冊.pdf`） | production witness | free access、可下載（17MB、94 頁） | 全本 | 內容含宋濂碑文＋傅燁序＋100 籤；2026-08-27 全量 OCR |
| W2 | pdf-ocr（OCR-B） | transcription candidate | 本地重現（pdf-ocr skill） | p12–94 全 83 頁 | 直排掃描，欄位混排＋形近誤讀多 |
| W3 | autoglm 頁面 OCR（OCR-C） | transcription candidate | 本地重現（autoglm image recognition） | 70 頁（第一輪 52 + 補跑 23） | 直排品質優於 W2，欄位歸屬偶錯 |
| W4 | wikisource《護國嘉濟江東王靈籤》全文 | 既有 transcription（PROBABLE） | https://zh.wikisource.org | 100/100 | 2026-08-15/17 直接抓取；本輪驗證對象 |

## 2. Edition 記錄

- **edition_id**: `ed-guandi-daozang-fuye-1225`
- **title**: 《護國嘉濟江東王靈籤》（傅燁撰，道藏本）
- **版本**：原作南宋寶慶 1225–1227（傅燁撰）；《正統道藏》1445 收錄（正一部）
- **本輪使用載體**：NLC 道藏第 4379 冊 PDF（中國國圖藏本數位檔，Wikimedia Commons 代管）
- **registry 更新**：`Historical Editions Registry/guandi/historical_editions.json`（image_access_status → obtained；digital_source 更新；evidence 追加 NLC PDF 記錄）
- **版本同源性備註**：NLC 藏本與 ctext res=84978（未採用，疑需登入）皆屬正統道藏系統；同版機械比對未做（PROBABLE 同版，非本輪範圍）

## 3. Source Locator 格式

```
Wikimedia Commons NLC892-411999005947-9653 道藏 第4379冊.pdf（頁 N）
```

- 每籤 locator 已更新於 `slip_texts.verified_v3.json`（100/100）
- 頁碼定位：94 籤由 OCR「第N」籤序標記定位；6 籤（#4→p15、#6→p16、#8→p18、#9→p19、#82→p77、#91→p84）由詩句 2-gram 補定位
- 頁面 PNG（`daozang_pages/pXXX.png`，200dpi）供人工核對

## 4. 人工核對優先清單（backlog）

### 4a. candidate_variant 28 句（rate≥0.8 單字差異）

| # | 句 | 差異 | 優先級 |
|---|---|---|---|
| 24,35,54,57,62,90,91 | 「裹」7 處（夏裹/門裹/叢裹/鬧裹/城裹×2/妙裹） | wikisource「裹」vs OCR「里」 | **高**（疑 wikisource 形近誤植「裏/裡」） |
| 33 | 眼底昏昏 | 底 vs 心 | 高 |
| 36 | 昊山嶺上 | 昊 vs 吳 | 高 |
| 21 | 結成寃 | 寃 vs 冤 | 中（異體） |
| 36,53,56,58,60,62,64,71,81,82,88,89,94,99 | 著/者、烏/鸟、強/强、生/住、偽/撝、頼/賴、协/恊、落/凌、赖/頼、達/逹、是/见、奈/柰、輸/轮、绿/緣、冷/嶺 | 各 1 處 | 中 |

### 4b. partial_fragment 18 句 + no_reliable_fragment 23 句

- 需人工對 `daozang_pages/` PNG 逐句核對（直排打散，OCR 無法可靠讀取）
- 明細：`guandi_variant_analysis.md`

## 5. 檔案清單（Task 2 交付）

| 檔案 | 說明 |
|---|---|
| `guandi_verification_report_v3.json/.md` | 100 籤逐籤狀態＋witness grade＋頁碼 |
| `guandi_witness_analysis.json/.md` | 未雙命中句分析（單 witness/OCR 間分歧） |
| `guandi_variant_analysis.json/.md` | 69 未確認句分類（candidate/partial/no_reliable） |
| `guandi_qa_summary.md` | 本 QA summary（Final Confidence Table） |
| `slip_texts.verified_v3.json` | 更新版 slips（status/locator/notes/witness_grade）——DRAFT 待福 review |
| `slip_page_map_full.json` | 100/100 numbering 定位表 |
| `verify_guandi_daozang2.py` | 三方比對工具（可重現） |
| `analyze_guandi_witness.py` / `analyze_guandi_variants.py` | 分析工具 |
| `daozang_4379.pdf` + `daozang_pages/` | witness 本體＋頁面 PNG |
| Historical Editions Registry `guandi/historical_editions.json` | 已更新 |
