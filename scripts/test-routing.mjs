// test-routing.mjs — Vercel routing truth after legacy-route retirement (#33).
// The only production host is Vercel. Root serves Arrival (rewrite, URL unchanged);
// the legacy prototype routes are permanently redirected to root. The 解曰 layer
// (guard / artifact / custody) must be untouched by this change.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const check = (name, ok) => { console.log((ok ? "  ✓ " : "  ✗ ") + name); ok ? pass++ : fail++; };

const vc = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8"));

console.log("A root still enters Arrival (rewrite, not redirect)");
const rw = vc.rewrites || [];
check("/ rewrites to /paper/arrival.html", rw.some((r) => r.source === "/" && r.destination === "/paper/arrival.html"));
check("root is a rewrite, never a redirect (URL stays /)", !(vc.redirects || []).some((r) => r.source === "/"));

console.log("B legacy routes are PERMANENT redirects to /");
const reds = vc.redirects || [];
const permTo = (src) => reds.some((r) => r.source === src && r.destination === "/" && r.permanent === true);
check("/index.html → / (permanent)", permTo("/index.html"));
check("/research → / (permanent)", permTo("/research"));
check("/research/ → / (permanent)", permTo("/research/"));
check("/research/index.html → / (permanent)", permTo("/research/index.html"));
check("every redirect is permanent (308) and lands on /", reds.length > 0 && reds.every((r) => r.permanent === true && r.destination === "/"));
// modern config: routes[] must not coexist with redirects/rewrites (Vercel rejects the mix)
check("uses modern redirects/rewrites, not legacy routes[]", !("routes" in vc));

console.log("C favicon so the browser stops probing");
check("favicon.svg exists and is non-empty", existsSync(join(ROOT, "assets/favicon.svg")) && readFileSync(join(ROOT, "assets/favicon.svg"), "utf8").length > 0);
const arrival = readFileSync(join(ROOT, "paper/arrival.html"), "utf8");
check("arrival links the favicon", /<link[^>]+rel="icon"[^>]+favicon\.svg/.test(arrival));

console.log("D 解曰 layer untouched by the routing change");
check("guard + artifact + custody all present", ["assets/jieyue-guard.js", "assets/interpretation-pool.guanyin.js", "data/corpora/guanyin/jieyue_custody.json"].every((p) => existsSync(join(ROOT, p))));
const win = {}; new Function("window", readFileSync(join(ROOT, "assets/interpretation-pool.guanyin.js"), "utf8"))(win);
const gwin = {}; new Function("window", readFileSync(join(ROOT, "assets/jieyue-guard.js"), "utf8"))(gwin);
check("guard content_version still bound to artifact", gwin.JIEYUE_GUARD.CONTRACT.content_version === win.INTERPRETATION_POOL.content_version);
check("arrival still loads guard + artifact", arrival.includes("jieyue-guard.js") && arrival.includes("interpretation-pool.guanyin.js"));

console.log("E legacy index.html retained on disk (redirected, not deleted)");
check("index.html file still exists (source kept; only the route retires)", existsSync(join(ROOT, "index.html")));
check("research questionnaire source kept (Apps Script not deleted)", existsSync(join(ROOT, "research/google-apps-script.gs")));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
