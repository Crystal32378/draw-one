// draw-policy.js — 一事一籤 / anti-answer-shopping rules (logic layer only).
//
// This module decides WHETHER a draw produces a new slip or returns the one
// already bound to the question. It deliberately makes NO interaction or copy
// decisions — the UI receives a { repeated } flag and presents it however the
// design round decides.
//
// RULES (v1):
//   R1  One question, one slip. A draw for a question that already has a bound
//       result returns that same result — forever, across page loads.
//   R2  Deity-switching does not reset R1. The bound result keeps its original
//       corpus even if the user has since selected a different deity
//       (anti answer-shopping).
//   R3  An empty question is bound for the browser session only
//       (sessionStorage), since there is no stable question to bind to.
//
// PRODUCT_DECISION markers flag parameters that product — not engineering,
// not design — must eventually ratify.

(function () {
  "use strict";

  // PRODUCT_DECISION: binding lifetime for named questions. v1 = permanent
  // until the user clears browser storage. Alternatives (e.g. expire after N
  // days so an old question may be asked anew) are a product call.
  const NAMED_QUESTION_STORE = () => window.localStorage;

  // PRODUCT_DECISION: binding lifetime for empty questions. v1 = browser session.
  const EMPTY_QUESTION_STORE = () => window.sessionStorage;

  const STORE_KEY = "drawone.bindings.v2";

  function normalizeQuestion(q) {
    return String(q ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();
  }

  // djb2 — bucket key only. A 32-bit hash DOES collide (e.g. "0000000r" and
  // "00000020"), so the hash never decides identity: each bucket stores the
  // full normalized question and lookups compare it verbatim.
  function questionKey(normalized) {
    let h = 5381;
    for (let i = 0; i < normalized.length; i++) h = ((h << 5) + h + normalized.charCodeAt(i)) >>> 0;
    return "q" + h.toString(36) + ":" + normalized.length;
  }

  function readBindings(store) {
    try {
      return JSON.parse(store().getItem(STORE_KEY) ?? "{}") ?? {};
    } catch {
      return {};
    }
  }

  function writeBindings(store, bindings) {
    try {
      store().setItem(STORE_KEY, JSON.stringify(bindings));
    } catch {
      /* storage unavailable → policy degrades to in-memory for this page */
    }
  }

  const memoryFallback = {};

  // Each bucket is an ARRAY of records; identity is decided by comparing the
  // stored question_normalized verbatim, never by the hash alone.
  function findRecord(bucket, normalized) {
    if (!Array.isArray(bucket)) return null;
    return bucket.find((r) => r && r.question_normalized === normalized) ?? null;
  }

  /**
   * peekBinding({ question }) — read-only: returns the existing binding for a
   * question ({ entryId, boundAt, boundCorpusId }) or null. Never binds.
   */
  function peekBinding({ question }) {
    const normalized = normalizeQuestion(question);
    const isEmpty = normalized === "";
    const store = isEmpty ? EMPTY_QUESTION_STORE : NAMED_QUESTION_STORE;
    const key = isEmpty ? "q:__empty_session__" : questionKey(normalized);
    const identity = isEmpty ? "" : normalized;
    const bindings = readBindings(store);
    const merged = [...(Array.isArray(bindings[key]) ? bindings[key] : []), ...(memoryFallback[key] ?? [])];
    const r = findRecord(merged, identity);
    return r ? { entryId: r.entry_id, boundAt: r.bound_at, boundCorpusId: r.corpus_id } : null;
  }

  /**
   * resolveDraw({ question, corpusId, drawFn })
   *   drawFn(corpusId) → entry  (only called when a NEW draw is permitted)
   * Returns { entryId, repeated, boundAt, boundCorpusId }.
   */
  function resolveDraw({ question, corpusId, drawFn }) {
    const normalized = normalizeQuestion(question);
    const isEmpty = normalized === "";
    const store = isEmpty ? EMPTY_QUESTION_STORE : NAMED_QUESTION_STORE;
    const key = isEmpty ? "q:__empty_session__" : questionKey(normalized);
    // Empty questions share one session bucket; their identity token is "".
    const identity = isEmpty ? "" : normalized;

    let bindings = readBindings(store);
    const merged = [...(Array.isArray(bindings[key]) ? bindings[key] : []), ...(memoryFallback[key] ?? [])];

    const existing = findRecord(merged, identity);
    if (existing) {
      return {
        entryId: existing.entry_id,
        repeated: true,
        boundAt: existing.bound_at,
        boundCorpusId: existing.corpus_id,
      };
    }

    const entry = drawFn(corpusId);
    const record = {
      entry_id: entry.id,
      corpus_id: entry.corpus_id,
      bound_at: new Date().toISOString(),
      question_normalized: identity,
    };
    bindings = readBindings(store);
    bindings[key] = [...(Array.isArray(bindings[key]) ? bindings[key] : []), record];
    memoryFallback[key] = [...(memoryFallback[key] ?? []), record];
    writeBindings(store, bindings);

    return { entryId: entry.id, repeated: false, boundAt: record.bound_at, boundCorpusId: entry.corpus_id };
  }

  /**
   * lintInterpretationVoice(text) — gate for FUTURE generated interpretation.
   * Production currently ships interpretation: null; when a governed pipeline
   * exists, its output must pass this lint before render.
   * Returns { ok, violations: [{ rule, match }] }.
   */
  function lintInterpretationVoice(text) {
    const t = String(text ?? "");
    const violations = [];
    // V1: may not speak as, or attribute the answer to, a deity or oracle.
    const oracleVoice = /(神明|菩薩|媽祖|關帝|關聖帝君|觀音|月老|上天|天意|神諭)(說|指示|告訴你|要你|回應|旨意|降示)/g;
    // V2: may not issue second-person imperatives on major life decisions.
    const imperative = /(你|妳)?(必須|應該立刻|現在就|不要再猶豫|馬上)(離開|分手|離職|辭職|結婚|投資|創業|切割|放棄|簽約)/g;
    let m;
    while ((m = oracleVoice.exec(t))) violations.push({ rule: "no-oracle-voice", match: m[0] });
    while ((m = imperative.exec(t))) violations.push({ rule: "no-imperative-life-decision", match: m[0] });
    return { ok: violations.length === 0, violations };
  }

  window.DRAW_POLICY = { normalizeQuestion, questionKey, peekBinding, resolveDraw, lintInterpretationVoice, STORE_KEY };
})();
