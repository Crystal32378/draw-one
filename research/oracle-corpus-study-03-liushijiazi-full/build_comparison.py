#!/usr/bin/env python3
"""Build final Liushijiazi corpus comparison JSON (60 slips, 3 carriers)."""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(os.path.dirname(BASE), ".openclaw", "tmp", "study03")

BG_URLS = json.load(open(os.path.join(TMP, "beigang_slip_urls.json")))
FS60 = {r["slip_number"]: r for r in json.load(open(os.path.join(TMP, "fs60_full.json")))}
HSK = {int(k): v for k, v in json.load(open(os.path.join(TMP, "hsinkang_details.json"))).items()}
COMP = json.load(open(os.path.join(TMP, "liushijiazi_comparison_base.json")))
HSK_SUBSET = [n for n in range(1, 61) if os.path.exists(os.path.join(TMP, "ocr", f"hsk_{n:02d}.txt"))]

def norm(s): return re.sub(r"[、。，,．./／\s│|]", "", s)

def cjk_only(s):
    return "".join(re.findall(r"[\u4e00-\u9fff]", s))

def poem_lines_of(txt):
    """全部 7 字 CJK 段：單行 7 字、多詩同行（空白/全形空格/表格 | /<br> 分隔）。"""
    segs = []
    for raw in txt.replace("\r\n", "\n").split("\n"):
        line = raw.replace("`", "").strip()
        if line.startswith("|") or "|" in line:
            cells = [c.strip() for c in line.split("|") if c.strip()]
        else:
            cells = [line]
        for cell in cells:
            for token in re.split(r"<br>|<br/>|[\u3000]+|\s{2,}", cell):
                l = cjk_only(token)
                if len(l) == 7:
                    segs.append(l)
    return segs
def align_poem(txt, ref):
    """Align fs60 reference poem (4 lines) against OCR text; support 1-char splits."""
    cands = poem_lines_of(txt)
    # also try joining adjacent lines (e.g. 6+1 chars)
    raw_lines = [cjk_only(x) for x in txt.replace("\r\n","\n").split("\n")]
    for i in range(len(raw_lines)-1):
        joined = raw_lines[i] + raw_lines[i+1]
        if len(raw_lines[i]) >= 4 and len(joined) == 7:
            cands.append(joined)
    result = []
    for ref_line in ref:
        ref7 = cjk_only(ref_line)
        best, best_score = None, 0
        for c in cands:
            score = sum(1 for a, b in zip(ref7, c) if a == b)
            if score > best_score:
                best, best_score = c, score
        if best and best_score >= 2:
            result.append(best)
        else:
            result.append(None)
    return result

def poem_of(txt):
    """Back-compat wrapper: no ref -> use bare 7-char lines."""
    return poem_lines_of(txt)[:4]

def diff_lines(a, b):
    diffs = []
    n = min(len(a), len(b))
    for i in range(n):
        if norm(a[i]) != norm(b[i]):
            diffs.append({"line": i+1, "a": a[i], "b": b[i]})
    if len(a) != len(b):
        diffs.append({"line": "length", "a": a, "b": b})
    return diffs

def diff_aligned(a, b):
    """diff where a/b may contain None (unresolved alignment)."""
    diffs = []
    for i in range(4):
        x, y = a[i], b[i]
        if x is None or y is None:
            diffs.append({"line": i+1, "a": x, "b": y, "unresolved": True})
        elif norm(x) != norm(y):
            diffs.append({"line": i+1, "a": x, "b": y})
    return diffs

def classify(diffs, slip_number=None):
    """char-count 啟發式分類；#60 例外：內外/戶內 1 字差但語義實質（SN-03-12 盲點）→ substantive"""
    if not diffs: return "identical"
    if any(x.get("unresolved") for x in diffs): return "unresolved"
    if slip_number == 60:
        return "substantive"
    total = sum(len(set(x["a"]) ^ set(x["b"])) for x in diffs)
    return "orthographic_only" if total <= 2 else "substantive"

slips = []
def align_pair(txt, ref_poem):
    """Return (aligned_poem, diffs_vs_ref)."""
    aligned = align_poem(txt, ref_poem)
    return aligned

for n in range(1, 61):
    bg_path = os.path.join(TMP, "ocr", f"{n:02d}.txt")
    if not os.path.exists(bg_path):
        print(f"skip {n} (ocr pending)"); continue
    bg_txt = open(bg_path, encoding="utf-8").read()
    fs_poem = [cjk_only(x) for x in FS60[n]["poem"]]
    bg_poem = align_pair(bg_txt, fs_poem)
    rec = {
        "slip_number": n,
        "ganzhi": {"beigang_official_list": re.search(r"第\d+籤詩\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌戍亥])", BG_URLS[str(n)]["label"]).group(1),
                   "beigang_ocr": None, "xingang_official": HSK.get(n, {}).get("ganzhi"), "fs60": FS60[n]["ganzhi"]},
        "poem_beigang_aligned": bg_poem,
        "poem_fs60": fs_poem,
        "beigang_vs_fs60": {"diffs": diff_aligned(bg_poem, fs_poem), "category": None},
    }
    rec["beigang_vs_fs60"]["category"] = classify(rec["beigang_vs_fs60"]["diffs"], n)
    if n == 60:
        rec["beigang_vs_fs60"]["note"] = "內外/戶內：1 字差但語義實質（SN-03-12）——分類為 substantive_divergence；北港＋新港 2 獨立官方 primary 已指定「內外」為 reference（reference_designated），mirror「戶內」substantive attestation 保留"
    if n in HSK_SUBSET:
        xg_txt = open(os.path.join(TMP, "ocr", f"hsk_{n:02d}.txt"), encoding="utf-8").read()
        xg_poem = align_pair(xg_txt, fs_poem)
        rec["poem_xingang_aligned"] = xg_poem
        rec["xingang_vs_beigang"] = {"diffs": diff_aligned(xg_poem, bg_poem), "category": classify(diff_aligned(xg_poem, bg_poem))}
        rec["xingang_vs_fs60"] = {"diffs": diff_aligned(xg_poem, fs_poem), "category": classify(diff_aligned(xg_poem, fs_poem))}
    slips.append(rec)

out = {
    "task": "Liushijiazi（六十甲子籤）full corpus comparison — Phase B（Oracle Corpus Study 03 延伸）",
    "generated_at": "2026-08-15",
    "scope": "60 slips × carriers：北港官方圖檔 OCR（60/60）＋新港奉天宮官方籤板照片 OCR（subset 12）＋好廟網 fs60 網頁轉錄（60/60）",
    "note": "comparison directly performed；比對動作本身非 lineage claim，不標 VERIFIED",
    "carriers": {
        "beigang": {"name": "北港朝天宮官方", "type": "official temple source", "mode": "籤詩圖 OCR（autoglm）", "caveat": "OCR 字形誤讀風險（戌→戊、巳→己、酉→西、申→甲 等）；干支以官網列表 label 為權威"},
        "xingang": {"name": "新港奉天宮官方", "type": "official temple source", "mode": "捐獻籤板照片 OCR（subset 12）", "caveat": "圖面僅干支＋（首N）＋詩文＋署名；OCR 直書數字順序會顛倒（首十六/首六十）"},
        "fs60": {"name": "好廟網 fs60", "type": "secondary database", "mode": "網頁直接轉錄（60/60）", "caveat": "與籤詩網疑似同源（mirror 群）；轉錄可能 normalize（籤詩網自述改常用同義字）"}
    },
    "summary": None,
    "slips": slips,
}

cats = {}
for s in slips:
    c = s["beigang_vs_fs60"]["category"]
    cats[c] = cats.get(c, 0) + 1
out["summary"] = {
    "beigang_vs_fs60_categories": cats,
    "total_slips": len(slips),
    "xingang_subset": len([r for r in slips if r.get("poem_xingang_aligned")]),
    "xingang_vs_beigang_agreement": sum(1 for s in slips if "xingang_vs_beigang" in s and s["xingang_vs_beigang"]["category"] == "identical"),
}

with open(os.path.join(BASE, "Liushijiazi-Corpus-Comparison-v0.1.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(json.dumps(out["summary"], ensure_ascii=False, indent=2))
for s in slips:
    if s["beigang_vs_fs60"]["category"] != "identical":
        print(s["slip_number"], s["beigang_vs_fs60"]["category"], s["beigang_vs_fs60"]["diffs"])
    if "xingang_vs_beigang" in s and s["xingang_vs_beigang"]["category"] != "identical":
        print("  新港:", s["slip_number"], s["xingang_vs_beigang"]["diffs"])
