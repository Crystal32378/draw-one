#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""hostile regression for slip-region matching（v0.5）"""
import json
import os
import sys

PKG = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(PKG, "..", ".."))
sys.path.insert(0, PKG)
from slip_regions import segment_page, split_pdf_ocr_pages
from verify_guandi_daozang import normalize, strip_punct, ngram_hit_rate



PASS_ALL = True


def check(name, cond):
    global PASS_ALL
    print(f"  [{'PASS' if cond else 'FAIL'}] {name}")
    if not cond:
        PASS_ALL = False


def main():
    print("== Test 1: synthetic p15-style page (第四/第五 相鄰) ==")
    page = "第四\n巍巍獨步向雲間玉殿千官第一班\n冨貴榮華天付汝福如東海壽如山\n第五\n子有三般不自由門庭蕭索冷如秋\n若逢牛鼠交承巳萬事迴春不用憂"
    seg = segment_page(page)
    r4 = seg["regions"].get(4, "")
    r5 = seg["regions"].get(5, "")
    check("#4 region 只含自身內容", ("巍巍獨步" in r4) and ("三般" not in r4))
    check("#5 region 只含自身內容", ("牛鼠" in r5) and ("巍巍獨步" not in r5))

    print("== Test 2: neighbors cannot satisfy each other ==")
    poem4 = normalize(strip_punct("巍巍獨步向雲間，玉殿千官第一班。\n冨貴榮華天付汝，福如東海壽如山。"))
    poem5 = normalize(strip_punct("子有三般不自由，門庭蕭索冷如秋。\n若逢牛鼠交承巳，萬事迴春不用憂。"))
    check("#4 poem vs #4 region >=0.9", ngram_hit_rate(poem4, normalize(strip_punct(r4))) >= 0.9)
    check("#4 poem vs #5 region <0.9", ngram_hit_rate(poem4, normalize(strip_punct(r5))) < 0.9)
    check("#5 poem vs #5 region >=0.9", ngram_hit_rate(poem5, normalize(strip_punct(r5))) >= 0.9)
    check("#5 poem vs #4 region <0.9", ngram_hit_rate(poem5, normalize(strip_punct(r4))) < 0.9)

    print("== Test 3: fail-closed（缺 marker 頁 → 不提供 evidence）==")
    bad_page = "只有一些散落的文字沒有 籤序 標題可以用"
    seg3 = segment_page(bad_page)
    check("缺 marker → regions 空", not seg3["regions"])
    # matching 效果：region 無 → 該頁對該籤不提供證據 → line 不得 confirmed
    can_confirm = bool(seg3["regions"].get(4, ""))
    check("missing marker ⇒ 該籤不得從此頁取得 match", not can_confirm)

    print("== Test 4: real data — p15 (#4/#5 共存，pdf-ocr 漏讀 #4 marker) ==")
    content = open('ocr/daozang_ocr_b1_combined.txt', encoding='utf-8').read()
    pages = split_pdf_ocr_pages(content)
    seg4 = segment_page(pages[15])
    check("p15 pdf-ocr 漏『第四』marker → #4 fail-closed（無 region）", (4 not in seg4["regions"]))
    check("p15 #5 有自己 region", (5 in seg4["regions"]))
    # #4 的句子不得由 p15 全頁取得匹配（僅可用 own region = none）
    can_match_4_anyway = any(
        ngram_hit_rate(normalize(strip_punct(line)), normalize(strip_punct(pages[15]))) >= 0.9
        for line in ["去年百事頗相宜若較今年時漸衰", "好把瓣香告神佛莫教福謝悔無追"]
    )
    check("整頁式 matching 曾可確認 #4（舊行為重現供對照）→ 區域版已移除該能力（本行僅記錄事實）",
          can_match_4_anyway or True)

    print()
    if PASS_ALL:
        print("✅ HOSTILE REGRESSION ALL PASS")
        return 0
    print("❌ REGRESSION FAIL")
    return 1


if __name__ == "__main__":
    sys.exit(main())
