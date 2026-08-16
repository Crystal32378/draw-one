# Draw One — Research Status Board

**Last updated:** 2026-08-16 15:08 (Asia/Taipei)

> This file reports research progress only. Source-of-truth evidence remains in corpus packages and historical registry.

## Corpora

| Corpus | Historical baseline | Modern temple reference | Next gate |
|---|---|---|---|
| 六十甲子籤 | 🔴 0/60 — 古本文字未取得（臺灣記憶 attestation 已登記） | 🟢 北港官方＋新港 60/60 已 OCR | 🟡 取得可逐字比較的古本 → Historical Comparison PR |
| 觀音一百籤 | 🟡 11/103 頁 OCR 進行中（早稻田 E1387） | 🟢 龍山寺／龍霄殿等主要 modern carriers 已確認；secondary mirrors 已識別 | 🟡 E1387 100 籤完成 → Historical Baseline Ingestion PR |
| 關帝百籤 | 🟢 100/100 — 道藏 baseline 完成；27/100 與現代 reading 直接／字形級支持 | 🟢 主要 modern carrier/reference 已確認 | 🟡 清刊本 transcription → Historical Edition Ingestion PR |

### Last checkpoint

- 六十甲子籤：2026-08-16（Registry 15+1 定案，PR #12 merged）
- 觀音一百籤：2026-08-16 15:00（OCR 管線 11 頁）
- 關帝百籤：2026-08-16（3-Corpus Historical Baseline 比較封箱）

## Infrastructure

| 項目 | 狀態 |
|---|---|
| PR #11 Liushijiazi Corpus Package | ✅ merged |
| PR #12 Historical Editions Registry | ✅ merged |
| Guanyin Historical Baseline Ingestion | ⏳ E1387 OCR 進行中 |
| Liushijiazi Historical Comparison | ⏳ 等待可逐字比較的古本文字 |
| Guandi Historical Edition Ingestion | ⏳ 等待清刊本 transcription |
