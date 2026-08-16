#!/usr/bin/env python3
"""Migrate Historical Editions Registry from role_in_draw_one (v1.0.0) to
edition_period / baseline_status / content_roles (v1.1.0).

Preserves all research conclusions verbatim:
- old evidence strings -> structured evidence objects (full text in `source`)
- old relationship_to_other_editions -> structured relationships (full text in `note`)
- old role mapping is asserted semantic-equivalent (table below)
"""
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
CORPORA = ["liushijiazi", "guanyin", "guandi"]

# semantic-equivalent mapping: old role -> (period, baseline_status, content_roles)
ROLE_MAP = {
    "historical_baseline": ("historical", "baseline", ["textual_attestation", "lineage_evidence"]),
    "historical_baseline_candidate": ("historical", "candidate", ["textual_attestation"]),
    "historical_attestation": ("historical", "identified", ["textual_attestation"]),
    "identified_historical_edition": ("historical", "identified", ["textual_attestation"]),
}

# editions whose notes already state interpretation layer -> add interpretation_source
INTERPRETATION_LAYER_IDS = {
    "ed-guanyin-hyakusensho-1752",      # 鈔 = 註解本
    "ed-guanyin-gensandai-handan-1861",  # 判断鈔
    "ed-guanyin-hyakusen-wakai-1813-kyoto",  # 和解
}


def classify_evidence(text):
    if "目視確認" in text or "目視" in text:
        return "human_observation"
    if "轉錄" in text or "OCR" in text or "抄錄" in text:
        return "textual_attestation"
    if "合作案" in text or "館刊" in text or "檔案館" in text or "書誌" in text or "目錄" in text:
        return "bibliographic_record"
    if "詳細頁" in text or "藏品頁" in text or "P00" in text or "tm.ncl.edu.tw" in text or "archive.wul" in text:
        return "existence"
    return "bibliographic_record"


def split_relationships(text, edition_id):
    """Heuristically convert relationship string into structured relationships.
    Full original text is preserved in note."""
    rels = []
    # find in-registry edition ids mentioned
    import re
    mentioned = re.findall(r"ed-[a-z0-9-]+", text)
    types = []
    if any(k in text for k in ["註解", "鈔", "和解", "判斷"]):
        types.append("annotation_of")
    if any(k in text for k in ["收錄", "類書"]):
        types.append("compilation_contains")
    if any(k in text for k in ["同系", "同源", "同一", "淵源", "前身", "lineage"]):
        types.append("same_lineage")
    if any(k in text for k in ["未驗證", "未確認", "待", "可能", "unresolved", "關係未確認"]):
        types.append("unresolved")
    if any(k in text for k in ["獨立館藏", "互證", "別版"]):
        types.append("independent_holding")
    if any(k in text for k in ["現行版", "modern", "後續"]):
        types.append("related_holding")
    if not types:
        types.append("related_holding")
    if mentioned:
        for m in mentioned:
            if m != edition_id:
                rels.append({
                    "relationship_type": types[0],
                    "target_edition_id": m,
                    "note": text,
                })
    else:
        rels.append({
            "relationship_type": types[0],
            "target_edition_id": "external/unregistered",
            "note": text,
        })
    return rels


def migrate():
    summary = []
    for corpus in CORPORA:
        path = BASE / corpus / "historical_editions.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        for e in data:
            old_role = e["role_in_draw_one"]
            assert old_role in ROLE_MAP, f"{e['edition_id']}: unknown role {old_role}"
            period, bstatus, croles = ROLE_MAP[old_role]
            if e["edition_id"] in INTERPRETATION_LAYER_IDS:
                croles = list(croles) + ["interpretation_source"]
            # preserve old texts
            old_rel_text = e.get("relationship_to_other_editions", "")
            old_evidence = list(e.get("evidence", []))
            old_notes = e.get("notes", "")
            old_role_text = old_role
            # build new fields
            new_evidence = [
                {
                    "evidence_type": classify_evidence(s),
                    "source": s,
                }
                for s in old_evidence
            ]
            relationships = split_relationships(old_rel_text, e["edition_id"])
            new_e = {
                "edition_id": e["edition_id"],
                "corpus_id": e["corpus_id"],
                "title": e["title"],
                "edition_period": period,
                "baseline_status": bstatus,
                "content_roles": croles,
                "publication_date": e.get("publication_date"),
                "approximate_date": e.get("approximate_date"),
                "author": e.get("author"),
                "compiler": e.get("compiler"),
                "publisher": e.get("publisher"),
                "holding_institution": e.get("holding_institution"),
                "digital_source": e.get("digital_source"),
                "edition_type": e.get("edition_type"),
                "completeness": e.get("completeness"),
                "text_access_status": e.get("text_access_status"),
                "image_access_status": e.get("image_access_status"),
                "reuse_status": e.get("reuse_status"),
                "transcription_status": e.get("transcription_status"),
                "comparison_status": e.get("comparison_status"),
                "relationships": relationships,
                "evidence": new_evidence,
                "notes": old_notes,
            }
            summary.append({
                "edition_id": e["edition_id"],
                "old_role": old_role_text,
                "new": {"edition_period": period, "baseline_status": bstatus, "content_roles": croles},
                "semantic_equivalent": True,
                "old_relationship_text_preserved_in": "relationships[].note",
                "old_evidence_text_preserved_in": "evidence[].source",
            })
            # write back (replace in place)
            data[data.index(e)] = new_e
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BASE / "migration_summary_1.1.0.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"migrated {len(summary)} editions -> schema v1.1.0")


if __name__ == "__main__":
    migrate()
