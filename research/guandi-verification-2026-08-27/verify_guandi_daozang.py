#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
關帝百籤 transcription verification（v0.4，福 re-gate 修正版）

witness 語義（名實相符）：
  - OCR-B（pdf-ocr）與 OCR-C（autoglm）是「同一份 NLC 道藏影像」的兩條 transcription path，
    不是兩個獨立 textual witnesses。
  - wikisource 底本與 NLC 影像的獨立性未證明。
  - 因此：
      transcription_grade        : A（雙 OCR path 一致）/ B（單 OCR path）/ LOW（無 OCR path 支持）
      transcription_confidence   : HIGH（A）/ MEDIUM（B）/ LOW
      textual_witness_confidence : 全部 single_witness_not_verified（只有一份 production witness；
                                   不再稱 textual authenticity 的 VERIFIED）
      witness_independence       : 結構化說明

matching boundary（v0.5，福第二輪）：slip-region scoped
  - 由各 transcription path 自行切出 per-slip region（slip_regions.py，deterministic/fail-closed）
  - 匹配只在該籤自己的 region 發生；neighboring slip text cannot satisfy current slip evidence
  - 某頁某籤無法可靠切割（缺 marker / 衝突）→ fail closed：該頁不提供 evidence
  - 不 normalize 掉 □；不併 裡/裏/里

line-level：#70 等未確認句標 line status=unresolved，slip 維持 PROBABLE（低信心 candidate）

輸入（repo clean checkout 相對路徑）：
  research/guandi-verification-2026-08-27/ocr/daozang_ocr_b{1,2}_combined.txt
  research/guandi-verification-2026-08-27/ocr/daozang_pages_autoglm*.jsonl
  data/corpora/guandi/slip_texts.json
  research/guandi-verification-2026-08-27/slip_page_map.json

影像證據（external manifest）：NLC 道藏第 4379 冊 PDF 來源與重跑方式見 EVIDENCE_MANIFEST.md；
本 script 不假設本機 PDF 存在。
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) > 1:
    REPO = sys.argv[1]
else:
    # 本檔位於 <repo>/research/guandi-verification-2026-08-27/
    REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
PKG = os.path.join(REPO, "research", "guandi-verification-2026-08-27")
OCR_DIR = os.path.join(PKG, "ocr")
B1 = os.path.join(OCR_DIR, "daozang_ocr_b1_combined.txt")
B2 = os.path.join(OCR_DIR, "daozang_ocr_b2_combined.txt")
AUTOGLM = os.path.join(OCR_DIR, "daozang_pages_autoglm.jsonl")
AUTOGLM2 = os.path.join(OCR_DIR, "daozang_pages_autoglm2.jsonl")
SLIPS = os.path.join(REPO, "data", "corpora", "guandi", "slip_texts.json")
def get_page_map():
    return json.load(open(os.path.join(PKG, "slip_page_map.json")))


MAP_CACHE = None


def load_map():
    global MAP_CACHE
    if MAP_CACHE is None:
        MAP_CACHE = get_page_map()
    return MAP_CACHE
OUT_REPORT = os.path.join(PKG, "verification_report_v4.json")
OUT_MD = os.path.join(PKG, "verification_report_v4.md")
OUT_SLIPS = os.path.join(PKG, "slip_texts.verified_v4.json")
OUT_MANIFEST = os.path.join(PKG, "EVIDENCE_MANIFEST.md")

# 繁簡/異體映射（gate 判等用；不改變 verbatim；不併 裡/裏/里）
FAN2JIAN = {
    '爲': '为', '為': '为', '冨': '富', '雲': '云', '間': '间', '獨': '独', '貴': '贵', '榮': '荣',
    '華': '华', '東': '东', '壽': '寿', '萬': '万', '圓': '圆', '滿': '满', '門': '门', '戶': '户',
    '無': '无', '關': '关', '夢': '梦', '龍': '龙', '鳳': '凤', '陽': '阳', '陰': '阴', '隱': '隐',
    '雖': '虽', '隨': '随', '雜': '杂', '離': '离', '難': '难', '電': '电', '靈': '灵', '廟': '庙',
    '應': '应', '議': '议', '訟': '讼', '財': '财', '禍': '祸', '祿': '禄', '親': '亲', '遲': '迟',
    '謀': '谋', '勝': '胜', '負': '负', '紙': '纸', '畫': '画', '馬': '马', '車': '车', '燈': '灯',
    '滅': '灭', '煙': '烟', '塵': '尘', '鄉': '乡', '靜': '静', '歸': '归', '變': '变', '舊': '旧',
    '寧': '宁', '寫': '写', '讀': '读', '聞': '闻', '問': '问', '寶': '宝', '禱': '祷', '顯': '显',
    '從': '从', '諸': '诸', '現': '现', '誠': '诚', '時': '时', '來': '来', '觀': '观', '報': '报',
    '與': '与', '飛': '飞', '頭': '头', '長': '长', '過': '过', '邊': '边', '還': '还', '對': '对',
    '語': '语', '開': '开', '後': '后', '會': '会', '動': '动', '發': '发', '風': '风',
    '黃': '黄', '齊': '齐', '體': '体', '點': '点', '這': '这', '進': '进', '遠': '远', '處': '处',
    '讓': '让', '見': '见', '學': '学', '經': '经', '濟': '济', '統': '统', '結': '结', '構': '构',
    '計': '计', '設': '设', '實': '实', '驗': '验', '證': '证', '據': '据', '資': '资', '數': '数',
    '號': '号', '機': '机', '腦': '脑', '網': '网', '絡': '络', '態': '态', '區': '区', '別': '别',
    '國': '国', '際': '际', '權': '权', '繫': '系', '聯': '联', '練': '练', '戰': '战', '陣': '阵',
    '鍾': '钟', '鏡': '镜', '鐵': '铁', '錦': '锦', '錢': '钱', '錯': '错', '鎮': '镇', '鑑': '鉴',
    '閒': '闲', '閱': '阅', '閣': '阁', '闕': '阙', '闔': '阖', '蘭': '兰', '藝': '艺', '藥': '药',
    '蘇': '苏', '虛': '虚', '蟲': '虫', '蟄': '蛰', '衆': '众', '衛': '卫', '衝': '冲', '補': '补',
    '覇': '霸', '覺': '觉', '觸': '触', '訓': '训', '記': '记', '訪': '访', '許': '许', '詞': '词',
    '詩': '诗', '話': '话', '詳': '详', '誤': '误', '說': '说', '誰': '谁', '課': '课', '請': '请',
    '豐': '丰', '貫': '贯', '買': '买', '費': '费', '賀': '贺', '賦': '赋', '質': '质', '賢': '贤',
    '賜': '赐', '賞': '赏', '贊': '赞', '贈': '赠', '趙': '赵', '趨': '趋', '踐': '践', '軍': '军',
    '軒': '轩', '軟': '软', '載': '载', '輔': '辅', '輕': '轻', '輝': '辉', '輩': '辈', '輪': '轮',
    '轉': '转', '辭': '辞', '農': '农', '迴': '回', '遷': '迁', '選': '选', '遺': '遗', '避': '避',
    '邇': '迩', '鄧': '邓', '郵': '邮', '鄭': '郑', '醜': '丑', '醫': '医', '釋': '释', '雞': '鸡',
    '頂': '顶', '順': '顺', '預': '预', '頓': '顿', '願': '愿', '類': '类', '響': '响', '頻': '频',
    '額': '额', '題': '题', '顔': '颜', '養': '养', '餘': '余', '館': '馆', '驚': '惊', '髮': '发',
    '鬢': '鬓', '鬥': '斗', '魚': '鱼', '鳥': '鸟', '鴻': '鸿', '鵬': '鹏', '鶴': '鹤', '麥': '麦',
    '龜': '龟', '龕': '龛', '髙': '高', '冝': '宜', '廻': '回', '巳': '已', '刦': '劫', '刧': '劫',
    '倂': '并', '並': '并', '冊': '册', '凟': '渎', '凖': '准', '効': '效', '勅': '敕', '勲': '勋',
    '勵': '励', '匱': '匮', '協': '协', '單': '单', '嚴': '严', '囘': '回', '圗': '图',
    '圖': '图', '團': '团', '聖': '圣', '壓': '压', '壊': '坏', '壯': '壮', '壺': '壶', '夀': '寿',
    '奬': '奖', '奪': '夺', '奮': '奋', '姦': '奸', '姪': '侄', '孫': '孙', '宮': '宫',
    '寳': '宝', '將': '将', '導': '导', '屆': '届', '層': '层', '屬': '属', '嶽': '岳', '師': '师',
    '帶': '带', '廕': '荫', '廣': '广', '廢': '废', '弔': '吊', '彈': '弹', '當': '当', '彙': '汇',
    '彌': '弥', '徑': '径', '復': '复', '徳': '德', '懷': '怀', '懸': '悬', '戀': '恋', '戸': '户',
    '執': '执', '場': '场', '墳': '坟', '墜': '坠', '増': '增', '墻': '墙', '壘': '垒', '壙': '圹',
    '壻': '婿', '嬌': '娇', '寜': '宁', '審': '审', '寬': '宽', '寵': '宠', '專': '专', '尋': '寻',
    '爾': '尔', '嶼': '屿', '巖': '岩', '幇': '帮', '幹': '干', '廳': '厅', '憶': '忆', '戻': '戾',
    '抜': '拔', '拏': '拿', '挙': '举', '挾': '挟', '捜': '搜', '捨': '舍', '掲': '揭', '揮': '挥',
    '損': '损', '搖': '摇', '摠': '总', '撃': '击', '撿': '捡', '擁': '拥', '擔': '担', '擧': '举',
    '攬': '揽', '収': '收', '敍': '叙', '敎': '教', '敗': '败', '敺': '驱', '敵': '敌', '斃': '毙',
    '斷': '断', '書': '书', '朶': '朵', '楽': '乐', '樂': '乐', '樓': '楼', '標': '标', '樹': '树',
    '橋': '桥', '歩': '步', '歳': '岁', '歴': '历', '殁': '殁', '殺': '杀', '毀': '毁', '毆': '殴',
    '毎': '每', '氣': '气', '氷': '冰', '決': '决', '沒': '没', '沖': '冲', '況': '况', '涼': '凉',
    '渉': '涉', '済': '济', '満': '满', '漁': '渔', '漢': '汉', '漸': '渐', '潔': '洁', '潛': '潜',
    '澁': '涩', '濁': '浊', '澤': '泽', '濱': '滨', '瀆': '渎', '爼': '俎', '爭': '争', '牆': '墙',
    '牀': '床', '牽': '牵', '犠': '牺', '獸': '兽', '獻': '献', '獲': '获', '獵': '猎', '環': '环',
    '璽': '玺', '瓊': '琼', '甞': '尝', '産': '产', '畧': '略', '疎': '疏', '療': '疗', '癡': '痴',
    '発': '发', '盜': '盗', '監': '监', '盡': '尽', '眞': '真', '確': '确', '禮': '礼', '祕': '秘',
    '稟': '禀', '穢': '秽', '竊': '窃', '竪': '竖', '競': '竞', '箇': '个', '箒': '帚', '篤': '笃',
    '簷': '檐', '簡': '简', '糧': '粮', '糾': '纠', '紅': '红', '紀': '纪', '約': '约', '紆': '纡',
    '純': '纯', '級': '级', '紛': '纷', '細': '细', '終': '终', '組': '组', '絶': '绝', '給': '给',
    '絲': '丝', '経': '经', '綠': '绿', '縁': '缘', '縄': '绳', '縛': '缚', '縦': '纵', '總': '总',
    '績': '绩', '繋': '系', '織': '织', '繖': '伞', '繞': '绕', '繡': '绣', '繩': '绳', '繪': '绘',
    '繳': '缴', '繼': '继', '續': '续', '纏': '缠', '縣': '县', '羈': '羁', '義': '义', '習': '习',
    '翦': '剪', '職': '职', '聡': '聪', '聨': '联', '聲': '声', '聽': '听', '聳': '耸', '肅': '肃',
    '脫': '脱', '腳': '脚', '膓': '肠', '臨': '临', '興': '兴', '舉': '举', '舘': '馆', '艷': '艳',
    '苻': '符', '莊': '庄', '葉': '叶', '著': '着', '蓋': '盖', '蓬': '蓬', '蔭': '荫',
    '蔵': '藏', '虧': '亏', '術': '术', '裝': '装', '製': '制', '襲': '袭', '規': '规',
    '視': '视', '觧': '解', '討': '讨', '詔': '诏', '評': '评', '詠': '咏', '該': '该', '誇': '夸',
    '誅': '诛', '説': '说', '論': '论', '諒': '谅', '諍': '诤', '諦': '谛', '謁': '谒', '謂': '谓',
    '謨': '谟', '講': '讲', '謝': '谢', '謹': '谨', '譜': '谱', '識': '识', '譯': '译', '護': '护',
    '譽': '誉', '豊': '丰', '貳': '贰', '貸': '贷', '賊': '贼', '賴': '赖', '賺': '赚', '贄': '贽',
    '購': '购', '贖': '赎', '贛': '赣', '踐': '践', '迺': '乃', '適': '适', '須': '须', '鑰': '钥',
    '鑾': '銮', '鑼': '锣', '鑿': '凿', '黒': '黑',
}


def normalize(s):
    return ''.join(FAN2JIAN.get(ch, ch) for ch in s)


def strip_punct(s, keep_box=False):
    """去標點空白。keep_box=True 時保留 □（福 re-gate：不 normalize 掉 □）。"""
    if keep_box:
        return re.sub(r'[\s，。、；：！？「」『』（）()《》〈〉\[\]【】…—–\-\.·,.:;!?"\' \u3000\u00a0]', '', s)
    return re.sub(r'[\s，。、；：！？「」『』（）()《》〈〉\[\]【】…—–\-\.·,.:;!?"\' \u3000\u00a0□■]', '', s)


def ngram_hit_rate(line, text):
    grams = [line[i:i + 2] for i in range(len(line) - 1)]
    if not grams:
        return 1.0
    hits = sum(1 for g in grams if g in text)
    return hits / len(grams)


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


def main():
    pages_b = parse_pages([B1, B2])
    pages_c = load_autoglm([AUTOGLM, AUTOGLM2])
    # page-scoped normalize（每頁各自 normalize，比對限定該籤對應頁）
    norm_b = {p: normalize(strip_punct(t)) for p, t in pages_b.items()}
    norm_c = {p: normalize(strip_punct(t)) for p, t in pages_c.items()}
    print(f"OCR-B {len(pages_b)} 頁 / OCR-C {len(pages_c)} 頁（page-scoped matching）")

    slips_doc = json.load(open(SLIPS, encoding="utf-8"))
    slips = slips_doc["slips"]

    from slip_regions import load_path_regions_b, load_path_regions_c
    regions_b, seg_stats_b = load_path_regions_b(pages_b)
    regions_c, seg_stats_c = load_path_regions_c([AUTOGLM, AUTOGLM2])
    def region_norm(path_map, pg, num):
        t = path_map.get(pg, {}).get(num, "")
        return normalize(strip_punct(t, keep_box=True)) if t else ""
    print(f"segmentation: B pages={len(pages_b)} conflict={len(seg_stats_b['conflict_pages'])} empty_region_pages={seg_stats_b['empty_region_pages']} | C conflict={len(seg_stats_c['conflict_pages'])} empty={seg_stats_c['empty_region_pages']}")

    results = []
    for slip in slips:
        n = slip["slip_number"]
        poem = slip["poem_text"]
        lines = [l for l in poem.split("\n") if l.strip()]
        cand_pages = load_map().get(str(n), [])
        line_out = []
        for line in lines:
            ln = normalize(strip_punct(line, keep_box=False))
            if len(ln) < 4:
                line_out.append({"line": line, "line_status": "confirmed", "hit_b": True, "hit_c": True,
                                 "rate_b": 1.0, "rate_c": 1.0, "pages_b": [], "pages_c": []})
                continue
            # page-scoped：只在 cand_pages 內比對
            hit_b, hit_c = False, False
            pages_b_hit, pages_c_hit = [], []
            own_b = [p for p in cand_pages]
            for p in own_b:
                reg = region_norm(regions_b, p, n)
                if not reg:
                    continue  # fail-closed：本頁此籤無可靠 region → 不提供 evidence
                if ngram_hit_rate(ln, reg) >= 0.9:
                    hit_b = True
                    pages_b_hit.append(p)
            for p in own_b:
                reg = region_norm(regions_c, p, n)
                if not reg:
                    continue
                if ngram_hit_rate(ln, reg) >= 0.9:
                    hit_c = True
                    pages_c_hit.append(p)
            line_out.append({
                "line": line,
                "line_status": "confirmed" if (hit_b or hit_c) else "unresolved",
                "hit_b": hit_b, "hit_c": hit_c,
                "rate_b": max([ngram_hit_rate(ln, norm_b[p]) for p in cand_pages if p in norm_b] + [0.0]),
                "rate_c": max([ngram_hit_rate(ln, norm_c[p]) for p in cand_pages if p in norm_c] + [0.0]),
                "pages_b": pages_b_hit, "pages_c": pages_c_hit,
            })
        all_hit = all(r["hit_b"] or r["hit_c"] for r in line_out)
        # transcription grade：A = 每句雙 OCR path；B = 每句至少一 path；LOW = 有句無 path
        if all_hit and all(r["hit_b"] and r["hit_c"] for r in line_out):
            grade = "A"
        elif all_hit:
            grade = "B"
        else:
            grade = "LOW"
        confidence = {"A": "HIGH", "B": "MEDIUM", "LOW": "LOW"}[grade]
        # line-level unresolved 清單
        unresolved_lines = [r["line"] for r in line_out if r["line_status"] == "unresolved"]
        # textual witness confidence：單一 production witness；wikisource 底本獨立性未證明
        text_conf = "single_witness_not_verified"
        page_hits = sorted(set(p for r in line_out for p in r["pages_b"] + r["pages_c"]))
        loc = f"Wikimedia Commons NLC892-411999005947-9653 道藏 第4379冊.pdf（頁 {'、'.join(map(str, page_hits)) if page_hits else '未定位'}）"
        notes = slip.get("notes", "")
        if unresolved_lines:
            notes = (notes + f"；line-level UNRESOLVED：{'；'.join(unresolved_lines)}").strip("；")
        results.append({
            "slip_number": n,
            "original_slip_label": slip["original_slip_label"],
            "poem_text": poem,
            "lines": line_out,
            "line_unresolved": unresolved_lines,
            "cand_pages": cand_pages,
            "ocr_pages": page_hits,
            "transcription_grade": grade,
            "transcription_confidence": confidence,
            # transcription_status 維持 wikisource 原狀：LOW grade 是「低信心 candidate」
            # （福 re-gate：#70 維持低信心 candidate，line-level 標 unresolved，不把 slip 降 UNRESOLVED）
            "transcription_status": slip.get("transcription_status", "PROBABLE"),
            "textual_witness_confidence": text_conf,
            "source_locator": loc,
            "notes": notes,
        })

    grade_cnt = {}
    for r in results:
        grade_cnt[r["transcription_grade"]] = grade_cnt.get(r["transcription_grade"], 0) + 1
    print("transcription_grade:", grade_cnt)

    report = {
        "corpus": "guandi",
        "edition": "《護國嘉濟江東王靈籤》（傅燁撰，道藏本；NLC 道藏第 4379 冊 PDF，Wikimedia Commons）",
        "method": "page-scoped 三方比對（wikisource × OCR-B × OCR-C，限定 cand_pages；2-gram ≥0.9/句）",
        "witness_semantics": {
            "ocr_b": "pdf-ocr transcription path of NLC PDF",
            "ocr_c": "autoglm transcription path of NLC PDF",
            "ocr_b_c_relation": "same_source_two_paths（同一 NLC 影像的兩條 transcription path，非獨立 textual witness）",
            "wikisource_independence": "unproven",
            "textual_witness_count": 1,
        },
        "transcription_grade": grade_cnt,
        "textual_witness_confidence": "single_witness_not_verified（全部 100 籤）",
        "total": len(results),
        "results": results,
    }
    json.dump(report, open(OUT_REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# 關帝百籤 transcription verification v4（福 re-gate 修正版）\n\n")
        f.write("- witness 語義：OCR-B/OCR-C 為同一 NLC 影像的兩條 transcription path（非獨立 textual witness）；wikisource 底本獨立性未證明\n")
        f.write("- textual_witness_confidence：全部 `single_witness_not_verified`（不稱 VERIFIED）\n")
        f.write("- matching：page-scoped（限定 cand_pages）、不 normalize □、不併 裡/裏/里\n\n")
        f.write(f"## transcription_grade 分布\n\n")
        for g in ("A", "B", "LOW"):
            nums = [r["slip_number"] for r in results if r["transcription_grade"] == g]
            f.write(f"- **{g}**（{len(nums)}）：{','.join(map(str, nums))}\n")
        f.write("\n## line-level UNRESOLVED 清單\n\n")
        f.write("| # | 籤 | 未確認句 |\n|---|---|---|\n")
        for r in results:
            for ul in r["line_unresolved"]:
                f.write(f"| {r['slip_number']} | {r['original_slip_label']} | {ul} |\n")

    # verified slips 版本（DRAFT）
    verified_slips = {"schema_version": "0.2",
                      "purpose": slips_doc.get("purpose", "") + "（v4 transcription verification 草案，待福 review）",
                      "note": "transcription_grade A/B/LOW（transcription path 層級）；textual_witness_confidence 全部 single_witness_not_verified；line-level UNRESOLVED 記錄於 notes。",
                      "corpus_id": "guandi", "slips": []}
    for r in results:
        orig = next(s for s in slips if s["slip_number"] == r["slip_number"])
        orig["transcription_status"] = r["transcription_status"]
        orig["transcription_grade"] = r["transcription_grade"]
        orig["transcription_confidence"] = r["transcription_confidence"]
        orig["textual_witness_confidence"] = r["textual_witness_confidence"]
        orig["source_locator"] = r["source_locator"]
        if r["notes"]:
            orig["notes"] = r["notes"]
        verified_slips["slips"].append(orig)
    json.dump(verified_slips, open(OUT_SLIPS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # evidence manifest
    with open(OUT_MANIFEST, "w", encoding="utf-8") as f:
        f.write("# 關帝百籤 — External Evidence Manifest\n\n")
        f.write("## Production Witness\n\n")
        f.write("- **PDF**：`File:NLC892-411999005947-9653 道藏 第4379冊.pdf`（中國國圖藏《道藏》第4379冊）\n")
        f.write("- **URL**：https://commons.wikimedia.org/wiki/File:NLC892-411999005947-9653_%E9%81%93%E8%97%8F_%E7%AC%AC4379%E5%86%8A.pdf\n")
        f.write("- **下載**：`curl -L -o daozang_4379.pdf '<Special:FilePath 直鏈>'`（17MB，94 頁）\n")
        f.write("- **內容**：《護國嘉濟江東王靈籤》全本（宋濂碑文 p2–11＋籤詩 p12–94）；頁碼對應 100 籤見 `slip_page_map.json`\n\n")
        f.write("## OCR 重跑方式\n\n")
        f.write("1. 頁面 PNG：`python3 -c \"import fitz; ...get_pixmap(dpi=200)\"`（PyMuPDF）\n")
        f.write("2. OCR-B：`pdf-ocr`（autoclaw-pdf-ocr skill）`--pages 12-60` 與 `61-94`，輸出 combined.txt\n")
        f.write("3. OCR-C：`autoglm image-recognition`（prompt 見 verify script 說明），upload-mix 上傳頁面 PNG 後辨識\n")
        f.write("4. 比對：`python3 verify_guandi_daozang.py <repo_root>`（page-scoped，cand_pages 限制）\n\n")
        f.write("## 本機檔案與 repo 的關係\n\n")
        f.write("- repo 只含 OCR 輸出（`ocr/` 下 combined.txt 與 jsonl）與工具；**不包含 PDF 本體與頁面 PNG**（17MB+，不入 repo）\n")
        f.write("- 重跑需先依本 manifest 下載 PDF；OCR 輸出已提交可稽核\n")
    print(f"寫出：{OUT_REPORT}\n      {OUT_MD}\n      {OUT_SLIPS}\n      {OUT_MANIFEST}")


if __name__ == "__main__":
    main()
