#!/usr/bin/env node
/**
 * test-slip-render.mjs — The Slip renderer regression (V2A checkpoint).
 *
 * Run: node scripts/test-slip-render.mjs
 * Verifies the fail-closed provenance guarantees of assets/slip-render.js
 * against the committed production draw pool.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const poolSrc = readFileSync(join(ROOT, "assets", "oracles.draw-pool.js"), "utf8");
const pool = JSON.parse(poolSrc.slice(poolSrc.indexOf("window.DRAW_POOL = ") + "window.DRAW_POOL = ".length).replace(/;\s*$/, ""));
const sandbox = {};
new Function("window", readFileSync(join(ROOT, "assets", "slip-render.js"), "utf8"))(sandbox);
const R = sandbox.SLIP_RENDER;

const clone = (o) => JSON.parse(JSON.stringify(o));
const base = pool.entries.find((e) => e.id === "guanyin-039");

function mustRefuse(name, mutate, msgPart) {
  const entry = clone(base);
  mutate(entry);
  try {
    R.renderSlip(entry);
    check(`${name} → refused`, false, "rendered instead of failing closed");
  } catch (e) {
    check(`${name} → refused`, msgPart ? String(e.message).includes(msgPart) : true, e.message);
  }
}

console.log("S1 all pool entries typeset against the colophon registry");
let ok = 0;
const refusals = [];
for (const e of pool.entries) {
  try {
    R.renderSlip(e);
    ok++;
  } catch (err) {
    refusals.push(`${e.id}: ${err.message}`);
  }
}
check(`260/260 entries render`, ok === 260 && pool.entries.length === 260, refusals.slice(0, 3).join(" | "));

console.log("S2 deterministic plate");
check("same entry renders byte-identical", R.renderSlip(base) === R.renderSlip(base));

console.log("S3 fail-closed provenance guarantees");
mustRefuse("tampered edition_title", (e) => (e.provenance.edition_title = "某個被換掉的版本"), "colophon registry");
mustRefuse("unknown corpus", (e) => (e.corpus_id = "yuelao"), "unknown corpus");
mustRefuse("status UNVERIFIED", (e) => (e.provenance.transcription_status = "UNVERIFIED"), "honest colophon word");
// prototype keys must not pass the allowlist (found in Codex final QA):
// `in` accepts Object.prototype keys and would typeset function source.
mustRefuse("status toString (prototype key)", (e) => (e.provenance.transcription_status = "toString"), "honest colophon word");
mustRefuse("status hasOwnProperty (prototype key)", (e) => (e.provenance.transcription_status = "hasOwnProperty"), "honest colophon word");
mustRefuse("status constructor (prototype key)", (e) => (e.provenance.transcription_status = "constructor"), "honest colophon word");
mustRefuse("missing provenance", (e) => delete e.provenance, "");

console.log("S4 verbatim + honest words on the paper (tags stripped)");
const text = R.renderSlip(base).replace(/<[^>]+>/g, "");
check("poem verbatim", text.includes("天邊消息應難問"));
check("status word 已對勘", text.includes("已對勘"));
check("colophon source line", text.includes("據艋舺龍山寺觀世音靈籤百首本"));
check("product mark confined wording", text.includes("抽一謹錄"));
check("no function source leaked", !/function|native code/.test(text));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
