# Draw One Corpus Package：六十甲子籤（liushijiazi）

`data/corpora/liushijiazi/` — 由 Study 03（research/oracle-corpus-study-03-liushijiazi-full，已 merge 進 main `f589d58`）deterministically 轉換的 machine-readable corpus database，供 Draw One app / corpus loader 直接 ingest。

> **Packaging, not new research。** 本 package 不含新研究；所有研究結論、status、evidence 均逐字保留自 frozen Study 03 package。

## Package 結構

| 檔案 | 內容 | 記錄數 |
|---|---|---|
| `corpus.json` | corpus 層級 identity、deity 區分、temple adoption、edition families、provenance、license、last validated package | 1 |
| `slips.json` | 60 籤 structured records（reference_text、authenticity_status、human_verified、production_eligible、reference_basis） | 60 |
| `attestations.json` | 每個 concrete source attestation（北港 60／新港 60／好廟網 60；source 鏈、retrieval、license、text_status） | 180 |
| `variants.json` | 所有 divergence 的雙 reading（reference + variant），含 classification 與 reference_selected | 28 |
| `sources.json` | source registry（primary/secondary、independence、license、lineage notes） | 3 |
| `claims.json` | 研究判斷 explicit claims（corpus identity、text authenticity、adoption、independence、version、lineage） | 70 |
| `build_corpus_package.py` | deterministic build script（讀 frozen package → 寫以上 6 檔） | — |
| `validate_corpus_package.py` | integrity validator（mission §10 A–D） | — |

## 四個維度分離（不可互相推導）

```
text_authenticity ≠ source_provenance ≠ license_status ≠ production_eligibility
```

- `authenticity_status = VERIFIED`（#19 #60）**不**自動得到 `production_eligible = true`——license gate 未過（item_license_status 180/180 = unresolved）
- `human_verified = true`（8 籤：#7 #19 #38 #41 #46 #48 #57 #60）表示人類目視官方 carriers 的 observed transcription；#7 #38 #41 #46 #48 #57 因 open substantive divergence 仍為 PROBABLE
- 目前 **production_eligible = 0/60**

## 來源與 lineage

| source_id | carrier | classification | 說明 |
|---|---|---|---|
| `src-beigang-official` | 北港朝天宮 | primary（independent） | 官方圖檔 60/60，directly_observed 2026-08-15 |
| `src-xingang-fengtiangong` | 新港奉天宮 | primary（independent） | 官方籤板 60/60，directly_observed 2026-08-15 |
| `src-haomiaowang-fs60` | 好廟網（temple01.com） | secondary（mirror family） | 人類轉錄；**不得標為 independent primary**；與其他網路 mirror 的同源關係未機械判定（見 Study 03 stress notes） |

> 兩個網址 ≠ 兩個 independent sources。mirror / reproduction 關係保留於 `sources.json` lineage_notes 與 independence 欄位。

## 無 silent canonicalization

- 所有 divergence 雙 reading 全保存（`variants.json`：reference_text + variant_text）
- Reference reading 必有 explicit evidence basis（`slips.json` reference_basis / reference_edition_id）
- 例：#60「內外」（北港＋新港 primary consensus，reference_designated）與「戶內」（mirror，substantive attestation 保留）並存；`戶內` 未刪除
- 6 首 open substantive（#7 #38 #41 #46 #48 #57）維持 PROBABLE，未升級

## Build / Validate（deterministic）

```bash
# 從 repo root 乾淨 checkout（main 需含 PR #10 merge）
python3 data/corpora/liushijiazi/build_corpus_package.py    # 重建 6 檔（無時間戳/隨機 → byte-identical）
python3 data/corpora/liushijiazi/validate_corpus_package.py # 預期 517 PASS / 0 FAIL
```

## 接 loader 的注意事項

- slip 定位：`slip_number`（1–60，對應干支序：甲子=1 … 癸亥=60）
- reference 文本：`slips.json[*].reference_text`（北港官方版，4 行詩）
- 其他 reading：`attestations.json`（`family_id` 區分 carrier）；divergence 明細在 `variants.json`
- 顯示層面如需 fortune／commentary：`attestations.json` 的 `fortune_in_source`、`commentary_layers`（北港版含聖意/卦頭等北港特有註釋層）
- **production gate**：`production_eligible` 全 false；上線使用前需完成 license 確認（Closure Sprint 範圍，非本 package 可自行決定）

## 修改指南

| 想改什麼 | 改哪裡 |
|---|---|
| 新增/修正研究結論 | 改 Study 03 frozen package（research/oracle-corpus-study-03-liushijiazi-full/data/*.jsonl），重跑 `build_corpus_package.py`——本目錄 6 檔為 derived artifact，不要手改 |
| 換新 corpus | 依 `build_corpus_package.py` 模式新增 `data/corpora/<corpus_id>/`（同一 canonical ingest 格式即可接） |
| 調整輸出欄位 | 改 `build_corpus_package.py`（保持 deterministic）並同步 `validate_corpus_package.py` |

## 限制（PACKAGING 層級誠實揭露）

- `corpus_status = PROBABLE`（corpus identity claim 需 human approval 才可升 VERIFIED）
- license 全 unresolved → 本 package 僅供研究/開發接線，**不得直接 production reuse**
- 好廟網系與其他網路 mirror（籤詩網/育德等）的同源機械判定未做（Study 03 backlog）
