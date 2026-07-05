# Oracle Registry & Draw-Pool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Custody note:** Preserved by 福 through the GitHub connector from ZCode's local branch `spec/oracle-registry-design` after final review fixes. This is a planning artifact only. It does **not** authorize production code changes, `index.html` edits, or a merge to `main`.

**Reported final ZCode plan commit:** `87237c7579acb1ad3333c55ac95aa40fdd07ccfe` on `spec/oracle-registry-design`

**Goal:** Replace Draw One's hardcoded oracle array with a provenance-governed registry, a single audit/gate script, and a generated draw-pool data file — so the frontend draws only from verified + explicitly-allowed seed entries, with zero provenance metadata leaking to end users.

**Architecture:** A single CSV (`registry.csv`) is the source of truth. A single Node script (`audit-oracles.mjs`, zero dependencies) validates it and emits a static JS file (`oracles.draw-pool.js`) that sets `window.DRAW_ONE_ORACLES`. `index.html` loads that file via `<script src>` and reads the global — no `fetch()`, no server. The script enforces a dual-track gate (verified pool + closed seed allowlist) and hard-excludes quarantine / GPT-generated entries.

**Tech Stack:** Vanilla HTML/CSS/JS (frontend, unchanged stack), Node.js ESM (single audit script, stdlib only), CSV (registry). No frameworks, no build step, no runtime dependencies.

**Source spec:** `docs/superpowers/specs/2026-07-04-oracle-registry-design.md` on branch `spec/oracle-registry-design`, commit `7a8c19f`. Every task below traces to a spec section; do not deviate without amending the spec first.

## Global Constraints

- Modify only: `index.html`, `docs/data-provenance-incident.md`, `README.md`, and new files under `data/oracle-registry/`, `scripts/`, `docs/superpowers/plans/`.
- Do NOT touch: `.env`, `.env.local`, API keys, secrets, OpenAI Platform, billing, project settings.
- Do NOT add: dependencies, frameworks, backend code, analytics, external services, scraping, `fetch()` in the frontend.
- Do NOT redesign the product or change the one-card oracle flow / ritual styling.
- Preserve Phase 1 fixes: `escapeHtml` discipline, loading-race guard, `:focus-visible` on draw button, WCAG-AA `--quiet`, textarea `aria-label`.
- `data/imports/` is evidence-only — neither the audit script nor the frontend reads it.
- The seed pool is a closed set of 9 `entry_id`s (§3b). Adding a 10th requires a spec amendment, not just a CSV edit.
- The number "20" is historical context only (ChatGPT attachment limit). It is not a system constraint, not an architectural unit, and must not appear as a batch size in code.
- Node.js ESM only; the audit script imports from `node:` builtins exclusively. If `node:fs`/`node:path`/`process` cannot satisfy a need, stop and amend the spec — do not add packages.

---

## File Structure (locked by this plan)

| File | Status | Responsibility |
|---|---|---|
| `data/oracle-registry/registry.csv` | create | Single source of truth. One row per oracle entry, all provenance columns. Human-authored. |
| `data/oracle-registry/README.md` | create | Reviewer guide: how to add entries, gate rules, seed rules, how to run audit. Contains v0.1 honesty note. |
| `data/oracle-registry/oracles.draw-pool.js` | generated | Emitted by audit script. Defines `window.DRAW_ONE_ORACLES`. Never hand-edited. |
| `scripts/audit-oracles.mjs` | create | Validate registry → emit draw-pool JS. Zero deps. Reports verified_count vs seed_pending_count separately. |
| `index.html` | modify (lines ~489, 547-612) | Load draw-pool JS via `<script src>`; replace hardcoded `gods` with `window.DRAW_ONE_ORACLES?.gods ?? []`; graceful empty state. |
| `docs/data-provenance-incident.md` | modify | Replace importer/dry-run/resume language with audit/gate language (line ~101). Append Lessons/Folklore section. |
| `README.md` | modify (after line 49 section) | One-line pointer to registry README under Running Locally. |
| `data/imports/**` | untouched | Evidence-only. Not read by anything in this plan. |

---

## Task 1: Registry CSV — seed the 9 allowlisted entries

**Files:**
- Create: `data/oracle-registry/registry.csv`

**Interfaces:**
- Produces: the CSV that Task 2's audit script consumes. Column order and enum values below are the contract; the script will be written against exactly these.

**Spec trace:** §3 (columns), §3a (seed rules), §3b (closed allowlist), §10 resolved #2.

- [ ] **Step 1: Create the registry directory and CSV file**

Create `data/oracle-registry/registry.csv` with this exact header (column order is fixed and will be validated):

```csv
entry_id,god_id,talisman_number,god_name,emoji,vibe,god_description,title,poem,fortune,meaning,advice,tags,story,oracle_set,source_name,source_url,source_type,license_status,review_status,reviewer_notes,pool
```

- [ ] **Step 2: Add the 9 seed entries (the entire v0.1 seed pool)**

Append exactly these 9 rows. These are the closed allowlist from spec §3b — no more, no less. All carry `source_type=traditional_unverified`, `license_status=unsure`, `review_status=pending`, `pool=seed_traditional_pending`. Poem/meaning/advice text is copied verbatim from `archive/original-react-mvp.jsx` lines 109-239 (the confirmed-traditional entries, not the generated filler).

The 9 `entry_id`s, in order: `guanyin-003`, `guanyin-004`, `guanyin-005`, `guanyin-006`, `jiazi-056`, `jiazi-057`, `jiazi-058`, `jiazi-059`, `jiazi-060`.

For each row, fill:
- `god_id`: `guanyin` for the 4 觀音 entries, `mazu` for the 5 甲子 entries (媽祖 is the deity of the 六十甲子 system per the MVP).
- `god_name`/`emoji`/`vibe`/`god_description`:
  - 媽祖 entries (`jiazi-056..060`): `god_name=媽祖`, `emoji=🌊`, `vibe=安定與陪伴`, `god_description=適合在人生混亂、焦慮與不安時前來詢問。` (from MVP lines 39-46).
  - 觀音 entries (`guanyin-003..006`): `god_name=觀音`, `emoji=🪷`, `vibe=慈悲與留白`, `god_description=適合在內心混亂、需要安定與留白時前來詢問。` The MVP mounted these under 月老, but the `system` field and entry_id prefix are `guanyin`. **Final decision: guanyin-003..006 belong under 觀音, not 月老. The frontend should show Guanyin as the god card.** All 4 rows must be consistent (the §5 god_* consistency check enforces this).
- `talisman_number`: 3,4,5,6 for guanyin; 56,57,58,59,60 for jiazi.
- `title`, `poem`, `fortune`, `meaning`, `advice`, `tags`, `story`: copy verbatim from the MVP. **Flatten any multi-line content to a single line** (spec forbids raw newlines in any field). If a field contains a comma or double-quote, wrap the whole field in double-quotes and escape inner `"` as `""`.
- `oracle_set`: `guanyin_lingqian_100` for the 4 觀音; `sixty_jiazi` for the 5 甲子.
- `source_name`: `unknown` (per spec: never blank, write `unknown` if unknown).
- `source_url`: (blank).
- `reviewer_notes`: `v0.1 seed pool entry; traditional verse with 典故 but source unverified; pending independent review.`

- [ ] **Step 3: Verify the file parses as 9 data rows + 1 header, no internal newlines**

Run:
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
Expected output: `OK: 22 cols, 9 rows, all rows well-formed`. If it fails, the most likely cause is an unescaped comma or a stray newline inside a field — fix the CSV, do not proceed.

- [ ] **Step 4: Commit**

```bash
git add data/oracle-registry/registry.csv
git commit -m "Seed registry.csv with 9 v0.1 traditional seed entries"
```

---

## Task 2: Registry README

**Files:**
- Create: `data/oracle-registry/README.md`

**Interfaces:**
- Consumes: the field/gate/seed rules from the spec.
- Produces: the human-facing guide that the v0.1 honesty note (spec §8) requires.

**Spec trace:** §3, §3a, §3b, §4, §8 (honesty note verbatim).

- [ ] **Step 1: Create the README with these sections**

Create `data/oracle-registry/README.md` containing:

1. **Title + purpose**: one paragraph — this is the governance layer; the frontend never reads it.
2. **The v0.1 honesty note, verbatim** (spec §8 requires this exact text):
   > "Draw One v0.1 uses a small seed pool of traditional oracle entries while source verification and expansion are in progress. GPT-generated or summarized entries are quarantined and excluded."
3. **How to add an entry**: list the 22 columns with one-line descriptions; flag the required ones; link the enum values to spec §3.
4. **Gate rules**: verified = `license=ok AND review=approved`; seed = the closed allowlist (list the 9 IDs from §3b); everything else excluded. State that the audit script enforces this, not the human.
5. **Seed pool is closed**: to add a 10th seed entry you must amend `docs/superpowers/specs/2026-07-04-oracle-registry-design.md` §3b first.
6. **Quarantine**: what it is, that it never reaches the draw pool, that GPT-generated entries realistically never leave it.
7. **How to run the audit**: `node scripts/audit-oracles.mjs` — explain that it rewrites `oracles.draw-pool.js` only on success and exits 1 (leaving the old file) on any validation error.
8. **"20" is not a system limit**: one line — historical context only, ChatGPT attachment limit, not enforced anywhere.

- [ ] **Step 2: Commit**

```bash
git add data/oracle-registry/README.md
git commit -m "Add oracle registry reviewer guide with v0.1 honesty note"
```

---

## Task 3: Audit script — validation phase

**Files:**
- Create: `scripts/audit-oracles.mjs`

**Interfaces:**
- Consumes: `data/oracle-registry/registry.csv` (Task 1).
- Produces: an exit code + stderr report. (File emission comes in Task 4; this task ends with validation-only that exits 0 on the 9 seed rows and exits 1 on deliberately-corrupted inputs.)

**Spec trace:** §5 validation rules (all 10 bullets), §3 pool semantics, §3a/§3b seed guards.

- [ ] **Step 1: Write the script skeleton with the CSV parser**

Create `scripts/audit-oracles.mjs`. No dependencies — implement a minimal RFC-4180-ish CSV parser by hand using `node:fs`. The parser must: split on newlines, handle quoted fields, handle `""` escapes, and **reject** any field containing `\n` or `\r` (per spec §5 — quoted newlines are also forbidden here).

```js
// scripts/audit-oracles.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REGISTRY = join(ROOT, "data", "oracle-registry", "registry.csv");
const OUT = join(ROOT, "data", "oracle-registry", "oracles.draw-pool.js");

const REQUIRED_COLUMNS = [
  "entry_id","god_id","talisman_number","god_name","emoji","vibe",
  "god_description","title","poem","fortune","meaning","advice","tags",
  "story","oracle_set","source_name","source_url","source_type",
  "license_status","review_status","reviewer_notes","pool"
];
const REQUIRED_ALWAYS = new Set([
  "entry_id","god_id","god_name","emoji","vibe","god_description",
  "title","poem","meaning","advice","oracle_set","source_name",
  "source_type","license_status","review_status","pool"
]);
const SOURCE_TYPES = new Set([
  "verified_original","public_domain_source","modern_interpretation",
  "translation","rewrite","traditional_unverified",
  "ai_generated_or_summarized","unknown"
]);
const LICENSE = new Set(["ok","unsure","no"]);
const REVIEW = new Set(["approved","pending","quarantine_do_not_import"]);
const POOLS = new Set(["verified","seed_traditional_pending","excluded"]);
const SEED_ALLOWLIST = new Set([
  "guanyin-003","guanyin-004","guanyin-005","guanyin-006",
  "jiazi-056","jiazi-057","jiazi-058","jiazi-059","jiazi-060"
]);
```

- [ ] **Step 2: Write the CSV parser (quoted fields, but reject quoted newlines)**

```js
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      // reject raw newline even inside quotes (spec §5)
      if (c === "\n" || c === "\r") {
        throw new Error(`raw newline inside quoted field near row ${rows.length + 1}`);
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; } // treat \r\n as \n
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  // last field/row if file doesn't end with newline
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}
```

- [ ] **Step 3: Write the header + per-row structural validators**

```js
function validateStructure(rows) {
  const errors = [];
  if (rows.length < 2) { errors.push("file has no data rows"); return errors; }
  const header = rows[0];
  if (header.length !== REQUIRED_COLUMNS.length) {
    errors.push(`header has ${header.length} columns, expected ${REQUIRED_COLUMNS.length}`);
  }
  for (let c = 0; c < REQUIRED_COLUMNS.length; c++) {
    if (header[c] !== REQUIRED_COLUMNS[c]) {
      errors.push(`header column ${c + 1} is "${header[c]}", expected "${REQUIRED_COLUMNS[c]}"`);
    }
  }
  if (errors.length) return errors; // don't cascade structural errors into row errors
  for (let r = 1; r < rows.length; r++) {
    if (rows[r].length !== REQUIRED_COLUMNS.length) {
      errors.push(`row ${r + 1} has ${rows[r].length} columns, expected ${REQUIRED_COLUMNS.length}`);
    }
  }
  return errors;
}
```

- [ ] **Step 4: Write the row-content validators (enums, required, dedup, pool consistency, seed guards, god_* consistency)**

```js
function rowToObj(header, row) {
  const o = {};
  for (let c = 0; c < header.length; c++) o[header[c]] = row[c];
  return o;
}

function derivePool(o) {
  if (o.license_status === "ok" && o.review_status === "approved"
      && o.source_type !== "ai_generated_or_summarized"
      && o.source_type !== "traditional_unverified") return "verified";
  if (o.license_status === "unsure" && o.review_status === "pending"
      && o.source_type === "traditional_unverified") return "seed_traditional_pending";
  return "excluded";
}

function validateContent(header, dataRows) {
  const errors = [];
  const seenIds = new Set();
  const gods = new Map(); // god_id -> {name, emoji, vibe, god_description}

  for (let r = 0; r < dataRows.length; r++) {
    const rowNum = r + 2; // +1 for header, +1 for 1-based
    const o = rowToObj(header, dataRows[r]);

    // required-always non-empty
    for (const col of REQUIRED_ALWAYS) {
      if ((o[col] ?? "").trim() === "") errors.push(`row ${rowNum}: required field "${col}" is empty`);
    }
    // poem/meaning/advice non-empty (subset of above but explicit)
    // enums
    if (!SOURCE_TYPES.has(o.source_type)) errors.push(`row ${rowNum}: bad source_type "${o.source_type}"`);
    if (!LICENSE.has(o.license_status)) errors.push(`row ${rowNum}: bad license_status "${o.license_status}"`);
    if (!REVIEW.has(o.review_status)) errors.push(`row ${rowNum}: bad review_status "${o.review_status}"`);
    if (!POOLS.has(o.pool)) errors.push(`row ${rowNum}: bad pool "${o.pool}"`);
    // dedup
    if (seenIds.has(o.entry_id)) errors.push(`row ${rowNum}: duplicate entry_id "${o.entry_id}"`);
    seenIds.add(o.entry_id);
    // pool consistency: declared pool must match derived pool
    const derived = derivePool(o);
    if (o.pool !== derived) {
      errors.push(`row ${rowNum}: pool "${o.pool}" does not match derived pool "${derived}" for entry ${o.entry_id}`);
    }
    // seed allowlist: only the 9 IDs may carry seed_traditional_pending
    if (o.pool === "seed_traditional_pending" && !SEED_ALLOWLIST.has(o.entry_id)) {
      errors.push(`row ${rowNum}: entry "${o.entry_id}" is not in the seed allowlist (spec §3b)`);
    }
    // god_* consistency across rows of same god_id
    const prev = gods.get(o.god_id);
    const snap = { name: o.god_name, emoji: o.emoji, vibe: o.vibe, god_description: o.god_description };
    if (prev) {
      for (const k of Object.keys(snap)) {
        if (prev[k] !== snap[k]) {
          errors.push(`row ${rowNum}: god "${o.god_id}" field ${k} "${snap[k]}" disagrees with earlier "${prev[k]}"`);
        }
      }
    } else gods.set(o.god_id, snap);
  }
  return errors;
}
```

- [ ] **Step 5: Wire main() to run both validators, print report, exit code**

```js
function main() {
  if (!existsSync(REGISTRY)) {
    console.error(`missing registry: ${REGISTRY}`);
    process.exit(1);
  }
  let rows;
  try {
    rows = parseCsv(readFileSync(REGISTRY, "utf8"));
  } catch (e) {
    console.error(`CSV parse error: ${e.message}`);
    process.exit(1);
  }
  const errors = [...validateStructure(rows)];
  let header, dataRows, counts;
  if (!errors.length) {
    header = rows[0];
    dataRows = rows.slice(1);
    errors.push(...validateContent(header, dataRows));
    counts = tally(header, dataRows);
  }
  if (errors.length) {
    console.error(`\n${errors.length} validation error(s):`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    console.error(`\noracles.draw-pool.js NOT regenerated (old file preserved).`);
    process.exit(1);
  }
  printReport(counts);
  // Task 4 will add emitDrawPool() here.
}

function tally(header, dataRows) {
  const c = { verified: 0, seed: 0, excluded: 0, quarantined: 0 };
  for (const row of dataRows) {
    const o = rowToObj(header, row);
    const p = derivePool(o);
    if (p === "verified") c.verified++;
    else if (p === "seed_traditional_pending") c.seed++;
    else { c.excluded++; if (o.review_status === "quarantine_do_not_import" || o.source_type === "ai_generated_or_summarized" || o.license_status === "no") c.quarantined++; }
  }
  return c;
}

function printReport(c) {
  console.log(`registry rows:        ${c.verified + c.seed + c.excluded}`);
  console.log(`verified_count:         ${c.verified}`);
  console.log(`seed_pending_count:     ${c.seed}`);
  console.log(`draw_pool_total:        ${c.verified + c.seed}`);
  console.log(`excluded_count:         ${c.excluded}`);
  console.log(`  └ quarantined:        ${c.quarantined}`);
}
```

- [ ] **Step 6: Verify the script validates the 9 seed rows successfully**

Run: `node scripts/audit-oracles.mjs`
Expected output:
```
registry rows:        9
verified_count:         0
seed_pending_count:     9
draw_pool_total:        9
excluded_count:         0
  └ quarantined:        0
```
Exit code 0. (File emission is not yet wired; that's Task 4.)

- [ ] **Step 7: Negative test — corrupt the registry temporarily and confirm exit 1**

Make a throwaway copy, introduce a deliberate error (e.g. flip one seed row's `pool` to `verified` to trigger the pool-consistency check), run the script pointed at it, confirm exit 1 and a clear error message. Then discard the copy — do not commit it. (If your script cannot yet take a path argument, temporarily edit the real CSV, run, observe, `git checkout -- data/oracle-registry/registry.csv` to restore.)

- [ ] **Step 8: Commit**

```bash
git add scripts/audit-oracles.mjs
git commit -m "Add audit-oracles.mjs validation phase (structure, content, seed guards)"
```

---

## Task 4: Audit script — emit draw-pool JS

**Files:**
- Modify: `scripts/audit-oracles.mjs` (add `emitDrawPool()` and call it from `main()` after successful validation).

**Interfaces:**
- Consumes: validated + tallied rows from Task 3.
- Produces: `data/oracle-registry/oracles.draw-pool.js` with `window.DRAW_ONE_ORACLES = { generated_at, verified_count, seed_pending_count, gods: [...] }`. Frontend fields only (spec §6 field projection — strip ALL provenance columns).

**Spec trace:** §5 (emit on success, no rewrite on failure), §6 (format + field projection + fortune included), §7 (frontend consumes via global).

- [ ] **Step 1: Write emitDrawPool()**

```js
function emitDrawPool(header, dataRows, counts) {
  const drawRows = dataRows
    .map((r) => rowToObj(header, r))
    .filter((o) => derivePool(o) === "verified" || derivePool(o) === "seed_traditional_pending");

  // group by god_id, preserve first-seen order
  const godMap = new Map();
  for (const o of drawRows) {
    if (!godMap.has(o.god_id)) {
      godMap.set(o.god_id, {
        id: o.god_id,
        name: o.god_name,
        emoji: o.emoji,
        vibe: o.vibe,
        description: o.god_description,
        oracle: [],
      });
    }
    godMap.get(o.god_id).oracle.push({
      entry_id: o.entry_id,
      title: o.title,
      poem: o.poem,
      fortune: o.fortune,
      meaning: o.meaning,
      advice: o.advice,
      tags: o.tags ? o.tags.split(/[、,]/).map((t) => t.trim()).filter(Boolean) : [],
      story: o.story ? o.story.split(/[、,]/).map((t) => t.trim()).filter(Boolean) : [],
    });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    verified_count: counts.verified,
    seed_pending_count: counts.seed,
    gods: Array.from(godMap.values()),
  };

  const js =
`// AUTO-GENERATED by scripts/audit-oracles.mjs. Do not edit by hand.
// Source: data/oracle-registry/registry.csv
// Generated: ${payload.generated_at}
// Draw pool = verified entries + explicitly-allowed seed_traditional_pending entries.
// (At v0.1, most entries are seed-pending, NOT verified. See registry.csv + registry README.)
window.DRAW_ONE_ORACLES = ${JSON.stringify(payload, null, 2)};
`;
  writeFileSync(OUT, js, "utf8");
  console.log(`wrote ${OUT}`);
}
```

- [ ] **Step 2: Call emitDrawPool() from main() after printReport()**

In `main()`, replace the `// Task 4 will add emitDrawPool() here.` line with:
```js
emitDrawPool(header, dataRows, counts);
```

- [ ] **Step 3: Run the full script and verify the output file**

Run: `node scripts/audit-oracles.mjs`
Expected stdout (last line):
```
wrote data/oracle-registry/oracles.draw-pool.js
```

Then verify the generated file:
```bash
node -e "
const fs = require('fs');
const src = fs.readFileSync('data/oracle-registry/oracles.draw-pool.js', 'utf8');
// strip the global assignment to eval in node
const m = src.match(/window\.DRAW_ONE_ORACLES = (\{[\s\S]*\});/);
const data = JSON.parse(m[1]);
console.log('gods:', data.gods.length);
console.log('total oracles:', data.gods.reduce((n,g)=>n+g.oracle.length,0));
console.log('verified_count:', data.verified_count);
console.log('seed_pending_count:', data.seed_pending_count);
const leak = JSON.stringify(data).match(/source_type|license_status|review_status|reviewer_notes|source_url|needs_human_review|confidence|\"pool\"/);
console.log('provenance leak in output:', leak ? 'YES ✗' : 'NO ✓');
"
```
Expected:
```
gods: 2
total oracles: 9
verified_count: 0
seed_pending_count: 9
provenance leak in output: NO ✓
```

- [ ] **Step 4: Add oracles.draw-pool.js to .gitignore? — NO. Commit it.**

The generated file is committed so `index.html` works from a fresh clone without requiring Node. (Trade-off accepted: re-run the audit and re-commit whenever registry.csv changes. The file's own header says "do not edit by hand", and the audit rewrites the whole file, so conflicts are replace-not-merge.)

```bash
git add scripts/audit-oracles.mjs data/oracle-registry/oracles.draw-pool.js
git commit -m "Audit script emits oracles.draw-pool.js; commit generated file for static-site use"
```

---

## Task 5: Frontend — load draw-pool JS, remove hardcoded gods

**Files:**
- Modify: `index.html` (lines ~489 area for `<script src>`; lines 547-612 for the hardcoded `const gods` array; line 547 area for graceful empty state).

**Interfaces:**
- Consumes: `window.DRAW_ONE_ORACLES` from the generated JS (Task 4).
- Produces: a frontend that draws from the verified+seed pool and shows a graceful message when the pool is empty/missing.

**Spec trace:** §7 (loading approach, what the frontend must NOT do, preserved behaviors).

- [ ] **Step 1: Add the `<script src>` tag before the inline script**

In `index.html`, immediately before the existing `<script>` tag (around line 547), add:
```html
    <script src="data/oracle-registry/oracles.draw-pool.js"></script>
```

- [ ] **Step 2: Replace the hardcoded `const gods = [...]` array with the global read**

At line 548, the file currently has `const gods = [` ... a multi-hundred-line array ... `];` ending around line 612. Replace that entire block with:
```js
      const gods = window.DRAW_ONE_ORACLES?.gods ?? [];
```

- [ ] **Step 3: Add a graceful empty-state guard in the render path**

In `renderGods()` (around line 651), if `gods.length === 0`, render a friendly message into `#oracleGrid` instead of an empty grid, e.g.:
```js
      function renderGods() {
        if (gods.length === 0) {
          oracleGrid.innerHTML = `<div class="oracle-empty">尚未有可用籤詩。</div>`;
          return;
        }
        oracleGrid.innerHTML = gods.map(/* existing template */).join("");
      }
```
(Reuse the existing template literal; only wrap it in the length check. Add a `.oracle-empty { color: var(--quiet); padding: 24px; }` rule to the `<style>` block.)

- [ ] **Step 4: Verify the page works by opening index.html directly via file://**

Run:
```bash
# macOS
open index.html
```
Manually confirm in the browser:
1. **2 god cards** render: 媽祖 (5 甲子 entries) and 觀音 (4 觀音 entries). No third god card exists in v0.1 seed data.
2. Selecting a god, typing a question, and clicking 抽一支籤 produces a result with title/poem/meaning/advice.
3. No `source_type` / `license_status` / `review_status` / `reviewer_notes` / `source_url` text appears anywhere in the rendered UI. (Open DevTools → Elements tab, inspect a rendered result card, and confirm the DOM contains only title/poem/meaning/advice/tags/story/fortune — no provenance fields.)
4. The Phase 1 fixes still work: keyboard focus on the draw button is visible; textarea has the aria-label; switching gods during the 1.2s loading window is ignored.

- [ ] **Step 5: Negative test — temporarily rename the draw-pool JS and reload**

`mv data/oracle-registry/oracles.draw-pool.js data/oracle-registry/oracles.draw-pool.js.bak`, reload `index.html`, confirm the "尚未有可用籤詩。" empty state shows (no broken grid, no console error beyond the 404 for the missing script which is expected). Restore: `mv data/oracle-registry/oracles.draw-pool.js.bak data/oracle-registry/oracles.draw-pool.js`.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Frontend loads oracles.draw-pool.js; removes hardcoded gods; graceful empty state"
```

---

## Task 6: Doc cleanup — incident doc + root README

**Files:**
- Modify: `docs/data-provenance-incident.md` (line 101 area: replace importer/dry-run/resume language; append Lessons/Folklore section at end).
- Modify: `README.md` (after the "Running Locally" section ~line 49): one-line pointer.

**Interfaces:**
- Consumes: the Lessons/Folklore text from spec §9.
- Produces: incident doc that no longer describes a batch/resume pipeline we did not build; root README that points users to the registry.

**Spec trace:** §8 (doc updates), §9 (Lessons/Folklore text — copy verbatim).

- [ ] **Step 1: Replace the importer/dry-run/resume language in Remediation Plan**

In `docs/data-provenance-incident.md`, the `## Remediation Plan` section currently contains (line ~101):
```
2. Build an importer with dry run, resume, duplicate detection, and configurable batching, using 20 as the default manual-review chunk size.
```
Replace that bullet with:
```
2. Build a single audit/gate script (`scripts/audit-oracles.mjs`) that validates the registry and emits the draw-pool data file. No batch pipeline, no dry-run flag, no resume state — Draw One is a static site with no database, so those would be infrastructure for a problem that does not exist. Duplicate detection runs as part of every audit.
```

Also scan the doc for any other `importer` / `dry run` / `resume` / `20-record` as architecture language and reword to audit/gate language. The `## Note on the 20-Record Batch Size` section (line 57) should stay — it correctly explains 20 as historical context — but confirm it does not describe 20 as a system limit.

- [ ] **Step 2: Append the Lessons/Folklore section at the end of the incident doc**

Append a new `## Lessons / Folklore` section to `docs/data-provenance-incident.md`, copying verbatim the four-paragraph text from spec §9 (the agent-detected-failure paragraph, the governance-vs-audit paragraph, the cultural-context-review paragraph, and the temple-metaphor paragraph).

- [ ] **Step 3: Add a one-line pointer in root README**

In `README.md`, after the `## Running Locally` section (around line 49), add:
```markdown
## Oracle Data Governance

Oracle entries are governed by a provenance registry. See [`data/oracle-registry/README.md`](data/oracle-registry/README.md) for the gate rules, seed pool, and how to run the audit script.
```

- [ ] **Step 4: Commit**

```bash
git add docs/data-provenance-incident.md README.md
git commit -m "Replace importer language with audit/gate; append Lessons/Folklore; README pointer"
```

---

## Task 7: End-to-end verification

**Files:** none modified — verification only.

**Spec trace:** all sections — this is the acceptance gate for the whole plan.

- [ ] **Step 1: Clean-state audit run**

From a clean working tree:
```bash
node scripts/audit-oracles.mjs
```
Expected:
```
registry rows:        9
verified_count:         0
seed_pending_count:     9
draw_pool_total:        9
excluded_count:         0
  └ quarantined:        0
wrote data/oracle-registry/oracles.draw-pool.js
```
Exit code 0.

- [ ] **Step 2: Quarantine exclusion test**

Temporarily append a 10th row to `registry.csv` with `source_type=ai_generated_or_summarized`, `review_status=quarantine_do_not_import`, `pool=excluded`. Run the audit. Expected: `excluded_count: 1, quarantined: 1`, `draw_pool_total` still 9. The draw-pool JS must NOT contain that entry. Restore the CSV: `git checkout -- data/oracle-registry/registry.csv`. Re-run audit to regenerate the clean draw-pool JS.

- [ ] **Step 3: Seed-allowlist-closure test**

Temporarily append an 11th row with `pool=seed_traditional_pending` but an `entry_id` NOT in the §3b allowlist (e.g. `guanyin-007`). Run the audit. Expected: exit 1 with error `entry "guanyin-007" is not in the seed allowlist (spec §3b)`. Restore the CSV.

- [ ] **Step 4: file:// open test**

`open index.html` (macOS). Confirm the 9 seed entries are drawable across the god cards, the ritual flow works end to end, and no provenance metadata appears in the UI.

- [ ] **Step 5: No-fetch / no-server test**

With no local server running, open `index.html` via `file://`. Confirm it works. Open DevTools → Network → confirm there is no failed `fetch`/XHR beyond the single `<script src>` for the draw-pool file. The page must not depend on a server.

- [ ] **Step 6: Final commit if any generated file changed during tests**

```bash
git status
# if oracles.draw-pool.js changed, re-commit it
git add data/oracle-registry/oracles.draw-pool.js 2>/dev/null
git commit -m "Regenerate draw-pool JS after verification" 2>/dev/null || echo "nothing to commit"
```

---

## Risks

1. ** 觀音 vs 月老 resolved.** guanyin-003..006 belong under `guanyin`/觀音 (not 月老). This was decided before implementation; the audit's god_* consistency check will enforce it. If the product later wants 月老 as a separate god card, that requires a spec amendment (new entries with `god_id=yuelao`).

2. **Generated file committed vs. stale.** Committing `oracles.draw-pool.js` means a contributor could edit `registry.csv` and forget to re-run the audit, leaving the frontend on stale data. **Mitigation:** the file header says "do not edit by hand"; the registry README (Task 2) instructs to re-run the audit after any registry change. A future CI step (out of scope for this plan — would require a service) could enforce `node scripts/audit-oracles.mjs && git diff --exit-code data/oracle-registry/oracles.draw-pool.js`.

3. **Manual seed-entry text transcription.** Copying poem/meaning/advice from `archive/original-react-mvp.jsx` into CSV by hand can introduce typos or unescaped commas. **Mitigation:** Task 1 Step 3's parser check catches structural errors; pair-transcribe carefully; diff the generated JS against the MVP source text for sanity.

4. **Node not installed locally.** The audit requires Node. If the user's machine lacks Node, they cannot regenerate the draw-pool file. **Mitigation:** the committed `oracles.draw-pool.js` lets the static site work without Node; regeneration only matters when the registry changes. Document the Node requirement in the registry README (Task 2 §7).

5. **`fortune` field unused by current UI.** Carrying `fortune` in the draw-pool JS (per spec §10 resolved #1) but not displaying it means the data is staged for a future UI change. Not a bug, but a reviewer might flag it as dead data. **Mitigation:** the spec explicitly resolved to include it; a code comment in the generated file or a one-line note in the registry README can explain.

---

## Rollback Points

Each task is a commit; rollback granularity = one commit.

| If something breaks after... | Rollback | What you keep / lose |
|---|---|---|
| Task 6 (docs) | `git revert <task6>` | Lose doc updates only; code intact. |
| Task 5 (frontend) | `git revert <task5>` | Frontend returns to hardcoded gods; registry/audit still work standalone. |
| Task 4 (emit) | `git revert <task4>` | Audit validates but no JS emitted; frontend has nothing to load yet (would hit the Task 5 empty state). |
| Task 3 (validation) | `git revert <task3>` | No audit at all; registry CSV exists but ungated. |
| Task 2 (registry README) | `git revert <task2>` | Lose reviewer guide only. |
| Task 1 (registry CSV) | `git revert <task1>` | Back to pre-Phase-2 state entirely. |

**Full rollback to pre-Phase-2:** `git checkout main` (or whatever branch preceded `spec/oracle-registry-design`). The Phase 2 branch can be deleted with `git branch -D spec/oracle-registry-design` once you've confirmed you don't want any of it.

**Nuclear rollback (if the whole direction is wrong):** the `data/imports/` quarantine packages and `docs/data-provenance-incident.md` are on `main` and predate this branch — they survive any rollback of this plan. The 9 seed entries exist nowhere else, so rolling back Task 1 means re-deriving them from `archive/original-react-mvp.jsx` (they're the non-generated entries with 典故).

---

## Self-Review (run before handoff)

**Spec coverage check:**
- §1 Goals/Non-Goals → Global Constraints + every task. ✓
- §2 File Structure → "File Structure" table above. ✓
- §3 columns → Task 1 header + Task 3 validators. ✓
- §3a seed rules → Task 3 `derivePool` + `validateContent` seed guards. ✓
- §3b closed allowlist → Task 3 `SEED_ALLOWLIST` + Task 7 Step 3 negative test. ✓
- §4 quarantine → Task 3 quarantine tally + Task 7 Step 2 exclusion test. ✓
- §5 validation rules (10 bullets) → Task 3 steps 3-5, one bullet per code block. ✓
- §5 dual-track gate → Task 3 `derivePool` + Task 4 emit filter. ✓
- §5 separate reporting → Task 3 `printReport`. ✓
- §6 draw-pool JS format → Task 4 `emitDrawPool`. ✓
- §6 field projection (no provenance leak) → Task 4 Step 3 leak-check test. ✓
- §7 frontend loading → Task 5. ✓
- §8 doc updates → Task 2 (honesty note) + Task 6. ✓
- §9 Lessons/Folklore → Task 6 Step 2 (verbatim copy). ✓
- §10 resolved #1 (fortune included) → Task 4 `emitDrawPool` includes `fortune`. ✓
- §10 resolved #2 (seed not empty) → Task 1 seeds 9 entries. ✓

**No gaps. Plan ready for execution choice.**
