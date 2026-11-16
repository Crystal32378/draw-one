#!/usr/bin/env node
/**
 * test-ink-bake.mjs — 水墨定稿（INK_BAKE）是否真的有作用、失敗時能否退回、轉螢幕後快取會不會越積越多。
 *
 * Run: node scripts/test-ink-bake.mjs
 * Needs playwright-core + a local Chromium/Chrome; without them it SKIPs (exit 0).
 *   PW_CORE=/path/to/node_modules/playwright-core  CHROMIUM=/path/to/chrome
 *
 * 1. 成功：手機尺寸（DPR 3）進埕後，濾鏡筆觸換成定稿圖；只剩會動的麻雀維持即時濾鏡。
 * 2. ?inkbake=0：完全不烘，筆觸全是即時濾鏡。
 * 3. 失敗回退：canvas 轉圖卡住不回（逾時）、或回空值，都退回即時濾鏡，畫面不留空洞；連續失敗即停止烘圖。
 * 4. 轉螢幕／改尺寸多輪：快取不超過上限，舊圖會被 revoke，快取只留畫面正在用的。
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let chromium;
for (const p of [process.env.PW_CORE, "/opt/npm-tools/node_modules/playwright-core"].filter(Boolean)) {
  try { ({ chromium } = await import(pathToFileURL(join(p, "index.mjs")).href)); break; } catch {}
}
if (!chromium) { try { ({ chromium } = await import("playwright-core")); } catch {} }
if (!chromium) { console.log("SKIP: playwright-core not available — runtime assertions not run here."); process.exit(0); }
const executablePath = [process.env.CHROMIUM, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => existsSync(p));
if (!executablePath) { console.log("SKIP: no local Chromium found — set CHROMIUM=/path/to/binary."); process.exit(0); }

let passed = 0, failed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); } };
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const pageURL = (q = "") => pathToFileURL(join(ROOT, "paper", "arrival.html")).href + q;
const MAX_TOTAL = 12e6;

const state = (page) => page.evaluate(() => {
  const strip = document.getElementById("stageStrip");
  const live = [...strip.querySelectorAll("[filter]")];
  const hrefs = new Set([...strip.querySelectorAll("[data-ink-baked] image")].map((im) => im.getAttribute("href")));
  return { ...window.INK_BAKE.stats, cacheSize: window.INK_BAKE.cacheSize(), live: live.length,
    liveOutsideSparrow: live.filter((el) => !el.closest(".sparrow")).length,
    bakedNodes: strip.querySelectorAll("[data-ink-baked]").length,
    hiddenWraps: [...strip.querySelectorAll("[data-ink-baked]")].filter((g) => g.style.visibility === "hidden").length,
    distinctImages: hrefs.size };
});
const idle = (page, ms = 30000) => page.waitForFunction(() => window.INK_BAKE && window.INK_BAKE.stats.pending === 0, null, { timeout: ms, polling: 200 });
async function open(q, init) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto(pageURL(q)); await page.waitForTimeout(400);
  await page.click("#enterBtn"); await page.waitForTimeout(800);
  return { ctx, page, errs };
}

console.log("▍1 成功：筆觸換成定稿圖");
let liveTotal;
{
  const { ctx, page, errs } = await open("?weather=sunny");
  await idle(page); await page.waitForTimeout(600);
  const s = await state(page);
  check("有定稿（≥ 40 筆）且沒有失敗、沒有逾時", s.baked >= 40 && s.failed === 0 && s.timedOut === 0, JSON.stringify(s));
  check("濾鏡筆觸只剩麻雀（會動的不畫死）", s.liveOutsideSparrow === 0, `liveOutsideSparrow=${s.liveOutsideSparrow}`);
  check("沒有卡在隱藏狀態的定稿層", s.hiddenWraps === 0);
  check("快取在上限內，且每一張都是畫面正在用的", s.pixels <= MAX_TOTAL && s.cacheSize === s.distinctImages, `pixels=${s.pixels} cache=${s.cacheSize} images=${s.distinctImages}`);
  check("沒有 JS 錯誤", errs.length === 0, errs.join(" | "));

  console.log("▍4 轉螢幕／改尺寸三輪");
  const sizes = [[844, 390], [390, 844], [430, 932], [390, 844], [844, 390], [390, 844]];
  const trail = [];
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(700);
    await idle(page); await page.waitForTimeout(800);
    const t = await state(page); trail.push(t);
    check(`${w}×${h}：快取 ≤ 上限、只留在用的圖、沒有隱藏層`, t.pixels <= MAX_TOTAL && t.cacheSize === t.distinctImages && t.hiddenWraps === 0 && t.liveOutsideSparrow === 0,
      JSON.stringify({ px: t.pixels, cache: t.cacheSize, images: t.distinctImages, hidden: t.hiddenWraps, live: t.liveOutsideSparrow }));
  }
  const last = trail.at(-1);
  check("舊尺寸的圖有被 revoke 釋放", last.revoked > 0, `revoked=${last.revoked}`);
  check("回到原尺寸後，快取不比第一次大（沒有越積越多）", last.pixels <= s.pixels * 1.05 && last.cacheSize <= s.cacheSize + 2, `first=${s.pixels}/${s.cacheSize} last=${last.pixels}/${last.cacheSize}`);
  console.log(`    （快取量：首次 ${(s.pixels / 1e6).toFixed(1)}MP；各輪 ${trail.map((t) => (t.pixels / 1e6).toFixed(1)).join(" → ")} MP；上限 ${MAX_TOTAL / 1e6}MP）`);
  check("轉螢幕後沒有 JS 錯誤", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

console.log("▍2 ?inkbake=0：完全不烘");
{
  const { ctx, page, errs } = await open("?weather=sunny&inkbake=0");
  await page.waitForTimeout(800);
  const s = await state(page); liveTotal = s.live;
  check("零定稿、筆觸全是即時濾鏡", s.baked === 0 && s.bakedNodes === 0 && s.live > 40 && s.cacheSize === 0, JSON.stringify(s));
  check("沒有 JS 錯誤", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

console.log("▍3 失敗回退");
for (const [name, init, field] of [
  ["canvas 轉圖卡住不回（逾時保護）", () => { HTMLCanvasElement.prototype.toBlob = function () {}; }, "timedOut"],
  ["canvas 轉圖回空值", () => { HTMLCanvasElement.prototype.toBlob = function (cb) { setTimeout(() => cb(null), 0); }; }, "failed"],
]) {
  const { ctx, page, errs } = await open("?weather=sunny", init);
  await idle(page, 60000); await page.waitForTimeout(400);
  const s = await state(page);
  check(`${name}：一張都沒換、${field} > 0`, s.baked === 0 && s.bakedNodes === 0 && s[field] > 0, JSON.stringify({ baked: s.baked, failed: s.failed, timedOut: s.timedOut }));
  check(`${name}：即時濾鏡筆觸全部還在（與 inkbake=0 同數）`, s.live === liveTotal, `live=${s.live} expected=${liveTotal}`);
  check(`${name}：連續失敗後本次停止烘圖（不會一張張耗下去）`, s.disabled === true && s.attempts <= 3, JSON.stringify({ disabled: s.disabled, attempts: s.attempts }));
  check(`${name}：失敗不佔快取額度`, s.cacheSize === 0 && s.pixels === 0, `cache=${s.cacheSize} px=${s.pixels}`);
  check(`${name}：沒有 JS 錯誤`, errs.length === 0, errs.join(" | "));
  await ctx.close();
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
