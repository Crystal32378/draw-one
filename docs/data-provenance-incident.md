# Data Provenance Incident: Oracle Content Cleanup

## Summary

During the Draw One prototype cleanup, we found that a large portion of the oracle dataset was not verified source material. The user had believed roughly 200 oracle entries had been collected, but review showed that only a small number appeared to be authentic source entries, while many other entries were GPT-generated or GPT-aggregated filler.

This was a prototype-stage data provenance failure, not a product intent failure.

## What Happened

Draw One began as a hackathon prototype for a one-card oracle ritual interface. Early users noticed repeated draws, which correctly signaled that the content pool was too small for the intended experience.

To reduce repetition, additional oracle content was gathered quickly. Some content came from web downloads, and some was later generated or expanded through GPT. At the time, source status, license status, and authenticity were not tracked rigorously.

During Phase 2 cleanup, ZCode helped identify that much of the expanded corpus was not verified original oracle material. Some entries were likely hallucinated, synthesized, or loosely aggregated by GPT.

## Why This Matters

The core Draw One experience depends on trust:

- Users should know whether a reading comes from a verified traditional source, a modern rewrite, or a generated interpretation.
- Repeated draws break the ritual experience, but fake filler breaks trust more deeply.
- A prototype can use rough data to test an interaction, but a real product needs clear provenance.

## Hackathon Context

The hackathon demo should be understood as a prototype. It demonstrated product concept, atmosphere, interaction design, and the ritual interface thesis. It was not a claim that the dataset was a fully verified production oracle archive.

Winning the hackathon validated the product idea and user experience direction. It did not validate the dataset.

The correct response is not shame; it is cleanup.

## Root Causes

- No provenance fields existed at the start.
- GPT-generated and source-derived content were not separated.
- The prototype optimized for flow and coverage, not source integrity.
- Repeated-draw UX pressure encouraged rapid content expansion.
- There was no import gate requiring `license_status = ok`.

## Impact

- The existing corpus cannot be treated as production-ready.
- GPT-generated or aggregated entries must be quarantined.
- Web-sourced entries need license and source review.
- Only independently verified entries should enter the production oracle pool.

## Current Controls Added

- Guanyin downloaded HTML batch is indexed with `license_status = unsure`.
- Guandi GPT batch is marked as quarantine material.
- GPT-generated or aggregated content is labeled `ai_generated_or_summarized`.
- Quarantine entries are marked `quarantine_do_not_import`.
- Public GitHub data excludes raw unreviewed HTML/text content where appropriate.
- Batch summaries support review/import chunks, with 20 records as the current workflow default.

## Note on the 20-Record Batch Size

The number 20 was not a confirmed database constraint.

It came from the earlier GPT-assisted manual workflow: each GPT conversation could only accept about 20 attachments at a time, so source review and content handoff naturally happened in 20-file batches.

Going forward, 20 should be treated as a configurable review/import batch default, not a hard production limit.

## Policy Going Forward

Every oracle entry must have:

- `oracle_set`
- `talisman_number`
- `source_name`
- `source_url`
- `source_type`
- `license_status`
- `review_status`
- `reviewer_notes`

Allowed `source_type` values:

- `verified_original`
- `public_domain_source`
- `modern_interpretation`
- `translation`
- `rewrite`
- `ai_generated_or_summarized`
- `unknown`

Allowed `license_status` values:

- `ok`
- `unsure`
- `no`

Production import rule:

Only entries with `license_status = ok` and `review_status = approved` may be imported into the production oracle pool.

## Remediation Plan

1. Preserve all questionable data as evidence, not production content.
2. Build a single audit/gate script (`scripts/audit-oracles.mjs`) that validates the registry and emits the draw-pool data file. No batch pipeline, no dry-run flag, no resume state. Draw One is a static site with no database, so those would be infrastructure for a problem that does not exist. Duplicate detection runs as part of every audit.
3. Add a hard gate blocking `unsure`, `no`, and quarantine entries from production import.
4. Rebuild the real oracle pool from verified sources.
5. Rewrite interpretations in Draw One's own voice after source review.
6. Keep generated interpretations clearly labeled as generated interpretation, not original oracle text.

## Product Lesson

The embarrassing part also revealed the product truth:

Draw One only works if the ritual object feels real, scarce, and trustworthy. Repetition exposed a real UX problem. GPT filler exposed a real provenance problem. Both are useful discoveries.

The next version should be smaller, cleaner, and more honest.

## Multi-Model Collaboration

Draw One became a useful case study in multi-model agent collaboration.

Codex supported implementation and information governance. It helped translate the founder's product direction into a working browser prototype, and helped organize documentation around source type, license status, review status, quarantine rules, and production gates.

ZCode, using Z.ai GLM-5.2 in this workflow, acted more like a cultural-context review and scientific audit layer. It challenged assumptions, checked whether workflow limits were real system constraints, and helped separate useful governance from unnecessary architecture.

The practical lesson:

> Information governance decides what may enter the system. Audit checks whether the system is being built on true assumptions.

## 華語模型與文化語境審查

Draw One 處理的是華語籤詩、宮廟文化與民俗儀式，所以華語模型在文化語境審查上有其價值。

它們可能更容易辨識籤詩文體、神明脈絡、宮廟派系、籤號系統、吉凶語彙，以及華語資料中常見的轉錄、異文與來源混雜問題。

但文化語感不等於來源可信。越熟悉語境的模型，也越可能生成更像真的幻覺內容。

因此，在 Draw One 裡，華語模型只能作為文化與語言 review 的輔助，不能作為來源權威。

正式資料標準不變：每一筆 oracle entry 都必須有 source、license status、review status，並經過人工或領域專家審查後，才可以進入 verified pool。

## 中文摘要

Draw One 不是要建立一個 AI 神諭權威，而是一個 AI 儀式介面 prototype，也是一個關於信任、來源與文化責任的開放實驗。

這個專案先用 Codex 做出有感的 ritual experience，後來又在 cleanup 中透過 agentic audit 發現資料來源問題。這讓團隊看見：AI 在籤詩、宗教語言與古文風格上非常容易生成可信幻覺，尤其當使用者本來就在尋找安定感時，流暢文字很容易被誤認為指引。

因此 Draw One 的下一步不是替自己鍍金身，也不是宣稱 AI 可以算命，而是把地基翻開：建立來源治理、審核流程、verified pool，並邀請宗教研究、民俗文化、文化人類學與相關實務工作者批判性地檢視這種 AI ritual interface 應該如何被設計。
