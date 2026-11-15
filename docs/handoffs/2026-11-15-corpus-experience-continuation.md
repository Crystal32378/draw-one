> Historical implementation log. See `2026-11-15-fable-latest-handoff.md` for current source, layout and release status; earlier one-page and per-row-issue descriptions are superseded.

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


## 2026-11-15 Crystal scan-form decision (later than original handoff)

Crystal explicitly selected #48 懽、#58 隲、#94 縁 **照掃描字形收**. These three spellings now move from pending to applied. This relies on the ledger's existing September image adjudications; no fresh image review or full-poem verification is claimed. Total: 15 character places across 12 lots; five pending edits remain (#59 and #62/#65/#87/#89), unchanged. #94 retains the prior 斲輪 correction alongside newly selected 縁. JSON, CSV, review XLSX and generated draw pool are synchronized. All 100 Guandi poems remain PROBABLE; commentary gates are unchanged. The original eight-pending counts above describe the saved Fable handoff, not this later state.

## Private proofreading preview (Crystal's 2026-11-15 visibility direction)

Run `node scripts/serve-corpus-review.mjs`, then open `http://127.0.0.1:8777/paper/arrival.html` on that same computer. The normal app's 解曰 fold now displays all 200 Guanyin/Guandi source candidates, including the 6 + 31 held entries and Guandi #53. These are exact candidate strings, not corrected or newly verified interpretations. The fold shows raw transcription status, original edition/locator and uncertainty notes, with a link to the same slip's full proofreading table. No custody tokens are invented and no status is promoted. A persistent review badge distinguishes this from the production app.

`http://127.0.0.1:8777/review` displays all 760 existing source fields (200 Guanyin, 200 Guandi, 360 Sixty Jiazi), filterable by corpus and lot. 聖意 is visible as historical material, explicitly not medical, pregnancy or predictive advice. Missing text remains missing; OCR boxes and suspect readings are preserved for correction. No new interpretations are generated.

This is a **separate local server**, not a query parameter that unlocks text on a publicly hosted app. It binds only 127.0.0.1, checks Host against loopback names, rejects writes, blocks embedding and sends no-store/noindex. Do not expose it with a public tunnel, static export, or network host binding. Local mode is not an authorization system for remote collaborators: each authorized reviewer should run their own local copy. Production HTML, interpretation pools, guards and hold ledgers are unchanged.

The source audit distinguishes textual doubt from rights doubt: the Guanyin/Guandi holds are not evidence of a blanket copyright prohibition. The local preview makes them readable without claiming every witness is cleared for redistribution. Sixty Jiazi entries identify their actual modern temple-image witness per field; those dates are witness/image dates, **not** proof of when each passage was authored. No field-level public-domain evidence has been provided to this implementation yet, so none of the 360 fields is newly marked public-domain or exposed in the normal app. All remain available locally for proofreading, with a separate rights label. Do not overwrite newer repo data from the old Claw Deck table.

Tests: `node scripts/test-corpus-review.mjs` checks all 760 rows retain original fields and status, all 200 commentary candidates are available, #53 and six Guanyin candidates render, six Jiazi does not enter the app renderer, corpus mismatch fails closed, and HTML is escaped. This is not browser visual QA, human listening or a new rights determination.

Remote remains `4d4acf2`; local corpus commit `f4715c3` and later review-server commit are not published. No main merge or deployment.

### Compact review experience requested by Crystal

Normal 解曰 display now contains only the exact candidate verse, concise human-readable review status, full source citation/page and a small 「查看校對資料」 link. OCR diagnostics, historical readings and hold rationale remain in the separate review page, not in the reading experience. Guanyin #2 remains the canonical 「得忍且忍。得耐且耐。身不用忙。功名自在。」; no user example was used to silently rewrite other records.

The courtyard adds an understated 「徵求校對助手」 link beneath 本廟沿革. It opens the functional local review page with corpus/lot filters and a manual report template. It explicitly states there is no submission backend or automatic saving; reviewers can copy their proposed character/source/page details to Crystal through their existing private channel. No unsolicited external message, public issue or invented form submission occurs.

### Fable handoff: 待複核不等於隱藏

**待複核不等於隱藏。** Show the available candidate text with its actual status and source, and put detailed doubts on the comparison page. Do not reinstate a blanket “human verification first” visibility gate. Textual uncertainty and rights uncertainty are separate questions.

Prepared `paper/corpus-review.html` is a deterministic static public-review candidate, built by `node scripts/build-corpus-review.mjs`. It has readable corpus/lot filters, provenance, candidate text for the 400 Guanyin/Guandi fields including 聖意, and ordinary GitHub issue-draft links for manual submissions to the existing project. They do not auto-submit anything. For the 360 Jiazi fields it displays metadata/source positions only, not modern raw text or diagnostics that might quote it. This is a field-by-field evidence limitation, not a claim all360 are forbidden. Complete Jiazi raw text remains in the separate loopback proofreader. Future evidenced short traditional fields can be released individually without conflating them with long modern prose.

The generated page is not deployed or pushed. The private normal-app preview remains the place to approve concise candidate display before porting it to the standard released app. Do not confuse prepared static files with an approved production release.

### Later field-specific Jiazi audit supersedes whole-360 static exclusion

Source audit independently read all 120 卦名／五行方位 raw values and found traditional names/formulas, poem fragments, story headings, dates/symbols and OCR notes, not modern explanatory paragraphs. Those 120 are now visible as **原圖欄位轉錄候選**, not verified hexagram labels; no source text is corrected. Explicit anomaly flags identify misplaced poems/story titles, mixed columns and suspicious OCR. #30's 「（見上）」 is explicitly a compiler pointer rather than source prose. #54's four-line traditional poem is preserved as a misfiled candidate, not automatically excluded for length. This content classification is not a legal guarantee.

The other 240 fields remain source/index-only in the prepared public page while the field-specific review continues. Of those, #59 籤閣聖意 is explicitly structural absence, not withheld existing text. No arbitrary notes accompanying the120 are exported; only the specific audit flags are shown, avoiding accidental quotation of unassessed longer source text. Complete raw records remain local. Earlier whole360 exclusion describes the previous snapshot, not this latest candidate.
