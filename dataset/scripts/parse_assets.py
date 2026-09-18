# -*- coding: utf-8 -*-
"""Parse the SAP asset register rows into detail records plus the report's own subtotals.

The report is printed as 13 consecutive runs, one per asset category. Inside a run the
grouping is พื้นที่ > หมวดสินทรัพย์ > ศูนย์ต้นทุน and every subtotal line is printed
*after* the detail rows it covers, so attribution is done by look-ahead.
"""
import os, re, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'asset_rows.tsv')

AMT = r'-?\d{1,3}(?:,\d{3})*\.\d{2}'
# SAP prints ############## when a value overflows the printed column width
AMT3 = r'(' + AMT + r'|#+) (' + AMT + r'|#+) (' + AMT + r'|#+)'
DETAIL = re.compile(r'^(\d{12}) (\d{4}) (\d{2}\.\d{2}\.\d{4})\s*(.*) ' + AMT3 + r'\s*(.*)$')
GROUP = re.compile(r'^(รหัสศูนย์ต้นทุน|หมวดสินทรัพย์|รหัสพื้นที่|รหัสหน่วยงาน) (\d+) (.*?) ' + AMT3 + r'$')
NOISE = re.compile(r'^(รายงานสินทรัพย์คงเหลือ|รายงาน ณ วันที่|Report date|Report time|สินทรัพย์ เลขที่ย่อย)')
KEY = {'รหัสศูนย์ต้นทุน': 'cost_center', 'หมวดสินทรัพย์': 'category',
       'รหัสพื้นที่': 'area', 'รหัสหน่วยงาน': 'org'}


def amt(s):
    if s.startswith('#'):
        return None          # value overflowed the column in the source report
    return float(s.replace(',', ''))


def read_lines():
    """Yield (page, text); physical lines with no page prefix are wrapped text."""
    out = []
    for raw in open(SRC, encoding='utf-8'):
        raw = raw.rstrip('\n')
        if '\t' in raw and raw.split('\t', 1)[0].isdigit():
            pg, txt = raw.split('\t', 1)
            out.append([int(pg), txt])
        elif out:
            out[-1][1] = (out[-1][1] + ' ' + raw).strip()
    return out


SPLITNUM = re.compile(r'(\d) ([,.]\d)')
STRICT = re.compile(r'^-?\d{1,3}(?:,\d{3})*\.\d{2}$')
JOINABLE = re.compile(r'(?<![\d,])(\d[\d,]*) (\d[\d,]*\.\d{2})(?![\d])')


def balanced(m):
    a, d, n = (amt(x) for x in m.group(5, 6, 7))
    return None not in (a, d, n) and abs(a + d - n) <= 0.02


def repair(txt, m):
    """A money column can be split by a stray space ("5,49 5.00").

    Rejoin it only where the result is a well-formed amount *and* it makes the row
    satisfy acquisition + accumulated depreciation = net book value.
    """
    for j in JOINABLE.finditer(txt):
        joined = j.group(1) + j.group(2)
        if not STRICT.match(joined):
            continue
        cand = txt[:j.start()] + joined + txt[j.end():]
        m2 = DETAIL.match(cand)
        if m2 and balanced(m2):
            return cand, m2
    return txt, m
GLUED = re.compile(r'(\.\d{2})([฀-๿]+)(?=\s)')


def parse():
    details, subtotals, unmatched = [], [], []
    pending = []                       # detail rows not yet attributed
    section = 0                        # which of the 13 category runs we are in
    for pg, txt in read_lines():
        if NOISE.match(txt):
            continue
        g2 = GLUED.search(txt)
        if g2:                             # description text glued onto a money column
            txt = GLUED.sub(lambda mm: mm.group(1), txt) + ' ' + g2.group(2)
        txt = SPLITNUM.sub(r'\1\2', txt)   # "136 ,800.00" -> "136,800.00"
        m = DETAIL.match(txt)
        if m and not balanced(m):
            txt, m = repair(txt, m)
        if m:
            aid, sub, dt, desc, a, d, n, tail = m.groups()
            if tail:
                desc = (desc + ' ' + tail).strip()   # description wrapped past the money columns
            rec = {'page': pg, 'section': section, 'asset_id': aid, 'sub_no': sub,
                   'cap_date': dt, 'desc': desc.strip(), 'acq': amt(a), 'dep': amt(d),
                   'nbv': amt(n), 'cost_center': None, 'cost_center_name': None,
                   'category': None, 'category_name': None, 'area': None, 'area_name': None}
            pending.append(rec)
            details.append(rec)
            continue
        g = GROUP.match(txt)
        if g:
            kind, code, name, a, d, n = g.groups()
            k = KEY[kind]
            subtotals.append({'page': pg, 'section': section, 'kind': k, 'code': code,
                              'name': name.strip(), 'acq': amt(a), 'dep': amt(d), 'nbv': amt(n)})
            if k == 'org':
                section += 1
                pending = []
            else:
                for r in pending:
                    if r[k] is None:
                        r[k] = code
                        r[k + '_name'] = name.strip()
                if k == 'area':
                    pending = [r for r in pending if r['area'] is None]
            continue
        unmatched.append((pg, txt))
    return details, subtotals, unmatched


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    det, sub, un = parse()
    print('details', len(det), 'subtotals', len(sub), 'unmatched', len(un))
    for u in un[:20]:
        print('  UNMATCHED p%d %r' % u)
    miss = [r for r in det if not (r['cost_center'] and r['category'] and r['area'])]
    print('details missing a group key:', len(miss))
    for r in miss[:5]:
        print('   ', r['page'], r['asset_id'], r['cost_center'], r['category'], r['area'])
    json.dump({'details': det, 'subtotals': sub},
              open(os.path.join(HERE, 'assets_parsed.json'), 'w', encoding='utf-8'),
              ensure_ascii=False)
