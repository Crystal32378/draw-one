# Draw One｜Oracle Database Schema v0.1

> 產出日期：2026-08-15 ｜ 版本：v0.1（architecture normalization pass，2026-08-15）
> 機器可讀版：`Oracle-Database-Schema-v0.1.json`（JSON Schema draft 2020-12）
> 前身：Oracle KB pilot 8 entities——本版為其 v0.1 演進：corpus identity、edition family / concrete item 分層、temple_adoption、commentary_layers、independence group、**claim reference 模式（evidence judgment 單一化）**、福定案 evidence semantics。

---

## 0. Entity 總覽（13 個）

| # | Entity | 層 | 說明 |
|---|---|---|---|
| 1 | `corpus` | identity | 名稱家族／self_identification／origin＋adoption deity／**evidence 全走 claim refs** |
| 2 | `edition_family` | textual lineage | 文本系譜節點；**evidence 走 claim refs** |
| 3 | `concrete_item` | material lineage | **source_record_id 必填（provenance graph）**；independence_group_id 必填 |
| 4 | `independence_group` | provenance（新） | 獨立來源群；同 group 內不獨立；群組判定必須有 claim ref |
| 5 | `slip` | oracle unit | stable identity；不承載文本 |
| 6 | `attestation` | 唯一文本單位 | source_text 逐字＋commentary_layers[] |
| 7 | `variant_group` | 分歧保存 | 僅當同 slip 有 ≥2 attestations 時要求覆蓋 |
| 8 | `temple_adoption` | 文化 adoption | **evidence 走 claim refs** |
| 9 | `claim` | 證據聲明 | **edge_level 唯一承載處** |
| 10 | `source_record` | 來源記錄 | type 僅 primary/secondary；observation status |
| 11 | `literature_record` | 文獻記錄 | **literature 唯一 source-of-truth**（acquisition_status） |
| 12 | `interpretation` | Draw One 詮釋層 | 完全分離，不得回流 |
| 13 | `reference_edition` | 顯示決策 | family 或 item 層；production 須 resolve 到 attestation → item |

關係圖：

```
corpus (1) ──has──> slip (n) ──has──> attestation (n) ──covered_by──> variant_group
   │                    │                    │
   │                    │                    └──uses──> concrete_item (material node)
   │                    │                                 ├──source_record_id──> source_record
   │                    │                                 └──independence_group_id──> independence_group
   │                    │                                                    └──master_item_id──>(item)
   │                    └──interpreted_by──> interpretation
   ├──origin_deity? / adoption_deities[]
   ├──identity_claim_ids──> claim
   └──adopted_at──> temple_adoption ──evidence_claim_ids──> claim
```

---

## 1. corpus

| 欄位 | 必填 | 說明 |
|---|---|---|
| corpus_id | ✓ | e.g. `leiyshi_100` / `guanyin_lingqian_100` / `guanyin_lingke_32` |
| display_name | ✓ | |
| name_family | ✓ | []（雷雨師／關聖帝君一百籤／關帝靈籤／城隍籤——多名稱同一 corpus） |
| self_identification | – | {slip_number, text, note}；null 表示無此機制 |
| origin_tradition | – | 起源信仰傳統（**未解析可不填**） |
| origin_deity | – | **可 null（unknown stays unknown）**——未解析留空，由 origin_claim_ids 的 UNRESOLVED claim 記錄 |
| origin_place | – | 可 null |
| origin_date_fact | – | 純字串 fact（「南宋寶慶年間(1225-1227)」）；**證據級別不內嵌**，由 origin_claim_ids 承載 |
| adoption_deities | ✓ | [{deity, note}]（可空陣列） |
| numbering_system | ✓ | |
| expected_count | – | |
| **identity_claim_ids** | ✓ | → claim(claim_type=corpus_identity)——corpus identity 證據級別在此，不內嵌 |
| **origin_claim_ids** | – | → claim(claim_type=lineage)——origin 年代／地點證據級別在此 |
| conflation_warning | – | 常見混淆警告 |
| status | ✓ | draft / active / retired |
| notes | – | |

**normalization pass**：identity_evidence／origin_date_fact.edge_level 內嵌狀態移除 → claim reference（見 Framework §5.1）。`*_fact` 只存觀察到的事實，不宣稱證據級別。

## 2. edition_family（textual node）

| 欄位 | 必填 | 說明 |
|---|---|---|
| family_id | ✓ | |
| corpus_id | ✓ | |
| name | ✓ | 道藏系／光緒王錢系／龍山寺系／淺草系 |
| lineage_note | – | 文本系譜說明 |
| **family_claim_ids** | ✓ | → claim(claim_type=version_identity/lineage)——家族劃分證據級別在此 |
| mirror_group | – | 網路轉錄群標記（配合 independence_group 使用） |
| status | ✓ | draft / active / retired |
| notes | – | |

## 3. concrete_item（material node）

| 欄位 | 必填 | 說明 |
|---|---|---|
| item_id | ✓ | |
| family_id | ✓ | 所屬 edition family |
| **source_record_id** | ✓ | **provenance graph**：item 機械可追到來源記錄 |
| **independence_group_id** | ✓ | 獨立來源群（見 §4） |
| mirror_of | – | 指向同 group master（轉錄／複製／重印源頭） |
| media_type | ✓ | printed_edition / temple_pamphlet / scan / photo / website / digital_pdf / fulltext_database / manuscript / other |
| holder | – | |
| url | – | absolute local path 不進 repo；本機證據寫 `local evidence available; not committed`＋checksum |
| digital_checksum | – | sha256 |
| access_status | ✓ | open / open_register / restricted / paid / local_not_committed / unknown |
| license_status | ✓ | ok / unsure / no |
| platform_rights_status | – | 平台 policy（故宮 CC0 僅書畫/器物/織品） |
| item_license_status | – | 具體 item reuse（**production gate 的關鍵欄位**） |
| source_observation_status | ✓ | 觀察狀態（非 lineage evidence） |
| verification_date | – | |
| notes | – | |

## 4. independence_group（新，provenance independence）

| 欄位 | 必填 | 說明 |
|---|---|---|
| group_id | ✓ | e.g. `ig-mirror-chance-family` / `ig-daozang-source` |
| rationale | – | 源頭說明（master item／印版／轉錄源） |
| master_item_id | – | 群內源頭（**可 null**——源頭未知是合法狀態） |
| member_item_ids | ✓ | ≥1 |
| group_claim_ids | ✓（≥1） | → claim(claim_type=independence)——「同源／獨立群」判定本身的證據級別 |

`independence_group_id` 是比較的機械鍵，不是獨立性證據本身。只有在每個 group 都有至少一個 `group_claim_ids`（`claim_type=independence`）支持其同源／分群判定後，才可把不同 group 當作獨立性推導輸入。**temple／名稱不是獨立判準**；同印版的兩廟、同一掃描的兩個轉錄站，皆同 group（不獨立）。

## 5. slip（stable oracle unit）

| 欄位 | 必填 | 說明 |
|---|---|---|
| slip_id | ✓ | stable identity |
| corpus_id | ✓ | |
| slip_number | ✓ | 該 corpus 內籤號（same number ≠ same text） |
| traditional_title | – | |
| legacy_entry_id | – | legacy candidate，不是來源 |
| notes | – | |

slip 層級狀態（validator 推導）：verified / probable / unresolved / quarantine / no_evidence。單一 attestation 的 slip 合法且不需要 variant_group；只有同一 slip 有 ≥2 attestations 時，才要求每筆 attestation 至少被一個 variant_group 覆蓋。

## 6. attestation（唯一文本單位）

| 欄位 | 必填 | 說明 |
|---|---|---|
| attestation_id | ✓ | |
| slip_id | ✓ | |
| item_id | ✓ | |
| family_id | ✓ | 通常 derived from item，可 override |
| source_text | ✓ | 逐字籤詩原文（Layer 1；禁 paraphrase／順稿） |
| text_normalized | – | derived（validator 自動算） |
| numbering_in_source | – | 來源標號（干支／卦名） |
| title_in_source | – | |
| fortune_in_source | – | 吉凶標記（版本間可能不同） |
| commentary_layers | – | [{layer_name, text, verbatim}]——歷史註釋，與 source_text 分層 |
| transcription_method | – | manual / ocr / copied_from_repo |
| transcription_by / transcribed_at | – | |
| text_status | ✓ | verbatim_confirmed / partial / uncertain |
| notes | – | |

## 7. variant_group（分歧保存）

| 欄位 | 必填 | 說明 |
|---|---|---|
| variant_group_id | ✓ | |
| slip_id | ✓ | |
| attestation_ids | ✓ | ≥2（同 slip）；因此單一 attestation slip 不會被迫製造虛假 variant |
| relationship | ✓ | identical_text / orthographic_only / substantive_divergence / unresolved_relationship |
| divergence_description | – | |
| resolution_status | – | none / documented / reference_designated |
| notes | – | |

分歧規則：同 slip 有 ≥2 attestations 時，每個 attestation 必須被 ≥1 個 variant_group 覆蓋；只有一筆 attestation 時不要求 variant_group。open substantive divergence 阻擋 verified。

## 8. temple_adoption

| 欄位 | 必填 | 說明 |
|---|---|---|
| adoption_id | ✓ | |
| corpus_id | ✓ | |
| temple | ✓ | |
| deity | ✓ | 該廟採用此 corpus 時的主神（跨神 adoption 記錄於此） |
| region | – | |
| adoption_date_fact | – | 純字串 fact（「明清之際」）；證據級別由 claim |
| **evidence_claim_ids** | ✓ | → claim(claim_type=adoption)——edge_level 在此，不內嵌 |
| source_ids | – | 支持來源 |
| notes | – | |

**adoption ≠ origin**：adoption 證據（廟方使用）與 origin 證據（文本系譜）不同，不得互相頂替。

## 9. claim（證據聲明——edge_level 唯一承載處）

| 欄位 | 必填 | 說明 |
|---|---|---|
| claim_id | ✓ | |
| target_type | ✓ | slip / attestation / item / family / corpus / adoption / variant_group / independence_group |
| target_id | ✓ | |
| claim_type | ✓ | text_authenticity / numbering / title / fortune_grade / allusion_story / item_existence / independence / license / version_identity / lineage / corpus_identity / adoption |
| **edge_level** | ✓ | VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED |
| evidence_summary | ✓ | 查了什麼 |
| checked_by | ✓ | human / domain_expert / agent_review（檢查者；agent 不能 upgrade） |
| checked_at | ✓ | YYYY-MM-DD |
| source_ids | – | 支持來源（source_record 或 literature_record id） |
| status | ✓ | verified / probable / unresolved / quarantine（quarantine 只表示內容污染） |
| quarantine_reason | status=quarantine 必填 | content_contamination / content_class_unresolved；沒有 license quarantine reason |
| approval | VERIFIED 必填 | `{approved_by: human/domain_expert, approved_at}`；`checked_by` 可是 agent_review，但 VERIFIED 必須有人類／領域專家明確關閉 upgrade |
| notes | – | |

**text_authenticity 結構性門檻（validator 強制）**：verified＝≥2 attestation 同正規化文本、**來自 ≥2 個已具 group claim 支持的不同 independence_group**、≥1 一手 media_type、全部 verbatim_confirmed、無 open substantive divergence。probable＝≥1 一手 verbatim，或最大同文家族由 ≥2 個各自有 independence claim 支持的不同 group 一致證實。`content_class=ai_generated_or_summarized` 只會使相關 claim／attestation 進 content quarantine；`license_status=no` 不得改寫真實性 edge_level/status，只在 production license gate 阻擋 reuse。

## 10. source_record（來源記錄）

| 欄位 | 必填 | 說明 |
|---|---|---|
| source_id | ✓ | |
| name | ✓ | |
| type | ✓ | **primary / secondary**（normalization pass：移除 literature——literature 唯一 source-of-truth 在 literature_record） |
| holder | – | |
| url | – | |
| **source_observation_status** | ✓ | directly_observed / carried_forward / indirectly_supported / unresolved |
| **content_class** | ✓ | original_source / human_transcription / ai_generated_or_summarized / mixed_or_unknown；AI 污染由此欄機械判定 |
| access_status | ✓ | |
| license_status | ✓ | |
| priority | – | A / B / C |
| verification_date | – | |
| notes | – | |

**source_observation_status ≠ edge_level**：本欄記錄「這個來源我們觀察到什麼程度」，不是「這個來源支持什麼 claim」。

## 11. literature_record（literature 唯一 source-of-truth）

| 欄位 | 必填 | 說明 |
|---|---|---|
| lit_id | ✓ | |
| title | ✓ | |
| venue / type | – | journal / thesis / book / series… |
| url | – | |
| **acquisition_status** | ✓ | fulltext_obtained / abstract_obtained / bibliographic_record_only / secondary_mention_only / not_obtained |
| verification_date | – | |
| notes | – | |

規則：文獻一律只存在於 literature_record（不重複建 source_record）；claim.source_ids 可直接引用 lit_id。**acquisition_status ≠ edge_level**：取得全文 ≠ 官方一手驗證（文獻支持通常 PROBABLE）。

## 12. interpretation（Draw One 詮釋層，完全分離）

| 欄位 | 必填 | 說明 |
|---|---|---|
| interpretation_id | ✓ | |
| slip_id | ✓ | |
| kind | ✓ | meaning / advice / modern_rewrite / story_note |
| text | ✓ | |
| based_on_attestation_ids | ✓ | ≥1 |
| author | ✓ | drawone / human |
| version / status | – | draft / reviewed / approved |
| created_at / updated_at | – | |

規則：詮釋永遠不能反向成為 Layer 1 來源；不得改變任何來源／證詞狀態；UI 標示為 Draw One 的現代聲音。

## 13. reference_edition（顯示決策）

| 欄位 | 必填 | 說明 |
|---|---|---|
| reference_id | ✓ | |
| corpus_id | ✓ | |
| family_id | – | family 層指定（可存在） |
| item_id | resolved 必填 | concrete item；production resolve 時必填 |
| attestation_id | resolved 必填 | concrete attestation；其 `item_id` 必須與 reference item 相同 |
| resolution_status | ✓ | display_only / resolved；只有 resolved 可進 production gate |
| rationale | – | |
| decided_by / decided_at | ✓ | |
| supersedes | – | |

規則：reference 是顯示決策，不是真理性宣稱；可 supersedes。family-level reference 可以 `display_only`；**production eligibility 必須 resolve 到 `attestation → item`**（`attestation.item_id == reference.item_id`，且該 item 的 license/access gate 通過）。只 resolve 到 item、沒有 attestation 的 reference 不得進 production。

---

## 14. 狀態推導規則（validator 規格）

```
attestation／claim 層：`content_class=ai_generated_or_summarized` 造成 content quarantine；license 不改寫 truth claim，另由 item-level license gate 阻擋 production
slip 層：
  quarantine   = 任一 attestation/claim 為 content quarantine
  verified     = ∃ edge_level=VERIFIED 的 **text_authenticity** claim 且無 open substantive divergence
                 （claim 滿足：≥2 個各自有 independence claim 支持的不同 group 同文 + ≥1 一手 + 全 verbatim）
  probable     = ∃ **text_authenticity** claim.edge_level=PROBABLE
  unresolved   = 有 attestation 但未達上兩者
  no_evidence  = 無任何 attestation（「未開始」≠「查不到」）

draw pool eligibility（canonical，與 Framework §6.2 / Ingest Rules §4 一致）：
```
eligible(slip) :=
  slip_status == verified
  AND no_open_substantive_divergence(slip)
  AND reference_resolved_to_attestation_item(slip)
  AND reference_item.item_license_status == ok
  AND reference_item.access_status ∈ {open, open_register}
  AND no_content_quarantine_chain(slip)
```
```

Agent 只能 downgrade，不能 upgrade；任何 evidence policy 修改須改 spec 並記錄。
