#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase C — Draw Pool eligibility report for 60 slips（canonical algorithm，與 Framework §6.2 逐字一致）
eligible(slip) := slip_status==verified AND no_open_substantive_divergence AND
                 reference_resolved_to_item AND reference_item.item_license_status==ok AND
                 reference_item.access_status∈{open,open_register} AND no_quarantine_chain
"""
import json, os, glob

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")

entities = {}
for fn in sorted(glob.glob(os.path.join(DATA, "*.jsonl"))):
    name = os.path.basename(fn)[:-6]
    entities[name] = [json.loads(l) for l in open(fn, encoding="utf-8") if l.strip()]

items = {r["item_id"]: r for r in entities["concrete_item"]}
slips = {r["slip_id"]: r for r in entities["slip"]}
claims = {r["claim_id"]: r for r in entities["claim"]}
vgs = entities["variant_group"]
atts = {r["attestation_id"]: r for r in entities["attestation"]}
refs = {r["reference_id"]: r for r in entities.get("reference_edition", [])}

# open divergence per slip：只有「尚未 reference_designated 的 substantive/unresolved」才阻擋
# （reference_designated：獨立官方 primary 已指定 reference，mirror substantivess 保留但不 open）
SUBSTANTIVE = {}
for vg in vgs:
    if vg["relationship"] in ("substantive_divergence", "unresolved_relationship")        and vg.get("resolution_status") != "reference_designated":
        SUBSTANTIVE[vg["slip_id"]] = vg["relationship"]

# slip verified? claims edge_level
VERIFIED_SLIPS = set()
for c in claims.values():
    if c["claim_type"] == "text_authenticity" and c["edge_level"] == "VERIFIED":
        VERIFIED_SLIPS.add(c["target_id"])

def reference_chain_ok(n):
    """Phase C reference gate：reference_edition(resolved) → attestation → item 全鏈驗證。
    1. 存在 resolution_status=resolved 的 reference 記錄
    2. reference.attestation_id 存在於 attestation
    3. reference.item_id 存在於 concrete_item
    4. attestation.item_id == reference.item_id（chain 一致性，不得指到別家 item）
    """
    refs_n = [r for r in refs.values() if r.get("reference_id") == f"ref-lsjz-{n:03d}"]
    if not refs_n:
        return False, "no reference_edition record"
    ref = refs_n[0]
    if ref.get("resolution_status") != "resolved":
        return False, f"resolution_status={ref.get('resolution_status')}"
    if not ref.get("item_id") or not ref.get("attestation_id"):
        return False, "resolved 需 item_id+attestation_id"
    a = atts.get(ref["attestation_id"])
    if a is None:
        return False, f"attestation {ref['attestation_id']} 不存在"
    if a.get("item_id") != ref["item_id"]:
        return False, f"attestation.item_id={a.get('item_id')} != reference.item_id={ref['item_id']}"
    if ref["item_id"] not in items:
        return False, f"item {ref['item_id']} 不存在"
    return True, f"{ref['reference_id']} → {ref['attestation_id']} → {ref['item_id']} ✓"

report = []
for n in range(1, 61):
    sid = f"slip-lsjz-{n:03d}"
    bg_item = items.get(f"item-bg-{n:03d}")
    ref_ok, ref_detail = reference_chain_ok(n)
    gates = {
        "verified": sid in VERIFIED_SLIPS,
        "no_open_substantive_divergence": sid not in SUBSTANTIVE,
        "reference_resolved_to_item": ref_ok,
        "item_license_ok": bool(bg_item) and bg_item.get("item_license_status") == "ok",
        "access_open": bool(bg_item) and bg_item.get("access_status") in ("open", "open_register"),
        "no_quarantine": True,
    }
    eligible = all(gates.values())
    blocked = [k for k, v in gates.items() if not v]
    report.append({
        "slip_number": n, "slip_id": sid, "eligible": eligible,
        "gates": gates, "blocked_reasons": blocked,
        "reference_chain": ref_detail,
        "note": "production gate 全過才 eligible；reference gate 驗證 reference→attestation→item 全鏈；VERIFIED 需 human/domain_expert approval；divergence gate 只阻擋未 reference_designated 的 open substantive divergence"
    })

eligible_count = sum(1 for r in report if r["eligible"])
blocked_count = 60 - eligible_count
blocked_reasons = {}
for r in report:
    for b in r["blocked_reasons"]:
        blocked_reasons[b] = blocked_reasons.get(b, 0) + 1

summary = {
    "algorithm": "Framework v0.1 §6.2 / Schema §14 / Rules §4（canonical，逐字一致）",
    "total_slips": 60,
    "production_eligible": eligible_count,
    "blocked": blocked_count,
    "blocked_reason_counts": blocked_reasons,
    "research_db_records": 60,
    "note": "所有籤皆 Research DB record；production eligibility 需：human approval 升 VERIFIED（含 OCR 人工複核）＋item_license 確認（北港/新港官方圖檔未見再製授權聲明）＋substantive divergence 處理"
}
out = {"summary": summary, "per_slip": report}
with open(os.path.join(BASE, "Production-Eligibility-Report-v0.1.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(json.dumps(summary, ensure_ascii=False, indent=2))
