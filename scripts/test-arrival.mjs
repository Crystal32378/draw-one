#!/usr/bin/env node
/**
 * test-arrival.mjs — The Arrival mechanics regression (V2B).
 *
 * Run: node scripts/test-arrival.mjs
 *
 * Two layers:
 *   R1–R5  source-contract checks on paper/arrival.html — they lock the
 *          mechanics contracts (boot neutrality, two-step side-hall grammar,
 *          halls=4 fail-closed, three-hall equality, no pagination UI) so a
 *          refactor that silently drops them fails CI. DOM behaviour itself
 *          is additionally verified manually in a real browser (see PR notes).
 *   R6     runtime contract tests for DRAW_POLICY.peekBinding (sandboxed).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}

const html = readFileSync(join(ROOT, "paper", "arrival.html"), "utf8");
const script = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

console.log("R1 boot/reload neutrality — facing must never persist");
check("no persisted facing key anywhere", !/arrival\.facing|FACING_KEY/.test(html));
check("facing lives in session memory initialised to void", /let sessionFacing = "void"/.test(script));
check("renderCourt faces sessionFacing (not storage)", /const facing = sessionFacing/.test(script));
check(
  "no localStorage/sessionStorage read decides facing",
  !/store\.get\([^)]*facing/i.test(script)
);
// last-visited stays a FACT (allowed), never a boot landing
check("last-visited fact retained (LASTHALL_KEY)", /LASTHALL_KEY/.test(script));
check(
  "LASTHALL never passed to faceStation",
  !/faceStation\([^)]*LASTHALL/.test(script) && !/faceStation\([^)]*lastHall/.test(script)
);

console.log("R2 side-hall grammar — first tap faces, second tap enters");
const releaseBlock = script.slice(script.indexOf("const release ="), script.indexOf("view.addEventListener(\"pointerup\""));
check("release handler exists", releaseBlock.length > 0);
check(
  "enter is gated on facedNow",
  /facedNow[\s\S]{0,80}enterHall/.test(releaseBlock)
);
check(
  "non-faced tap only turns (targetScroll + kick, no enterHall)",
  /else\s*\{[^}]*targetScroll = stationCenter\(idx\);[^}]*kick\(\);[^}]*\}/.test(releaseBlock) &&
    !/else\s*\{[^}]*enterHall/.test(releaseBlock)
);
check(
  "facedNow tolerance is symmetric (Math.abs) — left/right sides identical",
  /Math\.abs\(stationCenter\(idx\) - scroll\) < stationW \* 0\.3/.test(releaseBlock)
);

console.log("R3 ?halls=4 fail-closed — 月老 cannot reach any draw path");
check("hypothetical hall has corpusId null", /corpusId: null[\s\S]{0,120}hypothetical: true/.test(script));
const renderHallBlock = script.slice(script.indexOf("function renderHall"), script.indexOf("/* ---------- 拖抽"));
check(
  "renderHall guards hypothetical/no-corpus BEFORE any tube display",
  (() => {
    const guard = renderHallBlock.indexOf("hall.hypothetical || !hall.corpusId");
    const tube = renderHallBlock.indexOf('$("tubeStage").style.display = "flex"');
    return guard > -1 && tube > -1 && guard < tube;
  })()
);
check("hypothetical guard returns before draw", /hypothetical \|\| !hall\.corpusId\)[\s\S]{0,400}return;/.test(renderHallBlock));
check(
  "completeDraw draws only from currentHall.corpusId (no fallback corpus)",
  /corpusId: currentHall\.corpusId/.test(script) && !/corpusId: currentHall\.corpusId \?\?/.test(script)
);

console.log("R4 three-hall equality — one grammar, no hidden chief hall");
const applyBlock = script.slice(script.indexOf("function applyFrame"), script.indexOf("function animate"));
check(
  "single scale formula for every station (no per-hall branch)",
  /STATIONS\.forEach/.test(applyBlock) && !/id === "guanyin"|id === "guandi"|id === "mazu"/.test(applyBlock)
);
check(
  "no hall-specific styling anywhere in render (ordering only in buildStations)",
  (() => {
    const outsideBuild = script.replace(script.slice(script.indexOf("function buildStations"), script.indexOf("let STATIONS")), "");
    return !/(id === "guanyin"|id === "guandi"|id === "mazu")/.test(outsideBuild);
  })()
);
check("one shared facade template (single .facade construction)", (script.match(/className = "facade"/g) ?? []).length === 1);
check(
  "geometry hypothesis note present, no cultural-naming claim",
  /geometry hypothesis/.test(html) && !/昭穆/.test(html)
);

console.log("R5 no pagination affordances");
check("no dots/arrows/page indicators", !/carousel|dots|1\/3|›|‹|»|«/.test(html));

console.log("R6 peekBinding runtime contract");
const policySrc = readFileSync(join(ROOT, "assets", "draw-policy.js"), "utf8");
function makeStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}
const w = { localStorage: makeStorage(), sessionStorage: makeStorage() };
new Function("window", policySrc)(w);
const P = w.DRAW_POLICY;
const Q = "測試乙丑之問";
check("peek before any draw returns null", P.peekBinding({ question: Q }) === null);
check("peek created no binding", P.peekBinding({ question: Q }) === null);
let draws = 0;
const drawFn = () => ({ id: "liushijiazi-002", corpus_id: "liushijiazi" }); // 乙丑
const first = P.resolveDraw({ question: Q, corpusId: "liushijiazi", drawFn: () => (draws++, drawFn()) });
check("first resolve draws once", first.repeated === false && draws === 1);
const peeked = P.peekBinding({ question: Q });
check("peek sees the existing binding", peeked?.entryId === "liushijiazi-002");
check("peek did not consume/alter the binding", P.peekBinding({ question: Q })?.entryId === "liushijiazi-002");
const again = P.resolveDraw({ question: Q, corpusId: "guanyin", drawFn: () => (draws++, { id: "x", corpus_id: "guanyin" }) });
check(
  "after peek, formal flow still returns the SAME slip (乙丑 lock)",
  again.repeated === true && again.entryId === "liushijiazi-002" && draws === 1
);
const other = P.resolveDraw({ question: "另一個問題", corpusId: "guanyin", drawFn: () => ({ id: "g1", corpus_id: "guanyin" }) });
check("resolveDraw unaffected for new questions", other.repeated === false && other.entryId === "g1");
check("peek on unbound question still null after other activity", P.peekBinding({ question: "從未問過" }) === null);

console.log("R7 keepBtn does not clear #question (v2g, 2026-08-26)");
// 2026-08-26 評估複測重現：keepBtn 收簿後清空問題欄→下一輪空手抽→簿子產生 question:"" 的幽靈條目。
// 修法：問題留在案上——同題再抽由一事一籤直接回看、要新的一支就寫新問題、刻意空手由使用者自己清空。
// 契約：keepBtn handler 內不得把 #question.value 指派為空字串（或任何值）。
// 從「keepBtn 點擊事件註冊」開始切，到下一個獨立的「addEventListener 區塊」或「function (」之前。
// 這確保我們看到的是 click handler 內部，不是 HTML 標籤。
const handlerStart = script.search(/\$\("keepBtn"\)\.addEventListener/);
const keepHandler = handlerStart > 0
  ? script.slice(handlerStart, script.length)
  : "";
check("keepBtn handler exists in source", handlerStart > 0);
// 從 handler 開頭切割到下一個未縮排的 top-level 結構（function 宣告 / IIFE 結尾 / 區塊註解頭），
// 避免抓進後續無關程式。
function sliceHandler(src) {
  const start = src.indexOf("=> {");
  if (start < 0) return src;
  // 配對箭頭函式的大括號；用括號深度。
  let depth = 0, i = start;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return src.slice(0, i);
}
const keepBody = sliceHandler(keepHandler);
check(
  "keepBtn handler does not assign to #question.value (no silent clear)",
  !/\$\("question"\)\.value\s*=/.test(keepBody) && !/getElementById\("question"\)\.value\s*=/.test(keepBody)
);
check(
  "keepBtn does store LASTHALL_KEY (回埕時仍記得上次到訪)",
  /LASTHALL_KEY/.test(keepBody)
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
