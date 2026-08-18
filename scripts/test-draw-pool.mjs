#!/usr/bin/env node
/**
 * test-draw-pool.mjs — Production truth-layer regression suite.
 *
 * Run: node scripts/test-draw-pool.mjs
 * Exit code 0 = all gates hold. Any failure = exit 1.
 *
 * Guarantees under test:
 *   T1  Public draw pool contains exactly the 260 curated entries.
 *   T2  Every pool entry's poem is byte-identical to its corpus source
 *       (slip_number ↔ text mapping cannot drift).
 *   T3  Deity ↔ corpus mapping is exact; no cross-attribution possible.
 *   T4  Unverified / tampered content cannot pass the build (fail-closed).
 *   T5  The public page has no inline slip content, no banned fake-seed
 *       fragments, no oracle-voice loading copy, and only draws from the pool.
 *   T6  Interpretation is null in production, and the interpretation voice
 *       lint rejects oracle-voice / imperative-life-decision text.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

function loadPool() {
  const src = readFileSync(join(ROOT, "assets", "oracles.draw-pool.js"), "utf8");
  const json = src.slice(src.indexOf("window.DRAW_POOL = ") + "window.DRAW_POOL = ".length).replace(/;\s*$/, "");
  return JSON.parse(json);
}

// Rebuild from source so the suite tests the current corpus, not a stale pool.
console.log("T0 rebuild pool from corpus sources");
execFileSync("node", [join(ROOT, "scripts", "build-draw-pool.mjs")], { stdio: "pipe" });
const pool = loadPool();

// ---------------------------------------------------------------------------
console.log("T1 pool completeness (260 = 100 + 100 + 60)");
check("total entries = 260", pool.entries.length === 260, `got ${pool.entries.length}`);
const byCorpus = Object.fromEntries(
  ["guanyin", "guandi", "liushijiazi"].map((c) => [c, pool.entries.filter((e) => e.corpus_id === c)])
);
check("guanyin = 100", byCorpus.guanyin.length === 100);
check("guandi = 100", byCorpus.guandi.length === 100);
check("liushijiazi = 60", byCorpus.liushijiazi.length === 60);
check(
  "all entry ids unique",
  new Set(pool.entries.map((e) => e.id)).size === pool.entries.length
);

// ---------------------------------------------------------------------------
console.log("T2 slip_number ↔ poem_text byte-identical to corpus source");
let mismatches = 0;
for (const corpusId of Object.keys(byCorpus)) {
  const src = JSON.parse(readFileSync(join(ROOT, "data", "corpora", corpusId, "slip_texts.json"), "utf8"));
  const bySlip = new Map(src.slips.map((s) => [s.slip_number, s]));
  for (const e of byCorpus[corpusId]) {
    const s = bySlip.get(e.slip_number);
    if (!s || s.poem_text !== e.historical_text.poem_text) mismatches++;
    if (!s || s.original_slip_label !== e.original_slip_label) mismatches++;
    if (!s || s.edition_title !== e.provenance.edition_title) mismatches++;
    if (!s || s.transcription_status !== e.provenance.transcription_status) mismatches++;
  }
}
check("0 field mismatches across all 260 entries", mismatches === 0, `${mismatches} mismatches`);

// ---------------------------------------------------------------------------
console.log("T3 deity ↔ corpus mapping (no cross-attribution)");
const EXPECTED_DEITY = {
  guanyin: "觀音（living-tradition mapping）",
  guandi: "關帝（living-tradition mapping）",
  liushijiazi: "媽祖（北港朝天宮，living-tradition mapping）",
};
for (const [corpusId, deity] of Object.entries(EXPECTED_DEITY)) {
  check(
    `${corpusId} → ${deity}`,
    byCorpus[corpusId].every((e) => e.deity_tradition === deity)
  );
}
check(
  "no entry carries another corpus's deity",
  pool.entries.every((e) => e.deity_tradition === EXPECTED_DEITY[e.corpus_id])
);

// ---------------------------------------------------------------------------
console.log("T4 fail-closed: tampered corpus must abort the build");
function buildMustFail(label, mutate) {
  const sandbox = join(tmpdir(), `drawone-failclosed-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  cpSync(join(ROOT, "data"), join(sandbox, "data"), { recursive: true });
  cpSync(join(ROOT, "scripts"), join(sandbox, "scripts"), { recursive: true });
  const corpusPath = join(sandbox, "data", "corpora", "guandi", "slip_texts.json");
  const doc = JSON.parse(readFileSync(corpusPath, "utf8"));
  mutate(doc);
  writeFileSync(corpusPath, JSON.stringify(doc));
  let failedAsExpected = false;
  try {
    execFileSync("node", [join(sandbox, "scripts", "build-draw-pool.mjs")], { stdio: "pipe" });
  } catch {
    failedAsExpected = true;
  }
  const poolEmitted = existsSync(join(sandbox, "assets", "oracles.draw-pool.js"));
  check(`${label} → build fails, no pool emitted`, failedAsExpected && !poolEmitted);
  rmSync(sandbox, { recursive: true, force: true });
}
buildMustFail("remove one slip", (d) => d.slips.pop());
buildMustFail("add one extra fabricated slip", (d) =>
  d.slips.push({ ...d.slips[0], slip_number: 101, poem_text: "看似很真的一首假籤詩文字內容在此" })
);
buildMustFail("downgrade status to UNVERIFIED", (d) => (d.slips[0].transcription_status = "UNVERIFIED"));
buildMustFail("mark entry ai_generated", (d) => (d.slips[3].transcription_status = "ai_generated_or_summarized"));
buildMustFail("blank a poem_text", (d) => (d.slips[7].poem_text = ""));
buildMustFail("duplicate a slip_number", (d) => (d.slips[5].slip_number = d.slips[4].slip_number));
buildMustFail("reintroduce banned fake seed poem", (d) => (d.slips[9].poem_text = "寶劍光芒出匣時，群邪退散正當宜。"));
buildMustFail("cross-attribute corpus_id", (d) => (d.slips[2].corpus_id = "guanyin"));
buildMustFail("strip provenance source_locator", (d) => (d.slips[1].source_locator = ""));

// ---------------------------------------------------------------------------
console.log("T5 public page truth rules");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const BANNED_PAGE_STRINGS = [
  "神明正在回應中",
  "月老",
  "yuelao",
  "雲開月出見青天",
  "海潮雖大終須退",
  "花開花謝皆有時",
  "有心栽柳柳難成",
  "群邪退散正當宜",
  "行船莫怕風波急",
];
for (const s of BANNED_PAGE_STRINGS) {
  check(`page does not contain "${s}"`, !html.includes(s));
}
check("page loads generated pool", html.includes("assets/oracles.draw-pool.js"));
check("page loads draw policy", html.includes("assets/draw-policy.js"));
check(
  "page has no inline oracle arrays",
  !/oracle:\s*\[/.test(html) && !/poem:\s*["']/.test(html) && !/meaning:/.test(html) && !/advice:/.test(html)
);
// Any CJK run of 12+ chars inside the inline <script> must be UI copy, not slip text.
const inline = html.slice(html.lastIndexOf("<script>"), html.lastIndexOf("</script>"));
const cjkRuns = inline.match(/[㐀-鿿，。？！——]{12,}/g) ?? [];
const UI_COPY_ALLOWLIST = [/籤詩資料層未通過驗證/, /這個問題先前已抽過籤/, /治理管線完成前不提供/, /governed draw pool/];
check(
  "public copy does not overclaim 'verified draw pool'",
  !html.includes("verified draw pool"),
  "158/260 entries are PROBABLE — copy must say governed, not verified"
);
check(
  "inline script CJK strings are UI copy only",
  cjkRuns.every((run) => UI_COPY_ALLOWLIST.some((re) => re.test(run))),
  cjkRuns.filter((run) => !UI_COPY_ALLOWLIST.some((re) => re.test(run))).join(" | ")
);

// ---------------------------------------------------------------------------
console.log("T6 interpretation layer");
check("all 260 entries have interpretation === null", pool.entries.every((e) => e.interpretation === null));
const policySrc = readFileSync(join(ROOT, "assets", "draw-policy.js"), "utf8");
const sandboxWindow = {};
new Function("window", policySrc)(sandboxWindow);
const lint = sandboxWindow.DRAW_POLICY.lintInterpretationVoice;
check("lint rejects oracle voice", !lint("媽祖要你放下這段感情。").ok);
check("lint rejects deity attribution", !lint("這是神明指示的方向。").ok);
check("lint rejects imperative life decision", !lint("你必須離職，現在就創業。").ok);
check("lint accepts reflective non-directive text", lint("這首籤描寫的是等待時機的處境，值得對照你目前的節奏。").ok);

// ---------------------------------------------------------------------------
console.log("T7 draw policy: 一事一籤 / anti answer-shopping");
function makeStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}
const w2 = { localStorage: makeStorage(), sessionStorage: makeStorage() };
new Function("window", policySrc)(w2);
const P = w2.DRAW_POLICY;
const fakePool = { a1: { id: "a1", corpus_id: "guanyin" }, b1: { id: "b1", corpus_id: "guandi" } };
let drawCalls = 0;
const drawFn = (corpusId) => {
  drawCalls++;
  return corpusId === "guanyin" ? fakePool.a1 : fakePool.b1;
};
const first = P.resolveDraw({ question: "我該不該換工作？", corpusId: "guanyin", drawFn });
const second = P.resolveDraw({ question: " 我該不該換工作？ ", corpusId: "guanyin", drawFn });
const shopped = P.resolveDraw({ question: "我該不該換工作？", corpusId: "guandi", drawFn });
check("first draw is new", first.repeated === false);
check("same question (whitespace variant) returns same slip", second.repeated === true && second.entryId === first.entryId);
check("deity switch cannot re-draw same question", shopped.repeated === true && shopped.entryId === first.entryId);
check("drawFn called exactly once for the question", drawCalls === 1);
const other = P.resolveDraw({ question: "完全不同的問題", corpusId: "guandi", drawFn });
check("different question draws fresh", other.repeated === false && drawCalls === 2);
const emptyA = P.resolveDraw({ question: "", corpusId: "guanyin", drawFn });
const emptyB = P.resolveDraw({ question: "   ", corpusId: "guandi", drawFn });
check("empty question binds within session", emptyA.repeated === false && emptyB.repeated === true);

// Hash-collision regression (found by Codex review): "0000000r" and
// "00000020" share the same djb2 bucket AND length. Identity must be decided
// by the stored full normalized question, never by the hash key alone.
check(
  "collision fixture still collides (guards fixture validity)",
  P.questionKey("0000000r") === P.questionKey("00000020")
);
let seq = 0;
const seqDraw = () => ({ id: "seq" + ++seq, corpus_id: "guanyin" });
const colA = P.resolveDraw({ question: "0000000r", corpusId: "guanyin", drawFn: seqDraw });
const colB = P.resolveDraw({ question: "00000020", corpusId: "guanyin", drawFn: seqDraw });
check("colliding questions draw independently", colB.repeated === false && colB.entryId !== colA.entryId);
const colA2 = P.resolveDraw({ question: "0000000r", corpusId: "guanyin", drawFn: seqDraw });
const colB2 = P.resolveDraw({ question: "00000020", corpusId: "guanyin", drawFn: seqDraw });
check(
  "each colliding question keeps its own binding",
  colA2.repeated === true && colA2.entryId === colA.entryId && colB2.repeated === true && colB2.entryId === colB.entryId
);

// ---------------------------------------------------------------------------
console.log("T8 deterministic build artifacts");
const poolBytes1 = readFileSync(join(ROOT, "assets", "oracles.draw-pool.js"));
const report1 = readFileSync(join(ROOT, "data", "production", "draw-pool.report.json"));
execFileSync("node", [join(ROOT, "scripts", "build-draw-pool.mjs")], { stdio: "pipe" });
const poolBytes2 = readFileSync(join(ROOT, "assets", "oracles.draw-pool.js"));
const report2 = readFileSync(join(ROOT, "data", "production", "draw-pool.report.json"));
check("rebuild from unchanged sources is byte-identical (pool)", poolBytes1.equals(poolBytes2));
check("rebuild from unchanged sources is byte-identical (report)", report1.equals(report2));
check("pool carries content_version, no wallclock timestamp", pool.content_version && !("built_at" in pool));

// ---------------------------------------------------------------------------
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
