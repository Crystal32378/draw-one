# Saved continuation after Fable 3861924

This branch continues Fable's saved work; no main merge or deployment is implied.

## Preserved data work / three distinct completion states

Research collected ≠ full text reviewed ≠ cleared for display. The older `docs/RESEARCH_STATUS.md` is an August research snapshot, not a blanket production approval.

| Corpus | Existing work | Reviewed / not reviewed | Current display gate |
| --- | --- | --- | --- |
| Guanyin (100 poems) | Existing main already includes the 21-lot review referred to in Fable's handoff; no new corpus ingestion in this continuation | Do not interpret those 21 lots as 100 fully reviewed commentaries. Production commentary report records 13 confirmed, 81 probable | 94 commentaries emitted / 6 withheld, per `data/production/interpretation-pool.report.json` |
| Guandi (100 poems) | Fable applied 12 adjudicated character changes across 10 lots | All poems remain pending full-poem review; 8 unsettled spellings untouched | 69 probable commentaries emitted / 31 withheld; #53 hold preserved |
| Sixty Jiazi (60 poems) | Existing repo includes the later Fu corrections, including 乙未 / 戊午 | Old Claw Deck 360-field table is not a newer review and must not overwrite repo data | Commentary remains withheld under existing rights/provenance gate; no new publishing approval |

Sources: checked-in corpus packages, `data/production/*report.json`, and Crystal's forwarded Fable handoff. The historical Claw Deck table was not independently reread in this continuation. Preserve actual per-entry metadata and existing guards; this table is not a new verification assertion.

Guandi preserved corrections: #4 佛; #5 日; #13 翁; #36 吳; #49 隔; #53 鳥; #60 撝; #74 嵬 (3); #94 斲輪; #99 驊騮.
Unsettled and unchanged: #48 懽, #58 隲, #94 縁 (scan glyph versus normalization); #59 ambiguous old glyph; #62/#65/#87/#89 裹→裏 pending final choice. No new text adjudications here.

## Experience continuation

- #40: Fable's sound patch retained unchanged. Gain 0.04 / full chirp / 15–40s / sunny-only gate. Electronic measurement is not human hearing acceptance.
- #41: Three separate rhythms, camera-proximity-triggered short flight once per courtyard render, three wing beats, no pointer interception; reduced-motion disables flight and hops. Flight endpoints are baseline offsets awaiting visual polish, not a claim of natural-looking landing.
- #42: A deliberate revision of the old acceptance criterion: at stick reveal, compact surrounding decoration and show the whole plaque when feasible. Reading the slip replaces the large plaque with its complete name in the fixed top strip. Do not squeeze a complete plaque and complete slip into a 601px screen or change the frozen paper component.
- #43: The existing keep button/handler is pinned at the bottom while reading. Content reserves space beneath it. Commentary, notes and takeaway remain scrollable. Tiny screens can still need scrolling to read the entire frozen paper.
- #44: No storage behavior change. Empty question normalizes to a valid binding key, so reopening/cross-hall navigation recovers the original slip. `bindings.v2` protects identity; `book.v1` records the slip when paper is shown. Keep saves notes/returns to courtyard; it does **not** clear the binding. A new question starts a distinct case. This is intentional recovery, not a defect.

## Verification / next visual handoff

Non-browser regressions must pass on final tree. Extended browser suite covers 800×700 and 390×601 as well as previous viewports; checks three independent bird rhythms, one-shot flight, full plaque at stick reveal, name at reading, reachable keep action, original paper/book behavior and reduced motion.

Cloud Chromium launch is blocked by `socket() failed: Operation not permitted`, including an escalation attempt. Browser assertions and screenshots are therefore **not yet verified** in this environment. Run on an authorized desktop using `PW_CORE=/path/to/playwright-core CHROMIUM=/path/to/chrome SHOTS=/output node scripts/test-arrival-ink-e2e.mjs`, plus interpretation and sound browser suites. Have Fable review/adjust visual placement and motion as needed after functional QA; no mandatory redraw.

Human listening, iPhone/Android/LINE, old-device performance and actual fonts remain unverified. No merge, deployment, corpus-status promotion or release claim until review.
