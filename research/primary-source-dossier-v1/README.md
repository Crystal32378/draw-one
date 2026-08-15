# Draw One｜Primary Source Acquisition Dossier v1

> **STATUS: FINAL / RESEARCH COMPLETE（2026-08-15 封存）**
> 觀音靈籤 100／《觀音靈課》相關版本與文獻 lineage 的公開來源研究資產。
> 本目錄只收錄**公開文化文獻與典藏來源**；不含任何個人聯絡資料；未聯絡任何個人或機構。

## 這個目錄回答什麼

- 觀音籤（100 首）與《觀世音菩薩感應靈課》（三十二卦）的版本 lineage——目前**必須分開建模**，不得合併。
- 每條 lineage edge 的證據級別：`VERIFIED`／`PROBABLE`／`HYPOTHESIZED`／`UNRESOLVED`，不確定的 edge 維持不知道，不得黏起來。
- 未來建立可信籤詩資料庫時，值得優先取得的公開來源在哪裡（`sources.json`）。

## 檔案

| 檔案 | 內容 |
|---|---|
| `dossier.md` | 主文件：lineage 樹（四級 edges）、文獻地圖、來源清單、rights 聲明、MUST-TEST 結果、驗證紀律 |
| `sources.json` | 結構化資料：22 個來源＋9 筆文獻＋四級 lineage edges＋MUST-TEST 結果（含 `must_test_results`） |
| `README.md` | 本說明 |

> CSV 版本留在本機／Claw Deck，刻意不進 repo（避免多套格式漂移）；raw PDF／scan 不進 repo；本機 local evidence 僅以 `local evidence available; not committed` ＋ checksum 標示。

## 核心結論（v1 封存）

1. **兩個文本系統必須分開**：現有證據強烈支持《觀世音菩薩感應靈課》三十二卦與觀音一百籤為兩套不同的操作／文本系統，目前不得合併；兩者是否存在更早的歷史關係，仍待考證。
2. **VERIFIED 語義（收斂後）**：僅限 primary / official direct evidence（本輪直接抓取官方或一手頁面確認）。學術研究／可靠文獻支持但無 direct item → `PROBABLE`（literature-supported／secondary-source-supported）。
3. **Lineage edge 四級**：`verified_edges`（官方一手）／`probable_edges`（literature-supported）／`hypothesized_edges`（有動機無證據）／`unresolved_edges`（未取得一手證據）。
4. 三組狀態不得混用：`edge_level` 只使用 `VERIFIED / PROBABLE / HYPOTHESIZED / UNRESOLVED`；source record 使用 `source_observation_status`；literature record 使用 `acquisition_status`。

## 關鍵語義紀律（沿用並擴充自 Cultural Network v1）

- **Access ≠ License**：`access_status` 只描述能否取得；`license_status` 只描述具體 material 能否 reuse。
- **platform rights ≠ item license**：平台政策已驗證（如故宮 CC0）不代表具體古籍 item 已確認可 reuse。
- **Search failure ≠ non-existence**：negative finding 只證明本輪 query 未檢出。
- 二手全文網站（籤詩網、台灣好廟網）定位為文本對照與線索，不作授權來源，也不作為 lineage `edge_level=VERIFIED` 依據。

### Structured status vocabulary（JSON contract）

| 對象 | 欄位 | 允許值 | 意義（不是 lineage evidence） |
|---|---|---|---|
| lineage edge | `edge_level`（以 `verified_edges`／`probable_edges`／`hypothesized_edges`／`unresolved_edges` 分組） | `VERIFIED` / `PROBABLE` / `HYPOTHESIZED` / `UNRESOLVED` | claim 的證據級別；只有這一層使用四級 evidence labels |
| source record | `source_observation_status` | `directly_observed` / `carried_forward` / `indirectly_supported` / `unresolved` | 本輪是否直接觀察到 source record；不代表來源內容或 lineage 已驗證 |
| literature record | `acquisition_status` | `fulltext_obtained` / `abstract_obtained` / `bibliographic_record_only` / `secondary_mention_only` / `not_obtained` | 文獻本身取得到的層級；不代表文獻支持的 claim 是 VERIFIED |

`access_status` 與 `license_status` 仍是獨立欄位；platform rights 也不等於 item license。`sources.json` 維持 22 個 source、9 筆 literature，不另造 `confidence` 欄位。

`platform_rights_status`（若有）記錄平台權利聲明的觀察結果；`must_test_results.items[].status` 與 `observation_status` 記錄查詢結果和觀察界線。這些都是操作／觀察欄位，不是 lineage evidence labels。

## 本輪一手驗證摘要（2026-08-15）

- 華藏淨宗 fabo.hwadzan.com/Fabo/1555：官方流通頁實抓（庫存 38、需註冊帳號、載靈巖山寺觀音洞籤書流通序全文）——lineage `edge_level=VERIFIED`（官方一手）
- 故宮 digitalarchive.npm.gov.tw：官方 CC0 公眾領域貢獻宣告（書畫／器物／織品低階圖像約 41 萬幅）——`platform_rights_status=directly_observed`；古籍 item license 仍未確認
- 高雄龍霄殿第 100 籤：與先前記錄的龍山寺相關文本存在差異，需 item-to-item 複驗後才能判定為跨廟版本分歧——lineage relation 仍未解決
- 日本 NDL：本輪以指定 query 未檢出公開數位 item（僅紙本書目）——**negative finding 限定本輪 query**
- 中國國圖：OPAC 命中《南无大慈悲灵感观世音菩萨三十二课》DOC 004826983（全国图书馆文献缩微中心複製版）——複製版館藏不等於萬曆刻本原件

## 更新方式

- 本包已封存（FINAL），不擴 research；新發現請另開新包，不要回頭擴 v1。
- 若要修正，維持四級 edges 語義與兩層級紀律；`VERIFIED` 只給官方一手證據。
- 與 Cultural Network v1（`research/cultural-network-v1/`）互補：那包回答「去哪找／找誰問」，本包回答「版本 lineage 與證據級別」。
