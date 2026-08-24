#!/usr/bin/env node
/**
 * build-draw-pool.mjs — Production draw-pool build gate (fail-closed).
 *
 * Reads the three curated corpora under data/corpora/, validates every entry
 * against the production gates below, and emits:
 *
 *   assets/oracles.draw-pool.js       — the ONLY data source the public UI may draw from
 *   data/production/draw-pool.report.json — build evidence (counts, hashes, gate results)
 *
 * FAIL-CLOSED CONTRACT:
 *   Any gate violation aborts the build with exit code 1 and DELETES any
 *   previously generated pool file, so a stale-but-valid pool can never mask
 *   a now-invalid corpus. No placeholder or fallback content is ever emitted.
 *
 * PUBLIC PROJECTION (public exposure hardening):
 *   The emitted pool is a PROJECTION of canonical data, not the canonical data
 *   itself. All truth gates run against the FULL canonical fields first; only
 *   after every gate passes are non-runtime governance fields stripped from
 *   the browser artifact. The research ledger (source locators, source file
 *   paths/hashes, edition internals, data-quality counters) stays in
 *   data/corpora/ and in the build report — it does not ship to visitors.
 *   Runtime keeps exactly what the UI reads: id / corpus_id / deity_tradition /
 *   slip_number / original_slip_label / historical_text / provenance
 *   {edition_title, transcription_status} — the last two are load-bearing for
 *   slip-render's fail-closed colophon contract（已對勘／待複核）.
 *
 * DATA MODEL (per pool entry):
 *   historical_text  — verbatim corpus text. Never synthesized, never merged.
 *   provenance       — public colophon subset: edition_title + transcription_status.
 *   interpretation   — always null in this build, and ASSERTED empty at the
 *                      source: a non-empty interpretation field anywhere in a
 *                      corpus slip fails the build (fail-closed, never
 *                      strip-and-ship). Generated interpretation may only
 *                      enter through a future governed pipeline and must pass
 *                      lintInterpretationVoice() (see draw-policy.js note).
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const POOL_PATH = join(ROOT, "assets", "oracles.draw-pool.js");
const REPORT_PATH = join(ROOT, "data", "production", "draw-pool.report.json");

// ---------------------------------------------------------------------------
// Production manifest — the closed allowlist of corpora that may enter the
// public draw pool. A corpus absent from this manifest cannot be drawn, no
// matter what exists on disk. Expected counts are exact, not minimums.
// ---------------------------------------------------------------------------
const MANIFEST = [
  { corpus_id: "guanyin", file: "data/corpora/guanyin/slip_texts.json", expected_count: 100 },
  { corpus_id: "guandi", file: "data/corpora/guandi/slip_texts.json", expected_count: 100 },
  { corpus_id: "liushijiazi", file: "data/corpora/liushijiazi/slip_texts.json", expected_count: 60 },
];

// Transcription statuses allowed into production. VERIFIED = cross-checked
// against the reference edition; PROBABLE = verbatim capture from a single
// identified legitimate source, pending second-witness check. Anything else
// (UNVERIFIED, ai_generated_or_summarized, missing, …) is rejected.
const ALLOWED_TRANSCRIPTION_STATUS = new Set(["VERIFIED", "PROBABLE"]);

// Known fabricated / remixed seed poems from the pre-cleanup prototype.
// Their fragments are permanently banned from the production pool so a
// regression can never reintroduce them.
const BANNED_FRAGMENTS = [
  "雲開月出見青天",
  "海潮雖大終須退",
  "花開花謝皆有時",
  "有心栽柳柳難成",
  "群邪退散正當宜",
  "行船莫怕風波急",
];

const REQUIRED_ENTRY_FIELDS = [
  "corpus_id",
  "slip_number",
  "original_slip_label",
  "poem_text",
  "edition_id",
  "edition_title",
  "edition_date_period",
  "source_locator",
  "transcription_status",
  "deity_tradition",
];

// Some corpus transcriptions carry rare/variant glyphs as HTML numeric
// character references (e.g. "&#28895;" for 烟). Decoding is a lossless
// transcoding of the SAME character — it preserves 異體字 exactly and never
// canonicalizes. Counts are reported per corpus as a data-quality flag for
// the corpus maintainers. Any entity that survives decoding (named entities,
// malformed refs) fails the build.
const RESIDUAL_ENTITY = /&#?[0-9a-zA-Z]+;/;

// Permanent encoding-corruption gate. Mechanical corruption classes that can
// never be legitimate in curated corpus text (mojibake #18/#72 class):
//   - U+FFFD replacement character (a decode already failed upstream)
//   - C0/C1 control residue (only \n is a legal control in poem_text)
//   - lone UTF-16 surrogates (broken code-unit pairs)
// Semantic mojibake (wrong-but-valid characters) remains corpus-review
// territory; these gates catch everything mechanically detectable.
const ENCODING_CORRUPTION = [
  { name: "replacement-char", re: /�/ },
  { name: "control-residue", re: /[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/ },
  { name: "lone-surrogate", re: /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF])/ },
];
const CORRUPTION_CHECKED_FIELDS = [
  "poem_text",
  "original_slip_label",
  "edition_title",
  "edition_date_period",
  "deity_tradition",
  "source_locator",
];
function decodeCharRefs(text, counter) {
  return String(text).replace(/&#(x?)([0-9a-fA-F]+);/g, (match, hex, digits) => {
    const cp = parseInt(digits, hex ? 16 : 10);
    // Only Unicode scalar values may decode. Anything else (out of range,
    // surrogate, zero) is left in place so the residual-entity gate fails the
    // build through the normal fail-closed path — never by throwing.
    if (!Number.isInteger(cp) || cp <= 0 || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) {
      return match;
    }
    counter.n++;
    return String.fromCodePoint(cp);
  });
}

const errors = [];
const gateResults = [];

function gate(name, ok, detail) {
  gateResults.push({ gate: name, ok, detail });
  if (!ok) errors.push(`${name}: ${detail}`);
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

const corpora = [];

for (const spec of MANIFEST) {
  const abs = join(ROOT, spec.file);
  let raw, doc;
  try {
    raw = readFileSync(abs);
    doc = JSON.parse(raw.toString("utf8"));
  } catch (e) {
    gate(`${spec.corpus_id}/readable`, false, `cannot read/parse ${spec.file}: ${e.message}`);
    continue;
  }
  const slips = doc.slips;
  gate(`${spec.corpus_id}/has-slips`, Array.isArray(slips), "slips[] present");
  if (!Array.isArray(slips)) continue;

  gate(
    `${spec.corpus_id}/exact-count`,
    slips.length === spec.expected_count,
    `expected ${spec.expected_count}, got ${slips.length}`
  );

  const numbers = new Set();
  const deities = new Set();
  const decoded = { n: 0 };
  for (const s of slips) {
    const id = `${spec.corpus_id}#${s.slip_number}`;
    s.poem_text = decodeCharRefs(s.poem_text ?? "", decoded);
    s.original_slip_label = decodeCharRefs(s.original_slip_label ?? "", decoded);
    if (RESIDUAL_ENTITY.test(s.poem_text) || RESIDUAL_ENTITY.test(s.original_slip_label)) {
      gate(`${id}/no-residual-entities`, false, `undecodable entity remains in text`);
    }
    for (const field of CORRUPTION_CHECKED_FIELDS) {
      const v = String(s[field] ?? "");
      for (const c of ENCODING_CORRUPTION) {
        if (c.re.test(v)) {
          gate(`${id}/encoding-corruption`, false, `${c.name} in field ${field}`);
        }
      }
    }
    for (const f of REQUIRED_ENTRY_FIELDS) {
      if (s[f] === undefined || s[f] === null || String(s[f]).trim() === "") {
        gate(`${id}/required-field`, false, `missing or empty field: ${f}`);
      }
    }
    if (s.corpus_id !== spec.corpus_id) {
      gate(`${id}/corpus-id-match`, false, `entry corpus_id "${s.corpus_id}" ≠ manifest "${spec.corpus_id}"`);
    }
    if (!Number.isInteger(s.slip_number) || s.slip_number < 1 || s.slip_number > spec.expected_count) {
      gate(`${id}/slip-number-range`, false, `slip_number out of 1..${spec.expected_count}`);
    }
    if (numbers.has(s.slip_number)) {
      gate(`${id}/slip-number-unique`, false, `duplicate slip_number ${s.slip_number}`);
    }
    numbers.add(s.slip_number);
    if (!ALLOWED_TRANSCRIPTION_STATUS.has(s.transcription_status)) {
      gate(`${id}/transcription-status`, false, `status "${s.transcription_status}" not in allowlist`);
    }
    const poem = String(s.poem_text ?? "");
    const cjk = (poem.match(/[㐀-鿿]/g) ?? []).length;
    if (cjk < 8) {
      gate(`${id}/poem-plausible`, false, `poem_text has only ${cjk} CJK chars`);
    }
    for (const frag of BANNED_FRAGMENTS) {
      if (poem.includes(frag)) {
        gate(`${id}/banned-fragment`, false, `poem contains banned seed fragment "${frag}"`);
      }
    }
    if (s.deity_tradition) deities.add(s.deity_tradition);
    // Interpretation must be EMPTY at the source. A non-empty interpretation
    // field reaching this build means content bypassed the governed pipeline —
    // fail closed rather than strip it and ship anyway.
    for (const key of Object.keys(s)) {
      if (!/interpretation/i.test(key)) continue;
      const v = s[key];
      const empty = v === null || v === undefined || (typeof v === "string" && v.trim() === "") ||
        (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
      if (!empty) {
        gate(`${id}/interpretation-empty`, false, `non-empty "${key}" in corpus slip — interpretation may only enter via a governed pipeline`);
      }
    }
  }
  gate(
    `${spec.corpus_id}/complete-sequence`,
    numbers.size === spec.expected_count,
    `unique slip numbers ${numbers.size}/${spec.expected_count}`
  );
  gate(
    `${spec.corpus_id}/single-deity`,
    deities.size === 1,
    `deity_tradition values in corpus: ${[...deities].join(" | ") || "(none)"}`
  );

  corpora.push({ spec, doc, slips, deity: [...deities][0] ?? null, source_sha256: sha256(raw), decoded_char_refs: decoded.n });
}

// Cross-corpus attribution guard: an identical full poem text appearing under
// two different corpora would indicate contamination or mis-attribution.
const poemIndex = new Map();
for (const c of corpora) {
  for (const s of c.slips) {
    const key = String(s.poem_text).replace(/\s+/g, "");
    const prev = poemIndex.get(key);
    if (prev && prev.corpus !== c.spec.corpus_id) {
      gate(
        `cross-corpus/duplicate-poem`,
        false,
        `identical poem in ${prev.corpus}#${prev.n} and ${c.spec.corpus_id}#${s.slip_number}`
      );
    }
    poemIndex.set(key, { corpus: c.spec.corpus_id, n: s.slip_number });
  }
}

// ---------------------------------------------------------------------------
// Fail closed.
// ---------------------------------------------------------------------------
if (errors.length > 0) {
  if (existsSync(POOL_PATH)) rmSync(POOL_PATH);
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(
    REPORT_PATH,
    JSON.stringify({ status: "FAILED", errors, gates: gateResults }, null, 2)
  );
  console.error(`BUILD FAILED — ${errors.length} gate violation(s). Pool NOT emitted (fail-closed).`);
  for (const e of errors.slice(0, 20)) console.error("  ✗ " + e);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Emit pool. Presentation-only fields (display name, emoji) live in the UI
// config, not here; this file carries truth only.
// ---------------------------------------------------------------------------
// Deterministic identity: derived from corpus content only, so rebuilding
// from unchanged sources is byte-identical and never dirties the work tree.
const contentVersion = sha256(corpora.map((c) => `${c.spec.corpus_id}:${c.source_sha256}`).join("\n"));

// Governance-side corpus evidence — goes to the build report only, never to
// the browser artifact (public projection boundary).
const corporaEvidence = corpora.map((c) => ({
  corpus_id: c.spec.corpus_id,
  deity_tradition: c.deity,
  edition_title: c.slips[0].edition_title,
  slip_count: c.slips.length,
  source_file: c.spec.file,
  source_sha256: c.source_sha256,
  data_quality: { decoded_char_refs: c.decoded_char_refs },
  status_summary: c.slips.reduce((acc, s) => ((acc[s.transcription_status] = (acc[s.transcription_status] ?? 0) + 1), acc), {}),
}));

const pool = {
  schema: "draw-pool/1.0",
  content_version: contentVersion,
  policy: {
    allowed_transcription_status: [...ALLOWED_TRANSCRIPTION_STATUS],
    fail_closed: true,
    interpretation: "none — generated interpretation is excluded from production until a governed pipeline exists",
  },
  // Public corpus summary: honest public claims only (what the corpus is, how
  // many slips, transcription-status mix). No file paths, hashes, or
  // data-quality counters — those are research-ledger evidence.
  corpora: corporaEvidence.map(({ corpus_id, deity_tradition, edition_title, slip_count, status_summary }) => ({
    corpus_id, deity_tradition, edition_title, slip_count, status_summary,
  })),
  entries: corpora.flatMap((c) =>
    c.slips.map((s) => ({
      id: `${s.corpus_id}-${String(s.slip_number).padStart(3, "0")}`,
      corpus_id: s.corpus_id,
      deity_tradition: s.deity_tradition,
      slip_number: s.slip_number,
      original_slip_label: s.original_slip_label,
      historical_text: { poem_text: s.poem_text },
      // Public colophon subset. edition_title + transcription_status are
      // load-bearing (slip-render fail-closed registry match ＋ 已對勘／待複核).
      // edition_id / edition_date_period / source_locator are canonical-side
      // governance fields and never ship in the browser artifact.
      provenance: {
        edition_title: s.edition_title,
        transcription_status: s.transcription_status,
      },
      interpretation: null,
    }))
  ),
};

const total = pool.entries.length;
mkdirSync(dirname(POOL_PATH), { recursive: true });
writeFileSync(
  POOL_PATH,
  `// GENERATED by scripts/build-draw-pool.mjs — DO NOT EDIT BY HAND.\n` +
    `// Every entry passed the fail-closed production gates. Regenerate via: node scripts/build-draw-pool.mjs\n` +
    `window.DRAW_POOL = ${JSON.stringify(pool, null, 2)};\n`
);
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(
  REPORT_PATH,
  JSON.stringify(
    {
      content_version: contentVersion,
      status: "PASSED",
      total_entries: total,
      corpora: corporaEvidence,
      gates_evaluated: gateResults.length,
      gate_failures: 0,
      pool_sha256: sha256(readFileSync(POOL_PATH)),
    },
    null,
    2
  )
);
console.log(`BUILD PASSED — ${total} entries emitted to assets/oracles.draw-pool.js`);
for (const c of pool.corpora) {
  console.log(`  ${c.corpus_id}: ${c.slip_count} slips, ${JSON.stringify(c.status_summary)}, deity: ${c.deity_tradition}`);
}
