# Draw One｜Oracle Provenance Framework v0.1

> 產出日期：2026-08-15 ｜ 版本：v0.1（architecture normalization pass，2026-08-15）
> 來源資產：Oracle KB pilot（8 JSONL entities）、Primary Source Dossier v1.2.2（福定案 canonical semantics）、Guandi/Leiyushi Corpus Study 02（full diff）、Oracle Framework Stress Test 02
> 狀態：**v0.1 architecture，經兩個 reference corpus 代表性案例實測（見 Mapping Exercise）**；不是完整資料庫，不承載 100 籤 bulk ingest。
> 最高原則：**No canonicalization without source evidence.** 不知道就保留不知道；版本衝突就保留衝突；不同版本不得為方便而硬合成一篇「標準籤詩」；reference edition 可以指定，但不能假裝它是唯一真本。

---

## 0. 這個 framework 在保護什麼

一邊是很古老、很人類、充滿信仰、傳說、地方差異、口耳相傳的文化系統；另一邊是 provenance、schema、evidence level、lineage graph、version control 的現代知識治理。

**兩邊不是互相抵消，而是互相保護**：

- 現代方法不是來把信仰「解釋掉」，而是幫它留下邊界——哪裡是文本、哪裡是傳說、哪裡是後來 adoption、哪裡是版本差異、哪裡我們真的還不知道。
- Provenance 不是用來「定案」的，是用來「不隨便定案」的。它最大的功勞不是證明什麼，而是阻止我們在證據不足時把故事說滿。

本 framework 的所有設計決定都以這個雙向保護為判準。

---

## 1. 四層文本分層（tradition / corpus / edition family / concrete item）

### 1.1 分層定義

| 層 | 是什麼 | 例子（Guandi/Leiyushi） | 例子（Guanyin） |
|---|---|---|---|
| **tradition** | 信仰傳統（context 屬性，非獨立實體） | 關帝信仰／城隍信仰／福德正神信仰 | 觀音信仰 |
| **corpus** | 一套 stable oracle system（編號、操作方式、文本家族定義） | 雷雨師一百籤（＝關帝百籤＝城隍籤，同一 corpus） | 觀音一百籤；《觀世音菩薩感應靈課》三十二卦（**另一 corpus，不得合併**） |
| **edition family** | 文本系譜節點（textual lineage） | 道藏系（南宋造／明代收錄層）／光緒王錢印本系（台灣現行本傳承層） | 龍山寺系／淺草寺系／公版系 |
| **concrete item** | 物質節點（material lineage）：具體印本、廟版、掃描件、PDF、網頁 | 行天宮官網電子籤 jpg；維基文庫道藏本轉錄頁（mirror） | 華藏 fabo/1555 流通頁；淺草 2011 復刻 PDF（local） |

### 1.2 硬規則

1. **corpus ≠ edition**：corpus 是 identity 層（「這是不是同一套籤」），edition family 是文本層（「這兩個文本是什麼關係」）。Study 02 full diff 證明：100/100 籤號對齊 → 同一 corpus；73 籤單字級差異 → 兩個 edition family 層。**同一 corpus 可以有多個 edition family，不得合併為單一版本。**
2. **textual node ≠ material node**：edition family（文本相似／同源）與 concrete item（某個具體印本／廟版／掃描件）是兩條 lineage，**不得互相代替證據**。「文本相同」不能由「同一個網頁轉錄」證明；「某 item 存在」不能由「文獻提到它」證明。
3. **source independence 以 provenance 機械判定，不以 temple／名稱判定**（normalization pass 修正）：不同寺廟**不自動**構成獨立來源——兩廟若共享同一印版、同一轉錄源、同一掃描，屬同一 **independence group**，不獨立。先以 `claim_type=independence` 支持 group 分群，再以 **independence_group 不同**做機械比較（見 §2.2）。
4. **tradition 是屬性不是 parent**：corpus 可以跨 tradition 被 adoption（關帝廟用石固 corpus），所以 tradition 只能作為 corpus 的 origin_tradition 與 temple_adoption 的屬性，不能當作 corpus 的單一上層。

### 1.3 名稱與 identity

- corpus 的名稱家族（name_family）：雷雨師／關聖帝君一百籤／關帝靈籤／城隍籤——多名稱但同一 corpus。
- **self_identification**（Stress Test 02 Failure 2 補上）：文本內自述身分（如雷雨師第 100 籤「我本天仙雷雨師」）是 corpus identity 的內嵌證據，獨立欄位記錄（含自述位置 slip_number）。
- 名稱考（RQ1）的結論必須進 corpus record：名稱多 ≠ corpus 多；名稱相同 ≠ 文本相同。
- **unknown stays unknown**：corpus 的 origin（origin_deity／origin_place／origin_date）**不是必填**——未解析就留空，由 UNRESOLVED claim 記錄「不知道」，不得逼填。

---

## 2. Slip、Attestation 與 Source Independence

### 2.1 Slip 與 Attestation（same number ≠ same text）

- **slip**：stable oracle unit——corpus 內的籤位（如 `leiyshi-100`），只承載編號與 identity，**不承載文本**。
- **attestation**：某 concrete item（經 edition family）對該 slip 的**實際逐字文本**——唯一的文本單位。

**same number ≠ same text**：同一籤號在不同 edition family 的文本是不同 attestation。KB 中不存在「合併後的 canonical 文本」；唯一的 canonical 是 reference edition 指定（顯示決策，可 supersedes）。

**逐字紀律**：Layer 1 只允許逐字引用；禁止 paraphrase、禁止「順稿」；來源的錯字、異體字、怪標點保留並註記。text_normalized 是 derived 欄位，validator 自動計算。

**分歧保存**：同 slip 有 ≥2 個 attestation 時，每個 attestation 必須被 ≥1 個 variant_group 覆蓋（否則 audit error）；單一 attestation slip 合法且不需要 variant_group。relationship 四值（identical_text / orthographic_only / substantive_divergence / unresolved_relationship）；open substantive divergence 阻擋 verified。

### 2.2 Provenance Independence（機械判定）

**independence_group**：共享同一「物質／轉錄源頭」的 concrete item 集合。同 group 內任意兩 item **不構成獨立證據**。不同 `independence_group_id` 是機械比較鍵，**不是獨立性證據本身**；每個 group 必須有 `group_claim_ids[]` 指向 `claim_type=independence`，validator 才能把不同 group 的比較當作 independence 推導輸入。

| 機制 | 說明 |
|---|---|
| `independence_group_id`（concrete_item 必填） | 該 item 所屬獨立群 |
| `mirror_of`（concrete_item 可選） | 指向同 group 的 master item（轉錄／複製／重印的源頭）；mirror 鏈自動同 group |
| `master_item_id`（independence_group） | 群內源頭（可 null——源頭未知是合法狀態，記錄 unresolved group 關係） |
| 機械規則 | 在兩個 group 都有有效 independence claim 的前提下，item A、B 的獨立性候選 ⇔ independence_group_id(A) ≠ independence_group_id(B) |

判定範例：
- 同一掃描件的兩個網頁轉錄（維基文庫↔其他轉錄站）→ 同 group（mirror 鏈）。
- 同一版次的兩個廟使用 → 同 group（同印版）；**temple 不同不構成獨立**。
- 道藏系刻本 vs 光緒王錢印本 → 不同 group（不同源頭）→ 獨立。
- 行天宮官方電子籤（官方自製）→ 與任何 mirror 群不同 group。

**verified 文本門檻改用 independence group**（取代「不同 temple」criterion）：≥2 attestation 來自 **≥2 個各自有 independence claim 支持的不同 independence_group** 且 ≥1 一手 item，全部 verbatim_confirmed，無 open divergence。

---

## 3. Commentary Layers（與 source text 分離）

雷雨師籤的註釋層遠厚於觀音籤（Stress Test 02 的 corpus-specific 發現）：聖意／解曰／**東坡解／碧仙註／占驗**／籤頭故事。

1. **籤詩本文（source_text）與註釋層分開儲存**——attestation.source_text 只有籤詩四句；attestation.commentary_layers[] 存歷史註釋（每層一筆，逐字）。
2. commentary layer 是「某 item 的該籤註釋」，與籤詩同源，但**語義等級不同**：籤詩是 oracle text，註釋是歷史詮釋。UI 必須區分。
3. **Draw One 自己的 interpretation 是另一層**：interpretation 永遠不能反向成為 Layer 1 來源；不得改變任何來源／證詞狀態；標示為 Draw One 的現代聲音。
4. 層級總結：**source text（逐字）→ historical commentary（逐字，標層名）→ Draw One interpretation（自有語氣，based_on attestation）**——三層不得混用。

---

## 4. Deity / Temple Adoption 建模（adoption ≠ origin）

### 4.1 結構

- corpus 層：`origin_deity`（可 null——unknown stays unknown）＋ `adoption_deities[]`（後來採用此 corpus 的神明）。
- temple_adoption record：corpus → temple × deity × region × adoption_date_fact × evidence_claim_ids（**edge_level 不內嵌**，見 §5.1 claim reference 模式）。
- 跨神 adoption 是正常文化現象，不是錯誤：龍霄殿（東嶽大帝）用觀音百籤 corpus、車城福安宮（福德正神）用關帝百籤格式——記錄為 adoption，不「糾正」。

### 4.2 硬規則

- **adoption ≠ origin**：關帝廟用 ≠ 關帝原生。origin 需要文本系譜證據（道藏本、碑文）；adoption 需要該廟使用該 corpus 的證據。兩者證據類型不同，不得互相頂替。
- 同 corpus 多神多廟：adoption 是 N 對 N（corpus ↔ temple × deity），temple_adoption 為獨立 entity。
- 同一主神可用不同 corpus（福德正神：烘爐地系 vs 福安宮疑似關帝百籤系）——temple_adoption 以 corpus 為鍵，不預設「主神 = corpus」。

---

## 5. Evidence Judgment 單一化（claim reference 模式）

### 5.1 原則：entity 儲存 facts，evidence level 只在 claim

**所有證據級別統一由 `claim.edge_level` 承載**。entity record 只存事實與來源鏈結，**不內嵌 edge_level 狀態**：

| 欄位（舊） | 內嵌 evidence state | 改為（claim reference） |
|---|---|---|
| corpus.identity_evidence | VERIFIED/PROBABLE… | `identity_claim_ids[]` → claim(claim_type=corpus_identity) |
| corpus.origin_date_fact.edge_level | 內嵌 | origin_date_fact 簡化為純字串 fact＋`origin_claim_ids[]` → claim(claim_type=lineage) |
| edition_family.family_evidence | 內嵌 | `family_claim_ids[]` → claim(claim_type=version_identity/lineage) |
| temple_adoption.evidence | 內嵌 | `evidence_claim_ids[]` → claim(claim_type=adoption) |
| temple_adoption.adoption_date_fact.edge_level | 內嵌 | adoption_date_fact 簡化為純字串 fact |

好處：
- 同一證據可被多 entity 共享（一個 claim 支持多個 family 成員）。
- 「某 entity 的證據級別」永遠是查詢（join claim），不是儲存時凍結的狀態——避免 entity 與 claim 漂移。
- 修改證據級別只改 claim，不改 entity（歷史 facts 不可變）。

### 5.2 Provenance Graph（concrete_item → source_record）

- **concrete_item.source_record_id（必填）**：每個 material item 必須可機械追到其來源記錄（誰、什麼類型、觀察狀態）。
- **source_record 與 literature_record 的唯一 source-of-truth**：
  - literature 的唯一 source-of-truth 是 **literature_record**（含 acquisition_status）。
  - source_record.type 只允許 `primary` / `secondary`（**移除 literature**——避免兩處重複承載同一文獻）。
  - literature_record 被 claim.source_ids / item 註記引用，不重複建 source_record。
- 鏈路：`attestation.item_id → concrete_item.source_record_id → source_record`；literature 支持則 `claim.source_ids → literature_record`。

### 5.3 Vocabulary 對照表（不得跨層混用）

| 層 | 欄位 | 允許值 | 語義 |
|---|---|---|---|
| lineage / adoption / identity claim | `edge_level` | VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED | **唯一**承載證據級別的欄位；VERIFIED 僅限 primary / official direct evidence |
| source record 觀察 | `source_observation_status` | directly_observed / carried_forward / indirectly_supported / unresolved | 觀察狀態；**不是 lineage evidence** |
| source 內容分類 | `content_class` | original_source / human_transcription / ai_generated_or_summarized / mixed_or_unknown | AI 污染的機械輸入；ai 只導出 content quarantine，mixed/unknown 為 unresolved gate；不改寫 truth claim |
| literature 取得 | `acquisition_status` | fulltext_obtained / abstract_obtained / bibliographic_record_only / secondary_mention_only / not_obtained | 取得程度；**不是 lineage evidence** |
| 可取得性 | `access_status` | open / open_register / restricted / paid / local_not_committed / unknown | 能不能取得 |
| reuse 許可 | `license_status` | ok / unsure / no | 具體 material 能否 reuse |
| 平台權利 | `platform_rights_status` | verified / unsure / not_checked | 平台層 policy |
| item 許可 | `item_license_status` | ok / unsure / no / unresolved | 具體 item 層 reuse 許可 |
| 文本關係 | `relationship` | identical_text / orthographic_only / substantive_divergence / unresolved_relationship | variant_group 內關係 |
| diff 分類 | `diff_category` | exact / orthographic_only / substantive_variant / numbering_mismatch / missing / decode_issue | 文本比對結果描述（非證據級別） |
| 推導狀態 | `slip_status` | verified / probable / unresolved / quarantine / no_evidence | validator 只從 text_authenticity claim＋attestation 推導，不手填 |
| quarantine 原因 | `quarantine_reason` | content_contamination / content_class_unresolved | 只允許內容污染原因；沒有 license quarantine reason |

**禁止**：不再使用 confidence / source_confidence；source_observation_status ≠ edge_level；literature acquisition ≠ VERIFIED；Access ≠ License；platform_rights_status ≠ item_license_status；license=no 不得把 claim 改成 quarantine 或降低 truth edge_level。

### 5.4 狀態是推導的，不是手填的

人類只記錄「事實」（來源、逐字文本、查了什麼）；validator 依規則推導 slip／attestation 狀態。`checked_by` 是實際檢查者，`agent_review` 可以提出或記錄檢查結果，但不能單獨關閉 upgrade。凡 `edge_level=VERIFIED` 的 claim 必須另有 `approval.approved_by`（human 或 domain_expert）與 `approval.approved_at`；這讓 agent_review → 人類／專家 approval 的責任鏈可機械驗證。Agent 只能 downgrade，不能 upgrade。

---

## 6. Research DB 與 Production Draw Pool 分離

### 6.1 Research DB

容納全部狀態：VERIFIED、PROBABLE、HYPOTHESIZED、UNRESOLVED、conflicting variants、license unsure、quarantine——全部可以進 research layer。**知道某資料存在 ≠ 有資格拿它上產品。**

### 6.2 Draw Pool Eligibility（canonical algorithm）

Family-level reference 可以存在（顯示決策），但 **production eligibility 必須 resolve 到具體 `attestation → item`——license 是 item-level**。

```
eligible(slip) :=
  slip_status == verified
  AND no_open_substantive_divergence(slip)
  AND reference_resolved_to_attestation_item(slip)  # reference 解析到 attestation，且 attestation.item_id == concrete item
  AND reference_item.item_license_status == ok
  AND reference_item.access_status ∈ {open, open_register}
  AND no_content_quarantine_chain(slip)     # 無 ai_generated_or_summarized 內容污染
```

參考解析規則（reference_resolved_to_attestation_item）：
1. reference 指定 family 層 → 列舉該 family 下 items。
2. 先選定 concrete item（多個則由 reference.rationale 或最近 verification 決定；ambiguous 時保持 unresolved，不自動選）。
3. 再選定該 item 的具體 attestation，寫入 `attestation_id`，並驗證 `attestation.item_id == reference.item_id`。
4. item_license_status≠ok、access 不在 open/open_register、或缺 attestation_id → 不 eligible（即使 slip 文本 verified）。license 只在此 production gate 生效，不污染 claim truth status。

Gate 是**可逆的**：新證據出現 → 可 downgrade 或 quarantine（push back）。Draw Pool 輸出是 admin/trust 層：frontend 不讀 provenance、不顯示 research 狀態。

---

## 7. Stress Test 02 Findings 納入清單（驗收）

| Finding | Framework 對應 | 位置 |
|---|---|---|
| origin_deity ≠ adoption_deities | corpus.origin_deity（可 null）＋ adoption_deities[] ＋ temple_adoption entity | §4 |
| commentary_layers[] | attestation.commentary_layers[]（歷史層）＋ interpretation entity（Draw One 層） | §3 |
| self_identification | corpus.self_identification（結構化） | §1.3 |
| textual node ≠ material node | edition_family entity vs concrete_item entity | §1.2 |
| corpus ≠ edition | corpus entity vs edition_family entity | §1.2 |
| same text ≠ independent source | independence_group（機械判定；mirror_of 鏈） | §2.2 |
| 5 corpus-specific fields（東坡解／碧仙註／占驗／籤頭故事／干支） | commentary_layers[] 可承載任意層名＋attestation.numbering_in_source / fortune_in_source | §3 |
| 觀音靈課 32 卦 vs 觀音百籤不得合併 | 兩個 corpus entity，conflation_warning 記錄 | §1.1 |
| evidence judgment 單一化（normalization pass） | claim.edge_level 唯一承載；entity 只存 facts＋claim refs | §5.1 |
| provenance graph（normalization pass） | concrete_item.source_record_id 必填；literature 唯一 source-of-truth=literature_record | §5.2 |

---

## 8. 驗收標準（這輪成功的定義）

- ✅ 一套經兩個 reference corpora 實際驗證的 v0.1 architecture（Mapping Exercise 11 cases 為證據）
- ✅ evidence judgment 單一化、provenance graph 完備、independence 機械化、Draw Pool algorithm 收斂（Framework/Schema/Rules 一致）
- ✅ 下一個 corpus 可以直接 ingest 測試（有 schema、有 rules、有 validator 規格）
- ❌ 不是「建立完整籤詩資料庫」；不做第三 corpus、不做 bulk ingest、不碰 frontend、不改 production、不 merge
