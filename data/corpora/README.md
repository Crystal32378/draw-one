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

## role_in_draw_one 語義

| Role | 意義 |
|---|---|
| `historical_baseline` | 已完成完整轉錄＋比對，可作為 production text basis 之歷史依據（目前唯一：道藏本關帝籤 100/100） |
| `historical_baseline_candidate` | 正在 ingestion／轉錄中，完成前**不**升 baseline（目前：早稻田 E1387《百籤》） |
| `historical_attestation` | 已確認存在之歷史版本，作為 provenance 證據；未完成轉錄或未取得文本 |
| `identified_historical_edition` | 已定位（館藏/書誌確認）但未進一步處理之歷史版本 |
| `modern_attestation` | 現代版本（目前無 registry，見 TODO） |
| `interpretation_source` | 解說層來源（目前無登記，見 TODO） |

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
