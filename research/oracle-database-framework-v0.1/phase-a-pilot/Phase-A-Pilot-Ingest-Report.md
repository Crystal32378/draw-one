# Phase A Pilot Ingest Report｜北港朝天宮 3-slip

**Oracle Database Framework v0.1 操作驗證｜2026-08-15（canonical sync 後）**

- 狀態：`STATUS: PILOT / QA-READY / NOT INGESTED TO REPO / NOT BULK`
- 資料：`phase-a-pilot/data/`（**10 個 JSONL**，11 種 entity 共用 **36 筆**記錄）
- Validator：`validate_phase_a.py`（結果：**164 PASS / 0 FAIL**）
- **Canonical schema pin**：repo `Crystal32378/draw-one` → `research/oracle-database-framework-v0.1/Oracle-Database-Schema-v0.1.json` @ main commit `ec96d855c96d8c8fea4be595f7078cbc405ee715`；git blob SHA `d034701451fd7e2acb3ec16639fda5b36d299126`；本包副本 sha256 `ca2e49bf48217954d5c8dce6fff7696f812df8714aef81baffa92d8ea80a7225`
- **本輪未修改 Framework / Schema**（僅同步 canonical 副本入包）
- 範圍：北港朝天宮官方 3 籤（#1 甲子、#30 戊戌、#60 癸亥）；**#6 甲戌 HOLD**（OCR 疑義未解，不猜不修）

---

## 0. Canonical sync 摘要（2026-08-15 晚）

本地舊 schema 比 repo canonical 舊，差異如下並已全部套用：

| 差異 | canonical 要求 | 本包處理 |
|---|---|---|
| `source_record.content_class` **新增 required** | original_source / human_transcription / ai_generated_or_summarized / mixed_or_unknown | 北港＝`original_source`（官方圖檔）；好廟網＝`human_transcription`（網頁轉錄） |
| `independence_group.group_claim_ids` **新增 required（minItems 1）** | 每 group 須有 independence claim | 新增 `cl-independence-beigang-01`（PROBABLE）＋`cl-independence-haomiaowang-01`（UNRESOLVED） |
| `claim.approval` 新增（VERIFIED 強制） | VERIFIED / status=verified 必須 `approval{approved_by: human|domain_expert, approved_at}` | **agent 不能 self-approve** → adoption claim 降 PROBABLE＋notes 標「awaiting human approval」 |
| `claim.quarantine_reason` | quarantine 只限 content 理由（無 license 理由） | 本包無 quarantine claim，不影響 |
| `claim_type` 新增 `item_existence` / `independence` | — | 使用 `independence` |
| `corpus.origin_date_claim` → `origin_date_fact` | 欄位改名 | 已對齊（本包原為 null） |
| `temple_adoption.date_evidence` → `adoption_date_fact` | 欄位改名 | 已對齊（本包原為 null） |
| `reference_edition` 新增 `resolution_status`/`attestation_id` | — | 本包未建 reference_edition，不影響 |

## 1. Ingest items

| Entity | 筆數 | 內容 |
|---|---|---|
| corpus | 1 | `corpus_liushijiazi_60`（六十甲子籤；origin 全 UNRESOLVED） |
| edition_family | 2 | `ed-beigang-chaotiangong`（北港版）＋`ed-liushijiazi-common-web`（通用網路轉錄版，僅 comparison） |
| source_record | 2 | `src-beigang-official`（primary, original_source）＋`src-haomiaowang-fs60`（secondary, human_transcription） |
| independence_group | 2 | `ig-beigang-official`＋`ig-haomiaowang-fs60`（各帶 group_claim_ids） |
| concrete_item | 6 | 3 北港官方圖檔（photo）＋3 好廟網網頁（website，comparison） |
| slip | 3 | `slip-lsjz-001/030/060` |
| attestation | 6 | 每 slip 2 筆：北港一手（ocr, **uncertain**）＋好廟網 comparison（manual, verbatim_confirmed） |
| variant_group | 3 | #1 orthographic_only、#30 orthographic_only、#60 **substantive_divergence** |
| temple_adoption | 1 | `ad-beigang-chaotiangong`（天上聖母／北港媽） |
| claim | 10 | adoption PROBABLE（awaiting approval）1｜corpus_identity PROBABLE 1｜version_identity PROBABLE 2｜text_authenticity **UNRESOLVED 3**｜independence PROBABLE 1＋UNRESOLVED 1｜origin UNRESOLVED 1 |

未用 entity：literature_record（本輪無文獻）、interpretation（刻意不建——避免史料層與詮釋層混層）、reference_edition（顯示決策非本輪）。

## 2. Source → concrete item → transcription → structured record trace

```
src-beigang-official（primary, directly_observed, original_source）
  └─ item-bg-001  ← 官方圖檔 240805152137335483.jpg（sha256 093cb74…，photo）
  │     └─ att-bg-001（ocr, uncertain）→ slip-lsjz-001
  └─ item-bg-030  ← 官方圖檔 240805152119873245.jpg（sha256 be797de…）
  │     └─ att-bg-030（ocr, uncertain）→ slip-lsjz-030
  └─ item-bg-060  ← 官方圖檔 240805152136256955.jpg（sha256 7aa6002…）
        └─ att-bg-060（ocr, uncertain）→ slip-lsjz-060

src-haomiaowang-fs60（secondary, directly_observed, human_transcription；僅 comparison）
  └─ item-hm-001/030/060（website）
        └─ att-hm-001/030/060（manual, verbatim_confirmed）→ 同 slips（variant evidence）
```

- 每張官方圖檔：URL（2024080515 批次）＋sha256 checksum 都進 concrete_item
- 每個 attestation.item_id → concrete_item → source_record_id 機械可 trace（validator 檢查通過）
- claim refs（identity_claim_ids／family_claim_ids／evidence_claim_ids／group_claim_ids）全部指向存在的 claim

## 3. Commentary layers 實際 mapping

| 籤 | source_text（詩文） | commentary_layers[] |
|---|---|---|
| #1 | 日出便見風雲散／光明清**靜**照世間／一向前途通大道／萬事清吉保平安 | 卦名（乾為天卦＋記號○○○○○）｜五行方位（屬金利秋天宜西方）｜卦頭（包文拯審張世真）｜聖意（討海/作塭/魚苗/求財/耕作/經商/月令/六畜/治病） |
| #30 | 漸漸看此月中和／過後須**妨**未得高／改變顏色前途去／凡事必定見重勞 | 卦名（地火明夷卦）｜五行方位（屬木利在春天宜東其方）｜卦頭（薛丁山三請樊梨花）｜廟公的話（明夷卦長文解說）｜籤解（盛極必衰…） |
| #60 | 月出光輝本清吉／浮雲總是蔽陰色／**內外**用心再作福／當官分理便有益 | 卦名（地山謙卦）｜五行方位（屬水利在冬天宜北方）｜吉凶（災＋記號●●●○●）｜卦頭（楊六婿斬子）｜廟公的話（謙卦長文解說） |

- 詩文只進 `source_text`；卦名／五行／卦頭／聖意／廟公的話／籤解各自獨立 layer（`verbatim: true`）
- 漁業聖意（討海/作塭/魚苗）是北港特有層，由 variant_group ＋ edition family 承載，不併入詩文
- validator 確認：commentary 內不含詩文片段、source_text 內不含 commentary 關鍵詞

## 4. Normalization：有／無

**文本層：無。** 沒有改字、補字、正規化、合併 commentary：
- #60「**內外**用心再作福」忠實保留（未 normalize 成通用版「戶內」）
- #30「過後須**妨**未得高」保留（未改「防」）
- #1「光明清**靜**照世間」保留（未改「淨」）
- OCR 疑義字照 OCR 逐字保留＋notes 標記，不猜改：廟公的話「滿招**搕**」「天上**暨**母」、聖意「經商如惹」「月令不達遠」「安未日痊」

**metadata 層：3 處（非文本，遵循 canonical schema）**：
1. `corpus_id` 用底線 `corpus_liushijiazi_60`（schema pattern `^[a-z0-9_]+$` 排除 hyphen）
2. `edition_family.mirror_group` 為 boolean（`true`），說明文字移到 lineage_note
3. 欄位名對齊 canonical：`origin_date_claim`→`origin_date_fact`、`date_evidence`→`adoption_date_fact`

## 5. text_status 修正（canonical 語義）

| attestation | 修正前 | 修正後 | 理由 |
|---|---|---|---|
| att-bg-001/030/060（北港 OCR） | verbatim_confirmed | **uncertain** | OCR 自動轉錄未經人工複核圖檔；canonical 語義 verbatim_confirmed＝已確認逐字（agent 無第二人複核）——詩文層跨 carrier 交叉一致僅為佐證 |
| att-hm-001/030/060（好廟網網頁） | verbatim_confirmed | verbatim_confirmed（不變） | 網頁文字直接複製，無 OCR 風險 |

**連帶的 claim 推導**（validator 語義，agent 只能 downgrade）：
- `cl-text-001` / `cl-text-030`：**PROBABLE → UNRESOLVED**（好廟網 group 的 independence claim 為 UNRESOLVED，不能參與 independent-source threshold；北港 OCR 亦為 uncertain，故沒有一手 verbatim 或兩個有效 supported groups）
- `cl-text-060`：PROBABLE → **UNRESOLVED**（北港一手 uncertain ＋ 與好廟網 substantive divergence → 無 ≥2 group 同文，不達 PROBABLE 門檻；文本仍完整保留，未損失）

## 6. Validator / tests 結果

`validate_phase_a.py`（jsonschema Draft202012Validator，canonical schema；每筆記錄驗證＋10 組一致性檢查）：

- ✅ Schema 驗證：全部 36 筆記錄符合 canonical $defs（含 content_class / group_claim_ids / approval 條件）
- ✅ Trace：attestation→item→source_record、claim refs、slip→corpus 全通
- ✅ 分層：poem text 與 commentary 無混層
- ✅ #60「內外」保留、無「戶內」
- ✅ UNKNOWN license：3 個北港 item `item_license_status=unresolved`（access=open 但未推定可再製）
- ✅ 無 secondary 升格：無任何 VERIFIED claim；secondary attestation 無 VERIFIED claim
- ✅ 不 bulk：3 slips／6 attestations（3 primary＋3 comparison）
- ✅ variant_group 覆蓋：每 slip 每個 attestation 都被 ≥1 variant_group 覆蓋
- ✅ canonical text_status：北港 3 筆 uncertain、好廟網 3 筆 verbatim_confirmed
- ✅ canonical text threshold：UNRESOLVED independence claim 不計入 independent-source support；#1/#30/#60 text_authenticity 均保持 UNRESOLVED
- ✅ VERIFIED approval 條件：本包無 VERIFIED claim（adoption 已降 PROBABLE awaiting approval）

**結果：164 PASS / 0 FAIL**（canonical schema 下；含 UNRESOLVED independence claim 不得支撐 text_authenticity threshold 的 regression checks）。

## 7. Schema friction / blockers

**無 blocker**——3 筆全部自然 fit 進 canonical Framework v0.1。記錄 5 條 friction note（不修改）：

| # | Friction | 處理 | 需要架構變更？ |
|---|---|---|---|
| F-01 | `corpus_id` pattern `^[a-z0-9_]+$` 排除 hyphen | 命名用底線（遵循既有 schema） | 否 |
| F-02 | `edition_family.mirror_group` 僅 boolean，無法承載「疑似同源（未判定）」 | boolean=true＋說明放 lineage_note；機械判定留 independence_group | 否 |
| F-03 | `slip` 無干支專用欄位（干支是 corpus identity 的 structural marker，SN-03-02） | 干支放 attestation.numbering_in_source ＋ slip.notes | 否 |
| F-04 | 需求「item license status=UNKNOWN」對應 enum `unresolved` | 用 `unresolved` | 否 |
| F-05 | **VERIFIED 需 human/domain_expert approval**——agent 研究無法自行 close VERIFIED | adoption claim 降 PROBABLE＋notes「awaiting human approval」；福/人類 domain_expert 可依 approval 機制升回 | 否（canonical 設計） |

## 8. What I changed / What I did not change

**Changed（本輪 canonical sync）：**
- 同步 canonical schema 入包（pin：main `ec96d855` / blob `d0347014…` / sha256 `ca2e49bf…`）；舊 schema 副本已覆蓋
- source_record ＋`content_class`（original_source / human_transcription）
- independence_group ＋`group_claim_ids`（新增 2 筆 independence claim）
- claim：adoption VERIFIED→PROBABLE（awaiting human approval）、text-001/030/060 PROBABLE→UNRESOLVED、＋2 筆 independence
- attestation：北港 3 筆 text_status → uncertain（notes 說明）
- 欄位名對齊：origin_date_claim→origin_date_fact、date_evidence→adoption_date_fact
- 移除舊 terminology 殘留（validator 掃描 0 殘留）
- 修正 report 實際數量：**10 個 JSONL、36 筆**（先前誤寫 9 個／32 筆）
- 清除 .DS_Store
- validator 更新（canonical root 解析＋text_status/content_class/group_claim_ids/approval 檢查）

**Did not change：**
- 未修改 Framework / Schema（canonical 原樣）
- 未 ingest 至任何 repo（本機 workspace + Claw Deck 副本）
- 未處理 #6 甲戌（HOLD）、未開其餘 56 籤
- 未把好廟網/籤詩網/育德文本升格；未覆寫北港官方「內外」；未改任何 OCR 疑義字
- 未新增研究 scope（未找新籤、未擴比對）

---

## Next（等 Crystal/福 決定）

3 筆過 QA 後才考慮：北港 60 籤 full ingest、#6 疑義圖檔人工複核、adoption claim 由人類 domain_expert approval 升 VERIFIED、或 reference_edition 顯示決策。
