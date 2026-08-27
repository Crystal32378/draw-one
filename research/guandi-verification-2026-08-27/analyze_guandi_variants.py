#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
關帝 55 PROBABLE 籤 — 未確認句 variant 分析（OCR 差異 vs 真正 textual variant）

對每句未確認句：從 OCR-B（pdf-ocr）與 OCR-C（autoglm）全文找最接近片段（滑動視窗 2-gram），
輸出 OCR 實際讀到的字，與 wikisource 逐字對齊，分類差異：
  - shape_confusion  : 形近誤讀（OCR 把 A 讀成 B；wikisource 讀法在影像上未被 OCR 支持）
  - orthographic     : 異體字/繁簡（normalize 未覆蓋的變體）
  - missing          : OCR 漏字/折行（片段短於原句）
  - substantive      : 實質差異（無法歸因 OCR 誤讀；可能為真 variant 或需人工核對）
  - no_ocr_fragment  : OCR 完全沒讀到該句
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORK = sys.argv[1] if len(sys.argv) > 1 else HERE

B1 = os.path.join(WORK, "daozang_ocr_b1_combined.txt")
B2 = os.path.join(WORK, "daozang_ocr_b2_combined.txt")
AUTOGLM = os.path.join(WORK, "daozang_pages_autoglm.jsonl")
AUTOGLM2 = os.path.join(WORK, "daozang_pages_autoglm2.jsonl")
SLIPS = os.path.join(WORK, "repo-delivery", "data", "corpora", "guandi", "slip_texts.json")
REPORT = os.path.join(WORK, "guandi_verification_report_v3.json")
OUT = os.path.join(WORK, "guandi_variant_analysis.json")
OUT_MD = os.path.join(WORK, "guandi_variant_analysis.md")

sys.path.insert(0, HERE)
from verify_guandi_daozang2 import normalize, strip_punct, ngram_hit_rate

# 已知形近誤讀對（OCR 讀法 → 正確讀法）——從實際差異中歸納，僅供分類參考
KNOWN_SHAPE = {
    "曰": "日", "辦": "瓣", "婢": "嬋", "媮": "娟", "寃": "冤", "析": "祈",
    "圎": "圓", "冝": "宜", "髙": "高", "廻": "迴", "巳": "已", "覇": "霸",
    "䑕": "鼠", "亇": "個", "刦": "劫", "凟": "瀆", "慇": "殷", "悞": "誤",
    "慾": "欲", "懮": "憂", "曵": "曳", "桞": "柳", "梹": "檳", "樑": "梁",
    "氷": "冰", "畨": "番", "畵": "畫", "硯": "硯", "秆": "稈", "積": "積",
    "簷": "檐", "縁": "緣", "聡": "聰", "脩": "修", "舘": "館", "蒭": "芻",
    "蓮": "蓮", "薫": "薰", "虗": "虛", "蜨": "蝶", "蟬": "蟬", "詠": "咏",
    "誧": "捕", "説": "說", "踈": "疏", "迯": "逃", "邨": "村", "釡": "釜",
    "鎭": "鎮", "飮": "飲", "饑": "饑", "駡": "罵", "髙": "高", "黙": "默",
}


def parse_pages(paths):
    pages = {}
    for path in paths:
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            content = f.read()
        for block in content.split("===== PDF page "):
            block = block.strip()
            if not block:
                continue
            m = re.match(r"(\d+)\s*=====\s*(.*)", block, re.S)
            if m:
                pages[int(m.group(1))] = m.group(2).strip()
    return pages


def load_autoglm(paths):
    pages = {}
    for path in paths:
        if not os.path.exists(path):
            continue
        for line in open(path, encoding="utf-8"):
            try:
                r = json.loads(line)
                if r.get("status") == "ok":
                    pages[r["page"]] = r["ocr_text"]
            except Exception:
                pass
    return pages


def best_fragment(line, text, min_rate=0.5):
    """滑動視窗找最接近片段：回傳 (rate, fragment)"""
    ln = normalize(strip_punct(line))
    if not ln or not text:
        return 0.0, ""
    n = len(ln)
    best_rate = 0.0
    best_frag = ""
    # 視窗長度 = 原句長 ± 8
    for wlen in range(max(4, n - 8), n + 9):
        for i in range(0, max(1, len(text) - wlen + 1), 1):
            frag = text[i:i + wlen]
            rate = ngram_hit_rate(ln, frag)
            if rate > best_rate:
                best_rate = rate
                best_frag = frag
            if best_rate >= 0.95:
                return best_rate, best_frag
    return best_rate, best_frag


def align(a, b):
    """簡單貪婪對齊兩字串，回傳差異對清單（a=wikisource 字, b=OCR 字）"""
    diffs = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            i += 1
            j += 1
        elif i + 1 < len(a) and a[i + 1] == b[j]:
            diffs.append((a[i], "∅"))  # wikisource 多字（OCR 漏）
            i += 1
        elif j + 1 < len(b) and a[i] == b[j + 1]:
            diffs.append(("∅", b[j]))  # OCR 多字
            j += 1
        else:
            diffs.append((a[i], b[j]))
            i += 1
            j += 1
    while i < len(a):
        diffs.append((a[i], "∅"))
        i += 1
    while j < len(b):
        diffs.append(("∅", b[j]))
        j += 1
    return diffs


def classify(diffs):
    """分類差異：回傳 (main_class, detail)"""
    if not diffs:
        return "identical", ""
    real = [(x, y) for x, y in diffs if x != "∅" and y != "∅"]
    missing = sum(1 for x, y in diffs if y == "∅")
    extra = sum(1 for x, y in diffs if x == "∅")
    if not real:
        return "missing", f"OCR 漏字 {missing}／多字 {extra}（折行或欄位混排）"
    # 每個實質差異是否為形近/異體
    shape = []
    ortho = []
    subst = []
    for x, y in real:
        if x == y:
            continue
        if KNOWN_SHAPE.get(y) == x or KNOWN_SHAPE.get(x) == y:
            shape.append(f"{x}→{y}")
        elif len(x) == 1 and len(y) == 1 and (x in y or y in x):
            shape.append(f"{x}→{y}")
        else:
            subst.append(f"{x}→{y}")
    if subst and not shape and not ortho:
        return "substantive", "；".join(subst[:8])
    if subst:
        return "mixed", f"形近：{'；'.join(shape[:6])}；實質：{'；'.join(subst[:6])}"
    if shape:
        return "shape_confusion", "；".join(shape[:10])
    return "orthographic", "；".join(real[:10])


def main():
    pages_b = parse_pages([B1, B2])
    pages_c = load_autoglm([AUTOGLM, AUTOGLM2])
    print(f"OCR-B {len(pages_b)} 頁 / OCR-C {len(pages_c)} 頁")
    all_b = normalize(strip_punct("\n".join(pages_b.values())))
    all_c = normalize(strip_punct("\n".join(pages_c.values())))

    rep = json.load(open(REPORT, encoding="utf-8"))
    slips_doc = json.load(open(SLIPS, encoding="utf-8"))
    slips = {s["slip_number"]: s for s in slips_doc["slips"]}

    results = []
    for r in rep["results"]:
        if r["transcription_status"] != "PROBABLE":
            continue
        n = r["slip_number"]
        slip = slips.get(n, {})
        for line in r["lines"]:
            if line["hit_b"] or line["hit_c"]:
                continue
            ln = normalize(strip_punct(line["line"]))
            rate_b, frag_b = best_fragment(ln, all_b)
            rate_c, frag_c = best_fragment(ln, all_c)
            if rate_b >= rate_c:
                rate, frag, src = rate_b, frag_b, "OCR-B"
            else:
                rate, frag, src = rate_c, frag_c, "OCR-C"
            diffs = align(ln, frag) if frag else []
            # 分類修正：以 fragment 可信度分層（低 rate 的對齊不可靠，不當 variant 證據）
            real = [(x, y) for x, y in diffs if x != "∅" and y != "∅" and x != y]
            if rate >= 0.8 and len(real) <= 3:
                main_class = "candidate_variant"
                detail = f"{src} rate={rate:.2f}；候選差異：{'；'.join(f'{x}→{y}' for x, y in real)}"
            elif rate >= 0.7:
                main_class = "partial_fragment"
                detail = f"{src} rate={rate:.2f}；fragment 部分可信，差異僅參考：{'；'.join(f'{x}→{y}' for x, y in real[:6])}"
            else:
                main_class = "no_reliable_fragment"
                detail = f"{src} rate={rate:.2f}；OCR 未可靠讀到該句（直排打散/漏讀），需人工核對影像"
            results.append({
                "slip_number": n,
                "original_slip_label": slip.get("original_slip_label", ""),
                "line": line["line"],
                "norm_line": ln,
                "best_witness": src,
                "best_rate": round(rate, 3),
                "ocr_fragment": frag[:60],
                "diffs": diffs[:20],
                "class": main_class,
                "detail": detail,
            })

    # 統計
    from collections import Counter
    cnt = Counter(r["class"] for r in results)
    print("未確認句分類:", dict(cnt))
    by_slip = {}
    for r in results:
        by_slip.setdefault(r["slip_number"], []).append(r)
    print(f"涉及籤數: {len(by_slip)}")

    json.dump({"total_lines": len(results), "by_class": dict(cnt), "items": results},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# 關帝 55 PROBABLE 籤 — 未確認句 Variant 分析\n\n")
        f.write(f"- 未確認句總數：{len(results)}\n")
        f.write("- 分類統計：\n")
        for k, v in cnt.most_common():
            f.write(f"  - **{k}**: {v}\n")
        f.write("\n## 逐句明細\n\n")
        f.write("| # | 籤 | 句子 | 最佳 witness | 命中率 | 分類 | 差異 |\n|---|---|---|---|---|---|---|\n")
        for r in results:
            f.write(f"| {r['slip_number']} | {r['original_slip_label']} | {r['line'][:28]} | {r['best_witness']} | {r['best_rate']} | {r['class']} | {r['detail'][:40]} |\n")
    print(f"寫出：{OUT}\n      {OUT_MD}")


if __name__ == "__main__":
    main()
