# WHY THESE SOURCES / WHY THIS CORPUS — Positioning

**Last updated:** 2026-08-17 13:00 (Asia/Taipei)
**Status:** v0.2 — production source update（艋舺龍山寺版 = Taiwan reference edition）

> This file reports research positioning only. Source-of-truth evidence remains in corpus packages and historical registry.

## Corpus Radar

| Corpus | Sources | 燈號 | 保存／傳承路徑 | 對 Draw One 的意義 |
|---|---|---|---|---|
| 觀音一百籤 | **Production/reference：艋舺龍山寺百首版**；parallel historical tradition：京都大學／早稻田（元三大師系）＋南宋天竺靈籤 | 🟢 | 台灣 living-tradition（艋舺龍山寺）＋跨國寺院刊刻（天竺寺 → 日本寺院刊本 → 日數位典藏） | 台灣使用者讀艋舺 living-tradition text；provenance layer 保留 parallel tradition 與其他版本；current-lineage historical witness = UNRESOLVED |
| 關帝百籤 | 《正統道藏》＋哈佛燕京清刊本 | 🟢 | 正典＋坊刻雙軌：道教大藏經 ＋ 清坊刻流通 | 早期宗教正典籍收錄權威；清刊本為民間流通版本 |
| 六十甲子籤 | 北港古本文物＋臺灣記憶／臺史所 | 🟢 | 在地廟宇傳承：廟藏 → 國圖 2024 合作數位化 → 臺灣記憶 | 台灣在地傳承的原始歷史載體；可把現代北港／新港版本往前接回更久遠的歷史 |

## Why these sources

> We prioritize sources that are historically meaningful, institutionally preserved, textually traceable, and useful for connecting ancient source → modern tradition.

作為 baseline 的選擇，不是最老，也不是為任一文本打上「最好的」標籤，而是考慮以下幾點，做出**平衡性的建議**：

**完整 ＋ 逐字可追溯 ＋ 合法可利用 ＋ 連續性最清楚**

## Production edition vs Provenance layer

Draw One 的**繁中／台灣 reference edition** 採**艋舺龍山寺《觀世音靈籤》百首版本**——台灣使用者讀的是這套 living-tradition text。

但這**不代表**艋舺版「最古」「原本」或「唯一正統」。它只是**產品層的 reference edition**（給當代台灣使用者的文本基礎），不是 canonical ancestor。

- **Production edition（艋舺龍山寺版）**＝ 使用者實際讀到的籤詩文本
- **Provenance layer**＝ 保留其他版本（鹿港／大陸／廣東／福建）與歷史來源作為 lineage evidence
- **chance.org.tw（籤詩網）**＝ secondary transcription，保留作 comparison witness（不刪除、不當 production source）
- **transcription confidence 與 migration 分離**：chance.org.tw 文字的 witness transcription confidence 維持 PROBABLE（不因 production 決策而覆蓋）；逐籤依艋舺版核對尚未完成 → production migration 標 TRANSCRIPTION_PENDING（不假裝已完成切換）
- 薛皓文 2008 論文附錄二 ＝ transcription/comparison evidence，非 historical primary source

**Production suitability ≠ historical priority；reference edition ≠ canonical ancestor。** 歷史 witness 研究持續獨立進行，不因 production 決策而停止。

## Current lineage vs parallel historical tradition

觀音一百籤有**兩條不同的 textual lineage**，必須分開處理：

- **Current lineage（天開地闢系，七字）**＝ Draw One 台灣使用者讀的這一套。production/reference 採艋舺龍山寺版。其**historical witness 目前 UNRESOLVED**——福建／台灣「天開地闢」系的明清古刊本尚未尋得，來源只能推到清初安海龍山寺（推論），不能宣稱更早。
- **Parallel historical tradition（七寶浮圖塔／元三大師系，五字）**＝京都大學、早稻田所藏的日本刊本，南宋《天竺靈籤》為其祖先文本。這是**另一條 lineage**，與台灣系文本 0/100 匹配，**不是**台灣系的歷史源頭。

兩條 lineage 都納入 provenance layer，但互不混同：parallel tradition 是「文本旅行的平行見證」，不是 current lineage 的 ancestor。

## Research posture

在海量的網路搜尋中，我們並不是只在「找到答案」。

我們一次又一次重新發現這些籤詩是如何被傳承下來的：從在地寺廟保存的古本文物，到跨國大學的古籍館藏，再到國家級研究與典藏機構。

這些發現也不斷重新校正 Draw One 的研究座標，以及我們應該以什麼姿態提供資訊。

我們不希望把數百年的文本傳承，扁平地壓縮成搜尋引擎式的排名、相關性，或單一的「最佳答案」。

相反地，我們選擇有意識地保存：

- 不同時代留下的文本；
- 不同地區與機構保存的版本；
- 文本之間的異文與演變；
- 現代寺廟作為 living tradition 所留下的傳承參考。

因為這些差異本身就是歷史的一部分。

Draw One 想做的，不是替幾百年的傳統下最後結論，而是讓人重新看見：

> 不同時代、不同地區、不同機構，如何保存並理解同一套籤詩；以及人們如何一次又一次透過求籤，試著理解自己的處境、尋找方向與心靈上的安定。

因此，AI 的工作也不應該是把這些差異消除。

它應該知道自己站在哪一份 source、哪一條 tradition 上，再把這些有來源的傳承帶進一個當代使用者的具體處境。

具體而言，AI interpretation 以**所選 reference edition（艋舺龍山寺版）**為文本基礎，**不自行融合不同版本**；版本與歷史差異（含 parallel tradition）透過 provenance metadata 呈現，不混進正文。

**source → tradition → context → interpretation**

這才是 Draw One 希望提供的資訊方式。
