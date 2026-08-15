#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase A Pilot validator — 北港朝天宮 3-slip ingest
驗證：
  1. 每 entity 每行過 Oracle-Database-Schema-v0.1.json 對應 $defs（JSON Schema draft 2020-12）
  2. Trace：attestation→concrete_item→source_record；claim refs 全部存在
  3. poem text 與 commentary 分層（source_text 只含詩文）
  4. #60「內外」未被 normalize
  5. UNKNOWN license 保留（item_license_status=unresolved）
  6. 無 secondary 升格（secondary 來源無 VERIFIED claim；verified corpus text 僅來自 primary）
  7. 不 bulk：slip 3、attestation 6（3 primary + 3 comparison）
  8. variant_group 覆蓋：每 slip 的每個 attestation 被 ≥1 variant_group 覆蓋
"""
import json, sys, os
from jsonschema import Draft202012Validator

BASE = os.path.dirname(os.path.abspath(__file__))
# 自包含：優先讀本地 schema 副本；不存在才 fallback 到 workspace（開發模式）
LOCAL_SCHEMA = os.path.join(BASE, "Oracle-Database-Schema-v0.1.json")
DEV_SCHEMA = os.path.join(BASE, "..", "..", "draw-one-oracle-framework-v01", "Oracle-Database-Schema-v0.1.json")
SCHEMA = LOCAL_SCHEMA if os.path.exists(LOCAL_SCHEMA) else DEV_SCHEMA
DATA = os.path.join(BASE, "data")

schema = json.load(open(SCHEMA, encoding="utf-8"))
print(f"使用 schema: {SCHEMA}")
defs = schema["$defs"]

ok, fail = [], []

def check(name, cond, detail=""):
    (ok if cond else fail).append(f"{name} {detail}".strip())

# 讀 JSONL
entities = {}
for fn in os.listdir(DATA):
    if fn.endswith(".jsonl"):
        name = fn[:-6]
        rows = [json.loads(l) for l in open(os.path.join(DATA, fn), encoding="utf-8") if l.strip()]
        entities[name] = rows

# 1. Schema 驗證（每行）——以「$defs + entity 定義」組 root，讓 $ref 解析
for name, rows in entities.items():
    entity_root = dict(defs[name])
    entity_root["$defs"] = defs
    validator = Draft202012Validator(entity_root)
    for i, row in enumerate(rows):
        errs = list(validator.iter_errors(row))
        check(f"schema.{name}[{i}]", not errs, "; ".join(e.message for e in errs[:3]))

# 2a. Trace：item 存在性
items = {r["item_id"]: r for r in entities["concrete_item"]}
sources = {r["source_id"]: r for r in entities["source_record"]}
for att in entities["attestation"]:
    check(f"trace.att.{att['attestation_id']}.item", att["item_id"] in items, f"→{att['item_id']}")
    check(f"trace.att.{att['attestation_id']}.slip",
          att["slip_id"] in {s["slip_id"] for s in entities["slip"]})
for it in entities["concrete_item"]:
    check(f"trace.item.{it['item_id']}.source", it["source_record_id"] in sources, f"→{it['source_record_id']}")
    check(f"trace.item.{it['item_id']}.group",
          it["independence_group_id"] in {g["group_id"] for g in entities["independence_group"]})
    check(f"trace.item.{it['item_id']}.family",
          it["family_id"] in {f["family_id"] for f in entities["edition_family"]})

# 2b. claim refs 全部存在
claims = {c["claim_id"]: c for c in entities["claim"]}
slips = {s["slip_id"] for s in entities["slip"]}
for c in claims.values():
    target_ok = False
    for name, rows in entities.items():
        if any(r.get(c["target_type"] + "_id") == c["target_id"] for r in rows if c["target_type"] + "_id" in r):
            target_ok = True
            break
    check(f"trace.claim.{c['claim_id']}.target", target_ok, f"→{c['target_type']}:{c['target_id']}")
for c in entities["corpus"]:
    for ref in c.get("identity_claim_ids", []) + c.get("origin_claim_ids", []):
        check(f"trace.corpus.claimref.{ref}", ref in claims)
for f in entities["edition_family"]:
    for ref in f.get("family_claim_ids", []):
        check(f"trace.family.claimref.{ref}", ref in claims)
for a in entities["temple_adoption"]:
    for ref in a.get("evidence_claim_ids", []):
        check(f"trace.adoption.claimref.{ref}", ref in claims)
# slip→corpus
corpora = {c["corpus_id"] for c in entities["corpus"]}
for s in entities["slip"]:
    check(f"trace.slip.{s['slip_id']}.corpus", s["corpus_id"] in corpora)

# 3. poem/commentary 分層
for att in entities["attestation"]:
    src = att["source_text"].replace("\n", "")
    for layer in att.get("commentary_layers", []):
        t = layer["text"].replace("／", "").replace(" ", "")
        # commentary 不得包含詩句；詩句不得出現在 commentary
        for line in src.replace("，", "").replace("。", ""):
            pass
        overlap = any(line in t for line in [src[i:i+7] for i in range(0, len(src)-6)])
        check(f"layering.{att['attestation_id']}.{layer['layer_name']}", not overlap,
              "commentary 含詩文片段" if overlap else "")
    # source_text 不含 commentary 特有詞
    for kw in ["廟公的話", "聖意", "討海", "卦頭", "籤解"]:
        check(f"layering.{att['attestation_id']}.no_{kw}", kw not in src)

# 4. #60 內外保留
att60 = [a for a in entities["attestation"] if a["attestation_id"] == "att-bg-060"][0]
check("norm.att-bg-060.內外", "內外用心再作福" in att60["source_text"], "（保留北港官方用字）")
check("norm.att-bg-060.not_戶內", "戶內" not in att60["source_text"])

# 5. UNKNOWN license
for it in entities["concrete_item"]:
    if it["item_id"].startswith("item-bg"):
        check(f"license.{it['item_id']}.unresolved", it.get("item_license_status") == "unresolved",
              f"={it.get('item_license_status')}")
        check(f"license.{it['item_id']}.access_open", it.get("access_status") == "open")

# 6. 無 secondary 升格
sec_srcs = {r["source_id"] for r in entities["source_record"] if r["type"] == "secondary"}
for c in claims.values():
    if c["edge_level"] == "VERIFIED":
        sec = [s for s in c.get("source_ids", []) if s in sec_srcs]
        check(f"noupgrade.claim.{c['claim_id']}", not sec, f"VERIFIED claim 引用 secondary {sec}")
# secondary attestation 不得被任何 VERIFIED text claim 支持
sec_items = {r["item_id"] for r in entities["concrete_item"] if r["source_record_id"] in sec_srcs}
sec_atts = {a["attestation_id"] for a in entities["attestation"] if a["item_id"] in sec_items}
for c in claims.values():
    if c["claim_type"] == "text_authenticity" and c["edge_level"] == "VERIFIED":
        check(f"noupgrade.text.{c['claim_id']}", c["target_id"] not in sec_atts)

# 7. 不 bulk
check("scope.slips", len(entities["slip"]) == 3, f"={len(entities['slip'])}")
check("scope.atts", len(entities["attestation"]) == 6, f"={len(entities['attestation'])}")
prim_atts = [a for a in entities["attestation"] if a["item_id"] in {i for i in items if items[i]["source_record_id"] not in sec_srcs}]
check("scope.primary_atts", len(prim_atts) == 3, f"={len(prim_atts)}")

# 7b. canonical text_status：北港 OCR → uncertain（未人工複核）；好廟網網頁複製 → verbatim_confirmed
for a in entities["attestation"]:
    if a["attestation_id"].startswith("att-bg-"):
        check(f"canonical.ts.{a['attestation_id']}.uncertain", a["text_status"] == "uncertain", f"={a['text_status']}")
    elif a["attestation_id"].startswith("att-hm-"):
        check(f"canonical.ts.{a['attestation_id']}.verbatim", a["text_status"] == "verbatim_confirmed", f"={a['text_status']}")

# 7c. canonical：source_record 皆含 content_class；group_claim_ids ≥1；VERIFIED claim 需 approval（schema allOf 已強制，這裡 double-check）
for r in entities["source_record"]:
    check(f"canonical.cc.{r['source_id']}", r.get("content_class") in ["original_source", "human_transcription", "ai_generated_or_summarized", "mixed_or_unknown"], f"={r.get('content_class')}")
for g in entities["independence_group"]:
    check(f"canonical.grp.{g['group_id']}", len(g.get("group_claim_ids", [])) >= 1, f"={g.get('group_claim_ids')}")
for c in claims.values():
    if c["edge_level"] == "VERIFIED":
        check(f"canonical.approval.{c['claim_id']}", c.get("approval") is not None and c.get("status") == "verified", "VERIFIED 需 approval + status=verified")

# 7d. text_authenticity：UNRESOLVED independence claim 不得充當獨立來源支持。
# probable 只能由一手 verbatim_confirmed，或至少兩個各自有
# VERIFIED/PROBABLE independence claim 的不同 group 支持；其餘必須保持 unresolved。
independence_support = {
    c["target_id"]
    for c in claims.values()
    if c["claim_type"] == "independence"
    and c["edge_level"] in {"VERIFIED", "PROBABLE"}
    and c.get("status") in {"verified", "probable"}
}
item_group = {i["item_id"]: i["independence_group_id"] for i in entities["concrete_item"]}
source_type = {s["source_id"]: s["type"] for s in entities["source_record"]}
for c in claims.values():
    if c["claim_type"] != "text_authenticity":
        continue
    target_atts = [a for a in entities["attestation"] if a["slip_id"] == c["target_id"]]
    valid_groups = {
        item_group[a["item_id"]]
        for a in target_atts
        if item_group.get(a["item_id"]) in independence_support
    }
    first_party_verbatim = any(
        a["text_status"] == "verbatim_confirmed"
        and source_type.get(next((i["source_record_id"] for i in entities["concrete_item"] if i["item_id"] == a["item_id"]), "")) == "primary"
        for a in target_atts
    )
    probable_basis = first_party_verbatim or len(valid_groups) >= 2
    check(
        f"canonical.text_threshold.{c['claim_id']}",
        c["edge_level"] != "PROBABLE" or probable_basis,
        f"PROBABLE without first-party verbatim or 2 supported groups (groups={sorted(valid_groups)})",
    )
    check(
        f"canonical.text_unresolved_group.{c['claim_id']}",
        c["edge_level"] != "PROBABLE" or len(valid_groups) >= 2 or first_party_verbatim,
        f"UNRESOLVED independence group counted as support (groups={sorted(valid_groups)})",
    )

# 8. variant_group 覆蓋
vgs = entities["variant_group"]
covered = {}
for vg in vgs:
    for aid in vg["attestation_ids"]:
        covered.setdefault(vg["slip_id"], set()).add(aid)
for att in entities["attestation"]:
    if att["slip_id"] in covered and att["attestation_id"] in covered[att["slip_id"]]:
        check(f"vg.cover.{att['attestation_id']}", True)
    else:
        check(f"vg.cover.{att['attestation_id']}", False, "未被 variant_group 覆蓋")
# 每 slip 的 attestation 數 ≥2 才有 variant_group 意義
for sid in slips:
    ats = [a for a in entities["attestation"] if a["slip_id"] == sid]
    check(f"vg.slip.{sid}.multi_att", len(ats) >= 2, f"={len(ats)}")

# 報告
print(f"\n✅ PASS {len(ok)} ｜ ❌ FAIL {len(fail)}")
for f in fail:
    print("  FAIL:", f)
if fail:
    sys.exit(1)
print("全部通過：3-slip pilot ingest 符合 Framework v0.1 schema 與本研究原則。")
