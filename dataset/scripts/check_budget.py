# -*- coding: utf-8 -*-
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open(os.path.join(HERE, 'budget_parsed.json'), encoding='utf-8'))


def children(rows, i):
    r = rows[i]
    kids, klv = [], None
    for j in range(i + 1, len(rows)):
        n = rows[j]
        if n['level'] <= r['level']:
            break
        if klv is None:
            klv = n['level']
        if n['level'] == klv:
            kids.append(n)
    return kids


if __name__ == '__main__':
    tot = ok = 0
    for yr in sorted(d):
        rows = d[yr]
        bad = []
        for i, r in enumerate(rows):
            kids = children(rows, i)
            if not kids:
                continue
            tot += 1
            s = sum(k['alloc'] or 0 for k in kids)
            if abs(s - (r['alloc'] or 0)) <= 1:
                ok += 1
            else:
                bad.append((r['level'], r['kind'], r['label'][:46], r['alloc'], round(s, 2), len(kids)))
        print(yr, 'mismatched parents:', len(bad))
        for b in bad:
            print('   ', b)
    print('checked', tot, 'ok', ok)
