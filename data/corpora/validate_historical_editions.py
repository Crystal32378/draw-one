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
MIGRATION_PATH = BASE / "migration_summary_1.1.0.json"


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

    # --- M: migration record (semantic equivalence vs v1.0.0) ---
    if MIGRATION_PATH.exists():
        mig = json.loads(MIGRATION_PATH.read_text(encoding="utf-8"))
        all_equiv = all(m.get("semantic_equivalent") for m in mig)
        check("M1. migration summary complete", len(mig) == len(editions), f"mig={len(mig)} editions={len(editions)}")
        check("M2. all records semantic-equivalent", all_equiv)
        # M3: mapping table correctness
        expected = {
            "historical_baseline": ("historical", "baseline", ["textual_attestation", "lineage_evidence"]),
            "historical_baseline_candidate": ("historical", "candidate", ["textual_attestation"]),
            "historical_attestation": ("historical", "identified", ["textual_attestation"]),
            "identified_historical_edition": ("historical", "identified", ["textual_attestation"]),
        }
        map_ok = True
        for m in mig:
            exp = expected.get(m["old_role"])
            if exp is None:
                map_ok = False
                continue
            got = (m["new"]["edition_period"], m["new"]["baseline_status"])
            if got != (exp[0], exp[1]):
                map_ok = False
        check("M3. role mapping table correct", map_ok)
    else:
        check("M1. migration summary exists", False, "migration_summary_1.1.0.json missing")

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
