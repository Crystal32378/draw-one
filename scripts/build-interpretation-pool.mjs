// build-interpretation-pool.mjs — 解曰 layer → production artifacts (fail-closed).
//
// A SEPARATE data flow from the draw pool. The draw pool's `interpretation: null`
// contract is untouched; The Slip stays frozen. This emits small id-keyed
// artifacts the UI mounts as a COLLAPSED footnote UNDER the paper, never on it.
//
// THREE HALLS (2026-11): one manifest, one set of gates.
//   guanyin     → assets/interpretation-pool.guanyin.js   (window.INTERPRETATION_POOL — unchanged, byte-identical)
//   guandi      → assets/interpretation-pool.guandi.js    (window.INTERPRETATION_POOL_GUANDI)
//   liushijiazi → NO pool. Held at corpus level (license unresolved + single-pass OCR).
//   + assets/interpretation-holds.js (window.INTERPRETATION_HOLDS): what is
//     deliberately NOT shown, and why — so the page can say so instead of going silent.
//
// TRUTH RULES (mirror the slip/pool gates, deliberately conservative):
//   G1 field: this artifact remains 解曰-only. Crystal subsequently requested
//      historical 聖意 too: scripts/build-shengyi-pool.mjs now preserves those
//      exact candidates in a separately labelled, collapsed reading section.
//      Its source pins do not imply manual verification or personalized advice.
//   DISPLAY POLICY 2026-11-15 (Crystal): 待複核不等於隱藏. Every 解曰 of 觀音/關帝 is shown
//   as the source has it — old glyphs kept, lacunae kept as □ — with its real status and
//   its doubt. Nothing is corrected, completed or upgraded to make it presentable; the
//   detailed doubts live on the proofreading pages (paper/corpus-review-*.html).
//   G2 status: all four source statuses enter, each under its own honest word. An
//      UNRESOLVED / CANDIDATE row is emitted with doubt="unsettled_transcription".
//   G3 encoding: U+FFFD, a control char or a lone surrogate FAILS the build. □ (textual
//      box = a character the transcription could not read) may appear ONLY in a row whose
//      status is UNRESOLVED/CANDIDATE; a □ in a "settled" row still fails. No strip-and-ship.
//   G4 honesty: status word is a 1:1 translation, never an upgrade (VERIFIED=已對勘,
//      PROBABLE=待複核, CANDIDATE=候選讀法, UNRESOLVED=有缺字). manual_image_confirmation is
//      carried verbatim so the UI can mark the human-checked slips without upgrading the rest.
//   G5 edition pin: every SOURCE row's edition must equal the corpus's pinned
//      source edition (exact). The artifact also pins expected_slip_edition_title —
//      the exact DRAW_POOL edition the gloss accompanies — which the UI matches exactly.
//   G6 no paraphrase: emitted text must equal a source verbatim string exactly.
//   G7 per-slip custody: each 解曰 is bound slip_no → verbatim_text → edition_id
//      via a committed custody manifest. Swapping two glosses, editing a text, or
//      pointing at a different edition breaks the token and FAILS the build.
//   G8 flagged-reading ledger (corpora with `notes_require_hold`): a 解曰 whose
//      source row carries a variants/anomaly note may NOT ship silently. It must be
//      on the committed ledger (jieyue_holds.json → emitted WITH doubt=<reason_code>, so
//      the page marks it) or the build FAILS. A ledger row pointing at a missing slip also
//      fails. (The file keeps its name; since 2026-11-15 a row means "shown, marked as
//      doubtful", no longer "withheld".)
//   G9 corpus hold is evidence-bound: 六十甲子 is withheld because (a) the temple
//      source's reuse licence is unresolved and (b) the transcription is single-pass
//      OCR with no human image check. The build recomputes both from the corpus
//      package; if NEITHER still holds, the build FAILS — the hold must be
//      consciously revisited, never left stale.
//
// Atomic: every corpus is validated first; files are written only after EVERY
// gate of EVERY corpus passed. A failed build leaves prior files intact.
//
// Env overrides (tests build a mutated copy in an isolated dir). They address ONE
// corpus — INTERP_CORPUS (default "guanyin" when any override is present):
//   INTERP_SRC / INTERP_OUT / INTERP_REPORT / INTERP_CUSTODY / INTERP_HOLDS
// With overrides the holds artifact is written only if INTERP_HOLDS_OUT is set.
// Custody is regenerated CONSCIOUSLY with `--write-custody`, never automatically.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const rel = (p) => p.replace(ROOT + "/", "");
const WRITE_CUSTODY = process.argv.includes("--write-custody");

const FIELD = "解曰";
const SETTLED_STATUS = new Set(["VERIFIED", "PROBABLE"]);
const STATUS_WORD = { VERIFIED: "已對勘", PROBABLE: "待複核", CANDIDATE: "候選讀法", UNRESOLVED: "有缺字" };
const POOL_SCHEMA = "interpretation-pool/0.2"; // 0.2: every status shown; entries may carry `doubt` + `locator`

const MANIFEST = {
  guanyin: {
    global: "INTERPRETATION_POOL",
    src: "data/corpora/guanyin/interpretation_layer.json",
    out: "assets/interpretation-pool.guanyin.js",
    report: "data/production/interpretation-pool.report.json",
    custody: "data/corpora/guanyin/jieyue_custody.json",
    holds: null,
    notes_require_hold: false, // notes here are the per-slip correction ledger, not open anomalies
    expected_total: 100,
    // Interpretation SOURCE edition (the gloss's own witness).
    edition_id: "ed-guanyin-xue2008-appendix2-image",
    source_edition: "艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像）",
    // The DRAW_POOL edition this gloss accompanies (the poem edition on the paper).
    slip_edition_title: "艋舺龍山寺《觀世音靈籤》百首（Taiwan production / reference edition，living tradition）",
    source_distribution: "100 解曰: 94 PROBABLE, 5 UNRESOLVED (12,20,35,65,77), 1 CANDIDATE (44)",
    // 頁碼只取來源欄裡的 pNNN（論文附錄二的頁）；取不到就失敗，不猜。
    emit_locator: (e) => { const m = String(e.source_locator).match(/\bp(\d{2,3})\b/); if (!m) throw new Error(`guanyin #${e.slip_no}: no page in source_locator`); return `附錄二 p${m[1]}`; },
  },
  guandi: {
    global: "INTERPRETATION_POOL_GUANDI",
    src: "data/corpora/guandi/interpretation_layer.json",
    out: "assets/interpretation-pool.guandi.js",
    report: "data/production/interpretation-pool.guandi.report.json",
    custody: "data/corpora/guandi/jieyue_custody.json",
    holds: "data/corpora/guandi/jieyue_holds.json",
    notes_require_hold: true,
    expected_total: 100,
    // Same edition as the poem on the paper (historical_editions.json); the witness
    // is the Wikisource transcription — 道藏影像尚未逐籤核對, so nothing is 已核圖.
    edition_id: "ed-guandi-daozang-fuye-1225",
    source_edition: "護國嘉濟江東王靈籤（傅燁撰，道藏本／維基文庫 transcription）",
    slip_edition_title: "《護國嘉濟江東王靈籤》（傅燁撰，道藏本）",
    source_distribution: "100 解曰: 99 PROBABLE, 1 UNRESOLVED (100)",
    emit_locator: null, // per-slip Wikisource subpage URLs not re-verified → not surfaced
  },
};

// 六十甲子: corpus-level hold. No pool is ever built from this layer here.
const CORPUS_HOLD = {
  corpus_id: "liushijiazi",
  layer: "data/corpora/liushijiazi/interpretation_layer.json",
  sources: "data/corpora/liushijiazi/sources.json",
  source_id: "src-beigang-official",
  cleared_license: new Set(["cleared", "permitted", "public_domain", "public_domain_supported"]),
};
const HOLDS_OUT_DEFAULT = "assets/interpretation-holds.js";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const badChars = (t) => /�|[\u0000-\u001F]|[\uD800-\uDFFF]/.test(t);
const hasBox = (t) => /□/.test(t);
const norm = (t) => String(t).normalize("NFC");

const errors = [];
const gate = (id, ok, msg) => { if (!ok) errors.push(`${id}: ${msg}`); return ok; };
const die = () => {
  console.error(`BUILD FAILED — ${errors.length} gate violation(s). Artifact NOT emitted (fail-closed).`);
  for (const e of errors.slice(0, 25)) console.error("  ✗ " + e);
  process.exit(1);
};

// --- which corpora, which paths ----------------------------------------------
const OVERRIDE_KEYS = ["INTERP_SRC", "INTERP_OUT", "INTERP_REPORT", "INTERP_CUSTODY", "INTERP_HOLDS"];
const overridden = OVERRIDE_KEYS.some((k) => process.env[k]) || !!process.env.INTERP_CORPUS;
const only = overridden ? (process.env.INTERP_CORPUS || "guanyin") : null;
if (only && !Object.hasOwn(MANIFEST, only)) { gate("manifest", false, `unknown INTERP_CORPUS "${only}"`); die(); }
const targets = only ? [only] : Object.keys(MANIFEST);
const pathOf = (cid, key, envKey) => (only === cid && process.env[envKey]) || (MANIFEST[cid][key] ? join(ROOT, MANIFEST[cid][key]) : null);

// --- per-corpus build (pure: returns what to write, writes nothing) -----------
function buildCorpus(cid) {
  const M = MANIFEST[cid];
  const SRC = pathOf(cid, "src", "INTERP_SRC");
  const CUSTODY = pathOf(cid, "custody", "INTERP_CUSTODY");
  const HOLDS = pathOf(cid, "holds", "INTERP_HOLDS");
  const G = (id, ok, msg) => gate(`${cid}/${id}`, ok, msg);
  const custodyToken = (slip_no, text) => sha256(`${M.edition_id}␟${slip_no}␟${norm(text)}`).slice(0, 32);

  if (!G("G1/source-present", existsSync(SRC), `source missing (${rel(SRC)})`)) return null;
  const rawBuf = readFileSync(SRC);
  const raw = JSON.parse(rawBuf.toString("utf8"));
  const all = raw.entries.filter((e) => e.field_type === FIELD);
  if (!G("G1/field-present", all.length > 0, `no ${FIELD} entries in source`)) return null;

  // G5 edition pin (source side)
  const editions = [...new Set(all.map((e) => e.edition))];
  G("G5/edition-pin", editions.length === 1 && editions[0] === M.source_edition,
    `source edition(s) ${JSON.stringify(editions)} != pinned ${JSON.stringify([M.source_edition])}`);

  // G7 per-slip custody — covers EVERY 解曰 slip_no, so a swap involving an
  // excluded slip is caught too.
  const liveCustody = {};
  for (const e of all) liveCustody[String(e.slip_no)] = custodyToken(e.slip_no, e.verbatim_text);

  if (WRITE_CUSTODY) {
    return { cid, custodyWrite: { path: CUSTODY, body: JSON.stringify({
      schema: "jieyue-custody/0.1",
      corpus_id: cid,
      edition_id: M.edition_id,
      field: FIELD,
      note: "Per-slip custody tokens = sha256(edition_id ⨯ slip_no ⨯ NFC(verbatim_text))[:32]. Regenerate ONLY on a conscious, reviewed source change: node scripts/build-interpretation-pool.mjs --write-custody",
      tokens: Object.fromEntries(Object.keys(liveCustody).sort((a, b) => +a - +b).map((k) => [k, liveCustody[k]])),
    }, null, 2) + "\n", count: Object.keys(liveCustody).length } };
  }

  if (G("G7/custody-present", existsSync(CUSTODY), `custody manifest missing (${rel(CUSTODY)}) — generate with --write-custody`)) {
    const manifest = JSON.parse(readFileSync(CUSTODY, "utf8"));
    G("G7/custody-edition", manifest.edition_id === M.edition_id, `custody edition_id ${manifest.edition_id} != ${M.edition_id}`);
    const expected = manifest.tokens || {};
    const liveKeys = Object.keys(liveCustody).sort();
    const expKeys = Object.keys(expected).sort();
    G("G7/custody-coverage", liveKeys.join(",") === expKeys.join(","),
      `custody slip set differs from source (added ${liveKeys.filter((k) => !expected[k])}, missing ${expKeys.filter((k) => !liveCustody[k])})`);
    for (const k of liveKeys) {
      G(`G7/custody/${k}`, expected[k] === liveCustody[k],
        `slip ${k} custody mismatch — verbatim_text/edition changed or two glosses swapped (expected ${expected[k]}, got ${liveCustody[k]})`);
    }
  }

  // G8 committed hold list (flagged readings that must not ship silently)
  const held = new Map(); // slip_no → reason_code
  if (M.holds) {
    if (G("G8/holds-present", existsSync(HOLDS), `hold list missing (${rel(HOLDS)})`)) {
      const h = JSON.parse(readFileSync(HOLDS, "utf8"));
      G("G8/holds-edition", h.edition_id === M.edition_id && h.corpus_id === cid, `hold list is for ${h.corpus_id}/${h.edition_id}`);
      for (const row of h.holds || []) {
        const src = all.find((e) => e.slip_no === row.slip_no);
        G(`G8/hold/${row.slip_no}`, !!src && typeof row.reason_code === "string" && row.reason_code.length > 0,
          `hold points at a missing slip or has no reason_code`);
        held.set(row.slip_no, row.reason_code);
      }
    }
  }

  // --- emitted set + withheld ledger -----------------------------------------
  const entries = {};
  const withheld = {}; // slip_no → reason_code. Empty since 2026-11-15: nothing is withheld at slip level.
  const doubted = {};  // slip_no → reason_code: shown, and marked as doubtful
  let confirmed = 0;
  const sourceTexts = new Set(all.map((e) => e.verbatim_text));
  for (const e of all) {
    if (!Object.hasOwn(STATUS_WORD, e.transcription_status)) {                // G2/G4
      G(`G4/${e.slip_no}`, false, `status "${e.transcription_status}" has no honest word`);
      continue;
    }
    const settled = SETTLED_STATUS.has(e.transcription_status);
    // doubt: the stronger reason wins (an unread character outranks a flagged reading).
    const doubt = !settled ? "unsettled_transcription" : held.has(e.slip_no) ? held.get(e.slip_no) : null;
    if (settled && !doubt && M.notes_require_hold && String(e.variants_or_notes || "").trim() !== "") { // G8 (unledgered note)
      G(`G8/unheld-note/${e.slip_no}`, false,
        `${FIELD} #${e.slip_no} carries a variants/anomaly note but is not on the hold list — decide consciously (hold it, or clear the note upstream)`);
      continue;
    }
    if (badChars(e.verbatim_text) || (settled && hasBox(e.verbatim_text))) {  // G3
      G(`G3/${e.slip_no}`, false, `included ${FIELD} #${e.slip_no} carries a box/replacement/control char`);
      continue;
    }
    if (!sourceTexts.has(e.verbatim_text)) {                                  // G6 (defensive)
      G(`G6/${e.slip_no}`, false, `emitted text not a verbatim source string`);
      continue;
    }
    const id = `${cid}-${String(e.slip_no).padStart(3, "0")}`;
    entries[id] = {
      slip_no: e.slip_no,
      text: e.verbatim_text,
      status: e.transcription_status,
      confirmed: e.manual_image_confirmation === true,
      custody: liveCustody[String(e.slip_no)],
      ...(doubt ? { doubt } : {}),
      ...(M.emit_locator ? { locator: M.emit_locator(e) } : {}),
    };
    if (doubt) doubted[String(e.slip_no)] = doubt;
    if (e.manual_image_confirmation === true) confirmed++;
  }
  // A held slip that is ALSO dropped by status keeps the status reason (the stronger one).
  G("G1/total", all.length === M.expected_total, `expected ${M.expected_total} ${FIELD}, source has ${all.length}`);

  const ids = Object.keys(entries).sort();
  const content_version = sha256(
    [M.edition_id, M.slip_edition_title, ...ids.map((id) => `${id}:${entries[id].custody}:${entries[id].status}:${entries[id].confirmed}:${entries[id].doubt ?? ""}:${entries[id].locator ?? ""}`)].join("\n")
  );

  const artifact = {
    schema: POOL_SCHEMA,
    layer: "historical_interpretation",
    field: FIELD,
    corpus_id: cid,
    edition_id: M.edition_id,
    edition: M.source_edition,
    expected_slip_edition_title: M.slip_edition_title,
    status_word: STATUS_WORD,
    note: "解曰 verbatim from the edition. NOT Draw One's voice; NOT prophecy; 聖意 (fortune grid) excluded at source. Shown as a collapsed footnote under the slip, default closed. Version-locked to expected_slip_edition_title (exact) + edition_id + content_version; per-slip custody in each entry.",
    content_version,
    count: ids.length,
    entries,
  };

  const report = {
    built_at_note: "content-derived; no wallclock in artifact",
    source_file: M.src,
    source_sha256: sha256(rawBuf),
    edition_id: M.edition_id,
    field: FIELD,
    excluded_field: "聖意 (predictive fortune grid — out of product scope)",
    source_distribution: M.source_distribution,
    candidates: all.length,
    emitted: ids.length,
    confirmed,
    probable: ids.length - confirmed,
    dropped: all.length - ids.length,
    shown_with_doubt: doubted,
    ...(M.holds ? { withheld } : {}),
    content_version,
  };

  return {
    cid, artifact, report, withheld,
    outPath: pathOf(cid, "out", "INTERP_OUT"),
    reportPath: pathOf(cid, "report", "INTERP_REPORT"),
    line: `interpretation pool [${cid}]: ${ids.length}/${all.length} 解曰 emitted (${confirmed} 已核圖, ${ids.length - confirmed} 未核圖；其中 ${Object.keys(doubted).length} 首標示疑字／缺字), ${all.length - ids.length} dropped. custody ${Object.keys(liveCustody).length}/${M.expected_total} verified. content_version ${content_version.slice(0, 12)}`,
  };
}

// --- G9 corpus-level hold: recompute the reasons from the corpus package ------
function buildCorpusHold() {
  const H = CORPUS_HOLD;
  const G = (id, ok, msg) => gate(`${H.corpus_id}/${id}`, ok, msg);
  // INTERP_LSJZ_LAYER / INTERP_LSJZ_SOURCES: test-only overrides for the G9 counter-examples.
  const layerPath = process.env.INTERP_LSJZ_LAYER || join(ROOT, H.layer);
  const sourcesPath = process.env.INTERP_LSJZ_SOURCES || join(ROOT, H.sources);
  if (!G("G9/package-present", existsSync(layerPath) && existsSync(sourcesPath), "corpus package missing")) return null;
  const layer = JSON.parse(readFileSync(layerPath, "utf8"));
  const src = JSON.parse(readFileSync(sourcesPath, "utf8")).find((s) => s.source_id === H.source_id);
  if (!G("G9/source-row", !!src, `source ${H.source_id} not in sources.json`)) return null;
  const n = layer.entries.length;
  const by = (s) => layer.entries.filter((e) => e.transcription_status === s).length;
  const humanChecked = layer.entries.filter((e) => e.manual_image_confirmation === true).length;
  const licenseUnresolved = !(H.cleared_license.has(src.license_status) && H.cleared_license.has(src.item_license_status));
  const singlePass = by("CANDIDATE") > 0 && humanChecked === 0;
  const reasons = [...(licenseUnresolved ? ["license_unresolved"] : []), ...(singlePass ? ["single_pass_ocr"] : [])];
  G("G9/hold-still-justified", reasons.length > 0,
    "六十甲子 hold has no remaining basis (licence cleared AND transcription checked) — revisit the decision; do not ship or keep a stale hold");
  return {
    scope: "corpus",
    reasons,
    evidence: {
      license_status: src.license_status,
      item_license_status: src.item_license_status,
      layer_status: layer.status ?? null,
      entries: n, probable: by("PROBABLE"), candidate: by("CANDIDATE"), unresolved: by("UNRESOLVED"),
      human_image_confirmed: humanChecked,
    },
    official_url: src.url,
    official_name: src.institution,
  };
}

// --- run ----------------------------------------------------------------------
const built = targets.map(buildCorpus);
if (errors.length) die();

if (WRITE_CUSTODY) {
  for (const b of built) {
    mkdirSync(dirname(b.custodyWrite.path), { recursive: true });
    writeFileSync(b.custodyWrite.path, b.custodyWrite.body);
    console.log(`custody manifest written [${b.cid}]: ${b.custodyWrite.count} tokens → ${rel(b.custodyWrite.path)}`);
  }
  process.exit(0);
}

const HOLDS_OUT = only ? (process.env.INTERP_HOLDS_OUT || null) : join(ROOT, HOLDS_OUT_DEFAULT);
let holdsArtifact = null;
if (HOLDS_OUT) {
  const corpusHold = buildCorpusHold();
  if (errors.length) die();
  const corpora = {};
  for (const b of built) {
    corpora[b.cid] = {
      scope: "slip",
      edition_id: b.artifact.edition_id,
      content_version: b.artifact.content_version, // bound to the pool it sits beside
      slips: Object.fromEntries(Object.keys(b.withheld).sort((a, c) => +a - +c).map((k) => [k, b.withheld[k]])),
    };
  }
  corpora[CORPUS_HOLD.corpus_id] = corpusHold;
  holdsArtifact = {
    schema: "interpretation-holds/0.1",
    note: "What the 解曰 layer deliberately does NOT show, and why. Reason codes only — no withheld text ever enters this file. Since 2026-11-15 nothing is withheld at slip level in 觀音/關帝 (doubtful rows are shown and marked inside the pools); only the 六十甲子 temple commentary remains held at corpus level.",
    reason_codes: {
      unsettled_transcription: "source status UNRESOLVED/CANDIDATE (missing or undecided characters)",
      suspect_reading: "a character in the transcription is flagged as a likely misreading; not yet checked against the original image",
      irregular_form: "the transcription's form/punctuation is irregular for this edition; not yet checked against the original image",
      license_unresolved: "reuse licence of the source text is not confirmed",
      single_pass_ocr: "transcription is single-pass OCR with no human image check",
    },
    corpora,
  };
}

// emit — only after EVERY gate of EVERY corpus passed
for (const b of built) {
  mkdirSync(dirname(b.outPath), { recursive: true });
  writeFileSync(b.outPath,
    `// GENERATED by scripts/build-interpretation-pool.mjs — DO NOT EDIT BY HAND.\n` +
    `// 解曰 layer, fail-closed. Regenerate: node scripts/build-interpretation-pool.mjs\n` +
    `window.${MANIFEST[b.cid].global} = ${JSON.stringify(b.artifact, null, 2)};\n`);
  mkdirSync(dirname(b.reportPath), { recursive: true });
  writeFileSync(b.reportPath, JSON.stringify(b.report, null, 2) + "\n");
}
if (holdsArtifact) {
  mkdirSync(dirname(HOLDS_OUT), { recursive: true });
  writeFileSync(HOLDS_OUT,
    `// GENERATED by scripts/build-interpretation-pool.mjs — DO NOT EDIT BY HAND.\n` +
    `// What the 解曰 layer withholds, and why (reason codes only). Regenerate with the pools.\n` +
    `window.INTERPRETATION_HOLDS = ${JSON.stringify(holdsArtifact, null, 2)};\n`);
}
for (const b of built) console.log(b.line);
if (holdsArtifact) {
  const c = holdsArtifact.corpora;
  console.log(`interpretation holds: ${Object.entries(c).map(([k, v]) => v.scope === "corpus" ? `${k}=整套暫緩(${v.reasons.join("+")})` : `${k}=${Object.keys(v.slips).length} 首`).join(", ")}`);
}
