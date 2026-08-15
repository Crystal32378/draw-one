# Oracle Framework Stress Notes 03（v0.2 更新）

**Oracle Corpus Study 03｜媽祖籤 × 六十甲子籤｜Framework v0.1 壓力測試**

- 狀態：`STATUS: RESEARCH COMPLETE / FRAMEWORK v0.1 未修改`
- Framework baseline：main `6c91056c`（PR #9 後）
- 本輪壓力來源：Phase B 全量 60 籤 ingest（180 concrete items / 132 attestations / 60 slips）+ 三方 carrier 比對 + Phase C eligibility

---

## SN-03-01｜60-unit numbering 穩定（維持）

干支序 1–60（甲子…癸亥）在 北港/新港/好廟網 三方一致；北港官網 list 用字漂移（第6/18/30/42/54 籤作「戍」）為異體層，不影響 numbering identity。**維持 v0.1 判定：無需修改。**

## SN-03-02｜干支屬 corpus identity（維持）

干支是 corpus 結構的一部分（跨 carrier 一致），不是 edition 屬性。

## SN-03-03｜官方系 vs 網路系 edition 分層（新增，v0.2 核心觀察）

全量比對發現**系統性 edition 二分**：

| 變異點 | 官方籤板系（北港＋新港） | 網路轉錄系（好廟網/育德） |
|---|---|---|
| #1 清靜/清淨 | 靜 | 淨 |
| #10 爾/汝 | 爾 | 汝 |
| #30 妨/防 | 妨 | 防 |
| #45 結/相 | 結 | 相 |
| #60 內外/戶內 | 內外 | 戶內 |

edition_family 模型完整承載（ed-beigang/ed-xingang/ed-common-web 三個 family）；**不需要新結構**。此模式支持「實體籤板印刷源流 vs 網路轉錄 normalize 源流」的假說（籤詩網自述改常用同義字為旁證）。

## SN-03-04｜#60 內外/戶內：independence group 機械判定的實證（新增）

v0.1 時 #60 為 UNRESOLVED（無 ≥2 group 同文）。v0.2 新港官方加入後：「內外」獲 **2 個獨立官方 group**（ig-beigang-official＋ig-xingang-official）同文支持——達到 Framework 的 ≥2 不同 group 門檻。**independence group 機械判定（group_id 不同即獨立）在真實資料上驗證成功。** claim 仍為 PROBABLE（VERIFIED 需 human approval＋OCR 人工複核）。

## SN-03-05｜註釋層差異 ≫ 詩文層差異（維持並強化）

北港圖含：卦名（乾為天卦等，好廟網無）＋漁業聖意（討海/作塭/魚苗）＋廟公的話＋卦頭故事。好廟網含：故事（多版本，如 #1 好廟網三則 vs 北港一則「包文拯審張世真」）＋完整籤解。新港籤板：無註釋層（僅詩文＋署名）。三種 edition 的註釋層結構完全不同——commentary_layers[] 承載無礙。

## SN-03-06｜捐獻籤板照片＝新型 concrete item（新增）

新港官方籤詩圖是**信士捐獻籤板的照片**（含署名「信士邱福來 法號聖慧 謹獻」）。concrete item 的 media_type=photo 承載 OK；holder=廟方、provenance=官方發布——**官方發布的捐獻物照片**是有效的 primary item（廟方自有管道發布＝官方背書）。Framework 不需新增欄位。

## SN-03-07｜籤首/籤王附加結構（維持 v0.1 觀察）

籤詩網「61–64 首」、temples.tw「63 首」、mstn「拱天宮101首」（百籤＋籤王？）——附加籤結構仍為觀察點；本輪六十甲子籤主體 60 首不受影響。

## SN-03-08｜同一廟多籤系統（新增）

- 關渡宮：官方 self-label「線上60甲子籤」vs 籤詩網稱「澎湖一百籤」
- 白沙屯拱天宮：FB 記載**聖籤/藥籤兩個籤桶**

temple↔corpus 為 many-to-many；temple_adoption 結構可承載（每 adoption 一筆），不需修改。

## SN-03-09｜OCR 直書讀序問題（新增，非 schema 問題）

- 干支拆行（甲/戊）與字形誤讀（戌→戊、巳→己、酉→西、申→甲、孛→字）
- 新港籤板「首N」直書數字順序顛倒（首十六/首六十、首五四/首四五）

皆為 transcription 層問題；text_status=uncertain 機制正確標記，待人工複核。**Framework 不需修改。**

## SN-03-10｜Phase C eligibility gate 壓力（新增）

60 籤全量跑 canonical gate：0/60 eligible。Gate 阻擋分布集中於 **verified（需 human approval）** 與 **item_license（未見授權聲明）**——兩者都是「人/政策」層閘門，不是資料模型缺陷。reference_resolved_to_item（60/60）與 access（60/60）全過，證明 **provenance graph 在 180 item 規模下運作正常**。

## SN-03-11｜名稱 conflation 的資料層處理（新增）

「媽祖籤」指涉 ≥2 套 corpus（六十甲子籤＋澎湖一百籤）＋各地 edition。corpus.conflation_warning 欄位承載此警告；name_family 列表同時收錄 conflation 俗名。**維持 v0.1 判定。**

## SN-03-12｜比較分類器（char-count 啟發式）的語義盲點（已修正 2026-08-16）

全量比對用「差異字數 ≤2 ＝ orthographic_only」啟發式分類，產生兩類誤判：
- **#60 內外/戶內**：1 字差但語義實質（內外＝全屋內外，戶內＝僅家戶內）→ 原被判 orthographic_only
- **#41 寔難推/實難推**：寔＝實之古字，語義相同 → 被判 substantive，實為 orthographic 級

**修正（re-gate 後）**：#60 已在 classify() 特判為 substantive_divergence，vg resolution_status=reference_designated（北港＋新港 2 獨立官方 primary 指定「內外」為 reference，mirror「戶內」substantive attestation 保留）；Phase C 只阻擋未 designated 的 open divergence。結論：char-count 是 proxy，**定版前仍需人類逐條判定**（已列入 reviewer must verify）。Framework 不需修改（divergence 保留 + reference_designated 機制足以承載）。

---

## 總結

**Framework v0.1 在 60 籤全量、180 items、180 attestations、三方 carrier、Phase C eligibility 的壓力下無需任何修改。** 所有新觀察（官方系/網路系 edition 分層、捐獻籤板照片、多籤系統、OCR 讀序問題）皆由既有結構承載。independence group 機械判定在 #60 案例上獲得正面驗證。
