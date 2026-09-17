// build-interpretation-pool.mjs — 解曰 layer → production artifact (fail-closed).
//
// A SEPARATE data flow from the draw pool. The draw pool's `interpretation: null`
// contract is untouched; The Slip stays frozen. This emits a small id-keyed
// artifact the UI mounts as a COLLAPSED footnote UNDER the paper, never on it.
//
// TRUTH RULES (mirror the slip/pool gates, deliberately conservative):
//   G1 field: ONLY 解曰 (the reflective verse gloss). 聖意 — the per-category
//      fortune grid (求財/婚姻/疾病…) — is a PREDICTIVE register that fights the
//      product's "reflection, not prophecy" line. It is excluded at the source.
//   G2 status: only VERIFIED / PROBABLE enter. UNRESOLVED / CANDIDATE are dropped.
//   G3 encoding: any U+FFFD, □ (textual box), control char, or lone surrogate in
//      an included entry FAILS the build. No strip-and-ship.
//   G4 honesty: status word is a 1:1 translation, never an upgrade
//      (VERIFIED=已對勘, PROBABLE=待複核). manual_image_confirmation is carried
//      verbatim so the UI can mark the human-checked slips without upgrading the rest.
//   G5 edition pin: every SOURCE row's edition must equal EXPECTED_SOURCE_EDITION
//      (exact). The artifact also pins EXPECTED_SLIP_EDITION_TITLE — the exact
//      DRAW_POOL edition the gloss accompanies — which the UI matches exactly.
//   G6 no paraphrase: emitted text must equal a source verbatim string exactly.
//   G7 per-slip custody: each 解曰 is bound slip_no → verbatim_text → edition_id
//      via a committed custody manifest. Swapping two glosses, editing a text, or
//      pointing at a different edition breaks the token and FAILS the build —
//      "both texts exist somewhere in the source" is NOT enough (that was the hole).
//
// Paths are overridable via env (INTERP_SRC / INTERP_OUT / INTERP_REPORT /
// INTERP_CUSTODY) so tests can build a mutated copy in an isolated dir.
// Custody is regenerated CONSCIOUSLY with `--write-custody`, never automatically.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.env.INTERP_SRC || join(ROOT, "data/corpora/guanyin/interpretation_layer.json");
const OUT = process.env.INTERP_OUT || join(ROOT, "assets/interpretation-pool.guanyin.js");
const REPORT = process.env.INTERP_REPORT || join(ROOT, "data/production/interpretation-pool.report.json");
const CUSTODY = process.env.INTERP_CUSTODY || join(ROOT, "data/corpora/guanyin/jieyue_custody.json");
const WRITE_CUSTODY = process.argv.includes("--write-custody");

const CORPUS_ID = "guanyin";
const FIELD = "解曰";
// Interpretation SOURCE edition (the gloss's own witness).
const EDITION_ID = "ed-guanyin-xue2008-appendix2-image";
const EXPECTED_SOURCE_EDITION = "艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像）";
// The DRAW_POOL edition this gloss accompanies (the poem edition on the paper).
// The UI shows 解曰 only when the drawn slip's provenance.edition_title equals this EXACTLY.
const EXPECTED_SLIP_EDITION_TITLE = "艋舺龍山寺《觀世音靈籤》百首（Taiwan production / reference edition，living tradition）";
const ALLOWED_STATUS = new Set(["VERIFIED", "PROBABLE"]);
const STATUS_WORD = { VERIFIED: "已對勘", PROBABLE: "待複核" };

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const badChars = (t) => /\uFFFD|\u25A1|[\u0000-\u001F]|[\uD800-\uDFFF]/.test(t);
const norm = (t) => String(t).normalize("NFC");
// Per-slip custody token: binds edition_id ⨯ slip_no ⨯ exact text. Unit separator
// (U+241F) between fields so no field boundary can be forged by concatenation.
const custodyToken = (slip_no, text) => sha256(`${EDITION_ID}␟${slip_no}␟${norm(text)}`).slice(0, 32);

const errors = [];
const gate = (id, ok, msg) => { if (!ok) errors.push(`${id}: ${msg}`); return ok; };
const die = () => {
  console.error(`BUILD FAILED — ${errors.length} gate violation(s). Artifact NOT emitted (fail-closed).`);
  for (const e of errors.slice(0, 25)) console.error("  ✗ " + e);
  process.exit(1);
};

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const source_sha256 = sha256(readFileSync(SRC));
const all = raw.entries.filter((e) => e.field_type === FIELD);
gate("G1/field-present", all.length > 0, `no ${FIELD} entries in source`);
if (errors.length) die();

// --- G5 edition pin (source side) -----------------------------------------
const editions = [...new Set(all.map((e) => e.edition))];
gate("G5/edition-pin", editions.length === 1 && editions[0] === EXPECTED_SOURCE_EDITION,
  `source edition(s) ${JSON.stringify(editions)} != pinned ${JSON.stringify([EXPECTED_SOURCE_EDITION])}`);

// --- G7 per-slip custody ----------------------------------------------------
// Custody covers EVERY 解曰 slip_no (all 100), so a swap involving an excluded
// slip is caught too. Manifest maps slip_no → token.
const liveCustody = {};
for (const e of all) liveCustody[String(e.slip_no)] = custodyToken(e.slip_no, e.verbatim_text);

if (WRITE_CUSTODY) {
  mkdirSync(dirname(CUSTODY), { recursive: true });
  writeFileSync(CUSTODY, JSON.stringify({
    schema: "jieyue-custody/0.1",
    corpus_id: CORPUS_ID,
    edition_id: EDITION_ID,
    field: FIELD,
    note: "Per-slip custody tokens = sha256(edition_id ⨯ slip_no ⨯ NFC(verbatim_text))[:32]. Regenerate ONLY on a conscious, reviewed source change: node scripts/build-interpretation-pool.mjs --write-custody",
    tokens: Object.fromEntries(Object.keys(liveCustody).sort((a, b) => +a - +b).map((k) => [k, liveCustody[k]])),
  }, null, 2) + "\n");
  console.log(`custody manifest written: ${Object.keys(liveCustody).length} tokens → ${CUSTODY.replace(ROOT + "/", "")}`);
  process.exit(0);
}

gate("G7/custody-present", existsSync(CUSTODY), `custody manifest missing (${CUSTODY}) — generate with --write-custody`);
if (!errors.length) {
  const manifest = JSON.parse(readFileSync(CUSTODY, "utf8"));
  gate("G7/custody-edition", manifest.edition_id === EDITION_ID, `custody edition_id ${manifest.edition_id} != ${EDITION_ID}`);
  const expected = manifest.tokens || {};
  const liveKeys = Object.keys(liveCustody).sort();
  const expKeys = Object.keys(expected).sort();
  gate("G7/custody-coverage", liveKeys.join(",") === expKeys.join(","),
    `custody slip set differs from source (added ${liveKeys.filter((k) => !expected[k])}, missing ${expKeys.filter((k) => !liveCustody[k])})`);
  for (const k of liveKeys) {
    gate(`G7/custody/${k}`, expected[k] === liveCustody[k],
      `slip ${k} custody mismatch — verbatim_text/edition changed or two glosses swapped (expected ${expected[k]}, got ${liveCustody[k]})`);
  }
}
if (errors.length) die();

// --- build emitted set ------------------------------------------------------
const entries = {};
let confirmed = 0;
const sourceTexts = new Set(all.map((e) => e.verbatim_text));
for (const e of all) {
  if (!ALLOWED_STATUS.has(e.transcription_status)) continue;               // G2
  if (badChars(e.verbatim_text)) {                                          // G3
    gate(`G3/${e.slip_no}`, false, `included ${FIELD} #${e.slip_no} carries a box/replacement/control char`);
    continue;
  }
  if (!Object.hasOwn(STATUS_WORD, e.transcription_status)) {                // G4
    gate(`G4/${e.slip_no}`, false, `status "${e.transcription_status}" has no honest word`);
    continue;
  }
  if (!sourceTexts.has(e.verbatim_text)) {                                  // G6 (defensive)
    gate(`G6/${e.slip_no}`, false, `emitted text not a verbatim source string`);
    continue;
  }
  const id = `${CORPUS_ID}-${String(e.slip_no).padStart(3, "0")}`;
  entries[id] = {
    slip_no: e.slip_no,
    text: e.verbatim_text,
    status: e.transcription_status,
    confirmed: e.manual_image_confirmation === true,
    custody: liveCustody[String(e.slip_no)],
  };
  if (e.manual_image_confirmation === true) confirmed++;
}
if (errors.length) die();

const ids = Object.keys(entries).sort();
const content_version = sha256(
  [EDITION_ID, EXPECTED_SLIP_EDITION_TITLE, ...ids.map((id) => `${id}:${entries[id].custody}:${entries[id].status}:${entries[id].confirmed}`)].join("\n")
);

const artifact = {
  schema: "interpretation-pool/0.1",
  layer: "historical_interpretation",
  field: FIELD,
  corpus_id: CORPUS_ID,
  edition_id: EDITION_ID,
  edition: EXPECTED_SOURCE_EDITION,
  expected_slip_edition_title: EXPECTED_SLIP_EDITION_TITLE,
  status_word: STATUS_WORD,
  note: "解曰 verbatim from the edition. NOT Draw One's voice; NOT prophecy; 聖意 (fortune grid) excluded at source. Shown as a collapsed footnote under the slip, default closed. Version-locked to expected_slip_edition_title (exact) + edition_id + content_version; per-slip custody in each entry.",
  content_version,
  count: ids.length,
  entries,
};

// --- emit (only after EVERY gate passed — build fail leaves prior files intact) ---
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT,
  `// GENERATED by scripts/build-interpretation-pool.mjs — DO NOT EDIT BY HAND.\n` +
  `// 解曰 layer, fail-closed. Regenerate: node scripts/build-interpretation-pool.mjs\n` +
  `window.INTERPRETATION_POOL = ${JSON.stringify(artifact, null, 2)};\n`);

mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, JSON.stringify({
  built_at_note: "content-derived; no wallclock in artifact",
  source_file: "data/corpora/guanyin/interpretation_layer.json",
  source_sha256,
  edition_id: EDITION_ID,
  field: FIELD,
  excluded_field: "聖意 (predictive fortune grid — out of product scope)",
  source_distribution: "100 解曰: 94 PROBABLE, 5 UNRESOLVED (12,20,35,65,77), 1 CANDIDATE (44)",
  candidates: all.length,
  emitted: ids.length,
  confirmed,
  probable: ids.length - confirmed,
  dropped: all.length - ids.length,
  content_version,
}, null, 2) + "\n");

console.log(`interpretation pool: ${ids.length}/${all.length} 解曰 emitted (${confirmed} 已核圖, ${ids.length - confirmed} 待複核), ${all.length - ids.length} dropped. custody ${Object.keys(liveCustody).length}/100 verified. content_version ${content_version.slice(0, 12)}`);
