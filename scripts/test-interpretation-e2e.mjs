#!/usr/bin/env node
/**
 * test-interpretation-e2e.mjs — 三殿歷史解讀層 + 紙落定即入籤簿 runtime 驗收。
 *
 * Run: node scripts/test-interpretation-e2e.mjs
 * Needs playwright-core + a local Chromium/Chrome; without them it SKIPs (exit 0).
 *   PW_CORE=/path/to/node_modules/playwright-core  CHROMIUM=/path/to/chrome
 *   SHOTS=/some/dir  → also writes screenshots of each fold state.
 *
 *   X1 真抽一次（devdraw）：紙落定即入簿（PR #32）、同問原籤、筆記、摺頁與 guard 一致
 *   X2 觀音：已核圖／待複核／暫未上紙（#12）
 *   X3 關帝：待複核／暫未上紙（#58）——被暫緩的字不進 DOM
 *   X4 六十甲子：整套暫緩，只給原因＋官方連結
 *   X5 fail-closed：pool 被換版 → 整層消失（含「暫未上紙」）
 *   X6 私人資料：問題與筆記只在 localStorage；無任何請求帶走它們
 *   X7 console 乾淨
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
function check(name, ok, detail = "") {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = process.env.SHOTS || null;
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath, args: ["--autoplay-policy=no-user-gesture-required", "--no-sandbox"] });
const pageURL = (q) => pathToFileURL(join(ROOT, "paper", "arrival.html")).href + q;
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
const consoleErrors = [], requests = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push(String(e)));
page.on("request", (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() || "" }));
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: join(SHOTS, name + ".png"), fullPage: true }); };

const QUESTION = "E2E 之問 這件事該不該做"; // 已是 normalizeQuestion（NFKC＋空白）後的樣子
const NOTE = "E2E 筆記 先放著";
const book = () => page.evaluate(() => JSON.parse(localStorage.getItem("drawone.book.v1") || "[]"));
const fold = () => page.evaluate(() => {
  const $ = (id) => document.getElementById(id);
  return {
    hidden: $("jieyue").hidden, open: !$("jieyueBody").hidden,
    word: $("jieyueWord").textContent, prov: $("jieyueProv").textContent,
    text: $("jieyueText").textContent, textHidden: $("jieyueText").hidden,
    src: $("jieyueSrc").hidden ? "" : $("jieyueSrc").textContent,
    about: $("jieyueAbout").hidden ? "" : $("jieyueAbout").textContent, aboutHidden: $("jieyueAbout").hidden,
    link: $("jieyueLink").hidden ? null : { href: $("jieyueLink").getAttribute("href"), text: $("jieyueLink").textContent, rel: $("jieyueLink").rel },
    expanded: $("jieyueToggle").getAttribute("aria-expanded"),
    stageText: $("slipStage").innerText,
  };
});
const openFold = async () => { await page.click("#jieyueToggle"); await sleep(120); };

console.log("X1 真抽一次 — 紙落定即入簿、同問原籤、筆記、摺頁＝guard 的決定");
await page.goto(pageURL("?devdraw=1"));
await page.click("#enterBtn"); await sleep(300);
await page.fill("#question", QUESTION);
await page.mouse.click(360, 280); await sleep(1000);  // 轉正
await page.mouse.click(195, 280); await sleep(900);   // 進殿
check("進殿", await page.$eval("#s-hall", (el) => el.classList.contains("on")));
check("抽籤前籤簿是空的", (await book()).length === 0);
await page.click("#tubeWrap"); await sleep(200);
await page.click("#takeBtn"); await sleep(400);
let b = await book();
check("紙落定即入簿：未按「收進」已有 1 筆，帶著問題", b.length === 1 && b[0].question === QUESTION && b[0].note === "");
check("紙在即可帶走", await page.$eval("#takeawayZone", (el) => !el.hidden));
const drawn = b[0].entryId;
const expect = await page.evaluate((id) => {
  const e = window.DRAW_POOL.entries.find((x) => x.id === id);
  const pools = { guanyin: window.INTERPRETATION_POOL, guandi: window.INTERPRETATION_POOL_GUANDI };
  const rec = window.JIEYUE_GUARD.resolveFrom(pools, e);
  const hold = rec ? null : window.JIEYUE_GUARD.holdFor(window.INTERPRETATION_HOLDS, pools, e);
  return { text: rec ? rec.text : null, hold: hold ? hold.scope : null };
}, drawn);
let f = await fold();
check("摺頁預設收合", f.hidden === false ? (f.open === false && f.expanded === "false") : true);
await openFold(); f = await fold();
check(`抽到 ${drawn}：摺頁內容＝guard 的決定`, expect.text ? f.text === expect.text : (expect.hold ? f.text === "" && f.textHidden : f.hidden));
await page.click("#backBtn"); await sleep(500);       // 不收，直接回埕
check("回埕不收：籤簿仍是 1 筆（單一帳本）", (await book()).length === 1
  && (await page.$eval("#bookCount", (el) => el.textContent)).includes("1"));
const strip = await page.$(".bound-strip");
check("同一個問題：案上放著原來那支", !!strip);
await strip.click(); await sleep(900);
check("點看＝同一支籤，沒有重抽、沒有新增", (await book()).length === 1 && (await book())[0].entryId === drawn);
await page.fill("#noteInput", NOTE);
await page.click("#keepBtn"); await sleep(1300);
b = await book();
check("收進：只補筆記，不新增條目", b.length === 1 && b[0].note === NOTE && b[0].question === QUESTION);
const binds = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("drawone.bindings")));
check("一事一籤綁定仍在", binds.length === 1);

// --- seed the private book with fixed slips so each fold state is deterministic ---
const pickPending = await page.evaluate(() => Object.entries(window.INTERPRETATION_POOL.entries).find(([, e]) => !e.confirmed)[0]);
const SEED = [
  ["guanyin-001", "guanyin"], [pickPending, "guanyin"], ["guanyin-012", "guanyin"],
  ["guandi-001", "guandi"], ["guandi-058", "guandi"], ["liushijiazi-001", "liushijiazi"],
];
await page.evaluate(({ SEED }) => {
  const cur = JSON.parse(localStorage.getItem("drawone.book.v1") || "[]");
  const add = SEED.map(([entryId, corpusId], i) => ({ ts: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(), question: `seed-${entryId}`, entryId, corpusId, note: "" }));
  localStorage.setItem("drawone.book.v1", JSON.stringify([...add, ...cur]));
}, { SEED });
await page.reload(); await sleep(300);
await page.mouse.click(195, 500); await sleep(300); // 回訪首次觸碰
const view = async (entryId) => {
  if (await page.$eval("#s-hall", (el) => el.classList.contains("on"))) { await page.click("#backBtn"); await sleep(450); }
  await page.click("#bookObj"); await sleep(250);
  const idx = await page.evaluate((id) => JSON.parse(localStorage.getItem("drawone.book.v1")).findIndex((x) => x.entryId === id && x.question === `seed-${id}`), entryId);
  await page.locator("#bookList button").nth(idx).click(); await sleep(500);
};
const poolText = (g, id) => page.evaluate(({ g, id }) => window[g].entries[id].text, { g, id });

console.log("X2 觀音殿 — 已核圖／待複核／暫未上紙");
await view("guanyin-001"); f = await fold();
check("#1 摺頁出現、收合、標「艋舺龍山寺版・已核圖」", !f.hidden && !f.open && f.word === "解曰" && f.prov === "艋舺龍山寺版・已核圖");
await openFold(); f = await fold();
check("#1 展開＝原文逐字", f.open && f.text === await poolText("INTERPRETATION_POOL", "guanyin-001"));
check("#1 來源＋人工核圖；文案同 PR #34 原版（無說明句）", f.src === "據艋舺龍山寺《觀世音靈籤》（薛皓文 2008 附錄二所收錄之籤紙影像），附錄二 p179，人工核圖確認" && f.aboutHidden
  && /corpus-review-guanyin\.html\?q=1$/.test(f.link?.href ?? ""));
await shot("guanyin-confirmed");
await view(pickPending); await openFold(); f = await fold();
check(`${pickPending} 標「待複核」，不寫成已核圖`, f.prov === "艋舺龍山寺版・待複核" && f.src.endsWith("，待複核") && !f.src.includes("核圖") && f.aboutHidden
  && f.text === await poolText("INTERPRETATION_POOL", pickPending));
await shot("guanyin-pending");
await view("guanyin-012"); f = await fold();
// 2026-11-15 待複核不等於隱藏：有缺字的也上紙，標明、不補字。
check("#12 有缺字也上紙：有一行、收合、標「有缺字・待核對」", !f.hidden && !f.open && f.prov === "艋舺龍山寺版・有缺字・待核對");
await openFold(); f = await fold();
check("#12 原文逐字（缺字留 □，沒補）＋一句說明＋通往校對館這一籤", f.text === await poolText("INTERPRETATION_POOL", "guanyin-012") && f.text.includes("□") && !f.textHidden
  && f.about.includes("留著 □") && f.about.includes("沒有補") && f.src.endsWith("，待核對") && !f.src.includes("核圖確認") && /corpus-review-guanyin\.html\?q=12$/.test(f.link?.href ?? ""));
await shot("guanyin-withheld");

console.log("X3 關帝殿 — 待複核／暫未上紙");
await view("guandi-001"); f = await fold();
check("#1 標「道藏本・待複核」", !f.hidden && f.word === "解曰" && f.prov === "道藏本・待複核");
await openFold(); f = await fold();
check("#1 展開＝原文逐字；來源寫明維基文庫轉錄、未核道藏影像", f.text === await poolText("INTERPRETATION_POOL_GUANDI", "guandi-001")
  && f.src.includes("道藏本") && f.src.includes("維基文庫轉錄") && f.src.endsWith("待複核") && f.about.includes("還沒有逐籤對過道藏影像")
  && f.about.includes("不是抽一的話") && f.about.includes("預測"));
await shot("guandi-pending");
await view("guandi-058"); await openFold(); f = await fold();
check("#58 有疑字也上紙：標「有疑字・待核對」，說「疑似認錯的字」「沒有改」", f.prov === "道藏本・有疑字・待核對" && f.about.includes("疑似認錯的字") && f.about.includes("沒有改")
  && f.about.includes("不是抽一的話"));
check("#58 原文逐字照轉錄（疑字沒被偷改）＋通往校對館這一籤", f.text === await poolText("INTERPRETATION_POOL_GUANDI", "guandi-058") && f.text.includes("求名爻得")
  && /corpus-review-guandi\.html\?q=58$/.test(f.link?.href ?? ""));
await shot("guandi-withheld");

console.log("X4 天上聖母殿（六十甲子）— 整套暫緩");
await view("liushijiazi-001"); f = await fold();
check("一行「廟方解說・暫未上紙」，收合", !f.hidden && !f.open && f.word === "廟方解說" && f.prov === "暫未上紙");
await openFold(); f = await fold();
check("說明兩個原因：授權未確認、僅一次機器辨識", f.about.includes("授權還沒有確認") && f.about.includes("一次機器辨識") && f.about.includes("不轉載、不摘要"));
check("沒有任何廟方解說文字；只給官方連結（https、noopener）", f.text === "" && f.textHidden && f.src === ""
  && f.link && /^https:\/\/www\.matsu\.org\.tw\//.test(f.link.href) && f.link.rel.includes("noopener") && f.link.text.includes("北港朝天宮"));
check("紙本身照常（籤詩仍在）", f.stageText.includes("日") && (await page.$("#slipMount .slip, #slipMount > *")) !== null);
await shot("mazu-held");

console.log("X5 fail-closed — pool 被換版，整層消失");
await page.evaluate(() => { window.INTERPRETATION_POOL_GUANDI.content_version = "0".repeat(64); });
await view("guandi-001"); f = await fold();
check("關帝 #1：摺頁不顯示", f.hidden === true);
await view("guandi-058"); f = await fold();
check("關帝 #58：連「暫未上紙」也不說（不替壞掉的資料背書）", f.hidden === true);
await view("guanyin-001"); f = await fold();
check("觀音不受影響", f.hidden === false && f.prov.endsWith("已核圖"));

console.log("X8 一事一籤跨殿 — 原籤保留，但不掛在別殿的聖號底下（Astra 2026-11-14 回報）");
{
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p2 = await c2.newPage();
  const Q = "跨殿之問 同一件事";
  await p2.goto(pageURL(""));
  // 以真實資料結構備妥「這個問題已在關帝殿抽過」：籤簿＋綁定都由頁面自己的 policy 寫入
  const seeded = await p2.evaluate((Q) => {
    const P = window.DRAW_POOL, e = P.entries.find((x) => x.id === "guandi-001");
    const drawn = window.DRAW_POLICY.resolveDraw({ question: Q, corpusId: "guandi", drawFn: () => e });
    localStorage.setItem("drawone.book.v1", JSON.stringify([{ ts: new Date().toISOString(), question: window.DRAW_POLICY.normalizeQuestion(Q), entryId: "guandi-001", corpusId: "guandi", note: "" }]));
    return drawn.entryId;
  }, Q);
  check("備妥：這個問題綁在關帝第一籤", seeded === "guandi-001");
  await p2.reload(); await sleep(300);
  if (await p2.$eval("#s-gate", (el) => el.classList.contains("on"))) { await p2.click("#enterBtn"); await sleep(400); }
  await p2.fill("#question", Q);
  // 進觀音殿（由 DOM 找位置，不寫死座標）
  const pos = async (id) => p2.evaluate((id) => { const f = document.querySelector(`[data-hall="${id}"]`).getBoundingClientRect(), v = document.getElementById("courtView").getBoundingClientRect();
    return { x: (Math.max(f.left, v.left) + Math.min(f.right, v.right)) / 2, y: v.top + v.height * 0.36, centered: Math.abs((f.left + f.right) / 2 - (v.left + v.right) / 2) < 3 }; }, id);
  for (let i = 0; i < 4 && !(await pos("guanyin")).centered; i++) { const q = await pos("guanyin"); await p2.mouse.click(q.x, q.y); await sleep(1500); }
  { const q = await pos("guanyin"); await p2.mouse.click(q.x, q.y); await sleep(1500); }
  const st = () => p2.evaluate(() => { const $ = (i) => document.getElementById(i); return { hall: $("s-hall").classList.contains("on"), tablet: $("tablet").textContent,
    slip: getComputedStyle($("slipStage")).display !== "none", tube: getComputedStyle($("tubeStage")).display !== "none",
    elsewhere: !$("elsewhere").hidden, text: $("elsewhereText").textContent, btn: $("elsewhereBtn").textContent, sub: $("hallSub").textContent,
    slipText: $("slipMount").innerText, fold: $("jieyue").hidden ? null : $("jieyueProv").textContent }; });
  let a = await st();
  check("在觀音殿：聖號是觀世音，沒有把關帝的籤掛出來，也不能重抽", a.hall && a.tablet === "觀世音" && !a.slip && !a.tube);
  check("只說那支籤在哪一殿", a.elsewhere && a.text.includes("關帝殿") && a.text.includes("不重抽") && a.btn.includes("關帝殿"));
  await p2.click("#elsewhereBtn"); await sleep(600);
  a = await st();
  check("過去之後：聖號、版本、籤、解曰來源全部是關帝", a.tablet === "關帝" && a.sub.includes("道藏本") && a.slip && a.slipText.includes("第一籤") && a.fold === "道藏本・待複核" && !a.elsewhere);
  const after = await p2.evaluate(() => ({ book: JSON.parse(localStorage.getItem("drawone.book.v1")), binds: Object.values(JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith("drawone.bindings"))))).flat() }));
  check("原籤與綁定原封不動（沒有重抽、沒有新增）", after.book.length === 1 && after.book[0].entryId === "guandi-001" && after.binds.length === 1 && after.binds[0].entry_id === "guandi-001");
  await p2.click("#backBtn"); await sleep(600);
  check("回埕：面向關帝殿（你剛去的那一殿）", (await pos("guandi")).centered);
  await c2.close();
}

console.log("X6 私人資料 — 問題與筆記不離開這台裝置");
const allowed = (u) => u.startsWith("file:") || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u) || u.startsWith("data:") || u.startsWith("blob:");
const stray = requests.filter((r) => !allowed(r.url));
check("除本機檔案與字型外，沒有任何對外請求", stray.length === 0, stray.map((r) => r.url).join(" "));
const leak = requests.filter((r) => [QUESTION, NOTE, encodeURIComponent(QUESTION), encodeURIComponent(NOTE), "seed-"].some((s) => r.url.includes(s) || r.body.includes(s)));
check("沒有請求帶著問題或筆記", leak.length === 0 && requests.every((r) => r.method === "GET"));
b = await book();
check("籤簿原有資料完整保留（真抽那筆＋筆記）", b.some((x) => x.entryId === drawn && x.question === QUESTION && x.note === NOTE) && b.length === SEED.length + 1);

console.log("X7 console");
const real = consoleErrors.filter((e) => !/fonts\.(googleapis|gstatic)|ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|PROXY|TUNNEL|CONNECTION|CERT)|Failed to load resource/.test(e));
check("console 乾淨", real.length === 0, real.join(" | "));

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
