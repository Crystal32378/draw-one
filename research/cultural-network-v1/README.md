# Draw One — Cultural Source & Expert Network v1

Draw One 的**正式 research infrastructure**（長期研究資產），不是暫存研究。

本目錄回答兩個問題：

- **A. Source Acquisition Map**（`sources.json`）：未來建立可信籤詩資料庫時，值得優先取得的來源在哪裡——宮廟官方籤詩簿、古籍／數位典藏、研究機構、出版社／權利人、跨國數位典藏。**不含籤詩內容**，只有來源身分與取得路線。
- **B. Expert / Reviewer Network**（`experts.json`）：可以請教或合作的華語宗教／民俗／宮廟文化研究者與機構名錄（台灣優先，擴及中國、香港、日本、東南亞）。

產出日期：2026-08-15 ｜ 目前規模：38 來源 / 51 專家（個人＋機構）

## 檔案

| 檔案 | 內容 | 格式 |
|---|---|---|
| `sources.json` | Canonical source map（38 筆） | JSON |
| `experts.json` | Canonical expert network（51 筆） | JSON |
| `summary.md` | 人類可讀摘要（分類表、A 級清單、未決事項） | Markdown |
| `README.md` | 本檔：用途、schema、更新方式、Access ≠ License | Markdown |

> CSV 是**本機／Claw Deck 用**的檢視格式，刻意不進 repo——避免多套格式漂移。repo 內以 JSON 為單一 canonical 來源。

## Schema

### sources.json（每筆記錄）

| 欄位 | 型態 | 說明 |
|---|---|---|
| `id` | string | 唯一 ID，格式 `SRC-xxx` |
| `category` | string | 分類：`temple_official` / `digitized_archive` / `academic` / `publisher` / `cultural_unit` / `international` / `public_domain_text` / `website_secondary` |
| `name` | string | 來源名稱 |
| `holder` | string | 持有人／權利人 |
| `location` | string | 所在地 |
| `url` | string | 來源 URL |
| `edition` | string | 版本／收錄內容 |
| `acquisition` | string | 取得方式 |
| `access_status` | enum | **能不能取得**：`open` / `restricted` / `paid` / `unknown` |
| `license_status` | enum | **能不能 reuse**：`ok` / `unsure` / `no` |
| `reuse_notes` | string | reuse 條款說明與 MUST-TEST 事項 |
| `priority` | enum | 優先級：`A` / `B` / `C` |
| `confidence` | enum | 查證信度：`verified` / `probable` / `unresolved` |
| `verification_date` | date | 查證日期 |
| `why` | string | 為什麼對 Draw One 重要 |
| `source_url` | string | 佐證來源 URL（provenance） |

### experts.json（每筆記錄）

| 欄位 | 型態 | 說明 |
|---|---|---|
| `id` | string | 唯一 ID，格式 `EXP-xxx` |
| `name` | string | 姓名／機構名 |
| `institution` | string | 服務單位 |
| `field` | string | 領域 |
| `why` | string | 為何與籤詩研究相關 |
| `contact` | string | 公開聯絡管道 |
| `work` | string | 代表作 |
| `url` | string | 佐證 URL |
| `verification_date` | date | 查證日期 |
| `confidence` | enum | `verified` / `probable` / `unresolved` |
| `priority` | enum | `A` / `B` / `C` |
| `region` | enum | `taiwan` / `china` / `hk-mo` / `sea` / `japan` / `global` |

## Access ≠ License（重要語義）

`license_status` **只**描述「具體 material 能否 reuse」。平台免費瀏覽／下載，**不得**據以標 `ok`。

- `access_status` = 能不能取得（open / restricted / paid / unknown）
- `license_status` = 能不能 reuse（ok / unsure / no）

兩者是正交的：一個來源可以 `access=open` 但 `license=unsure`（例如 Internet Archive：免費下載，但 public domain 判定是 item 層級，未逐 item 確認）。

2026-08-15 曾把 6 筆原先誤標 `ok` 的來源（瀚典、ctext、台大佛學數位圖書館、Internet Archive、HathiTrust、中國民俗學網）全數降為 `unsure`——原因都是「只確認 access、未確認具體 material 的 reuse 條款」。

**目前 38 筆 license 全為 `unsure`**：沒有任何一筆的 reuse 條款已被一手驗證。要升級為 `ok` 必須實際讀到一手授權條款（見各筆 `reuse_notes` 的 MUST-TEST）。

## 更新方式

1. 新增記錄：沿用既有欄位結構；`id` 依序（`SRC-xxx`／`EXP-xxx`）；`confidence` 三態；每筆必填 `source_url` 佐證。
2. 改版流程：直接更新本目錄 JSON（canonical），`count` 同步更新；CSV 若需同步，只在本機／Claw Deck 重產，**不進 repo**。
3. 語義變更（如 Access ≠ License 這類）必須同步更新本 README 的語義章節與受影響記錄，不要只改新文件、留舊文件誤導下一個接手者。
4. 每批更新後在 commit message 標注版本與變更類別（新增來源／新增專家／semantics cleanup 等）。

## 驗證紀律

- `verified` = 實際搜尋／檢視過來源頁；`probable` = 僅見轉述或無法複驗；`unresolved` = 未確認項目（明確標示，不當成事實）。
- 本資產建立過程：無聯絡任何人、無購買、無付費資料庫登入。
- 下一批未決事項見 `summary.md` 末段（License 實測、古籍掃描驗證、研究文獻試讀、專家名錄微調、連接 Oracle KB）。
