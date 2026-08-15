# Draw One｜Oracle Corpus Mapping Exercise v0.1

> 產出日期：2026-08-15 ｜ 版本：v0.1（architecture normalization pass，2026-08-15）
> 目的：用 Guanyin（PSD v1.2.2）與 Guandi/Leiyushi（Study 02）兩套 research asset 挑 **representative records**，驗證 `Oracle-Database-Schema-v0.1` 真能承載已知 case。
> 紀律：**不重新研究**；若 schema 承載不了某 case → 修改 framework，不修改歷史。
> normalization pass 更新：evidence 一律 claim reference（entity 不內嵌 edge_level）；新增 Case D7（independence group）；origin 容許性驗證（§4）。
> 結果：**11 cases，全數 PASS；0 FAIL；3 個 schema 微調（§4）。**（修正：上一版標記「10 cases」有誤——實際 11；本輪新增 D7＝12 候選，G5 併入 G1 後為 11。）

---

## 1. Guanyin 側（Primary Source Dossier v1.2.2）

### Case G1｜官方流通頁即 item（item existence=VERIFIED；corpus identity 不由此自動 VERIFIED）

> 來源：PSD system_a verified_edges[0]。

```json
{
  "corpus_id": "guanyin_lingke_32",
  "display_name": "《觀世音菩薩感應靈課》三十二卦",
  "name_family": ["觀音靈課", "觀世音菩薩感應靈課"],
  "self_identification": null,
  "origin_deity": "觀世音菩薩",
  "numbering_system": "32卦（五枚卜錢）",
  "identity_claim_ids": ["cl-gy-lingke-identity"],
  "conflation_warning": "32卦靈課 ≠ 100首觀音籤，兩套操作/文本系統不得合併"
}
{
  "item_id": "itm-hwadzan-fabo1555",
  "family_id": "modern_huazang_xi",
  "source_record_id": "src-hwadzan",
  "independence_group_id": "ig-hwadzan-official",
  "media_type": "website",
  "access_status": "open_register",
  "license_status": "unsure",
  "platform_rights_status": "not_checked",
  "item_license_status": "unsure",
  "source_observation_status": "directly_observed",
  "verification_date": "2026-08-15"
}
{
  "claim_id": "cl-gy-lingke-identity",
  "target_type": "corpus",
  "target_id": "guanyin_lingke_32",
  "claim_type": "corpus_identity",
  "edge_level": "PROBABLE",
  "evidence_summary": "華藏官方頁的名稱與脈絡支持此 corpus label；但觀察到官方 item 本身，不等於已 VERIFIED corpus identity",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "status": "probable"
}
{
  "claim_id": "cl-gy-lingke-item-observed",
  "target_type": "item",
  "target_id": "itm-hwadzan-fabo1555",
  "claim_type": "item_existence",
  "edge_level": "VERIFIED",
  "evidence_summary": "華藏官方流通頁直接抓取（2026-08-15）：該官方 item 實際存在且可觀察",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "approval": {"approved_by": "human", "approved_at": "2026-08-15"},
  "status": "verified"
}
```

**承載：PASS** —— official item existence 的 VERIFIED 不再漂移成 corpus identity VERIFIED；corpus identity 保持 PROBABLE，且由 agent_review → human approval 的責任鏈只用於真正的 VERIFIED item claim。item 帶 source_record_id＋independence_group_id（provenance graph）；access=open_register 與 license=unsure 分離。**Conflation warning 承載（原獨立 Case G5 併入）**：`guanyin_lingke_32` 與 `guanyin_lingqian_100` 為兩個 corpus record、conflation_warning 互指——名稱相似不構成同一 corpus（名稱考紀律）。

### Case G2｜有 adoption 但無 concrete item（龍山寺，edge_level=PROBABLE）

> 來源：PSD system_b probable_edges[0]＋MT-1（官網現行版無籤詩電子 item）。

```json
{
  "adoption_id": "ad-longshan-guanyin100",
  "corpus_id": "guanyin_lingqian_100",
  "temple": "台北艋舺龍山寺",
  "deity": "觀世音菩薩",
  "region": "taiwan_north",
  "adoption_date_fact": null,
  "evidence_claim_ids": ["cl-longshan-adoption"],
  "source_ids": ["lit-xuehaowen-2007", "src-chance-guanyin100"]
}
{
  "claim_id": "cl-longshan-adoption",
  "target_type": "adoption",
  "target_id": "ad-longshan-guanyin100",
  "claim_type": "adoption",
  "edge_level": "PROBABLE",
  "evidence_summary": "literature-supported：薛皓文2007碩論以龍山寺版本為題＋籤詩網全集一致；MT-1 證官網無電子 item",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "status": "probable"
}
```

**承載：PASS** —— adoption（廟方使用）與 item（無電子籤）分離：adoption 可存在而 slip 無 attestation。**不會**因「龍山寺用觀音籤」就自動有 verified 文本。

### Case G3｜pilot slip 的 variant family（guanyin-003，4 probable）

> 來源：Oracle KB pilot——17 attestation 中多筆、variant_group（版本一/版本二家族＋003 家族內異文）、claims 全 probable。

```json
{
  "slip_id": "guanyin-003",
  "corpus_id": "guanyin_lingqian_100",
  "slip_number": 3
}
{
  "attestation_id": "att-gy-003-c1",
  "slip_id": "guanyin-003",
  "item_id": "itm-chance-guanyin100",
  "family_id": "gongban_mirror_xi",
  "source_text": "（逐字原文，pilot 已記錄）",
  "commentary_layers": [{"layer_name": "詩曰一", "text": "（逐字）"}, {"layer_name": "詩曰二", "text": "（逐字）"}],
  "text_status": "verbatim_confirmed"
}
{
  "variant_group_id": "vg-gy-003-1",
  "slip_id": "guanyin-003",
  "attestation_ids": ["att-gy-003-c1", "att-gy-003-c2", "att-gy-003-c3"],
  "relationship": "substantive_divergence",
  "divergence_description": "版本一/版本二家族分歧；003 家族內另有異文",
  "resolution_status": "none"
}
```

**承載：PASS** —— commentary_layers[] 承載「詩曰一/詩曰二」；variant_group 承載家族分歧；open divergence → slip 維持 probable。

### Case G4｜unresolved lineage edge（淺草寺 → 台灣）

> 來源：PSD system_b unresolved_edges[0]。

```json
{
  "claim_id": "cl-gy-asakusa-tw-lineage",
  "target_type": "corpus",
  "target_id": "guanyin_lingqian_100",
  "claim_type": "lineage",
  "edge_level": "UNRESOLVED",
  "evidence_summary": "『台灣觀音籤來自淺草寺』僅見二手轉述，未見一手證據；不得以實線表達",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "status": "unresolved"
}
```

**承載：PASS** —— UNRESOLVED edge 合法保存；lineage graph 畫不畫實線由 claim.edge_level 決定。


## 2. Guandi/Leiyushi 側（Oracle Corpus Study 02）

### Case D1｜corpus identity 與 self_identification（claim reference 版）

> 來源：Study 02 核心結論；normalization pass 後 origin_date_fact 純 fact＋origin_claim_ids。

```json
{
  "corpus_id": "leiyshi_100",
  "display_name": "雷雨師一百籤（關帝百籤）",
  "name_family": ["雷雨師一百籤", "關聖帝君一百籤", "關帝靈籤", "天仙雷雨師籤", "城隍籤", "關帝百首籤詩"],
  "self_identification": {"slip_number": 100, "text": "我本天仙雷雨師，吉凶禍福我先知", "note": "corpus 名稱的文本內自述"},
  "origin_tradition": "石固/嘉濟尊王信仰（贛州）",
  "origin_deity": "石固（護國嘉濟江東王）",
  "origin_place": "江西贛州聖濟廟",
  "origin_date_fact": "南宋寶慶年間(1225-1227)傅燁撰",
  "adoption_deities": [{"deity": "關聖帝君"}, {"deity": "城隍"}, {"deity": "福德正神（候選）"}, {"deity": "孔子/文昌（候選）"}],
  "numbering_system": "1-100",
  "identity_claim_ids": ["cl-ly-corpus-identity"],
  "origin_claim_ids": ["cl-ly-origin-shigu"],
  "conflation_warning": "「關帝籤」是 adoption 結果，非 textual origin；龍霄殿（東嶽廟）用觀音百籤 corpus，勿歸入本 corpus"
}
{
  "claim_id": "cl-ly-origin-shigu",
  "target_type": "corpus",
  "target_id": "leiyshi_100",
  "claim_type": "lineage",
  "edge_level": "PROBABLE",
  "evidence_summary": "literature-supported：道教文化中心資料庫/識典古籍/vocus/udn 一致；宋濂1371碑文佐證；無 direct item",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "status": "probable"
}
```

**承載：PASS** —— 名稱家族、self_identification、origin/adoption deity 分離；origin_date_fact 純 fact，證據級別由 origin_claim_ids 承載（edge_level=PROBABLE·literature-supported）。

### Case D2｜edition family 分層（道藏系 vs 光緒王錢系，claim reference 版）

> 來源：Study 02 full diff。

```json
{
  "family_id": "daozang_xi",
  "corpus_id": "leiyshi_100",
  "name": "道藏系（南宋造/明代收錄層）",
  "lineage_note": "《護國嘉濟江東王靈籤》收《正統道藏·正一部》；維基文庫轉錄為 mirror",
  "family_claim_ids": ["cl-ly-family-daozang"],
  "mirror_group": false
}
{
  "family_id": "wangqian_guangxu_xi",
  "corpus_id": "leiyshi_100",
  "name": "光緒王錢印本系（台灣現行本傳承層）",
  "family_claim_ids": ["cl-ly-family-wangqian"],
  "mirror_group": false
}
```

**承載：PASS** —— corpus 一個、family 兩個（corpus ≠ edition）；家族證據移入 claim（claim reference）。

### Case D3｜slip #50 的 substantive variant（多 attestation）

> 來源：Study 02 diff——#50 道藏「也須步步要周旋」vs 現行本「也須步多要周旋」。

```json
{
  "slip_id": "leiyshi-50",
  "corpus_id": "leiyshi_100",
  "slip_number": 50
}
{
  "attestation_id": "att-ly-50-dz",
  "slip_id": "leiyshi-50",
  "item_id": "itm-ws-daozang-mirror",
  "family_id": "daozang_xi",
  "source_text": "也須步步要周旋",
  "text_status": "verbatim_confirmed",
  "notes": "道藏系文本；對照現行本『步多』疑『步步』之訛"
}
{
  "variant_group_id": "vg-ly-50-1",
  "slip_id": "leiyshi-50",
  "attestation_ids": ["att-ly-50-dz", "att-ly-50-wq"],
  "relationship": "substantive_divergence",
  "divergence_description": "現行本『步多』疑為『步步』之訛；兩層皆保留",
  "resolution_status": "none"
}
```

**承載：PASS** —— 衝突完整保留；open divergence 阻擋 verified——不會把「步多」悄悄修成「步步」。

### Case D4｜行天宮 adoption（claim reference 版）

> 來源：Study 02 adoption map AD-01（官方一手）。

```json
{
  "adoption_id": "ad-ht-taipei-guandi",
  "corpus_id": "leiyshi_100",
  "temple": "財團法人台北行天宮",
  "deity": "關聖帝君（五聖恩主）",
  "region": "taiwan_north",
  "adoption_date_fact": null,
  "evidence_claim_ids": ["cl-ht-adoption"],
  "source_ids": ["GL-S01"]
}
{
  "claim_id": "cl-ht-adoption",
  "target_type": "adoption",
  "target_id": "ad-ht-taipei-guandi",
  "claim_type": "adoption",
  "edge_level": "VERIFIED",
  "evidence_summary": "行天宮官網下載區命名『關聖帝君一百籤』；jpg 208×800 官方一手抓取（2026-08-15）",
  "checked_by": "agent_review",
  "checked_at": "2026-08-15",
  "approval": {"approved_by": "human", "approved_at": "2026-08-15"},
  "status": "verified"
}
```

**承載：PASS** —— 證據移入 claim；全 framework 少數 VERIFIED 之一（primary/official direct evidence）。

### Case D5｜龍霄殿邊界案例（東嶽廟用觀音 corpus，claim reference 版）

> 來源：Study 02 §1.3。

```json
{
  "adoption_id": "ad-longxiaodian-dongyue",
  "corpus_id": "guanyin_lingqian_100",
  "temple": "高雄龍霄殿",
  "deity": "東嶽大帝",
  "region": "taiwan_south",
  "evidence_claim_ids": ["cl-longxiaodian-adoption"],
  "notes": "第100籤與台灣好廟網觀音百籤同文（單籤比對）；需多籤號驗證後定論"
}
```

**承載：PASS** —— 跨神 adoption：東嶽大帝為觀音百籤 corpus 的 adoption deity；corpus 不變、不「糾正」文化現象。

### Case D6｜reference edition 指定（顯示決策 ≠ 唯一真本）

> 來源：Study 02 結論。

```json
{
  "reference_id": "ref-leiyshi-100-v01",
  "corpus_id": "leiyshi_100",
  "family_id": "wangqian_guangxu_xi",
  "resolution_status": "display_only",
  "rationale": "台灣現行流通層（光緒王錢印本傳承），與 Draw One 使用者語境一致；道藏系保留為 lineage 節點",
  "decided_by": "drawone",
  "decided_at": "2026-08-15",
  "supersedes": null
}
```

**承載：PASS** —— family-level reference 可存在（`resolution_status=display_only`）；**production eligibility 必須 resolve 到 attestation → item**（`attestation.item_id == reference.item_id`，且 item license/access gate 通過）。

### Case D7｜independence group 機械判定（normalization pass 新 case）

> 來源：Study 02 sources（GL-S01 行天宮官方、GL-S02 維基文庫道藏 mirror、GL-S06 籤詩網、GL-S07 好廟網）——測試「不同 temple／不同網站」不自動獨立。

```json
{
  "group_id": "ig-ht-official",
  "rationale": "行天宮官方自製電子籤（唯一 master，無 mirror）",
  "master_item_id": "itm-ht-orgtw-jpg",
  "member_item_ids": ["itm-ht-orgtw-jpg"],
  "group_claim_ids": ["cl-ig-ht-official"]
}
{
  "group_id": "ig-mirror-chance-web",
  "rationale": "籤詩網雷雨師全集及其轉錄源頭（現行本 mirror 群）",
  "master_item_id": "itm-chance-ly100",
  "member_item_ids": ["itm-chance-ly100", "itm-temple01-ly100"],
  "group_claim_ids": ["cl-ig-mirror-chance-web"]
}
{
  "group_id": "ig-daozang-ws-mirror",
  "rationale": "維基文庫道藏本轉錄（源頭為正統道藏刻本；mirror_of 指向 master）",
  "master_item_id": null,
  "member_item_ids": ["itm-ws-daozang-mirror"],
  "group_claim_ids": ["cl-ig-daozang-ws-mirror"]
}
```

```json
[
  {"claim_id":"cl-ig-ht-official","target_type":"independence_group","target_id":"ig-ht-official","claim_type":"independence","edge_level":"PROBABLE","evidence_summary":"官方自製電子籤；未見 mirror link","checked_by":"agent_review","checked_at":"2026-08-15","status":"probable"},
  {"claim_id":"cl-ig-mirror-chance-web","target_type":"independence_group","target_id":"ig-mirror-chance-web","claim_type":"independence","edge_level":"PROBABLE","evidence_summary":"籤詩網與好廟網同現行本轉錄群","checked_by":"agent_review","checked_at":"2026-08-15","status":"probable"},
  {"claim_id":"cl-ig-daozang-ws-mirror","target_type":"independence_group","target_id":"ig-daozang-ws-mirror","claim_type":"independence","edge_level":"PROBABLE","evidence_summary":"維基文庫頁標示道藏本轉錄；源頭 item 未取得","checked_by":"agent_review","checked_at":"2026-08-15","status":"probable"}
]
```

**機械判定驗證**：

| 比較 | group 判斷 | 獨立？ |
|---|---|---|
| 籤詩網 vs 台灣好廟網（同現行本 mirror 群） | 同 `ig-mirror-chance-web` | ❌ 不獨立（正確：同一 edition family 的 mirror） |
| 籤詩網 vs 行天宮官方 | `ig-mirror-chance-web` ≠ `ig-ht-official` | ✅ 獨立 |
| 維基道藏 mirror vs 籤詩網 | `ig-daozang-ws-mirror` ≠ `ig-mirror-chance-web` | ✅ 獨立（道藏系 vs 現行系） |
| 兩個不同廟（若同印版） | 同 group（機械判定，不看 temple 名） | ❌ 不獨立 |

**承載：PASS** —— temple／網站名稱不再是獨立判準；`group_claim_ids` 先承載分群判定，verified 門檻再改為「≥2 個有 claim 支持的不同 independence_group」。同印版兩廟（如未來發現）自動落入同 group，不會誤判獨立。

---

## 3. 測試小結

| Case | Asset | 測了什麼 | 結果 |
|---|---|---|---|
| G1 | PSD | official item existence VERIFIED；不漂移成 corpus identity VERIFIED | PASS |
| G2 | PSD | adoption 存在但 item 不存在（PROBABLE） | PASS |
| G3 | pilot | slip + 多 attestation + commentary_layers + variant family | PASS |
| G4 | PSD | UNRESOLVED lineage edge 合法保存 | PASS |
| G1⊇ | PSD | 相似名稱雙 corpus + conflation_warning（併入 G1） | PASS |
| D1 | Study 02 | corpus identity / self_identification / origin≠adoption deity / claim ref | PASS |
| D2 | Study 02 | corpus ≠ edition（一 corpus 兩 family）＋claim ref | PASS |
| D3 | Study 02 | same number ≠ same text；open divergence 阻擋 verified | PASS |
| D4 | Study 02 | adoption VERIFIED（claim ref） | PASS |
| D5 | Study 02 | 跨神 adoption（東嶽廟用觀音 corpus） | PASS |
| **D7** | Study 02 | **independence group 機械判定（temple 非判準）** | **PASS** |
| D6 | Study 02 | reference 顯示決策 ≠ 唯一真本；family→attestation→item resolve | PASS |

**11 cases，0 FAIL**。

---

## 4. Mapping 過程中的 schema 微調（framework 修改，非歷史修改）

1. **claim reference 模式（normalization pass 主修改）**：corpus.identity_evidence／edition_family.family_evidence／temple_adoption.evidence／origin_date_fact.edge_level／adoption_date_fact.edge_level 全部移除內嵌狀態 → `*_claim_ids[]` 指向 claim。entity 只存 facts。所有既有 case 以 claim reference 重寫（G1/D1/D2/D4/D5）。
2. **independence_group 引入（Case D7 實測）**：concrete_item 必填 independence_group_id＋mirror_of；新增 independence_group entity（master_item_id 可 null——源頭未知合法）；每個 group 至少一個 `group_claim_ids`／`claim_type=independence`。verified 門檻同步改為「≥2 個有 claim 支持的不同 group」。
3. **origin_deity 容許性驗證（unknown stays unknown）**：corpus.origin_deity 改為可 null（不再必填）；origin_tradition／origin_place／origin_date_fact 同為可 null。若 origin 未解析：留空＋origin_claim_ids 指向 UNRESOLVED claim。**驗證**：schema 層已容許（JSON Schema required 移除 origin_deity）；若未來出現 origin 未知的 corpus（如某籤系來源僅傳說），可直接建模，無需放寬 schema。
4. **source_record.type 移除 literature**：literature 唯一 source-of-truth＝literature_record；source_record 只留 primary/secondary。既有 PSD literature（9 筆）未來 ingest 時直接進 literature_record，不重複建 source_record。

以上皆為 schema／framework 讓步，無任何研究結論變更。
