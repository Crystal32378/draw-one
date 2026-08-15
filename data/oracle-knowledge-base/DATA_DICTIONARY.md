# DATA_DICTIONARY — Oracle Knowledge Base v1

`data/oracle-knowledge-base/` 下 8 個 entity 的欄位定義。JSONL，UTF-8，一行一筆 JSON。schema 由 `scripts/validate-kb.mjs` 強制。

## 總則

- **狀態是推導的，不是手填的**：人類只記錄「事實」（來源、逐字文本、查了什麼）；script 依規則推導 slip/attestation 狀態。Agent 只能 downgrade，不能 upgrade。
- **文本單位是 attestation**：KB 中不存在「合併後的 canonical 文本」。唯一的 canonical 是 reference edition 指定（顯示決策，可被 supersedes）。
- **license 與證據是正交軸**：license 管「能不能用」，證據管「是不是真的」；production 兩者都要過。
- **逐字紀律**：Layer 1 只允許逐字引用；禁止 paraphrase、禁止「順稿」；來源的錯字、異體字、怪標點保留並註記。

---

## 1. sets.jsonl — 籤系

| 欄位 | 必填 | 說明 |
|---|---|---|
| set_id | ✓ | e.g. `guanyin_lingqian_100` |
| display_name | ✓ | 顯示名 |
| deity | ✓ | 主祀神明 |
| tradition_family | ✓ | 信仰傳統（觀音信仰） |
| numbering_system | ✓ | e.g. `1-100` |
| expected_count | – | 期望籤數 |
| status | ✓ | draft / active / retired |
| notes | – | 自由文字 |

## 2. sources.jsonl — 來源實體

| 欄位 | 必填 | 說明 |
|---|---|---|
| source_id | ✓ | e.g. `src-chance-org-tw` |
| title | ✓ | 來源名 |
| media_type | ✓ | printed_edition / temple_pamphlet / scan / photo / website / scholarly_work / manuscript / other |
| content_class | ✓ | traditional_text / modern_interpretation / translation / ai_generated_or_summarized / unknown |
| author / compiler / publisher | – | |
| edition_year | – | |
| temple / lineage | – | 宮廟或文本 lineage |
| edition_family | – | 版本家族（觀音靈課系／龍山寺系／公版…）；**verified 的「獨立性」判斷依據** |
| location_ref | – | 實體書位置／頁碼／圖版編號／站內路徑 |
| url | – | |
| access_date | – | 查證日期（YYYY-MM-DD） |
| holder | – | 實體/數位檔持有者 |
| digital_checksum | – | 數位檔 sha256（raw scan/photo license 未確認時必填，檔案不進 repo） |
| license_status | ✓ | ok / unsure / no |
| license_notes / reuse_terms | – | |
| evidence_notes | – | |
| created_by / created_at | – | |

## 3. slips.jsonl — 籤位

| 欄位 | 必填 | 說明 |
|---|---|---|
| slip_id | ✓ | stable identity，e.g. `guanyin-003` |
| set_id | ✓ | 所屬籤系 |
| slip_number | ✓ | 籤號（該系內） |
| traditional_title | – | 傳統籤名（如 燕子銜泥）；版本間不同時以 attestation/claim 為主 |
| legacy_entry_id | – | 舊 seed allowlist entry（**legacy candidate，不是來源**） |
| notes | – | |

slip 層級狀態（script 推導）：verified / probable / unresolved / quarantine / no_evidence（無任何 attestation）。

## 4. attestations.jsonl — 證詞（唯一文本單位）

| 欄位 | 必填 | 說明 |
|---|---|---|
| attestation_id | ✓ | e.g. `att-gy-003-c1` |
| slip_id | ✓ | |
| source_id | ✓ | |
| source_text | ✓ | **逐字原文**（可含 \n 分行） |
| text_normalized | – | 異體字/簡繁正規化鍵（**derived**，validator 自動計算比對，不手填不儲存） |
| numbering_in_source | – | 該來源如何標號（有的版本用不同編號/干支/卦名） |
| title_in_source | – | 該來源的籤名 |
| fortune_in_source | – | 該來源的吉凶標記（版本間可能不同） |
| transcription_method | – | manual / ocr / copied_from_repo |
| transcription_by / transcribed_at | – | 轉錄人與日期 |
| text_status | ✓ | verbatim_confirmed / partial / uncertain |
| notes | – | 含字形/異文註記 |

## 5. variant_groups.jsonl — 異文群組

| 欄位 | 必填 | 說明 |
|---|---|---|
| variant_group_id | ✓ | |
| slip_id | ✓ | |
| attestation_ids | ✓ | 群組成員（須屬同 slip） |
| relationship | ✓ | identical_text / orthographic_only / substantive_divergence / unresolved_relationship |
| divergence_description | – | 分歧說明 |
| resolution_status | – | none / documented / reference_designated |
| notes | – | |

**分歧規則**：同 slip 出現不同正規化文本時，每個 attestation 必須被 ≥1 個 variant_group 覆蓋，否則 audit error。open substantive divergence（relationship=substantive_divergence 且 resolution_status=none）會阻擋 verified。

## 6. claims.jsonl — 證據聲明

| 欄位 | 必填 | 說明 |
|---|---|---|
| claim_id | ✓ | |
| target_type | ✓ | slip / attestation / source / variant_group |
| target_id | ✓ | |
| claim_type | ✓ | text_authenticity / numbering / title / fortune_grade / allusion_story / license / version_identity / lineage |
| evidence_summary | ✓ | 查了什麼 |
| checked_by | ✓ | human / domain_expert / agent_review（agent 不能 upgrade） |
| checked_at | ✓ | YYYY-MM-DD |
| source_ids | – | 支持此 claim 的來源 |
| status | ✓ | verified / probable / unresolved / quarantine |
| notes | – | |

**text_authenticity 結構性門檻（script 強制）**
- verified：slip 上有 ≥2 個同正規化文本的 attestation、來源彼此 edition_family 與 temple 皆異（獨立）、≥1 個一手 media_type、全部 verbatim_confirmed、且無 open substantive divergence。
- probable：≥1 個一手來源 verbatim；或最大同文家族由 ≥2 個不同來源一致證實。
- 來源 content_class=ai_generated_or_summarized 或 license=no → 相關 claim 狀態必須 quarantine。

## 7. interpretations.jsonl — Draw One 詮釋層（完全分離）

| 欄位 | 必填 | 說明 |
|---|---|---|
| interpretation_id | ✓ | |
| slip_id | ✓ | |
| kind | ✓ | meaning / advice / modern_rewrite / story_note |
| text | ✓ | |
| based_on_attestation_ids | ✓ | ≥1 |
| author | ✓ | drawone / 具名人類 |
| version | – | |
| status | ✓ | draft / reviewed / approved |
| created_at / updated_at | – | |

規則：詮釋永遠不能反向成為 Layer 1 來源；不得改變任何來源/證詞狀態；UI 標示為 Draw One 的現代聲音。

## 8. reference_editions.jsonl — 顯示基準指定

| 欄位 | 必填 | 說明 |
|---|---|---|
| reference_id | ✓ | |
| set_id | ✓ | |
| source_id | ✓ | **整套 reference edition 主指定**（以來源為單位） |
| attestation_id | – | per-slip override（僅個別籤例外於整套指定時使用） |
| rationale | – | 指定理由 |
| decided_by / decided_at | ✓ | |
| supersedes | – | 被取代的 reference_id |

規則：reference 指定是顯示決策，不是真理性宣稱；可被 supersedes。draw pool 條件：slip=verified 且 reference source license=ok。

---

## 狀態推導規則摘要（validator 實作）

```
attestation 層：quarantine（來源 ai_generated/ license=no）＞ claim 層證據
slip 層：
  quarantine   = 任一 attestation/claim 為 quarantine
  verified     = ∃ verified text_authenticity claim 且無 open substantive divergence
  probable     = ∃ probable claim
  unresolved   = 有 attestation 但未達上兩者
  no_evidence  = 無任何 attestation（「未開始」≠「查不到」）

draw pool 條件：slip=verified AND reference source license_status=ok AND reference 已指定
```
