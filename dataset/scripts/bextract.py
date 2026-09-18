# -*- coding: utf-8 -*-
import sys, glob, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pypdf import PdfReader
from thaifix import tis620, fix_budget, clean

NUMCOL_X = 340.0   # numbers start right of this

def page_rows(page):
    parts = []
    def v(text, cm, tm, fd, fs):
        if text.strip():
            parts.append((round(tm[5], 1), round(tm[4], 1), fix_budget(tis620(text))))
    page.extract_text(visitor_text=v)
    # cluster by y (tolerance 2pt)
    rows = []
    for y, x, t in sorted(parts, key=lambda p: (-p[0], p[1])):
        if rows and abs(rows[-1][0] - y) <= 2.0:
            rows[-1][1].append((x, t))
        else:
            rows.append((y, [(x, t)]))
    out = []
    for y, chunks in rows:
        chunks.sort()
        lab_ch = [(x, t) for x, t in chunks if x < NUMCOL_X]
        label = clean(''.join(t for x, t in lab_ch))
        nums = clean(' '.join(t for x, t in chunks if x >= NUMCOL_X))
        lx = round(min([x for x, t in lab_ch], default=-1), 1)
        out.append({'y': y, 'x': lx, 'label': label, 'nums': nums})
    return out

if __name__ == '__main__':
    res = {}
    for f in sorted(glob.glob('1.*.pdf')):
        yr = f.split('ปี ')[1][:4]
        r = PdfReader(f)
        res[yr] = [page_rows(p) for p in r.pages]
    json.dump(res, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'budget_rows.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print({k: len(v) for k, v in res.items()})
