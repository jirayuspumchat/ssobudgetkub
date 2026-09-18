# -*- coding: utf-8 -*-
"""Parse the five SSO disbursement PDFs (FY2563-2567) into a hierarchical row list."""
import json, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))

SRC = {
 '2563': ('DOC-BUD-2563', '1.1ผลเบิกจ่ายปี 2563- final.pdf', '2564-01-31', '31 มกราคม 2564'),
 '2564': ('DOC-BUD-2564', '1.2ผลเบิกจ่ายปี 2564 - final.pdf', '2565-01-31', '31 มกราคม 2565'),
 '2565': ('DOC-BUD-2565', '1.3ผลเบิกจ่ายปี 2565 - final.pdf', '2565-12-31', '31 ธันวาคม 2565'),
 '2566': ('DOC-BUD-2566', '1.4ผลเบิกจ่ายปี 2566  final.pdf', '2567-02-29', '29 กุมภาพันธ์ 2567'),
 '2567': ('DOC-BUD-2567', '1.5ผลเบิกจ่ายปี 2567 - final.pdf', '2567-10-31', '31 ตุลาคม 2567'),
}

# an amount always carries a thousands separator or decimals; a bare "2561" is a year, not money
AMT = r'-|\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+\.\d{2}'
TAIL = {n: re.compile(r'\s(' + (r')\s+('.join([AMT] * n)) + r')\s*$') for n in (1, 2, 3)}
CAT_RE = re.compile(r'^(งบบุคลากร|งบดำเนินงาน|งบลงทุน|งบเงินอุดหนุน|งบรายจ่ายอื่น)$')
GROUP_RE = re.compile(r'^(โครงการต่อเนื่อง|รายจ่ายเพื่อบริหารงานประจำ|รายจ่ายเพื่อบริหารงาน)$')
#  "12. ค่าเช่า"  ->  12      |  "5.1 ค่าอบรม" / "5.1. ค่าอบรม"  ->  5.1
NUMITEM_RE = re.compile(r'^(?:(\d+(?:\.\d+)+)\.?|(\d+)\.)\s*(.*)$')
LANDROW = 'รายการที่ดิน/อาคาร/สิ่งก่อสร้าง'
COLS = ['จัดสรร', 'รวมเบิกจ่ายและผูกพัน', 'คงเหลือ']


def to_amount(tok):
    if tok in ('-', '', None):
        return None
    try:
        return float(tok.replace(',', ''))
    except ValueError:
        return None


def band_of(x):
    return 0 if x < 17.0 else 1 if x < 30.0 else 2 if x < 46.0 else 3


def read_rows(yr, pages):
    rows = []
    for pi, pg in enumerate(pages, 1):
        for r in pg:
            lab, nums, x = r['label'].strip(), r['nums'].strip(), r['x']
            if nums in ('จัดสรร รวมเบิกจ่ายและ คงเหลือ', 'ผูกพัน', yr) \
               or lab.startswith('เงินกองทุนเพื่อบริหารงาน') or re.match(r'^(ณ \d|\d+ ณ )', lab) \
               or lab == 'งบรายจ่าย/ประเภทค่าใช้จ่าย':
                continue
            toks = nums.split() if nums else []
            if len(toks) > 3:                 # stray marks in the money columns
                toks = toks[-3:]
            if len(toks) < 3 and lab:         # long labels can overrun the column split
                m = TAIL[3 - len(toks)].search(lab)
                if m:
                    toks = list(m.groups()) + toks
                    lab = lab[:m.start()].strip()
            if lab == '-' and not toks and x > 300:
                continue                      # stray glyph, see data_quality_checks
            if not lab and not toks:
                continue
            rows.append({'page': pi, 'x': x, 'label': lab, 'toks': toks})

    merged = []                               # fold wrapped label lines back together
    for r in rows:
        struct = (NUMITEM_RE.match(r['label']) or r['label'].startswith('-')
                  or CAT_RE.match(r['label']) or GROUP_RE.match(r['label'])
                  or r['label'].startswith('แผนงาน') or r['label'] in ('รวมทั้งสิ้น', LANDROW))
        if not r['toks'] and merged and not struct:
            merged[-1]['label'] = (merged[-1]['label'] + ' ' + r['label']).strip()
        else:
            merged.append(r)
    return merged


def parse_year(yr, pages):
    out = []
    plan = group = cat = exp = ''
    sec_level = 3                              # level of the section the items hang under
    stack = []
    for r in read_rows(yr, pages):
        lab, toks, x = r['label'], r['toks'], r['x']
        band = band_of(x)
        amts = [to_amount(t) for t in (toks + [None, None, None])[:3]]
        prev = out[-1] if out else None
        same_as_prev = bool(prev and toks and [prev['alloc'], prev['spent'], prev['remain']] == amts)
        kind, level, item_no, parent_path = 'item', None, '', ''

        if lab == 'รวมทั้งสิ้น':
            kind, level = 'grand_total', 0
            plan = group = cat = exp = ''
            stack, sec_level = [], 3
        elif lab.startswith('แผนงาน'):
            kind, level, plan, group, cat, exp = 'plan', 1, lab, '', '', ''
            stack, sec_level = [], 3
        elif GROUP_RE.match(lab):
            kind, level, group, cat, exp = 'group', 2, lab, '', ''
            stack, sec_level = [], 3
        elif lab == LANDROW:                   # a sub-section of งบลงทุน, not a sibling
            kind, level, exp = 'expense_category', 4, lab
            stack, sec_level = [], 4
        elif CAT_RE.match(lab):
            kind, level, cat, exp = 'budget_category', 3, lab, ''
            stack, sec_level = [], 3
        elif not NUMITEM_RE.match(lab) and band <= 1 and not same_as_prev:
            kind, level, exp = 'expense_category', 4, lab.lstrip('- ').strip()
            stack, sec_level = [], 4
        else:
            m = NUMITEM_RE.match(lab)
            item_no = (m.group(1) or m.group(2)) if m else ''
            dotted = '.' in item_no
            if same_as_prev and prev['level'] >= 3 and not m and not lab.startswith('-'):
                # an unnumbered heading restating the row above opens a sub-section
                kind, level, exp = 'subsection', prev['level'] + 1, lab
                stack, sec_level = [], prev['level'] + 1
            elif same_as_prev and prev['level'] >= 4 and not m:
                # a "- xxx" line restating the row above: its breakdown, not its sibling
                kind = 'breakdown'
                while stack and stack[-1]['band'] > band:
                    stack.pop()
                parent_path = ' > '.join(e['num'] + '.' for e in stack if e['num'])
                stack.append({'num': '', 'dotted': False, 'band': band, 'level': prev['level'] + 1})
                level = prev['level'] + 1
            else:
                if dotted:
                    prefix = item_no.rsplit('.', 1)[0]
                    while stack and prefix not in (stack[-1]['num'], stack[-1]['num'].rsplit('.', 1)[0]):
                        stack.pop()
                    if stack and stack[-1]['num'] != prefix:
                        stack.pop()          # sibling of an earlier x.y
                else:
                    while stack and (stack[-1]['band'] > band
                                     or (stack[-1]['band'] == band and not stack[-1]['dotted'])):
                        stack.pop()
                parent_path = ' > '.join(e['num'] + '.' for e in stack if e['num'])
                level = (stack[-1]['level'] + 1) if stack else sec_level + 1
                stack.append({'num': item_no, 'dotted': dotted, 'band': band, 'level': level})

        out.append({
            'kind': kind, 'level': level, 'band': band, 'page': r['page'], 'plan': plan,
            'group': group, 'budget_category': cat, 'expense_category': exp,
            'item_no': item_no, 'parent_item_no': parent_path, 'label': lab,
            'n_tokens': len(toks), 'alloc': amts[0], 'spent': amts[1], 'remain': amts[2],
            'dash': [c for c, t in zip(COLS, (toks + ['', '', ''])[:3]) if t == '-'],
        })

    for i, r in enumerate(out):
        r['is_leaf'] = not (i + 1 < len(out) and out[i + 1]['level'] > r['level'])
    return out


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    data = json.load(open(os.path.join(HERE, 'budget_rows.json'), encoding='utf-8'))
    allrows = {yr: parse_year(yr, data[yr]) for yr in sorted(data)}
    for yr, rs in allrows.items():
        print(yr, len(rs), 'rows;', sum(1 for r in rs if r['is_leaf']), 'leaf;',
              sum(1 for r in rs if r['n_tokens'] != 3), 'incomplete')
    json.dump(allrows, open(os.path.join(HERE, 'budget_parsed.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
