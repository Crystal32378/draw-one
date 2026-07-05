# Oracle Registry & Draw-Pool Implementation Plan

**Custody note:** Preserved by 福 through the GitHub connector from the ZCode plan shared by Crystal. This is a planning artifact only. It does **not** authorize production code changes, `index.html` edits, or a merge to `main`.

**Reported ZCode plan commit:** `df3b52f` on `spec/oracle-registry-design`  
**Source spec:** `docs/superpowers/specs/2026-07-04-oracle-registry-design.md`, reported commit `7a8c19f`  
**Recommended execution mode:** Subagent-driven execution, one task per commit, no merge to `main` until final review.

## Goal

Replace Draw One's hardcoded oracle array with a provenance-governed registry, a single audit/gate script, and a generated draw-pool data file so the frontend draws only from verified entries plus explicitly allowed seed entries, with zero provenance metadata leaking to end users.

## Architecture

- `data/oracle-registry/registry.csv` is the source of truth.
- `scripts/audit-oracles.mjs` validates the registry and emits a static JS file.
- `data/oracle-registry/oracles.draw-pool.js` sets `window.DRAW_ONE_ORACLES`.
- `index.html` loads that file via `<script src>`.
- No `fetch()`, no local server requirement, no backend, no runtime dependencies.
- The audit script enforces a dual-track gate: verified pool plus closed seed allowlist.
- Quarantine and GPT-generated entries are hard-excluded.

## Global Constraints

- Modify only: `index.html`, `docs/data-provenance-incident.md`, `README.md`, and new files under `data/oracle-registry/`, `scripts/`, `docs/superpowers/plans/`.
- Do not touch `.env`, `.env.local`, API keys, secrets, OpenAI Platform, billing, or project settings.
- Do not add dependencies, frameworks, backend code, analytics, external services, scraping, or frontend `fetch()`.
- Do not redesign the product or change the one-card oracle flow / ritual styling.
- Preserve Phase 1 fixes: `escapeHtml` discipline, loading-race guard, `:focus-visible` on draw button, WCAG-AA `--quiet`, and textarea `aria-label`.
- `data/imports/` is evidence-only. Neither the audit script nor the frontend reads it.
- The seed pool is a closed set of 9 entry IDs. Adding a 10th requires a spec amendment.
- The number `20` is historical context only: ChatGPT attachment limit, not an architectural unit.
- Node.js ESM only; audit script imports from Node builtins exclusively.

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `data/oracle-registry/registry.csv` | create | Single source of truth, one row per oracle entry, human-authored. |
| `data/oracle-registry/README.md` | create | Reviewer guide, gate rules, seed rules, audit instructions, v0.1 honesty note. |
| `data/oracle-registry/oracles.draw-pool.js` | generated | Emitted by audit script, committed so repo remains clone-and-open usable. |
| `scripts/audit-oracles.mjs` | create | Validate registry, enforce gates, emit draw-pool JS. |
| `index.html` | modify | Load draw-pool JS and replace hardcoded gods with `window.DRAW_ONE_ORACLES?.gods ?? []`. |
| `docs/data-provenance-incident.md` | modify | Replace importer/dry-run/resume language with audit/gate language; append Lessons/Folklore. |
| `README.md` | modify | Add pointer to registry README. |
| `data/imports/**` | untouched | Evidence-only; not read by this plan. |

## Pre-Execution Corrections Required

These were identified in 福 review before execution. They should be patched in the plan/spec before implementation begins:

1. Remove any remaining `decision needed` language around Guanyin vs Yue Lao.
   - Final decision: `guanyin-003..006` belong under `guanyin / 觀音`, not Yue Lao.
   - Frontend should show Guanyin as the god card for those entries.
2. Fix expected god-card count in frontend verification.
   - v0.1 seed data should render 2 god cards: `媽祖` with 5 entries and `觀音` with 4 entries.
   - Do not say 3 god cards unless a third god exists in `oracles.draw-pool.js`.
3. Replace `View Source` wording in frontend verification.
   - Browser View Source will not show dynamically rendered result cards.
   - Use DevTools Elements / DOM inspection or visible page text instead.

## Task 1: Registry CSV

Create `data/oracle-registry/registry.csv`.

Exact header:

```csv
entry_id,god_id,talisman_number,god_name,emoji,vibe,god_description,title,poem,fortune,meaning,advice,tags,story,oracle_set,source_name,source_url,source_type,license_status,review_status,reviewer_notes,pool
```

Seed exactly 9 v0.1 entries:

- `guanyin-003`
- `guanyin-004`
- `guanyin-005`
- `guanyin-006`
- `jiazi-056`
- `jiazi-057`
- `jiazi-058`
- `jiazi-059`
- `jiazi-060`

Rules:

- `guanyin-003..006`: `god_id=guanyin`, `god_name=觀音`.
- `jiazi-056..060`: `god_id=mazu`, `god_name=媽祖`.
- All seed entries: `source_type=traditional_unverified`, `license_status=unsure`, `review_status=pending`, `pool=seed_traditional_pending`.
- `source_name=unknown` if no independent source is available yet.
- `source_url` blank if unknown.
- `reviewer_notes`: `v0.1 seed pool entry; traditional verse with 典故 but source unverified; pending independent review.`
- Flatten all multiline content to a single line. No raw newline inside any field.
- Quote CSV fields containing comma or quotes, and escape inner quotes.

Verification:

```bash
python3 -c "
import csv
with open('data/oracle-registry/registry.csv', newline='') as f:
    rows = list(csv.reader(f))
print('header columns:', len(rows[0]))
print('data rows:', len(rows) - 1)
assert len(rows[0]) == 22, 'expected 22 columns'
assert len(rows) - 1 == 9, 'expected 9 seed entries'
for i, r in enumerate(rows):
    assert len(r) == 22, f'row {i} has {len(r)} cols, expected 22'
print('OK: 22 cols, 9 rows, all rows well-formed')
"
```

Commit:

```bash
git add data/oracle-registry/registry.csv
git commit -m "Seed registry.csv with 9 v0.1 traditional seed entries"
```

## Task 2: Registry README

Create `data/oracle-registry/README.md`.

Required sections:

- Title and purpose: governance layer; frontend never reads it directly.
- v0.1 honesty note, verbatim:

> Draw One v0.1 uses a small seed pool of traditional oracle entries while source verification and expansion are in progress. GPT-generated or summarized entries are quarantined and excluded.

- How to add an entry: describe the 22 columns and required fields.
- Gate rules:
  - verified = `license_status=ok AND review_status=approved`
  - seed = closed allowlist of 9 IDs
  - everything else excluded
- Seed pool is closed: adding a 10th seed entry requires amending the spec first.
- Quarantine rules: GPT-generated entries realistically never leave quarantine.
- How to run audit: `node scripts/audit-oracles.mjs`.
- Explain audit rewrites `oracles.draw-pool.js` only on success and exits 1 on validation error.
- `20` is not a system limit.

Commit:

```bash
git add data/oracle-registry/README.md
git commit -m "Add oracle registry reviewer guide with v0.1 honesty note"
```

## Task 3: Audit Script Validation Phase

Create `scripts/audit-oracles.mjs`.

Requirements:

- Node ESM.
- Zero dependencies.
- Use Node builtins only.
- Parse CSV with support for quoted fields and escaped quotes.
- Reject raw newline inside fields, including quoted newlines.
- Validate exact header order and column count.
- Validate required fields.
- Validate enum fields:
  - `source_type`
  - `license_status`
  - `review_status`
  - `pool`
- Validate unique `entry_id`.
- Validate `poem`, `meaning`, `advice` are non-empty.
- Validate god-level consistency across same `god_id`:
  - `god_name`
  - `emoji`
  - `vibe`
  - `god_description`
- Derive expected pool from fields and fail on mismatch.
- Enforce seed allowlist.
- Report counts separately.

Expected success output after Task 1:

```text
registry rows:        9
verified_count:         0
seed_pending_count:     9
draw_pool_total:        9
excluded_count:         0
  └ quarantined:        0
```

Negative test:

- Temporarily corrupt one seed row, e.g. set `pool=verified`.
- Run audit.
- Confirm exit 1 and clear error.
- Restore CSV before commit.

Commit:

```bash
git add scripts/audit-oracles.mjs
git commit -m "Add audit-oracles.mjs validation phase (structure, content, seed guards)"
```

## Task 4: Audit Script Emits Draw-Pool JS

Modify `scripts/audit-oracles.mjs` to emit `data/oracle-registry/oracles.draw-pool.js` after successful validation.

Generated payload shape:

```js
window.DRAW_ONE_ORACLES = {
  generated_at: "...",
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
          title: "...",
          poem: "...",
          fortune: "...",
          meaning: "...",
          advice: "...",
          tags: [],
          story: []
        }
      ]
    }
  ]
};
```

Rules:

- Group by `god_id` in first-seen order.
- Include only draw-pool rows: verified plus seed.
- Strip all provenance fields:
  - `source_type`
  - `license_status`
  - `review_status`
  - `reviewer_notes`
  - `source_url`
  - `pool`
  - `confidence`
  - `needs_human_review`
- Include `fortune` because it is oracle content metadata.
- Commit `oracles.draw-pool.js` so a fresh clone can open `index.html` without Node.

Verification:

```bash
node scripts/audit-oracles.mjs
```

Leak check should confirm no provenance terms exist in generated JSON.

Commit:

```bash
git add scripts/audit-oracles.mjs data/oracle-registry/oracles.draw-pool.js
git commit -m "Audit script emits oracles.draw-pool.js; commit generated file for static-site use"
```

## Task 5: Frontend Loading Change

Modify `index.html`.

Steps:

1. Add before existing inline script:

```html
<script src="data/oracle-registry/oracles.draw-pool.js"></script>
```

2. Replace hardcoded `const gods = [...]` with:

```js
const gods = window.DRAW_ONE_ORACLES?.gods ?? [];
```

3. Add graceful empty state in `renderGods()`:

```js
if (gods.length === 0) {
  oracleGrid.innerHTML = `<div class="oracle-empty">尚未有可用籤詩。</div>`;
  return;
}
```

4. Add small `.oracle-empty` CSS rule using existing colors.

Verification:

- Open `index.html` directly via `file://`.
- Confirm 2 god cards render:
  - `媽祖`: 5 entries
  - `觀音`: 4 entries
- Confirm a user can select a god, enter a question, and draw a result.
- Confirm no provenance/review/license metadata appears in the UI.
- Use DevTools Elements / DOM inspection or visible page text, not View Source, for rendered result checks.
- Confirm Phase 1 fixes still work.
- Temporarily rename `oracles.draw-pool.js` and confirm empty state appears; restore file afterward.

Commit:

```bash
git add index.html
git commit -m "Frontend loads oracles.draw-pool.js; removes hardcoded gods; graceful empty state"
```

## Task 6: Documentation Cleanup

Modify `docs/data-provenance-incident.md` and `README.md`.

Incident doc:

- Replace importer/dry-run/resume language with audit/gate language.
- Current problematic remediation language should become:

```text
Build a single audit/gate script (`scripts/audit-oracles.mjs`) that validates the registry and emits the draw-pool data file. No batch pipeline, no dry-run flag, no resume state — Draw One is a static site with no database, so those would be infrastructure for a problem that does not exist. Duplicate detection runs as part of every audit.
```

- Keep the existing note explaining that `20` was a ChatGPT attachment limit, not a system limit.
- Append `## Lessons / Folklore` from the approved spec.

Root README:

Add after Running Locally:

```markdown
## Oracle Data Governance

Oracle entries are governed by a provenance registry. See [`data/oracle-registry/README.md`](data/oracle-registry/README.md) for the gate rules, seed pool, and how to run the audit script.
```

Commit:

```bash
git add docs/data-provenance-incident.md README.md
git commit -m "Replace importer language with audit/gate; append Lessons/Folklore; README pointer"
```

## Task 7: End-to-End Verification

No files modified unless generated file changes.

Checks:

1. Clean-state audit:

```bash
node scripts/audit-oracles.mjs
```

Expected:

```text
registry rows:        9
verified_count:         0
seed_pending_count:     9
draw_pool_total:        9
excluded_count:         0
  └ quarantined:        0
wrote data/oracle-registry/oracles.draw-pool.js
```

2. Quarantine exclusion test:

- Temporarily append a row with `source_type=ai_generated_or_summarized`, `review_status=quarantine_do_not_import`, `pool=excluded`.
- Run audit.
- Expected: draw pool remains 9; quarantined count increases.
- Restore CSV.

3. Seed allowlist closure test:

- Temporarily append `guanyin-007` with `pool=seed_traditional_pending`.
- Run audit.
- Expected: exit 1, not in seed allowlist.
- Restore CSV.

4. `file://` open test:

- Open `index.html` with no local server.
- Confirm 9 seed entries are drawable across the two god cards.
- Confirm no provenance metadata appears in UI.

5. No-fetch / no-server test:

- Confirm no failed `fetch` / XHR dependency.
- The page must not require a server.

6. Final generated-file status:

```bash
git status
```

If `oracles.draw-pool.js` changed during verification, recommit it.

## Risks

### Guanyin vs Yue Lao Grouping

Original MVP mounted `guanyin-003..006` under the Yue Lao object, but their system/entry IDs are Guanyin. Final product decision: registry follows source lineage, so these entries belong under `guanyin / 觀音`.

### Generated File Staleness

Committing `oracles.draw-pool.js` keeps the repo clone-and-open usable, but contributors may edit `registry.csv` and forget to re-run audit. Mitigation: README and generated-file header must state the file is generated and audit must be rerun after registry changes.

### Manual Seed Transcription

Copying source text into CSV can introduce typos or escaping errors. Mitigation: CSV parser validation and manual diff/sanity review.

### Node Not Installed Locally

Audit requires Node. Generated JS remains committed so static viewing still works without Node. Registry changes require someone with Node to regenerate.

### Fortune Field Unused by Current UI

`fortune` is carried into draw-pool JS for future UI use. This is intentional per approved spec.

## Rollback Points

Each task should be one commit.

| If something breaks after... | Rollback | Result |
|---|---|---|
| Task 6 docs | revert task 6 | Lose doc updates only; code intact. |
| Task 5 frontend | revert task 5 | Frontend returns to hardcoded gods; registry/audit remain. |
| Task 4 emit | revert task 4 | Audit validates but emits no JS. |
| Task 3 validation | revert task 3 | Registry exists but ungated. |
| Task 2 README | revert task 2 | Lose reviewer guide only. |
| Task 1 registry CSV | revert task 1 | Back to pre-Phase-2 registry state. |

Full rollback: checkout the branch preceding Phase 2 or revert all task commits. `data/imports/` quarantine packages and the incident doc on `main` should survive rollback of this implementation branch.

## Self-Review Coverage

- §1 Goals/Non-Goals -> Global constraints and all tasks.
- §2 File Structure -> File structure table.
- §3 columns -> Task 1 header and Task 3 validators.
- §3a seed rules -> Task 3 pool derivation and seed guards.
- §3b closed allowlist -> Task 3 allowlist and Task 7 negative test.
- §4 quarantine -> Task 3 tally and Task 7 exclusion test.
- §5 validation rules -> Task 3.
- §5 dual-track gate -> Task 3 and Task 4.
- §5 separate reporting -> Task 3.
- §6 draw-pool JS format -> Task 4.
- §6 field projection -> Task 4 leak check.
- §7 frontend loading -> Task 5.
- §8 doc updates -> Task 2 and Task 6.
- §9 Lessons/Folklore -> Task 6.
- §10 fortune included -> Task 4.
- §10 seed not empty -> Task 1.

Plan ready for execution after pre-execution corrections are applied and user approves implementation.
