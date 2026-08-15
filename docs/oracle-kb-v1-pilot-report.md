# Draw One Oracle KB v1 — Pilot 報告（guanyin-003..006）

**Date:** 2026-08-15 · **Status:** PILOT COMPLETED · BRANCH REVIEW（4 probable / 0 verified / 0 draw pool；三項語義修正已套用）· **Branch:** `autoclaw/oracle-kb-v1`（未 merge）

## 結論一句話

4 籤的傳統文本已由 ≥2 個獨立網站來源交叉證實，且證實了**每籤存在兩個文本家族**（版本一/詩曰一 vs 版本二/詩曰二）；但全部來源都是二手網站、無一手印刷/掃描來源，依 v1 evidence policy 誠實停在 **probable**——沒有為了讓 pilot「好看」去灌 verified。

## 做了什麼

1. KB 骨架：`data/oracle-knowledge-base/`（8 entity JSONL + README + DATA_DICTIONARY）
2. `scripts/validate-kb.mjs`：零依賴 validator（schema/參照完整性/分歧偵測/狀態推導/quarantine 強制/license gate/--emit）
3. Source strategy v1（一手來源候選 + license 查證計畫）
4. Pilot 來源查證（5 個來源、17 條逐字 attestation）

## 來源網絡

| source | 類型 | license | 提供內容 |
|---|---|---|---|
| 籤詩網·觀音一百籤（chance.org.tw） | 研究網站 | unsure | 詩曰一/詩曰二雙版本、詩意/解曰/聖意、典故（自標「與籤詩不合」） |
| 農曆網·觀音靈簽（nongli.com） | 網站 | unsure | 版本一/版本二、吉凶、宮位（第4籤頁抽取失敗待補） |
| 周易網·觀音靈簽（m.zhouyi.cc） | 網站 | unsure | 單版本（版本二家族）佐證 |
| 高雄龍霄殿（東嶽廟）官網 | 廟方網站 | unsure | 版本一家族內異文（成壘後/壘壞）＋解曰「到底無成」 |
| 淺草觀音一百籤 PDF（2011 重譯） | local evidence | unsure | 一手來源候選／跨國 evidence candidate（文字未抽取、文本關係未驗證）；已存本機（sha256 c589742c…），不進 repo |

## 每籤狀態與文本家族

| slip | 版本一（詩曰一）首句 | 版本二（詩曰二）首句 | 吉凶 | 狀態 |
|---|---|---|---|---|
| guanyin-003 燕子銜泥 | 衝風冒雨去還歸…呈疊後 | 臨風冒雨去還鄉…作壘 | 下籤·子宮 | probable |
| guanyin-004 破鏡重圓 | 菱花鏡破復重圓…與兒孫 | 千年古鏡復重圓…在兒孫 | 上籤·子宮 | probable |
| guanyin-005 掘地求泉 | 一鋤掘地要求泉…得最先 | 一錐草地要求泉…得最難 | 中籤·丑宮 | probable |
| guanyin-006 投岩銅鳥 | 投身巖下飼於菟…此人無 | 投身岩下鵰鳥居…天地此人無 | 中籤·丑宮 | probable |

- 每籤的兩個文本家族各自有 ≥2 獨立網站一致證實 → **probable**（v1 policy：無一手來源不得 verified）。
- 003 額外發現東嶽廟家族內異文（銜得泥來成壘後/到頭壘壞復成泥 vs 呈疊後/疊壞），與解曰差異（到底無成 vs 到底勞心）——已記錄為 substantive_divergence variant group（含語義差異，非僅字形）。
- **legacy 交叉比對（重要）**：舊 9 seed 中 guanyin-003..006 的 MVP 文字全部與「版本一家族」正規化一致 → 這 4 條與現存二手來源中的版本一家族相符，獲 secondary-source corroboration；此為 corroboration 而非 authenticity 確認，legacy 本身仍不是來源，進 production 仍需 attestation。（對比：舊 MVP 的 yuelao/guangong 現代條目並無此對應。）

## 驗證結果

- `node scripts/validate-kb.mjs` → exit 0：4 probable、0 verified、0 quarantine、draw pool 0。
- 負向測試：假造 verified claim 被結構性擋下（缺一手來源 + open substantive divergence 兩道錯誤）。
- `--emit` 輸出 `draw-pool.preview.json`（目前空——正確）。
- 尚無一手來源：verified 升級路徑 = 龍山寺籤詩簿／觀音靈課古本掃描／淺草 PDF 文字抽取。

## 下一步（MUST-TEST，等 Crystal 指示）

1. 一手來源：龍山寺籤詩簿（實體）、華藏淨宗學會《觀音籤·感應靈課》線上書文字層、淺草 PDF 文字抽取
2. license 查證：上述一手候選 + 4 個網站來源
3. nongli 第4籤重試、東嶽廟第4–6籤頁 ad_id
4. #007 缺號對照實體籤詩簿
5. 全部完成後：reference edition 指定 → verified 升級 → draw pool 才有內容

## Handoff 四項清單

- **What I know**：4 籤雙家族文本各有 ≥2 獨立網站證實（逐字比對紀錄在 attestations/claims）；legacy 4 條屬版本一家族；validator 通過 + 負向測試通過；東嶽廟為跨廟宇文本流傳證據；淺草僅為跨國 evidence candidate（文字未抽取，文本關係未驗證）。
- **What I assume**：淺草系或採版本二家族（未驗證，PDF 未抽取）；chance 與 nongli 可能同源於公版籤譜（故 verified 獨立性門檻未達——保守處理）；網站 license 大概率維持 unsure。
- **What I did not test**：無一手來源（未升級 verified 的原因）；nongli 第4籤、東嶽廟 4–6 籤、淺草 PDF 文字；#007 缺號。
- **What the next reviewer must verify**：一手來源取得與 license；版本二家族是否與淺草系一致；004 版本一是否另有獨立來源；KB schema 對日後六十甲子籤跨宮廟分歧的承載力。