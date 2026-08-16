# Draw One｜data/corpora — Historical Editions Registry

本目錄記錄 Draw One 三套 corpus 的**歷史版本登記**（Historical Editions Registry）。

> **Registry 記錄的是**：這套文本在歷史上有哪些可證明的版本，以及 Draw One 現在如何使用這份證據。
> **不是** canonical winner 的選拔，也不改 reference text、不改 production eligibility。

## 檔案結構

```
data/corpora/
├── liushijiazi/
│   ├── corpus.json / slips.json / attestations.json / variants.json / sources.json / claims.json   ← 六十甲子 corpus package（PR #11）
│   └── historical_editions.json
├── guanyin/
│   └── historical_editions.json        ← 觀音一百籤（corpus package 尚未建立）
├── guandi/
│   └── historical_editions.json        ← 關帝百籤／雷雨師（corpus package 尚未建立）
├── validate_historical_editions.py     ← registry validator
└── README.md
```

## 登記總覽（2026-08-16）

| Corpus | editions | roles |
|---|---|---|
| 六十甲子籤 | 2 | historical_attestation ×2 |
| 觀音一百籤 | 10 | historical_baseline_candidate ×1、identified_historical_edition ×9 |
| 關帝百籤 | 3 | historical_baseline ×1、historical_attestation ×2 |

## Schema（v1.1.0，2026-08-16 福 Gate NARROW REPAIR）

資料契約：`data/corpora/historical_editions.schema.json`（JSON Schema draft-07，`schema_version: "1.1.0"`）

維度拆解（取代 v1.0.0 混合維度 `role_in_draw_one`）：

| 欄位 | 值域 | 意義 |
|---|---|---|
| `edition_period` | `historical` / `modern` | 版本時代；**registry 只收 historical**（invariant I3 拒絕 modern） |
| `baseline_status` | `identified` / `candidate` / `baseline` | 目前做到哪一步：已定位／候選（ingestion 中）／完整 baseline |
| `content_roles` | array：`textual_attestation` / `interpretation_source` / `lineage_evidence` | 這份版本在 Draw One 扮演的內容角色 |
| `relationships` | structured array（`relationship_type` + `target_edition_id` + `note`） | 版本間關係（same_lineage／predecessor／annotation_of／compilation_contains／independent_holding／unresolved…） |
| `evidence` | structured array（`evidence_type` + `source`） | 證據分型：existence／acquisition／lineage／textual_attestation／human_observation／bibliographic_record |

### Cross-field invariants（validator 內建）

| # | 規則 |
|---|---|
| I1 | `baseline_status=baseline` → transcription **且** comparison 皆 `completed` |
| I2 | `baseline_status=candidate` → transcription **不得** `completed`（candidate 不當 completed baseline） |
| I3 | `edition_period=modern` → 拒絕（historical registry 不收 modern edition） |
| I4 | evidence 非空且結構化（evidence_type + source） |
| I5 | edition_id 全 registry 唯一 |
| I6 | content_roles 非空 |
| I7 | relationships 結構化 |

### Migration（v1.0.0 → v1.1.0）

`migrate_historical_editions_1.1.0.py` + `migration_summary_1.1.0.json`：16 筆全部遷移，研究結論文字逐字保留
（舊 evidence → `evidence[].source`；舊 relationship 全文 → `relationships[].note`）；15 筆原始研究結論 **semantic-equivalent**（M2/M3 檢查）。

## 已知 TODO（不擴建新 schema，僅記錄）

- **YDM 2016（育德媽祖同修會修訂版）**：已證明為獨立 modern edition family（≠ 北港官方現行版，2026-08-16 三向比對）——**不入 historical editions**；待 modern editions registry 建立後登記
- **日治《聖籤解》**：可能含 interpretation 層（「籤解」），取得數位複本後再判定是否另標 interpretation_source
- **早稻田《百籤鈔》1752／京大《百籖和解》1813 等註解本**：含 interpretation 層，若採用需另評估

## 驗證

```bash
python3 data/corpora/validate_historical_editions.py
# 期望：全部 PASS
```

Deterministic：registry 為靜態 JSON，validator 兩次執行輸出一致。
