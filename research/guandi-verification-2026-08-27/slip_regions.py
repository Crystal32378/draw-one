#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
slip_regions.py — 道藏 PDF OCR 文字的 slip-region segmentation（福第二輪 re-review 要求）

目的：同一頁可能有兩支籤（如 p15 = #4/#5）。matching 不能再用整頁文字，
     必須切出「每支籤自己的 region」，使 neighboring slip text cannot satisfy
     current slip evidence。

方法（deterministic、fail-closed）：
  1. 逐行找籤序 marker：整行幾乎只是「第N」（允許 markdown/括號裝飾），
     且 N ∈ 1..100。一行含多個不同編號 → ambiguous，整行丟棄（不入任何 region）。
  2. marker 出現後，直到「下一個可辨識 marker」之前的行，歸屬該 marker 的籤
     （依實測：兩條 transcription path 都是 heading 在其內容之前）。
  3. 首個 marker 之前的行＝跨頁殘餘／上一籤尾巴 → unassigned，不歸任何人。
  4. 同一編號在同一頁重複出現 → 本頁該籤視為無法切割（drop，fail closed）。
  5. 某籤在某頁沒有自己的 marker（OCR 漏讀標題）→ 該頁對該籤不提供 region
     （match 不得借用鄰籤或全頁）。

介面：
  segment_page(text) -> {"regions": {slip_no: raw_region_text},
                         "unassigned_chars": int,
                         "dropped_conflicts": [...],
                         "markers": [...]}
"""

import re

_CN = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7,
       '八': 8, '九': 9, '廿': 20, '卅': 30}


def _cn_to_int(s):
    if not s:
        return None
    if '百' in s:
        rest = s.replace('百', '')
        if not rest:
            return 100
        return None  # 一百零一式編號未出現
    if '十' in s:
        parts = s.split('十')
        tens = (_CN.get(parts[0], 0) or 0) * 10 if parts[0] else 10
        ones = _CN.get(parts[1], 0) if parts[1] else 0
        return tens + ones
    return _CN.get(s)


_MARK = re.compile(
    r"^[\s\*#\[\]\(\)（）【】〔〕{}<>《》「」『』'\"：:，,、·．.\-—–~=]*"
    r"第\s*([一二三四五六七八九十百廿卅]{1,4})\s*"
    r"[\s\*#\[\]\(\)（）【】〔〕{}<>《》「」『』'\"：:，,、·．.\-—–~=]*$"
)

_DECO_STRIP = re.compile(r"[\s\*#\[\]\(\)（）【】〔〕{}<>《》「」『』'\"：:，,、·．.\-—–~=&|>＜]")


def _is_marker_line(line):
    core = _DECO_STRIP.sub('', line.strip())
    m = re.fullmatch(r"第[一二三四五六七八九十百廿卅]{1,4}", core)
    if not m:
        return None
    return _cn_to_int(core[1:])


def _iter_files(paths):
    for path in paths:
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                yield f.read()


def segment_page(text):
    """分割單頁 OCR 文字。"""
    lines = text.split('\n')
    regions = {}
    conflicts = []
    cur_num = None
    buf = []
    unassigned = []
    seen = {}
    markers_seen = []

    def flush():
        nonlocal cur_num, buf
        if cur_num is not None:
            t = '\n'.join(buf).strip()
            if t:
                regions.setdefault(cur_num, []).append(t)
            else:
                regions.setdefault(cur_num, [])
        buf = []

    for ln in lines:
        num = _is_marker_line(ln)
        if num is not None:
            flush()
            if num in seen.values():
                conflicts.append(num)
                cur_num = None  # 衝突：放棄後續歸屬（fail closed）
                continue
            seen[num] = True
            cur_num = num
            markers_seen.append((num, len(text)))
        else:
            if cur_num is not None:
                buf.append(ln)
            else:
                unassigned.append(ln)

    flush()  # ← 修：最後一個 bucket 收尾

    out = {k: ('\n'.join(v)).strip() for k, v in regions.items()}
    unassigned_text = '\n'.join(x for x in unassigned if x.strip())
    return {
        "regions": out,
        "unassigned_chars": sum(len(s) for s in unassigned),
        "unassigned_text": unassigned_text,
        "conflicts": sorted(set(conflicts)),
        "markers": markers_seen,
    }


def split_pdf_ocr_pages(content):
    """pdf-ocr combined.txt → {page_no: text}"""
    pages = {}
    for block in content.split("===== PDF page "):
        block = block.strip()
        if not block:
            continue
        m = re.match(r"(\d+)\s*=====\s*(.*)", block, re.S)
        if m:
            pages[int(m.group(1))] = m.group(2).strip()
    return pages


def load_path_regions_b(pages_raw):
    """OCR-B path：{page_no: {slip_no: region_raw}}"""
    out = {}
    stats = {"pages": 0, "conflict_pages": [], "empty_region_pages": 0}
    for pg, txt in pages_raw.items():
        seg = segment_page(txt)
        stats["pages"] += 1
        if seg["conflicts"]:
            stats["conflict_pages"].append(pg)
        d = {}
        for k, v in seg["regions"].items():
            if v:
                d[k] = v
        if not d:
            stats["empty_region_pages"] += 1
        out[pg] = d
    return out, stats


def load_path_regions_c(jsonl_paths):
    """autoglm path：{page_no: {slip_no: region}}"""
    pages_raw = {}
    for p in jsonl_paths:
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf-8"):
            try:
                r = json.loads(line)
                if r.get("status") == "ok":
                    pages_raw[r["page"]] = r["ocr_text"]
            except Exception:
                pass
    return load_path_regions_b(pages_raw)  # 同 parser


import os
import json
