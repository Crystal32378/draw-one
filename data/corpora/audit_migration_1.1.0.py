#!/usr/bin/env python3
"""Migration audit: mechanical proof that the 15 original research records
survived schema migration v1.0.0 -> v1.1.0 without drift, and that P00124 is
tracked as a NEW record (not part of the preserved-15 claim).

Hash basis:
- pre  = data/corpora/.audit/pre/<corpus>.json (git e2456ea, v1.0.0 format)
- post = data/corpora/<corpus>/historical_editions.json (current, v1.1.0 format)

Per record, normalized SHA-256 over:
  identity : edition_id, corpus_id, title, dates, author/compiler/publisher,
             holding, digital_source, edition_type, completeness, all statuses
  evidence : sorted verbatim evidence strings (v1.0.0 array) vs sorted evidence[].source
  relation : verbatim relationship_to_other_editions vs sorted relationships[].note
  notes    : verbatim notes
  role     : old role string (v1.0.0) -> mapped 3-dim tuple (period, status, content_roles)

Output: data/corpora/migration_audit_1.1.0.json
"""
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
PRE = BASE / ".audit" / "pre"
CORPORA = ["liushijiazi", "guanyin", "guandi"]

# The record added AFTER the original 15 (new, not preserved)
NEW_RECORD_ID = "ed-liushijiazi-qianzhi-p00124-taiwanmemory"

# canonical mapping: old role -> (period, baseline_status, content_roles)
ROLE_MAP = {
    "historical_baseline": ("historical", "baseline", ["textual_attestation", "lineage_evidence"]),
    "historical_baseline_candidate": ("historical", "candidate", ["textual_attestation"]),
    "historical_attestation": ("historical", "identified", ["textual_attestation"]),
    "identified_historical_edition": ("historical", "identified", ["textual_attestation"]),
}
# editions whose notes already stated interpretation layer (structure-only change)
INTERPRETATION_LAYER_IDS = {
    "ed-guanyin-hyakusensho-1752",
    "ed-guanyin-gensandai-handan-1861",
    "ed-guanyin-hyakusen-wakai-1813-kyoto",
}


def h(obj):
    raw = json.dumps(obj, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def identity_fields(e):
    return {
        "edition_id": e["edition_id"], "corpus_id": e["corpus_id"], "title": e["title"],
        "publication_date": e.get("publication_date"), "approximate_date": e.get("approximate_date"),
        "author": e.get("author"), "compiler": e.get("compiler"), "publisher": e.get("publisher"),
        "holding_institution": e.get("holding_institution"), "digital_source": e.get("digital_source"),
        "edition_type": e.get("edition_type"), "completeness": e.get("completeness"),
        "text_access_status": e.get("text_access_status"), "image_access_status": e.get("image_access_status"),
        "reuse_status": e.get("reuse_status"),
        "transcription_status": e.get("transcription_status"), "comparison_status": e.get("comparison_status"),
    }


def audit():
    manifest = {"schema_version": "1.1.0", "records": []}
    preserved_ok = {"identity": 0, "evidence": 0, "relation": 0, "notes": 0, "mapping": 0}
    preserved_total = 0

    for corpus in CORPORA:
        pre = json.loads((PRE / f"{corpus}.json").read_text(encoding="utf-8"))
        post = json.loads((BASE / corpus / "historical_editions.json").read_text(encoding="utf-8"))
        pre_by_id = {e["edition_id"]: e for e in pre}
        post_by_id = {e["edition_id"]: e for e in post}

        for eid, pre_e in pre_by_id.items():
            post_e = post_by_id.get(eid)
            assert post_e is not None, f"{eid}: missing post record"
            is_new = eid == NEW_RECORD_ID
            rec = {
                "edition_id": eid,
                "corpus_id": corpus,
                "is_new_record": is_new,
                "old_role": pre_e["role_in_draw_one"],
            }
            # identity
            rec["identity"] = {"pre": h(identity_fields(pre_e)), "post": h(identity_fields(post_e))}
            # evidence (verbatim strings)
            pre_ev = sorted(pre_e.get("evidence", []))
            post_ev = sorted(x.get("source", "") for x in post_e.get("evidence", []))
            rec["evidence"] = {"pre": h(pre_ev), "post": h(post_ev)}
            # relationship (verbatim text)
            pre_rel = sorted([pre_e.get("relationship_to_other_editions", "")])
            post_rel = sorted(x.get("note", "") for x in post_e.get("relationships", []))
            rec["relation"] = {"pre": h(pre_rel), "post": h(post_rel)}
            # notes
            rec["notes"] = {"pre": h(pre_e.get("notes", "")), "post": h(post_e.get("notes", ""))}
            # 3-dim mapping (mechanical, from old role)
            expected = ROLE_MAP[pre_e["role_in_draw_one"]]
            roles = list(post_e.get("content_roles", []))
            if eid in INTERPRETATION_LAYER_IDS:
                expected = (expected[0], expected[1], sorted(expected[2] + ["interpretation_source"]))
            got = (post_e.get("edition_period"), post_e.get("baseline_status"), sorted(roles))
            rec["mapping"] = {
                "expected": [expected[0], expected[1], sorted(expected[2])],
                "got": list(got),
                "match": [expected[0], expected[1], sorted(expected[2])] == list(got),
            }
            manifest["records"].append(rec)

            if not is_new:
                preserved_total += 1
                if rec["identity"]["pre"] == rec["identity"]["post"]:
                    preserved_ok["identity"] += 1
                if rec["evidence"]["pre"] == rec["evidence"]["post"]:
                    preserved_ok["evidence"] += 1
                if rec["relation"]["pre"] == rec["relation"]["post"]:
                    preserved_ok["relation"] += 1
                if rec["notes"]["pre"] == rec["notes"]["post"]:
                    preserved_ok["notes"] += 1
                if rec["mapping"]["match"]:
                    preserved_ok["mapping"] += 1

    manifest["summary"] = {
        "total_records": len(manifest["records"]),
        "preserved_records": preserved_total,
        "new_record": 1,
        "preserved_ok": preserved_ok,
        "all_preserved": all(v == preserved_total for v in preserved_ok.values()),
    }
    (BASE / "migration_audit_1.1.0.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"audit: {len(manifest['records'])} records ({preserved_total} preserved + {len(manifest['records'])-preserved_total} new)")
    print(f"preserved_ok: {preserved_ok}")
    print(f"all_preserved: {manifest['summary']['all_preserved']}")
    return 0 if manifest["summary"]["all_preserved"] else 1


if __name__ == "__main__":
    raise SystemExit(audit())
