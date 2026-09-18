# -*- coding: utf-8 -*-
"""Extract the 1,909-page SAP asset register into one TSV of raw rows (page-tagged)."""
import sys, os, re, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pypdf import PdfReader
from thaifix import fix_assets, clean

PDF = r'C:\Users\watas\Downloads\OpenSSO\2. สินทรัพย์คงเหลือ2567_1.pdf'
OUT = os.path.join(HERE, 'asset_rows.tsv')


def page_lines(page):
    parts = []

    def v(text, cm, tm, fd, fs):
        if text.strip():
            parts.append((round(tm[5], 1), round(tm[4], 1), fix_assets(text)))

    page.extract_text(visitor_text=v)
    lines = []
    for y, x, t in sorted(parts, key=lambda p: (-p[0], p[1])):
        if lines and abs(lines[-1][0] - y) <= 2.0:
            lines[-1][1].append((x, t))
        else:
            lines.append((y, [(x, t)]))
    return [clean(''.join(t for _, t in sorted(ch))) for _, ch in lines]


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    r = PdfReader(PDF)
    t0 = time.time()
    with open(OUT, 'w', encoding='utf-8', newline='') as fh:
        for i, p in enumerate(r.pages, 1):
            for ln in page_lines(p):
                if ln:
                    fh.write('%d\t%s\n' % (i, ln))
            if i % 250 == 0:
                print(i, '%.0fs' % (time.time() - t0), flush=True)
    print('done', len(r.pages), 'pages in %.0fs' % (time.time() - t0))
