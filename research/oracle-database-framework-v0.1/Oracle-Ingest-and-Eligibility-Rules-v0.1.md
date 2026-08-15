# Draw One｜Oracle Ingest & Eligibility Rules v0.1

> 產出日期：2026-08-15 ｜ 版本：v0.1（architecture normalization pass，2026-08-15）
> 配套：`Oracle-Provenance-Framework-v0.1.md`（原則）、`Oracle-Database-Schema-v0.1.md/.json`（結構）
> 本輪 normalization pass：verified 門檻改用 independence group；Draw Pool eligibility 收斂為 canonical algorithm（與 Framework §6.2／Schema §14 逐字一致）；禁止清單更新。

---

## 1. Ingest 總則

1. **No canonicalization without source evidence.** 不知道就標不知道；版本衝突就保留衝突。
2. **文本單位是 attestation**：KB 中不存在「合併後的 canonical 文本」。任何「標準籤詩」都必須是 reference edition 指定（顯示決策），不是資料層的合併產物。
3. **逐字紀律**：Layer 1 只允許逐字引用；禁止 paraphrase、禁止「順稿」；來源的錯字、異體字、怪標點保留並註記。
4. **狀態是推導的，不是手填的**：人類只記錄事實；validator 依規則推導狀態。Agent 只能 downgrade，不能 upgrade。
5. **license 與證據是正交軸**：license 管「能不能用」，證據管「是不是真的」；production 兩者都要過。
6. **evidence judgment 單一化**：entity 只存 facts；所有證據級別由 claim.edge_level 承載（claim reference 模式）。entity 不得內嵌 edge_level 狀態。
7. **兩個 lineage 不得互換**：edition family（文本同源）與 concrete item（物質存在）是不同證據類型。
8. **source independence 機械判定**：先由 `claim_type=independence` 的 group claims 支持分群，再以不同 `independence_group_id` 做機械比較；temple／名稱不是判準。

---

## 2. Ingest 流程（單一 corpus 的建議順序）

```
Phase 0 — Corpus identity（先於一切）
  ├─ 確認 corpus 是否已存在（name_family 對照）
  ├─ 建立 corpus record：origin_deity（可 null）/ adoption_deities / numbering_system / self_identification
  ├─ 若 origin 未解析 → origin_deity 留空 + UNRESOLVED claim（unknown stays unknown，不逼填）
  └─ identity_claim_ids → corpus_identity claim（edge_level 在此）

Phase 1 — Source / Item 盤點
  ├─ source_record：type（primary/secondary；literature 走 literature_record）＋content_class（污染判定）
  ├─ concrete_item：source_record_id（必填，provenance graph）+ independence_group_id（必填）
  ├─ independence_group：同源群定義（master_item_id 可 null）＋至少一個 independence claim
  ├─ edition_family：家族劃分 + family_claim_ids
  └─ literature_record：acquisition_status（取得 ≠ 驗證）

Phase 2 — Slip 建立
  └─ slip：corpus 內籤號（stable identity；same number ≠ same text）

Phase 3 — Attestation 逐字轉錄
  ├─ source_text：逐字（含異體字/錯字/標點，註記不修改）
  ├─ commentary_layers[]：歷史註釋逐字
  └─ numbering_in_source / title_in_source / fortune_in_source

Phase 4 — Variant 分組
  ├─ 同 slip 有 ≥2 個 attestation 時，每個 attestation 必須被 ≥1 個 variant_group 覆蓋
  ├─ 單一 attestation slip 合法，不建立虛假 variant_group
  └─ relationship 四值；open substantive divergence 記錄 divergence_description

Phase 5 — Claims 標級（唯一 evidence 位置）
  ├─ claim.edge_level：VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED
  ├─ text_authenticity 結構性門檻（§3.1，independence group 版）
  ├─ agent_review 只能 downgrade；人類可 upgrade（需 approval 記錄）
  └─ VERIFIED claim 的 approval.approved_by 只能是 human / domain_expert

Phase 6 — Adoption / Lineage 記錄
  ├─ temple_adoption：corpus × temple × deity × region × adoption_date_fact（fact）＋ evidence_claim_ids
  └─ lineage claims（edition family 間關係、corpus 系譜）獨立 claim 記錄

Phase 7 — Validator 驗證
  └─ 任何 validation error → exit 1、不寫輸出
```

---

## 3. Evidence 門檻（validator 強制）

### 3.1 text_authenticity → verified 的結構性門檻

| 條件 | 說明 |
|---|---|
| ≥2 attestation 同正規化文本 | text_normalized（derived）相同 |
| **≥2 不同 independence_group** | 先確認每個 group 有 `claim_type=independence` 的 group_claim；再以 group_id 做機械比較（temple／名稱不是判準） |
| ≥1 一手 media_type | printed_edition / temple_pamphlet / scan / photo / 官方頁 |
| 全部 verbatim_confirmed | text_status=verbatim_confirmed |
| 無 open substantive divergence | 所有 variant_group 無 none-resolution 的 substantive_divergence |

> **independence group 取代「不同 temple」criterion**：兩廟若同印版／同轉錄源 → 同 group → 不獨立；同一 scan 的兩個轉錄站 → 同 group → 不獨立；道藏系刻本 vs 光緒王錢印本 → 不同 group → 獨立。

### 3.2 probable

- ≥1 一手來源 verbatim 已確認但未交叉驗證；或
- 最大同文家族由 ≥2 個各自有 independence claim 支持的不同 group 一致證實（未達一手門檻）。

### 3.3 quarantine（污染規則）

- 來源 `content_class=ai_generated_or_summarized` → 相關 claim / attestation 必須進 **content quarantine**。
- `content_class=mixed_or_unknown` → 內容分類 unresolved；不得支撐 VERIFIED text claim，也不得進 production，直到完成分類。
- `license_status=no` → 只設 item-level **license gate=blocked**；不得把 claim.status 改成 quarantine，也不得降低 claim.edge_level。
- `claim.status=quarantine` 必須帶 `quarantine_reason=content_contamination` 或 `content_class_unresolved`；不得建立 license quarantine reason。
- content quarantine 優先於 slip 的 verified/probable 推導；license gate 與 evidence status 正交。

### 3.4 downgrade-only

- Agent 只能 downgrade；任何 upgrade 須 human / domain_expert 以 `approval` 明確簽核，`checked_by` 只記錄檢查者。
- 證據 policy 修訂（如「≥2 獨立來源」門檻）必須改 spec 並記錄，不能靜默放寬。

---

## 4. Draw Pool Eligibility（canonical algorithm）

**知道某資料存在 ≠ 有資格拿它上產品。**

```
eligible(slip) :=
  slip_status == verified
  AND no_open_substantive_divergence(slip)
  AND reference_resolved_to_attestation_item(slip)  # family-level reference 須 resolve 到 attestation → item
  AND reference_item.item_license_status == ok
  AND reference_item.access_status ∈ {open, open_register}
  AND no_content_quarantine_chain(slip)
```

### 4.1 reference_resolved_to_attestation_item

1. reference 指定 family 層 → 列舉該 family 下 concrete items。
2. 選定 concrete item（多個時由 reference.rationale 或最近 verification 決定；ambiguous 保持 unresolved，不自動選）。
3. 選定該 item 的具體 attestation，寫入 `attestation_id`，並驗證 `attestation.item_id == reference.item_id`。
4. 缺 attestation、item_license_status≠ok 或 access 不在 open/open_register → 不 eligible（**即使 slip 文本 verified**）。license 只阻擋 reuse，不改寫 truth claim。

### 4.2 Gate 語義

- 任一條件未過 → 該 slip 留在 research layer（可顯示為「研究中」，不得進產品）。
- Gate 是**可逆的**：新證據出現 → downgrade 或 quarantine（push back）。
- Draw Pool 輸出是 admin/trust 層：frontend 不讀 provenance、不顯示 research 狀態。

---

## 5. 常見錯誤（禁止清單）

| 錯誤 | 正確做法 |
|---|---|
| 把兩個 edition family 的文本合成一篇「標準籤詩」 | 保留各自 attestation；reference edition 指定其一（顯示決策） |
| 用 mirror 群當獨立來源 | 同 independence_group → 不獨立；機械判準 group_id |
| 把「不同 temple」當獨立判準 | 同印版／同源頭的兩廟同 group；獨立性只看 independence_group |
| 把 source_observation_status 當 lineage evidence | 「我抓過頁面」≠「claim 被驗證」；claim 用 edge_level |
| 把 literature acquisition 當 VERIFIED | 「取得全文」≠「官方一手驗證」；文獻支持通常 PROBABLE |
| 把 adoption 當 origin | 關帝廟用 ≠ 關帝原生；temple_adoption 與 corpus origin 分開記錄 |
| 用「故事合理」升級不確定 edge | 不確定的 edge 維持 UNRESOLVED |
| search 0 結果當不存在 | Search failure ≠ non-existence；記錄為「本輪 query 未檢出」 |
| 詮釋回流成來源 | interpretation 永遠是獨立層，不得反向成為 Layer 1 |
| entity 內嵌 edge_level | entity 只存 facts；證據級別一律 claim reference |
| corpus origin 未知卻逼填 | origin_deity 可 null；UNRESOLVED claim 記錄「不知道」 |

---

## 6. 驗收（v0.1 成功定義）

- [x] 兩套 reference corpora（Guanyin / Guandi-Leiyushi）代表性案例完成 mapping（11 cases，見 Mapping Exercise）
- [x] Schema 能承載已知 case；承載不了的 case 修改 framework（而非修改歷史）
- [x] Evidence judgment 單一化（claim.edge_level 唯一承載）
- [x] Provenance graph 完備（item → source_record；literature 唯一 source-of-truth）
- [x] Draw Pool eligibility canonical algorithm（Framework／Schema／Rules 一致）
- [x] 下一個 corpus 可直接依 §2 ingest
- [ ] 完整資料庫與 bulk ingest（**非本輪範圍**）
