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
//      verbatim so the UI can mark the 13 human-checked slips without upgrading
//      the other 81.
//   G5 edition pin: the emitted `edition` must equal EXPECTED_EDITION; a corpus
//      that changes upstream fails closed until this file is consciously updated.
//   G6 no Draw One voice: this layer carries ONLY the edition's own verbatim
//      text. No paraphrase, no modern rewrite, no generated content — those are
//      a different (governed, not-yet-built) pipeline.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "data/corpora/guanyin/interpretation_layer.json");
const OUT = join(ROOT, "assets/interpretation-pool.guanyin.js");
const REPORT = join(ROOT, "data/production/interpretation-pool.report.json");

const CORPUS_ID = "guanyin";
const FIELD = "解曰";
const EXPECTED_EDITION = "艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像）";
const ALLOWED_STATUS = new Set(["VERIFIED", "PROBABLE"]);
const STATUS_WORD = { VERIFIED: "已對勘", PROBABLE: "待複核" };

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const badChars = (t) => /\uFFFD|\u25A1|[\u0000-\u001F]|[\uD800-\uDFFF]/.test(t);

const errors = [];
const gate = (id, ok, msg) => { if (!ok) errors.push(`${id}: ${msg}`); return ok; };

const raw = JSON.parse(readFileSync(SRC, "utf8"));
const source_sha256 = sha256(readFileSync(SRC));

const all = raw.entries.filter((e) => e.field_type === FIELD);
gate("G1/field-present", all.length > 0, `no ${FIELD} entries in source`);

const entries = {};
let confirmed = 0;
for (const e of all) {
  // G2: status allowlist
  if (!ALLOWED_STATUS.has(e.transcription_status)) continue;
  // G3: encoding — an included entry with a box/replacement char fails the build,
  // rather than being silently dropped (a dropped slip is fine; a corrupt one shipped is not).
  if (badChars(e.verbatim_text)) {
    gate(`G3/${e.slip_no}`, false, `included ${FIELD} #${e.slip_no} carries a box/replacement/control char`);
    continue;
  }
  // G4: honest status word must exist
  if (!Object.hasOwn(STATUS_WORD, e.transcription_status)) {
    gate(`G4/${e.slip_no}`, false, `status "${e.transcription_status}" has no honest word`);
    continue;
  }
  const id = `${CORPUS_ID}-${String(e.slip_no).padStart(3, "0")}`;
  entries[id] = {
    text: e.verbatim_text,
    status: e.transcription_status,
    confirmed: e.manual_image_confirmation === true,
  };
  if (e.manual_image_confirmation === true) confirmed++;
}

// G5: edition pin — every source row must declare the pinned edition.
const editions = [...new Set(all.map((e) => e.edition))];
gate("G5/edition-pin", editions.length === 1 && editions[0] === EXPECTED_EDITION,
  `source edition(s) ${JSON.stringify(editions)} != pinned ${JSON.stringify([EXPECTED_EDITION])}`);

// G6: no paraphrase — assert emitted text is a verbatim substring-set of the source
// (identity check: emitted text must equal a source verbatim_text exactly).
const sourceTexts = new Set(all.map((e) => e.verbatim_text));
for (const [id, v] of Object.entries(entries)) {
  gate(`G6/${id}`, sourceTexts.has(v.text), `emitted text for ${id} is not a verbatim source string`);
}

if (errors.length) {
  console.error(`BUILD FAILED — ${errors.length} gate violation(s). Artifact NOT emitted (fail-closed).`);
  for (const e of errors.slice(0, 20)) console.error("  ✗ " + e);
  process.exit(1);
}

const ids = Object.keys(entries).sort();
const content_version = sha256(EXPECTED_EDITION + "\n" + ids.map((id) => `${id}:${entries[id].text}:${entries[id].status}:${entries[id].confirmed}`).join("\n"));

const artifact = {
  schema: "interpretation-pool/0.1",
  layer: "historical_interpretation",
  field: FIELD,
  corpus_id: CORPUS_ID,
  edition: EXPECTED_EDITION,
  status_word: STATUS_WORD,
  note: "解曰 verbatim from the edition. NOT Draw One's voice; NOT prophecy; 聖意 (fortune grid) excluded at source. Shown as a collapsed footnote under the slip, default closed.",
  content_version,
  count: ids.length,
  entries,
};

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
  field: FIELD,
  excluded_field: "聖意 (predictive fortune grid — out of product scope)",
  candidates: all.length,
  emitted: ids.length,
  confirmed,
  probable: ids.length - confirmed,
  dropped: all.length - ids.length,
  content_version,
}, null, 2) + "\n");

console.log(`interpretation pool: ${ids.length}/${all.length} 解曰 emitted (${confirmed} 已核圖, ${ids.length - confirmed} 待複核), ${all.length - ids.length} dropped. content_version ${content_version.slice(0, 12)}`);
