// Public release verification: no private research files or rebuild dependencies.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const check = (name, ok) => { console.log((ok ? "  ✓ " : "  ✗ ") + name); ok ? pass++ : fail++; };
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

console.log("D approved public release fingerprint");
const release = JSON.parse(readFileSync(join(ROOT, "data/production/interpretation-release.manifest.json"), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
check("release manifest schema and count", release.schema === "interpretation-release/0.1" && release.count === 94 && P.count === release.count);
check("release version is the UI guard version", release.content_version === P.content_version && release.content_version === GUARD.CONTRACT.content_version);
for (const path of ["assets/interpretation-pool.guanyin.js", "assets/jieyue-guard.js"]) {
  const bytes = readFileSync(join(ROOT, path));
  check(`${path} matches accepted bytes`, sha256(bytes) === release.files[path]);
  check(`${path} changed bytes fail the release fingerprint`, sha256(Buffer.concat([bytes, Buffer.from("\nchanged")])) !== release.files[path]);
}
check("all 94 records resolve against the approved draw pool", Object.keys(P.entries).every(id => {
  const slip = POOL.entries.find(e => e.id === id);
  return GUARD.resolve(P, slip) === P.entries[id];
}));

console.log("F UI wiring — off-paper, collapsed, guard-gated, no paraphrase");
const html = readFileSync(join(ROOT, "paper/arrival.html"), "utf8");
check("artifact + guard are loaded", html.includes("interpretation-pool.guanyin.js") && html.includes("jieyue-guard.js"));
check("disclosure starts hidden + collapsed", /id="jieyue"[^>]*hidden/.test(html) && /id="jieyueBody"[^>]*hidden/.test(html));
const stage = html.slice(html.indexOf('id="slipStage"'), html.indexOf('class="note-zone"'));
const mountEnd = stage.indexOf("</div>", stage.indexOf('id="slipMount"'));
check("解曰 sits below the paper, not inside #slipMount", stage.indexOf('id="jieyue"') > mountEnd);
check("visibility decided only by JIEYUE_GUARD.resolve", /JIEYUE_GUARD\.resolve\(pool, entry\)/.test(html) && /if \(!rec\) \{ box\.hidden = true; return; \}/.test(html));
check("no paraphrase in UI — text comes straight from rec.text", /jieyueText"\)\.textContent = rec\.text/.test(html));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
