# -*- coding: utf-8 -*-
"""Rebuild every subtotal the report prints from the detail rows it covers."""
import json, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')
D = json.load(open(os.path.join(HERE, 'assets_parsed.json'), encoding='utf-8'))
DET, SUB = D['details'], D['subtotals']

# a subtotal of kind K in report section S covers the detail rows of that section
# whose K-code equals the printed code (area/category subtotals also span the section)
SCOPE = {'cost_center': lambda s, d: d['section'] == s['section'] and d['cost_center'] == s['code'],
         'category':    lambda s, d: d['section'] == s['section'] and d['category'] == s['code'] and d['area'] == s['area_of'],
         'area':        lambda s, d: d['section'] == s['section'] and d['area'] == s['code'],
         'org':         lambda s, d: d['section'] == s['section']}


def compare():
    # a category subtotal is printed per area; pair it with the area subtotal that follows it
    for i, s in enumerate(SUB):
        if s['kind'] == 'category':
            nxt = next((t for t in SUB[i + 1:] if t['kind'] == 'area'), None)
            s['area_of'] = nxt['code'] if nxt else None
    by_section = collections.defaultdict(list)
    for d in DET:
        by_section[d['section']].append(d)
    rows = []
    for s in SUB:
        f = SCOPE[s['kind']]
        cov = [d for d in by_section[s['section']] if f(s, d)]
        got = [round(sum(d[k] for d in cov), 2) for k in ('acq', 'dep', 'nbv')]
        rows.append({**s, 'n': len(cov), 'sum': got,
                     'diff': [None if s[k] is None else round(s[k] - g, 2)
                              for k, g in zip(('acq', 'dep', 'nbv'), got)]})
    return rows


if __name__ == '__main__':
    rows = compare()
    print('detail rows:', len(DET), '| subtotal rows:', len(rows))
    for kind in ('cost_center', 'category', 'area', 'org'):
        rs = [r for r in rows if r['kind'] == kind]
        bad = [r for r in rs if any(d is not None and abs(d) > 0.02 for d in r['diff'])]
        unk = [r for r in rs if any(d is None for d in r['diff'])]
        print('%-12s %5d printed | %d mismatched | %d unreadable in source' % (kind, len(rs), len(bad), len(unk)))
        for b in bad[:5]:
            print('     p%-5d %s %s n=%d printed=%s sum=%s' % (b['page'], b['code'], b['name'][:26], b['n'], [b['acq'], b['dep'], b['nbv']], b['sum']))
