#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Full 60-slip ingest validator — 北港60+新港12+好廟網60（Phase B/C）
驗證：
  1. 每 entity 每行過 Oracle-Database-Schema-v0.1.json 對應 $defs（JSON Schema draft 2020-12）
  2. Trace：attestation→concrete_item→source_record；claim refs 全部存在
  3. poem text 與 commentary 分層（source_text 只含詩文）
  4. #60「內外」未被 normalize（官方系 consensus，不 merge 成任何單一版本）
  5. UNKNOWN license 保留（item_license_status=unresolved）
  6. 無 secondary 升格（無 VERIFIED edge_level 出自 agent）
  7. 計數：slip 60、attestation 132（60 bg + 12 xg + 60 hm）、concrete_item 180、variant_group 60
  8. variant_group 覆蓋：每 slip 的每個 attestation 被 ≥1 variant_group 覆蓋
  9. independence：每 slip ≥2 個 independence group 的 attestation（北港+好廟網；#60 另含新港）
"""
import json, sys, os, glob
from jsonschema import Draft202012Validator

BASE = os.path.dirname(os.path.abspath(__file__))
LOCAL_SCHEMA = os.path.join(BASE, "Oracle-Database-Schema-v0.1.json")
DEV_SCHEMA = os.path.join(os.path.dirname(BASE), "draw-one-oracle-framework-v01", "Oracle-Database-Schema-v0.1.json")
SCHEMA = LOCAL_SCHEMA if os.path.exists(LOCAL_SCHEMA) else DEV_SCHEMA
DATA = os.path.join(BASE, "data")

schema = json.load(open(SCHEMA, encoding="utf-8"))
print(f"使用 schema: {SCHEMA}")
defs = schema["$defs"]

ok, fail = [], []
def check(name, cond, detail=""):
    (ok if cond else fail).append(f"{name} {detail}".strip())

entities = {}
for fn in sorted(glob.glob(os.path.join(DATA, "*.jsonl"))):
    name = os.path.basename(fn)[:-6]
    rows = [json.loads(l) for l in open(fn, encoding="utf-8") if l.strip()]
    entities[name] = rows

# 1. Schema 驗證
for name, rows in entities.items():
    entity_root = dict(defs[name]); entity_root["$defs"] = defs
    validator = Draft202012Validator(entity_root)
    for i, row in enumerate(rows):
        errs = list(validator.iter_errors(row))
        check(f"schema.{name}[{i}]", not errs, "; ".join(e.message for e in errs[:2]))

# 2a. Trace
items = {r["item_id"]: r for r in entities["concrete_item"]}
sources = {r["source_id"]: r for r in entities["source_record"]}
groups = {r["group_id"]: r for r in entities["independence_group"]}
slips = {r["slip_id"]: r for r in entities["slip"]}
families = {r["family_id"]: r for r in entities["edition_family"]}
adoptions = {r["adoption_id"]: r for r in entities["temple_adoption"]}
claims = {r["claim_id"]: r for r in entities["claim"]}
for att in entities["attestation"]:
    check(f"trace.att.{att['attestation_id']}.item", att["item_id"] in items)
    check(f"trace.att.{att['attestation_id']}.slip", att["slip_id"] in slips)
    check(f"trace.att.{att['attestation_id']}.family", att["family_id"] in families)
for it in entities["concrete_item"]:
    check(f"trace.item.{it['item_id']}.source", it["source_record_id"] in sources)
    check(f"trace.item.{it['item_id']}.group", it["independence_group_id"] in groups)
    check(f"trace.item.{it['item_id']}.family", it["family_id"] in families)

# 2b. Claim refs
for ent_name, rows in [("corpus", entities.get("corpus", [])), ("edition_family", entities.get("edition_family", [])),
                       ("independence_group", entities.get("independence_group", [])),
                       ("temple_adoption", entities.get("temple_adoption", []))]:
    for r in rows:
        for cid in (r.get("identity_claim_ids") or []) + (r.get("origin_claim_ids") or []) + \
                   (r.get("family_claim_ids") or []) + (r.get("group_claim_ids") or []) + \
                   (r.get("evidence_claim_ids") or []):
            check(f"ref.{ent_name}.{r.get(list(r)[0])}.{cid}", cid in claims, f"→{cid}")
# claims self-references
for c in entities["claim"]:
    if c.get("target_type") == "family" and c.get("target_id") not in families:
        check(f"claim.{c['claim_id']}.target_family", False, c.get("target_id"))
    if c.get("target_type") == "adoption" and c.get("target_id") not in adoptions:
        check(f"claim.{c['claim_id']}.target_adoption", False, c.get("target_id"))
    if c.get("target_type") == "slip" and c.get("target_id") not in slips:
        check(f"claim.{c['claim_id']}.target_slip", False, c.get("target_id"))

# 3. poem layering: source_text == 4 lines of 7 chars
for att in entities["attestation"]:
    lines = att["source_text"].split("\n")
    if att["attestation_id"].startswith(("att-bg", "att-xg", "att-hm")):
        if len(lines) != 4 or not all(len(l) == 7 for l in lines):
            check(f"poem.{att['attestation_id']}", False, f"{len(lines)} lines / {[len(l) for l in lines]}")

# 4. #60 內外 preserved
att60 = [a for a in entities["attestation"] if a["slip_id"] == "slip-lsjz-060" and a["attestation_id"].startswith(("att-bg", "att-xg"))]
for a in att60:
    check(f"text60.{a['attestation_id']}.neiwai", "內外" in a["source_text"], f"→{a['source_text']}")

# 5. license preserved
for it in entities["concrete_item"]:
    check(f"license.{it['item_id']}", it["item_license_status"] == "unresolved", f"→{it['item_license_status']}")

# 6. VERIFIED 僅允許 human/domain_expert approval（agent 不 self-approve）
for c in entities["claim"]:
    if c["edge_level"] == "VERIFIED":
        appr = c.get("approval") or {}
        appr_ok = appr.get("approved_by") in ("human", "domain_expert") and c.get("status") == "verified"
        check(f"claim.{c['claim_id']}.verified_approval", appr_ok, f"→{c['edge_level']} 需 human/domain_expert approval")

# 7. counts
check("count.slip", len(entities["slip"]) == 60, f"→{len(entities['slip'])}")
check("count.attestation", len(entities["attestation"]) == 180, f"→{len(entities['attestation'])}")
check("count.item", len(entities["concrete_item"]) == 180, f"→{len(entities['concrete_item'])}")
check("count.variant_group", len(entities["variant_group"]) == 60, f"→{len(entities['variant_group'])}")
check("count.independence_group", len(entities["independence_group"]) == 3, f"→{len(entities['independence_group'])}")

# 8. variant_group coverage
covered = set()
for vg in entities["variant_group"]:
    for aid in vg["attestation_ids"]:
        covered.add(aid)
all_att = {a["attestation_id"] for a in entities["attestation"]}
uncovered = all_att - covered
check("vg.coverage", not uncovered, f"uncovered: {sorted(uncovered)[:5]}")

# 9. independence per slip: attestations from ≥2 groups
for s in entities["slip"]:
    atts = [a for a in entities["attestation"] if a["slip_id"] == s["slip_id"]]
    groups_of = {items[a["item_id"]]["independence_group_id"] for a in atts if a["item_id"] in items}
    check(f"indep.{s['slip_id']}", len(groups_of) >= 2, f"→{groups_of}")

# 9b. variant_group：reference_designated 必須是 substantive_divergence 且有 divergence_description
for vg in entities["variant_group"]:
    if vg.get("resolution_status") == "reference_designated":
        check(f"vg.{vg['variant_group_id']}.designated_substantive", vg["relationship"] == "substantive_divergence",
              f"designated 卻 relationship={vg['relationship']}")
        check(f"vg.{vg['variant_group_id']}.designated_desc", bool(vg.get("divergence_description")),
              "designated 需 divergence_description")

# 10. reference_edition chain：resolved → attestation 存在且 attestation.item_id == reference.item_id
ref_atts = {a["attestation_id"]: a for a in entities["attestation"]}
ref_items = {i["item_id"]: i for i in entities["concrete_item"]}
for ref in entities.get("reference_edition", []):
    rid = ref["reference_id"]
    if ref["resolution_status"] == "resolved":
        need = ref.get("item_id") and ref.get("attestation_id")
        check(f"ref.{rid}.resolved_fields", bool(need), "resolved 需 item_id+attestation_id")
        if need:
            check(f"ref.{rid}.att_exists", ref["attestation_id"] in ref_atts, f"→{ref['attestation_id']}")
            check(f"ref.{rid}.item_exists", ref["item_id"] in ref_items, f"→{ref['item_id']}")
            if ref["attestation_id"] in ref_atts:
                check(f"ref.{rid}.chain_match",
                      ref_atts[ref["attestation_id"]]["item_id"] == ref["item_id"],
                      f"attestation.item_id={ref_atts[ref['attestation_id']].get('item_id')} != ref.item_id={ref['item_id']}")
    else:
        check(f"ref.{rid}.family", bool(ref.get("family_id")), "display_only 需 family_id")

print(f"\n=== RESULT: {len(ok)} PASS / {len(fail)} FAIL ===")
if fail:
    print("--- FAILS ---")
    for f_ in fail[:40]:
        print(" ", f_)
    sys.exit(1)
print("ALL CHECKS PASSED")
