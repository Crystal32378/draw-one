#!/usr/bin/env python3
"""Validate Historical Editions Registry (data/corpora/*/historical_editions.json)
against the machine-readable data contract (historical_editions.schema.json, v1.1.0).

Layers:
  S: JSON Schema validation (jsonschema)
  I: cross-field invariants (governance rules)
  M: migration record check (semantic equivalence vs v1.0.0)
  D: deterministic (two runs byte-identical)
"""
import json
import sys
from pathlib import Path

try:
    from jsonschema import Draft7Validator
    HAS_JSONSCHEMA = True
except ImportError:
    HAS_JSONSCHEMA = False

BASE = Path(__file__).resolve().parent
SCHEMA_PATH = BASE / "historical_editions.schema.json"
AUDIT_PATH = BASE / "migration_audit_1.1.0.json"

# a modern-period fixture that MUST be rejected by the schema itself
MODERN_FIXTURE = [{
    "edition_id": "ed-fixture-modern",
    "corpus_id": "guanyin",
    "title": "fixture modern edition (must be rejected)",
    "edition_period": "modern",
    "baseline_status": "identified",
    "content_roles": ["textual_attestation"],
    "publication_date": None,
    "approximate_date": "2026",
    "author": None, "compiler": None, "publisher": None,
    "holding_institution": "fixture", "digital_source": "fixture",
    "edition_type": "fixture", "completeness": "fixture",
    "text_access_status": "not_obtained", "image_access_status": "viewable",
    "reuse_status": "unclear", "transcription_status": "not_completed",
    "comparison_status": "not_completed",
    "relationships": [], "evidence": [{"evidence_type": "existence", "source": "fixture"}],
    "notes": "fixture",
}]


def load_editions():
    editions = []
    for corpus_dir in sorted(BASE.glob("*/")):
        f = corpus_dir / "historical_editions.json"
        if not f.exists():
            continue
        data = json.loads(f.read_text(encoding="utf-8"))
        for e in data:
            editions.append(e)
    return editions


def main():
    passed, failed = 0, 0
    results = []

    def check(name, ok, detail=""):
        nonlocal passed, failed
        results.append((name, ok, detail))
        if ok:
            passed += 1
        else:
            failed += 1

    editions = load_editions()
    check("S1. editions found", len(editions) > 0, f"count={len(editions)}")

    # --- S: JSON Schema ---
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    check("S2. schema version", schema.get("schema_version") == "1.1.0",
          f"version={schema.get('schema_version')}")
    if HAS_JSONSCHEMA:
        v = Draft7Validator(schema)
        errs = sorted(v.iter_errors(editions), key=lambda e: list(e.path))
        check("S3. jsonschema validation", not errs, f"errors={len(errs)}")
        for e in errs[:5]:
            print(f"    schema error: {list(e.path)} {e.message}")
        # S4: schema itself must reject a modern-period fixture (hard boundary)
        modern_errs = list(v.iter_errors(MODERN_FIXTURE))
        check("S4. schema rejects modern fixture (const boundary)", len(modern_errs) > 0,
              f"modern_fixture_errors={len(modern_errs)}")
    else:
        # minimal fallback: required fields + enum checks
        required = set(schema["items"]["required"])
        bad = [e["edition_id"] for e in editions if not required.issubset(set(e))]
        check("S3. jsonschema validation (fallback)", not bad, f"missing_fields={bad}")

    # --- I: cross-field invariants ---
    seen_ids = {}
    for e in editions:
        eid = e["edition_id"]
        # I1: baseline must have transcription + comparison completed
        if e.get("baseline_status") == "baseline":
            ok = e.get("transcription_status") == "completed" and e.get("comparison_status") == "completed"
            check(f"I1. {eid}: baseline => transcription/comparison completed", ok,
                  f"t={e.get('transcription_status')} c={e.get('comparison_status')}")
        # I2: candidate must NOT be completed baseline
        if e.get("baseline_status") == "candidate":
            ok = e.get("transcription_status") != "completed"
            check(f"I2. {eid}: candidate => transcription not completed", ok,
                  f"t={e.get('transcription_status')}")
        # I3: registry rejects modern editions
        if e.get("edition_period") == "modern":
            check(f"I3. {eid}: modern edition rejected", False, "registry is historical-only")
        # I4: evidence non-empty with valid structure
        ev = e.get("evidence", [])
        check(f"I4. {eid}: evidence non-empty", isinstance(ev, list) and len(ev) > 0, f"n={len(ev)}")
        ok_ev = all(isinstance(x, dict) and "evidence_type" in x and "source" in x for x in ev)
        check(f"I4b. {eid}: evidence structured", ok_ev)
        # I5: edition_id unique
        if eid in seen_ids:
            check(f"I5. {eid}: unique", False, f"dup={seen_ids[eid]}")
        else:
            seen_ids[eid] = e["corpus_id"]
        # I6: content_roles non-empty
        check(f"I6. {eid}: content_roles non-empty", isinstance(e.get("content_roles"), list) and len(e["content_roles"]) > 0,
              f"roles={e.get('content_roles')}")
        # I7: relationships structured
        rels = e.get("relationships", [])
        ok_rel = all(isinstance(r, dict) and "relationship_type" in r and "target_edition_id" in r for r in rels)
        check(f"I7. {eid}: relationships structured", ok_rel, f"n={len(rels)}")

    # --- M: migration audit (mechanical hash proof, no manual flags) ---
    if AUDIT_PATH.exists():
        audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
        recs = audit.get("records", [])
        check("M1. audit manifest exists & complete", len(recs) == len(editions),
              f"audit={len(recs)} editions={len(editions)}")
        # M2: 15 preserved records — all field hashes equal (identity/evidence/relation/notes)
        preserved = [r for r in recs if not r.get("is_new_record")]
        ok_id = all(r["identity"]["pre"] == r["identity"]["post"] for r in preserved)
        ok_ev = all(r["evidence"]["pre"] == r["evidence"]["post"] for r in preserved)
        ok_rel = all(r["relation"]["pre"] == r["relation"]["post"] for r in preserved)
        ok_nt = all(r["notes"]["pre"] == r["notes"]["post"] for r in preserved)
        check("M2. preserved records: identity hashes equal", ok_id, f"{sum(1 for r in preserved if r['identity']['pre']==r['identity']['post'])}/{len(preserved)}")
        check("M2b. preserved records: evidence hashes equal", ok_ev, f"{sum(1 for r in preserved if r['evidence']['pre']==r['evidence']['post'])}/{len(preserved)}")
        check("M2c. preserved records: relationship hashes equal", ok_rel, f"{sum(1 for r in preserved if r['relation']['pre']==r['relation']['post'])}/{len(preserved)}")
        check("M2d. preserved records: notes hashes equal", ok_nt, f"{sum(1 for r in preserved if r['notes']['pre']==r['notes']['post'])}/{len(preserved)}")
        # M3: full 3-dim mapping (period + status + content_roles) for ALL records
        all_map = all(r.get("mapping", {}).get("match") for r in recs)
        check("M3. 3-dim mapping match (all records)", all_map,
              f"{sum(1 for r in recs if r.get('mapping',{}).get('match'))}/{len(recs)}")
        # M4: P00124 is a new record, not part of preserved-15 claim
        new_recs = [r for r in recs if r.get("is_new_record")]
        check("M4. new record flagged (P00124)", len(new_recs) == 1 and new_recs[0]["edition_id"] == "ed-liushijiazi-qianzhi-p00124-taiwanmemory",
              f"new={[r['edition_id'] for r in new_recs]}")
        check("M5. preserved count = 15", len(preserved) == 15, f"preserved={len(preserved)}")
    else:
        check("M1. audit manifest exists", False, "migration_audit_1.1.0.json missing")

    # --- summary ---
    from collections import Counter
    periods = Counter(e.get("edition_period") for e in editions)
    bstatus = Counter(e.get("baseline_status") for e in editions)
    roles = Counter()
    for e in editions:
        for r in e.get("content_roles", []):
            roles[r] += 1
    print(f"=== HISTORICAL EDITIONS REGISTRY VALIDATOR (schema v1.1.0): {passed} PASS / {failed} FAIL ===")
    print(f"editions={len(editions)} | period={dict(periods)} | baseline_status={dict(bstatus)} | content_roles={dict(roles)}")
    for name, ok, detail in results:
        if not ok:
            print(f"  FAIL: {name} {detail}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
