#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate Phase B/C full ingest package for 六十甲子籤 (60 slips).
Carriers: 北港官方圖檔(OCR) + 新港奉天宮官方圖檔(subset OCR) + 好廟網 fs60(網頁轉錄)
Output: data/*.jsonl + eligibility_report.json  (self-contained package)
"""
import json, re, os, hashlib, glob, sys

BASE = os.path.dirname(os.path.abspath(__file__))
# 依賴注入：STUDY03_TMP 指向 OCR/acquisition 產物目錄（北港 ocr/NN.txt、新港 ocr/hsk_NN.txt、fs60_full.json 等）。
# repo-safe：不允許本機絕對路徑推導；未注入或無效時明確失敗。
TMP = os.environ.get("STUDY03_TMP") or ""
if not TMP or not os.path.isdir(TMP) or not os.path.isdir(os.path.join(TMP, "ocr")):
    sys.exit(f"ERROR: STUDY03_TMP 無效（{TMP}）：需包含 ocr/ 子目錄（北港 OCR 產物）。請以環境變數 STUDY03_TMP 注入。")
OUT = os.path.join(BASE, "data")
os.makedirs(OUT, exist_ok=True)

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

# ---------- inputs ----------
BG_URLS = json.load(open(os.path.join(TMP, "beigang_slip_urls.json")))
FS60 = {r["slip_number"]: r for r in json.load(open(os.path.join(TMP, "fs60_full.json")))}
HSK = {int(k): v for k, v in json.load(open(os.path.join(TMP, "hsinkang_details.json"))).items()}
# divergence_description 來源：package 內最終 comparison JSON（自足，不依賴開發環境的 base 產物）
_CMP_FINAL2 = os.path.join(BASE, "Liushijiazi-Corpus-Comparison-v0.1.json")
if os.path.exists(_CMP_FINAL2):
    _cmp2 = json.load(open(_CMP_FINAL2, encoding="utf-8"))["slips"]
    COMP = {r["slip_number"]: {"poem_diffs": [{"line": d.get("line"), "beigang": d.get("a"), "fs60": d.get("b")}
                                for d in r["beigang_vs_fs60"]["diffs"] if not d.get("unresolved")]}
           for r in _cmp2}
else:
    COMP = {}
HSK_SUBSET = [n for n in range(1, 61) if os.path.exists(os.path.join(TMP, "ocr", f"hsk_{n:02d}.txt"))]
# HUMAN_OBSERVED：Crystal 目視官方圖檔確認「carrier 的 observed transcription」（attestation 層證據）
# 依 Framework canonical：human 目視≠slip-level text_authenticity VERIFIED；
# 有 open substantive_divergence 的籤，claim 不得 VERIFIED（divergence 保留）。
HUMAN_OBSERVED = {7: "雲開月出見分明／不須進退問前途（L1-L2 目視確認）",
                  19: "天註定（L1 目視確認，批次 OCR 誤讀注已修正）／兩分明（L4 目視確認）",
                  38: "名顯有意在中間（L1）／即時得意在中間（L4）目視確認",
                  41: "今行到手寔難推（L1 目視確認）",
                  46: "功名得位與君顯（L1）／十五團圓照滿天（L4）目視確認",
                  48: "陰世作事未和同（L1 目視確認）",
                  57: "前途富貴喜安然（L2 目視確認）",
                  60: "內外用心再作福（L3 目視確認）"}
# open substantive divergence 籤：claim 只能 PROBABLE（observed transcription 已確認，divergence 未 merge）
SUBSTANTIVE_OPEN = {7, 38, 41, 46, 48, 57}
# #60 獨立來源鏈路：需新港 attestation 非 uncertain（human 目視新港籤板）＋source_ids 含新港 才可 VERIFIED
XINGANG_60_CONFIRMED = True  # Crystal 2026-08-16 00:26 目視新港籤板照片（hsk_images/hsk_60.jpg）確認第 3 句「內外」
VERIFIED_SLIPS = {n for n in HUMAN_OBSERVED
                  if n not in SUBSTANTIVE_OPEN and not (n == 60 and not XINGANG_60_CONFIRMED)}

def clean(l): return l.replace("**", "").strip()
def cjk_only(s): return "".join(re.findall(r"[\u4e00-\u9fff]", s))
def poem_lines(txt):
    """詩文區塊：最長連續詩行 run 的前 4 段（支援單行、多詩同行、表格 |、<br>）。"""
    line_segs = []
    for raw in txt.replace("\r\n", "\n").split("\n"):
        line = raw.replace("`", "").strip()
        if "|" in line:
            cells = [c.strip() for c in line.split("|") if c.strip()]
        else:
            cells = [line]
        segs = []
        for cell in cells:
            for token in re.split(r"<br>|<br/>|[\u3000]+|\s{2,}", cell):
                l = cjk_only(token)
                if len(l) == 7:
                    segs.append(l)
        if segs:
            line_segs.append(segs)
    runs, cur = [], []
    for segs in line_segs:
        if cur and segs:
            cur.append(segs)
        else:
            if cur: runs.append(cur)
            cur = [segs] if segs else []
    if cur: runs.append(cur)
    cand = [r for r in runs if sum(len(x) for x in r) >= 4]
    if cand:
        best = max(cand, key=lambda r: sum(len(x) for x in r))
        out = []
        for segs in best:
            for seg in segs:
                out.append(seg)
                if len(out) == 4: return out
    flat = [seg for segs in line_segs for seg in segs]
    return flat[:4]
def align_poem(txt, ref):
    """align OCR poem against fs60 reference (for split/multi-column OCR)"""
    cands = poem_lines(txt)
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
            sc = sum(1 for a, b in zip(ref7, c) if a == b)
            if sc > best_score:
                best, best_score = c, sc
        result.append(best if best and best_score >= 2 else None)
    return result

def attr_of(txt):
    el = se = dr = None
    for l in txt.split("\n"):
        lc = l.replace(" ", "").replace("　", "").replace("**", "")
        m = re.search(r"屬([木火土金水])利[在]?([春夏秋冬])", lc)
        if m: el, se = m.group(1), m.group(2)
        dm = re.search(r"宜其?([東西南北])方?", lc)
        if dm: dr = dm.group(1)
    return el, se, dr

def gualao_of(txt):
    lines = [clean(l) for l in txt.split("\n") if l.strip()]
    for i, l in enumerate(lines):
        if re.match(r"^[\u4e00-\u9fff]{7}$", l):
            for j in range(i+1, min(i+4, len(lines))):
                cand = lines[j]
                if 4 <= len(cand) <= 12 and not re.search(r"[，。、|｜/／]", cand):
                    return cand
            break
    return None

def shengyi_of(txt):
    rows = []
    for l in txt.split("\n"):
        lc = l.replace(" ", "").replace("　", "")
        if any(k in lc for k in ["討海", "作塭", "魚苗"]):
            rows.append(lc.strip())
    return rows[:12]


# ---------- readiness guard: require all 60 BG OCR files ----------
missing = [n for n in range(1, 61) if not os.path.exists(os.path.join(TMP, "ocr", f"{n:02d}.txt"))]
if missing:
    print(f"NOT READY: missing BG OCR files: {missing}")
    sys.exit(0)

# ---------- entity builders ----------
corpus = [{
    "corpus_id": "corpus_liushijiazi_60",
    "display_name": "六十甲子籤",
    "name_family": ["六十甲子籤", "六十首籤", "六十甲子聖母詩籤（碩論用語）", "媽祖籤（conflation 俗名）", "天上聖母籤（conflation 俗名）"],
    "self_identification": None,
    "origin_tradition": None,
    "origin_deity": None,
    "origin_place": None,
    "adoption_deities": [
        {"deity": "天上聖母（媽祖）", "note": "台灣媽祖廟主流採用（北港/新港/慈祐宮官方一手；關渡/大甲 PROBABLE）"},
        {"deity": "玉皇上帝（天公）", "note": "籤詩網：天公廟亦有採用此組籤詩"},
        {"deity": "鎮海元帥", "note": "東港鎮海宮（王爺廟）官方明言採用——跨神 adoption"},
        {"deity": "清元真君／天狗將軍", "note": "印尼椰城鳳山廟以他神名義使用（UBM 學術論文）——跨國跨神 adoption"}
    ],
    "numbering_system": "liushijiazi_1to60（1甲子 2甲寅 3甲辰 4甲午 5甲申 6甲戌…60癸亥）",
    "expected_count": 60,
    "identity_claim_ids": ["cl-corpus-identity-01"],
    "origin_claim_ids": ["cl-origin-unresolved-01"],
    "conflation_warning": "「媽祖籤」為 conflation 名稱——六十甲子籤與澎湖天后宮一百籤皆被俗稱「媽祖籤/天上聖母籤/天后籤」；名稱不可作 corpus 判準（Study 03 RQ1；籤詩網稱鹿港天后宮、台北關渡宮用澎湖一百籤，與關渡宮官方「線上60甲子籤」self-label 衝突——同一廟可能多籤系統，待考）",
    "status": "draft",
    "notes": "60 籤干支序；各廟另加籤首/籤王等附加（共 61-64 首不等）；origin 全部 UNRESOLVED（見 claim）。Phase B 全量比對：北港官方 60 圖 OCR vs 好廟網 fs60 60 籤 + 新港官方 subset 12 籤",
    "origin_date_fact": None
}]

# source records
source_record = [
    {"source_id": "src-beigang-official", "name": "北港朝天宮官方網站「線上求籤／靈籤解籤」", "type": "primary",
     "holder": "北港朝天宮", "url": "https://www.matsu.org.tw/?act=menuinfo&ml_id=20240116002&cmd=list",
     "source_observation_status": "directly_observed", "access_status": "open", "license_status": "unsure",
     "priority": "A", "verification_date": "2026-08-15",
     "notes": "籤詩以官方圖檔發布（59 張 2024-08-05 批次；第59籤 2025-06-21 批次）；列表頁含 60 籤 JS 陣列（第1籤詩 甲子…）；未見再製授權聲明",
     "content_class": "original_source"},
    {"source_id": "src-xingang-fengtiangong", "name": "新港奉天宮官方網站「線上求籤／籤詩」", "type": "primary",
     "holder": "新港奉天宮", "url": "https://www.hsinkangmazu.org.tw/?act=menuinfo&ml_id=20231222005&cmd=list",
     "source_observation_status": "directly_observed", "access_status": "open", "license_status": "unsure",
     "priority": "A", "verification_date": "2026-08-15",
     "notes": "列表頁含 60 首 JS 陣列（text:第N首籤詩 干支 / image:官方籤詩圖 / content:解析全文）；籤詩圖為信士捐獻籤板照片（信士邱福來 法號聖慧 謹獻）；圖檔需 Referer（hotlink protection）；未見再製授權聲明",
     "content_class": "original_source"},
    {"source_id": "src-haomiaowang-fs60", "name": "台灣好廟網「籤卦結緣讚」六十甲子籤（fs60）", "type": "secondary",
     "holder": "好廟網（temple01.com）", "url": "https://qiangua.temple01.com/qianshi.php?t=fs60",
     "source_observation_status": "directly_observed", "access_status": "open", "license_status": "unsure",
     "priority": "A", "verification_date": "2026-08-15",
     "notes": "60 籤分頁全量抓取（2026-08-15）；轉錄政策未聲明（籤詩網同系網站自述「輸入時改採現今常用同義字」——轉錄可能 normalize，作比對 carrier 用，不升格 primary）",
     "content_class": "human_transcription"},
]

# independence groups
ig_beigang = {"group_id": "ig-beigang-official",
              "rationale": "北港朝天宮官方一手（廟方自有發布的籤詩圖檔，60/60 直接觀察下載）",
              "master_item_id": None,
              "member_item_ids": [f"item-bg-{n:03d}" for n in range(1, 61)],
              "group_claim_ids": ["cl-independence-beigang-01"]}
ig_xingang = {"group_id": "ig-xingang-official",
              "rationale": "新港奉天宮官方一手（廟方官網發布的捐獻籤板照片，60/60 直接觀察下載；與北港不同廟、不同發布管道→機械上獨立）",
              "master_item_id": None,
              "member_item_ids": [f"item-xg-{n:03d}" for n in range(1, 61)],
              "group_claim_ids": ["cl-independence-xingang-01"]}
ig_haomiaowang = {"group_id": "ig-haomiaowang-fs60",
                  "rationale": "好廟網 fs60 網頁群（疑似與籤詩網同源 mirror 群，未機械判定；僅 comparison 用途）",
                  "master_item_id": None,
                  "member_item_ids": [f"item-hm-{n:03d}" for n in range(1, 61)],
                  "group_claim_ids": ["cl-independence-haomiaowang-01"]}
independence_group = [ig_beigang, ig_xingang, ig_haomiaowang]

# edition families
edition_family = [
    {"family_id": "ed-beigang-chaotiangong", "corpus_id": "corpus_liushijiazi_60", "name": "北港朝天宮版",
     "lineage_note": "北港朝天宮官方線上籤詩圖檔（2024-08-05 批次為主、第59籤 2025-06-21 批次）；含漁業聖意（討海/作塭/魚苗）、廟公的話、卦頭故事等北港特有註釋層；#60 用「內外」與通用網路版「戶內」為實質異文；圖含卦名（乾為天卦等）＋卦象記號",
     "family_claim_ids": ["cl-version-beigang-01"], "mirror_group": None, "status": "draft",
     "notes": "一手文本來源：官方圖檔（photo）；60/60 全量 OCR（text_status=uncertain）"},
    {"family_id": "ed-xingang-fengtiangong", "corpus_id": "corpus_liushijiazi_60", "name": "新港奉天宮版",
     "lineage_note": "新港奉天宮官方線上籤詩圖（信士邱福來 法號聖慧 捐獻籤板照片，2023-12 批次）；圖面為 干支＋（首N）＋四句詩＋捐獻署名——無五行/卦頭/聖意層；解析文字另存於官網頁面（content 欄位）",
     "family_claim_ids": ["cl-version-xingang-01"], "mirror_group": None, "status": "draft",
     "notes": "一手文本來源：官方捐獻籤板照片（photo）；subset 12 籤 OCR（text_status=uncertain）"},
    {"family_id": "ed-liushijiazi-common-web", "corpus_id": "corpus_liushijiazi_60", "name": "通用網路轉錄版（好廟網 fs60 系）",
     "lineage_note": "網路轉錄群（好廟網 fs60；疑與籤詩網同源——未機械判定）；含卦象記號/五行/方位/詩文/故事/籤解；轉錄可能 normalize（籤詩網自述改常用同義字）",
     "family_claim_ids": ["cl-version-commonweb-01"], "mirror_group": None, "status": "draft",
     "notes": "僅 comparison 用途，不升格 primary；60/60 分頁全量"},
]

# concrete items
concrete_item = []
for n in range(1, 61):
    bg = BG_URLS[str(n)]
    p = os.path.join(TMP, "bg_images", f"bg_{n}.jpg")
    concrete_item.append({
        "item_id": f"item-bg-{n:03d}", "family_id": "ed-beigang-chaotiangong",
        "source_record_id": "src-beigang-official", "independence_group_id": "ig-beigang-official",
        "mirror_of": None, "media_type": "photo", "holder": "北港朝天宮",
        "url": bg["url"], "digital_checksum": sha256(p),
        "access_status": "open", "license_status": "unsure",
        "platform_rights_status": "not_checked", "item_license_status": "unresolved",
        "source_observation_status": "directly_observed", "verification_date": "2026-08-15",
        "notes": f"官方籤詩圖檔（{bg['label']}；{'2024-08-05 批次' if n != 59 else '2025-06-21 批次，與其餘不同'}）；local copy 2026-08-15"})
    xg = HSK[n]
    xp = os.path.join(TMP, "hsk_images", f"hsk_{n:02d}.jpg")
    concrete_item.append({
        "item_id": f"item-xg-{n:03d}", "family_id": "ed-xingang-fengtiangong",
        "source_record_id": "src-xingang-fengtiangong", "independence_group_id": "ig-xingang-official",
        "mirror_of": None, "media_type": "photo", "holder": "新港奉天宮",
        "url": xg["image_url"], "digital_checksum": sha256(xp),
        "access_status": "open", "license_status": "unsure",
        "platform_rights_status": "not_checked", "item_license_status": "unresolved",
        "source_observation_status": "directly_observed", "verification_date": "2026-08-15",
        "notes": f"官方捐獻籤板照片（{xg['title']}；信士邱福來 法號聖慧 謹獻）；需 Referer 下載"})
    hp = os.path.join(TMP, "qg60", f"qg60_{n}.html")
    concrete_item.append({
        "item_id": f"item-hm-{n:03d}", "family_id": "ed-liushijiazi-common-web",
        "source_record_id": "src-haomiaowang-fs60", "independence_group_id": "ig-haomiaowang-fs60",
        "mirror_of": None, "media_type": "website", "holder": "好廟網",
        "url": f"https://qiangua.temple01.com/qianshi.php?t=fs60&s={n}",
        "digital_checksum": sha256(hp),
        "access_status": "open", "license_status": "unsure",
        "platform_rights_status": "not_checked", "item_license_status": "unresolved",
        "source_observation_status": "directly_observed", "verification_date": "2026-08-15",
        "notes": "好廟網 fs60 第 N 籤分頁（comparison carrier，不升格 primary）"})

# slips
slip = []
for n in range(1, 61):
    gz = re.search(r"第(\d+)籤詩\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌戍亥])", BG_URLS[str(n)]["label"])
    slip.append({"slip_id": f"slip-lsjz-{n:03d}", "corpus_id": "corpus_liushijiazi_60", "slip_number": n,
                 "traditional_title": None, "legacy_entry_id": None,
                 "notes": f"干支 {gz.group(2) if gz else '?'}（官網列表 label）"})

# attestations
attestation = []
for n in range(1, 61):
    txt = open(os.path.join(TMP, "ocr", f"{n:02d}.txt"), encoding="utf-8").read()
    _aligned = [p_ for p_ in align_poem(txt, [x.rstrip("、。") for x in FS60[n]["poem"]]) if p_]
    poem = _aligned if len(_aligned) == 4 else poem_lines(txt)
    if len(poem) < 4:
        poem = _aligned
    el, se, dr = attr_of(txt)
    gl = gualao_of(txt)
    sy = shengyi_of(txt)
    gz = re.search(r"第(\d+)籤詩\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌戍亥])", BG_URLS[str(n)]["label"]).group(2)
    layers = []
    if el or se:
        layers.append({"layer_name": "五行方位",
                       "text": f"屬{el}利{se}{'天' if se else ''}" + (f" 宜其{dr}方" if dr else ""), "verbatim": True})
    if gl:
        layers.append({"layer_name": "卦頭", "text": gl, "verbatim": True})
    if sy:
        layers.append({"layer_name": "聖意（討海/作塭/魚苗等）", "text": "／".join(sy), "verbatim": True})
    fortune = "；".join(x["text"] for x in layers[:2])
    attestation.append({
        "attestation_id": f"att-bg-{n:03d}", "slip_id": f"slip-lsjz-{n:03d}",
        "item_id": f"item-bg-{n:03d}", "family_id": "ed-beigang-chaotiangong",
        "source_text": "\n".join(poem) if poem else "(OCR 詩文未解析出)",
        "numbering_in_source": gz,
        "title_in_source": gl or None,
        "fortune_in_source": fortune or None,
        "commentary_layers": layers,
        "transcription_method": "ocr", "transcription_by": "agent（autoglm image recognition）",
        "transcribed_at": "2026-08-15",
        "text_status": "verbatim_confirmed" if n in HUMAN_OBSERVED else "uncertain",
        "notes": ("OCR 逐字轉錄官方圖檔＋Crystal 2026-08-15 目視官方圖檔確認 observed transcription（human review；slip-level claim 狀態見 cl-text，divergence 保留）" if n in HUMAN_OBSERVED else "OCR 逐字轉錄官方圖檔，未改字；詩文層跨 carrier 交叉一致為佐證；五行/卦頭/聖意層個別欄位疑 OCR 誤讀待人工複核——不因不通順而猜改")})

# 新港 subset attestations
for n in HSK_SUBSET:
    p = os.path.join(TMP, "ocr", f"hsk_{n:02d}.txt")
    if not os.path.exists(p):
        continue
    txt = open(p, encoding="utf-8").read()
    _aligned = [p_ for p_ in align_poem(txt, [x.rstrip("、。") for x in FS60[n]["poem"]]) if p_]
    poem = _aligned if len(_aligned) == 4 else poem_lines(txt)
    if len(poem) < 4:
        poem = _aligned
    xg = HSK[n]
    attestation.append({
        "attestation_id": f"att-xg-{n:03d}", "slip_id": f"slip-lsjz-{n:03d}",
        "item_id": f"item-xg-{n:03d}", "family_id": "ed-xingang-fengtiangong",
        "source_text": "\n".join(poem) if poem else "(OCR 詩文未解析出)",
        "numbering_in_source": xg["ganzhi"],
        "title_in_source": xg["title"],
        "fortune_in_source": None,
        "commentary_layers": [{"layer_name": "解析（官網文字）", "text": (xg.get("jiexi") or "")[:200], "verbatim": True}],
        "transcription_method": "ocr", "transcription_by": "agent（autoglm image recognition）",
        "transcribed_at": "2026-08-15",
        "text_status": "verbatim_confirmed" if (n == 60 and XINGANG_60_CONFIRMED) else "uncertain",
        "notes": ("捐獻籤板照片 OCR＋Crystal 2026-08-16 00:26 目視確認第 3 句「內外用心再作福」（human review）；圖面僅 干支＋（首N）＋詩文＋署名；解析文字取官網 content 欄位"
                  if (n == 60 and XINGANG_60_CONFIRMED)
                  else "捐獻籤板照片 OCR；圖面僅 干支＋（首N）＋詩文＋署名；解析文字取官網 content 欄位")})

# 好廟網 attestations (60)
for n in range(1, 61):
    fs = FS60[n]
    attestation.append({
        "attestation_id": f"att-hm-{n:03d}", "slip_id": f"slip-lsjz-{n:03d}",
        "item_id": f"item-hm-{n:03d}", "family_id": "ed-liushijiazi-common-web",
        "source_text": "\n".join(x.rstrip("、。") for x in fs["poem"]),
        "numbering_in_source": fs["ganzhi"],
        "title_in_source": "／".join(fs["stories"]) if fs["stories"] else None,
        "fortune_in_source": fs.get("attribute") or None,
        "commentary_layers": [{"layer_name": "籤解", "text": "；".join(fs["jieqian"][:8]), "verbatim": True}],
        "transcription_method": "manual", "transcription_by": "agent（網頁直接轉錄）",
        "transcribed_at": "2026-08-15", "text_status": "verbatim_confirmed",
        "notes": "好廟網分頁逐字轉錄（頁面文字）；轉錄政策未聲明（同系籤詩網自述會 normalize 古體字）——作 comparison carrier"})

# variant groups
variant_group = []
# REL 以最終 comparison JSON 為單一事實來源（36 identical / 17 orthographic / 7 substantive / 0 unresolved）
_CMP_FINAL = os.path.join(BASE, "Liushijiazi-Corpus-Comparison-v0.1.json")
if os.path.exists(_CMP_FINAL):
    _cmp = json.load(open(_CMP_FINAL, encoding="utf-8"))["slips"]
    REL = {r["slip_number"]: {"identical": "identical", "orthographic_only": "orthographic_only",
                              "substantive": "substantive", "unresolved": "unresolved"}.get(r["beigang_vs_fs60"]["category"], "unresolved")
           for r in _cmp}
else:
    REL = {r["slip_number"]: r.get("diff_category") for r in json.load(open(os.path.join(TMP, "liushijiazi_comparison_base.json")))}
for n in range(1, 61):
    atts = [f"att-bg-{n:03d}", f"att-hm-{n:03d}"]
    rel = REL.get(n, "identical")
    rel = {"identical": "identical_text",
           "orthographic_only": "orthographic_only",
           "orthographic_likely": "orthographic_only",
           "substantive": "substantive_divergence",
           "substantive_likely": "substantive_divergence",
           "parse_issue": "unresolved_relationship",
           "unresolved": "unresolved_relationship"}.get(rel, "unresolved_relationship")
    desc = ""
    if n in COMP:
        diffs = COMP[n].get("poem_diffs")
        if diffs:
            desc = "；".join(f"第{d['line']}句 北港「{d['beigang']}」vs 好廟網「{d['fs60']}」" for d in diffs)
    if n in HSK_SUBSET:
        atts.append(f"att-xg-{n:03d}")
        if desc: desc += "；"
        desc += f"新港 subset OCR（{n:02d}）加入比對"
    if n == 60:
        desc = "第3句：北港官方「內外」＋新港官方「內外」（2 個獨立官方 group，皆 human 目視）vs 好廟網/育德「戶內」（網路 mirror 群）——substantive_divergence；北港＋新港 2 獨立官方 primary 已指定「內外」為 reference（reference_designated），mirror「戶內」substantive attestation 保留不消除"
    variant_group.append({
        "variant_group_id": f"vg-lsjz-{n:03d}", "slip_id": f"slip-lsjz-{n:03d}",
        "attestation_ids": atts,
        "relationship": rel,
        "divergence_description": desc or "詩文逐字一致",
        "resolution_status": "reference_designated" if n == 60 else "none",
        "notes": ""})

# temple adoption
temple_adoption = [
    {"adoption_id": "ad-beigang-chaotiangong", "corpus_id": "corpus_liushijiazi_60",
     "temple": "北港朝天宮", "deity": "天上聖母（北港媽）", "region": "雲林縣北港鎮",
     "evidence_claim_ids": ["cl-adoption-beigang-01"], "source_ids": ["src-beigang-official"],
     "notes": "2026-08-15 直接觀察：官網 60 籤列表（干支序）＋籤詩圖檔 60/60 全量下載 OCR；adoption 事實官方一手（edge_level 見 claim，awaiting human approval）",
     "adoption_date_fact": None},
    {"adoption_id": "ad-xingang-fengtiangong", "corpus_id": "corpus_liushijiazi_60",
     "temple": "新港奉天宮", "deity": "天上聖母（新港媽）", "region": "嘉義縣新港鄉",
     "evidence_claim_ids": ["cl-adoption-xingang-01"], "source_ids": ["src-xingang-fengtiangong"],
     "notes": "2026-08-15 直接觀察：官網 60 首列表（干支序）＋捐獻籤板照片 60/60 下載、subset 12 籤 OCR；adoption 事實官方一手（edge_level 見 claim，awaiting human approval）",
     "adoption_date_fact": None},
]

# claims
claims = [
    {"claim_id": "cl-corpus-identity-01", "target_type": "corpus", "target_id": "corpus_liushijiazi_60",
     "claim_type": "corpus_identity", "edge_level": "PROBABLE",
     "evidence_summary": "六十甲子籤為單一 textual corpus：Phase B 全量 60-vs-60 比對（北港官方圖檔 OCR vs 好廟網 fs60；comparison directly performed，不標 VERIFIED）＋新港官方 subset 12 籤交叉＋北港/新港/慈祐宮官方 self-label＋籤詩網集體主張（secondary）",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-beigang-official", "src-xingang-fengtiangong", "src-haomiaowang-fs60"],
     "status": "probable",
     "notes": "全量比對完成（詩文同源、干支序一致、卦象/五行/方位結構一致）；VERIFIED 需 human/domain_expert approval，agent 不 self-approve"},
    {"claim_id": "cl-origin-unresolved-01", "target_type": "corpus", "target_id": "corpus_liushijiazi_60",
     "claim_type": "lineage", "edge_level": "UNRESOLVED",
     "evidence_summary": "六十甲子籤具體起源（何人何處）無法考據；林國平研究指籤詩出現不早於南宋（literature 層轉引，原文未取得）——不知道就標不知道",
     "checked_by": "agent_review", "checked_at": "2026-08-15", "source_ids": [], "status": "unresolved", "notes": "不因全量比對而改變——比對證明 corpus 一致性，不證明起源"},
    {"claim_id": "cl-adoption-beigang-01", "target_type": "adoption", "target_id": "ad-beigang-chaotiangong",
     "claim_type": "adoption", "edge_level": "PROBABLE",
     "evidence_summary": "官方一手直接證據：北港朝天宮官網 60 籤列表（干支序）＋籤詩圖檔 60/60（2026-08-15 直接觀察＋全量 OCR）——北港採用六十甲子籤 corpus；VERIFIED 需 human approval",
     "checked_by": "agent_review", "checked_at": "2026-08-15", "source_ids": ["src-beigang-official"],
     "status": "probable", "notes": "awaiting human/domain_expert approval"},
    {"claim_id": "cl-adoption-xingang-01", "target_type": "adoption", "target_id": "ad-xingang-fengtiangong",
     "claim_type": "adoption", "edge_level": "PROBABLE",
     "evidence_summary": "官方一手直接證據：新港奉天宮官網 60 首列表（干支序）＋捐獻籤板照片 60/60（2026-08-15 直接觀察＋subset 12 OCR）——新港採用六十甲子籤 corpus；VERIFIED 需 human approval",
     "checked_by": "agent_review", "checked_at": "2026-08-15", "source_ids": ["src-xingang-fengtiangong"],
     "status": "probable", "notes": "awaiting human/domain_expert approval"},
    {"claim_id": "cl-version-beigang-01", "target_type": "family", "target_id": "ed-beigang-chaotiangong",
     "claim_type": "version_identity", "edge_level": "PROBABLE",
     "evidence_summary": "北港朝天宮版為六十甲子籤的 edition variant：詩文同源（60-vs-60 全量比對）＋北港特有註釋層（漁業聖意/廟公的話/卦名）＋#60「內外」實質異文——comparison-based",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-beigang-official", "src-haomiaowang-fs60"], "status": "probable", "notes": ""},
    {"claim_id": "cl-version-xingang-01", "target_type": "family", "target_id": "ed-xingang-fengtiangong",
     "claim_type": "version_identity", "edge_level": "PROBABLE",
     "evidence_summary": "新港奉天宮版為六十甲子籤的 edition variant：subset 12 籤詩文與北港/好廟網同源（含第1籤「清靜」與北港同、好廟網「清淨」異）——comparison-based",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-xingang-fengtiangong", "src-haomiaowang-fs60"], "status": "probable", "notes": ""},
    {"claim_id": "cl-version-commonweb-01", "target_type": "family", "target_id": "ed-liushijiazi-common-web",
     "claim_type": "version_identity", "edge_level": "PROBABLE",
     "evidence_summary": "好廟網 fs60 文本與北港版同 corpus、詩文高度一致（60-vs-60 全量：僅異體字與少數異文）；與籤詩網疑似同源（mirror 群，未機械判定）——僅 comparison 用途",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-haomiaowang-fs60"], "status": "probable", "notes": ""},
    {"claim_id": "cl-independence-beigang-01", "target_type": "independence_group", "target_id": "ig-beigang-official",
     "claim_type": "independence", "edge_level": "PROBABLE",
     "evidence_summary": "北港朝天宮官方一手（廟方自有發布圖檔，60/60 直接觀察）；與網路轉錄群（籤詩網/好廟網/育德）不同源；agent 無 approval 不 VERIFIED",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-beigang-official"], "status": "probable", "notes": "機械判準：group_id 不同即獨立"},
    {"claim_id": "cl-independence-xingang-01", "target_type": "independence_group", "target_id": "ig-xingang-official",
     "claim_type": "independence", "edge_level": "PROBABLE",
     "evidence_summary": "新港奉天宮官方一手（廟方官網發布捐獻籤板照片，60/60 直接觀察）；與北港（ig-beigang-official）不同廟、不同發布管道→機械上獨立 group；agent 無 approval 不 VERIFIED",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-xingang-fengtiangong"], "status": "probable", "notes": "機械判準：group_id 不同即獨立"},
    {"claim_id": "cl-independence-haomiaowang-01", "target_type": "independence_group", "target_id": "ig-haomiaowang-fs60",
     "claim_type": "independence", "edge_level": "UNRESOLVED",
     "evidence_summary": "好廟網 fs60 與籤詩網/育德疑似同源（mirror 群），未做機械判定——不因兩網站內容相同就當成兩個 independent sources",
     "checked_by": "agent_review", "checked_at": "2026-08-15",
     "source_ids": ["src-haomiaowang-fs60"], "status": "unresolved", "notes": ""},
]

# text_authenticity claims per slip
for n in range(1, 61):
    rel = REL.get(n, "identical")
    if n in VERIFIED_SLIPS:
        el, st = "VERIFIED", "verified"
        extra = f"；Crystal 目視官方圖檔確認 observed transcription：{HUMAN_OBSERVED[n]}；無 open substantive divergence"
        srcs = ["src-beigang-official"]
        if n == 60:
            extra += "；第3句「內外」北港＋新港 2 個獨立官方 group 同文（新港 attestation 已 human 目視確認）"
            srcs = ["src-beigang-official", "src-xingang-fengtiangong"]
        notes = "VERIFIED：human approval（2026-08-15 Crystal 目視）+ 無 open substantive divergence"
    elif n in HUMAN_OBSERVED:
        # 有 open divergence：human 目視確認 observed transcription，但 claim 維持 PROBABLE
        el, st = "PROBABLE", "probable"
        extra = f"；Crystal 目視官方圖檔確認 observed transcription：{HUMAN_OBSERVED[n]}；仍有 open substantive divergence，divergence 保留不 merge"
        srcs = ["src-beigang-official", "src-haomiaowang-fs60"]
        notes = "PROBABLE：一手 verbatim（human 目視）+ 跨 carrier 比對；有 open substantive_divergence，依 canonical 不得 VERIFIED（awaiting divergence 定版決策）"
    elif n == 60:
        el, st = "PROBABLE", "probable"
        extra = "；第3句「內外」北港官方（human 目視確認）＋新港官方 OCR（uncertain，待目視）同文；「戶內」僅網路 mirror（好廟網/育德）——官方 consensus 傾向內外，分歧保留不 merge"
        srcs = ["src-beigang-official", "src-haomiaowang-fs60"]
        notes = "PROBABLE：北港一手 verbatim（human 目視）；新港 attestation 仍 uncertain，source_ids 未含新港——2-group 鏈路未成立，不得 VERIFIED"
    elif rel == "parse_issue":
        el, st = "UNRESOLVED", "unresolved"
        extra = "；OCR 解析未完成"
        srcs = ["src-beigang-official", "src-haomiaowang-fs60"]
        notes = "VERIFIED 需 human/domain_expert approval（含 OCR 人工複核圖檔）"
    else:
        el, st = "PROBABLE", "probable"
        extra = "；詩文跨 carrier 交叉一致（異體字除外）"
        srcs = ["src-beigang-official", "src-haomiaowang-fs60"]
        notes = "VERIFIED 需 human/domain_expert approval（含 OCR 人工複核圖檔）"
    claims.append({
        "claim_id": f"cl-text-{n:03d}", "target_type": "slip", "target_id": f"slip-lsjz-{n:03d}",
        "claim_type": "text_authenticity", "edge_level": el,
        "evidence_summary": f"北港一手官方圖檔 OCR verbatim（60/60 全量）+ 好廟網 fs60 交叉比對（第{n}籤）{extra}",
        "checked_by": "human" if n in HUMAN_OBSERVED else "agent_review", "checked_at": "2026-08-15",
        "source_ids": srcs, "status": st,
        **({"approval": {"approved_by": "human", "approved_at": "2026-08-15"}} if n in VERIFIED_SLIPS else {}),
        "notes": notes})

# ---------- reference_edition（Phase C reference gate 的 canonical chain） ----------
# 每籤指定北港官方版為 reference edition（resolution_status=resolved → item_id + attestation_id）
# decided_by=agent_review：comparison-based 指定（60-vs-60 全量比對＋8 籤 human 目視抽複核），非 VERIFIED 升等決策
reference_edition = []
for n in range(1, 61):
    reference_edition.append({
        "reference_id": f"ref-lsjz-{n:03d}", "corpus_id": "corpus_liushijiazi_60",
        "family_id": "ed-beigang-chaotiangong",
        "item_id": f"item-bg-{n:03d}", "attestation_id": f"att-bg-{n:03d}",
        "resolution_status": "resolved",
        "rationale": "北港官方圖檔版為 comparison-based reference edition（60-vs-60 全量比對；#7 #19 #38 #41 #46 #48 #57 #60 另經 human 目視確認 observed transcription）",
        "decided_by": "agent_review", "decided_at": "2026-08-15",
        "supersedes": None})

# ---------- write ----------
files = {"corpus": corpus, "edition_family": edition_family, "source_record": source_record,
         "independence_group": independence_group, "concrete_item": concrete_item, "slip": slip,
         "attestation": attestation, "variant_group": variant_group, "temple_adoption": temple_adoption,
         "claim": claims, "reference_edition": reference_edition}
counts = {}
for name, rows in files.items():
    with open(os.path.join(OUT, f"{name}.jsonl"), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    counts[name] = len(rows)
print(json.dumps(counts, ensure_ascii=False, indent=2))
print("TOTAL rows:", sum(counts.values()))
