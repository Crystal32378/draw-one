#!/usr/bin/env node
/**
 * test-sound.mjs — Sound layer source contracts (V2C Phase A).
 *
 * Run: node scripts/test-sound.mjs
 *
 * S1–S5 are source-contract checks on paper/arrival.html:
 *   S1 isolation      — 聲音層零 mechanics 引用、零資產、零音高源
 *   S2 equality       — 三殿聲學參數字面相等（只有一份 hall 表；API 不收身分）
 *   S3 fail-closed    — 月老無殿內聲態；hall 聲態只有一個進入點且被 guard
 *   S4 air grammar    — 陣風排程無週期；減法優先的空間參數；Slip 靜默
 *   S5 gesture/toggle — 手勢後啟動；「聲」偏好持久化；lifecycle resume
 * Runtime API 狀態斷言另見 test-sound-e2e.mjs（需 playwright-core，無則 skip）。
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
const sBegin = html.indexOf("sound-layer:begin");
const sEnd = html.indexOf("sound-layer:end");
const sound = sBegin > -1 && sEnd > sBegin ? html.slice(sBegin, sEnd) : "";
// 主 mechanics script＝最後一個 <script> block（與 test-arrival 同一慣例）
const main = html.slice(html.lastIndexOf("<script>") + 8, html.lastIndexOf("</script>"));

console.log("S1 isolation — 聲音層是空氣，不是機關");
check("sound layer block exists (markers)", sound.length > 0);
check("zero mechanics references",
  !/DRAW_POLICY|DRAW_POOL|SLIP_RENDER|peekBinding|resolveDraw|normalizeQuestion|corpusId|entryId/.test(sound));
check("zero deity identity (聲音不認得誰是誰)",
  !/guanyin|mazu|guandi|yuelao|觀世音|天上聖母|關帝|月老/.test(sound));
check("zero mechanics storage keys",
  !/drawone\.book|arrival\.lasthall|arrival\.visited/.test(sound));
check("its only storage key is arrival.sound.v1",
  /PREF_KEY = "arrival\.sound\.v1"/.test(sound) &&
  (sound.match(/localStorage\.(getItem|setItem)\(/g) ?? []).every(Boolean) &&
  !/localStorage\.(getItem|setItem)\((?!PREF_KEY)/.test(sound));
check("zero assets, zero download (全合成即誠實)",
  !/fetch\(|XMLHttpRequest|new Audio|\.mp3|\.wav|\.ogg|decodeAudioData/.test(sound));
check("zero OscillatorNode — 無音高源＝無旋律＝無週期 LFO",
  !/createOscillator|OscillatorNode/.test(sound));
check("no periodic scheduler (setInterval) — 陣風沒有節拍器",
  !/setInterval/.test(sound));
check("main script uses only the public sound API",
  (main.match(/ARRIVAL_SOUND\??\.(\w+)/g) ?? [])
    .every((m) => /\.(start|space|slip|tree|setEnabled|enabled|getParams)\b/.test(m)));

console.log("S2 three-hall equality — 一份 hall 參數表，API 不收身分");
const spacesM = sound.match(/const SPACES = \{[\s\S]*?\n  \};/);
check("single SPACES literal with exactly one hall row",
  !!spacesM && (spacesM[0].match(/hall:/g) ?? []).length === 1);
const num = (src, re) => { const m = src.match(re); return m ? Number(m[1]) : NaN; };
const courtLP = num(spacesM?.[0] ?? "", /court: \{ busLP: (\d+)/);
const hallLP = num(spacesM?.[0] ?? "", /hall:\s+\{ busLP: (\d+)/);
const courtGain = num(spacesM?.[0] ?? "", /court: \{ busLP: \d+, busGain: ([\d.]+)/);
const hallGain = num(spacesM?.[0] ?? "", /hall:\s+\{ busLP: \d+, busGain: ([\d.]+)/);
check("進殿收窄：busLP 800 → 300", courtLP === 800 && hallLP === 300);
check("進殿減半：busGain 1.0 → 0.5", courtGain === 1.0 && hallGain === 0.5);
check("葉聲退遠：hall leafLP/leafGain 皆低於 court",
  num(spacesM?.[0] ?? "", /hall:[^\n]*leafLP: (\d+)/) < num(spacesM?.[0] ?? "", /court:[^\n]*leafLP: (\d+)/) &&
  num(spacesM?.[0] ?? "", /hall:[^\n]*leafGain: ([\d.]+)/) < num(spacesM?.[0] ?? "", /court:[^\n]*leafGain: ([\d.]+)/));
check("setSpace accepts only court/hall — 連身分參數都不存在",
  /name !== "court" && name !== "hall"/.test(sound));
check("sound layer never reads hall identity fields", !/hall\.id|\.deity/.test(sound));

console.log("S3 fail-closed — 月老增建中，無殿內聲態");
const hallCalls = main.match(/ARRIVAL_SOUND\??\.space\("hall"\)/g) ?? [];
check("exactly one hall-acoustic entry point", hallCalls.length === 1);
const callIdx = main.indexOf('ARRIVAL_SOUND?.space("hall")');
const guardCtx = main.slice(Math.max(0, callIdx - 120), callIdx + 10);
check("that entry point is guarded by the fail-closed predicate",
  /!hall\.hypothetical && hall\.corpusId/.test(guardCtx));
check("guard lives in enterHall (與 400ms 轉場同步，非 renderHall 補刀)",
  (() => {
    const fn = main.slice(main.indexOf("function enterHall"), main.indexOf('$("backBtn")'));
    return fn.includes('ARRIVAL_SOUND?.space("hall")');
  })());

console.log("S4 air grammar — 陣風無週期、Slip 靜默、回埕還原");
check("gust intervals 20–70s, envelopes 2–8s (Crystal taste-gate r1 校準值)",
  /waitMin: 20, waitMax: 70, lenMin: 2, lenMax: 8/.test(sound));
check("連兩陣壓到 ≤5% (doubleChance: 0.05)", /doubleChance: 0\.05/.test(sound));
check("layer balance：風退位、葉敘事（leafGustMax > windGustMax）",
  (() => {
    const w = sound.match(/windGustMax: ([\d.]+)/), l = sound.match(/leafGustMax: ([\d.]+)/);
    return w && l && Number(l[1]) > Number(w[1]);
  })());
check("葉晚 100–300ms 跟上", /leafLagMin: 0\.10, leafLagMax: 0\.30/.test(sound));
check("風先起、葉聲帶 lag 跟上 (t0 + lag)", /t0 \+ lag/.test(sound));
check("crossfade 與視覺轉場同步 (XFADE = 0.4)", /const XFADE = 0\.4/.test(sound));
check("pan 上限 ±0.3、slew ≈1s", /const PAN_MAX = 0\.3/.test(sound) && /const PAN_SLEW = 0\.35/.test(sound));
check("樹聲離開視野變遠變鈍但不消失 (gain floor)", /0\.35 \+ 0\.65 \//.test(sound));
check("Slip 靜默 (slipDuck) 且由 slipOpen 驅動 world gain",
  /slipDuck/.test(sound) && /slipOpen \? LEVELS\.slipDuck : 1/.test(sound));
check("showSlip 呼叫 slip(true)（紙是主角）",
  /function showSlip[\s\S]{0,120}ARRIVAL_SOUND\?\.slip\(true\)/.test(main));
check("回埕還原：backBtn 與 keepBtn 都 space(\"court\")",
  (main.match(/ARRIVAL_SOUND\??\.space\("court"\)/g) ?? []).length === 2);

console.log("S5 gesture / toggle / lifecycle");
check("AudioContext built in exactly one place, called only from start()",
  (sound.match(/new \(window\.AudioContext/g) ?? []).length === 1 &&
  (sound.replace(/function build\(\)/, "").match(/build\(\)/g) ?? []).length === 1);
check("初訪手勢＝山門「入內」啟動",
  /enterBtn"\)\.addEventListener\("click[\s\S]{0,120}ARRIVAL_SOUND\?\.start\(\)/.test(main));
check("回訪手勢＝首次觸碰（山門期間不啟動）",
  /pointerdown[\s\S]{0,160}s-gate[\s\S]{0,80}ARRIVAL_SOUND\?\.start\(\)/.test(main));
check("「聲」偏好持久化 (writePref on setEnabled)",
  /function setEnabled[\s\S]{0,120}writePref\(enabled\)/.test(sound));
check("visibilitychange：回前景 resume、背景即靜",
  /visibilitychange[\s\S]{0,300}resume\(\)[\s\S]{0,200}suspend\(\)/.test(sound));
check("兩顆「聲」toggle（案上＋殿內）同一元件",
  (html.match(/class="sound-toggle"/g) ?? []).length === 2);
check("toggle 是唯一新增 interaction（lived 物件仍 pointer-events: none）",
  /\.lived \{ position: absolute; pointer-events: none; \}/.test(html));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
