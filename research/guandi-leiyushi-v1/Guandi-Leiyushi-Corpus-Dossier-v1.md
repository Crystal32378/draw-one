# Draw One|Oracle Corpus Study 02
# 關帝百籤/雷雨師百籤 Provenance & Lineage Dossier v1

> 產出日期:2026-08-15 | 版本:v1(DRAFT,待 Crystal review)
> 範圍:只做 research;**不修改任何 repo**;不聯絡外部單位;不購買;不登入付費資料庫;不收集私人聯絡資料。
> 本檔不是 100 首籤詩整理,也不是「關帝專屬 corpus」的預設--先做 corpus identification,再做 lineage。

> 狀態標籤(edge 層級,沿用 PSD v1 紀律):`VERIFIED`=僅限 primary / official direct evidence(本輪直接抓取官方或一手頁面);`PROBABLE`=literature-supported/secondary-source-supported;`HYPOTHESIZED`=有動機無證據;`UNRESOLVED`=未取得一手證據。
> **Lineage 紀律:不確定的 edge 不得因為故事合理就黏起來;Access ≠ License;Search failure ≠ non-existence;deity adoption ≠ textual origin。**

---

## 0. 核心回答(五個 Research Questions 的簡版)

| RQ | 答案 | 證據強度 |
|---|---|---|
| RQ1 Corpus identity | 「雷雨師一百籤」「關聖帝君一百籤」「關帝靈籤」「天仙雷雨師籤」「城隍籤」**指向同一 corpus**(100 籤) | PROBABLE(secondary mirror 全量 diff:100/100 籤號對齊、26 籤完全一致、73 籤 edition 層差異--見 §1.4;行天宮官方「關聖帝君一百籤」命名本身 VERIFIED) |
| RQ2 Origin ≠ Adoption | 文本 origin 是**贛州聖濟廟的石固神籤**(南宋傅燁撰),不是關帝原生;關帝/城隍/福德正神等 adoption 是後來的 | PROBABLE(學術二手多源一致;origin 場域同為 literature-supported,非官方一手) |
| RQ3 Source genealogy | 道藏本 → (光緒王錢印本)→ 現行台灣各廟本;各 edge 已分級 | 見 §3 |
| RQ4 Temple adoption | 同一 corpus 跨寺廟、跨地區、跨神祇(關帝/城隍/福德正神/孔子文昌候選) | 多數 adoption 為二手證據,需廟方一手確認(見 adoption map) |
| RQ5 Framework stress test | 觀音 framework 多數通用;但發現 5 個 corpus-specific fields 與 3 個 framework failures | 見 Oracle-Framework-Stress-Test-02.md |

**最重要的單一發現**:今天被稱為「關帝籤」的文本,其**文本祖先**是江西贛州聖濟廟主神**石固**(秦人,宋元封「護國嘉濟江東王」)的籤--南宋寶慶年間(1225-1227)莆田人傅燁為贛縣東尉時所撰,收入《正統道藏·正一部》。關帝廟襲用此籤已久,才被改稱《關帝百首籤詩》。**「關帝籤」是 adoption 的結果,不是 textual origin。**

---

## 1. Corpus Identity(RQ1):名稱考

### 1.1 名稱家族的證據

| 名稱 | 出現脈絡 | 證據 |
|---|---|---|
| 雷雨師(一百籤) | 第 100 籤自述「我本天仙雷雨師,吉凶禍福我先知」 | PROBABLE(道藏本與現行本第 100 籤同文;兩側載體皆 secondary mirror,一手比對) |
| 關聖帝君一百籤 | 行天宮官網下載區命名 | VERIFIED(ht.org.tw 官方一手) |
| 關帝靈籤/關帝籤 | 關帝廟多採用;明清《明聖經》「關公執掌雷部」 | PROBABLE(udn/籤詩網/台灣好廟網二手一致) |
| 城隍籤 | 城隍廟多採用 | PROBABLE(二手多源) |
| 天仙雷雨師籤 | 第 100 籤自述者身分 | PROBABLE(同「雷雨師」源;mirror 層比對) |
| 關帝百首籤詩 | 台灣常見書名(vocus、林文欽論文用) | PROBABLE(學術文獻+二手;非官方一手) |

**判斷**:名稱多但 corpus 同一--第 1 籤「巍巍獨步向雲間」與第 100 籤「我本天仙雷雨師」是 identity anchor。全量 diff(§1.4)支持:100/100 籤號對齊、無缺籤、無錯位,73 籤差異皆單字級。

### 1.4 全量 diff:道藏本 100 籤 ↔ 現行雷雨師 100 籤(2026-08-15)

> 完整逐籤分類見 `Guandi-Leiyushi-Corpus-Diff-v1.json`。比對範圍=籤詩文四句(不含解曰/聖意註釋層)。

| 分類 | 數量 | 定義 |
|---|---|---|
| exact | 25 | 去標點後逐字一致 |
| orthographic-only | 1 | 僅異體字(#1 冨/富) |
| substantive variant | 73 | 同源詩但有用字差異 |
| numbering mismatch | 0 | 籤號錯位 |
| missing | 0 | 單邊缺籤 |
| (decode issue) | 1 | #62 籤詩網側解碼缺字;對應道藏「虎頭城裹喜相尋」→現行本應爲「虎頭城裏...」(裹/裏異體,實質接近 orthographic) |

**回覆本輪核心問題:「我們現在有沒有資格把它叫同一 corpus?」→ 有。** 依據:1 numbering 100/100 對齊(0 mismatch、0 missing);2 100 個對應籤號皆可辨識為同一首對應詩作的版本變體(無整籤重寫、無典故替換);3 26 籤文本完全一致;4 73 籤差異皆單字級(同義替換如 天成/天生、異體如 迴/回、傳抄訛變如 #50 現行「步多」疑「步步」之訛)。

**但必須同時聲明(證據紀律)**:同一 corpus ≠ 同一 edition。1 兩側載體皆為 **secondary mirror**(維基文庫轉錄道藏本、籤詩網轉錄現行本)--comparison directly performed(比對已直接執行),但**外推至真實道藏本/真實現行本為 PROBABLE**,升級路徑=ctext 道藏掃描影像(res=84978)+行天宮官方 jpg 全量 OCR 比對;2 道藏系(南宋造/明代收錄層)與現行台灣系(光緒王錢印本傳承層)是**同一 corpus 的兩個 edition family 層**--corpus 節點一個,edition 節點至少兩個,Draw One 建模時不得合併為單一版本。

### 1.2 不同 corpus 的界線(不得混淆)

- **觀音一百籤**(龍山寺系):第 1 籤「開天闢地作良緣」類文本;**不是**雷雨師。
- **六十甲子籤**:60 籤,媽祖廟/天公廟常見;不同系統。
- **福德正神籤**(烘爐地系):福德正神自有籤系(28 籤擲杯制等);與福安宮疑似採用關帝百籤是**兩回事**(同一主神、不同 corpus--見 §4 爭議)。
- **月老百籤**:政大有專論;與雷雨師關係待查(HYPOTHESIZED)。

### 1.3 一個必須記錄的邊界案例:高雄龍霄殿

龍霄殿(東嶽大帝廟)第 100 籤「欲就東兮欲就西...」與**觀音一百籤**第 100 籤同文(2026-08-15 比對:龍霄殿官網 vs 台灣好廟網觀音百籤)--不是雷雨師 corpus。這修正了 PSD v1 的脈絡理解(當時只記錄「與先前記錄的龍山寺相關文本存在差異」):龍霄殿疑似是**東嶽廟採用觀音百籤**的跨神祇 adoption 案例,需多籤號驗證後才能定論。

---

## 2. Origin ≠ Adoption(RQ2):文本系譜

```
[PROBABLE·secondary mirror 全量比對] 道藏本《護國嘉濟江東王靈籤》(《正統道藏·正一部》)
        │  全量 diff:100/100 籤號對齊、26 籤完全一致、73 籤 edition 層差異(§1.4)
        │  (維基文庫 vs 籤詩網,皆 mirror;外推真實本需 ctext 掃描影像/行天宮官方 jpg)
        │
[PROBABLE·學術二手多源一致] 南宋寶慶年間(1225-1227)莆田傅燁撰,於贛州聖濟廟使用
        │  主神:秦人石固(鎮水之神→客家嘉濟尊王;宋元封「護國嘉濟江東王」)
        │  佐證:明洪武辛亥(1371)宋濂〈贛州聖濟廟靈跡碑〉(道教文化中心資料庫、識典古籍 DZ1305、vocus、udn)
        │
[PROBABLE] 明清之際:關帝廟襲用此籤已久 → 改稱《關帝百首籤詩》
        │  另:《關帝聖君聖籤》(清盧湛《關帝聖君聖籤考》載,寧波延慶寺僧人假託關帝名義編造)→ 不傳
        │  udn 補充機制:明清《明聖經》言關公「玉帝殿前首相,執掌雷部」→ 以關帝為雷雨仙
        │
[PROBABLE·單一二手] 清光緒年間書商王錢印本(台灣現行版本的源頭;vocus「根據文獻資料」)
        │  體例:干支、籤序、吉凶、籤頭故事、籤詩文、聖意、東坡解、碧仙註、解曰、釋義、占驗
        │
[VERIFIED·一手·僅限行天宮] 行天宮官方電子籤詩 jpg(其餘現行本為 secondary mirror)
```

**保存的衝突**:
- 文本起源南宋傅燁說 vs 中華關聖帝君弘道協會「《關帝靈籤》創始於元末至明初,流傳至少 600 多年」--兩說可能分別指「文本起源」與「關帝名義流行起點」,但未證實,**並存**。
- 「關帝籤」名稱機制:udn 主因《明聖經》雷部說;vocus 主因關帝廟襲用後改稱--不同敘述,皆二手。

---

## 3. Source Genealogy(RQ3):每條關係的證據級別

### 3.1 VERIFIED edges(primary / official direct evidence)

| Edge | 證據 |
|---|---|
| 行天宮官網提供「關聖帝君一百籤」電子籤詩 | ht.org.tw/p7_download156.htm 官方一手抓取;jpg 208×800 |

> 修正說明(2026-08-15 v1 收斂):原列「道藏本↔現行文本」與「籤詩網全集」兩條 VERIFIED 移除--兩側載體皆為 secondary mirror(維基文庫/籤詩網),依紀律不得標 VERIFIED;全量比對結果降為 PROBABLE(見 §1.4、§3.2)。

### 3.2 PROBABLE edges(literature/secondary-supported)

| Edge | 證據 |
|---|---|
| 道藏本 ↔ 現行雷雨師文本同源(全量) | 維基文庫 vs 籤詩網 100 籤 diff(2026-08-15):0 mismatch、0 missing、26 籤完全一致、73 籤單字級差異;載體 mirror 層,外推 PROBABLE |
| 南宋傅燁撰籤於贛州聖濟廟 | 道教文化中心資料庫(學術機構)、識典古籍、vocus、udn 一致 |
| 關帝廟襲用→改稱關帝百首籤詩 | vocus(引《關帝聖君聖籤考》);udn(明聖經) |
| 台灣現行本源於清光緒王錢印本 | vocus 單一二手 |
| 城隍廟/其他主神廟多採用 | 籤詩網、台灣好廟網、buddhamind 二手一致 |
| 香港孔廟、文昌廟採用(跨地區) | 籤詩網二手 |
| 車城福安宮(福德正神)用關帝百籤系統 | vocus 二手 |
| 龍霄殿用觀音百籤 corpus | 龍霄殿第 100 籤 vs 台灣好廟網觀音百籤第 100 籤同文(一手比對,但僅一籤) |

### 3.3 HYPOTHESIZED/UNRESOLVED

- 月老百籤與雷雨師關係:HYPOTHESIZED(論文存在未讀)
- 《關帝聖君聖籤》與雷雨師文本關係:UNRESOLVED(稱不傳,文本未見)
- 《正統道藏》各版本(涵芬樓/三家本)差異:UNRESOLVED
- 行天宮實體籤與電子籤是否同印版:UNRESOLVED(需 item-to-item)

### 3.4 mirror / 網路轉錄的判定

籤詩網、台灣好廟網、temples.tw、buddhamind 的雷雨師全集彼此高度同文--**判定為同一 edition family 的網路轉錄群**(secondary),不是 independent sources;independent 的 anchor 是道藏本與行天宮官方電子籤。

---

## 4. Temple Adoption Map(RQ4)摘要

> 完整結構化資料見 `Guandi-Leiyushi-Adoption-Map-v1.json`(9 筆)。

| Corpus | 寺廟 | 主神 | 地區 | 證據級別 |
|---|---|---|---|---|
| 雷雨師/關帝百籤 | 台北行天宮 | 關聖帝君 | 北台灣 | VERIFIED(官方一手) |
| 雷雨師/關帝百籤 | 苗栗玉清宮 | 關聖帝君 | 中台灣 | PROBABLE(碩論文獻) |
| 雷雨師/關帝百籤 | 高雄關帝廟群 | 關聖帝君 | 南台灣 | PROBABLE(學術論文) |
| 雷雨師/關帝百籤 | 新竹城隍廟 | **城隍**(跨神祇) | 北台灣 | PROBABLE(二手) |
| 雷雨師/關帝百籤 | 日月潭文武廟 | 關聖帝君+孔子 | 中台灣 | PROBABLE(二手) |
| 雷雨師/關帝百籤 | 車城福安宮 | **福德正神**(跨神祇) | 南台灣 | PROBABLE(二手;若屬實為重大 finding) |
| 雷雨師/關帝百籤 | 香港孔廟/文昌廟(候選) | **孔子/文昌**(跨神祇跨地區) | 香港 | PROBABLE(二手) |
| 《護國嘉濟江東王靈籤》 | 贛州聖濟廟 | 石固/江東王(origin) | 江西 | PROBABLE(學術機構+碑文,literature-supported) |
| 觀音一百籤(邊界案例) | 高雄龍霄殿 | 東嶽大帝(跨神祇) | 南台灣 | PROBABLE(單籤比對) |

**關鍵 finding(需謹慎表述)**:同一 textual corpus 跨寺廟、跨地區、跨神祇採用--但多數 adoption 證據是二手,**不要過度推論原因**;下一輪需廟方一手確認(行天宮已 VERIFIED 例外)。

---

## 5. 一手驗證摘要(2026-08-15 本輪實抓)

- **全量 diff(本輪新增)**:維基文庫道藏本 100 籤 vs 籤詩網現行本 100 籤--0 mismatch、0 missing、26 籤完全一致、73 籤 edition 層差異(兩側皆 secondary mirror;比對動作一手)
- 行天宮官網下載頁(2024/03/21 更新)+籤詩 jpg(208×800)實抓
- 籤詩網雷雨師全集(Big5)第 1 籤實抓
- 龍霄殿第 100 籤 vs 台灣好廟網觀音百籤第 100 籤比對(corpus 邊界)
- 道教文化中心資料庫、識典古籍、vocus、udn、弘道協會文章全文抓取

---

## 6. 未決事項/下一步(MUST-TEST 候選)

1. **行天宮 item-to-item**:官網電子籤(jpg)與實體籤詩簿逐籤比對。
2. ~~道藏本全文比對~~ **已完成(2026-08-15)**:結果見 §1.4(0 mismatch、0 missing、26 籤一致、73 籤 edition 差異)→ 升級路徑:ctext 道藏掃描影像(res=84978)OCR 複驗+行天宮官方 jpg 全量比對(可升 VERIFIED)。
3. **福安宮一手確認**:車城福安宮官網/現場籤詩是否關帝百籤系統(重大 adoption finding 的關鍵節點)。
4. **香港孔廟/文昌廟一手確認**:跨地區 adoption。
5. **龍霄殿多籤號驗證**:確認是否整副觀音百籤(修正 PSD 脈絡)。
6. **國圖/中研院館藏**:《關帝靈籤》清刊本與《正統道藏》正一部館藏查詢。
7. **王錢印本追蹤**:清光緒王錢印本是否有館藏/掃描。

---

## 7. 品質與驗證紀律(沿用)

- 全部紀錄 verification date = 2026-08-15;VERIFIED 僅限 primary / official direct evidence(行天宮官方一手為唯一適用);維基文庫/籤詩網等全文載體一律視為 secondary mirror,相關比對標 PROBABLE(外推層)。
- **Access ≠ License**:所有 license_status 均 unsure(未逐頁確認 reuse 條款)。
- **Search failure ≠ non-existence**。
- **secondary source ≠ VERIFIED**；**source_observation_status ≠ edge_level**（source record 的觀察狀態不得解讀為 lineage claim 級別）。
- **canonical schema（PSD v1.2.2 定案，2026-08-15 sync）**：lineage / adoption claim 僅用 `edge_level`＝VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED；source record 用 `source_observation_status`＝directly_observed / carried_forward / indirectly_supported / unresolved；literature record 用 `acquisition_status`＝fulltext_obtained / abstract_obtained / bibliographic_record_only / secondary_mention_only / not_obtained；access / license 各自由 `access_status`、`license_status` 獨立表示。
- **same text ≠ independent source**:網路轉錄群視為同一 edition family。
- **deity adoption ≠ textual origin**:關帝廟用 ≠ 關帝原生。
- 本文件不含任何個人聯絡資料。
