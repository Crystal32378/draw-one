# Draw One — Research Status Board

**Last updated:** 2026-08-16 15:29 (Asia/Taipei)

> This file reports research progress only. Source-of-truth evidence remains in corpus packages and historical registry.

## Corpora

| Corpus | Historical baseline | Modern temple reference | Next gate |
|---|---|---|---|
| 六十甲子籤 | 🔴 0/60 — 古本文字未取得（臺灣記憶 attestation 已登記） | 🟢 北港官方＋新港 60/60 已 OCR | 🟡 取得可逐字比較的古本 → Historical Comparison PR |
| 觀音一百籤 | 🔴 0/100（baseline target 重新定位中） | 🟢 **艋舺龍山寺百首版 = Taiwan production/reference edition**（chance.org.tw 降為 secondary transcription，witness confidence 維持 PROBABLE；逐籤依艋舺版核對 → production migration TRANSCRIPTION_PENDING） | 🔴 **Target Recalibration（2026-08-17）**：京大 RB00017894／早稻田 E1387 → parallel_tradition（日本元三大師百籤系統，3-slip fingerprint 0/100 匹配）；《観音百籤占決諺解》(1687) REJECT；下一批候選轉向中國觀音靈籤／天竺靈籤數位典藏 | |
| 關帝百籤 | 🟢 100/100 — 道藏 baseline 完成；27/100 與現代 reading 直接／字形級支持 | 🟢 主要 modern carrier/reference 已確認 | 🟡 清刊本 transcription → Historical Edition Ingestion PR |

## Tracking rationale

> We prioritize sources that are historically meaningful, institutionally preserved, textually traceable, and useful for connecting ancient source → modern tradition.

**Production / reference edition ≠ canonical ancestor；production suitability ≠ historical priority。** reference edition 是給使用者的 living-tradition 文本；historical edition 是追蹤文本源流的歷史證據——兩者不同軸線，互不取代，也不因 production 決策而停止 historical witness research。

| Corpus | Production / reference edition | Historical radar | Variant / lineage witnesses |
|---|---|---|---|
| 觀音一百籤 | 🟢 艋舺龍山寺百首版（Taiwan reference；chance.org.tw 降為 secondary transcription） | 京都大學／早稻田（元三大師系）＋南宋天竺靈籤 = parallel tradition | 鹿港／大陸／廣東／福建版本 = variant + lineage evidence（不覆寫進艋舺文本） |
| 關帝百籤 | 🟢 主要 modern carrier/reference | 《正統道藏》＋哈佛燕京清刊本 | — |
| 六十甲子籤 | 🟢 北港朝天宮官方版 | 北港古本文物＋臺灣記憶／臺史所 | 新港／通用網路轉錄版 = variant |

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
