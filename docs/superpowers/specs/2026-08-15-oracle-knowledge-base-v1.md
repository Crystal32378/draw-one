# Oracle Knowledge Base v1 — Spec（2026-08-15）

**Status:** APPROVED (2026-08-15, Crystal) · Pilot COMPLETED（收尾語義修正已套用）· Awaiting branch review
**Supersedes:** `2026-07-04-oracle-registry-design.md`（舊 22 欄 registry spec 為治理層設計，未實作；本 spec 升級為證據優先模型，舊文件保留為歷史 artifact）
**Scope:** 觀音靈籤（觀音一百籤）第一個 canonical corpus；KB 骨架 + validator + source strategy + guanyin-003..006 pilot
**Out of scope（紅線）:** 不寫 100 籤、不大量蒐集、不改 frontend、不 merge、不動 `data/imports/`、不付費

## 0. 最高原則

> **No canonicalization without source evidence.**
> 不知道就標不知道；版本衝突就保留衝突；不得用語言流暢度補齊文化事實；不得因為資料看起來像籤詩就視為傳統來源。

## 1. 目的

建立「任何一句籤文都能反查到『憑什麼相信它』」的證據優先 oracle knowledge base。GitHub 裡「看起來完整」不代表是真資料（參見 `docs/data-provenance-incident.md`）。

## 2. 語義修正（2026-08-15 Crystal 批准，已納入本 spec）

1. **reference_editions 以 `source_id` 作為整套 reference edition 的主指定**；個別籤例外用 per-slip `attestation_id` override。
2. **verified ≥2 獨立來源門檻 = v1 evidence policy**，不是永久歷史學真理；本輪照此執行；修訂須改 spec 並記錄，不能靜默放寬。
3. **Pilot 成功不要求 003–006 達到 verified**：若證據只支持 probable / unresolved，誠實輸出即算成功；禁止為達標提升狀態。
4. **license 未確認的 raw scan / photo 不進 public repo**：僅本地保留 evidence，KB 記錄 checksum + metadata。

## 3. 分層模型

- **Layer 0 Raw Evidence**：`data/imports/**` 原封不動 ＋ 掃描/照片/原始檔（license 未確認者僅 local）。永不編輯；數位檔記錄 checksum。
- **Layer 1 Source Corpus**（`data/oracle-knowledge-base/`）：sources / slips / attestations / variant_groups / claims。只允許逐字引用；禁止 paraphrase、禁止「順稿」。
- **Layer 2 Interpretations**：interpretations。明確 authorship；每條必引用 attestation；永遠不能反向成為 Layer 1 來源。

## 4. Schema（8 entity，JSONL）

實作於 `data/oracle-knowledge-base/`（sets / sources / slips / attestations / variant_groups / claims / interpretations / reference_editions）。欄位定義見同目錄 `DATA_DICTIONARY.md`。

關鍵決策：
- 籤號：`slip_number` 是 stable identity；「來源如何標號」在 `attestation.numbering_in_source`；編號歧義是 claim（numbering），不是 bug。
- 原文：attestation.source_text 逐字；text_normalized 為 derived 比對鍵（validator 自動計算，不儲存）。
- 異文：variant_groups 記錄關係；同 slip 不同文而無群組覆蓋 → audit error。
- 典故：claim（allusion_story），有獨立 source_ids（典故來源常與籤文不同）。
- 吉凶：per-attestation（fortune_in_source）＋ per-claim（fortune_grade）。
- license 與證據正交：license 管「能不能用」，證據管「是不是真的」。

## 5. 證據門檻（v1 evidence policy）

| Tier | 門檻 | 用途 |
|---|---|---|
| verified | ≥2 獨立來源（edition_family 與 temple 皆異）逐字一致，且 ≥1 一手來源（printed_edition/temple_pamphlet/scan/photo）；全部 verbatim_confirmed；編號無歧義；無 open substantive divergence | 唯一可進 draw pool（且 license=ok） |
| probable | ≥1 一手來源 verbatim 未交叉驗證；或最大同文家族由 ≥2 不同來源一致證實 | 可內部顯示/測試，不可 production |
| unresolved | 單一二手來源；或 paraphrase；或衝突未記錄；或編號歧義 | 保留，不顯示 |
| quarantine | ai_generated_or_summarized 或 license=no 或確立為偽造 | 永不進 production |

狀態由 `scripts/validate-kb.mjs` 推導；agent 只能 downgrade，不能 upgrade。

## 6. Validator（scripts/validate-kb.mjs）

零依賴 Node ESM。功能：schema 驗證、參照完整性、分歧偵測（variant_group 覆蓋）、狀態推導、text_authenticity 結構性門檻強制、quarantine 強制、draw pool license gate、`--emit` 輸出 `draw-pool.preview.json`（未接 frontend）。任何 error → exit 1、不寫輸出。

## 7. Pilot 結果（guanyin-003..006，2026-08-15）

- 17 attestations、5 variant groups、20 claims、4 slips 全數 **probable**、**0 verified、0 draw pool**（誠實現狀）。
- 每籤發現**兩個文本家族**（版本一/詩曰一 vs 版本二/詩曰二），各由 ≥2 個獨立網站一致證實；另 003 有東嶽廟家族內異文（成壘後/壘壞）與解曰差異。
- legacy 9 seed 中 guanyin-003..006 文字與現存二手來源（chance 詩曰一／nongli 版本一）中的版本一家族相符（version_identity claim）——獲 secondary-source corroboration，非 authenticity 確認；legacy 本身仍不是來源。
- 無一手來源 → 依 v1 policy 停在 probable；升級 verified 需一手來源（龍山寺籤詩簿／觀音靈課古本掃描）＋ license 確認。

## 8. 下一步（MUST-TEST）

1. 龍山寺籤詩簿（實體）取得與授權。
2. 觀音靈課古本掃描（華藏淨宗學會線上書文字層／數位典藏）＋ license 查證。
3. 淺草觀音一百籤 PDF（local evidence，checksum c589742c…）文字抽取與 003–006 交叉比對（抽取前不視為已確認文本流傳證據）。
4. nongli.com 第4籤頁面重試（本次抽取失敗 3 次）。
5. 觀音百籤 #007 缺號現象對照實體籤詩簿。
6. 各網站來源 license 查證（chance/nongli/zhouyi/longcheng 均 unsure）。

## 9. 與舊 spec 的關係

`2026-07-04-oracle-registry-design.md` 與 `2026-07-05-…implementation.md` 標記 **superseded by 2026-08-15 spec**，保留不刪（記錄歷史）。舊 9 seed allowlist 的 guanyin-003..006 已在 KB 建立 slip（legacy_entry_id），其餘 5 條（jiazi-056..060）尚未建立，留待六十甲子籤階段。
