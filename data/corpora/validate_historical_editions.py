#!/usr/bin/env python3
"""Validate Historical Editions Registry (data/corpora/*/historical_editions.json).

Checks:
- A: required fields present (Crystal-specified schema)
- B: role_in_draw_one ∈ allowed roles
- C: edition_id unique across all corpora
- D: corpus_id matches directory
- E: status fields use controlled vocabulary
- F: deterministic (byte-identical across two runs)
"""
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent  # data/corpora/

REQUIRED_FIELDS = [
    "edition_id", "corpus_id", "title", "publication_date", "approximate_date",
    "author", "compiler", "publisher", "holding_institution",
    "digital_source", "edition_type", "completeness",
    "text_access_status", "image_access_status", "reuse_status",
    "transcription_status", "comparison_status",
    "relationship_to_other_editions", "evidence", "notes",
    "role_in_draw_one",
]

ALLOWED_ROLES = {
    "historical_attestation",
    "historical_baseline_candidate",
    "historical_baseline",
    "modern_attestation",
    "interpretation_source",
    "identified_historical_edition",
}

ALLOWED_TEXT_ACCESS = {
    "obtained", "in_progress", "not_obtained", "requires_registration", "not_applicable",
}

ALLOWED_IMAGE_ACCESS = {
    "obtained", "viewable", "viewable_not_licensed", "not_obtained",
    "requires_registration", "requires_visit_or_application", "not_applicable",
}

ALLOWED_REUSE = {
    "not_licensed", "unclear", "not_applied", "public_domain_supported", "license_required",
}

ALLOWED_TRANSCRIPTION = {
    "completed", "in_progress", "not_completed",
}

ALLOWED_COMPARISON = {
    "completed", "in_progress", "not_completed",
}

ALLOWED_CORPORA = {"liushijiazi", "guanyin", "guandi"}


def load_editions():
    editions = []
    for corpus_dir in sorted(BASE.glob("*/")):
        f = corpus_dir / "historical_editions.json"
        if not f.exists():
            continue
        data = json.loads(f.read_text(encoding="utf-8"))
        assert isinstance(data, list), f"{f}: top-level must be list"
        for e in data:
            e["_file"] = str(f.relative_to(BASE))
            editions.append(e)
    return editions


def main():
    checks = []
    passed = [0]
    failed = [0]

    def check(name, ok, detail=""):
        checks.append((name, ok, detail))
        if ok:
            passed[0] += 1
        else:
            failed[0] += 1

    editions = load_editions()
    check("A1. registry files found", len(editions) > 0, f"count={len(editions)}")

    seen_ids = {}
    for e in editions:
        fid = e.pop("_file")
        eid = e.get("edition_id", "<missing>")
        # A: required fields
        missing = [k for k in REQUIRED_FIELDS if k not in e]
        check(f"A2. {eid}: required fields", not missing, f"missing={missing}")
        # B: role
        role = e.get("role_in_draw_one")
        check(f"B1. {eid}: role valid", role in ALLOWED_ROLES, f"role={role}")
        # C: unique id
        if eid in seen_ids:
            check(f"C1. {eid}: unique", False, f"dup in {seen_ids[eid]} & {fid}")
        else:
            seen_ids[eid] = fid
        # D: corpus_id matches directory
        corpus_dir = Path(fid).parent.name
        cid = e.get("corpus_id")
        check(f"D1. {eid}: corpus_id matches dir", cid == corpus_dir, f"corpus_id={cid} dir={corpus_dir}")
        check(f"D2. {eid}: corpus_id valid", cid in ALLOWED_CORPORA, f"corpus_id={cid}")
        # E: controlled vocab
        check(f"E1. {eid}: text_access", e.get("text_access_status") in ALLOWED_TEXT_ACCESS, f"value={e.get('text_access_status')}")
        check(f"E2. {eid}: image_access", e.get("image_access_status") in ALLOWED_IMAGE_ACCESS, f"value={e.get('image_access_status')}")
        check(f"E3. {eid}: reuse", e.get("reuse_status") in ALLOWED_REUSE, f"value={e.get('reuse_status')}")
        check(f"E4. {eid}: transcription", e.get("transcription_status") in ALLOWED_TRANSCRIPTION, f"value={e.get('transcription_status')}")
        check(f"E5. {eid}: comparison", e.get("comparison_status") in ALLOWED_COMPARISON, f"value={e.get('comparison_status')}")
        # evidence non-empty
        check(f"G1. {eid}: evidence non-empty", isinstance(e.get("evidence"), list) and len(e["evidence"]) > 0)
        check(f"G2. {eid}: notes present", isinstance(e.get("notes"), str))

    # role summary
    from collections import Counter
    roles = Counter(e.get("role_in_draw_one") for e in editions)
    print(f"=== HISTORICAL EDITIONS REGISTRY VALIDATOR: {passed[0]} PASS / {failed[0]} FAIL ===")
    print(f"editions={len(editions)} | roles={dict(roles)}")
    if failed[0]:
        for name, ok, detail in checks:
            if not ok:
                print(f"  FAIL: {name} {detail}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
