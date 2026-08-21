#!/usr/bin/env node
/**
 * test-sound-e2e.mjs — Sound layer runtime API assertions (V2C Phase A).
 *
 * Run: node scripts/test-sound-e2e.mjs
 * Needs playwright-core + a local Chromium; without them it SKIPs (exit 0)
 * so the zero-dependency CI stays honest. Point at a browser with:
 *   PW_CORE=/path/to/node_modules/playwright-core  CHROMIUM=/path/to/chromium
 *
 * Asserts the acceptance-table state transitions（交參數，不交形容詞）：
 *   E1 山門無聲；「入內」手勢後 started、court targets (busLP 800)
 *   E2 兩段式進殿後 hall targets (busLP 300 / busGain 0.5)
 *   E3 devdraw 全流程：展籤＝world duck；收籤回埕＝還原
 *   E4 ?halls=4 月老 fail-closed：進殿後聲態仍是 court
 *   E5 「聲」toggle：關→localStorage 持久化→reload 仍關→開
 *   E6 console 乾淨
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let chromium;
try {
  const pwPath = process.env.PW_CORE ?? join(ROOT, "..", "shotkit", "node_modules", "playwright-core");
  ({ chromium } = await import(pathToFileURL(join(pwPath, "index.mjs")).href)
    .catch(() => import("playwright-core")));
} catch {
  console.log("SKIP: playwright-core not available — runtime sound assertions not run here.");
  process.exit(0);
}
const candidates = [
  process.env.CHROMIUM,
  join(homedir(), "Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
  join(homedir(), "Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell"),
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) {
  console.log("SKIP: no local Chromium found — set CHROMIUM=/path/to/binary.");
  process.exit(0);
}

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  executablePath,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const pageURL = (q) => pathToFileURL(join(ROOT, "paper", "arrival.html")).href + q;
const consoleErrors = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
const params = () => page.evaluate(() => window.ARRIVAL_SOUND.getParams());

console.log("E1 山門無聲 → 入內手勢啟動");
await page.goto(pageURL("?devdraw=1"));
let p = await params();
check("boot at gate: not started (門檻之外無聲)", p.started === false && p.enabled === true);
await page.click("#enterBtn");
await sleep(300);
p = await params();
check("入內後 started、空間＝court", p.started === true && p.space === "court" && p.slip === false);
check("court targets: busLP 800 / busGain 1 / world 1",
  p.targets.busLP === 800 && p.targets.busGain === 1 && p.targets.world === 1);

console.log("E2 兩段式進殿 → 空氣收窄");
await page.mouse.click(360, 280); // 第一次 tap：轉正（不進殿）
await sleep(1000);
p = await params();
check("轉正後仍是 court（系統不替你走最後幾步）", p.space === "court");
await page.mouse.click(195, 280); // 第二次 tap：進殿
await sleep(900);
check("hall screen on", await page.$eval("#s-hall", (el) => el.classList.contains("on")));
p = await params();
check("hall targets: busLP 300 / busGain 0.5（同步 crossfade）",
  p.space === "hall" && p.targets.busLP === 300 && p.targets.busGain === 0.5);
check("葉聲退遠 targets: leafLP 1100 / leafGain 0.35",
  p.targets.leafLP === 1100 && p.targets.leafGain === 0.35);

console.log("E3 devdraw 全流程 → Slip 靜默與回埕還原");
await page.click("#tubeWrap");
await sleep(200);
await page.click("#takeBtn");
await sleep(300);
p = await params();
check("展籤：世界閉嘴 (world duck 0.0001)", p.slip === true && p.targets.world === 0.0001);
await page.click("#keepBtn");
await sleep(400);
p = await params();
check("收籤回埕：空氣展開還原", p.space === "court" && p.slip === false && p.targets.busLP === 800 && p.targets.world === 1);

console.log("E4 ?halls=4 月老 fail-closed — 無殿內聲態");
await page.goto(pageURL("?halls=4&devdraw=1"));
await page.mouse.click(195, 400); // 回訪首次觸碰＝手勢啟動
await sleep(300);
p = await params();
check("回訪首次觸碰後 started", p.started === true && p.space === "court");
await page.mouse.click(30, 280);  await sleep(1000); // 轉向天上聖母
await page.mouse.click(30, 280);  await sleep(1000); // 轉向月老（工地）
await page.mouse.click(195, 280); await sleep(900);  // 進月老
const unbuiltShown = await page.$eval("#unbuilt", (el) => !el.hidden);
p = await params();
check("進了增建中的月老（unbuilt 顯示）", unbuiltShown);
check("聲態仍是 court——埕的空氣照常經過工地", p.space === "court" && p.targets.busLP === 800);
await page.click("#backBtn");
await sleep(300);
p = await params();
check("回埕 no-op 還原（狀態冪等）", p.space === "court" && p.targets.busLP === 800);

console.log("E5 「聲」toggle — 偏好持久化");
await page.click("#soundToggleCourt");
await sleep(200);
p = await params();
const stored = await page.evaluate(() => localStorage.getItem("arrival.sound.v1"));
check("關聲：enabled=false、localStorage=false", p.enabled === false && stored === "false");
check("兩顆 toggle UI 同步為 off", await page.$$eval(".sound-toggle", (els) => els.every((e) => e.classList.contains("off"))));
await page.reload();
await sleep(300);
p = await params();
check("reload 後仍關（記憶私人）", p.enabled === false && p.started === false);
await page.click("#soundToggleCourt");
await sleep(300);
p = await params();
check("再開：toggle 點擊本身是手勢，直接有聲", p.enabled === true && p.started === true);

console.log("E6 console 乾淨");
check("no console/page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
