# Oracle Registry & Draw-Pool Design (Phase 2)

**Status:** Draft v2, pending user approval  
**Date:** 2026-07-04, revised 2026-07-05 after seed-pool direction  
**Scope:** Establish a provenance-governed oracle registry and a single audit/gate script that produces a static draw-pool data file consumed by the frontend. No batch/resume/dry-run pipeline. No backend. No external services.

## 1. Goals & Non-Goals

### Goals

- Single source of truth for oracle provenance: `data/oracle-registry/registry.csv`.
- One audit/gate script (`scripts/audit-oracles.mjs`) that validates the registry and emits a static, frontend-ready data file.
- Dual-track gating: a verified pool and an explicit, bounded `seed_traditional_pending` pool. Both reach the draw pool; neither is conflated with the other.
- Hard rules: only `license_status=ok` AND `review_status=approved` entries are verified. Seed entries are explicitly not verified and are labeled as such everywhere except the end-user UI.
- Frontend reads draw-pool data via a plain `<script src>` global: no `fetch()`, no server, no CORS.
- Frontend displays zero provenance / license / review metadata. Governance stays admin-side.

### Non-Goals

- No batch import pipeline. No resume-after-failure. No dry-run CLI.
- No database. No server. No external services. No new runtime dependencies.
- No scraping. No auto-licensing of unknown internet text.
- Frontend does not surface `source_type`, `license_status`, `review_status`, `confidence`, `needs_human_review`, or `pool` to end users.

### Historical Context on "20"

The number 20 originated from the ChatGPT per-message attachment limit during the prototype-era manual content drop. It is not a system constraint, not a DB limit, and not an architectural unit. In this design, 20 appears only as an optional default chunk size for human review convenience and is not enforced by code.

## 2. File Structure

```text
draw-one/
├── data/
│   ├── oracle-registry/
│   │   ├── registry.csv                 # SINGLE source of truth; admin/governance layer
│   │   ├── README.md                    # how to add/edit entries, gate rules, seed-pool rules, field rules
│   │   └── oracles.draw-pool.js         # GENERATED. Do not hand-edit. Defines window.DRAW_ONE_ORACLES.
│   └── imports/                         # EVIDENCE ONLY. Never read by frontend or by the gate output.
│       ├── guanyin-lingqian-index-2026-07-04/   # 福的 public-safe index; preserved as-is
│       └── guandi-lingqian-gpt-raw-2026-07-04/  # 福的 quarantine index; preserved as-is
├── scripts/
│   └── audit-oracles.mjs                # the ONE script: validate registry -> emit draw-pool JS
├── index.html                           # reads window.DRAW_ONE_ORACLES via <script src>
└── docs/
    ├── data-provenance-incident.md      # existing; append Lessons/Folklore section
    └── superpowers/specs/
        └── 2026-07-04-oracle-registry-design.md  # this file
```

### Files That Remain Evidence-Only

Everything under `data/imports/` is evidence, not a production source. Neither the frontend nor the generated `oracles.draw-pool.js` reads from it. It exists so future source review can trace where questionable material came from.

`archive/original-react-mvp.jsx` stays as historical record; not used.

### Generated vs. Authored

- **Authored:** `registry.csv`, `registry/README.md`, `index.html`, `docs/*`, `scripts/audit-oracles.mjs`.
- **Generated:** `data/oracle-registry/oracles.draw-pool.js`.

## 3. `registry.csv` Field Definition

CSV, UTF-8, LF line endings. Header row required. No BOM. No raw newline is allowed inside any field, including quoted fields. Multiline text must be flattened before entering CSV. Quote fields containing commas or quotes using RFC 4180 escaping, but do not use quoted newlines.

### Columns

| Column | Required | Type / Allowed values | Notes |
|---|---:|---|---|
| `entry_id` | yes | string, unique | Stable ID, e.g. `guanyin-003`, `jiazi-056`. Primary dedup key. |
| `god_id` | yes | string | e.g. `mazu`, `yuelao`, `guanyin`, `guangong`. Groups entries for frontend draw. |
| `talisman_number` | no | integer | Traditional number if applicable. Blank allowed for modern/rewrite entries. |
| `god_name` | yes | string | Display name, e.g. `媽祖`, `觀音`. |
| `emoji` | yes | string | Decorative icon. |
| `vibe` | yes | string | Short descriptor shown on god card. |
| `god_description` | yes | string | God-card description shown in the existing frontend. All rows with the same `god_id` must match. |
| `title` | yes | string | Display title, e.g. `第三籤【燕子銜泥】`. |
| `poem` | yes | string | Oracle verse. No raw newline. |
| `fortune` | no | string | e.g. `上籤`, `中籤`, `下籤`, `警示籤`. Carried into draw-pool JS as content metadata. |
| `meaning` | yes | string | Interpretation paragraph. |
| `advice` | yes | string | Guidance paragraph. |
| `tags` | no | string | Comma-or-、separated tags. Blank allowed. |
| `story` | no | string | Allusion / 典故. Blank allowed. |
| `oracle_set` | yes | string | e.g. `guanyin_lingqian_100`, `sixty_jiazi`, `original_modern`. |
| `source_name` | yes | string | Human-readable source. If unknown, write `unknown`. |
| `source_url` | no | string | URL if any. Blank if unknown. |
| `source_type` | yes | enum | `verified_original`, `public_domain_source`, `modern_interpretation`, `translation`, `rewrite`, `traditional_unverified`, `ai_generated_or_summarized`, `unknown`. |
| `license_status` | yes | enum | `ok`, `unsure`, `no`. |
| `review_status` | yes | enum | `approved`, `pending`, `quarantine_do_not_import`. |
| `reviewer_notes` | no | string | Free text. Blank allowed. |
| `pool` | yes | enum | `verified`, `seed_traditional_pending`, `excluded`. Authoritative reviewer intent, cross-checked by audit script. |

### Pool Semantics

The `pool` column is the human reviewer's intent. The audit script derives the expected pool from the other fields and errors if they disagree. `pool` cannot smuggle an entry into a pool its other fields do not qualify it for.

```text
verified                 iff license_status=ok AND review_status=approved
                             AND source_type is not ai_generated_or_summarized
                             AND source_type is not traditional_unverified

seed_traditional_pending iff license_status=unsure AND review_status=pending
                             AND source_type=traditional_unverified

excluded                 otherwise
```

An entry appears in the generated draw-pool JS iff its derived pool is `verified` OR `seed_traditional_pending`. Everything else is excluded.

## 3a. The v0.1 Seed Allowance

Draw One v0.1 ships with a small seed draw pool: the 9 traditional-looking MVP entries (`甲子 56-60`, `觀音 03-06`) used while source verification and expansion are in progress. These are not verified. They are an explicit, honest transition state: the temple door stays open during renovation.

Hard rules for seed entries:

- `source_type` MUST be `traditional_unverified`, never `ai_generated_or_summarized`, never `verified_original`.
- `license_status` MUST be `unsure`.
- `review_status` MUST be `pending`.
- `pool` MUST be `seed_traditional_pending`.
- An entry may leave the seed pool only by independent source verification flipping it to verified.
- The script never promotes on its own.
- No `ai_generated_or_summarized` entry and no `quarantine_do_not_import` entry can ever reach the seed pool or the draw pool.

Seed-pool exit criterion: the seed pool is intended to shrink over time as entries are either source-verified and promoted to verified, or demoted to excluded. The target end-state is a draw pool of verified entries only. The audit report surfaces `verified_count` and `seed_pending_count` separately so a growing or stagnant seed pool is visible.

## 3b. Closed Seed Allowlist

The v0.1 seed allowance is a closed set. Only these entry IDs may carry `pool=seed_traditional_pending`:

- `guanyin-003`
- `guanyin-004`
- `guanyin-005`
- `guanyin-006`
- `jiazi-056`
- `jiazi-057`
- `jiazi-058`
- `jiazi-059`
- `jiazi-060`

Adding a 10th seed entry requires amending this spec first. The audit script must not auto-expand the seed set.

## 4. Quarantine Rules

An entry is quarantined if any of:

- `review_status = quarantine_do_not_import`
- `license_status = no`
- `source_type = ai_generated_or_summarized`

Quarantined entries never appear in the generated draw-pool JS. This is non-negotiable and applies to both the verified pool and the seed pool.

Quarantined entries are retained in `registry.csv` so the audit script can report them and mirrored as evidence under `data/imports/`.

A quarantined entry can leave quarantine only by a human, in `registry.csv`, after independent source verification. The script never upgrades status on its own. GPT-generated entries realistically never leave quarantine because there is no source to verify against.

Unknown/unsure never auto-promotes to ok/approved. The seed pool is an explicit allowance for `traditional_unverified` only; it does not license the content, it labels it honestly.

## 5. Audit Script: `scripts/audit-oracles.mjs`

Single Node ESM script. No dependencies. Uses only `node:fs`, `node:path`, and other Node builtins. Run manually by an admin; not wired into CI requiring external services.

### Input

- `data/oracle-registry/registry.csv`

### Output

- `data/oracle-registry/oracles.draw-pool.js`: generated data file containing verified entries plus explicitly allowed seed entries.
- Stdout report with `total registry rows`, `validated rows`, `verified_count`, `seed_pending_count`, `draw_pool_total`, `excluded_count`, `quarantined_count`, duplicates, and validation errors.
- Exit code 1 if any validation error occurs; in that case `oracles.draw-pool.js` is not rewritten.

### Validation Rules

Any violation means exit 1 and no file written:

- File exists and is non-empty.
- Header row contains exactly the required columns in the defined order.
- Every data row has the correct column count.
- All required fields are non-empty.
- `entry_id` is unique.
- Enum fields contain only allowed values.
- `poem`, `meaning`, `advice` are non-empty after trimming.
- No raw newline (`\n` or `\r`) inside any field. Quoted newlines are also forbidden.
- `god_id` of any draw-pool entry has non-empty `god_name`, `emoji`, `vibe`, and `god_description`.
- All rows with the same `god_id` must have identical `god_name`, `emoji`, `vibe`, and `god_description`.
- Pool/field consistency: the `pool` value must match the pool derived from the entry's other fields.
- Seed guard: `pool=seed_traditional_pending` must use a listed §3b `entry_id` and must have `source_type=traditional_unverified`, `license_status=unsure`, and `review_status=pending`.

### Gate Application

After validation passes, partition rows into:

- `verified`: `license_status=ok` AND `review_status=approved` and not generated/not traditional-unverified.
- `seed_traditional_pending`: `license_status=unsure` AND `review_status=pending` AND `source_type=traditional_unverified` AND `entry_id` in §3b allowlist.
- `excluded`: everything else.

The draw pool is `verified ∪ seed_traditional_pending`. Emit `oracles.draw-pool.js` from that draw pool, grouped by `god_id`.

### What It Deliberately Does Not Do

- No batching, no 20-record chunks, no resume state file, no dry-run flag.
- No network. No fetch. No scraping.
- No writing to `data/imports/`.
- No mutation of `registry.csv`.

### Invocation

```bash
node scripts/audit-oracles.mjs
```

Example v0.1 output:

```text
registry rows:           105
validated:               105
verified_count:            0
seed_pending_count:        9
draw_pool_total:           9
excluded_count:           96
  └ quarantined:          90
  └ other_excluded:        6
duplicates:                0
errors:                    0
wrote data/oracle-registry/oracles.draw-pool.js
```

## 6. Generated `oracles.draw-pool.js`

Honest filename: the file is not called `verified` because at v0.1 it contains pending seed entries that are explicitly not verified.

Format: a plain JS file assigning a global, so `index.html` can load it via `<script src>` without `fetch()` and without a local server.

```js
// AUTO-GENERATED by scripts/audit-oracles.mjs. Do not edit by hand.
// Source: data/oracle-registry/registry.csv
// Generated: 2026-07-04T...
// Draw pool = verified entries + explicitly-allowed seed_traditional_pending entries.
// (At v0.1, most entries are seed-pending, NOT verified. See registry.csv + registry README.)
window.DRAW_ONE_ORACLES = {
  generated_at: "2026-07-04T...",
  verified_count: 0,
  seed_pending_count: 9,
  gods: [
    {
      id: "guanyin",
      name: "觀音",
      emoji: "🪷",
      vibe: "慈悲與留白",
      description: "...",
      oracle: [
        {
          entry_id: "guanyin-003",
          title: "第三籤【燕子銜泥】",
          poem: "衝風冒雨去還歸...",
          fortune: "下籤",
          meaning: "...",
          advice: "...",
          tags: ["..."],
          story: ["..."]
        }
      ]
    }
  ]
};
```

### Field Projection

The generator strips all provenance columns. The frontend object contains no `source_type`, `license_status`, `review_status`, `reviewer_notes`, `source_url`, `pool`, `confidence`, or `needs_human_review`.

`fortune` is included because it is oracle content, not provenance. The top-level counters (`verified_count`, `seed_pending_count`) are included for admin/debug visibility, but the frontend does not render them to end users.

### God-Card Grouping

Entries are grouped by `god_id`. God-level display fields (`name`, `emoji`, `vibe`, `description`) come from the first draw-pool entry of that god. A god with no draw-pool entries is omitted entirely.

## 7. Frontend Loading Approach

`index.html` changes are minimal:

1. Remove the hardcoded `const gods = [...]` array.
2. Add `<script src="data/oracle-registry/oracles.draw-pool.js"></script>` before the existing inline `<script>`.
3. Replace the `gods` reference with `window.DRAW_ONE_ORACLES?.gods ?? []`.
4. If the global is missing or the gods array is empty, show a small `尚未有可用籤詩` state instead of a broken grid.

### What the Frontend Must Not Do

- Must not read `registry.csv` directly.
- Must not read anything under `data/imports/`.
- Must not display provenance / license / review fields.
- Must not call `fetch()`.

### Preserved Behaviors

Existing one-card flow, ritual styling, transitions, accessibility fixes from Phase 1, `escapeHtml` discipline, and loading-race fix remain.

## 8. Documentation Updates

- `docs/data-provenance-incident.md`: append Lessons/Folklore and replace importer/dry-run/resume language with audit/gate language.
- `data/oracle-registry/README.md`: reviewer guide and v0.1 honesty note.
- `README.md`: one-line pointer to registry README.

Required v0.1 honesty note:

> Draw One v0.1 uses a small seed pool of traditional oracle entries while source verification and expansion are in progress. GPT-generated or summarized entries are quarantined and excluded.

## 9. Lessons / Folklore

This provenance failure was first detected by an automated review agent auditing the repository, not by any human reviewer, hackathon judge, or by GPT itself. Once content reaches a certain scale and is wrapped in a ritual/oracle narrative that lends it an air of authenticity, the human eye-trust chain breaks down: people read for feeling, not for provenance. The remedy is not "review harder." The remedy is to make the system structurally honest: a schema the data must fit, a gate it must pass, and an audit that runs independent of any one person's attention.

Governance vs. audit are two layers, both required. Information governance decides what may enter the system; audit checks whether the system is being built on true assumptions. Draw One's cleanup needed both: Codex/福 helped translate product direction into governance (`source_type`, `license_status`, quarantine rules, production gates), while the ZCode review layer acted as the audit that challenged inherited assumptions, most notably that the "20 records at a time" limit was a real system constraint rather than the ChatGPT per-message attachment limit retrospectively mythologized into architecture. Governance without audit builds correct-looking infrastructure on unexamined premises.

Cultural-context review is not source authority. Draw One handles Chinese-language oracle poetry, temple culture, and folk ritual, so a model with stronger Chinese cultural grounding has real value in recognizing 籤詩 form, deity lineages, temple lineages, numbering systems, and the transcription/variant-text problems common in Chinese-language sources. But cultural fluency is not source credibility: the model most fluent in the register is also the model most capable of generating plausible hallucinations in that register. In Draw One, cultural-context review is an auxiliary lens only, never a source authority. The data standard does not bend: every entry still needs source, `license_status`, `review_status`, and independent human/domain-expert verification before it reaches verified.

The temple metaphor: 草台班子會蓋出宮廟，宮廟下面還可能埋 GPT 假籤. Even a US-built model that constructs a convincing Chinese temple still has to pass a cultural-context review. The honest move is not to gild the statue or charge for divination, but to rip up the floor, show the foundations, and keep the temple door open while renovation is underway. Draw One v0.1 ships a small, honestly labeled seed pool precisely because an honest, smaller, open temple beats a grand one built on filler.

## 10. Resolved Decisions

- `fortune` field: included in generated draw-pool JS. It is oracle content, not provenance.
- Initial draw pool: not empty. The 9 traditional-looking MVP entries ship as the v0.1 `seed_traditional_pending` pool (`license_status=unsure`, `review_status=pending`, `source_type=traditional_unverified`, `pool=seed_traditional_pending`). The frontend draws from `verified ∪ seed_traditional_pending`. This is the founder's explicit decision to keep the temple door open during renovation, with honest labeling.

This spec does not authorize production code changes. Implementation begins only after user approval and the writing-plans step.
