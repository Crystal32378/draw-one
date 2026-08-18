# Production Truth Layer — verified corpus → public draw path

**Status:** v1 — 2026-08-18
**Scope:** data/logic layer only. No visual redesign; round-2 design work builds on top of this.

## Architecture

```
data/corpora/{guanyin,guandi,liushijiazi}/slip_texts.json   ← 蝦蝦's curated corpora (source of truth)
        │
        ▼  node scripts/build-draw-pool.mjs   (fail-closed gate)
assets/oracles.draw-pool.js                                 ← the ONLY drawable content
data/production/draw-pool.report.json                       ← build evidence
        │
        ▼  index.html  (+ assets/draw-policy.js)
public draw path — boot-checks the pool, disables drawing if it fails; no fallback content
```

- **Build gate (`scripts/build-draw-pool.mjs`)** — closed manifest of 3 corpora with exact
  expected counts (100/100/60). Validates: required provenance fields, transcription status
  allowlist `{VERIFIED, PROBABLE}`, complete & unique slip-number sequences, single deity per
  corpus, banned fake-seed fragments, cross-corpus duplicate poems. Any violation → exit 1,
  pool file deleted, nothing emitted.
- **Data model separation** — each pool entry: `historical_text` (verbatim corpus text) /
  `provenance` (edition, source locator, transcription status) / `interpretation` (always
  `null`; generated interpretation may only enter through a future governed pipeline and must
  pass `DRAW_POLICY.lintInterpretationVoice`, which rejects oracle-voice and
  second-person-imperative life-decision phrasing).
- **Draw policy (`assets/draw-policy.js`)** — 一事一籤: a question binds permanently to its
  first draw (localStorage); switching deity cannot re-draw the same question; empty questions
  bind per browser session. Logic layer only — UI presentation of the rule is deliberately
  minimal (one neutral disclosure line) pending the design round.
- **Regression suite (`scripts/test-draw-pool.mjs`)** — 43 checks: completeness (260),
  byte-identical slip↔text mapping, deity mapping, 9 fail-closed tamper scenarios, page-level
  banned strings, interpretation lint, draw-policy behaviour. Run before any deploy.

## Authority fixes shipped

- 「神明正在回應中…」removed (loading copy is now the agent-neutral 「正在抽籤…」and is a
  banned string in the regression suite).
- All GPT-era content removed from the public path: six fabricated/remixed slips, their
  `meaning`/`advice` interpretation text, and the 月老 category (no corpus exists for it).
- Result panel renders only: slip identity, verbatim poem, edition + transcription status,
  the user's own question. No generated interpretation of any kind.

## Verification snapshot (2026-08-18)

| corpus | slips | status | deity (living-tradition mapping) | production edition |
|---|---|---|---|---|
| guanyin | 100 | 100 VERIFIED | 觀音 | 艋舺龍山寺《觀世音靈籤》百首 |
| guandi | 100 | 100 PROBABLE | 關帝 | 《護國嘉濟江東王靈籤》道藏本（維基文庫一手抓取，道藏影像待逐籤核對） |
| liushijiazi | 60 | 58 PROBABLE / 2 VERIFIED | 媽祖（北港朝天宮） | 北港朝天宮官方六十甲子籤 |

## Needs a product decision (engineering will not decide these)

1. **PROBABLE display policy.** 158/260 entries are PROBABLE (single-witness verbatim capture,
   pending second-witness check). The gate admits them and the UI currently shows the raw
   status string. Should PROBABLE render differently, carry an explanation, or be held back
   until VERIFIED?
2. **Question-binding lifetime.** 一事一籤 currently binds a question forever (until browser
   storage is cleared). Whether an old question may be asked anew after N days is a product
   call (`PRODUCT_DECISION` markers in draw-policy.js).
3. **月老.** Removed because no corpus exists. Restoring it requires a curated corpus, not copy.
4. **Interpretation pipeline.** Production ships none. Reintroducing AI interpretation needs:
   governed generation, `lintInterpretationVoice` gating, and the labeling policy from the
   design round (「AI 解讀永遠是另一件展品」).
5. **Provenance display depth.** Current UI shows one edition line + status. The
   incident doc's "no provenance in frontend" rule vs POSITIONING's provenance-visible stance
   still needs a ratified policy; this build takes the minimal-truth middle.
6. **Presentation残留.** Deity emoji (🌊🪷⚔️), the 1.2 s draw delay, placeholder question
   examples, and marketing side panels were intentionally left untouched — they are design-round
   territory.
