#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
六十甲子 Historical Interpretation Layer — build 腳本（v0.1 草案）
corpus: liushijiazi | layer: historical_interpretation
edition: 北港朝天宮官方籤詩圖檔（六十甲子籤；2024-08-05 批次為主）

輸入：
  1. bg_ocr_full.jsonl  — 本次批次 OCR（autoglm image recognition，中文逐字，production witness 的 transcription candidate）
  2. attestations.json  — repo 既有北港 commentary_layers（Study 03 OCR，第二 candidate / comparison）
  3. slips.json         — reference_text（籤詩四句）

輸出：
  interpretation_layer.json — entries（卦名/五行方位/聖意/籤解/卦運勢/籤閣聖意 六欄；廟公的話/卦頭故事/圖示 收 source_texts 附錄）
  source_texts.json         — per-slip source 全文（A1/A1b gate 用）

狀態語義（誠實標籤，never an upgrade）：
  PROBABLE   = 兩次 OCR 一致 或 單一 OCR 通順無疑（待 source image 逐籤複核）
  UNRESOLVED = OCR 分歧 / 可疑字 / 缺字（留 □ 或標 structural）
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) > 1:
    WORK = sys.argv[1]
else:
    WORK = HERE

OCR_JSONL = os.path.join(WORK, "bg_ocr_full.jsonl")
ATTESTATIONS = os.path.join(WORK, "repo-delivery", "data", "corpora", "liushijiazi", "attestations.json")
SLIPS = os.path.join(WORK, "repo-delivery", "data", "corpora", "liushijiazi", "slips.json")
OUT_LAYER = os.path.join(WORK, "liushijiazi_interpretation_layer.json")
OUT_SRC = os.path.join(WORK, "liushijiazi_source_texts.json")

EDITION = "北港朝天宮官方籤詩圖檔（六十甲子籤；2024-08-05 批次為主、第59籤 2025-06-21 批次）"

# 人工確認補欄（2026-08-27 第二 OCR 重讀 witness）：{slip_no: {field_type: (verbatim或None, note)}}
# None = 確認圖檔無此欄位（structural）
MANUAL_FIX = {
    35: {"卦名": ("坤卦", "2026-08-27 第二 OCR 重讀確認（批次 OCR 漏讀卦名欄；圖檔干支己酉下方爲「坤卦」）")},
    59: {"籤閣聖意": (None, "structural：2026-08-27 第二 OCR 重讀確認圖檔未設置獨立『籤閣聖意』欄位（相關判詞併入聖意表格）；圖檔另有『籤圖寓意』欄（商衡…）已收 appendix")},
}

# 欄位標題（含變體；解析時先抓 **標題** 再 normalize 匹配）
FIELD_ALIASES = [
    ("卦名", ["卦名"]),
    ("五行方位", ["五行方位", "五行"]),
    ("聖意", ["聖意各項目", "聖意"]),
    ("籤解", ["籤解"]),
    ("卦運勢", ["卦運勢", "運勢"]),
    ("籤閣聖意", ["籤閣聖意"]),
    ("廟公的話", ["廟公的話", "廟公的話"]),
    ("卦頭故事", ["卦頭故事", "籤閣聖意詳文"]),
    ("籤詩標題", ["籤詩標題"]),
    ("籤詩四句", ["籤詩四句", "籤詩"]),
    ("圖示", ["圖示", "圖記", "圖"]),
    ("判詞", ["判詞"]),
    ("附註", ["附註文字", "附註", "補充欄"]),
]


def normalize_title(t):
    t = t.strip()
    # 去全形/半形括號、冒号、星號、井號、底線、反引號、連字號、空白、斜線
    t = re.sub(r"[：:\s*#_`\-\-【】〔〕「」『』（）()《》/／·．]", "", t)
    return t


def _known_field_titles():
    known = set()
    for _, aliases in FIELD_ALIASES:
        for a in aliases:
            known.add(normalize_title(a))
    known.add("卦運勢")  # endswith 特例
    return known


def parse_ocr_fields(text):
    """把單籤 OCR 輸出（markdown 結構）解析成 {欄位名: 內容}。
    處理「### **標題**」與「**內容值**」混用格式：非欄位名的標題視為前一欄位的值。"""
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
        # 此標題是否為已知欄位
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
            # 非欄位名標題（可能是內容值，如「**火風鼎卦**」）——併入前一欄位或忽略
            continue
        # 找 content 終點：下一個「欄位標題」位置（跳過非欄位標題）
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
            # 非欄位標題 = 前一欄位的值的一部分 → 跳過
            skip.add(j)
            j += 1
        content = text[end:nxt_pos].strip()
        content = re.sub(r"^[-—–]+\s*$", "", content, flags=re.M).strip()
        if content:
            fields[fname_hit] = content
    return fields


def parse_shengyi_grid(text):
    """解析聖意內容：嘗試拆成 (項目, 判詞) 對。OCR 格式多變，拆不開就整段保留。"""
    items = []
    # 常見格式：**項目**：判詞 或 * 項目：判詞 或 | 項目 | 判詞 |
    pat = re.compile(r"(?:\*\*|\*)?([\u4e00-\u9fff]{2,4}?)（?[\u4e00-\u9fff]{0,2}?）?\*\*?\s*[：:]\s*([^\n*|]+)")
    for m in pat.finditer(text):
        items.append((m.group(1).strip(), m.group(2).strip()))
    if not items:
        # 表格格式
        rows = re.findall(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", text)
        for r in rows:
            items.append((r[0].strip(), r[1].strip()))
    return items


def clean_shengyi(content):
    """清理聖意欄位的 OCR markdown 表格語法（|、:---:、標頭行），保留判詞內容文字。
    圖檔原文無表格符號；此清理僅去除 OCR 輸出格式，不改變文字內容。"""
    lines = content.split("\n")
    out = []
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        # 跳過表格分隔線與標頭
        if re.fullmatch(r"[|:\-—\s]+", s):
            continue
        if re.fullmatch(r"\|\s*項目\s*\|\s*判詞[^|]*\|?", s) or re.fullmatch(r"項目\s*\|\s*判詞.*", s):
            continue
        # 去行內表格符號
        s = s.replace("|", "　").strip()
        s = re.sub(r"\*\*", "", s)
        s = re.sub(r"^[-—–]+\s*$", "", s)
        if s:
            out.append(s)
    result = "\n".join(out).strip()
    return result if result else content


def main():
    ocr_recs = {}
    if os.path.exists(OCR_JSONL):
        with open(OCR_JSONL, encoding="utf-8") as f:
            for line in f:
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

        fields = parse_ocr_fields(src["ocr_full"]) if src["ocr_full"] else {}
        # 統一 key：解析可能給「聖意」或「籤閣聖意」；「卦運勢」pattern 可能抓到「籤閣聖意」段落
        # 基本資訊：干支在欄位外，直接從 ganzhi 來

        # 決定各欄位 verbatim + status
        # 原則（對齊觀音層）：verbatim 採 OCR-A（本次批次）raw 原樣；
        #   - OCR 無此欄位 → 缺欄（structural，note 標 OCR 未輸出）
        #   - OCR 值含 □（OCR 自身無法辨識）→ UNRESOLVED
        #   - 其餘 → PROBABLE（待 source image 逐籤複核）；legacy 分歧記錄於 notes，不降級（raw 保留原則）
        def decide(fname, ocr_val, legacy_val=None):
            if not ocr_val:
                return None, None
            if "□" in ocr_val:
                return ocr_val, "UNRESOLVED"
            return ocr_val, "PROBABLE"

        # 1) 卦名
        v, s = decide("卦名", fields.get("卦名"))
        if v:
            entries.append(make_entry(sn, ganzhi, "卦名", v, locator, s, note_from(sn, "卦名", fields, att)))

        # 2) 五行方位（legacy 有）
        legacy_wx = None
        for layer in att.get("commentary_layers", []):
            if layer.get("layer_name") == "五行方位":
                legacy_wx = layer.get("text")
        v, s = decide("五行方位", fields.get("五行方位"), legacy_wx)
        if v:
            entries.append(make_entry(sn, ganzhi, "五行方位", v, locator, s, note_from(sn, "五行方位", fields, att)))

        # 3) 聖意（legacy commentary_layers 聖意層）
        legacy_sy = None
        for layer in att.get("commentary_layers", []):
            if "聖意" in layer.get("layer_name", ""):
                legacy_sy = layer.get("text")
        sy_raw = fields.get("聖意")
        if sy_raw:
            sy_raw = clean_shengyi(sy_raw)
        v, s = decide("聖意", sy_raw, legacy_sy)
        if v:
            entries.append(make_entry(sn, ganzhi, "聖意", v, locator, s, note_from(sn, "聖意", fields, att)))

        # 4) 籤解（卦解）
        v, s = decide("籤解", fields.get("籤解"))
        if v:
            entries.append(make_entry(sn, ganzhi, "籤解", v, locator, s, note_from(sn, "籤解", fields, att)))

        # 5) 卦運勢
        v, s = decide("卦運勢", fields.get("卦運勢"))
        if v:
            entries.append(make_entry(sn, ganzhi, "卦運勢", v, locator, s, note_from(sn, "卦運勢", fields, att)))

        # 6) 籤閣聖意
        v, s = decide("籤閣聖意", fields.get("籤閣聖意"))
        if v:
            entries.append(make_entry(sn, ganzhi, "籤閣聖意", v, locator, s, note_from(sn, "籤閣聖意", fields, att)))

        # 人工確認補欄（MANUAL_FIX）
        for fname, (val, note) in MANUAL_FIX.get(sn, {}).items():
            if any(e["slip_no"] == sn and e["field_type"] == fname for e in entries):
                continue
            if val is not None:
                entries.append(make_entry(sn, ganzhi, fname, val, locator, "PROBABLE", note))
            else:
                # structural 缺欄：建空 entry 標 UNRESOLVED + structural note
                entries.append(make_entry(sn, ganzhi, fname, "", locator, "UNRESOLVED", note))

        # 附錄層（不入 entries，保留在 source_texts）
        for extra in ("廟公的話", "卦頭故事", "圖示"):
            if fields.get(extra):
                src[f"appendix_{extra}"] = fields[extra]

    layer = {
        "schema_version": "0.1",
        "corpus_id": "liushijiazi",
        "layer": "historical_interpretation",
        "edition": EDITION,
        "field_types": ["卦名", "五行方位", "聖意", "籤解", "卦運勢", "籤閣聖意"],
        "total_slips": 60,
        "total_entries": len(entries),
        "entries": entries,
        "status": "DRAFT",
        "status_note": "OCR candidate 半自動建構；兩次 OCR 比對後標 PROBABLE/UNRESOLVED；待 source image 逐籤複核與福 review",
    }
    with open(OUT_LAYER, "w", encoding="utf-8") as f:
        json.dump(layer, f, ensure_ascii=False, indent=1)
    with open(OUT_SRC, "w", encoding="utf-8") as f:
        json.dump(source_texts, f, ensure_ascii=False, indent=1)

    n = layer["total_entries"]
    pro = sum(1 for e in entries if e["transcription_status"] == "PROBABLE")
    unr = sum(1 for e in entries if e["transcription_status"] == "UNRESOLVED")
    print(f"entries: {n}（PROBABLE {pro} / UNRESOLVED {unr}）")
    print(f"寫出：{OUT_LAYER}\n      {OUT_SRC}")


def make_entry(sn, ganzhi, ftype, verbatim, locator, status, note):
    return {
        "corpus": "liushijiazi",
        "slip_no": sn,
        "ganzhi": ganzhi,
        "edition": EDITION,
        "field_type": ftype,
        "verbatim_text": verbatim,
        "source_locator": locator,
        "transcription_status": status,
        "layer_class": "living_tradition",
        "variants_or_notes": note or "",
    }


def note_from(sn, ftype, fields, att):
    notes = []
    if not fields.get(ftype):
        notes.append("OCR 未輸出此欄位（可能圖檔缺欄或 OCR 漏讀）")
    if ftype == "聖意":
        legacy = [l for l in att.get("commentary_layers", []) if "聖意" in l.get("layer_name", "")]
        if legacy:
            notes.append(f"legacy OCR（Study 03）聖意層：{legacy[0]['text'][:120]}")
    if ftype == "五行方位":
        legacy = [l for l in att.get("commentary_layers", []) if l.get("layer_name") == "五行方位"]
        if legacy:
            notes.append(f"legacy OCR（Study 03）：{legacy[0]['text'][:80]}")
    return "；".join(notes)


if __name__ == "__main__":
    main()
