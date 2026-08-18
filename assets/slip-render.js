// slip-render.js — The Slip renderer (V2A checkpoint).
//
// Renders ONE pool entry as a paper slip. Truth rules:
//   - Text on the paper comes verbatim from the DRAW_POOL entry
//     (historical_text + provenance). No product copy on the paper.
//   - The "plate" quirks (per-character jitter, weight, ink take) are seeded
//     by the entry id: the same slip always prints the same way.
//   - STATUS_WORD is an honest translation, never an upgrade:
//     VERIFIED = 已對勘, PROBABLE = 待複核.
//
// FREEZE: once PR #22 lands, change only for functional issues.

(function () {
  "use strict";

  // Colophon source lines per corpus — 版記 wording (據…本 form).
  const CORPUS_COLOPHON = {
    liushijiazi: "據北港朝天宮官方六十甲子籤本",
    guanyin: "據艋舺龍山寺觀世音靈籤百首本",
    guandi: "據道藏護國嘉濟江東王靈籤本",
  };

  const STATUS_WORD = { VERIFIED: "已對勘", PROBABLE: "待複核" };

  const CN_DIGITS = "〇一二三四五六七八九";
  function toCn(n) {
    if (n <= 10) return n === 10 ? "十" : CN_DIGITS[n];
    if (n < 20) return "十" + CN_DIGITS[n % 10];
    if (n < 100) return CN_DIGITS[Math.floor(n / 10)] + "十" + (n % 10 ? CN_DIGITS[n % 10] : "");
    return "一百";
  }

  function tabText(entry) {
    // 六十甲子 slips are identified by stem-branch (甲子…); numbered corpora
    // by Chinese numerals.
    if (entry.corpus_id === "liushijiazi") return entry.original_slip_label;
    return "第" + toCn(entry.slip_number) + "籤";
  }

  function esc(v) {
    return String(v)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // 「版」的瑕疵：以籤 id 為種子——同一支籤永遠印出同一套字位微顫與墨色。
  function plateRng(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
      return (h >>> 8) / 16777216;
    };
  }

  function inkChars(text, rng, { dx = 0.5, dr = 0.5, w = [560, 60], op = 0.08 } = {}) {
    return [...text]
      .map((ch) => {
        const x = (rng() * 2 - 1) * dx;
        const y = (rng() * 2 - 1) * dx;
        const r = (rng() * 2 - 1) * dr;
        const wt = Math.round(w[0] + (rng() * 2 - 1) * w[1]);
        const o = 1 - rng() * op;
        return `<span class="ch" style="transform:translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg);font-weight:${wt};opacity:${o.toFixed(3)}">${esc(ch)}</span>`;
      })
      .join("");
  }

  // Verse line splitting: \n, ／, half/full-width spaces, keep-punctuation
  // split for 道藏本 couplets; equal-chunk fallback for undelimited regular
  // verse (corpus transcription formats vary — reported to corpus side).
  function poemLines(text) {
    return String(text)
      .split(/[\n／]/)
      .flatMap((l) => l.split(/[\s　]+/))
      .flatMap((l) => l.split(/(?<=[，。；！？])/))
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap((l) => {
        if (l.length <= 9) return [l];
        const n = l.length % 7 === 0 ? 7 : l.length % 5 === 0 ? 5 : Math.ceil(l.length / 4);
        const out = [];
        for (let i = 0; i < l.length; i += n) out.push(l.slice(i, i + n));
        return out;
      });
  }

  // Injects the shared roughening filter once per document (turbulence
  // displacement — printed lines, not vector lines).
  function ensureFilterDefs() {
    if (document.getElementById("slip-rough")) return;
    const holder = document.createElement("div");
    holder.setAttribute("aria-hidden", "true");
    holder.style.position = "absolute";
    holder.style.width = "0";
    holder.style.height = "0";
    holder.innerHTML =
      '<svg width="0" height="0"><filter id="slip-rough" x="-5%" y="-5%" width="110%" height="110%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="1" seed="7" result="n" />' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" />' +
      "</filter></svg>";
    document.body.appendChild(holder);
  }

  // innerHTML for a .slip element.
  function renderSlip(entry, { editionTitleShort } = {}) {
    const lines = poemLines(entry.historical_text.poem_text);
    const status = STATUS_WORD[entry.provenance.transcription_status] ?? entry.provenance.transcription_status;
    const colophonSource = CORPUS_COLOPHON[entry.corpus_id] ?? entry.provenance.edition_title;
    const titleShort = editionTitleShort ?? corpusTitleShort(entry.corpus_id);
    const rng = plateRng(entry.id);
    const poemCols = lines
      .map((l) => `<div class="s-col s-poem">${inkChars(l, rng, { dx: 0.55, dr: 0.55, w: [620, 55], op: 0.1 })}</div>`)
      .join("");
    return `
      <div class="slip-grime"></div>
      <div class="slip-cols">
        <div class="s-col s-title">${inkChars(titleShort, rng, { dx: 0.4, dr: 0.4, w: [600, 40], op: 0.06 })}</div>
        ${poemCols}
        <div class="s-col s-colo">
          <span>${inkChars(colophonSource, rng, { dx: 0.3, dr: 0.3, w: [500, 30], op: 0.05 })}</span>
          <span>${inkChars("抽一謹錄　" + status, rng, { dx: 0.3, dr: 0.3, w: [500, 30], op: 0.05 })}</span>
          <span class="slip-seal">抽一</span>
        </div>
      </div>`;
  }

  function corpusTitleShort(corpusId) {
    return {
      liushijiazi: "北港朝天宮六十甲子籤",
      guanyin: "艋舺龍山寺觀世音靈籤百首",
      guandi: "護國嘉濟江東王靈籤（道藏本）",
    }[corpusId] ?? "";
  }

  // Builds the full slip object (wrap + tab + paper) into a container.
  function mountSlip(container, entry, opts) {
    ensureFilterDefs();
    const wrap = document.createElement("div");
    wrap.className = "slip-wrap";
    const tab = document.createElement("div");
    tab.className = "slip-tab";
    tab.textContent = tabText(entry);
    const paper = document.createElement("div");
    paper.className = "slip";
    paper.innerHTML = renderSlip(entry, opts);
    wrap.append(tab, paper);
    container.appendChild(wrap);
    return wrap;
  }

  window.SLIP_RENDER = { tabText, renderSlip, mountSlip, poemLines, plateRng, ensureFilterDefs, STATUS_WORD };
})();
