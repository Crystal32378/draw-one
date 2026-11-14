// test-interpretation-pool.mjs — 解曰 layer, three halls: artifacts, exact version lock,
// withheld ledger (holds), 六十甲子 corpus hold,
// per-slip custody, real fail-closed counter-examples, UI wiring.
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const check = (name, ok) => { console.log((ok ? "  ✓ " : "  ✗ ") + name); ok ? pass++ : fail++; };

const loadWinAbs = (abs) => { const w = {}; new Function("window", readFileSync(abs, "utf8"))(w); return w; };
const loadWin = (relPath) => { const w = {}; new Function("window", readFileSync(join(ROOT, relPath), "utf8"))(w); return w; };
const P = loadWin("assets/interpretation-pool.guanyin.js").INTERPRETATION_POOL;
const GUARD = loadWin("assets/jieyue-guard.js").JIEYUE_GUARD;
const POOL = loadWin("assets/oracles.draw-pool.js").DRAW_POOL;
const gEntry = (n) => POOL.entries.find((e) => e.corpus_id === "guanyin" && e.slip_number === n);

console.log("A 解曰 layer artifact");
check("schema + corpus + edition_id", P.schema === "interpretation-pool/0.1" && P.corpus_id === "guanyin" && P.edition_id === "ed-guanyin-xue2008-appendix2-image");
check("field is 解曰 only", P.field === "解曰");
check("count matches entries", P.count === Object.keys(P.entries).length);
check("every entry: verbatim text, honest status, slip_no, custody", Object.values(P.entries).every((e) =>
  typeof e.text === "string" && e.text.length > 0 && ["VERIFIED", "PROBABLE"].includes(e.status)
  && typeof e.confirmed === "boolean" && Number.isInteger(e.slip_no) && /^[0-9a-f]{32}$/.test(e.custody)));
check("id encodes slip_no (guanyin-0NN ⟺ slip_no)", Object.entries(P.entries).every(([id, e]) => id === `guanyin-${String(e.slip_no).padStart(3, "0")}`));

console.log("B 聖意 (fortune grid) excluded at source — the ethical line");
const GRID = ["家宅", "六甲", "田蠶", "田蚕", "移徙", "山墳", "山坟", "六畜", "失物", "疾病禳送"];
const looksLikeGrid = (t) => GRID.filter((c) => t.includes(c)).length >= 3;
check("no entry reads like the 聖意 category grid", Object.values(P.entries).every((e) => !looksLikeGrid(e.text)));
check("artifact declares 聖意 excluded", P.note.includes("聖意"));

console.log("C UI guard — exact version lock + custody (shared with the page)");
check("happy path resolves the record", GUARD.resolve(P, gEntry(1)) === P.entries["guanyin-001"]);
check("guard pinned content_version === artifact content_version (no drift)", GUARD.CONTRACT.content_version === P.content_version);
check("wrong edition_id → hidden", GUARD.resolve({ ...P, edition_id: "ed-other" }, gEntry(1)) === null);
check("wrong expected_slip_edition_title → hidden", GUARD.resolve({ ...P, expected_slip_edition_title: "別版" }, gEntry(1)) === null);
check("wrong content_version → hidden", GUARD.resolve({ ...P, content_version: "0".repeat(64) }, gEntry(1)) === null);
check("corpus mismatch → hidden", GUARD.resolve({ ...P, corpus_id: "guandi" }, gEntry(1)) === null);
check("slip whose edition_title differs → hidden", GUARD.resolve(P, { ...gEntry(1), provenance: { edition_title: "別版" } }) === null);
check("id↔slip_no custody mismatch → hidden", GUARD.resolve(P, { ...gEntry(1), slip_number: 2 }) === null);
const badStatusPool = { ...P, entries: { "guanyin-001": { ...P.entries["guanyin-001"], status: "UNRESOLVED" } } };
check("unknown/blocked status → hidden", GUARD.resolve(badStatusPool, gEntry(1)) === null);
check("no 解曰 for a slip that has none (excluded #12) → hidden", GUARD.resolve(P, gEntry(12)) === null);

console.log("D fail-closed counter-examples (real build in an isolated dir)");
const REAL_SRC = join(ROOT, "data/corpora/guanyin/interpretation_layer.json");
const CUSTODY = join(ROOT, "data/corpora/guanyin/jieyue_custody.json");
const jieOf = (obj) => obj.entries.filter((e) => e.field_type === "解曰");
function buildWith(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "jieyue-"));
  const src = join(dir, "src.json");
  const data = JSON.parse(readFileSync(REAL_SRC, "utf8"));
  mutate(data);
  writeFileSync(src, JSON.stringify(data));
  const env = { ...process.env, INTERP_SRC: src, INTERP_OUT: join(dir, "out.js"), INTERP_REPORT: join(dir, "rep.json"), INTERP_CUSTODY: CUSTODY };
  try { execFileSync("node", [join(ROOT, "scripts/build-interpretation-pool.mjs")], { env, stdio: "pipe" }); return { ok: true, dir }; }
  catch (e) { return { ok: false, dir, stderr: (e.stderr || "").toString() }; }
}
// D1 swap two includable 解曰 (both texts still exist in source → old check would pass)
const swap = buildWith((d) => {
  const j = jieOf(d); const a = j.find((e) => e.slip_no === 1), b = j.find((e) => e.slip_no === 2);
  const t = a.verbatim_text; a.verbatim_text = b.verbatim_text; b.verbatim_text = t;
});
check("swap two 解曰 → build fails on custody", !swap.ok && /custody mismatch/.test(swap.stderr));
// D2 inject □ into an includable 解曰
const box = buildWith((d) => { jieOf(d).find((e) => e.slip_no === 1).verbatim_text = "急速非速。言□時值。觀音降事。報與君知。"; });
check("replacement/box char in includable text → build fails (G3/custody)", !box.ok && /(box\/replacement|custody mismatch)/.test(box.stderr));
// D3 edition changed on a row
const ed = buildWith((d) => { jieOf(d)[0].edition = "某其他版本"; });
check("edition changed → build fails (G5)", !ed.ok && /edition-pin|custody/.test(ed.stderr));
// D4 build failure must NOT partially rewrite the real artifact/report
const artBefore = readFileSync(join(ROOT, "assets/interpretation-pool.guanyin.js"));
const repBefore = readFileSync(join(ROOT, "data/production/interpretation-pool.report.json"));
const dir = mkdtempSync(join(tmpdir(), "jieyue-atomic-"));
const badSrc = join(dir, "src.json");
const d = JSON.parse(readFileSync(REAL_SRC, "utf8"));
jieOf(d).find((e) => e.slip_no === 1).verbatim_text = "改壞了";
writeFileSync(badSrc, JSON.stringify(d));
let threw = false;
try {
  execFileSync("node", [join(ROOT, "scripts/build-interpretation-pool.mjs")],
    { env: { ...process.env, INTERP_SRC: badSrc, INTERP_CUSTODY: CUSTODY }, stdio: "pipe" }); // OUT/REPORT default = REAL paths
} catch { threw = true; }
check("build failed while targeting real artifact/report", threw);
check("failed build left real artifact byte-identical", readFileSync(join(ROOT, "assets/interpretation-pool.guanyin.js")).equals(artBefore));
check("failed build left real report byte-identical", readFileSync(join(ROOT, "data/production/interpretation-pool.report.json")).equals(repBefore));

console.log("E rebuild is deterministic (byte-identical)");
const before = readFileSync(join(ROOT, "assets/interpretation-pool.guanyin.js"), "utf8");
try { execFileSync("node", [join(ROOT, "scripts/build-interpretation-pool.mjs")], { cwd: ROOT, stdio: "pipe" });
  check("rebuild does not change the artifact", readFileSync(join(ROOT, "assets/interpretation-pool.guanyin.js"), "utf8") === before);
} catch { check("rebuild runs clean", false); }

console.log("F UI wiring — off-paper, collapsed, guard-gated, no paraphrase");
const html = readFileSync(join(ROOT, "paper/arrival.html"), "utf8");
check("artifact + guard are loaded", html.includes("interpretation-pool.guanyin.js") && html.includes("jieyue-guard.js"));
check("guandi pool + holds are loaded BEFORE the guard", html.indexOf("interpretation-pool.guandi.js") > 0 && html.indexOf("interpretation-holds.js") > 0
  && html.indexOf("interpretation-holds.js") < html.indexOf("jieyue-guard.js"));
check("disclosure starts hidden + collapsed", /id="jieyue"[^>]*hidden/.test(html) && /id="jieyueBody"[^>]*hidden/.test(html));
const stage = html.slice(html.indexOf('id="slipStage"'), html.indexOf('class="note-zone"'));
const mountEnd = stage.indexOf("</div>", stage.indexOf('id="slipMount"'));
check("解曰 sits below the paper, not inside #slipMount", stage.indexOf('id="jieyue"') > mountEnd);
const rj = html.slice(html.indexOf("function renderJieyue"), html.indexOf("function ensureBookEntry"));
check("renderJieyue exists and precedes ensureBookEntry (PR #32 intact)", rj.length > 0 && html.includes("function ensureBookEntry"));
check("shown-or-not decided only by JIEYUE_GUARD (resolve + holdFor)", /const rec = G \? G\.resolve\(pool, entry\) : null;/.test(rj)
  && /G\.holdFor\(window\.INTERPRETATION_HOLDS, JIEYUE_POOLS, entry\)/.test(rj) && /if \(!rec && !hold\) \{ box\.hidden = true; return; \}/.test(rj));
check("no paraphrase in UI — gloss text comes straight from rec.text, nowhere else", (rj.match(/jieyueText"\)\.textContent = /g) || []).length === 1
  && /jieyueText"\)\.textContent = rec\.text/.test(rj) && /text\.textContent = "";/.test(rj));
check("withheld branch never touches pool entries / source text", !/entries\[/.test(rj.slice(rj.indexOf("// 暫未上紙"))));
check("pool lookup is own-property (no prototype leak)", /Object\.hasOwn\(JIEYUE_POOLS, entry\.corpus_id\)/.test(rj));
check("outbound link is https-only via guard, opened noopener", /rel="noopener noreferrer"/.test(html) && /link\.href = hold\.official_url/.test(rj));
const copyBlock = html.slice(html.indexOf("const JIEYUE_COPY"), html.indexOf("function renderJieyue"));
const VERDICT = ["大吉", "上上", "下下", "凶", "必成", "必得", "保證", "一定會", "注定"];
check("Draw One's own fold copy carries no verdict / guarantee words", VERDICT.every((w) => !copyBlock.includes(w)));
check("copy says what it is and is not（不是預測）", copyBlock.includes("不是抽一的話") && copyBlock.includes("預測"));
check("PROBABLE is never worded as confirmed（待複核 ≠ 已核圖）", /rec\.confirmed \? "已核圖" : statusWord/.test(rj) && /rec\.confirmed \? copy\.confirmed : copy\.pending/.test(rj));

console.log("G 關帝 pool — same gates, same guard");
const PD = loadWin("assets/interpretation-pool.guandi.js").INTERPRETATION_POOL_GUANDI;
const HOLDS = loadWin("assets/interpretation-holds.js").INTERPRETATION_HOLDS;
const POOLS = { guanyin: P, guandi: PD };
const dEntry = (n) => POOL.entries.find((e) => e.corpus_id === "guandi" && e.slip_number === n);
const lEntry = (n) => POOL.entries.find((e) => e.corpus_id === "liushijiazi" && e.slip_number === n);
const GD_SRC = join(ROOT, "data/corpora/guandi/interpretation_layer.json");
const gdSrc = JSON.parse(readFileSync(GD_SRC, "utf8"));
const gdJie = gdSrc.entries.filter((e) => e.field_type === "解曰");
const gdSheng = new Set(gdSrc.entries.filter((e) => e.field_type === "聖意").map((e) => e.verbatim_text));
check("schema + corpus + edition_id (same edition as the paper)", PD.schema === "interpretation-pool/0.1" && PD.corpus_id === "guandi"
  && PD.edition_id === "ed-guandi-daozang-fuye-1225" && PD.expected_slip_edition_title === dEntry(1).provenance.edition_title);
check("count matches entries; every text is a verbatim source 解曰 for THAT slip", PD.count === Object.keys(PD.entries).length
  && Object.values(PD.entries).every((e) => gdJie.find((s) => s.slip_no === e.slip_no).verbatim_text === e.text));
check("no 聖意 text entered the pool", Object.values(PD.entries).every((e) => !gdSheng.has(e.text)));
check("nothing is marked 已核圖 (no human image check exists for 關帝)", Object.values(PD.entries).every((e) => e.confirmed === false && e.status === "PROBABLE"));
check("no box/replacement char shipped", Object.values(PD.entries).every((e) => !/\uFFFD|\u25A1/.test(e.text)));
check("guard pinned guandi content_version === artifact (no drift)", GUARD.CONTRACTS.guandi.content_version === PD.content_version);
check("happy path: resolveFrom picks the slip's own corpus", GUARD.resolveFrom(POOLS, dEntry(1)) === PD.entries["guandi-001"] && GUARD.resolveFrom(POOLS, gEntry(1)) === P.entries["guanyin-001"]);
check("guandi pool offered for a guanyin slip → hidden", GUARD.resolve(PD, gEntry(1)) === null);
check("guanyin pool relabelled as guandi → hidden", GUARD.resolve({ ...P, corpus_id: "guandi" }, dEntry(1)) === null);
check("六十甲子 slip can never resolve a 解曰", GUARD.resolveFrom(POOLS, lEntry(1)) === null && GUARD.resolveFrom({ ...POOLS, liushijiazi: PD }, lEntry(1)) === null);
check("prototype-named corpus → hidden", GUARD.resolveFrom(POOLS, { ...gEntry(1), corpus_id: "constructor" }) === null);

console.log("H withheld ledger — the page may say why, never what");
const hold = (e) => GUARD.holdFor(HOLDS, POOLS, e);
check("every withheld 關帝 slip is absent from the pool, every other is present", gdJie.every((s) =>
  (String(s.slip_no) in HOLDS.corpora.guandi.slips) !== (`guandi-${String(s.slip_no).padStart(3, "0")}` in PD.entries)));
check("upstream-flagged readings (#58 #68) and the lacuna (#100) are withheld", ["58", "68", "100"].every((k) => k in HOLDS.corpora.guandi.slips));
check("every 關帝 解曰 with an upstream variants note is withheld (none ships silently)", gdJie.filter((s) => String(s.variants_or_notes || "").trim()).every((s) => String(s.slip_no) in HOLDS.corpora.guandi.slips));
check("guanyin withheld = exactly the 6 non-PROBABLE", Object.keys(HOLDS.corpora.guanyin.slips).join(",") === "12,20,35,44,65,77");
const holdsRaw = readFileSync(join(ROOT, "assets/interpretation-holds.js"), "utf8");
const gyJieAll = JSON.parse(readFileSync(join(ROOT, "data/corpora/guanyin/interpretation_layer.json"), "utf8")).entries.filter((e) => e.field_type === "解曰");
check("holds artifact carries NO withheld gloss text", [...gdJie, ...gyJieAll].every((s) => s.verbatim_text.split(/[，。]/).filter((x) => x.length >= 4).every((seg) => !holdsRaw.includes(seg))));
check("slip hold voiced with its reason code", hold(dEntry(58))?.scope === "slip" && hold(dEntry(58)).reason === "suspect_reading"
  && hold(dEntry(100)).reason === "unsettled_transcription" && hold(gEntry(12)).reason === "unsettled_transcription");
check("shown and withheld are mutually exclusive", hold(dEntry(1)) === null && hold(gEntry(1)) === null);
check("hold beside a different pool version → silent", GUARD.holdFor({ ...HOLDS, corpora: { ...HOLDS.corpora, guandi: { ...HOLDS.corpora.guandi, content_version: "0".repeat(64) } } }, POOLS, dEntry(58)) === null);
check("hold with the real pool missing/tampered → silent", GUARD.holdFor(HOLDS, { guanyin: P }, dEntry(58)) === null
  && GUARD.holdFor(HOLDS, { ...POOLS, guandi: { ...PD, content_version: "0".repeat(64) } }, dEntry(58)) === null);
check("unknown slip reason → silent", GUARD.holdFor({ ...HOLDS, corpora: { ...HOLDS.corpora, guandi: { ...HOLDS.corpora.guandi, slips: { 58: "because" } } } }, POOLS, dEntry(58)) === null);
check("wrong holds schema → silent", GUARD.holdFor({ ...HOLDS, schema: "x" }, POOLS, dEntry(58)) === null);

console.log("I 六十甲子 — whole layer held; nothing of it reaches the page");
const LH = HOLDS.corpora.liushijiazi;
check("corpus hold with both reasons, evidence-bound", LH.scope === "corpus" && LH.reasons.join(",") === "license_unresolved,single_pass_ocr"
  && LH.evidence.human_image_confirmed === 0 && LH.evidence.candidate > 300 && LH.evidence.license_status === "unsure");
check("guard voices the corpus hold + official https link", hold(lEntry(1))?.scope === "corpus" && hold(lEntry(1)).reasons.length === 2 && /^https:\/\/www\.matsu\.org\.tw\//.test(hold(lEntry(1)).official_url));
check("non-https official_url is dropped", GUARD.holdFor({ ...HOLDS, corpora: { ...HOLDS.corpora, liushijiazi: { ...LH, official_url: "javascript:alert(1)" } } }, POOLS, lEntry(1)).official_url === null);
check("unknown corpus reason → silent", GUARD.holdFor({ ...HOLDS, corpora: { ...HOLDS.corpora, liushijiazi: { ...LH, reasons: ["license_unresolved", "vibes"] } } }, POOLS, lEntry(1)) === null);
check("no 六十甲子 pool artifact exists", !existsSync(join(ROOT, "assets/interpretation-pool.liushijiazi.js")));
const lsLayer = JSON.parse(readFileSync(join(ROOT, "data/corpora/liushijiazi/interpretation_layer.json"), "utf8"));
const shipped = ["assets/interpretation-holds.js", "assets/interpretation-pool.guanyin.js", "assets/interpretation-pool.guandi.js", "assets/jieyue-guard.js", "paper/arrival.html"]
  .map((f) => readFileSync(join(ROOT, f), "utf8")).join("\n");
const lsProse = lsLayer.entries.filter((e) => ["籤解", "卦運勢", "籤閣聖意", "聖意"].includes(e.field_type) && e.verbatim_text.length >= 12);
check("no 六十甲子 temple commentary (籤解/卦運勢/籤閣聖意/聖意) in any shipped file", lsProse.every((e) => !shipped.includes(e.verbatim_text.slice(0, 12))));

console.log("J 關帝 + hold counter-examples (real build, isolated dir)");
const GD_CUSTODY = join(ROOT, "data/corpora/guandi/jieyue_custody.json");
const GD_HOLDS = join(ROOT, "data/corpora/guandi/jieyue_holds.json");
function buildGuandi({ mutate, mutateHolds, lsjz } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "jieyue-gd-"));
  const src = join(dir, "src.json"), holds = join(dir, "holds.json");
  const data = JSON.parse(readFileSync(GD_SRC, "utf8")); if (mutate) mutate(data);
  writeFileSync(src, JSON.stringify(data));
  const h = JSON.parse(readFileSync(GD_HOLDS, "utf8")); if (mutateHolds) mutateHolds(h);
  writeFileSync(holds, JSON.stringify(h));
  const env = { ...process.env, INTERP_CORPUS: "guandi", INTERP_SRC: src, INTERP_OUT: join(dir, "out.js"), INTERP_REPORT: join(dir, "rep.json"),
    INTERP_CUSTODY: GD_CUSTODY, INTERP_HOLDS: holds, INTERP_HOLDS_OUT: join(dir, "holds.out.js") };
  if (lsjz) {
    const L = JSON.parse(readFileSync(join(ROOT, "data/corpora/liushijiazi/interpretation_layer.json"), "utf8"));
    const S = JSON.parse(readFileSync(join(ROOT, "data/corpora/liushijiazi/sources.json"), "utf8"));
    lsjz(L, S);
    writeFileSync(join(dir, "l.json"), JSON.stringify(L)); writeFileSync(join(dir, "s.json"), JSON.stringify(S));
    env.INTERP_LSJZ_LAYER = join(dir, "l.json"); env.INTERP_LSJZ_SOURCES = join(dir, "s.json");
  }
  try { execFileSync("node", [join(ROOT, "scripts/build-interpretation-pool.mjs")], { env, stdio: "pipe" }); return { ok: true, dir }; }
  catch (e) { return { ok: false, dir, stderr: (e.stderr || "").toString() }; }
}
const jd = (o) => o.entries.filter((e) => e.field_type === "解曰");
check("isolated guandi build passes unmodified (control)", buildGuandi().ok);
const gSwap = buildGuandi({ mutate: (o) => { const a = jd(o).find((e) => e.slip_no === 1), b = jd(o).find((e) => e.slip_no === 2); [a.verbatim_text, b.verbatim_text] = [b.verbatim_text, a.verbatim_text]; } });
check("swap two 關帝 解曰 → build fails on custody", !gSwap.ok && /custody mismatch/.test(gSwap.stderr));
const gFix = buildGuandi({ mutate: (o) => { const e = jd(o).find((x) => x.slip_no === 5); e.verbatim_text = e.verbatim_text.replace("几", "凡"); } });
check("silently 'correcting' a suspect character → build fails on custody (no silent canonicalization)", !gFix.ok && /custody mismatch/.test(gFix.stderr));
const gUnheld = buildGuandi({ mutateHolds: (h) => { h.holds = h.holds.filter((r) => r.slip_no !== 58); } });
check("dropping the hold on an upstream-flagged reading → build fails (G8)", !gUnheld.ok && /unheld-note\/58/.test(gUnheld.stderr));
const gNote = buildGuandi({ mutate: (o) => { jd(o).find((e) => e.slip_no === 1).variants_or_notes = "新發現異文"; } });
check("a new upstream anomaly note without a hold → build fails (G8)", !gNote.ok && /unheld-note\/1/.test(gNote.stderr));
const gGhost = buildGuandi({ mutateHolds: (h) => { h.holds.push({ slip_no: 101, reason_code: "suspect_reading" }); } });
check("hold pointing at a missing slip → build fails (G8)", !gGhost.ok && /G8\/hold\/101/.test(gGhost.stderr));
const gEd = buildGuandi({ mutate: (o) => { jd(o)[0].edition = "某清刊本"; } });
check("關帝 edition changed → build fails (G5)", !gEd.ok && /edition-pin/.test(gEd.stderr));
const clear = (L, S) => { const r = S.find((s) => s.source_id === "src-beigang-official"); r.license_status = "cleared"; r.item_license_status = "cleared"; };
const lsLic = buildGuandi({ lsjz: clear });
const licOut = lsLic.ok ? loadWinAbs(join(lsLic.dir, "holds.out.js")).INTERPRETATION_HOLDS.corpora.liushijiazi : null;
check("licence cleared but still single-pass OCR → 六十甲子 stays held, reason narrows honestly", !!licOut && licOut.reasons.join(",") === "single_pass_ocr");
const lsBoth = buildGuandi({ lsjz: (L, S) => { clear(L, S); for (const e of L.entries) e.manual_image_confirmation = true; } });
check("no basis left for the hold → build FAILS (stale hold must be revisited, not kept)", !lsBoth.ok && /hold-still-justified/.test(lsBoth.stderr));

console.log("K all generated files are reproducible");
const GEN = ["assets/interpretation-pool.guanyin.js", "assets/interpretation-pool.guandi.js", "assets/interpretation-holds.js",
  "data/production/interpretation-pool.report.json", "data/production/interpretation-pool.guandi.report.json"];
const snap = GEN.map((f) => readFileSync(join(ROOT, f)));
try { execFileSync("node", [join(ROOT, "scripts/build-interpretation-pool.mjs")], { cwd: ROOT, stdio: "pipe" });
  check("full three-hall rebuild is byte-identical to the committed files", GEN.every((f, i) => readFileSync(join(ROOT, f)).equals(snap[i])));
} catch { check("full rebuild runs clean", false); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
