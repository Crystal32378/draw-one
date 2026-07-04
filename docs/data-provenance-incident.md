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
2. Build an importer with dry run, resume, duplicate detection, and configurable batching, using 20 as the default manual-review chunk size.
3. Add a hard gate blocking `unsure`, `no`, and quarantine entries from production import.
4. Rebuild the real oracle pool from verified sources.
5. Rewrite interpretations in Draw One's own voice after source review.
6. Keep generated interpretations clearly labeled as generated interpretation, not original oracle text.

## Product Lesson

The embarrassing part also revealed the product truth:

Draw One only works if the ritual object feels real, scarce, and trustworthy. Repetition exposed a real UX problem. GPT filler exposed a real provenance problem. Both are useful discoveries.

The next version should be smaller, cleaner, and more honest.
