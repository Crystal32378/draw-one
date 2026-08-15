# Oracle Framework Stress Test 02
# 觀音研究長出的 provenance framework，放到雷雨師／關帝百籤 corpus 上測試

> 產出日期：2026-08-15 ｜ 對照：Oracle Corpus Study 01（觀音靈籤 100／《觀音靈課》）framework
> 目的：這是第二個 reference corpus，檢驗上一輪觀音研究長出的方法論有多少真的跨 corpus 成立。
> 原則：**不要為了讓 framework 看起來漂亮而硬套。**

---

## 1. 測試結論（TL;DR）

| 類別 | 數量 | 說明 |
|---|---|---|
| Universal fields（兩套都成立） | 9 | 大部分核心紀律直接沿用 |
| Corpus-specific fields（只有本套需要） | 5 | 東坡解、碧仙註、占驗、籤頭故事、干支 |
| Framework failures（現有 ontology 無法正確描述） | 3 | deity 單一欄位、corpus self-identification、edition family 跨 800 年 |

---

## 2. Universal fields（觀音與關帝兩套都成立的規則）

| # | Field / Rule | 觀音套用 | 雷雨師套用 | 結論 |
|---|---|---|---|---|
| 1 | access_status（open/restricted/paid/unknown） | ✅ | ✅ | 成立 |
| 2 | license_status（ok/unsure/no）＋Access ≠ License | ✅ | ✅ | 成立（本輪全 unsure） |
| 3 | platform_rights_status ≠ item_license_status | ✅（故宮 CC0） | ✅（行天宮官網 jpg：平台可下載 ≠ item 可 reuse） | 成立 |
| 4 | Search failure ≠ non-existence | ✅ | ✅ | 成立 |
| 5 | secondary source ≠ VERIFIED | ✅ | ✅ | 成立（籤詩網等全部只作對照） |
| 6 | source_observation_status ≠ edge_level | ✅ | ✅ | 成立（source 觀察狀態不得解讀為 claim 級別） |
| 7 | same text ≠ independent source（mirror 判別） | ✅ | ✅ | 成立（網路轉錄群判定為同一 edition family） |
| 8 | deity adoption ≠ textual origin | ✅（觀音籤 vs 淺草系） | ✅（關帝籤 origin 是石固） | **成立且在本套更關鍵** |
| 9 | 四級 edges（verified/probable/hypothesized/unresolved） | ✅ | ✅ | 成立 |

**結論：方法論核心（證據四級＋雙層級語義＋adoption/origin 分離）在兩套 corpus 都成立，可以直接作為 Draw One 的通用 research framework。**

---

## 3. Corpus-specific fields（只有雷雨師／關帝百籤需要）

| # | Field | 說明 | 觀音套有沒有 |
|---|---|---|---|
| 1 | 籤頭故事 | 每籤附歷史／小說典故故事（「籤頭」），福安宮格式正面即此 | 觀音百籤有類似（卦頭故事）但欄位命名不同——**需統一命名或保留雙名** |
| 2 | 東坡解 | 蘇東坡名義的解籤文（每籤一段） | **無**（觀音籤無此欄位） |
| 3 | 碧仙註 | 碧仙名義的註文 | **無** |
| 4 | 占驗 | 前人占卜應驗實例 | **無**（觀音籤罕見） |
| 5 | 干支 | 每籤配干支（如第 100 籤「癸癸上上」）；籤筒多以籤序為主、干支保留對應 | 觀音籤無干支欄位（吉凶等級為主） |

> 意義：雷雨師籤的**註釋層**（東坡解／碧仙註／占驗）遠比觀音籤厚——framework 的 slip schema 需要支援「多註釋層」而非單一聖意欄位。

---

## 4. Framework failures（現有 ontology 無法正確描述的缺口）

### Failure 1：deity 是單一欄位，無法描述「origin deity ≠ adoption deity」

- 現況：觀音 framework 中 deity 假設「籤的歸屬神」。
- 本套：文本 origin deity = 石固（江東王）；primary adoption deity = 關帝；secondary adoption = 城隍／福德正神／孔子文昌（候選）。
- **缺口**：需要至少兩個欄位——`corpus_origin_deity` 與 `primary_adoption_deity`，並允許 adoption 清單（多神）。
- **通用化**：觀音籤其實也有此問題（origin 可能是天竺靈籤系統，adoption 是觀音廟）——只是觀音 case 沒被逼出來。

### Failure 2：缺「corpus self-identification」欄位

- 雷雨師籤的 corpus 身分**內嵌在文本**：第 100 籤自述「我本天仙雷雨師」——這是 corpus 名稱的自我宣稱。
- 觀音籤無此機制。
- **缺口**：framework 應有 `self_identification`（文本內自述身分的籤號與文字）欄位，作為 corpus identity 的內嵌證據。這個欄位對「名稱考」（RQ1）極有價值——名稱不是外部貼的，是文本自己說的。

### Failure 3：edition family 跨 800 年，「版本」概念粒度不足

- 道藏本（南宋造、明代收錄）→ 光緒印本 → 現行各廟本：文本高度穩定（第 1／100 籤一致），但中間節點多為 PROBABLE。
- 現有 framework 的「版本」節點假設近代印刷本。
- **缺口**：需要 `textual_lineage`（文本系譜：哪個節點是同文、哪個是翻刻、哪個是重印）與「版本節點」分層——尤其要能表達「文本穩定但 provenance 節點鬆散」的狀況（800 年同文 vs 節點證據不全，兩者並存）。

---

## 5. 對 framework 的具體建議（供下一輪參考，不硬套）

1. deity 改為結構：`origin_deity` + `adoption_deities[]`（每項帶 region + evidence level）。
2. slip schema 加 `commentary_layers[]`（聖意／解曰／東坡解／碧仙註／占驗等，支援多層）。
3. corpus 層加 `self_identification`（文本內自述，如第 100 籤）。
4. lineage 節點分「文本節點」與「物質節點」：文本節點比對同文；物質節點（某印本／某廟版）各自驗證——兩者不得互相頂替。

---

## 6. 附：本套測試暴露的既有觀音 framework 資產（可直接沿用）

- PSD v1.2.2 的兩層級語義（edge_level vs source_observation_status；acquisition_status 另表 literature 取得狀態）
- Cultural Network 的 Access ≠ License 三態
- 四級 lineage edges 結構（verified/probable/hypothesized/unresolved）
- MUST-TEST 執行記錄格式（含 negative finding 限定措辭）

> 結論：framework 通過壓力測試——核心成立，3 個缺口已定位，皆為可修補的 schema 擴充，不需要推翻重來。
