# -*- coding: utf-8 -*-
"""從 page_ocr 提取每籤自己的 page 解曰片段（per-slip evidence）。

解決 cross-slip false pass：A1b 不得用 whole-page page_ocr 當 per-slip evidence。
本腳本從每籤 page_ocr 提取「該籤自己的解曰行」，去掉結尾標記，輸出 normalized 片段。
匹配原則：候選行與該籤 verbatim（去標點去□）共享字符最多；低分視為無可靠 page 片段（null）。

輸出 per_slip_page_jie.json：{slip_no: normalized片段 或 null}
"""
import json, sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from validate_interpretation_layer import FAN2JIAN, normalize, strip_punct

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'source_three_way.json')
LAYER = os.path.join(HERE, 'interpretation_layer.json')
OUT = os.path.join(HERE, 'per_slip_page_jie.json')

ENDS = ('此籤', '此鼔', '此籖', '此箴', '此跡', '此截', '此幾', '此果', '此乃', '此戰',
        '此簽', '此藏', '此签', '此箝')

def candidates_from_page(poc):
    out = []
    for l in [x.strip() for x in poc.split('\n') if x.strip()]:
        if not (8 <= len(l) <= 30):
            continue
        if any(k in l for k in ('龍山寺', '觀世音', '台北', '艋舺', '籤靈音世觀')):
            continue
        zx = l.find('之象')
        if zx != -1 and zx < 8 and '凡事' in l:  # 純象註行（「之象」在前 8 字）
            continue
        out.append(l)
    return out

def strip_ends(s):
    for e in ENDS:
        if s.endswith(e):
            return s[:-len(e)]
    idx = s.rfind('之象')
    if idx > len(s) // 2:  # 「之象」在後半部 = 象註混入，截斷
        return s[:idx]
    return s

def main():
    src = {x['slip_no']: x for x in json.load(open(SRC, encoding='utf-8'))}
    layer = json.load(open(LAYER, encoding='utf-8'))
    vt = {x['slip_no']: x['verbatim_text'] for x in layer['entries'] if x['field_type'] == '解曰'}

    result = {}
    for n in range(1, 101):
        vt_n = normalize(strip_punct(vt[n]).replace('□', ''))
        cand = candidates_from_page(src[n]['page_ocr'])
        best, best_score = None, -1
        for c in cand:
            c_n = normalize(strip_punct(c))
            score = len(set(c_n) & set(vt_n))
            if score > best_score:
                best_score, best = score, c_n
        if best is not None and best_score >= 6:
            result[str(n)] = strip_ends(best)
        else:
            result[str(n)] = None

    json.dump(result, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    missing = [n for n, v in result.items() if v is None]
    print(f'per_slip_page_jie.json 生成，缺失 {len(missing)} 籤: {sorted(map(int, missing))}')

if __name__ == '__main__':
    main()
