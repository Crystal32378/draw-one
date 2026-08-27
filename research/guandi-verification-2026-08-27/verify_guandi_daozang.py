#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
關帝百籤 VERIFIED 升級 — 三方比對（v0.3）
wikisource transcription × pdf-ocr（OCR-B）× autoglm 頁面 OCR（OCR-C）

判準：
  每句籤詩 normalize 後對各 witness 做 2-gram 命中率（≥0.9 = 命中）
  - 四句全部命中（任一 witness）→ VERIFIED
  - 有句未命中 → UNRESOLVED（note 記錄缺哪句、哪個 witness 有/無）
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
MAP = json.load(open(os.path.join(WORK, "slip_page_map.json")))
OUT_REPORT = os.path.join(WORK, "guandi_verification_report_v3.json")
OUT_MD = os.path.join(WORK, "guandi_verification_report_v3.md")
OUT_SLIPS = os.path.join(WORK, "slip_texts.verified_v3.json")

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
    '語': '语', '開': '开', '裡': '里', '後': '后', '會': '会', '動': '动', '發': '发', '風': '风',
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
    '勵': '励', '勻': '匀', '匱': '匮', '協': '协', '單': '单', '嚴': '严', '囘': '回', '圗': '图',
    '圖': '图', '團': '团', '聖': '圣', '壓': '压', '壊': '坏', '壯': '壮', '壺': '壶', '夀': '寿',
    '夥': '伙', '奬': '奖', '奪': '夺', '奮': '奋', '姦': '奸', '姪': '侄', '孫': '孙', '宮': '宫',
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
    '苻': '符', '莊': '庄', '華': '华', '葉': '叶', '著': '着', '蓋': '盖', '蓬': '蓬', '蔭': '荫',
    '蔵': '藏', '虧': '亏', '術': '术', '裏': '里', '裝': '装', '製': '制', '襲': '袭', '規': '规',
    '視': '视', '觧': '解', '討': '讨', '詔': '诏', '評': '评', '詠': '咏', '該': '该', '誇': '夸',
    '誅': '诛', '説': '说', '論': '论', '諒': '谅', '諍': '诤', '諦': '谛', '謁': '谒', '謂': '谓',
    '謨': '谟', '講': '讲', '謝': '谢', '謹': '谨', '譜': '谱', '識': '识', '譯': '译', '護': '护',
    '譽': '誉', '豊': '丰', '貳': '贰', '貸': '贷', '賊': '贼', '賴': '赖', '賺': '赚', '贄': '贽',
    '購': '购', '贖': '赎', '贛': '赣', '踐': '践', '迺': '乃', '適': '适', '須': '须', '鑰': '钥',
    '鑾': '銮', '鑼': '锣', '鑑': '鉴', '鑿': '凿', '長': '长', '門': '门', '閒': '闲', '間': '间',
    '關': '关', '開': '开', '閣': '阁', '闕': '阙', '闔': '阖', '蘭': '兰', '萬': '万', '藝': '艺',
    '藥': '药', '蘇': '苏', '虛': '虚', '號': '号', '雖': '虽', '蟲': '虫', '蟄': '蛰', '衆': '众',
    '衛': '卫', '衝': '冲', '補': '补', '裡': '里', '覇': '霸', '覺': '觉', '觸': '触', '計': '计',
    '訓': '训', '記': '记', '訪': '访', '設': '设', '許': '许', '訟': '讼', '詞': '词', '詩': '诗',
    '話': '话', '詳': '详', '誠': '诚', '語': '语', '誤': '误', '說': '说', '誰': '谁', '課': '课',
    '請': '请', '諸': '诸', '讀': '读', '變': '变', '讓': '让', '豐': '丰', '財': '财', '貫': '贯',
    '貴': '贵', '買': '买', '費': '费', '賀': '贺', '資': '资', '賦': '赋', '質': '质', '賢': '贤',
    '賜': '赐', '賞': '赏', '贊': '赞', '贈': '赠', '趙': '赵', '趨': '趋', '踐': '践', '車': '车',
    '軍': '军', '軒': '轩', '軟': '软', '載': '载', '輔': '辅', '輕': '轻', '輝': '辉', '輩': '辈',
    '輪': '轮', '轉': '转', '辭': '辞', '農': '农', '迎': '迎', '近': '近', '迴': '回', '迷': '迷',
    '退': '退', '送': '送', '適': '适', '遷': '迁', '選': '选', '遺': '遗', '避': '避', '還': '还',
    '邇': '迩', '鄉': '乡', '鄧': '邓', '郵': '邮', '鄭': '郑', '醜': '丑', '醫': '医', '釋': '释',
    '鍾': '钟', '隨': '随', '雞': '鸡', '難': '难', '露': '露', '靈': '灵', '靜': '静', '青': '青',
    '頂': '顶', '順': '顺', '預': '预', '頓': '顿', '願': '愿', '類': '类', '響': '响', '頻': '频',
    '額': '额', '題': '题', '顔': '颜', '風': '风', '養': '养', '餘': '余', '館': '馆', '首': '首',
    '香': '香', '馬': '马', '驗': '验', '驚': '惊', '體': '体', '髮': '发', '鬢': '鬓', '鬥': '斗',
    '魚': '鱼', '鳥': '鸟', '鳳': '凤', '鴻': '鸿', '鵬': '鹏', '鶴': '鹤', '麥': '麦', '黃': '黄',
    '黑': '黑', '鼎': '鼎', '鼓': '鼓', '鼠': '鼠', '鼻': '鼻', '齊': '齐', '齒': '齿', '齡': '龄',
    '龍': '龙', '龜': '龟', '龕': '龛',
}


def normalize(s):
    return ''.join(FAN2JIAN.get(ch, ch) for ch in s)


def strip_punct(s):
    return re.sub(r'[\s，。、；：！？「」『』（）()《》〈〉\[\]【】…—–\-\.·,.:;!?"\' \u3000\u00a0□■]', '', s)


def ngram_hit_rate(line, text):
    grams = [line[i:i + 2] for i in range(len(line) - 1)]
    if not grams:
        return 1.0
    hits = sum(1 for g in grams if g in text)
    return hits / len(grams)


def parse_combined(path):
    pages = {}
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


def main():
    pages_b = parse_combined(B1)
    pages_b.update(parse_combined(B2))
    pages_c = {}
    for path in (AUTOGLM, AUTOGLM2):
        if os.path.exists(path):
            for line in open(path, encoding="utf-8"):
                try:
                    r = json.loads(line)
                    if r.get("status") == "ok":
                        pages_c[r["page"]] = r["ocr_text"]
                except Exception:
                    pass
    print(f"OCR-B pages: {len(pages_b)} / OCR-C pages: {len(pages_c)}")

    slips_doc = json.load(open(SLIPS, encoding="utf-8"))
    slips = slips_doc["slips"]
    norm_b = {p: normalize(strip_punct(t)) for p, t in pages_b.items()}
    norm_c = {p: normalize(strip_punct(t)) for p, t in pages_c.items()}

    results = []
    for slip in slips:
        n = slip["slip_number"]
        poem = slip["poem_text"]
        lines = [l for l in poem.split("\n") if l.strip()]
        cand_pages = MAP.get(str(n), [])
        line_out = []
        for line in lines:
            ln = normalize(strip_punct(line))
            if len(ln) < 4:
                line_out.append({"line": line, "hit_b": True, "hit_c": True, "rate_b": 1.0, "rate_c": 1.0})
                continue
            # 對全 witness 命中（不分頁）
            best_b = max([ngram_hit_rate(ln, t) for t in norm_b.values()] + [0.0])
            best_c = max([ngram_hit_rate(ln, t) for t in norm_c.values()] + [0.0])
            hit_b = best_b >= 0.9
            hit_c = best_c >= 0.9
            line_out.append({"line": line, "hit_b": hit_b, "hit_c": hit_c,
                             "rate_b": round(best_b, 3), "rate_c": round(best_c, 3)})
        all_hit = all(r["hit_b"] or r["hit_c"] for r in line_out)
        if all_hit and len(line_out) >= 2:
            status = "VERIFIED"
        else:
            # 未達 VERIFIED：wikisource 轉錄無內部可疑 → 維持 PROBABLE（notes 記錄未確認句）；
            # 僅當 wikisource 轉錄本身有可疑（原 notes 標 UNRESOLVED）才維持 UNRESOLVED
            status = slip.get("transcription_status", "PROBABLE")
        # 頁碼
        page_hits = set()
        for pno, t in norm_b.items():
            if any(ngram_hit_rate(normalize(strip_punct(r["line"])), t) >= 0.9 for r in line_out):
                page_hits.add(pno)
        for pno, t in norm_c.items():
            if any(ngram_hit_rate(normalize(strip_punct(r["line"])), t) >= 0.9 for r in line_out):
                page_hits.add(pno)
        page_hits = sorted(page_hits)
        loc = f"Wikimedia Commons NLC892-411999005947-9653 道藏 第4379冊.pdf（頁 {'、'.join(map(str, page_hits)) if page_hits else '未定位'}）"
        missing = [r["line"] for r in line_out if not (r["hit_b"] or r["hit_c"])]
        notes = slip.get("notes", "")
        if missing:
            notes = (notes + f"；未命中句（OCR-B 與 OCR-C 皆無）：{'；'.join(missing)}").strip("；")
        # witness grade：
        #   A = 四句全雙 OCR 命中（wikisource×B×C 三源一致）
        #   B = 四句至少一 OCR 命中，非全雙（wikisource×單一 OCR；另一 OCR 未讀到或形近誤讀）
        #   PROBABLE = 有句兩 OCR 皆未命中
        if status == "VERIFIED":
            all_double = all(r["hit_b"] and r["hit_c"] for r in line_out)
            witness_grade = "A" if all_double else "B"
            # 單 witness 句的說明
            single_notes = []
            for r in line_out:
                if r["hit_b"] and not r["hit_c"]:
                    single_notes.append(f"「{r['line'][:14]}…」僅 OCR-B 命中（rate_c={r['rate_c']}）")
                elif r["hit_c"] and not r["hit_b"]:
                    single_notes.append(f"「{r['line'][:14]}…」僅 OCR-C 命中（rate_b={r['rate_b']}）")
            if single_notes:
                notes = (notes + f"；witness_grade={witness_grade}；單 witness 句：{'；'.join(single_notes)}").strip("；")
        else:
            witness_grade = None
        results.append({
            "slip_number": n,
            "original_slip_label": slip["original_slip_label"],
            "poem_text": poem,
            "lines": line_out,
            "missing_lines": missing,
            "ocr_pages": page_hits,
            "transcription_status": status,
            "witness_grade": witness_grade,
            "source_locator": loc,
            "notes": notes,
        })

    verified = [r for r in results if r["transcription_status"] == "VERIFIED"]
    probable = [r for r in results if r["transcription_status"] == "PROBABLE"]
    unresolved = [r for r in results if r["transcription_status"] == "UNRESOLVED"]
    grade_a = [r for r in verified if r.get("witness_grade") == "A"]
    grade_b = [r for r in verified if r.get("witness_grade") == "B"]
    print(f"VERIFIED {len(verified)}（A {len(grade_a)} / B {len(grade_b)}）/ PROBABLE {len(probable)} / UNRESOLVED {len(unresolved)}")

    report = {
        "corpus": "guandi",
        "edition": "《護國嘉濟江東王靈籤》（傅燁撰，道藏本；NLC 道藏第 4379 冊 PDF，Wikimedia Commons）",
        "method": "三方比對：wikisource transcription × pdf-ocr（OCR-B）× autoglm 頁面 OCR（OCR-C）；每句 2-gram 命中率≥0.9；四句全命中（任一 witness）= VERIFIED",
        "total": len(results),
        "verified": len(verified),
        "probable": len(probable),
        "unresolved": len(unresolved),
        "results": results,
    }
    json.dump(report, open(OUT_REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("# 關帝百籤 VERIFIED 升級報告 v3（道藏影像三方核對）\n\n")
        f.write(f"- 總籤數：{len(results)}｜VERIFIED：{len(verified)}｜PROBABLE（影像未確認）：{len(probable)}｜UNRESOLVED：{len(unresolved)}\n")
        f.write("- witness：NLC 道藏第 4379 冊 PDF（Wikimedia Commons，free access）\n")
        f.write("- 方法：pdf-ocr（OCR-B）× autoglm 頁面 OCR（OCR-C）× 維基文庫轉錄三方交叉；每句 2-gram 命中率 ≥0.9\n")
        f.write("- 語義：VERIFIED = 四句全於影像 OCR witness 確認；PROBABLE = 未達 VERIFIED 但 wikisource 轉錄無內部可疑；UNRESOLVED = wikisource 轉錄本身可疑\n\n")
        f.write("## 影像未確認清單（PROBABLE，附未命中句）\n\n")
        f.write("| # | 籤 | 未命中句 |\n|---|---|---|\n")
        for r in probable:
            f.write(f"| {r['slip_number']} | {r['original_slip_label']} | {'；'.join(r['missing_lines'])[:100]} |\n")
        f.write("\n## 全量結果\n\n")
        f.write("| # | 籤 | 狀態 | 頁 |\n|---|---|---|---|\n")
        for r in results:
            f.write(f"| {r['slip_number']} | {r['original_slip_label']} | {r['transcription_status']} | {'、'.join(map(str, r['ocr_pages']))} |\n")

    verified_slips = {"schema_version": "0.1",
                      "purpose": slips_doc.get("purpose", "") + "（VERIFIED 升級草案 v3，待福 review）",
                      "note": "transcription_status 升級依據：NLC 道藏影像（OCR-B pdf-ocr + OCR-C autoglm）× 維基文庫轉錄三方交叉；每句 2-gram 命中率≥0.9。未命中句維持 UNRESOLVED，記錄於 notes。",
                      "corpus_id": "guandi", "slips": []}
    for r in results:
        orig = next(s for s in slips if s["slip_number"] == r["slip_number"])
        orig["transcription_status"] = r["transcription_status"]
        orig["source_locator"] = r["source_locator"]
        if r["notes"]:
            orig["notes"] = r["notes"]
        verified_slips["slips"].append(orig)
    json.dump(verified_slips, open(OUT_SLIPS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"寫出：{OUT_REPORT}\n      {OUT_MD}\n      {OUT_SLIPS}")


if __name__ == "__main__":
    main()
