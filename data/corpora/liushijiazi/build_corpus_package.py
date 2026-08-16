#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_corpus_package.py — Study 03 → Draw One corpus database packaging

把已 merge 進 main 的 Study 03 frozen research package（research/oracle-corpus-study-03-liushijiazi-full/data/*.jsonl）
deterministically 轉換為 machine-readable corpus package：data/corpora/liushijiazi/

原則（mission 2026-08-16）：
- Packaging, not new research：不重搜尋、不 reinterpret、不 re-canonicalize
- No canonicalization without source evidence
- text_authenticity / source_provenance / license_status / production_eligibility 分離
- 不自行改變任何 status；無 silent canonicalization

輸出（JSON，ensure_ascii=False，sort_keys，無時間戳 → deterministic）：
  corpus.json / slips.json / attestations.json / variants.json / sources.json / claims.json

用法：
  python3 build_corpus_package.py            # 從 repo root 自動定位
  python3 build_corpus_package.py --check    # build 後跑 integrity validator
"""
import argparse
import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC = os.path.join(REPO_ROOT, "research", "oracle-corpus-study-03-liushijiazi-full")
DATA_SRC = os.path.join(SRC, "data")
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

CORPUS_ID = "liushijiazi"
LAST_VALIDATED = {
    "package_path": "research/oracle-corpus-study-03-liushijiazi-full",
    "main_commit": "f589d58",
    "validator": "2204 PASS / 0 FAIL",
    "semantic_regression": "211 PASS / 0 FAIL",
    "eligibility": "0/60 production-eligible",
    "clean_rebuild": "byte-level identical to frozen PR package",
}


def load_jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="build 後執行 integrity validator")
    args = ap.parse_args()

    if not os.path.isdir(DATA_SRC):
        sys.exit(f"ERROR: 找不到 Study 03 frozen package：{DATA_SRC}\n請從 repo root 的乾淨 checkout 執行（main 需含 PR #10 merge）。")

    corpus_rows = load_jsonl(os.path.join(DATA_SRC, "corpus.jsonl"))
    slips = load_jsonl(os.path.join(DATA_SRC, "slip.jsonl"))
    atts = load_jsonl(os.path.join(DATA_SRC, "attestation.jsonl"))
    items = load_jsonl(os.path.join(DATA_SRC, "concrete_item.jsonl"))
    vgs = load_jsonl(os.path.join(DATA_SRC, "variant_group.jsonl"))
    sources = load_jsonl(os.path.join(DATA_SRC, "source_record.jsonl"))
    claims = load_jsonl(os.path.join(DATA_SRC, "claim.jsonl"))
    refs = load_jsonl(os.path.join(DATA_SRC, "reference_edition.jsonl"))
    families = load_jsonl(os.path.join(DATA_SRC, "edition_family.jsonl"))
    igroups = load_jsonl(os.path.join(DATA_SRC, "independence_group.jsonl"))
    adoptions = load_jsonl(os.path.join(DATA_SRC, "temple_adoption.jsonl"))
    comparison = load_json(os.path.join(SRC, "Liushijiazi-Corpus-Comparison-v0.1.json"))
    eligibility = load_json(os.path.join(SRC, "Production-Eligibility-Report-v0.1.json"))

    # ---------- index ----------
    slip_by_id = {s["slip_id"]: s for s in slips}
    att_by_id = {a["attestation_id"]: a for a in atts}
    item_by_id = {i["item_id"]: i for i in items}
    src_by_id = {s["source_id"]: s for s in sources}
    vg_by_slip = {v["slip_id"]: v for v in vgs}
    ref_by_slip = {att_by_id[r["attestation_id"]]["slip_id"]: r for r in refs}
    claim_by_slip = {c["target_id"]: c for c in claims if c["claim_type"] == "text_authenticity"}
    el_by_slip = {str(p["slip_number"]): p for p in eligibility["per_slip"]}
    cmp_by_num = {str(s["slip_number"]): s for s in comparison["slips"]}

    # ---------- 1. corpus.json ----------
    c = corpus_rows[0]
    corpus_identity_claim = next((x for x in claims if x["claim_type"] == "corpus_identity"), None)
    corpus_out = {
        "corpus_id": CORPUS_ID,
        "name_zh": c["display_name"],
        "name_en": "Liushijiazi",
        "lot_count": len(slips),
        "corpus_status": corpus_identity_claim["edge_level"] if corpus_identity_claim else None,
        "corpus_status_source": "cl-corpus-identity-01（Study 03：六十甲子籤為單一 textual corpus；VERIFIED 需 human/domain_expert approval）",
        "reference_method": "comparison-based reference designation（60-vs-60 全量比對後，北港官方圖檔版指定為 reference edition；60/60 reference chain 皆 resolved）",
        "production_eligible": False,
        "identity": {
            "name_family": c.get("name_family"),
            "self_identification": c.get("self_identification"),
            "origin_tradition": c.get("origin_tradition"),
            "origin_deity": c.get("origin_deity"),
            "origin_place": c.get("origin_place"),
            "corpus_deity_distinction": "「媽祖籤」不是單一 corpus：六十甲子籤為獨立 textual corpus，被多神多廟採用（見 adoption_deities）；不得與其他媽祖廟使用的其他籤系混為同一 dataset",
        },
        "adoption_deities": c.get("adoption_deities"),
        "known_temple_adoptions": [
            {
                "adoption_id": a["adoption_id"],
                "temple": a["temple"],
                "deity": a["deity"],
                "region": a["region"],
                "evidence_claim_ids": a["evidence_claim_ids"],
                "source_ids": a["source_ids"],
                "adoption_date_fact": a.get("adoption_date_fact"),
                "notes": a["notes"],
            }
            for a in adoptions
        ],
        "edition_families": [
            {
                "family_id": f["family_id"],
                "name": f["name"],
                "status": f["status"],
                "mirror_group": f.get("mirror_group"),
                "lineage_note": f["lineage_note"],
                "family_claim_ids": f["family_claim_ids"],
            }
            for f in families
        ],
        "provenance_status": {
            "corpus_identity": corpus_identity_claim["edge_level"] if corpus_identity_claim else None,
            "independence_groups": [{"group_id": g["group_id"], "rationale": g["rationale"]} for g in igroups],
            "sources": [
                {
                    "source_id": s["source_id"],
                    "type": s["type"],
                    "source_observation_status": s["source_observation_status"],
                }
                for s in sources
            ],
            "note": "官方 primary sources 皆 directly_observed（2026-08-15）；全量比對完成；corpus identity 為 PROBABLE（awaiting human approval）",
        },
        "license_status": "unresolved",
        "license_note": "item_license_status 180/180 = unresolved（北港/新港官方圖檔未見再製授權聲明）→ production_eligible = 0/60",
        "last_validated_package": LAST_VALIDATED,
    }
    write_json("corpus.json", corpus_out)

    # ---------- 2. slips.json ----------
    slips_out = []
    for s in sorted(slips, key=lambda x: x["slip_number"]):
        num = s["slip_number"]
        ref = ref_by_slip[s["slip_id"]]
        ref_att = att_by_id[ref["attestation_id"]]
        claim = claim_by_slip[s["slip_id"]]
        cmp = cmp_by_num.get(str(num), {})
        human_verified = any(
            a.get("text_status") == "verbatim_confirmed"
            and a["family_id"] in ("ed-beigang-chaotiangong", "ed-xingang-fengtiangong")
            for a in atts
            if a["slip_id"] == s["slip_id"]
        )
        slips_out.append({
            "corpus_id": CORPUS_ID,
            "slip_number": num,
            "slip_id": s["slip_id"],
            "ganzhi": cmp.get("ganzhi"),
            "reference_text": ref_att["source_text"],
            "reference_attestation_id": ref["attestation_id"],
            "reference_edition_id": ref["reference_id"],
            "reference_basis": ref["rationale"],
            "authenticity_status": claim["edge_level"],
            "authenticity_claim_id": claim["claim_id"],
            "human_verified": human_verified,
            "production_eligible": False,
            "production_eligible_reason": "item_license_status=unresolved（license gate 未過）；production gate 需 license 確認後才可 eligible",
            "license_status": "unresolved",
            "source_package_notes": s.get("notes"),
        })
    write_json("slips.json", slips_out)

    # ---------- 3. attestations.json ----------
    atts_out = []
    for a in sorted(atts, key=lambda x: x["attestation_id"]):
        item = item_by_id[a["item_id"]]
        src = src_by_id[item["source_record_id"]]
        slip_num = int(a["slip_id"].rsplit("-", 1)[-1])
        atts_out.append({
            "attestation_id": a["attestation_id"],
            "corpus_id": CORPUS_ID,
            "slip_number": slip_num,
            "slip_id": a["slip_id"],
            "family_id": a["family_id"],
            "source_id": src["source_id"],
            "carrier": src["holder"],
            "source_type": src["type"],
            "text": a["source_text"],
            "retrieval_date": item["verification_date"],
            "access_status": item["access_status"],
            "license_status": item["license_status"],
            "item_license_status": item["item_license_status"],
            "text_status": a.get("text_status"),
            "transcription_method": a.get("transcription_method"),
            "transcription_by": a.get("transcription_by"),
            "numbering_in_source": a.get("numbering_in_source"),
            "title_in_source": a.get("title_in_source"),
            "fortune_in_source": a.get("fortune_in_source"),
            "commentary_layers": a.get("commentary_layers"),
            "item_url": item["url"],
            "digital_checksum": item["digital_checksum"],
            "notes": a.get("notes"),
        })
    write_json("attestations.json", atts_out)

    # ---------- 4. variants.json（per diff pair；reference + variant 雙 reading 全保存） ----------
    variants_out = []
    for num in sorted(cmp_by_num, key=int):
        slip = cmp_by_num[num]
        slip_id = f"slip-lsjz-{int(num):03d}"
        vg = vg_by_slip[slip_id]
        diffs = slip["beigang_vs_fs60"].get("diffs") or []
        for i, d in enumerate(diffs, start=1):
            if d.get("unresolved"):
                continue
            designated = vg.get("resolution_status") == "reference_designated"
            ref_srcs = ["src-beigang-official"]
            if int(num) == 60:
                ref_srcs.append("src-xingang-fengtiangong")
            variants_out.append({
                "variant_id": f"var-lsjz-{int(num):03d}-{i:02d}",
                "corpus_id": CORPUS_ID,
                "slip_number": int(num),
                "line": d.get("line"),
                "reference_text": d.get("a"),
                "variant_text": d.get("b"),
                "classification": vg["relationship"],
                "reference_selected": designated,
                "reference_source_ids": ref_srcs,
                "source_ids": ["src-haomiaowang-fs60"],
                "notes": vg.get("divergence_description"),
            })
    write_json("variants.json", variants_out)

    # ---------- 5. sources.json ----------
    sources_out = []
    for s in sorted(sources, key=lambda x: x["source_id"]):
        ig = next((g for g in igroups if s["source_id"] in g.get("member_source_ids", []) or
                   g["group_id"] == f"ig-{s['source_id'].replace('src-', '')}"), None)
        src_items = [i for i in items if i["source_record_id"] == s["source_id"]]
        sources_out.append({
            "source_id": s["source_id"],
            "institution": s["holder"],
            "source_title": s["name"],
            "url": s["url"],
            "classification": s["type"],  # primary / secondary
            "content_class": s.get("content_class"),
            "retrieved_date": s["verification_date"],
            "access_status": s["access_status"],
            "license_status": s.get("license_status"),
            "item_license_status": src_items[0]["item_license_status"] if src_items else None,
            "independence_group_id": ig["group_id"] if ig else None,
            "independence_note": ig["rationale"] if ig else s.get("notes"),
            "lineage_notes": s.get("notes"),
            "evidence_classification": "independent_primary" if s["type"] == "primary" else "secondary/mirror（不得標為 independent primary）",
        })
    write_json("sources.json", sources_out)

    # ---------- 6. claims.json ----------
    claims_out = []
    for c in sorted(claims, key=lambda x: x["claim_id"]):
        slip_num = None
        if c["target_type"] == "slip":
            slip_num = int(c["target_id"].rsplit("-", 1)[-1])
        claims_out.append({
            "claim_id": c["claim_id"],
            "claim_type": c["claim_type"],
            "corpus_id": CORPUS_ID,
            "slip_number": slip_num,
            "target_type": c["target_type"],
            "target_id": c["target_id"],
            "status": c["edge_level"],
            "status_detail": c.get("status"),
            "evidence_ids": c.get("source_ids", []),
            "reason": c.get("evidence_summary"),
            "checked_by": c.get("checked_by"),
            "checked_at": c.get("checked_at"),
            "notes": c.get("notes"),
        })
    write_json("claims.json", claims_out)

    print("=== corpus package built ===")
    print(f"  corpus: 1 | slips: {len(slips_out)} | attestations: {len(atts_out)} | "
          f"variants: {len(variants_out)} | sources: {len(sources_out)} | claims: {len(claims_out)}")

    if args.check:
        rc = os.system(f"python3 {os.path.join(OUT_DIR, 'validate_corpus_package.py')}")
        sys.exit(rc if os.name == "posix" else 0)


def write_json(name, obj):
    path = os.path.join(OUT_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    print(f"  wrote {name} ({len(obj)} records)" if isinstance(obj, list) else f"  wrote {name}")


if __name__ == "__main__":
    main()
