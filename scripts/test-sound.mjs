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
 * Dev 後門（?weather / ?newday / ?devdraw / ?halls）見 docs/testing/qa-cheatsheet.md。
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
    .every((m) => /\.(start|space|slip|weather|tree|pull|stickOut|paperOut|setEnabled|enabled|getParams)\b/.test(m)));

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
const weathersM = sound.match(/const WEATHERS = \{[\s\S]*?\n  \};/);
check("weather ticket：exactly 4 weathers (sunny/cloudy/rain/wind)",
  !!weathersM && ["sunny:", "cloudy:", "rain:", "wind:"].every((k) => weathersM[0].includes(k)) &&
  (weathersM[0].match(/\n    \w+:\s+\{/g) ?? []).length === 4);
check("天氣永不出現在空間變換——殿不知道天氣，殿只知道「外面」",
  !!weathersM && !/busLP|busGain|exLP|exGain|interior|leafLP:|leafGain:/.test(weathersM[0]) &&
  !/sunny|cloudy|rainOn|voices/.test(spacesM?.[0] ?? "x"));
check("殿內 presence 是 SPACES 常數（court 0 / hall 一份字面值）",
  /court: \{[^\n]*interior: 0 \}/.test(spacesM?.[0] ?? "") && /hall:\s+\{[^\n]*interior: 0\.\d+ \}/.test(spacesM?.[0] ?? ""));

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
check("cloudy 票＝74af5ef taste-gate 基準（20–70s／2–8s 原封）",
  /cloudy: \{ air: 0\.018[\s\S]{0,220}gustWaitMin: 20, gustWaitMax: 70, gustLenMin: 2, gustLenMax: 8/.test(sound));
check("每張票 leafPeak > windPeak——世界被風吹動，不是 whoosh",
  (() => {
    const rows = [...(weathersM?.[0] ?? "").matchAll(/windPeak: ([\d.]+),[^\n]*leafPeak: ([\d.]+)/g)];
    return rows.length === 4 && rows.every(([, w, l]) => Number(l) > Number(w));
  })());
check("windy afternoon 不是颱風（wind 票 windPeak ≤ 0.06；r1 曾是 0.11）",
  (() => { const m = (weathersM?.[0] ?? "").match(/wind:\s+\{[^\n]*windPeak: ([\d.]+)/); return m && Number(m[1]) <= 0.06; })());
check("雨只屬於 rain 票、voices 只屬於 sunny 票",
  ((weathersM?.[0] ?? "").match(/rainOn: 1/g) ?? []).length === 1 &&
  ((weathersM?.[0] ?? "").match(/voices: true/g) ?? []).length === 1);
check("蟬有季節（月份 gate）、雨會呼吸、雨落樹冠走葉鏈（跟樹 pan／跟收窄）",
  /getMonth\(\) \+ 1 >= 5/.test(sound) && /rainBreath/.test(sound) && /canopyGain\.connect\(n\.leafSpaceLP\)/.test(sound));
check("葉晚 100–300ms 跟上", /leafMin: 0\.10, leafMax: 0\.30/.test(sound));
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
check("初訪手勢＝山門「入內」啟動（拿票在啟動之前——選擇在寂靜中做）",
  /enterBtn"\)\.addEventListener\("click[\s\S]{0,420}ARRIVAL_SOUND\?\.start\(\)/.test(main) &&
  (() => { const b = main.slice(main.indexOf('enterBtn")')); return b.indexOf(".weather(") < b.indexOf(".start()"); })());
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

console.log("S6 天氣改變地方，不改變神意＋Exit/帶走契約");
const policySrc2 = readFileSync(join(ROOT, "assets", "draw-policy.js"), "utf8");
check("draw-policy 完全不知道 weather 存在", !/weather/i.test(policySrc2));
check("resolveDraw 呼叫不含 weather（天氣不進 draw）",
  (() => {
    const call = main.slice(main.indexOf("resolveDraw({"), main.indexOf("drawFn: uniformDraw") + 40);
    return call.length > 0 && !/weather/i.test(call);
  })());
check("weather 只在門檻側設定（boot 讀票＋入內拿票＝兩處，埕內無 weather controls）",
  (main.match(/ARRIVAL_SOUND\??\.weather\(/g) ?? []).length === 2 &&
  (() => { // 天氣選項只長在山門裡
    const gate = html.slice(html.indexOf('id="s-gate"'), html.indexOf("</section>"));
    return (html.match(/class="gw-opt"/g) ?? []).length === 4 && (gate.match(/class="gw-opt"/g) ?? []).length === 4;
  })());
check("一天一張票：日期戳、跨日作廢（todaysTicket 比對今天）",
  /TICKET_KEY = "arrival\.ticket\.v1"/.test(main) && /t\.date === todayStr\(\)/.test(main));
check("試聽 override 不寫票（?weather= 不進 localStorage）",
  /if \(!AUDITION_WEATHER\) \{[\s\S]{0,200}store\.set\(TICKET_KEY/.test(main));
check("不答＝常日（票存 null、setter 落到 cloudy）",
  /weather: gateWeather \}/.test(main) && /Object\.hasOwn\(WEATHERS, name\) \? name : "cloudy"/.test(sound));
check("亂值 fail-closed（2026-08-22 gate blocker）：sound setter 用 own-property，不吃 prototype chain",
  /Object\.hasOwn\(WEATHERS, name\)/.test(sound) && !/WEATHERS\[name\] \?/.test(sound));
check("亂值 fail-closed：刻字走 isValidWeather（display 與 sound 同規、合法性集中一處）",
  /const isValidWeather = \(name\) => typeof name === "string" && Object\.hasOwn\(WEATHER_CHARS, name\)/.test(main) &&
  /isValidWeather\(wName\) \? WEATHER_CHARS\[wName\] : null/.test(main));
check("票是環境不是朝向（TICKET 永不進 faceStation）",
  !/faceStation\([^)]*[Tt]icket/.test(main));
check("刻字回聲：票寫進今天的石頭；常日不刻（wChar undefined 即無痕）",
  /wChar\) heart\.textContent \+=/.test(main) && /sunny: "晴", cloudy: "陰", rain: "雨", wind: "風"/.test(main));
check("收籤＝句點：紙收起一拍（slip-away beat），無「籤已收」旁白",
  /slip-away/.test(main) && /\.slip-stage\.slip-away/.test(html) && !/籤已收/.test(html));
check("帶走＝籤簿中每張紙的能力（existing 才顯示，不在 ending 跳 CTA）",
  /takeawayZone"\)\.hidden = !existing/.test(main));
const shareBlock = main.slice(main.indexOf("帶走這支籤（share artifact"), main.indexOf("沿革 / 籤簿 overlays"));
check("share 不含使用者問題／筆記／visit 紀錄",
  shareBlock.length > 0 && !/question|noteInput|LASTHALL|BOOK_KEY/.test(shareBlock));
check("share 無 growth 文案（navigator.share 只給檔案，不給 title/text/url）",
  /navigator\.share\(\{ files: \[file\] \}\)/.test(shareBlock) && !/title:|text:|url:/.test(shareBlock));
check("artifact＝frozen 元件原樣 render（走 SLIP_RENDER.mountSlip，不 fork 排版）",
  /SLIP_RENDER\.mountSlip\(art, entry\)/.test(shareBlock));

console.log("S7 手感層（Phase B）— 手上的東西，不是空氣、不是音效");
check("手感走 master 不走 world（世界閉嘴時你的手還有聲）",
  /n\.hand\.connect\(n\.master\)/.test(sound) && !/n\.hand\.connect\(n\.world\)/.test(sound));
check("三個手感事件各有唯一掛點",
  (main.match(/ARRIVAL_SOUND\??\.pull\(/g) ?? []).length === 1 &&
  (main.match(/ARRIVAL_SOUND\??\.stickOut\(\)/g) ?? []).length === 1 &&
  (main.match(/ARRIVAL_SOUND\??\.paperOut\(\)/g) ?? []).length === 1);
check("pull 掛在拖籤 gesture、stickOut 掛在 completeDraw（devdraw 同路）",
  /setStick\(p\);\s*\n\s*window\.ARRIVAL_SOUND\?\.pull\(p\)/.test(main) &&
  /function completeDraw[\s\S]{0,120}ARRIVAL_SOUND\?\.stickOut/.test(main));
check("paperOut 只在取籤詩（takeBtn）——籤簿重看不再取紙",
  /takeBtn"\)\.addEventListener\("click[\s\S]{0,120}paperOut/.test(main) &&
  !/function showSlip[\s\S]{0,300}paperOut/.test(main));
check("手感層音量是字面常數（handPull/handStick/handPaper）",
  /handPull: 0\.0\d+/.test(sound) && /handStick: 0\.0\d+/.test(sound) && /handPaper: 0\.0\d+/.test(sound));
check("拖籤粒子有節制（進度門檻，不是馬達）", /pullAcc < 0\.07/.test(sound));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
