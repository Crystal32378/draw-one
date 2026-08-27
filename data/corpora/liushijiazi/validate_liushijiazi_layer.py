#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""六十甲子 interpretation layer automated data gate（adapter from 觀音版）。

  A1  character coverage — verbatim 每個字必須在 per-slip source（OCR full）字元集內
  A1b segment trace     — 所有 ≥2 字片段必須是 per-slip source 的 substring（防 cross-slip 拼裝）
  A2  cross-slip check  — verbatim 片段不得出現在其他籤的 source 而未在本籤 source（防錯籤污染）
  A3  uncertainty       — UNRESOLVED：textual 必含 □；structural 可無 □（note 需標 structural）
  A4  structure         — 60 籤、每籤 6 筆、欄位齊全、layer_class 一致
  A5  encoding          — 無 U+FFFD / mojibake / 異常控制字符

用法：python3 validate_liushijiazi_layer.py [work_dir]
exit 0 = PASS；exit 1 = FAIL
"""
import json
import os
import re
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
if len(sys.argv) > 1:
    WORK = sys.argv[1]
else:
    WORK = HERE
LAYER = os.path.join(WORK, "liushijiazi_interpretation_layer.json")
SRC = os.path.join(WORK, "liushijiazi_source_texts.json")

PUNCT = set('。，、；：！？．·「」『』（）()□　「」【】*#-—_')
EXPECTED_FIELDS = ["卦名", "五行方位", "聖意", "籤解", "卦運勢", "籤閣聖意"]


def normalize(s):
    # 繁簡映射（gate 判等用，不改變 verbatim）
    m = {'為':'为','換':'换','緣':'缘','達':'达','顯':'显','從':'从','諸':'诸','現':'现','誠':'诚',
         '時':'时','來':'来','觀':'观','報':'报','與':'与','飛':'飞','萬':'万','說':'说','話':'话',
         '頭':'头','長':'长','門':'门','過':'过','邊':'边','還':'还','難':'难','對':'对','無':'无',
         '開':'开','關':'关','裡':'里','後':'后','會':'会','動':'动','發':'发','風':'风','龍':'龙',
         '鳳':'凤','黃':'黄','齊':'齐','體':'体','點':'点','這':'这','進':'进','遠':'远','處':'处',
         '讓':'让','見':'见','學':'学','東':'东','經':'经','濟':'济','統':'统','結':'结','構':'构',
         '計':'计','設':'设','實':'实','驗':'验','證':'证','據':'据','資':'资','數':'数','號':'号',
         '機':'机','電':'电','腦':'脑','網':'网','絡':'络','態':'态','區':'区','別':'别','國':'国',
         '際':'际','權':'权','繫':'系','聯':'联','歸':'归','變':'变','舊':'旧','寧':'宁','寫':'写',
         '讀':'读','聞':'闻','問':'问','間':'间','寶':'宝','禱':'祷','靈':'灵','籤':'签','廟':'庙',
         '應':'应','議':'议','訟':'讼','財':'财','禍':'祸','福':'福','祿':'禄','親':'亲','遲':'迟',
         '謀':'谋','勝':'胜','負':'负','紙':'纸','畫':'画','馬':'马','車':'车','燈':'灯','滅':'灭',
         '煙':'烟','塵':'尘','鄉':'乡','靜':'静','還':'还','體':'体','餘':'余','幹':'干','臺':'台',
         '醫':'医','藥':'药','單':'单','雙':'双','嚴':'严','準':'准','滿':'满','澤':'泽','湯':'汤',
         '貴':'贵','買':'买','賣':'卖','陽':'阳','陰':'阴','隱':'隐','雖':'虽','隨':'随','雜':'杂',
         '離':'离','難':'难','雲':'云','電':'电','雷':'雷','霧':'雾','露':'露','頑':'顽','順':'顺',
         '預':'预','頌':'颂','頓':'顿','預':'预','頗':'颇','頻':'频','頭':'头','題':'题','願':'愿',
         '類':'类','響':'响','頂':'顶','魚':'鱼','鳥':'鸟','鳳':'凤','鴻':'鸿','鵬':'鹏','鶴':'鹤',
         '點':'点','齡':'龄','齒':'齿','齋':'斋'}
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


def main():
    layer = json.load(open(LAYER, encoding='utf-8'))
    src = json.load(open(SRC, encoding='utf-8'))
    entries = layer['entries']
    failures = []

    # A4 結構
    slips = sorted(set(e['slip_no'] for e in entries))
    if slips != list(range(1, 61)):
        failures.append(('A4', '籤號不連續', str(slips[:8])))
    per_slip_fields = {}
    for e in entries:
        per_slip_fields.setdefault(e['slip_no'], []).append(e['field_type'])
    for n in range(1, 61):
        fs = per_slip_fields.get(n, [])
        missing = [f for f in EXPECTED_FIELDS if f not in fs]
        if missing:
            failures.append(('A4', f'#{n} 缺欄位', ','.join(missing)))
    REQ = ['corpus', 'slip_no', 'ganzhi', 'edition', 'field_type', 'verbatim_text',
           'source_locator', 'transcription_status', 'layer_class', 'variants_or_notes']
    for e in entries:
        for k in REQ:
            if k not in e:
                failures.append(('A4', f'#{e["slip_no"]} 缺欄位', k))
        if e.get('layer_class') != 'living_tradition':
            failures.append(('A4', f'#{e["slip_no"]} layer_class 異常', e.get('layer_class')))
        if e.get('transcription_status') not in ('PROBABLE', 'UNRESOLVED'):
            failures.append(('A4', f'#{e["slip_no"]} status 異常', e.get('transcription_status')))

    # A5 encoding
    for e in entries:
        if has_mojibake(e['verbatim_text']) or has_mojibake(e['variants_or_notes'] or ''):
            failures.append(('A5', f'#{e["slip_no"]} mojibake', repr(e['verbatim_text'][:20])))

    # per-slip source（A1/A1b/A2）
    src_norm = {}
    for n, s in src.items():
        full = (s.get('ocr_full') or '') + (s.get('poem') or '')
        src_norm[int(n)] = normalize(strip_punct(full))

    # 短欄位做 A1b/A2 segment trace；聖意為直排亂序 raw，只做 A1 字元集（對齊觀音層）
    TRACE_FIELDS = ["卦名", "五行方位", "籤解", "卦運勢", "籤閣聖意"]

    for e in entries:
        n = e['slip_no']
        vt = e['verbatim_text']
        s = src_norm.get(n, '')
        vn = normalize(strip_punct(vt).replace('□', ''))

        # A1 character coverage（所有欄位）
        source_chars = set(s)
        verb_chars = set(vn)
        orphan = [ch for ch in verb_chars if ch not in source_chars]
        if orphan:
            failures.append(('A1', f'#{n} {e["field_type"]} 有字不在本籤 source 字元集', ''.join(orphan)))

        if e['field_type'] in TRACE_FIELDS:
            # A1b segment trace（≥2 字片段必須在本籤 source substring）
            for seg in re.split('[□。，、；：！？．·]', vn):
                if len(seg) >= 2 and seg not in s:
                    failures.append(('A1b', f'#{n} {e["field_type"]} 片段不在本籤 source', seg))

            # A2 cross-slip check（片段不得只出現在他籤）
            if vn:
                for seg in re.split('[□。，、；：！？．·]', vn):
                    if len(seg) >= 4 and seg not in s:
                        others = [m for m, os_ in src_norm.items() if m != n and seg in os_]
                        if others:
                            failures.append(('A2', f'#{n} 片段疑來自他籤 {others}', seg))

        # A3 uncertainty
        if e['transcription_status'] == 'UNRESOLVED':
            note = e['variants_or_notes'] or ''
            has_box = '□' in vt
            is_structural = any(k in note for k in ('structural', '格式', '欄位', '缺欄', 'OCR 未輸出'))
            if not has_box and not is_structural:
                failures.append(('A3', f'#{n} {e["field_type"]} UNRESOLVED 無 □ 且非 structural', vt[:20]))

    # 統計
    pro = [e for e in entries if e['transcription_status'] == 'PROBABLE']
    unr = [e for e in entries if e['transcription_status'] == 'UNRESOLVED']
    by_field = {}
    for e in entries:
        by_field.setdefault(e['field_type'], [0, 0])
        if e['transcription_status'] == 'PROBABLE':
            by_field[e['field_type']][0] += 1
        else:
            by_field[e['field_type']][1] += 1
    print(f"總 entries {len(entries)}：PROBABLE {len(pro)} / UNRESOLVED {len(unr)}")
    for f in EXPECTED_FIELDS:
        p, u = by_field.get(f, (0, 0))
        print(f"  {f}: PROBABLE {p} / UNRESOLVED {u}")

    if failures:
        print(f'\n❌ GATE FAIL — {len(failures)} 違規：')
        for a, where, detail in failures[:60]:
            print(f'  [{a}] {where}: {detail}')
        if len(failures) > 60:
            print(f'  ... 另 {len(failures) - 60} 筆')
        sys.exit(1)
    print('\n✅ GATE PASS — A1 / A1b / A2 / A3 / A4 / A5 全部通過')
    sys.exit(0)


if __name__ == '__main__':
    main()
