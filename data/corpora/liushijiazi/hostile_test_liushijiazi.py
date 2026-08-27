#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
hostile_test_liushijiazi.py — 福第三輪 hostile regression

場景：CANDIDATE 被手改 PROBABLE ＋ fake evidence source IDs ＋ 自報 mode=exact
期望：validator 必須 FAIL（A6 載入真實 evidence 重算後拆穿）。
對照組：真實 PROBABLE entry（未竄改）必須維持 PASS（重算 exact 成立）。
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
CORPUS_SRC = os.path.join(REPO, "data", "corpora", "liushijiazi")
VALIDATOR = os.path.join(CORPUS_SRC, "validate_liushijiazi_layer.py")

PASS_ALL = True


def check(name, cond, detail=""):
    global PASS_ALL
    print(f"  [{'PASS' if cond else 'FAIL'}] {name}" + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        PASS_ALL = False


def run_validator(layer_entries, layer_meta=None):
    """建 temp corpus dir，寫入竄改後的 layer，執行 validator，回傳 (exit_code, output)。"""
    tmp = tempfile.mkdtemp(prefix="hostile-lsjz-")
    d = os.path.join(tmp, "data", "corpora", "liushijiazi")
    os.makedirs(d, exist_ok=True)
    for fn in ["ocr_bg_2026-08-27.jsonl", "attestations.json", "slips.json", "source_texts.json"]:
        shutil.copy(os.path.join(CORPUS_SRC, fn), os.path.join(d, fn))
    layer = {"schema_version": "0.2", "corpus_id": "liushijiazi",
             "layer": "historical_interpretation",
             "edition": "北港朝天宮官方籤詩圖檔",
             "field_types": ["卦名", "五行方位", "聖意", "籤解", "卦運勢", "籤閣聖意"],
             "total_slips": 60, "total_entries": len(layer_entries),
             "entries": layer_entries, "status": "DRAFT"}
    with open(os.path.join(d, "interpretation_layer.json"), "w", encoding="utf-8") as f:
        json.dump(layer, f, ensure_ascii=False)
    with open(os.path.join(d, "source_texts.json"), "w", encoding="utf-8") as f:
        json.dump({}, f)  # source_texts 由 validator 另行載入 real evidence 用不到（A1 會用——哦 A1 需要真 source！）
    # 注意：A1 需要 source_texts（per-slip ocr_full）；從真實 repo copy
    src_real = json.load(open(os.path.join(CORPUS_SRC, "source_texts.json"), encoding="utf-8"))
    with open(os.path.join(d, "source_texts.json"), "w", encoding="utf-8") as f:
        json.dump(src_real, f, ensure_ascii=False)
    r = subprocess.run([sys.executable, VALIDATOR, tmp], capture_output=True, text=True, timeout=120)
    return r.returncode, (r.stdout + r.stderr)


def main():
    layer = json.load(open(os.path.join(CORPUS_SRC, "interpretation_layer.json"), encoding="utf-8"))
    entries = json.loads(json.dumps(layer["entries"]))  # deep copy

    print("== Control: 未竄改的真實 layer 必須 PASS ==")
    code, out = run_validator(entries)
    check("clean layer PASS（control）", code == 0)

    print("== Hostile A: CANDIDATE 手改 PROBABLE + fake evidence IDs + 自報 exact ==")
    h = json.loads(json.dumps(entries))
    target = next(e for e in h if e["slip_no"] == 1 and e["field_type"] == "卦名")  # CANDIDATE
    target["transcription_confidence"] = "PROBABLE"
    target["transcription_status"] = "PROBABLE"
    target["source_observation_status"] = "ocr_double_exact_agree"
    target["evidence_sources"] = ["ocr_a", "fake_ocr_b"]
    target["agreement"] = {"mode": "exact", "similarity": 1.0, "second_source": "fake_ocr_b"}
    target["unresolved_reason_code"] = None
    code, out = run_validator(h)
    check("手改 PROBABLE → validator FAIL", code == 1)
    check("FAIL 原因含 evidence 拆穿（未知 source 或重算 non_exact）",
          ("未知 evidence source" in out) or ("重算 agreement 非 exact" in out) or ("不符門檻" in out))
    # 更狠：fake source 換成合法 ID 但該欄位根本沒有 legacy layer
    target["evidence_sources"] = ["ocr_a", "study03_legacy"]
    target["agreement"] = {"mode": "exact", "similarity": 1.0, "second_source": "study03_legacy_ocr"}
    code, out = run_validator(h)
    check("合法 ID 但該欄位無真實 second observation → 仍 FAIL", code == 1)

    print("== Hostile B: 真 PROBABLE 被改一字（agreement 應崩）==")
    h2 = json.loads(json.dumps(entries))
    t2 = next(e for e in h2 if e["slip_no"] == 8 and e["field_type"] == "五行方位")  # 真 PROBABLE
    t2["verbatim_text"] = t2["verbatim_text"].replace("屬水利冬天", "屬水利冬天X")
    code, out = run_validator(h2)
    check("竄改 verbatim → 重算 non_exact → FAIL", code == 1)

    print("== Hostile C: duplicate evidence IDs ==")
    h3 = json.loads(json.dumps(entries))
    t3 = next(e for e in h3 if e["slip_no"] == 8 and e["field_type"] == "五行方位")
    t3["evidence_sources"] = ["ocr_a", "ocr_a"]
    t3["agreement"] = {"mode": "exact", "similarity": 1.0, "second_source": "ocr_a"}
    code, out = run_validator(h3)
    check("重複 source ID → FAIL", code == 1)

    print()
    if PASS_ALL:
        print("✅ HOSTILE REGRESSION ALL PASS — validator 不再相信自報 metadata")
        return 0
    print("❌ HOSTILE REGRESSION FAIL")
    return 1


if __name__ == "__main__":
    sys.exit(main())
