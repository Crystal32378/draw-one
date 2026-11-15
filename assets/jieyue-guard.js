// jieyue-guard.js — the ONLY decision for whether a slip's 解曰 may be shown,
// and the ONLY decision for whether the page may say "withheld, and why".
// Pure + side-effect free so the page and the test share one truth. Fail-closed:
// any mismatch returns null (UI shows nothing) — a wrong edition, a tampered or
// stale artifact, or an id whose custody does not bind to this slip stays hidden.
//
// 2026-11-15 display policy (Crystal): 待複核不等於隱藏. The pools now carry every 解曰 of
// 觀音/關帝, including rows with unread (□) or flagged characters; such a row has
// rec.doubt = one of SLIP_REASONS and the page marks it. Nothing here corrects text.
//
// CONTRACTS is the exact, stable identity the UI expects, one row per corpus that
// HAS a pool. Version lock is EXACT equality (not substring): a different edition,
// edition_id, or content_version makes that corpus's layer disappear rather than
// mislabel a slip. A corpus with no row here (六十甲子) can never resolve a 解曰.
(function () {
  "use strict";

  var CONTRACTS = {
    guanyin: {
      schema: "interpretation-pool/0.2",
      corpus_id: "guanyin",
      edition_id: "ed-guanyin-xue2008-appendix2-image",
      // The poem edition printed on the paper (DRAW_POOL provenance.edition_title).
      slip_edition_title: "艋舺龍山寺《觀世音靈籤》百首（Taiwan production / reference edition，living tradition）",
      // The artifact this build ships with. A swapped-in artifact with any other
      // content_version is rejected — the version is bound, not just present.
      content_version: "77114f75319dc6bc33963f04736a4169a74e6bd7b390fffc18e41888283bc0c2",
    },
    guandi: {
      schema: "interpretation-pool/0.2",
      corpus_id: "guandi",
      edition_id: "ed-guandi-daozang-fuye-1225",
      slip_edition_title: "《護國嘉濟江東王靈籤》（傅燁撰，道藏本）",
      content_version: "318b7069162752d900fd35753d45c9145cca4dc33ddd277ceb9c48615217459f",
    },
  };
  // Back-compat: the original single-corpus contract (guanyin).
  var CONTRACT = CONTRACTS.guanyin;

  var HOLDS_SCHEMA = "interpretation-holds/0.1";
  // The only reasons the page is allowed to voice. Anything else → say nothing.
  var SLIP_REASONS = { unsettled_transcription: 1, suspect_reading: 1, irregular_form: 1 };
  var CORPUS_REASONS = { license_unresolved: 1, single_pass_ocr: 1 };

  var HEX = /^[0-9a-f]{64}$/;
  var own = function (o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); };

  // Returns the entry record to render, or null to show nothing.
  // `contract` defaults to the row for the SLIP's corpus (never the pool's claim).
  function resolve(pool, entry, contract) {
    if (!pool || !entry || !entry.provenance) return null;
    var C = contract || (own(CONTRACTS, entry.corpus_id) ? CONTRACTS[entry.corpus_id] : null);
    if (!C) return null;
    if (pool.schema !== C.schema) return null;
    if (pool.corpus_id !== C.corpus_id) return null;
    if (pool.edition_id !== C.edition_id) return null;                       // exact
    if (pool.expected_slip_edition_title !== C.slip_edition_title) return null; // exact
    if (!HEX.test(pool.content_version || "")) return null;
    if (pool.content_version !== C.content_version) return null;             // version bound
    if (entry.corpus_id !== pool.corpus_id) return null;
    if (entry.provenance.edition_title !== C.slip_edition_title) return null; // slip must match too
    var rec = own(pool.entries, entry.id) ? pool.entries[entry.id] : null;
    if (!rec) return null;
    if (!pool.status_word || !pool.status_word[rec.status]) return null;
    // Per-slip custody must bind THIS id's slip_number to THIS record. Guards a
    // swap that somehow reached the artifact: id guanyin-017 must carry slip_no 17.
    if (rec.slip_no !== entry.slip_number) return null;
    // 0.2: a doubtful row is SHOWN, marked. An unknown doubt code is not something the
    // page knows how to say honestly → hidden rather than shown unmarked.
    if (own(rec, "doubt") && !own(SLIP_REASONS, rec.doubt)) return null;
    return rec;
  }

  // pools = { corpus_id: pool }. Picks by the slip's corpus; unknown corpus → null.
  function resolveFrom(pools, entry) {
    if (!pools || !entry || !own(pools, entry.corpus_id)) return null;
    return resolve(pools[entry.corpus_id], entry);
  }

  // May the page say "this one is withheld"? Returns
  //   { scope: "slip", reason }                       — one slip of a corpus that has a pool
  //   { scope: "corpus", reasons, official_url, official_name } — a whole corpus held
  // or null (say nothing). Never returns text of the withheld gloss — there is none here.
  // A slip-scope hold is honoured only beside the exact pool it was built with, and
  // never for a slip that DOES resolve (shown and withheld are mutually exclusive).
  function holdFor(holds, pools, entry) {
    if (!holds || holds.schema !== HOLDS_SCHEMA || !entry || !own(holds.corpora, entry.corpus_id)) return null;
    var h = holds.corpora[entry.corpus_id];
    if (!h) return null;
    if (h.scope === "corpus") {
      if (own(CONTRACTS, entry.corpus_id)) return null; // a corpus cannot be both pooled and held
      var rs = [];
      for (var i = 0; i < (h.reasons || []).length; i++) if (own(CORPUS_REASONS, h.reasons[i])) rs.push(h.reasons[i]);
      if (!rs.length || rs.length !== h.reasons.length) return null;
      var url = typeof h.official_url === "string" && /^https:\/\//.test(h.official_url) ? h.official_url : null;
      return { scope: "corpus", reasons: rs, official_url: url, official_name: typeof h.official_name === "string" ? h.official_name : null };
    }
    if (h.scope !== "slip" || !own(CONTRACTS, entry.corpus_id)) return null;
    var C = CONTRACTS[entry.corpus_id];
    if (h.edition_id !== C.edition_id || h.content_version !== C.content_version) return null;
    if (!entry.provenance || entry.provenance.edition_title !== C.slip_edition_title) return null;
    if (resolveFrom(pools, entry)) return null;
    var pool = pools && own(pools, entry.corpus_id) ? pools[entry.corpus_id] : null;
    if (!pool || pool.content_version !== C.content_version) return null; // pool itself must be the real one
    var key = String(entry.slip_number);
    if (!own(h.slips, key) || !own(SLIP_REASONS, h.slips[key])) return null;
    return { scope: "slip", reason: h.slips[key] };
  }

  window.JIEYUE_GUARD = { resolve: resolve, resolveFrom: resolveFrom, holdFor: holdFor, CONTRACT: CONTRACT, CONTRACTS: CONTRACTS };
})();
