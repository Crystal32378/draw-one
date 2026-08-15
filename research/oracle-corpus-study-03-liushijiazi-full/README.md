# Oracle Corpus Study 03｜Liushijiazi Full Corpus（Phase B/C）— 自包含包

**狀態**：`RESEARCH COMPLETE（Phase A/B/C）/ NOT MERGED / NOT IN REPO / Framework v0.1 未修改`
**日期**：2026-08-15｜**Baseline**：draw-one main `6c91056c`（PR #9 後）

## 這包是什麼

六十甲子籤（媽祖籤系統之一）的 corpus identity 驗證（Phase A）、全量 60 籤取得與比對（Phase B）、production eligibility 評估（Phase C）。延續已封版的 Oracle Corpus Study 03 v0.1（該包未動）。

## 內容

| 檔案 | 說明 |
|---|---|
| `Mazu-Oracle-Corpus-Identity-Dossier-v0.1.md` | 主文件（v0.2 內容）：結論、RQ1-5、Phase C、What I know/assume/did not test |
| `Mazu-Oracle-Temple-Adoption-Map-v0.1.json` | 14 筆廟宇 adoption map（含 v0.2 新證據） |
| `Liushijiazi-Source-Map-v0.1.json` | 22 筆來源取得地圖 |
| `Liushijiazi-Corpus-Comparison-v0.1.json` | 60 籤 × 3 carriers 全量比對 |
| `Oracle-Framework-Stress-Notes-03.md` | Framework v0.1 壓力測試（11 條） |
| `Production-Eligibility-Report-v0.1.json` | Phase C gate 逐籤矩陣 |
| `data/*.jsonl` | Canonical ingest（10 entities：corpus 1 / edition_family 3 / source_record 3 / independence_group 3 / concrete_item 180 / slip 60 / attestation 180 / variant_group 60 / temple_adoption 2 / claim 70） |
| `Oracle-Database-Schema-v0.1.json` | Schema 副本（validator 用，自包含） |
| `validate_full60.py` | Validator（`python3 validate_full60.py`；含 reference_edition chain trace） |
| `semantic_regression.py` | Semantic regression tests（`python3 semantic_regression.py`；re-gate 後新增） |
| `generate_ingest.py` | 產生器（需 `.openclaw/tmp/study03/` 原始資料，見下） |
| `Liushijiazi-Full-Corpus-Report.html` | 成果報告 HTML（可直接開啟） |

## 如何重跑驗證

```bash
# 1. validator（需要 jsonschema 套件）
pip3 install jsonschema   # 若未安裝
python3 validate_full60.py
# 預期：PASS / 0 FAIL（計數 60 slips / 180 attestations / 180 items）

# 2. eligibility
python3 eligibility_report.py
```

## 資料來源（一手）

- **北港朝天宮官方**：`https://www.matsu.org.tw/?act=menuinfo&ml_id=20240116002&cmd=list`（60 籤圖檔；59 張 2024-08-05 批次＋第59籤 2025-06-21 批次）
- **新港奉天宮官方**：`https://www.hsinkangmazu.org.tw/?act=menuinfo&ml_id=20231222005&cmd=list`（60 首捐獻籤板照片＋解析文字；圖檔需 Referer）
- **好廟網 fs60**（comparison carrier，不升格 primary）：`https://qiangua.temple01.com/qianshi.php?t=fs60`

原始下載與 OCR 產物在 workspace `.openclaw/tmp/study03/`（本包不含 180 張圖檔與 OCR 中間檔；concrete_item 有 sha256 可對照）。

## 主要結論

1. 「媽祖籤」＝conflation 名稱（六十甲子籤 60 ＋ 澎湖一百籤 100，兩套互不相屬）
2. 六十甲子籤＝單一 textual corpus（60-vs-60 全量比對；corpus identity claim PROBABLE，awaiting human approval）
3. **官方籤板系（北港＋新港）vs 網路轉錄系（好廟網/育德）** edition 二分（靜/淨、爾/汝、妨/防、結/相、內外/戶內）；新港 44/60 與北港逐字 identical
4. **全量比對**：36 identical / 17 orthographic_only / 7 substantive / 0 unresolved（#7 #38 #41 #46 #48 #57＋#60）；#60 內外/戶內 依 SN-03-12 特判 substantive_divergence 且 **reference_designated**（北港＋新港 2 獨立官方 primary 指定「內外」為 reference，mirror「戶內」保留）——Phase C 只阻擋未 designated 的 open divergence
5. **8 首 human-observed**：#7 #19 #38 #41 #46 #48 #57 #60——Crystal 目視官方圖檔確認 observed transcription（attestation verbatim_confirmed）；依 canonical，claim VERIFIED＝**#19＋#60**（#19 無 open divergence；#60 北港＋新港 2 獨立官方 group 同文「內外」、鏈路完整），其餘 6 首因 open substantive divergence 維持 PROBABLE；#19 第 1 句目視修正 OCR 誤讀（注→註）
6. **Phase C：0/60 production-eligible**（item_license unresolved 擋全部；#19/#60 其餘 gate 全過，僅剩 license）；reference gate 為真 chain 驗證（reference_edition → attestation → item，60/60）；divergence gate 只阻擋未 designated 的 open divergence；60/60 皆 Research DB records
7. **Validator：2204 PASS / 0 FAIL**（60 slips / 180 attestations / 180 items / 60 reference_edition）
8. **Semantic regression：211 PASS / 0 FAIL**（re-gate 後新增：divergence 不得 VERIFIED、reference chain、2-group 宣稱↔source_ids 一致性、reference_designated 等）

## 未完成／待人類決策

- 6 首 substantive 異文（#7 #38 #41 #46 #48 #57）定版決策（官方讀字已目視確認，待 merge/保留決策）；其餘 52 籤 OCR 抽複核
- item license 確認（廟方授權聲明）或取得替代授權載體
- VERIFIED 升等（human/domain_expert approval）
- 好廟網/籤詩網同源機械判定；澎湖一百籤其餘 99 首；鹿港 JS；關渡宮死鏈復查
