#!/usr/bin/env node
/**
 * test-arrival-ink-e2e.mjs — 入廟體驗 ink pass 的 runtime 驗收（手機＋桌機裁切、三殿相等、可動層）。
 *
 * Run: node scripts/test-arrival-ink-e2e.mjs
 * Needs playwright-core + a local Chromium/Chrome; without them it SKIPs (exit 0).
 *   PW_CORE=/path/to/node_modules/playwright-core  CHROMIUM=/path/to/chrome  SHOTS=/dir（另存截圖）
 *
 * 點擊位置一律由 DOM 算（不寫死座標）——版面改了，測試不該跟著卡住。
 */
import { existsSync, mkdirSync } from "node:fs";
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
const SHOTS = process.env.SHOTS || null; if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const pageURL = (q = "") => pathToFileURL(join(ROOT, "paper", "arrival.html")).href + q;

// 站的可點位置（畫面內、該站可見部分的中點）；faced＝正對與否；box＝殿面在畫面上的框
const station = (page, hallId) => page.evaluate((id) => {
  const f = document.querySelector(`[data-hall="${id}"]`); const v = document.getElementById("courtView").getBoundingClientRect();
  const r = f.getBoundingClientRect(); const h = f.querySelector(".ink-hall").getBoundingClientRect();
  const x0 = Math.max(r.left, v.left) + 3, x1 = Math.min(r.right, v.right) - 3;
  return { x: (x0 + x1) / 2, y: v.top + v.height * 0.36, visible: x1 > x0,
    box: { l: h.left, r: h.right, t: h.top, b: h.bottom, w: h.width, h: h.height }, view: { l: v.left, r: v.right, t: v.top, b: v.bottom, w: v.width } };
}, hallId);
const settled = (page) => page.waitForFunction(() => {
  const a = document.getElementById("stageStrip").style.transform; window.__t = window.__t === a ? window.__t : (window.__n = 0, a);
  return (window.__n = (window.__n || 0) + 1) > 12; }, null, { polling: 50, timeout: 8000 });
const on = (page, id) => page.$eval("#" + id, (el) => el.classList.contains("on"));

const VIEWPORTS = [["手機直 390×844", 390, 844, true], ["小手機 360×640", 360, 640, true], ["手機橫 844×390", 844, 390, true],
  ["平板 1024×768", 1024, 768, false], ["桌機 1440×900", 1440, 900, false]];
const HALLS = ["guanyin", "mazu", "guandi"];

for (const [label, w, h, touch] of VIEWPORTS) {
  console.log(`▍${label}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch });
  const page = await ctx.newPage();
  const errs = [], reqs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on("request", (r) => reqs.push(r.url()));
  await page.goto(pageURL("?devdraw=1"));
  check("山門：規矩與入內都在畫面內", await page.evaluate(() => { const r = document.getElementById("enterBtn").getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }));
  await page.click("#enterBtn"); await page.waitForTimeout(700);
  const facing0 = await page.evaluate(() => document.getElementById("walkHint").textContent);
  check("入內落在埕、面向中軸空段（不預選任何一殿）", (await on(page, "s-court")) && facing0.includes("左右轉身"));
  // 中軸留白：空段中央 ±15% 站寬內沒有任何小景
  const voidClear = await page.evaluate(() => {
    const v = document.querySelector(".void-station").getBoundingClientRect(); const cx = v.left + v.width / 2, half = v.width * 0.15;
    return [...document.querySelectorAll(".lived.sprite, .lived.sparrow")].every((el) => { const r = el.getBoundingClientRect(); return r.right < cx - half || r.left > cx + half; });
  });
  check("中軸空段中央不放東西", voidClear);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w}x${h}-void.png`) });

  const boxes = {};
  for (const id of HALLS) {
    // 轉到正對：非正對的點擊只轉身（可能要兩次：先轉到鄰站）
    for (let i = 0; i < 4; i++) {
      const s = await station(page, id);
      const centered = Math.abs((s.box.l + s.box.r) / 2 - (s.view.l + s.view.r) / 2) < 3;
      if (centered) break;
      if (s.visible) { await page.mouse.click(s.x, s.y); }
      else { const dir = s.box.l > s.view.r ? 1 : -1; const v = s.view; await page.mouse.move((v.l + v.r) / 2, v.t + 60); await page.mouse.down();
        await page.mouse.move((v.l + v.r) / 2 - dir * v.w * 0.5, v.t + 60, { steps: 6 }); await page.mouse.up(); }
      await settled(page);
      check(`${id}：轉身不會直接進殿`, await on(page, "s-court"));
    }
    const s = await station(page, id); boxes[id] = s.box;
    check(`${id}：正對時殿面完整在畫面內（脊、柱、門、階都不被裁）`, s.box.l >= s.view.l - 1 && s.box.r <= s.view.r + 1 && s.box.t >= s.view.t - 1 && s.box.b <= s.view.b + 1,
      JSON.stringify(s.box));
    if (SHOTS && id === "guanyin") await page.screenshot({ path: join(SHOTS, `${w}x${h}-faced.png`) });
  }
  const eq = (a, b) => Math.abs(a - b) < 0.6;
  check("三殿正對時尺寸與位置完全相同（透視不是位階）", HALLS.every((id) => eq(boxes[id].w, boxes.guanyin.w) && eq(boxes[id].h, boxes.guanyin.h) && eq(boxes[id].t, boxes.guanyin.t) && eq(boxes[id].l, boxes.guanyin.l)));
  check("殿面不拉伸（8:9 固定長寬比）", eq(boxes.guanyin.h / boxes.guanyin.w, 1.125) || Math.abs(boxes.guanyin.h / boxes.guanyin.w - 1.125) < 0.01);
  const same = await page.evaluate(() => { const strip = (el) => el.querySelector("svg").outerHTML; const a = [...document.querySelectorAll(".station:not(.hypothetical) .ink-hall")].map(strip); return a.length === 3 && a.every((x) => x === a[0]); });
  check("三殿是同一份墨筆模板（逐字相同）", same);

  // 推門 → 進殿 → 走近籤筒
  const g = await station(page, "guandi");
  await page.mouse.click(g.x, g.y);
  const opening = await page.evaluate(() => document.querySelector('[data-hall="guandi"]').classList.contains("opening") && [...document.querySelectorAll(".facade.opening")].length === 1);
  check("正對後再點：只有這一殿的門打開", opening);
  await page.waitForTimeout(1700);
  check("門開之後才進殿", await on(page, "s-hall"));
  const tube = await page.evaluate(() => { const r = document.getElementById("tubeWrap").getBoundingClientRect(); return { t: r.top, b: r.bottom, vh: innerHeight, shown: getComputedStyle(document.getElementById("tubeStage")).display !== "none" }; });
  check("走近：籤筒被帶進畫面", tube.shown && tube.b <= tube.vh + 2 && tube.b > 80, JSON.stringify(tube));
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w}x${h}-hall.png`) });
  const moving = await page.evaluate(() => ({ stick: !!document.getElementById("tubeStick"), candles: document.querySelectorAll(".censer .candle").length, lamps: document.querySelectorAll(".hall-ink .hl").length,
    anims: document.getAnimations().length }));
  check("殿內活物各自成層（籤枝、一對燭、一對燈；有在動）", moving.stick && moving.candles === 2 && moving.lamps === 2 && moving.anims > 0);
  await page.click("#tubeWrap"); await page.waitForTimeout(250); await page.click("#takeBtn"); await page.waitForTimeout(500);
  const slip = await page.evaluate(() => ({ paper: !!document.querySelector("#slipMount .slip"), book: JSON.parse(localStorage.getItem("drawone.book.v1") || "[]").length }));
  check("抽籤照舊：原籤紙元件、紙落定入簿", slip.paper && slip.book === 1);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${w}x${h}-slip.png`) });
  await page.click("#backBtn"); await page.waitForTimeout(700);
  check("回埕：門已掩上、朝向留在剛才那殿（session 內）", (await on(page, "s-court")) && (await page.evaluate(() => document.querySelectorAll(".facade.opening").length === 0)));
  await page.reload(); await page.waitForTimeout(600);
  const backToVoid = await page.evaluate(() => { const v = document.querySelector(".void-station").getBoundingClientRect(), c = document.getElementById("courtView").getBoundingClientRect();
    return Math.abs((v.left + v.right) / 2 - (c.left + c.right) / 2) < 3; });
  check("reload：回到中軸空段（朝向不持久化）", (await on(page, "s-court")) && backToVoid);
  check("沒有對外請求（字型除外）", reqs.every((u) => u.startsWith("file:") || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u) || u.startsWith("data:")), reqs.filter((u) => !u.startsWith("file:") && !u.startsWith("data:") && !/fonts\./.test(u)).join(" "));
  check("console 乾淨", errs.length === 0, errs.join(" | "));
  await ctx.close();
}

console.log("▍增建殿（?halls=4）與 reduced motion");
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(pageURL("?halls=4")); await page.click("#enterBtn"); await page.waitForTimeout(400);
  const hyp = await page.evaluate(() => { const st = document.querySelector(".station.hypothetical"); const cs = (sel) => [...st.querySelectorAll(sel)].map((e) => getComputedStyle(e).display);
    return { life: cs(".k-life").every((d) => d === "none"), wash: cs(".k-wash").every((d) => d === "none"), brush: cs(".k-brush").every((d) => d === "none"), lines: cs(".k-plan").length > 0 && cs(".k-plan").every((d) => d !== "none"), mark: st.textContent.includes("增建中") }; });
  check("月老：同一份模板只剩放樣虛線——無門、無光、無獅、無墨染", hyp.life && hyp.wash && hyp.brush && hyp.lines && hyp.mark);
  const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  check("prefers-reduced-motion：沒有任何持續動畫", running === 0, String(running));
  await ctx.close();
}
await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
