# Oracle Knowledge Base v1（data/oracle-knowledge-base/）

證據優先的 Draw One oracle 知識庫。這裡是 admin/trust 層，frontend 不讀、也不顯示 provenance。

**最高原則：No canonicalization without source evidence.**
不知道就標不知道；版本衝突就保留衝突；不得用語言流暢度補齊文化事實；不得因為資料看起來像籤詩就視為傳統來源。

## v1 誠實聲明（2026-08-15 起）

- 本知識庫以 **觀音靈籤（觀音一百籤）** 為第一個 canonical corpus（2026-08-15 Crystal 批准）。
- Pilot（guanyin-003..006）已完成第一輪來源查證：4 籤全部為 **probable**（≥2 個獨立網站來源一致、但尚無一手印刷/掃描來源確認）。**沒有 verified、沒有 draw pool 內容**——這是誠實的現狀，不是失敗。
- 舊 GitHub 資料（`data/imports/`、MVP seed）是 **evidence / legacy candidate**，不是來源；要進 production 必須有真實 attestation。
- license 未確認的 raw scan / photo 不進 public repo：僅本地保留 evidence，本檔只記錄 checksum + metadata。

## 內容

| 檔案 | 內容 |
|---|---|
| `sets.jsonl` | 籤系（guanyin_lingqian_100） |
| `sources.jsonl` | 來源實體（5 筆：籤詩網、農曆網、周易網、高雄龍霄殿、淺草一百籤 PDF-local） |
| `slips.jsonl` | 籤位（guanyin-003..006，含 legacy_entry_id 標記） |
| `attestations.jsonl` | 證詞（17 筆，逐字原文） |
| `variant_groups.jsonl` | 異文群組（5 筆：每籤的版本一/版本二家族 + 003 家族內異文） |
| `claims.jsonl` | 證據聲明（20 筆：text_authenticity / fortune / numbering / legacy 交叉比對 / 典故） |
| `interpretations.jsonl` | Draw One 詮釋層（**本輪刻意留空**——詮釋須在來源審查後以 Draw One 自己的語氣重寫，不屬 pilot 範圍） |
| `reference_editions.jsonl` | 顯示基準指定（**本輪刻意留空**——目前無 verified + license=ok 的來源可指定） |
| `draw-pool.preview.json` | 由 validator `--emit` 產生；目前為空（無 verified）；僅供 admin 預覽，**未接 frontend** |

## 如何跑 audit

```bash
node scripts/validate-kb.mjs          # 驗證 + 狀態報告
node scripts/validate-kb.mjs --emit   # 另外輸出 draw-pool.preview.json
```

任何 validation error → exit 1、不寫任何輸出。狀態（verified / probable / unresolved / quarantine / no_evidence）由 script 依規則推導，不手填；agent 只能 downgrade，不能 upgrade。

## v1 evidence policy

- **verified**：≥2 獨立來源（不同 edition family 或宮廟/出版）逐字一致，且 ≥1 一手來源（印刷本/宮廟手冊/掃描/照片）；人工逐字確認；編號無歧義。且 license=ok 才可進 draw pool。
- **probable**：單一一手來源已逐字確認未交叉驗證；或最大同文家族由 ≥2 個不同來源一致證實（本輪 4 籤即此）。
- **unresolved / quarantine / no_evidence**：見 `DATA_DICTIONARY.md`。

> 註：≥2 獨立來源門檻是 **v1 evidence policy**，不是永久歷史學真理；修訂須改 spec 並記錄，不能靜默放寬。

## 來源現況（2026-08-15）

| source | 類型 | license | 角色 |
|---|---|---|---|
| 籤詩網·觀音一百籤（chance.org.tw） | 網站（研究站） | unsure | 二手；詩曰一/詩曰二 雙版本＋典故，provenance 紀律佳 |
| 農曆網·觀音靈簽（nongli.com） | 網站 | unsure | 二手；版本一/版本二 雙版本（第4籤頁抽取失敗待補） |
| 周易網·觀音靈簽（m.zhouyi.cc） | 網站 | unsure | 二手；單版本（版本二家族）佐證 |
| 高雄龍霄殿（東嶽廟）官網 | 廟方網站 | unsure | 二手；跨廟宇文本流傳（版本一家族內異文） |
| 淺草觀音一百籤 PDF（2011 重譯） | PDF（local evidence only） | unsure | 一手來源候選／跨國 evidence candidate（文字未抽取、文本關係未驗證）；**不進 repo**，checksum c589742c… |

**下一步（MUST-TEST）**：龍山寺籤詩簿（實體）／觀音靈課古本掃描（一手）；華藏淨宗學會《觀世音菩薩感應靈課》線上書文字層抽取；淺草 PDF 文字抽取與 003–006 交叉比對（抽取前不判定文本關係）；各來源 license 查證。
