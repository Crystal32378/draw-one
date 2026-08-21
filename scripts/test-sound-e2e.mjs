#!/usr/bin/env node
/**
 * test-sound-e2e.mjs — Sound layer runtime API assertions (V2C Phase A).
 *
 * Run: node scripts/test-sound-e2e.mjs
 * Needs playwright-core + a local Chromium; without them it SKIPs (exit 0)
 * so the zero-dependency CI stays honest. Point at a browser with:
 *   PW_CORE=/path/to/node_modules/playwright-core  CHROMIUM=/path/to/chromium
 * Dev 後門（?weather / ?newday / ?devdraw / ?halls）見 docs/testing/qa-cheatsheet.md。
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

console.log("E1 山門無聲 → 天氣票 → 入內手勢啟動");
await page.goto(pageURL("?devdraw=1"));
let p = await params();
check("boot at gate: not started (門檻之外無聲)", p.started === false && p.enabled === true);
check("初訪門檻＝規矩＋天氣四字",
  await page.$$eval(".gw-opt", (els) => els.length === 4) &&
  await page.$eval("#gateRules", (el) => el.style.display !== "none"));
await page.click("#enterBtn"); // 不選＝不答＝常日
await sleep(300);
const ticket1 = await page.evaluate(() => JSON.parse(localStorage.getItem("arrival.ticket.v1")));
check("不答＝常日：票已拿（weather:null）、日期戳在", !!ticket1 && ticket1.weather === null && !!ticket1.date);
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

console.log("E3 devdraw 全流程 → Slip 靜默、收籤句點、回埕還原");
await page.click("#tubeWrap");
await sleep(200);
await page.click("#takeBtn");
await sleep(300);
p = await params();
check("展籤：世界閉嘴 (world duck 0.0001)", p.slip === true && p.targets.world === 0.0001);
check("新抽的籤沒有帶走列（先收，才是你的）", await page.$eval("#takeawayZone", (el) => el.hidden));
await page.click("#keepBtn");
await sleep(500);
check("收籤句點：紙收起一拍（slip-away beat 進行中）",
  await page.$eval("#slipStage", (el) => el.classList.contains("slip-away")));
await sleep(1100);
p = await params();
check("收籤回埕：空氣展開還原", p.space === "court" && p.slip === false && p.targets.busLP === 800 && p.targets.world === 1);
check("回埕無新增 prompt——沒有人留你", await page.$eval("#s-court", (el) => el.classList.contains("on")));

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

console.log("E7 天氣票 — 換票不換殿（dev flag ?weather=）");
p = await params();
check("預設票＝cloudy（74af5ef 基準）", p.weather === "cloudy");
await page.goto(pageURL("?weather=rain&devdraw=1"));
await page.mouse.click(195, 400);
await sleep(300);
p = await params();
check("?weather=rain：票已上、空間照常", p.weather === "rain" && p.space === "court");
await page.mouse.click(360, 280); await sleep(1000);
await page.mouse.click(195, 280); await sleep(900);
p = await params();
check("雨天進殿＝同一扇窗（hall 變換值與 cloudy 字面相同）",
  p.space === "hall" && p.weather === "rain" && p.targets.busLP === 300 && p.targets.busGain === 0.5);
await page.click("#backBtn");
await sleep(300);

console.log("E8 帶走這支籤 — 籤簿中的紙、完整產圖 pipeline");
await page.goto(pageURL("?devdraw=1"));
await page.mouse.click(195, 400);
await sleep(200);
await page.click("#bookObj");
await sleep(200);
await page.click(".book-entry");
await sleep(500);
check("籤簿的籤有帶走列", await page.$eval("#takeawayZone", (el) => !el.hidden));
await page.click("#copyBtn");
await sleep(300);
const copyTxt = await page.$eval("#copyBtn", (el) => el.textContent);
check("複製籤文有回饋（已複製／複製失敗，皆不崩）", copyTxt === "已複製" || copyTxt === "複製失敗");
// headless 的 navigator.share 會開不出 share sheet 而永遠 pending——stub 掉，
// 逼走 download 路徑（要驗的是產圖 pipeline；share sheet 本身屬真機驗收）
await page.evaluate(() => { navigator.canShare = undefined; });
await page.click("#takeawayBtn");
let takeawayOk = false;
for (let i = 0; i < 40; i++) { // 產圖含字型子集下載，寬限 20s
  await sleep(500);
  const t = await page.$eval("#takeawayBtn", (el) => el.textContent);
  if (t === "帶走這支籤") { takeawayOk = true; break; }
  if (t.includes("失敗")) break;
}
check("產圖 pipeline 完整跑通（字型內嵌×SVG×canvas×PNG）", takeawayOk);

console.log("E10 一天一張票 — 薄門檻、跨日作廢、當日沿用");
await page.goto(pageURL("?devdraw=1"));
check("當日已有票＝直落埕", await page.$eval("#s-court", (el) => el.classList.contains("on")));
await page.evaluate(() => localStorage.setItem("arrival.ticket.v1", JSON.stringify({ date: "2000-1-1", weather: null })));
await page.reload();
await sleep(300);
check("跨日票作廢＝薄門檻（規矩隱、日期節氣刻字在）",
  await page.$eval("#s-gate", (el) => el.classList.contains("on")) &&
  await page.$eval("#gateRules", (el) => el.style.display === "none") &&
  await page.$eval("#gateDate", (el) => el.textContent.includes("・")));
await page.click('.gw-opt[data-w="rain"]');
await sleep(200);
check("選票落定（其他字退開）", await page.$eval("#gateWeather", (el) => el.classList.contains("chosen")));
await page.click("#enterBtn");
await sleep(400);
p = await params();
let t2 = await page.evaluate(() => JSON.parse(localStorage.getItem("arrival.ticket.v1")));
check("拿了雨票入內：weather=rain、票寫回今天", p.weather === "rain" && t2.weather === "rain");
check("刻字回聲：中軸刻上今天的票（…・雨）",
  await page.$eval(".void-heart", (el) => el.textContent.endsWith("・雨")));
await page.reload();
await sleep(300);
p = await params();
check("同日 reload：直落埕、票沿用",
  (await page.$eval("#s-court", (el) => el.classList.contains("on"))) && p.weather === "rain");

await page.goto(pageURL("?newday=1&devdraw=1"));
await sleep(300);
check("?newday=1 撕票重過門檻（dev 後門，手賤型測試者專用）",
  await page.$eval("#s-gate", (el) => el.classList.contains("on")));
await page.click("#enterBtn");
await sleep(300);

console.log("E9 手感層 API");
check("pull/stickOut/paperOut 都在公開 API 上",
  await page.evaluate(() => ["pull", "stickOut", "paperOut"].every((k) => typeof window.ARRIVAL_SOUND[k] === "function")));

console.log("E6 console 乾淨");
check("no console/page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
