# Draw One — Research Status Board

**Last updated:** 2026-08-16 15:29 (Asia/Taipei)

> This file reports research progress only. Source-of-truth evidence remains in corpus packages and historical registry.

## Corpora

| Corpus | Historical baseline | Modern temple reference | Next gate |
|---|---|---|---|
| 六十甲子籤 | 🔴 0/60 — 古本文字未取得（臺灣記憶 attestation 已登記） | 🟢 北港官方＋新港 60/60 已 OCR | 🟡 取得可逐字比較的古本 → Historical Comparison PR |
| 觀音一百籤 | 🔴 0/100（baseline target 重新定位中） | 🟢 龍山寺／龍霄殿等主要 modern carriers 已確認 | 🔴 **Target Recalibration（2026-08-17）**：京大 RB00017894／早稻田 E1387 → parallel_tradition（日本元三大師百籤系統，3-slip fingerprint 0/100 匹配）；《観音百籤占決諺解》(1687) REJECT；下一批候選轉向中國觀音靈籤／天竺靈籤數位典藏 | |
| 關帝百籤 | 🟢 100/100 — 道藏 baseline 完成；27/100 與現代 reading 直接／字形級支持 | 🟢 主要 modern carrier/reference 已確認 | 🟡 清刊本 transcription → Historical Edition Ingestion PR |

## Tracking rationale

> We prioritize sources that are historically meaningful, institutionally preserved, textually traceable, and useful for connecting ancient source → modern tradition.

| Corpus | Radar locked on | Why |
|---|---|---|
| 觀音一百籤 | 京都大學／早稻田 historical editions | 頂級學術館藏、早期版本、原件影像與可追溯 locator；適合建立 historical baseline |
| 關帝百籤 | 《正統道藏》＋哈佛燕京清刊本 | 早期宗教典籍傳本已有 baseline；清刊本可補中間 textual lineage |
| 六十甲子籤 | 北港古本文物＋臺灣記憶／臺史所 | 台灣在地傳承的歷史載體，可把現代北港／新港版本往前接回歷史 |

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
