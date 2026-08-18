# Guanyin Corpus — HTML Entity Cleanup Report

**Date:** 2026-08-18
**Operation:** lossless HTML numeric character reference decode（`&#xxxx;` → 對應字元）
**Scope:** 三套 source corpus（觀音 100 / 關帝 100 / 六十甲子 60）

## 結果摘要

| Corpus | 掃到 entity | 已修 | unresolved |
|---|---|---|---|
| 觀音（guanyin） | **17 處**（16 poem_text + 1 comparison_witness） | 17 | 1（#70 覔/覓） |
| 關帝（guandi） | 0 | — | — |
| 六十甲子（liushijiazi） | 0 | — | — |

> Fable 報的 `decoded_char_refs: 16` 是 poem_text 的 16 處；本次另發現 `#54.comparison_witness` 的 1 處 `&#24183;`，合計 17 處。

## 修正明細（17 處，全部 lossless decode，零 canonicalization）

| 籤 | 欄位 | before | after | codepoint | 核對 |
|---|---|---|---|---|---|
| #10 | poem_text | `&#35220;` | 覔 | U+8994 | OCR 原文即「覔」 |
| #14 | poem_text | `&#21364;` | 却 | U+5374 | OCR 原文即「却」 |
| #14 | poem_text | `&#30861;` | 碍 | U+788D | OCR 原文即「碍」 |
| #21 | poem_text | `&#21494;` | 叶 | U+53F6 | OCR 原文即「叶」 |
| #22 | poem_text | `&#33747;` | 菓 | U+83D3 | OCR 原文即「菓」 |
| #24 | poem_text | `&#34100;` | 蔴 | U+8534 | LOSSLESS（OCR 誤讀「蘇」） |
| #35 | poem_text | `&#30861;` | 碍 | U+788D | OCR 原文即「碍」 |
| #48 | poem_text | `&#40318;` | 鵾 | U+9D7E | LOSSLESS（OCR 誤讀「鶌」） |
| #54 | poem_text | `&#24183;` | 幷 | U+5E77 | OCR 讀「并」，原文異體「幷」 |
| #54 | comparison_witness | `&#24183;` | 幷 | U+5E77 | 同上（witness 欄位） |
| #60 | poem_text | `&#28895;` | 烟 | U+70DF | OCR 原文即「烟」 |
| #70 | poem_text | `&#35220;` | 覔 | U+8994 | **UNRESOLVED**（OCR 讀「覓」） |
| #74 | poem_text | `&#30861;` | 碍 | U+788D | OCR 原文即「碍」 |
| #81 | poem_text | `&#30528;` | 着 | U+7740 | OCR 原文即「着」 |
| #95 | poem_text | `&#39722;` | 鬪 | U+9B2A | LOSSLESS（OCR 誤讀「事」） |
| #97 | poem_text | `&#30094;` | 疎 | U+758E | OCR 原文即「疎」 |
| #99 | poem_text | `&#30528;` | 着 | U+7740 | OCR 原文即「着」 |

**解碼原則：** 每個 entity 僅做 code point 解碼（`chr(int(code))`），異體／簡化字形原樣保留。未做簡繁轉換、異體字統一、常用字替換、文句校正。

## Integrity 驗證

- ✅ counts 100 / 100 / 60 不變
- ✅ 籤號 1–100 無缺漏、無重複
- ✅ transcription_status（VERIFIED / PROBABLE）逐籤不變（**VERIFIED 未降級**）
- ✅ provenance 未動（僅 poem_text / comparison_witness 的 entity 被解碼）
- ✅ JSON / CSV 殘留 entity = 0

## 交回 Fable 需確認

1. **build decode counts 應歸零**：source 修乾淨後，`data_quality.decoded_char_refs` 應從 16 → 0。若 build 仍回報 >0，代表 build layer 讀的是舊版 source，需重新拉取。
2. **comparison_witness 的 entity**：Fable 的 build 只 decode 了 poem_text（16），本次連 `#54.comparison_witness` 的 `&#24183;` 也一併清掉。若 build 有掃 comparison_witness，count 應從 17 → 0。

## Unresolved（1 處）

- **#70「覔／覓」**：entity 為 `&#35220;`（覔，U+8994，異體），但整頁 OCR 讀出「覓」（U+89BF，正體）。兩字上从「不」vs「爫」，字形差異需人工核對薛皓文 2008 附錄二 p145 原圖才能定案。現按 lossless decode 保留「覔」，待人工複核。
