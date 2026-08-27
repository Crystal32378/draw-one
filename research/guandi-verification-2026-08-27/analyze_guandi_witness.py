#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
關帝 VERIFIED 驗證 — 未雙命中句的 OCR 間分歧分析

對所有「未雙 witness 命中」的句子（VERIFIED 籤的單命中句 + PROBABLE 籤的未確認句）：
  1. 找最佳 fragment（b 與 c 各自最接近片段）
  2. 對 wikisource 句子做逐字對齊
  3. 分類：
     - dual_confirmed      : 雙 OCR 都命中（僅 VERIFIED 全雙籤會出現；這裡處理未雙句）
     - single_confirmed    : 單一 OCR 命中，另一 OCR 未讀到（漏讀/品質差）→ 單 witness 成立
     - ocr_divergence      : 單一 OCR 命中，另一 OCR 讀到不同字 → OCR 間分歧（需標記）
     - unconfirmed         : 兩 OCR 皆未命中 → PROBABLE 未確認句
  4. 對 ocr_divergence 進一步分類差異字（形近/異體/實質）
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
OUT = os.path.join(WORK, "guandi_witness_analysis.json")
OUT_MD = os.path.join(WORK, "guandi_witness_analysis.md")

sys.path.insert(0, HERE)
from verify_guandi_daozang2 import normalize, strip_punct, ngram_hit_rate


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


def best_fragment(line, text):
    ln = normalize(strip_punct(line))
    if not ln or not text:
        return 0.0, ""
    n = len(ln)
    best_rate = 0.0
    best_frag = ""
    for wlen in range(max(4, n - 10), n + 10):
        step = max(1, wlen // 8)
        for i in range(0, max(1, len(text) - wlen + 1), step):
            frag = text[i:i + wlen]
            rate = ngram_hit_rate(ln, frag)
            if rate > best_rate:
                best_rate = rate
                best_frag = frag
            if best_rate >= 0.95:
                return best_rate, best_frag
    return best_rate, best_frag


def align(a, b):
    diffs = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            i += 1
            j += 1
        elif i + 1 < len(a) and a[i + 1] == b[j]:
            diffs.append((a[i], "∅"))
            i += 1
        elif j + 1 < len(b) and a[i] == b[j + 1]:
            diffs.append(("∅", b[j]))
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


def main():
    pages_b = parse_pages([B1, B2])
    pages_c = load_autoglm([AUTOGLM, AUTOGLM2])
    all_b = normalize(strip_punct("\n".join(pages_b.values())))
    all_c = normalize(strip_punct("\n".join(pages_c.values())))
    print(f"OCR-B {len(pages_b)} 頁 / OCR-C {len(pages_c)} 頁")

    rep = json.load(open(REPORT, encoding="utf-8"))
    slips_doc = json.load(open(SLIPS, encoding="utf-8"))
    slips = {s["slip_number"]: s for s in slips_doc["slips"]}

    items = []
    for r in rep["results"]:
        n = r["slip_number"]
        slip = slips.get(n, {})
        for line in r["lines"]:
            hit_b, hit_c = line["hit_b"], line["hit_c"]
            if hit_b and hit_c:
                continue  # 只分析未雙命中句
            ln = normalize(strip_punct(line["line"]))
            rate_b, frag_b = best_fragment(ln, all_b)
            rate_c, frag_c = best_fragment(ln, all_c)
            # 分類
            if hit_b and not hit_c:
                # 檢查 c 讀到什麼：rate_c 高但 <0.9 = c 讀到近似的字（可能分歧）
                if rate_c >= 0.7:
                    diffs = align(ln, frag_c)
                    cls = "ocr_divergence"
                    detail = f"B 命中（{rate_b:.2f}）；C 讀近似（{rate_c:.2f}）：{'；'.join(f'{x}→{y}' for x, y in diffs[:8] if x != y)}"
                else:
                    cls = "single_confirmed"
                    detail = f"B 命中（{rate_b:.2f}）；C 未讀到（{rate_c:.2f}）"
            elif hit_c and not hit_b:
                if rate_b >= 0.7:
                    diffs = align(ln, frag_b)
                    cls = "ocr_divergence"
                    detail = f"C 命中（{rate_c:.2f}）；B 讀近似（{rate_b:.2f}）：{'；'.join(f'{x}→{y}' for x, y in diffs[:8] if x != y)}"
                else:
                    cls = "single_confirmed"
                    detail = f"C 命中（{rate_c:.2f}）；B 未讀到（{rate_b:.2f}）"
            else:
                cls = "unconfirmed"
                detail = f"B {rate_b:.2f} / C {rate_c:.2f}"
            items.append({
                "slip_number": n,
                "original_slip_label": slip.get("original_slip_label", ""),
                "slip_status": r["transcription_status"],
                "line": line["line"],
                "hit_b": hit_b,
                "hit_c": hit_c,
                "rate_b": round(rate_b, 3),
                "rate_c": round(rate_c, 3),
                "class": cls,
                "detail": detail,
            })

    from collections import Counter
    cnt = Counter(i["class"] for i in items)
    print("未雙命中句分類:", dict(cnt))
    by_slip_status = {}
    for i in items:
        by_slip_status.setdefault(i["slip_status"], Counter())[i["class"]] += 1
    print("by slip status:", {k: dict(v) for k, v in by_slip_status.items()})

    json.dump({"total": len(items), "by_class": dict(cnt), "items": items},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# 關帝 VERIFIED 驗證 — 未雙命中句分析\n\n")
        f.write(f"- 未雙命中句總數：{len(items)}\n")
        f.write("- 分類統計：\n")
        for k, v in cnt.most_common():
            f.write(f"  - **{k}**: {v}\n")
        f.write("\n## 逐句明細\n\n")
        f.write("| # | 籤 | 狀態 | 句子 | B | C | 分類 | 說明 |\n|---|---|---|---|---|---|---|---|\n")
        for i in items:
            f.write(f"| {i['slip_number']} | {i['original_slip_label']} | {i['slip_status']} | {i['line'][:24]} | {i['rate_b']} | {i['rate_c']} | {i['class']} | {i['detail'][:60]} |\n")
    print(f"寫出：{OUT}\n      {OUT_MD}")


if __name__ == "__main__":
    main()
