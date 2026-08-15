# Draw One｜Primary Source Acquisition Dossier v1

> 觀音靈籤 100／《觀音靈課》相關版本與文獻 lineage 的公開來源研究檔。
> 產出日期：2026-08-15 ｜ 版本：**v1.2.2（FINAL / RESEARCH COMPLETE）**（semantics repair：lineage edges 證據四級化、龍霄殿降級、故宮 CC0 拆 platform/item 兩層、conflation 措辭修正；v1.2 micro-patch：VERIFIED 語義收斂、龍山寺／淺草寺降級為 literature-supported、NDL negative finding 措辭收斂；v1.2.1 terminology 對齊：System A 歷史節點降級、文獻表改取得狀態；v1.2.2 schema semantics repair：source observation 與 literature acquisition 改為獨立 enum）
> **本包封存，不再擴 research。**

> 狀態標籤（**只有 edge 層級**）：`VERIFIED`＝**僅限 primary / official direct evidence**（本輪直接抓取官方或一手頁面確認）；`PROBABLE`＝literature-supported（可靠研究文獻／二手資料一致支持，但尚缺官方 concrete item 直接命中）；`HYPOTHESIZED`＝有動機但無直接證據的推測；`UNRESOLVED`＝未取得一手證據。
> Source record 只使用 `source_observation_status`：`directly_observed`／`carried_forward`／`indirectly_supported`／`unresolved`。Literature record 只使用 `acquisition_status`：`fulltext_obtained`／`abstract_obtained`／`bibliographic_record_only`／`secondary_mention_only`／`not_obtained`。兩者都不是 lineage evidence，也不使用 `confidence`。
> **Lineage 紀律：不確定的 edge 不得因為故事合理就升級；文獻支持 ≠ 官方一手驗證。**

---

## 0. 核心結論：這是兩個不同的文本系統

本輪研究最重要的判斷：現有證據**強烈支持**《觀世音菩薩感應靈課》三十二卦與觀音一百籤為**兩套不同的操作／文本系統**，因此目前**不得合併**；兩者是否存在更早的歷史關係，仍待進一步考證。

| | 系統 A：《觀世音菩薩感應靈課》 | 系統 B：觀音一百籤（觀音靈籤 100） |
|---|---|---|
| 形式 | **三十二卦**，用五枚卜錢占卜（擲錢成卦） | **100 首籤詩**，籤筒／籤枝抽取 |
| 現存最早刻本 | 明萬曆 20 年（1592）刻本（`PROBABLE`·literature-supported，無 direct item；館藏地點 `UNRESOLVED`） | 無明確單一版本，各地內容頗有差異（`PROBABLE`·secondary-source-supported，籤詩網明文＋文獻一致） |
| 證據最強的版本鏈 | 歷史節點（1592／1932／1946）均 `PROBABLE`·literature-supported（無 direct item）；現代流通節點 `VERIFIED`（華藏官方頁一手） | 龍山寺使用 100 籤（`PROBABLE`·literature-supported，官網無電子 item）；與淺草寺的親緣關係 `PROBABLE→UNRESOLVED` |
| 與 Oracle KB pilot 的關係 | — | pilot 中 guanyin-003 的分歧**可能**與不同文本系統或 edition family 有關，目前**尚未建立直接對應證據** |

---

## 1. 版本 Lineage 樹（含每條 edge 的證據狀態）

### 1A. 系統 A：觀世音菩薩感應靈課（三十二卦）

```
[PROBABLE·legend] 唐代玄奘西行途中蒙觀世音菩薩傳授（淨宗流通序「相傳」；無一手文獻）
        │
[PROBABLE·literature-supported] 明萬曆 20 年（1592）刻本 ── 辛德勇〈述石印明萬曆刻本《觀世音感應靈課》〉
        │                    （《中國典籍與文化》2004年第3期）；王濤〈長安殘書見精神〉（《藏書家》第8輯）；
        │                    陳冠至博士論文〈明代佛教典籍出版研究〉——多源一致，但刻本無 direct item
        │                    ※ 刻本本身館藏地點：UNRESOLVED（最可能中國國圖，待查）
        │
[PROBABLE·literature-supported] 民國 21 年（1932）徐長慶石印本：據萬曆刻本影印；徐乃昌得明代孤本，請印光法師撰流通序；
        │  扉頁題字王震（海雲樓主）── 文獻多源一致（轉載全文 + 博士論文 + 淨宗序文），石印本無 direct item
        │
[PROBABLE·literature-supported] 民國 35 年（1946）蘇州靈巖山寺製版流通：比丘尼隆志得徐本，手錄並改良圖畫，
        │  獻靈巖山寺妙真方丈，製版流通，「兼作靈巖山觀音洞籤書之用」── 華藏官方頁載流通序全文（一手頁面），
        │  但 1946 製版書無 direct item
        │
[VERIFIED·官方頁一手] 現代流通現況：華藏淨宗法寶禮請（fabo.hwadzan.com/Fabo/1555，庫存38、需註冊帳號）── 2026-08-15 實抓
[PROBABLE] 平行管道：台南極樂寺線上書（amtbtn.org，路徑已記錄、本輪未重抓）
```

### 1B. 系統 B：觀音一百籤（100 首）

```
[PROBABLE] 南宋「天竺靈籤」（觀音圖＋漢詩 100 枚）── 日本二手文獻一致（note.com、
     明治聖徳記念学会〈「おみくじ」的起源與諸相 追考〉「天竺霊籤は一番を缺く」）；未見一手宋版
        │
[PROBABLE] 比叡山元三大師百御籤（「漢詩一百」）── 江戶貞享元年（1684）刊本有存（jstage 論文研究其插圖）；
     《元三大師百籤》《観音百籤占決諺解》影印本見於國立国会図書館（crd.ndl.go.jp 參考頁）── 需 NDL item 一手確認後升級
        │
[PROBABLE·literature-supported] 淺草寺觀音百籤（現行；日本佛寺「佛籤」）── 籤詩網／台灣好廟網全集一致＋local evidence available; not committed（sha256 c589742c…）；官方 concrete item 未直接命中
        │
        ├─[UNRESOLVED] 淺草寺 → 台灣觀音廟（含龍山寺）：「台灣觀音籤來自淺草寺」僅見二手轉述，無一手證據；
        │                不得以實線 lineage 表達
        │
[PROBABLE·literature-supported] 台北龍山寺「觀世音靈籤」100 首 ── 薛皓文 2007 碩論以龍山寺單一版本為題＋籤詩網全集一致；
        │  MT-1 已證官網現行版無籤詩電子 item → 缺官方 concrete item 直接命中
        │
        ├─[UNRESOLVED] 龍山寺系與淺草寺系 item-to-item 對應關係：pilot 已發現同籤號文本分歧，但比對未完成
        ├─[HYPOTHESIZED] pilot guanyin-003 分歧可能與不同文本系統或 edition family 有關（無直接證據）
        └─[UNRESOLVED] 高雄龍霄殿（東嶽廟）與龍山寺系文本關係：第100籤文本存在差異，
                         需直接 item-to-item 複驗後才能判定為跨廟版本分歧
```

---

## 2. 文獻 Lineage（研究文獻，作為版本地圖）

| 文獻 | 類型 | 為何重要 | URL | 取得狀態（`acquisition_status`） |
|---|---|---|---|---|
| 辛德勇〈述石印明萬曆刻本《觀世音感應靈課》〉，《中國典籍與文化》2004(3) | 期刊論文 | 萬曆刻本→1932 石印本關係的第一手考證 | lsqn.cn 轉載（douban 群轉載同文） | `fulltext_obtained`（轉載全文） |
| 王濤〈長安殘書見精神〉，《藏書家》第8輯 | 期刊文章 | 長安殘書（萬曆刻本）發現始末 | 同上轉載提及 | `secondary_mention_only`（轉載提及） |
| 陳冠至《明代佛教典籍出版研究》（博士論文） | 學位論文 | 佛教典籍出版史脈絡；記徐乃昌得孤本、印光序 | fju.edu.tw PDF | `fulltext_obtained`（全文 PDF） |
| 薛皓文《臺灣艋舺龍山寺籤詩及其文學性研究》（2007 碩論） | 學位論文 | 唯一以龍山寺百首觀音籤為專題的碩論；六章含源流、典故出處 | ndltd.ncl.edu.tw/r/8z8esh；Airiti U0021-2910200810574807 | `abstract_obtained`（書目與摘要） |
| 陳進國〈寺廟靈籤的流傳與風水信仰的擴散〉 | 期刊論文 | 閩台寺廟籤詩文本與風水信仰；跨廟文本流傳 | chinafolklore.org NewsID=2931 | `fulltext_obtained`（網頁全文） |
| 濮文起編《中國歷代觀音文獻集成》卷6《觀音靈應圖經》（中華全國圖書館文獻縮微複製中心，1998） | 叢書 | 觀音文獻大型彙編，含靈應圖經 | books.google.com（書目頁） | `bibliographic_record_only`（書目）；內容需館藏 |
| 《元三大師御籤本の研究：おみくじを読み解く》 | 專書 | 日本御籤本（元三大師百籤系）系統研究 | ndlsearch.ndl.go.jp R100000002-I000010080893 | `bibliographic_record_only`（書目） |
| 明治聖徳記念学会〈「おみくじ」の起源與諸相 追考〉 | 學會刊物 PDF | 天竺靈籤與元三大師籤比較（「天竺霊籤は一番を缺く」） | meijiseitoku.org/pdf/f58-3.pdf | `abstract_obtained`（PDF 摘要） |
| 貞享元年刊《元三大師百籤》插圖研究（jstage jsartdesign 6_11） | 期刊論文 | 江戶御籤本版本學 | jstage.jst.go.jp | `abstract_obtained`（摘要） |

> 說明：本表 `acquisition_status` 標示**文獻本身取得到的層級**，與 lineage edge 的 `edge_level`（唯一使用 VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED）為**不同層級**，不得混用。

---

## 3. Primary Source 清單（公開來源；結構化版見 sources.json）

### A 級（可直接取得／高價值）

| ID | 來源 | 類型 | Access | 關鍵事實（2026-08-15 實抓） |
|---|---|---|---|---|
| PSD-A01 | 華藏淨宗學會法寶禮請《觀音籤-觀世音菩薩感應靈課》 | 宗教出版流通 | 公開（需註冊帳號申請） | fabo.hwadzan.com/Fabo/1555；庫存 38；含靈巖山寺觀音洞籤書流通序全文；meta 載「明宮后付梓印施百卷」 |
| PSD-A02 | 台南極樂寺（淨宗學會）線上書 | 宗教出版流通 | 公開 | amtbtn.org/media-ebook/page/171；觀音靈課 PDF 第二管道（本輪未重抓 → PROBABLE） |
| PSD-A03 | 籤詩網·觀音一百籤（公版全集） | 二手全文（文本對照用） | 公開 | chance.org.tw 觀音一百籤頁；「並非所有觀音寺廟均用此版」；有 PDA 版 |
| PSD-A04 | 籤詩網·淺草金龍山觀音寺一百籤 | 二手全文（跨國比對用） | 公開 | chance.org.tw 淺草百籤全集（pilot 已比對） |
| PSD-A05 | 台灣好廟網·東京淺草觀音寺一百籤 | 二手全文（含 lineage 說明） | 公開 | qiangua.temple01.com/qianshi.php?t=fs_akt100；載「中國天竺靈籤傳至比叡山，通稱漢詩一百／元三大師百御籤」（PROBABLE lineage 說明） |
| PSD-A06 | 淺草寺百籤 2011 復刻 PDF | 本地文件 | local evidence available; not committed | 實體文本；sha256 c589742c561c5eb7137b4685b4a162eb69a8e3caed0684bc8a1fa441fb5168fa；Oracle KB pilot 既有材料 |
| PSD-A07 | 高雄龍霄殿官網靈籤解籤 | 寺廟官方 | 公開 | longcheng.org.tw；第 100 籤一手抓取（「欲就東兮欲就西…」）。**與先前記錄的龍山寺相關文本存在差異；需直接 item-to-item 複驗後才能判定為跨廟版本分歧** |
| PSD-A08 | 國立故宮博物院·典藏資料檢索 | 博物館數位典藏 | 公開 | digitalarchive.npm.gov.tw；`platform_rights_status = directly_observed`（官方 CC0 公眾領域貢獻宣告，低階圖像約 41 萬幅）；item license 尚未確認（CC0 僅涵蓋書畫／器物／織品，古籍善本不在已確認範圍） |
| PSD-A09 | 中研院傅斯年圖書館（善本全文影像） | 學術數位典藏 | 公開（新增開放 452 種） | 452 種善本全文影像已開放；是否含觀音靈課 UNRESOLVED |

### B 級（檢索管道／需登入或進一步確認）

| ID | 來源 | 類型 | Access | 備註 |
|---|---|---|---|---|
| PSD-B01 | 國圖·古籍與特藏文獻資源（rbook.ncl.edu.tw） | 圖書館 catalog | 公開檢索 | 善本古籍檢索入口；「觀音靈課」館藏查詢需以正確格式手動檢索 |
| PSD-B02 | 國圖·臺灣記憶（tm.ncl.edu.tw） | 圖書館數位典藏 | 部分受限 | 台灣史料庫；與朝天宮合作收籤詩文獻（Cultural Network 已記錄） |
| PSD-B03 | 中研院數位典藏（catalog.digitalarchives.tw） | 學術數位典藏 | 公開 | 已見明萬曆庚戌（1610）刊本釋家類彙編藏品（書號 09033-0318）；與觀音靈課相關性 UNRESOLVED |
| PSD-B04 | 中研院漢籍電子文獻（hanji.sinica.edu.tw） | 古籍全文庫 | 公開 | 典故查證用；觀音靈課是否收錄 UNRESOLVED |
| PSD-B05 | 中國哲學書電子化計劃（ctext.org） | 古籍全文庫 | 公開 | 典故交叉查證；觀音靈課是否收錄 UNRESOLVED |
| PSD-B06 | 日本國立国会図書館デジタルコレクション | 國家圖書館數位典藏 | 公開 | 「元三大師百籤」「観音百籤占決諺解」影印本見於參考頁（crd.ndl.go.jp entry 1000082103）；實際 item 檢索 JS 渲染未抓到 → UNRESOLVED |
| PSD-B07 | 日本 NDL Search（ndlsearch.ndl.go.jp） | 圖書館 catalog | 公開 | 《元三大師御籤本の研究》書目已確認 |
| PSD-B08 | 中國國家圖書館（nlc.cn）／中華再造善本資料庫 | 國家圖書館 catalog | 部分受限（資料庫付費） | 萬曆刻本館藏地點最可能所在；UNRESOLVED |
| PSD-B09 | Internet Archive | 國際數位典藏 | 公開 | 中文古籍掃描存在（如 02092860.cn 等）；觀音靈課直接掃描 UNRESOLVED |
| PSD-B10 | HathiTrust | 國際數位典藏 | 部分受限 | 觀音靈課掃描 UNRESOLVED |
| PSD-B11 | Google Books《中國歷代觀音文獻集成》 | 商業書目 | 書目公開 | 卷6《觀音靈應圖經》書目頁已確認 |
| PSD-B12 | 博揚文化（籤詩研究專書出版） | 出版社 | 付費 | 《籤詩：臺灣民間信仰研究的新視野》等（Cultural Network 已記錄） |
| PSD-B13 | 文化部國家文化記憶庫 opendata（民俗宗教 datasetId=753，18,583 筆） | 開放資料集 | 公開 | 可程式化批次取用；籤詩文物檢索需進一步篩選 |

> Source table 的 `Access` 對應 JSON `access_status`；source record 的觀察狀態另以 JSON `source_observation_status` 記錄（`directly_observed`／`carried_forward`／`indirectly_supported`／`unresolved`）。這個欄位不是 edge evidence，也不使用 `confidence`。

---

## 4. 官方 Rights／Reuse 聲明（本輪一手驗證）

| 機構 | 頁面 | 聲明內容 | 狀態 |
|---|---|---|---|
| 國立故宮博物院 | digitalarchive.npm.gov.tw 首頁 | 書畫、器物、織品低階圖像約 41 萬幅以「公眾領域貢獻宣告」（CC0）開放，不須註明出處 | `platform_rights_status = directly_observed`（一手抓取頁面）；item license 未確認（古籍 item 不在已確認範圍） |
| 華藏淨宗學會 | fabo.hwadzan.com/Fabo/1555 | 法寶免費流通；需註冊帳號；庫存 38 | `source_observation_status = directly_observed`；對應現代流通 edge 為 `edge_level=VERIFIED`（一手抓取） |
| 其餘（龍山寺、行天宮、朝天宮、國圖、中研院、ctext、IA、HathiTrust、佛學數位圖書館等） | — | 均未在本輪逐頁確認 reuse 條款 | reuse terms 尚未確認（沿用 Cultural Network 的 Access ≠ License 紀律：access 開放不代表 license ok） |

---

## 5. MUST-TEST 執行狀態（2026-08-15 已執行）

| # | 項目 | 狀態 | 結果摘要 |
|---|---|---|---|
| 1 | 龍山寺 concrete item／第 100 籤直接驗證 | `absence_observed_item_unresolved`（官網無此 item） | 官網現行版無籤詩電子頁；舊路徑 eBooks/046.pdf 404 |
| 2 | 國圖館藏（rbook 查「觀音靈課」） | `query_incomplete`（需瀏覽器手動） | rbook 為 session 型系統，curl 走不完；aleweb OPAC 連線失敗 |
| 3 | 日本 NDL item | `query_result_observed_item_unresolved`（限定本輪 query） | 本輪以指定 NDL Search / Digital Collection query 未檢出公開數位 item（Search failure ≠ non-existence） |
| 4 | 中國國圖／萬曆刻本 | `holding_record_observed_original_unresolved` | 《南无大慈悲灵感观世音菩萨三十二课》DOC 004826983（縮微中心複製版） |

### 5.1 龍山寺 concrete item

2026-08-15 實抓：龍山寺官網現行 sitemap（237 URLs）無籤詩頁；舊記錄 `lungshan.org.tw/eBooks/046.pdf` 回 **HTTP 404**（下架或不存在）。結論：龍山寺官網現行版**無公開籤詩電子 item**；第 100 籤 concrete item 需現場籤詩簿翻拍或廟方授權取得。

### 5.2 國圖館藏

rbook.ncl.edu.tw 為 session 型系統（POST `/NCLSearch/Search/SearchResult/0` + `__RequestVerificationToken` + 302 redirect 鏈），curl 無法完成（411/302 循環）；aleweb.ncl.edu.tw OPAC 連線失敗（HTTP 000）。**需以瀏覽器手動檢索「觀音靈課／感應靈課」**。

### 5.3 日本 NDL item

NDL Search OpenSearch API（2026-08-15）一手查詢：
- 查「観音百籤」→ 4 筆書目：《観音百籤考》x2、《元三大師百籤 ; 観音百籤占決諺解》（近世文学資料類従 收錄）、《近世文学資料類従》
- 以 `dpid=dlndl` 限定デジタルコレクション → **0 筆**
- **本輪以指定 NDL Search / Digital Collection query 未檢出公開數位 item；0 result 不證明不存在公開數位版本（Search failure ≠ non-existence）**。
- 《元三大師百籤 ; 観音百籤占決諺解》影印本以紙本書目確認存在（館內閱覽）。

### 5.4 中國國圖／萬曆刻本

中國國圖 OPAC（opac.nlc.cn）檢索「观世音菩萨感应灵课」→ **唯一命中**：
- 書名《南无大慈悲灵感观世音菩萨三十二课》，DOC-NUMBER **004826983**（BASE NLC01）
- IMPRINT：全国图书馆文献缩微中心（縮微複製版；出版者與濮文起《中國歷代觀音文獻集成》同一機構脈絡）
- **注意**：此為複製版館藏記錄，**不等於**明萬曆 20 年刻本原件在國圖；原件館藏仍 UNRESOLVED。

> 結構化結果（含每項 `observation_status` 標記）見 sources.json 的 `must_test_results`。

---

## 6. 品質與驗證紀律

- 全部紀錄 verification date = 2026-08-15；`VERIFIED` 僅限 **primary / official direct evidence**（本輪直接抓取官方或一手頁面者）。
- **三組狀態不得混用**：`edge_level`（唯一使用 `VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED` 的 lineage claim 證據級別）／`source_observation_status`（source record 的觀察狀態）／`acquisition_status`（literature record 的取得層級）各自獨立；JSON 不再使用模糊的 `confidence`。
- `source_observation_status` enum：`directly_observed`／`carried_forward`／`indirectly_supported`／`unresolved`。
- `acquisition_status` enum：`fulltext_obtained`／`abstract_obtained`／`bibliographic_record_only`／`secondary_mention_only`／`not_obtained`。
- **Lineage edge 證據四級**：`verified_edges`（官方一手）／`probable_edges`（literature-supported，可靠文獻／二手一致但缺官方 concrete item）／`hypothesized_edges`（有動機無證據）／`unresolved_edges`（未取得一手證據）。不確定的 edge 不得因故事合理而升級。
- 二手全文網站（籤詩網、台灣好廟網）定位為**文本對照**與**線索**，不作授權來源，也不作為 VERIFIED 依據。
- **platform rights ≠ item license**：平台政策已驗證（如故宮 CC0）不代表具體古籍 item 已確認可 reuse。
- **Search failure ≠ non-existence**：negative finding 只證明本輪 query 未檢出。
- **本文件不含任何個人聯絡資料**；所有機構資訊均為公開官方管道。
- Access ≠ License：本輪驗證的只有故宮 CC0（platform 層）與華藏法寶流通制；其餘機構 reuse 條款全部未確認。
