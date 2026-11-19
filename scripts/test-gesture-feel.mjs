#!/usr/bin/env node
/**
 * test-gesture-feel.mjs — 手機手感：轉身夠輕、拔籤不必用力甩。
 *
 * Run: node scripts/test-gesture-feel.mjs   （需要 playwright-core + 本機 Chrome；沒有就 SKIP）
 *
 * 轉身
 *  - 往左拖 22% 螢幕寬、慢慢放手 → 轉到下一殿（以前要拖過半個螢幕）
 *  - 輕甩一下（短距離、快速）→ 轉一站
 *  - 只拖 8% 就放手 → 留在原地（不會誤轉）
 *  - 轉身到位時間：CPU 降速 4 倍下 < 900ms（以前跟著掉幀變慢）
 * 拔籤
 *  - 往上拉 95px 一次 → 出籤（以前要 ~139px 且尾段有阻尼）
 *  - 拉到四成就往上甩著放手 → 出籤
 *  - 慢慢拉三成放手 → 不出籤，籤枝停在半途；再拉一小段就能出（進度不歸零）
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
if (!chromium) { console.log("SKIP: playwright-core not available."); process.exit(0); }
const executablePath = [process.env.CHROMIUM, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => existsSync(p));
if (!executablePath) { console.log("SKIP: no local Chromium found."); process.exit(0); }

let passed = 0, failed = 0;
const check = (name, ok, detail = "") => { if (ok) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
const W = 390, H = 844;

async function court(throttle = 1) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  if (throttle > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle }); }
  await page.goto(pathToFileURL(join(ROOT, "paper", "arrival.html")).href + "?weather=sunny&inkbake=0");
  await sleep(400); await page.click("#enterBtn"); await sleep(1600);
  return { ctx, page, errs };
}
const facing = (page) => page.evaluate(() => document.getElementById("walkHint")?.textContent || "");
async function drag(page, dx, ms, y = H * 0.42) {
  const x0 = dx < 0 ? W * 0.75 : W * 0.25, steps = Math.max(2, Math.round(ms / 16));
  await page.mouse.move(x0, y); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + (dx * i) / steps, y); await sleep(ms / steps); }
  if (ms > 200) await sleep(160); // 慢放：停住再放手（沒有甩的速度）
  await page.mouse.up();
}
const settled = (page) => page.waitForFunction(() => !document.getElementById("walkHint")?.closest(".turning"), null, { timeout: 4000 }).catch(() => {});

console.log("▍轉身");
{
  const { ctx, page, errs } = await court();
  const a = await facing(page);
  await drag(page, -W * 0.22, 420); await sleep(900);
  const b = await facing(page);
  check("慢拖 22% 螢幕寬 → 轉到下一站", b !== a, `${a} → ${b}`);
  await drag(page, -W * 0.08, 420); await sleep(900);
  check("只拖 8% → 留在原站（不誤轉）", (await facing(page)) === b);
  await drag(page, W * 0.12, 40); await sleep(900); // 反方向輕甩（剛才已轉到端點那殿）
  const c = await facing(page);
  check("輕甩一下 → 轉一站", c !== b, `${b} → ${c}`);
  check("沒有 JS 錯誤", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{
  const { ctx, page } = await court(4);
  const t = await page.evaluate(async () => {
    const before = document.getElementById("stageStrip").style.transform;
    return before;
  });
  await page.mouse.move(W * 0.75, H * 0.42); await page.mouse.down();
  for (let i = 1; i <= 6; i++) { await page.mouse.move(W * 0.75 - (W * 0.25 * i) / 6, H * 0.42); await sleep(30); }
  await sleep(160);
  const t0 = Date.now(); await page.mouse.up();
  let ms = -1;
  for (let i = 0; i < 80; i++) {
    const still = await page.evaluate(() => new Promise((r) => { const s = document.getElementById("stageStrip"); const a = s.style.transform; requestAnimationFrame(() => requestAnimationFrame(() => r(s.style.transform === a))); }));
    if (still) { ms = Date.now() - t0; break; }
  }
  check("CPU 降速 4 倍：放手後 < 900ms 轉身到位", ms > 0 && ms < 900, `${ms}ms`);
  void t; await ctx.close();
}

console.log("▍拔籤");
async function toTube() {
  const { ctx, page, errs } = await court();
  const box = await page.evaluate(() => { const r = document.querySelector('[data-hall="guanyin"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.7 }; });
  for (let i = 0; i < 6 && !(await page.$eval("#s-hall", (e) => e.classList.contains("on"))); i++) {
    const bb = await page.evaluate(() => { const r = document.querySelector('[data-hall="guanyin"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.7 }; });
    await page.mouse.click(Math.max(5, Math.min(W - 5, bb.x)), bb.y); await sleep(1200);
  }
  void box; await sleep(1800);
  const t = await page.evaluate(() => { const el = document.getElementById("tubeWrap"); el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.75 }; });
  await sleep(400);
  return { ctx, page, errs, t };
}
const drawn = (page) => page.evaluate(() => getComputedStyle(document.getElementById("stickStage")).display !== "none");
async function pull(page, t, dy, ms, flick = false) {
  const steps = Math.max(2, Math.round(ms / 16));
  await page.mouse.move(t.x, t.y); await page.mouse.down();
  for (let i = 1; i <= steps; i++) { await page.mouse.move(t.x, t.y - (dy * i) / steps); await sleep(ms / steps); }
  if (!flick) await sleep(180);
  await page.mouse.up(); await sleep(500);
}
{
  const { ctx, page, errs, t } = await toTube();
  await pull(page, t, 95, 500);
  check("往上拉 95px（一次、不用甩）→ 出籤", await drawn(page));
  check("沒有 JS 錯誤", errs.length === 0, errs.join(" | "));
  await ctx.close();
}
{
  const { ctx, page, t } = await toTube();
  await pull(page, t, 40, 24, true); // 兩下就到四成、手還在往上時放開
  check("拉到四成往上甩著放手 → 出籤", await drawn(page));
  await ctx.close();
}
{
  const { ctx, page, t } = await toTube();
  await pull(page, t, 26, 500);
  const mid = await page.evaluate(() => document.getElementById("tubeStick").style.transform);
  check("慢拉三成放手 → 不出籤", !(await drawn(page)));
  check("籤枝停在半途（不歸零）", !/translateY\(140px\)/.test(mid), mid);
  await pull(page, t, 70, 400);
  check("再拉一小段（70px）→ 出籤", await drawn(page));
  await ctx.close();
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
