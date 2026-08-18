# Guanyin Corpus — Source Encoding Cleanup Report

**Date:** 2026-08-18
**Operation:** (1) lossless HTML numeric char-ref decode + (2) source textual repair（mojibake 還原）
**Scope:** 三套 source corpus（觀音 100 / 關帝 100 / 六十甲子 60）

## 結果摘要

| 項目 | 觀音 | 關帝 | 六十甲子 |
|---|---|---|---|
| HTML entity | 17 處（已修） | 0 | 0 |
| mojibake（U+FFFD） | 2 處（已修） | 0 | 0 |
| 可疑 ASCII（poem_text） | 2 字元（已修，屬 mojibake 一部分） | 0 | 0 |
| control / invalid chars | 0 | 0 | 0 |
| **最終殘留（entity / U+FFFD / ASCII / control）** | **全 0** | 全 0 | 全 0 |

## Part 1 — HTML entity lossless decode（17 處）

`&#xxxx;` → 對應 code point 字元，零 canonicalization。明細見 `entity-cleanup-audit.json` 的 `entries`。

解碼出的 12 個字（異體／簡化字形，原樣保留）：覔、却、碍、叶、菓、蔴、幷、烟、着、鬪、疎、鵾。

## Part 2 — Source textual repair（mojibake，2 處）

> 此兩處是 **source textual repair**，不是 lossless HTML entity decode，單獨標記。

| 籤 | before | after | 核對依據 |
|---|---|---|---|
| #18 | 日夜循環�琤j今 | 日夜循環**亘**古今 | 整頁 OCR（附錄二 p171）讀出「日夜循環亘古今」（亘 U+4E98）。原「�琤j」= U+FFFD + 琤(U+7424) + j(U+006A) 三字元，屬 UTF-8 解碼錯誤殘留，非原文差異 |
| #72 | 暗�堬`藏荊棘林 | 暗**裏深**藏荊棘林 | 整頁 OCR（附錄二 p144）讀出「暗裏深藏荊棘林」（裏 U+88CF）。原「�堬`」= U+FFFD + 堬(U+582C) + backtick(U+0060) 三字元，屬 UTF-8 解碼錯誤殘留，非原文差異 |

## Integrity 驗證

- ✅ counts 100 / 100 / 60 不變
- ✅ 籤號 1–100 無缺漏、無重複
- ✅ transcription_status（VERIFIED / PROBABLE）逐籤不變（**VERIFIED 未降級**）
- ✅ provenance 未動
- ✅ 三套 corpus 最終：U+FFFD = 0、HTML entity = 0、可疑 ASCII = 0、control char = 0

## 交回 Fable 需確認

1. build `decoded_char_refs` 應 16 → 0（source 已無 entity）。
2. 若 build 有 mojibake / U+FFFD 檢查，亦應歸零。

## Unresolved（1 處，維持不變）

- **#70「覔／覓」**：`&#35220;` → 覔（lossless decode 本身正確），但整頁 OCR 讀出「覓」（U+89BF），兩字上从「不」vs「爫」需人工核對附錄二 p145 原圖。本輪不擴大 scope，維持 unresolved。
