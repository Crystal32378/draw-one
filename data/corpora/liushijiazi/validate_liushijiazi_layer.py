#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""六十甲子 interpretation layer automated data gate（v0.3，福 re-gate 修正版）。

  A1  character coverage — verbatim 每個字必須在 per-slip source（OCR full）字元集內
  A1b segment trace     — 短欄位 ≥2 字片段必須是 per-slip source 的 substring（聖意直排亂序不適用，對齊觀音層）
  A2  cross-slip check  — 短欄位片段不得僅出現在他籤 source
  A3  uncertainty       — UNRESOLVED：textual_box 必含 □；structural_absent / ocr_anomaly 可無 □（reason code 標明）
  A4  structure         — 60 籤、每籤 6 筆、14 欄位齊全、layer_class 一致、confidence 合法值
  A5  encoding          — 無 U+FFFD / mojibake / 異常控制字符
  A6  evidence coherence — confidence 必須由「真實存在的 evidence」支撐（不信自報 metadata）：
                           validator 回頭載入 OCR-A jsonl 與 Study 03 attestations，重算 agreement；
                           source ID 必須真實存在、彼此不同；自報 mode 與重算不符 → FAIL— manual_image_confirmation=false ⇒ source_observation_status≠human_image_confirmed；
                           UNRESOLVED ⇒ unresolved_reason_code 必填且合法；PROBABLE ⇒ code=null
  A7  anomaly gate      — 已知 OCR 異常籤（OCR_ANOMALY 清單）不得標 PROBABLE

用法：python3 validate_liushijiazi_layer.py [repo_root]
exit 0 = PASS；exit 1 = FAIL
"""
import json
import os
import re
import sys
import unicodedata

if len(sys.argv) > 1:
    REPO = sys.argv[1]
else:
    HERE = os.path.dirname(os.path.abspath(__file__))
    if HERE.endswith("data/corpora/liushijiazi"):
        REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
    else:
        REPO = HERE
CORPUS = os.path.join(REPO, "data", "corpora", "liushijiazi")
LAYER = os.path.join(CORPUS, "interpretation_layer.json")
SRC = os.path.join(CORPUS, "source_texts.json")

PUNCT = set('。，、；：！？．·「」『』（）()□　「」【】*#-—_|:')
EXPECTED_FIELDS = ["卦名", "五行方位", "聖意", "籤解", "卦運勢", "籤閣聖意"]
REQ = ['corpus', 'slip_no', 'ganzhi', 'edition', 'field_type', 'verbatim_text',
       'source_locator', 'transcription_status', 'transcription_confidence',
       'source_observation_status', 'manual_image_confirmation', 'unresolved_reason_code',
       'layer_class', 'variants_or_notes',
       'evidence_sources', 'agreement']
VALID_CONF = {"PROBABLE", "CANDIDATE", "UNRESOLVED"}
VALID_OBS_ALL = {"ocr_single_pass", "ocr_recheck_single", "structural_absent",
                 "human_image_confirmed", "ocr_double_exact_agree"}
VALID_CODE = {"textual_box", "structural_absent", "ocr_anomaly", "parse_artifact"}

# 與 build 同步的已知 OCR 異常清單
OCR_ANOMALY = {
    3: {"卦名"},
    25: {"卦名"},
}


def normalize(s):
    m = {'為': '为', '換': '换', '緣': '缘', '達': '达', '顯': '显', '從': '从', '諸': '诸', '現': '现',
         '誠': '诚', '時': '时', '來': '来', '觀': '观', '報': '报', '與': '与', '飛': '飞', '萬': '万',
         '說': '说', '話': '话', '頭': '头', '長': '长', '門': '门', '過': '过', '邊': '边', '還': '还',
         '難': '难', '對': '对', '無': '无', '開': '开', '關': '关', '裡': '里', '後': '后', '會': '会',
         '動': '动', '發': '发', '風': '风', '龍': '龙', '鳳': '凤', '黃': '黄', '齊': '齐', '體': '体',
         '點': '点', '這': '这', '進': '进', '遠': '远', '處': '处', '讓': '让', '見': '见', '學': '学',
         '東': '东', '經': '经', '濟': '济', '統': '统', '結': '结', '構': '构', '計': '计', '設': '设',
         '實': '实', '驗': '验', '證': '证', '據': '据', '資': '资', '數': '数', '號': '号', '機': '机',
         '電': '电', '腦': '脑', '網': '网', '絡': '络', '態': '态', '區': '区', '別': '别', '國': '国',
         '際': '际', '權': '权', '繫': '系', '聯': '联', '歸': '归', '變': '变', '舊': '旧', '寧': '宁',
         '寫': '写', '讀': '读', '聞': '闻', '問': '问', '間': '间', '寶': '宝', '禱': '祷', '靈': '灵',
         '籤': '签', '廟': '庙', '應': '应', '議': '议', '訟': '讼', '財': '财', '禍': '祸', '祿': '禄',
         '親': '亲', '遲': '迟', '謀': '谋', '勝': '胜', '負': '负', '紙': '纸', '畫': '画', '馬': '马',
         '車': '车', '燈': '灯', '滅': '灭', '煙': '烟', '塵': '尘', '鄉': '乡', '靜': '静', '髙': '高',
         '冝': '宜'}
    # 注意：不把 裡/裏/里 互併（60 甲子層不涉及，但保持不併原則；此表只做繁簡標準字映射）
    return ''.join(m.get(ch, ch) for ch in s)


def strip_punct(s):
    return ''.join(ch for ch in s if ch not in PUNCT and not ch.isspace())


def has_mojibake(s):
    for ch in s:
        if ch == '\ufffd':
            return True
        if unicodedata.category(ch) == 'Cc' and ch not in '\n\r\t':
            return True
    return False


def load_real_evidence():
    """載入真實 OCR evidence（不信任何 entry 自報欄位）。"""
    ocr_a = {}
    p = os.path.join(CORPUS, "ocr_bg_2026-08-27.jsonl")
    if os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            try:
                r = json.loads(line)
                if r.get("status") == "ok":
                    ocr_a[r["slip_number"]] = True
            except Exception:
                pass
    legacy = {}
    p2 = os.path.join(CORPUS, "attestations.json")
    if os.path.exists(p2):
        for att in json.load(open(p2, encoding="utf-8")):
            if att.get("family_id") != "ed-beigang-chaotiangong":
                continue
            for layer in att.get("commentary_layers", []):
                nm = layer.get("layer_name", "")
                txt = layer.get("text") or ""
                if not txt.strip():
                    continue
                if nm == "五行方位":
                    legacy[(att["slip_number"], "五行方位")] = txt
                elif "聖意" in nm and "籤閣" not in nm:
                    legacy[(att["slip_number"], "聖意")] = txt
    return {"ocr_a": ocr_a, "legacy": legacy, "recheck_allowed": {35}}


def recompute_agreement(e, real):
    """validator 自己重算 agreement，並導出 second_source（綁真實 observation）。
    回傳 dict {mode, second_source}：
      second_source = "study03_legacy_ocr" 僅當該 (slip, field) 的 legacy layer 真實存在於 attestations；
      legacy 缺 → second_source=None（任何自報 second_source 都視為假）。"""
    sn, ft = e["slip_no"], e["field_type"]
    legacy = real["legacy"].get((sn, ft))
    if legacy is None:
        return {"mode": None, "second_source": None}
    import difflib as _d
    va = re.sub(r"\s+", "", e["verbatim_text"] or "")
    vb = re.sub(r"\s+", "", re.sub(r"[|:*#]", "", legacy))
    mode = "exact" if (va and va == vb) else "non_exact"
    _ = _d.SequenceMatcher(None, va, vb).ratio()  # similarity 僅供 audit（不作為升級依據）
    return {"mode": mode, "second_source": "study03_legacy_ocr"}


def recompute_second(e, real):
    """second observation 是否真實存在（供 evidence ID 檢查）。"""
    return real["legacy"].get((e["slip_no"], e["field_type"]))


def main():
    layer = json.load(open(LAYER, encoding="utf-8"))
    src = json.load(open(SRC, encoding="utf-8"))
    entries = layer["entries"]
    failures = []
    real = load_real_evidence()
    ctx = {"real_evidence": real}
    TRACE_FIELDS = ["卦名", "五行方位", "籤解", "卦運勢", "籤閣聖意"]

    # A4 結構
    slips = sorted(set(e["slip_no"] for e in entries))
    if slips != list(range(1, 61)):
        failures.append(("A4", "籤號不連續", str(slips[:8])))
    per_slip_fields = {}
    for e in entries:
        per_slip_fields.setdefault(e["slip_no"], []).append(e["field_type"])
    for n in range(1, 61):
        fs = per_slip_fields.get(n, [])
        missing = [f for f in EXPECTED_FIELDS if f not in fs]
        if missing:
            failures.append(("A4", f"#{n} 缺欄位", ",".join(missing)))
    for e in entries:
        for k in REQ:
            if k not in e:
                failures.append(("A4", f'#{e["slip_no"]} 缺欄位', k))
        if e.get("layer_class") != "living_tradition":
            failures.append(("A4", f'#{e["slip_no"]} layer_class 異常', e.get("layer_class")))
        if e.get("transcription_confidence") not in VALID_CONF:
            failures.append(("A4", f'#{e["slip_no"]} confidence 異常', e.get("transcription_confidence")))
        if e.get("source_observation_status") not in VALID_OBS_ALL:
            failures.append(("A4", f'#{e["slip_no"]} observation status 異常', e.get("source_observation_status")))
        if e.get("transcription_status") != e.get("transcription_confidence"):
            failures.append(("A4", f'#{e["slip_no"]} transcription_status 與 confidence 不一致', e.get("transcription_status")))

    # A5 encoding
    for e in entries:
        if has_mojibake(e["verbatim_text"]) or has_mojibake(e["variants_or_notes"] or ""):
            failures.append(("A5", f'#{e["slip_no"]} mojibake', repr(e["verbatim_text"][:20])))

    # A6 evidence coherence（v0.5：不信自報 metadata——回頭載入真實 evidence 重算）
    real = ctx["real_evidence"]
    for e in entries:
        obs = e.get("source_observation_status")
        conf = e.get("transcription_confidence")
        code = e.get("unresolved_reason_code")
        ag = e.get("agreement") or {}
        ev = e.get("evidence_sources") or []
        if obs not in VALID_OBS_ALL:
            failures.append(("A6", f'#{e["slip_no"]} observation status 異常', str(obs)))
            continue
        mic = e.get("manual_image_confirmation")
        if (mic is True) != (obs == "human_image_confirmed"):
            failures.append(("A6", f'#{e["slip_no"]} manual_image_confirmation 與 obs 矛盾', f'mic={mic} obs={obs}'))
        # evidence ID 合法性：真實存在、無重複、彼此不同
        if len(ev) != len(set(ev)):
            failures.append(("A6", f'#{e["slip_no"]} evidence_sources 重複', str(ev)))
        for sid in ev:
            if sid not in {"ocr_a", "study03_legacy", "recheck"}:
                failures.append(("A6", f'#{e["slip_no"]} 未知 evidence source ID', sid))
        if "ocr_a" in ev and e["slip_no"] not in real["ocr_a"]:
            failures.append(("A6", f'#{e["slip_no"]} 聲稱 ocr_a 但 OCR-A 無此籤記錄', ""))
        if "study03_legacy" in ev:
            if recompute_second(e, real) is None:
                failures.append(("A6", f'#{e["slip_no"]} 聲稱 study03_legacy 但實際無此欄位 legacy layer', e["field_type"]))
        if "recheck" in ev and e["slip_no"] not in real["recheck_allowed"]:
            failures.append(("A6", f'#{e["slip_no"]} 聲稱 recheck 但 recheck 僅存在於限定籤', f'#{e["slip_no"]} {e["field_type"]}'))
        # agreement 重算 + second_source 由 validator 導出（不信自報）
        recomputed = recompute_agreement(e, real)
        recomputed_mode = recomputed["mode"]
        recomputed_second = recomputed["second_source"]
        self_reported = ag.get("mode")
        self_second = ag.get("second_source")
        # second_source 綁真實 observation：
        #   自報存在但實際無 second observation → fake
        #   自報值 ≠ validator 導出值 → fake
        if self_second is not None and recomputed_second is None:
            failures.append(("A6", f'#{e["slip_no"]} second_source 無真實 observation 支撐',
                             f'self={self_second} recomputed={recomputed_second}'))
        elif self_second is not None and self_second != recomputed_second:
            failures.append(("A6", f'#{e["slip_no"]} second_source 與 validator 導出不符',
                             f'self={self_second} derived={recomputed_second}'))
        if self_second is None and conf == "PROBABLE":
            failures.append(("A6", f'#{e["slip_no"]} PROBABLE 缺 second_source', "second_source=None"))
        if self_second is not None and self_second not in {"study03_legacy_ocr"}:
            failures.append(("A6", f'#{e["slip_no"]} 未知 second_source 值', self_second))
        if conf == "PROBABLE":
            if recomputed_mode != "exact":
                failures.append(("A6", f'#{e["slip_no"]} PROBABLE 但重算 agreement 非 exact',
                                 f'recomputed={recomputed_mode} self={self_reported}'))
            if self_reported != "exact":
                failures.append(("A6", f'#{e["slip_no"]} 自報 mode 與重算不符', f'self={self_reported} recomputed={recomputed_mode}'))
            if obs != "ocr_double_exact_agree" or len(ev) < 2:
                failures.append(("A6", f'#{e["slip_no"]} PROBABLE 的 obs/evidence 不符門檻', f'obs={obs} ev={ev}'))
            if code is not None:
                failures.append(("A6", f'#{e["slip_no"]} PROBABLE 卻有 reason code', str(code)))
        elif conf == "CANDIDATE":
            if recomputed_mode == "exact" and obs in {"ocr_single_pass"}:
                failures.append(("A6", f'#{e["slip_no"]} 重算 exact 卻只給 CANDIDATE（evidence 足而未升）', e["field_type"]))
            if obs not in {"ocr_single_pass", "ocr_recheck_single"}:
                failures.append(("A6", f'#{e["slip_no"]} CANDIDATE 的 obs 不合法', str(obs)))
            if code is not None:
                failures.append(("A6", f'#{e["slip_no"]} CANDIDATE 卻有 reason code', str(code)))
        else:  # UNRESOLVED
            if code not in VALID_CODE:
                failures.append(("A6", f'#{e["slip_no"]} UNRESOLVED 缺/錯 reason code', str(code)))
            if code == "textual_box" and "□" not in e["verbatim_text"]:
                failures.append(("A6", f'#{e["slip_no"]} textual_box 但 verbatim 無 □', e["verbatim_text"][:20]))

    # A7 anomaly gate
    for sn, ftypes in OCR_ANOMALY.items():
        for ft in ftypes:
            e = next((x for x in entries if x["slip_no"] == sn and x["field_type"] == ft), None)
            if e is None:
                failures.append(("A7", f"#{sn} {ft} 缺 entry", ""))
                continue
            if e["transcription_confidence"] != "UNRESOLVED":
                failures.append(("A7", f"#{sn} {ft} 應 UNRESOLVED（OCR 異常）", e["transcription_confidence"]))
            if e["unresolved_reason_code"] != "ocr_anomaly":
                failures.append(("A7", f"#{sn} {ft} reason code 應 ocr_anomaly", str(e["unresolved_reason_code"])))

    # A1 / A1b / A2
    src_norm = {}
    for n, s in src.items():
        full = (s.get("ocr_full") or "") + (s.get("poem") or "")
        src_norm[int(n)] = normalize(strip_punct(full))
    for e in entries:
        n = e["slip_no"]
        vt = e["verbatim_text"]
        s = src_norm.get(n, "")
        vn = normalize(strip_punct(vt).replace("□", ""))
        source_chars = set(s)
        orphan = [ch for ch in set(vn) if ch not in source_chars]
        if orphan:
            failures.append(("A1", f'#{n} {e["field_type"]} 有字不在本籤 source 字元集', "".join(orphan)))
        if e["field_type"] in TRACE_FIELDS:
            for seg in re.split("[□。，、；：！？．·]", vn):
                if len(seg) >= 2 and seg not in s:
                    failures.append(("A1b", f'#{n} {e["field_type"]} 片段不在本籤 source', seg))
            if vn:
                for seg in re.split("[□。，、；：！？．·]", vn):
                    if len(seg) >= 4 and seg not in s:
                        others = [m for m, os_ in src_norm.items() if m != n and seg in os_]
                        if others:
                            failures.append(("A2", f'#{n} 片段疑來自他籤 {others}', seg))

    # 統計
    from collections import Counter
    print(f"總 entries {len(entries)}：confidence 分布", dict(Counter(e['transcription_confidence'] for e in entries)))
    for f in EXPECTED_FIELDS:
        cc = Counter(e["transcription_confidence"] for e in entries if e["field_type"] == f)
        print(f"  {f}: {dict(cc)}")

    if failures:
        print(f"\n❌ GATE FAIL — {len(failures)} 違規：")
        for a, where, detail in failures[:60]:
            print(f"  [{a}] {where}: {detail}")
        if len(failures) > 60:
            print(f"  ... 另 {len(failures) - 60} 筆")
        sys.exit(1)
    print("\n✅ GATE PASS — A1 / A1b / A2 / A3 / A4 / A5 / A6 / A7 全部通過")
    sys.exit(0)


if __name__ == "__main__":
    main()
