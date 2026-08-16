#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
validate_corpus_package.py — data/corpora/liushijiazi/ 完整性驗證（mission §10）

A. Completeness        60/60 slips；每籤 reference attestation 可追；每 attestation 可追到 source
B. Status preservation 與 Study 03 frozen package 逐項比對：authenticity / divergence / license 無 drift
C. No silent canonicalization  divergence 籤雙 reading 全保存；reference_text 與研究包逐字一致
D. Reproducibility      由 build_corpus_package.py 保證（無時間戳/隨機）；此處驗證輸出結構

用法：
  python3 validate_corpus_package.py
"""
import json
import os
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SRC = os.path.join(REPO_ROOT, "research", "oracle-corpus-study-03-liushijiazi-full")
DATA_SRC = os.path.join(SRC, "data")
PKG = os.path.dirname(os.path.abspath(__file__))

PASS = 0
FAIL = 0
FAILURES = []


def check(name, ok, detail=""):
    global PASS, FAIL
    if ok:
        PASS += 1
    else:
        FAIL += 1
        FAILURES.append(f"{name}: {detail}")


def load_jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    # ---------- 讀 package 輸出 ----------
    corpus = load_json(os.path.join(PKG, "corpus.json"))
    slips = load_json(os.path.join(PKG, "slips.json"))
    atts = load_json(os.path.join(PKG, "attestations.json"))
    variants = load_json(os.path.join(PKG, "variants.json"))
    sources = load_json(os.path.join(PKG, "sources.json"))
    claims = load_json(os.path.join(PKG, "claims.json"))

    # ---------- 讀 frozen source of truth ----------
    src_slips = load_jsonl(os.path.join(DATA_SRC, "slip.jsonl"))
    src_atts = load_jsonl(os.path.join(DATA_SRC, "attestation.jsonl"))
    src_items = load_jsonl(os.path.join(DATA_SRC, "concrete_item.jsonl"))
    src_vgs = load_jsonl(os.path.join(DATA_SRC, "variant_group.jsonl"))
    src_sources = load_jsonl(os.path.join(DATA_SRC, "source_record.jsonl"))
    src_claims = load_jsonl(os.path.join(DATA_SRC, "claim.jsonl"))
    src_refs = load_jsonl(os.path.join(DATA_SRC, "reference_edition.jsonl"))
    comparison = load_json(os.path.join(SRC, "Liushijiazi-Corpus-Comparison-v0.1.json"))
    eligibility = load_json(os.path.join(SRC, "Production-Eligibility-Report-v0.1.json"))

    att_by_id = {a["attestation_id"]: a for a in atts}
    src_ids = {s["source_id"] for s in sources}
    slip_by_num = {s["slip_number"]: s for s in slips}
    claim_by_slip = {c["target_id"]: c for c in src_claims if c["claim_type"] == "text_authenticity"}
    ref_by_slip = {att_by_id[r["attestation_id"]]["slip_id"]: r for r in src_refs}
    item_by_id = {i["item_id"]: i for i in src_items}
    vg_by_slip = {v["slip_id"]: v for v in src_vgs}

    # ---------- A. Completeness ----------
    check("A1. corpus 基本欄位", corpus["corpus_id"] == "liushijiazi" and corpus["lot_count"] == 60,
          f"corpus_id={corpus.get('corpus_id')}, lot_count={corpus.get('lot_count')}")
    check("A2. slips 60/60", len(slips) == 60, f"len={len(slips)}")
    check("A3. slip_number 1..60 完整", [s["slip_number"] for s in slips] == list(range(1, 61)),
          "slip_number 缺漏或順序錯誤")
    check("A4. production_eligible 全 false", all(not s["production_eligible"] for s in slips),
          "有 slip production_eligible=true")
    for s in slips:
        ref_att = att_by_id.get(s["reference_attestation_id"])
        check(f"A5.{s['slip_number']:02d}. reference attestation 存在", ref_att is not None,
              f"reference_attestation_id={s.get('reference_attestation_id')}")
        if ref_att:
            check(f"A6.{s['slip_number']:02d}. reference text 一致",
                  ref_att["text"] == s["reference_text"], "reference_text 與 attestation text 不一致")
            check(f"A7.{s['slip_number']:02d}. attestation 可追到 source",
                  ref_att["source_id"] in src_ids, f"source_id={ref_att.get('source_id')}")
    check("A8. attestations 180", len(atts) == 180, f"len={len(atts)}")
    check("A9. 每籤 3 attestations", all(
        len([a for a in atts if a["slip_number"] == n]) == 3 for n in range(1, 61)),
        "slip 的 attestation 數 ≠ 3")
    check("A10. sources 4", len(sources) == 4, f"len={len(sources)}")  # +1: src-taiwan-memory-beigang (2026-08-16 historical attestation)
    check("A11. claims 71", len(claims) == 71, f"len={len(claims)}")  # +1: cl-historical-attestation-taiwan-memory-01
    check("A12. corpus 層 license unresolved",
          corpus["license_status"] == "unresolved" and corpus["production_eligible"] is False,
          f"license_status={corpus.get('license_status')}")

    # ---------- B. Status preservation ----------
    for s in slips:
        num = s["slip_number"]
        src_claim = claim_by_slip[f"slip-lsjz-{num:03d}"]
        check(f"B1.{num:02d}. authenticity 無 drift",
              s["authenticity_status"] == src_claim["edge_level"],
              f"package={s['authenticity_status']} vs source={src_claim['edge_level']}")
    for s in slips:
        num = s["slip_number"]
        el = next(p for p in eligibility["per_slip"] if p["slip_number"] == num)
        check(f"B2.{num:02d}. eligibility 無 drift",
              s["production_eligible"] == el["eligible"],
              f"package={s['production_eligible']} vs eligibility={el['eligible']}")
    vg_by_num = {v["slip_id"]: v for v in src_vgs}
    cmp_by_num = {str(x["slip_number"]): x for x in comparison["slips"]}
    var_by_num = {}
    for v in variants:
        var_by_num.setdefault(v["slip_number"], []).append(v)
    for n in range(1, 61):
        vg = vg_by_num[f"slip-lsjz-{n:03d}"]
        cmp = cmp_by_num[str(n)]
        diffs = cmp["beigang_vs_fs60"].get("diffs") or []
        if vg["relationship"] == "identical_text":
            check(f"B3.{n:02d}. identical 無 variant", n not in var_by_num,
                  "identical 籤卻有 variant record")
        else:
            vs = var_by_num.get(n, [])
            check(f"B3.{n:02d}. divergence 有 variant", len(vs) >= 1 and len(vs) == len([d for d in diffs if not d.get('unresolved')]),
                  f"variants={len(vs)} vs diffs={len(diffs)}")
            for v in vs:
                check(f"B4.{n:02d}. variant classification 無 drift",
                      v["classification"] == vg["relationship"],
                      f"package={v['classification']} vs vg={vg['relationship']}")
                check(f"B5.{n:02d}. reference_selected 對應 designated",
                      v["reference_selected"] == (vg.get("resolution_status") == "reference_designated"),
                      f"package={v['reference_selected']} vs status={vg.get('resolution_status')}")
    # human_verified 集合（text_status=verbatim_confirmed 的籤）
    hv_src = sorted({a["slip_number"] for a in atts
                     if a["text_status"] == "verbatim_confirmed"
                     and a["family_id"] in ("ed-beigang-chaotiangong", "ed-xingang-fengtiangong")})
    hv_pkg = sorted({s["slip_number"] for s in slips if s["human_verified"]})
    check("B6. human_verified 集合一致", hv_src == hv_pkg and len(hv_pkg) == 8,
          f"package={hv_pkg} vs source={hv_src}")
    # VERIFIED claims
    verified = [c for c in claims if c["status"] == "VERIFIED"]
    check("B7. VERIFIED claims = #19 #60",
          sorted(c["slip_number"] for c in verified if c["slip_number"]) == [19, 60],
          f"verified slips={sorted(c['slip_number'] for c in verified if c['slip_number'])}")
    check("B8. license 全 unresolved", all(a["item_license_status"] == "unresolved" for a in atts),
          "有 attestation item_license_status ≠ unresolved")

    # ---------- C. No silent canonicalization ----------
    for n in range(1, 61):
        cmp = cmp_by_num[str(n)]
        vg = vg_by_num[f"slip-lsjz-{n:03d}"]
        diffs = cmp["beigang_vs_fs60"].get("diffs") or []
        ref_att = att_by_id[ref_by_slip[f"slip-lsjz-{n:03d}"]["attestation_id"]]
        check(f"C1.{n:02d}. reference_text 逐字一致",
              ref_att["text"] == slip_by_num[n]["reference_text"],
              "reference_text 與 reference attestation 不一致")
        vs = var_by_num.get(n, [])
        for i, d in enumerate([x for x in diffs if not x.get("unresolved")], start=1):
            v = next((x for x in vs if x["variant_id"] == f"var-lsjz-{n:03d}-{i:02d}"), None)
            check(f"C2.{n:02d}-{i}. 雙 reading 保存（a={d.get('a')} / b={d.get('b')}）",
                  v is not None and v["reference_text"] == d.get("a") and v["variant_text"] == d.get("b"),
                  f"variant 缺失或 reading 不符：{v}")
    check("C3. 無 silent canonicalization（all variants preserved）",
          len(variants) == sum(1 for x in comparison["slips"]
                               for d in (x["beigang_vs_fs60"].get("diffs") or []) if not d.get("unresolved")),
          f"variants={len(variants)}")

    # ---------- 總結 ----------
    print(f"\n=== CORPUS PACKAGE VALIDATOR: {PASS} PASS / {FAIL} FAIL ===")
    if FAILURES:
        for f in FAILURES:
            print("  FAIL:", f)
        sys.exit(1)


if __name__ == "__main__":
    main()
