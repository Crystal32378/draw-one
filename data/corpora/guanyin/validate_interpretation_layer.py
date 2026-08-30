# -*- coding: utf-8 -*-
"""觀音 interpretation layer automated data gate。

把 authority hierarchy 變成機器可抓的 contract：
  A1  character coverage — verbatim 每個字必須在此籤 source（raw ∪ page）字元集內
  A1b segment trace     — UNRESOLVED 的 ≥2 字片段必須是 source 的 substring（防重組拼裝）
  A2  chance isolation  — chance 獨有字不得進 verbatim（chance 只能留 witness）
  A3  uncertainty       — UNRESOLVED：textual 必含 □；structural 可無 □（note 需標 structural）
  A4  structure         — 100 籤、每籤 2 筆、欄位齊全、layer_class 一致
  A5  encoding          — 無 U+FFFD / mojibake / 異常控制字符
  A7  provenance        — manual_image_confirmation/obs 由 manual_confirmation_ledger 重算：
                           不信 entry 自報 boolean；混合人工/OCR 條目必須標 segment_basis_note；
                           source 字元集含四條 path（raw/page-chance/slip_pages 重讀）＋ledger manual spans

用法：python3 validate_interpretation_layer.py
exit 0 = PASS；exit 1 = FAIL（印出違規清單）
"""
import json, sys, re, unicodedata

import os
HERE = os.path.dirname(os.path.abspath(__file__))
LAYER = os.path.join(HERE, 'interpretation_layer.json')
SRC = os.path.join(HERE, 'source_three_way.json')
PER_SLIP = os.path.join(HERE, 'per_slip_page_jie.json')
LEDGER = os.path.join(HERE, 'manual_confirmation_ledger.json')
RECHECK = os.path.join(HERE, 'slip_pages_recheck.jsonl')

PUNCT = set('。，、；：！？．·「」『』（）()□　 ')

# 繁→簡/異體→標準 映射（OCR 輸出繁簡混雜，gate 正規化後只抓語義差異，不誤抓繁簡）
FAN2JIAN = {
    '爲':'为','為':'为','換':'换','緣':'缘','達':'达','逹':'达',
    '穩':'稳','顯':'显','從':'从','諸':'诸','現':'现','誠':'诚','虛':'虚',
    '時':'时','來':'来','觀':'观','報':'报','與':'与','飛':'飞',
    '萬':'万','說':'说','話':'话','頭':'头','長':'长','門':'门',
    '過':'过','邊':'边','還':'还','難':'难','對':'对','語':'语',
    '無':'无','開':'开','關':'关','裡':'里','後':'后','會':'会',
    '動':'动','發':'发','熱':'热','風':'风','龍':'龙','鳳':'凤',
    '黃':'黄','齊':'齐','體':'体','點':'点','這':'这','進':'进',
    '遠':'远','處':'处','讓':'让','見':'见','覺':'觉','學':'学',
    '習':'习','專':'专','業':'业','東':'东','經':'经','濟':'济',
    '統':'统','結':'结','構':'构','計':'计','設':'设','實':'实',
    '驗':'验','證':'证','據':'据','資':'资','數':'数','號':'号',
    '機':'机','電':'电','腦':'脑','網':'网','絡':'络','態':'态',
    '區':'区','別':'别','國':'国','際':'际','權':'权','繫':'系',
    '聯':'联','歸':'归','還':'还','變':'变','舊':'旧','寧':'宁',
    '寫':'写','讀':'读','聞':'闻','問':'问','間':'间','頭':'头',
    '寶':'宝','禱':'祷','靈':'灵','籤':'签','廟':'庙','應':'应',
    '當':'当','當':'当','議':'议','診':'诊','療':'疗','護':'护',
    '訟':'讼','財':'财','病':'病','禍':'祸','福':'福','祿':'禄','蟄':'蛰','蜇':'蛰','晩':'晚',
    '親':'亲','舊':'旧','遲':'迟','疑':'疑','謀':'谋','望':'望',
    '勝':'胜','負':'负','紙':'纸','著':'着','棋':'棋','畫':'画',
    '經':'经','文':'文','食':'食','吞':'吞','針':'针','線':'线',
    '馬':'马','車':'车','路':'路','行':'行','船':'船','風':'风',
    '浪':'浪','靜':'静','待':'待','燈':'灯','火':'火','滅':'灭',
    '煙':'烟','塵':'尘','歸':'归','鄉':'乡','故':'故','人':'人',
}

def normalize(s):
    return ''.join(FAN2JIAN.get(ch, ch) for ch in s)

def strip_punct(s):
    return ''.join(ch for ch in s if ch not in PUNCT and not ch.isspace())

def has_mojibake(s):
    # 常見 mojibake：替換字符、控制字符（排除合法的換行/定位符）
    for ch in s:
        if ch == '\ufffd':
            return True
        if unicodedata.category(ch) == 'Cc' and ch not in '\n\r\t':
            return True
    return False

def main():
    layer = json.load(open(LAYER, encoding='utf-8'))
    src = {x['slip_no']: x for x in json.load(open(SRC, encoding='utf-8'))}
    per_slip_page = json.load(open(PER_SLIP, encoding='utf-8'))
    entries = layer['entries']
    failures = []

    # 載入 manual-confirmation ledger 與 slip_pages 重讀（第四 OCR path）
    ledger = {}
    if os.path.exists(LEDGER):
        for L in json.load(open(LEDGER, encoding='utf-8'))['entries']:
            ledger[L['slip_no']] = L
    recheck_cn = {}
    if os.path.exists(RECHECK):
        for line in open(RECHECK, encoding='utf-8'):
            r = json.loads(line)
            if r.get('status') == 'ok':
                recheck_cn[r['slip_no']] = normalize(re.sub(r'[^\u4e00-\u9fff□]', '', r['ocr_text'] or ''))

    # A4 結構
    slips = sorted(set(e['slip_no'] for e in entries))
    if slips != list(range(1, 101)):
        failures.append(('A4', '籤號不連續', str(slips[:5])))
    for n in slips:
        cnt = sum(1 for e in entries if e['slip_no'] == n)
        if cnt != 2:
            failures.append(('A4', f'#{n} 筆數 != 2', str(cnt)))
    REQ = ['corpus', 'slip_no', 'edition', 'field_type', 'verbatim_text',
           'source_locator', 'transcription_status', 'layer_class', 'variants_or_notes']
    for e in entries:
        for k in REQ:
            if k not in e:
                failures.append(('A4', f'#{e["slip_no"]} 缺欄位', k))
        if e.get('layer_class') != 'living_tradition':
            failures.append(('A4', f'#{e["slip_no"]} layer_class 異常', e.get('layer_class')))

    # A5 encoding（所有 entries，含聖意）
    for e in entries:
        if has_mojibake(e['verbatim_text']) or has_mojibake(e['variants_or_notes'] or ''):
            failures.append(('A5', f'#{e["slip_no"]} mojibake', repr(e['verbatim_text'][:20])))

    # A1/A2/A3/A5 只查解曰（本輪修正範圍）
    for e in entries:
        if e['field_type'] != '解曰':
            continue
        n = e['slip_no']
        vt = e['verbatim_text']
        s = src[n]
        raw = s['raw_jie'] or ''
        page_jie = per_slip_page.get(str(n)) or ''
        chance = s['chance_jie'] or ''

        # A1 character coverage（per-slip source：raw_jie + page + slip_pages 重讀 + ledger manual spans）
        L = ledger.get(n)
        manual_text = normalize(L['manual_confirmed_text']) if L else ''
        source_chars = (set(normalize(strip_punct(raw))) | set(page_jie)
                        | set(recheck_cn.get(n, '')) | set(manual_text))
        verb_chars = set(normalize(strip_punct(vt).replace('□', '')))
        orphan = [ch for ch in verb_chars if ch not in source_chars]
        if orphan:
            failures.append(('A1', f'#{n} verbatim 有字不在此籤 source 字元集', ''.join(orphan)))

        # A2 chance character isolation（chance 獨有字不得進 verbatim）
        chance_unique = set(normalize(strip_punct(chance))) - source_chars
        polluted = [ch for ch in verb_chars if ch in chance_unique]
        if polluted:
            failures.append(('A2', f'#{n} chance 獨有字進 verbatim', ''.join(polluted)))

        # A1b segment-level traceability（per-slip source：raw_jie + page + slip_pages 重讀 + ledger manual spans）
        raw_n = normalize(strip_punct(raw))
        page_n = per_slip_page.get(str(n)) or ''
        recheck_n = recheck_cn.get(n, '')
        manual_n = manual_text
        for seg in re.split('[□。，、；：！？．·]', normalize(vt)):
            if len(seg) >= 2 and seg not in raw_n and seg not in page_n and seg not in recheck_n and seg not in manual_n:
                failures.append(('A1b', f'#{n} 片段不在 source substring', seg))

        # A3 uncertainty（UNRESOLVED：textual 必含 □；structural 可無 □）
        if e['transcription_status'] == 'UNRESOLVED':
            note = e['variants_or_notes'] or ''
            has_box = '□' in vt
            is_structural = any(k in note for k in ('structural', '格式異常', '欄位格式', '欄位歸屬', '詩體'))
            if not has_box and not is_structural:
                failures.append(('A3', f'#{n} UNRESOLVED 無 □ 且非 structural', vt[:20]))

        # A7 provenance（福 re-review：validator 從 ledger 重算 provenance，不信 entry 自報 boolean）
        # ledger 的 all_segments_manual 為 truth（人工校正：□ = variant 保留，非「未讀」）
        # entry 的 mic/obs 必須與 ledger 一致；混合條目必須有 segment_basis_note
        if n in ledger:
            L = ledger[n]
            seg_all_manual = bool(L.get('all_segments_manual'))
            self_mic = e.get('manual_image_confirmation')
            self_obs = e.get('source_observation_status')
            # 一致性檢查 1：mic vs ledger
            if self_mic is not seg_all_manual:
                failures.append(('A7', f'#{n} manual_image_confirmation 與 ledger 不符',
                                 f'entry={self_mic} ledger.all_segments_manual={seg_all_manual}'))
            # 一致性檢查 2：obs vs ledger
            expected_obs = 'human_image_confirmed' if seg_all_manual else 'mixed_manual_ocr'
            if self_obs != expected_obs:
                failures.append(('A7', f'#{n} source_observation_status 與 ledger 不符',
                                 f'entry={self_obs} expected={expected_obs}'))
            # 一致性檢查 3：混合條目必須有 segment_basis_note
            if not seg_all_manual and not e.get('segment_basis_note'):
                failures.append(('A7', f'#{n} 混合條目缺 segment_basis_note', ''))
            # 一致性檢查 4：ledger 的 manual_confirmed_text 必須非空
            if not L.get('manual_confirmed_text', '').strip():
                failures.append(('A7', f'#{n} ledger manual_confirmed_text 空白', ''))
        elif e.get('manual_image_confirmation') is True or e.get('source_observation_status') in (
                'human_image_confirmed', 'mixed_manual_ocr'):
            failures.append(('A7', f'#{n} 聲稱 human confirmed 但 ledger 無此籤', ''))

    # 彙總
    jie = [e for e in entries if e['field_type'] == '解曰']
    jie_un = [e for e in jie if e['transcription_status'] == 'UNRESOLVED']
    jie_pro = [e for e in jie if e['transcription_status'] == 'PROBABLE']
    jie_cand = [e for e in jie if e['transcription_status'] == 'CANDIDATE']
    print(f'解曰 PROBABLE {len(jie_pro)} / CANDIDATE {len(jie_cand)} / UNRESOLVED {len(jie_un)}')

    if failures:
        print(f'\n❌ GATE FAIL — {len(failures)} 違規：')
        for a, where, detail in failures:
            print(f'  [{a}] {where}: {detail}')
        sys.exit(1)
    else:
        print('\n✅ GATE PASS — A1 character coverage / A1b segment trace / A2 chance isolation / '
              'A3 uncertainty(textual|structural) / A4 structure / A5 encoding / A7 provenance(ledger) 全部通過')
        sys.exit(0)

if __name__ == '__main__':
    main()
