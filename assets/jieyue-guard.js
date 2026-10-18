// jieyue-guard.js — the ONLY decision for whether a slip's 解曰 may be shown.
// Pure + side-effect free so the page and the test share one truth. Fail-closed:
// any mismatch returns null (UI shows nothing) — a wrong edition, a tampered or
// stale artifact, or an id whose custody does not bind to this slip stays hidden.
//
// CONTRACT is the exact, stable identity the UI expects. Version lock is EXACT
// equality (not substring): a different edition, edition_id, or content_version
// makes the whole layer disappear rather than mislabel a slip.
(function () {
  "use strict";

  var CONTRACT = {
    schema: "interpretation-pool/0.1",
    corpus_id: "guanyin",
    edition_id: "ed-guanyin-xue2008-appendix2-image",
    // The poem edition printed on the paper (DRAW_POOL provenance.edition_title).
    slip_edition_title: "艋舺龍山寺《觀世音靈籤》百首（Taiwan production / reference edition，living tradition）",
    // The artifact this build ships with. A swapped-in artifact with any other
    // content_version is rejected — the version is bound, not just present.
    content_version: "e34cea042c1748a4bcc7e1a51d1ee21e843e3b5942606715ff94688c056a0b22",
  };

  var HEX = /^[0-9a-f]{64}$/;

  // Returns the entry record to render, or null to show nothing.
  function resolve(pool, entry, contract) {
    var C = contract || CONTRACT;
    if (!pool || !entry || !entry.provenance) return null;
    if (pool.schema !== C.schema) return null;
    if (pool.corpus_id !== C.corpus_id) return null;
    if (pool.edition_id !== C.edition_id) return null;                       // exact
    if (pool.expected_slip_edition_title !== C.slip_edition_title) return null; // exact
    if (!HEX.test(pool.content_version || "")) return null;
    if (pool.content_version !== C.content_version) return null;             // version bound
    if (entry.corpus_id !== pool.corpus_id) return null;
    if (entry.provenance.edition_title !== C.slip_edition_title) return null; // slip must match too
    var rec = pool.entries && pool.entries[entry.id];
    if (!rec) return null;
    if (!pool.status_word || !pool.status_word[rec.status]) return null;
    // Per-slip custody must bind THIS id's slip_number to THIS record. Guards a
    // swap that somehow reached the artifact: id guanyin-017 must carry slip_no 17.
    if (rec.slip_no !== entry.slip_number) return null;
    return rec;
  }

  window.JIEYUE_GUARD = { resolve: resolve, CONTRACT: CONTRACT };
})();
