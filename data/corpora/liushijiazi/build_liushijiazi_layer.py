#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
六十甲子 Historical Interpretation Layer — build 腳本（v0.4，evidence-driven confidence）
corpus: liushijiazi | layer: historical_interpretation
edition: 北港朝天宮官方籤詩圖檔（2024-08-05 批次為主、第59籤 2025-06-21 批次）

v0.4 變更（福第二輪 re-review）：PROBABLE 只能由「雙 OCR pass、normalize 後 exact 相等」的程式可驗證 agreement 產生；
單次 OCR 一律 CANDIDATE（更弱 candidate status）；secondary observation 來源＝Study 03 legacy commentary_layers（同一官方影像的另一條 transcription path）；
agreement 以 exact-match 為唯一自動升級路徑，diff 相似度僅存檔供人工審查，不作為 gate 依據。

v0.3 變更（福 re-gate 2026-08-27）：
  1. confidence 拆四欄（名實相符）：
     - source_observation_status : 觀察途徑（ocr_single_pass / ocr_recheck / structural_absent / human_image_confirmed）
     - transcription_confidence  : PROBABLE / UNRESOLVED（summary 用；transcription_status 保留為同義）
     - manual_image_confirmation : bool（是否人類直接核圖；目前全 false，不假裝）
     - unresolved_reason_code    : textual_box / structural_absent / ocr_anomaly / parse_artifact / null
  2. 所有欄位 verbatim 去 markdown 殘留（** / ### / | 等），不只聖意
  3. 已知 OCR 異常籤（#3 天水註卦、#25 浮山咸卦）標 unresolved_reason_code=ocr_anomaly，
     不因「沒有 □」就 PROBABLE
  4. #35 provenance 如實：source_observation_status=ocr_recheck（第二 OCR 重讀），
     manual_image_confirmation=false（非人類核圖）

輸入（repo clean checkout 相對路徑）：
  <repo>/data/corpora/liushijiazi/ocr_bg_2026-08-27.jsonl  （OCR-A 原始輸出）
  <repo>/data/corpora/liushijiazi/attestations.json          （legacy OCR-B comparison）
  <repo>/data/corpora/liushijiazi/slips.json                 （reference_text）

輸出（寫入 <repo>/data/corpora/liushijiazi/）：
  interpretation_layer.json   （entries，schema v0.2）
  source_texts.json           （per-slip source）
"""
import json
import os
import re
import sys

REPO = None
if len(sys.argv) > 1:
    REPO = sys.argv[1]
else:
    # 預設：本檔所在 repo（data/corpora/liushijiazi/ 的上一層上兩層）
    HERE = os.path.dirname(os.path.abspath(__file__))
    if HERE.endswith("data/corpora/liushijiazi"):
        REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
    else:
        REPO = HERE

CORPUS_DIR = os.path.join(REPO, "data", "corpora", "liushijiazi")
OCR_JSONL = os.path.join(CORPUS_DIR, "ocr_bg_2026-08-27.jsonl")
ATTESTATIONS = os.path.join(CORPUS_DIR, "attestations.json")
SLIPS = os.path.join(CORPUS_DIR, "slips.json")
OUT_LAYER = os.path.join(CORPUS_DIR, "interpretation_layer.json")
OUT_SRC = os.path.join(CORPUS_DIR, "source_texts.json")

EDITION = "北港朝天宮官方籤詩圖檔（六十甲子籤；2024-08-05 批次為主、第59籤 2025-06-21 批次）"

# 人工確認補欄（2026-08-27 第二 OCR 重讀＝recheck pass）：{slip_no: {field_type: (verbatim或None, note)}}
# 注意：recheck 是另一條 OCR transcription path（非人類核圖）；「坤卦」由 recheck 首度取得，
# 屬 single recheck observation → CANDIDATE 級；僅當未來再有 pass 確認相同讀法才可升
# None = 確認圖檔無此欄位（structural）
MANUAL_FIX = {
    35: {"卦名": ("坤卦", "2026-08-27 第二 OCR 重讀（非人類核圖）：批次 OCR 漏讀卦名欄；圖檔干支己酉下方爲「坤卦」。manual_image_confirmation=false")},
    59: {"籤閣聖意": (None, "structural：2026-08-27 第二 OCR 重讀確認圖檔未設置獨立『籤閣聖意』欄位（相關判詞併入聖意表格）；圖檔另有『籤圖寓意』欄（商衡…）已收 appendix")},
}

# 已知 OCR 異常（形近誤讀候選，依鐵律不猜字 → 標 UNRESOLVED + ocr_anomaly，待人工核圖）
OCR_ANOMALY = {
    3: {"卦名": "「天水註卦」疑「天水訟卦」形近誤讀（註/訟）；不猜字，待核圖"},
    25: {"卦名": "「浮山咸卦」疑「澤山咸卦」形近誤讀（浮/澤）；不猜字，待核圖"},
}

# 欄位標題（含變體）
FIELD_ALIASES = [
    ("卦名", ["卦名"]),
    ("五行方位", ["五行方位", "五行"]),
    ("聖意", ["聖意各項目", "聖意"]),
    ("籤解", ["籤解"]),
    ("卦運勢", ["卦運勢", "運勢"]),
    ("籤閣聖意", ["籤閣聖意"]),
    ("廟公的話", ["廟公的話"]),
    ("卦頭故事", ["卦頭故事", "籤閣聖意詳文"]),
    ("籤詩標題", ["籤詩標題"]),
    ("籤詩四句", ["籤詩四句", "籤詩"]),
    ("圖示", ["圖示", "圖記", "圖"]),
    ("判詞", ["判詞"]),
    ("附註", ["附註文字", "附註", "補充欄"]),
]


def normalize_title(t):
    t = t.strip()
    t = re.sub(r"[：:\s*#_`\-\-【】〔〕「」『』（）()《》/／·．]", "", t)
    return t


def _known_field_titles():
    known = set()
    for _, aliases in FIELD_ALIASES:
        for a in aliases:
            known.add(normalize_title(a))
    known.add("卦運勢")
    return known


def clean_markdown(content):
    """去 markdown 殘留（** / ### / | 表格語法 / 分隔線），保留文字內容。"""
    lines = content.split("\n")
    out = []
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        if re.fullmatch(r"[|:#\-\—\s]+", s):
            continue
        if re.fullmatch(r"\|?\s*項目\s*\|?\s*判詞[^|]*\|?", s) or re.fullmatch(r"項目\s*\|?\s*判詞.*", s):
            continue
        s = s.replace("|", "　").strip()
        s = re.sub(r"\*{1,3}", "", s)
        s = re.sub(r"#{1,6}", "", s)
        s = re.sub(r"^[-—–]+\s*$", "", s)
        s = re.sub(r"\s+", " ", s)
        if s:
            out.append(s)
    result = "\n".join(out).strip()
    return result if result else content


def parse_ocr_fields(text):
    fields = {}
    KNOWN = _known_field_titles()
    heads = []
    for m in re.finditer(r"\*\s*\*\s*([^*\n]{1,24}?)\s*[：:]?\s*\*\s*\*", text):
        heads.append((m.start(), m.end(), m.group(1)))
    if not heads:
        return fields
    skip = set()
    for i, (start, end, title) in enumerate(heads):
        if i in skip:
            continue
        tn = normalize_title(title)
        if not tn:
            continue
        is_field = False
        fname_hit = None
        for fname, aliases in FIELD_ALIASES:
            for a in aliases:
                na = normalize_title(a)
                if tn == na or tn.startswith(na) or (fname == "卦運勢" and tn.endswith("卦運勢")):
                    is_field = True
                    fname_hit = fname
                    break
            if is_field:
                break
        if not is_field:
            continue
        j = i + 1
        nxt_pos = len(text)
        while j < len(heads):
            if j in skip:
                j += 1
                continue
            nt = normalize_title(heads[j][2])
            n_is_field = False
            for fname2, aliases2 in FIELD_ALIASES:
                for a2 in aliases2:
                    na2 = normalize_title(a2)
                    if nt == na2 or nt.startswith(na2) or (fname2 == "卦運勢" and nt.endswith("卦運勢")):
                        n_is_field = True
                        break
                if n_is_field:
                    break
            if n_is_field:
                nxt_pos = heads[j][0]
                break
            skip.add(j)
            j += 1
        content = text[end:nxt_pos].strip()
        content = re.sub(r"^[-—–]+\s*$", "", content, flags=re.M).strip()
        if content:
            fields[fname_hit] = content
    return fields


import difflib


def compute_agreement(verbatim_field, second_obs_text):
    """程式可驗證 agreement：第二條 OCR pass 的同欄位轉錄 vs 本次 verbatim。
    唯一自動升級路徑 = normalize 後 exact 相等。diff 相似度僅存檔供人工審查。"""
    if not second_obs_text:
        return None
    va = re.sub(r"\s+", "", verbatim_field or "")
    vb = re.sub(r"\s+", "", re.sub(r"[|:*#]", "", second_obs_text))
    mode = None
    sim = round(difflib.SequenceMatcher(None, va, vb).ratio(), 3)
    if va and va == vb:
        mode = "exact"
    return {"mode": mode, "similarity": sim,
            "basis": "normalized-exact-equality only；similarity 僅供 audit",
            "second_source": "study03_legacy_ocr"}


def make_entry(sn, ganzhi, ftype, verbatim, locator, obs_status, confidence, unresolved_code, note,
               evidence_sources=None, agreement=None):
    ev = evidence_sources or ["ocr_a"]
    entry = {
        "corpus": "liushijiazi",
        "slip_no": sn,
        "ganzhi": ganzhi,
        "edition": EDITION,
        "field_type": ftype,
        "verbatim_text": verbatim,
        "source_locator": locator,
        "transcription_status": confidence,
        "transcription_confidence": confidence,
        "source_observation_status": obs_status,
        "manual_image_confirmation": False,
        "unresolved_reason_code": unresolved_code,
        "layer_class": "living_tradition",
        "variants_or_notes": note or "",
        "evidence_sources": ev,
        "agreement": agreement,
    }
    return entry



    return {
        "corpus": "liushijiazi",
        "slip_no": sn,
        "ganzhi": ganzhi,
        "edition": EDITION,
        "field_type": ftype,
        "verbatim_text": verbatim,
        "source_locator": locator,
        "transcription_status": confidence,  # summary（與 transcription_confidence 同值）
        "transcription_confidence": confidence,
        "source_observation_status": obs_status,
        "manual_image_confirmation": False,
        "unresolved_reason_code": unresolved_code,
        "layer_class": "living_tradition",
        "variants_or_notes": note or "",
    }


def note_from(sn, ftype, fields, att):
    notes = []
    if not fields.get(ftype):
        notes.append("OCR 未輸出此欄位")
    if ftype == "聖意":
        legacy = [l for l in att.get("commentary_layers", []) if "聖意" in l.get("layer_name", "")]
        if legacy:
            notes.append(f"legacy OCR（Study 03）聖意層：{legacy[0]['text'][:120]}")
    if ftype == "五行方位":
        legacy = [l for l in att.get("commentary_layers", []) if l.get("layer_name") == "五行方位"]
        if legacy:
            notes.append(f"legacy OCR（Study 03）：{legacy[0]['text'][:80]}")
    return "；".join(notes)


def main():
    if not os.path.exists(OCR_JSONL):
        print(f"❌ 找不到 OCR 輸入：{OCR_JSONL}")
        print("   clean checkout 需先有 ocr_bg_2026-08-27.jsonl（見 research/liushijiazi-ocr/ 產出說明）")
        sys.exit(1)

    ocr_recs = {}
    for line in open(OCR_JSONL, encoding="utf-8"):
        try:
            rec = json.loads(line)
            if rec.get("status") == "ok":
                ocr_recs[rec["slip_number"]] = rec
        except Exception:
            pass
    print(f"OCR records: {len(ocr_recs)}/60")

    with open(ATTESTATIONS, encoding="utf-8") as f:
        atts = json.load(f)
    bg_atts = {x["slip_number"]: x for x in atts if x.get("family_id") == "ed-beigang-chaotiangong"}
    with open(SLIPS, encoding="utf-8") as f:
        slips = {x["slip_number"]: x for x in json.load(f)}

    entries = []
    source_texts = {}

    for sn in range(1, 61):
        ocr = ocr_recs.get(sn)
        att = bg_atts.get(sn, {})
        slip = slips.get(sn, {})
        ganzhi = att.get("numbering_in_source") or slip.get("ganzhi", {}).get("beigang_official_list") or f"#{sn}"
        url = att.get("item_url", "")
        locator = f"北港朝天宮官網圖檔（slip #{sn} {ganzhi}）<{url}>"

        src = {
            "slip_no": sn,
            "ganzhi": ganzhi,
            "poem": slip.get("reference_text", ""),
            "ocr_full": ocr.get("ocr_text", "") if ocr else "",
            "legacy_layers": att.get("commentary_layers", []),
            "legacy_fortune": att.get("fortune_in_source", ""),
            "item_url": url,
        }
        source_texts[sn] = src

        fields = {k: clean_markdown(v) for k, v in parse_ocr_fields(src["ocr_full"]).items()} if src["ocr_full"] else {}

        def resolve(fname, ocr_val, legacy_text=None, is_recheck=False):
            """evidence-driven status（福第二輪）：回傳 (obs, conf, code, evidence_sources, agreement, note)
            - anomaly / □ → UNRESOLVED
            - 雙 pass exact agreement → PROBABLE / ocr_double_exact_agree
            - 單觀察 → CANDIDATE / ocr_single_pass 或 ocr_recheck_single
            """
            if fname in OCR_ANOMALY.get(sn, {}):
                return ("ocr_single_pass", "UNRESOLVED", "ocr_anomaly",
                        ["ocr_a"], None, OCR_ANOMALY[sn][fname])
            if ocr_val is None:
                return (None, None, None, None, None, None)
            if "□" in ocr_val:
                return ("ocr_single_pass", "UNRESOLVED", "textual_box", ["ocr_a"], None, "")
            ag = compute_agreement(ocr_val, legacy_text)
            if ag and ag["mode"] == "exact":
                return ("ocr_double_exact_agree", "PROBABLE", None,
                        ["ocr_a", "study03_legacy"], ag, "")
            if is_recheck:
                return ("ocr_recheck_single", "CANDIDATE", None,
                        ["ocr_a", "recheck"], ag, "")
            return ("ocr_single_pass", "CANDIDATE", None, ["ocr_a"], ag, "")

        def legacy_text_for(ftype):
            for layer in att.get("commentary_layers", []):
                ln_ = layer.get("layer_name", "")
                if ftype == "五行方位" and ln_ == "五行方位":
                    return layer.get("text")
                if ftype == "聖意" and "聖意" in ln_ and "籤閣" not in ln_:
                    return layer.get("text")
            return None

        # 1) 卦名（無 second observation 來源）
        v = fields.get("卦名")
        obs, conf, code, ev_, ag_, nt_ = resolve("卦名", v)
        if v:
            note = (nt_ + "；" + note_from(sn, "卦名", fields, att)).strip("；")
            entries.append(make_entry(sn, ganzhi, "卦名", v, locator, obs, conf, code, note, ev_, ag_))

        # 2) 五行方位（legacy 為 secondary pass）
        v = fields.get("五行方位")
        obs, conf, code, ev_, ag_, nt_ = resolve("五行方位", v, legacy_text_for("五行方位"))
        if v:
            entries.append(make_entry(sn, ganzhi, "五行方位", v, locator, obs, conf, code,
                                      (nt_ + "；" + note_from(sn, "五行方位", fields, att)).strip("；"), ev_, ag_))

        # 3) 聖意（legacy 為 secondary pass）
        v = fields.get("聖意")
        obs, conf, code, ev_, ag_, nt_ = resolve("聖意", v, legacy_text_for("聖意"))
        if v:
            entries.append(make_entry(sn, ganzhi, "聖意", v, locator, obs, conf, code,
                                      (nt_ + "；" + note_from(sn, "聖意", fields, att)).strip("；"), ev_, ag_))

        # 4) 籤解（無 second）
        v = fields.get("籤解")
        obs, conf, code, ev_, ag_, nt_ = resolve("籤解", v)
        if v:
            entries.append(make_entry(sn, ganzhi, "籤解", v, locator, obs, conf, code,
                                      (nt_ + "；" + note_from(sn, "籤解", fields, att)).strip("；"), ev_, ag_))

        # 5) 卦運勢（無 second）
        v = fields.get("卦運勢")
        obs, conf, code, ev_, ag_, nt_ = resolve("卦運勢", v)
        if v:
            entries.append(make_entry(sn, ganzhi, "卦運勢", v, locator, obs, conf, code,
                                      (nt_ + "；" + note_from(sn, "卦運勢", fields, att)).strip("；"), ev_, ag_))

        # 6) 籤閣聖意（無 second）
        v = fields.get("籤閣聖意")
        obs, conf, code, ev_, ag_, nt_ = resolve("籤閣聖意", v)
        if v:
            entries.append(make_entry(sn, ganzhi, "籤閣聖意", v, locator, obs, conf, code,
                                      (nt_ + "；" + note_from(sn, "籤閣聖意", fields, att)).strip("；"), ev_, ag_))

        # 人工確認補欄（MANUAL_FIX）：recheck = 另一條 OCR path 的單次觀察 → CANDIDATE（誠實，不因重讀升級）
        for fname, (val, note) in MANUAL_FIX.get(sn, {}).items():
            if any(e["slip_no"] == sn and e["field_type"] == fname for e in entries):
                continue
            if val is not None:
                entries.append(make_entry(sn, ganzhi, fname, val, locator, "ocr_recheck_single",
                                          "CANDIDATE", None, note, ["recheck"], None))
            else:
                entries.append(make_entry(sn, ganzhi, fname, "", locator, "structural_absent",
                                          "UNRESOLVED", "structural_absent", note, [], None))

        # 附錄層
        for extra in ("廟公的話", "卦頭故事", "圖示", "判詞", "附註"):
            if fields.get(extra):
                src[f"appendix_{extra}"] = fields[extra]

    layer = {
        "schema_version": "0.2",
        "corpus_id": "liushijiazi",
        "layer": "historical_interpretation",
        "edition": EDITION,
        "field_types": ["卦名", "五行方位", "聖意", "籤解", "卦運勢", "籤閣聖意"],
        "confidence_fields": {
            "transcription_confidence": ["PROBABLE", "UNRESOLVED"],
            "source_observation_status": ["ocr_single_pass", "ocr_recheck", "structural_absent", "human_image_confirmed"],
            "manual_image_confirmation": "boolean（true = 人類直接核圖；2026-08-27 全 false）",
            "unresolved_reason_code": ["textual_box", "structural_absent", "ocr_anomaly", "parse_artifact", None],
        },
        "total_slips": 60,
        "total_entries": len(entries),
        "entries": entries,
        "status": "DRAFT",
        "status_note": "福 re-gate 修正版（2026-08-27）：confidence 拆四欄、markdown 清理、OCR 異常標記；manual_image_confirmation 全 false；待福 re-review",
    }
    with open(OUT_LAYER, "w", encoding="utf-8") as f:
        json.dump(layer, f, ensure_ascii=False, indent=1)
    with open(OUT_SRC, "w", encoding="utf-8") as f:
        json.dump(source_texts, f, ensure_ascii=False, indent=1)

    from collections import Counter
    cnt = Counter(e["transcription_confidence"] for e in entries)
    obs = Counter(e["source_observation_status"] for e in entries)
    agrees = sum(1 for e in entries if e.get("agreement") and e["agreement"].get("mode") == "exact")
    print(f"entries: {len(entries)}（confidence: {dict(cnt)}）")
    print(f"observation: {dict(obs)}")
    print(f"exact double-agreements: {agrees}")
    print(f"寫出：{OUT_LAYER}\n      {OUT_SRC}")


if __name__ == "__main__":
    main()
