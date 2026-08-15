#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Semantic regression tests — Oracle Corpus Study 03（Liushijiazi Full）
福 re-gate 後補測（2026-08-16）：防護「human 目視誤升 VERIFIED」與「reference gate 假通過」。

涵蓋（每項對應 re-gate blocker）：
  R1. 有 open substantive_divergence 的籤，cl-text 不得 VERIFIED（#7 #38 #41 #46 #48 #57）
  R2. VERIFIED 的 cl-text 必須：approval(human/domain_expert) + status=verified + 無 open divergence
  R3. #60 未獲新港確認時：不得 VERIFIED，且 evidence 不得宣稱 2 個獨立 group（source_ids 不得含新港）
  R4. reference chain：每筆 resolved reference → attestation 存在 → attestation.item_id == reference.item_id
  R5. human observed（verbatim_confirmed）的 attestation，其 slip claim 若非 VERIFIED 必須在 notes 說明 divergence
  R6. VERIFIED claim 的 source_ids 不得含 secondary（noupgrade）
  R7. evidence_summary 出現「2 個獨立官方 group」時，source_ids 必須同時含北港＋新港 primary
  R8. eligibility verified gate 與 claim VERIFIED 一致（gates.verified == claim VERIFIED 且無 open divergence）
"""
import json, glob, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")

def load(name):
    rows = []
    fn = os.path.join(DATA, f"{name}.jsonl")
    if os.path.exists(fn):
        rows = [json.loads(l) for l in open(fn, encoding="utf-8") if l.strip()]
    return rows

claims = load("claim")
atts = load("attestation")
items = load("concrete_item")
vgs = load("variant_group")
refs = load("reference_edition")
sources = {r["source_id"]: r for r in load("source_record")}
sec_srcs = {sid for sid, r in sources.items() if r["type"] == "secondary"}

ok, fail = [], []
def check(name, cond, detail=""):
    (ok if cond else fail).append(f"{name} {detail}".strip())

text_claims = {c["claim_id"]: c for c in claims if c["claim_type"] == "text_authenticity"}
# slip → open divergence（只有未 reference_designated 的 substantive/unresolved 才算 open；
# reference_designated：獨立官方 primary 已指定 reference，mirror substantivess 保留但不 open）
open_div = {}
designated = {}
for vg in vgs:
    if vg["relationship"] in ("substantive_divergence", "unresolved_relationship"):
        if vg.get("resolution_status") == "reference_designated":
            designated[vg["slip_id"]] = vg
        else:
            open_div[vg["slip_id"]] = vg["relationship"]
# slip → claims
slip_claims = {}
for c in text_claims.values():
    slip_claims.setdefault(c["target_id"], []).append(c)
# slip → attestations
slip_atts = {}
for a in atts:
    slip_atts.setdefault(a["slip_id"], []).append(a)
item_of = {i["item_id"]: i for i in items}

# R1: open divergence 籤不得 VERIFIED
for sid, rel in open_div.items():
    for c in slip_claims.get(sid, []):
        check(f"R1.{c['claim_id']}.not_verified", c["edge_level"] != "VERIFIED",
              f"open divergence({rel}) 卻 VERIFIED")

# R2: VERIFIED 需 approval + status + 無 open divergence
for c in text_claims.values():
    if c["edge_level"] == "VERIFIED":
        appr = c.get("approval") or {}
        check(f"R2.{c['claim_id']}.approval", appr.get("approved_by") in ("human", "domain_expert"), "缺 human approval")
        check(f"R2.{c['claim_id']}.status", c.get("status") == "verified", f"status={c.get('status')}")
        check(f"R2.{c['claim_id']}.no_open_div", c["target_id"] not in open_div, "有 open divergence")

# R3: #60 鏈路
c60 = text_claims.get("cl-text-060")
assert c60, "cl-text-060 不存在"
if c60["edge_level"] == "VERIFIED":
    srcs = set(c60.get("source_ids") or [])
    check("R3.60.srcs_include_xingang", "src-xingang-fengtiangong" in srcs, f"source_ids={sorted(srcs)}")
    xg60 = [a for a in atts if a["attestation_id"] == "att-xg-060"]
    check("R3.60.xg_att_exists", bool(xg60), "缺 att-xg-060")
    if xg60:
        check("R3.60.xg_not_uncertain", xg60[0]["text_status"] != "uncertain",
              f"text_status={xg60[0]['text_status']}（新港 attestation 仍 uncertain 不得支撐 VERIFIED）")
else:
    srcs = set(c60.get("source_ids") or [])
    check("R3.60.probable_no_xingang_src", "src-xingang-fengtiangong" not in srcs,
          f"非 VERIFIED 卻宣稱新港來源 {sorted(srcs)}")

# R4: reference chain
for ref in refs:
    if ref["resolution_status"] != "resolved":
        continue
    rid = ref["reference_id"]
    a = next((x for x in atts if x["attestation_id"] == ref.get("attestation_id")), None)
    check(f"R4.{rid}.att_exists", a is not None, f"→{ref.get('attestation_id')}")
    if a:
        check(f"R4.{rid}.chain", a["item_id"] == ref.get("item_id"),
              f"att.item_id={a['item_id']} != ref.item_id={ref.get('item_id')}")
    check(f"R4.{rid}.item_exists", ref.get("item_id") in item_of, f"→{ref.get('item_id')}")

# R5: verbatim_confirmed 但 claim 非 VERIFIED → notes 說明 divergence
for a in atts:
    if a["text_status"] == "verbatim_confirmed" and a["attestation_id"].startswith("att-bg-"):
        sid = a["slip_id"]
        cs = slip_claims.get(sid, [])
        if cs and all(c["edge_level"] != "VERIFIED" for c in cs):
            notes = (a.get("notes") or "") + "".join(c.get("notes") or "" for c in cs)
            check(f"R5.{a['attestation_id']}.divergence_noted",
                  ("divergence" in notes or "divergence 保留" in notes),
                  "verbatim_confirmed 且 claim 非 VERIFIED，但未說明 divergence")

# R6: VERIFIED 不得引用 secondary
for c in text_claims.values():
    if c["edge_level"] == "VERIFIED":
        bad = [s for s in (c.get("source_ids") or []) if s in sec_srcs]
        check(f"R6.{c['claim_id']}.no_secondary", not bad, f"引用 secondary {bad}")

# R7: 「2 個獨立官方 group」宣稱 ↔ source_ids 實際包含兩 primary
for c in text_claims.values():
    if "2 個獨立官方 group" in (c.get("evidence_summary") or ""):
        srcs = set(c.get("source_ids") or [])
        ok_chain = "src-beigang-official" in srcs and "src-xingang-fengtiangong" in srcs
        check(f"R7.{c['claim_id']}.two_group_srcs", ok_chain,
              f"宣稱 2-group 但 source_ids={sorted(srcs)}（需北港＋新港 primary）")
        # 該籤的新港 attestation 不得 uncertain
        for a in slip_atts.get(c["target_id"], []):
            if a["item_id"].startswith("item-xg-"):
                check(f"R7.{c['claim_id']}.xg_att_ok", a["text_status"] != "uncertain",
                      f"新港 attestation {a['attestation_id']} 仍 uncertain 卻宣稱 2-group")

# R8: eligibility 的 verified gate 一致性（cl-text VERIFIED ↔ 無 open divergence）
for c in text_claims.values():
    if c["edge_level"] == "VERIFIED":
        check(f"R8.{c['claim_id']}.eligible_consistent", c["target_id"] not in open_div,
              "VERIFIED claim 卻被 open divergence 擋")

# R9: reference_designated 的 substantive divergence：可 VERIFIED（不 open），但須真正 designated
if designated:
    for sid, vg in designated.items():
        check(f"R9.{vg['variant_group_id']}.is_substantive", vg["relationship"] == "substantive_divergence",
              f"designated 卻 relationship={vg['relationship']}")
        check(f"R9.{vg['variant_group_id']}.has_desc", bool(vg.get("divergence_description")),
              "designated 需 divergence_description")
        for c in text_claims.values():
            if c["target_id"] == sid:
                check(f"R9.{vg['variant_group_id']}.verified_ok", c["edge_level"] == "VERIFIED",
                      "reference_designated 籤應可 VERIFIED（如 #60）")
# 反向：VERIFIED 籤的 divergence（若有）必須 designated
for c in text_claims.values():
    if c["edge_level"] == "VERIFIED" and c["target_id"] in designated:
        check(f"R9b.{c['claim_id']}.designated_consistent", True, "")
    elif c["edge_level"] == "VERIFIED" and c["target_id"] in open_div:
        check(f"R9b.{c['claim_id']}.not_open", False, "VERIFIED 但有 open divergence")

print(f"\n=== SEMANTIC REGRESSION: {len(ok)} PASS / {len(fail)} FAIL ===")
for f_ in fail[:30]:
    print("  FAIL:", f_)
sys.exit(1 if fail else 0)
