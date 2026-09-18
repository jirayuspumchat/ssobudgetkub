# -*- coding: utf-8 -*-
"""Build the website's JSON payloads from the CSV dataset.

Small tables ship as records (array of objects); the two large asset tables ship as
columns + rows and are split per cost centre, then chunked, so a page loads only the
unit it shows. Column types follow data_dictionary.csv; a value that does not match
its declared type is kept as text and reported in index.json.
"""
import csv, json, os, sys, shutil, collections, datetime

csv.field_size_limit(10 ** 9)
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.dirname(HERE)
OUT = os.path.join(DATA, 'json')
RECORD_LIMIT = 1000          # rows at or below this ship as objects
CHUNK = 2500                 # rows per file for the split tables
# Columns lifted into meta when a file repeats one value in all of its rows. Kept to a
# fixed list so every chunk of a table publishes the same column array, in the same order.
HOIST = ('วันที่ยอดข้อมูล', 'รหัสเอกสาร', 'ไฟล์ต้นทาง', 'รหัสพื้นที่', 'ชื่อพื้นที่',
         'รหัสศูนย์ต้นทุน', 'ชื่อศูนย์ต้นทุน', 'ข้อจำกัดในการตีความ')
TYPE_NOTES = []
MANIFEST = []
# QC-027: the CSVs were built before thaifix.py learned to keep a SARA AM that follows a
# tone mark, so asset descriptions still read น้าเงิน for น้ำเงิน. The map holds the whole
# words that change, derived from the source PDF text by running the old and the fixed
# repair side by side; every pair differs only in า <-> ำ and no word is ambiguous.
QC027 = json.load(open(os.path.join(HERE, 'qc027_word_map.json'), encoding='utf-8'))
# The other direction, a SARA AM the old repair added: these three are not Thai syllables
# (ฝ่าย ป่าย กระเป๋า) and the syllables that really do carry one - น้ำ ต่ำ บ้ำ คว่ำ - never
# survived into the CSVs, so replacing them on sight cannot hit a correct word.
QC027_SYL = {'ฝ่ำ': 'ฝ่า', 'ป่ำ': 'ป่า', 'ป๋ำ': 'ป๋า'}
# Only the column the artefact is in. Applying it everywhere would also rewrite the words
# quoted as examples in the QC-027 note itself, which would leave that note meaningless.
QC027_COLS = {('asset_register_2567.csv', 'คำอธิบายของสินทรัพย์'),
              ('asset_review_candidates.csv', 'คำอธิบายของสินทรัพย์')}
FIXED = [0]


def read(name):
    with open(os.path.join(DATA, name), encoding='utf-8-sig', newline='') as fh:
        r = csv.DictReader(fh)
        return list(r.fieldnames), list(r)


def load_types():
    """(file, column) -> text / int / float / date, taken from the data dictionary."""
    kind = {'ข้อความ': 'text', 'จำนวนเต็ม': 'int', 'ตัวเลข': 'float', 'วันที่': 'date'}
    out = {}
    for row in read('data_dictionary.csv')[1]:
        out[(row['ชื่อไฟล์'], row['ชื่อคอลัมน์'])] = kind[row['ชนิดข้อมูล']]
    return out


TYPES = load_types()


def cast(src, col, raw):
    """Empty stays null: a dash in the source report is not a zero (QC-007)."""
    v = (raw or '').strip()
    if v == '':
        return None
    t = TYPES.get((src, col), 'text')
    if t in ('int', 'float'):
        try:
            return int(v) if t == 'int' else float(v)
        except ValueError:
            TYPE_NOTES.append({'ไฟล์': src, 'คอลัมน์': col, 'ค่าที่พบ': v,
                               'ชนิดที่ประกาศ': 'จำนวนเต็ม' if t == 'int' else 'ตัวเลข'})
            return v
    return repair_text(v) if (src, col) in QC027_COLS else v


def repair_text(v):
    """Apply the QC-027 word map, then the syllables that only go one way."""
    words = v.split(' ')
    if any(w in QC027 for w in words):
        FIXED[0] += sum(1 for w in words if w in QC027)
        v = ' '.join(QC027.get(w, w) for w in words)
    for bad, good in QC027_SYL.items():
        if bad in v:
            FIXED[0] += v.count(bad)
            v = v.replace(bad, good)
    return v


def write(path, meta, cols, rows, src, force_columns=False):
    """One envelope for every file: meta, then records or columns + rows."""
    body = {'meta': dict(meta)}
    body['meta']['จำนวนแถว'] = len(rows)
    body['meta']['ไฟล์ต้นทาง_csv'] = src
    before = FIXED[0]
    if len(rows) <= RECORD_LIMIT and not force_columns:
        body['รูปแบบ'] = 'records'
        body['คอลัมน์'] = cols
        body['ข้อมูล'] = [{c: cast(src, c, r[c]) for c in cols} for r in rows]
    else:
        const = {c: rows[0][c] for c in cols
                 if c in HOIST and all(r[c] == rows[0][c] for r in rows)}
        keep = [c for c in cols if c not in const]
        body['รูปแบบ'] = 'columns'
        body['meta']['ค่าคงที่ของไฟล์นี้'] = {c: cast(src, c, v) for c, v in const.items()}
        body['คอลัมน์'] = keep
        body['ข้อมูล'] = [[cast(src, c, r[c]) for c in keep] for r in rows]
    if FIXED[0] > before:
        body['meta']['จำนวนคำที่แก้ตาม_QC027'] = FIXED[0] - before
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(body, fh, ensure_ascii=False, separators=(',', ':'))
    MANIFEST.append({'ไฟล์': path.replace(os.sep, '/'), 'รูปแบบ': body['รูปแบบ'],
                     'จำนวนแถว': len(rows), 'ขนาดไบต์': os.path.getsize(full),
                     'ที่มา': src, 'คำอธิบาย': meta.get('คำอธิบาย', '')})


def note(path, rows, src, desc, extra=None):
    """Write an index file that is a plain record list, and log it in the manifest."""
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    meta = {'คำอธิบาย': desc, 'ไฟล์ต้นทาง_csv': src, 'จำนวนแถว': len(rows)}
    meta.update(extra or {})
    with open(full, 'w', encoding='utf-8', newline='\n') as fh:
        json.dump({'meta': meta, 'รูปแบบ': 'records', 'ข้อมูล': rows}, fh, ensure_ascii=False)
    MANIFEST.append({'ไฟล์': path.replace(os.sep, '/'), 'รูปแบบ': 'records',
                     'จำนวนแถว': len(rows), 'ขนาดไบต์': os.path.getsize(full),
                     'ที่มา': src, 'คำอธิบาย': desc})


def total(rows, col):
    return round(sum(float(r[col]) for r in rows), 2)


def split_by_unit(src, folder, title):
    """Per cost centre, chunked, plus an index the site can build navigation from."""
    cols, rows = read(src)
    rows.sort(key=lambda r: (r['รหัสพื้นที่'], r['รหัสศูนย์ต้นทุน'],
                             r['รหัสสินทรัพย์'], r['เลขที่ย่อย']))
    groups = collections.OrderedDict()
    for r in rows:
        groups.setdefault(r['รหัสศูนย์ต้นทุน'], []).append(r)
    index = []
    for cc, grp in groups.items():
        parts = [grp[i:i + CHUNK] for i in range(0, len(grp), CHUNK)]
        files = []
        for n, part in enumerate(parts, 1):
            name = '%s-%d.json' % (cc, n) if len(parts) > 1 else '%s.json' % cc
            write(os.path.join(folder, name),
                  {'คำอธิบาย': '%s ของ %s' % (title, grp[0]['ชื่อศูนย์ต้นทุน']),
                   'รหัสศูนย์ต้นทุน': cc, 'ชื่อศูนย์ต้นทุน': grp[0]['ชื่อศูนย์ต้นทุน'],
                   'ส่วนที่': n, 'จำนวนส่วนทั้งหมด': len(parts)},
                  cols, part, src, force_columns=True)
            files.append(folder.replace(os.sep, '/') + '/' + name)
        index.append({'รหัสพื้นที่': grp[0]['รหัสพื้นที่'], 'ชื่อพื้นที่': grp[0]['ชื่อพื้นที่'],
                      'รหัสศูนย์ต้นทุน': cc, 'ชื่อศูนย์ต้นทุน': grp[0]['ชื่อศูนย์ต้นทุน'],
                      'จำนวนแถว': len(grp), 'ไฟล์': files,
                      'มูลค่าการได้มา': total(grp, 'มูลค่าการได้มา'),
                      'ค่าเสื่อมราคาสะสม': total(grp, 'ค่าเสื่อมราคาสะสม'),
                      'มูลค่าตามบัญชี': total(grp, 'มูลค่าตามบัญชี')})
    index.sort(key=lambda d: (d['รหัสพื้นที่'], d['รหัสศูนย์ต้นทุน']))
    note(os.path.join(folder, 'index.json'), index, src,
         'สารบัญ %s แยกตามศูนย์ต้นทุน' % title,
         {'จำนวนแถวรวม': len(rows), 'จำนวนศูนย์ต้นทุน': len(index),
          'จำนวนแถวต่อไฟล์สูงสุด': CHUNK})
    return len(rows)


def by_year(src, folder, title):
    cols, rows = read(src)
    for y in sorted({r['ปีงบประมาณ'] for r in rows}):
        part = [r for r in rows if r['ปีงบประมาณ'] == y]
        write(os.path.join(folder, y + '.json'),
              {'คำอธิบาย': '%s ปีงบประมาณ %s' % (title, y), 'ปีงบประมาณ': int(y)},
              cols, part, src)
    return len(rows)


def plain(src, path, desc):
    cols, rows = read(src)
    write(path, {'คำอธิบาย': desc}, cols, rows, src)
    return len(rows)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    n = 0
    n += plain('source_documents.csv', 'meta/source_documents.json', 'ทะเบียนเอกสารต้นทาง 6 ฉบับ')
    n += plain('data_dictionary.csv', 'meta/data_dictionary.json', 'พจนานุกรมข้อมูลรายคอลัมน์')
    n += plain('data_quality_checks.csv', 'meta/data_quality_checks.json', 'ผลตรวจคุณภาพข้อมูลและข้อจำกัดที่ทราบ')
    n += plain('budget_annual_summary.csv', 'budget/annual_summary.json', 'สรุปงบประมาณรายปี 2563-2567')
    n += plain('budget_category_summary.csv', 'budget/category_summary.json', 'สรุปงบประมาณตามกลุ่ม 4 ระดับ')
    n += by_year('budget_items.csv', 'budget/items', 'รายการงบประมาณ')
    n += by_year('project_year_mapping.csv', 'budget/project_year_mapping', 'การจับคู่รายการข้ามปี')
    n += plain('asset_categories.csv', 'assets/categories.json', 'หมวดสินทรัพย์ 13 หมวด')
    n += plain('organization_units.csv', 'assets/organization_units.json', 'โครงสร้างหน่วยงาน พื้นที่ และศูนย์ต้นทุน')
    n += plain('asset_group_summary_2567.csv', 'assets/group_summary_2567.json', 'สรุปสินทรัพย์ตามพื้นที่ ศูนย์ต้นทุน และหมวด')
    n += plain('asset_capitalization_summary.csv', 'assets/capitalization_summary.json', 'สรุปสินทรัพย์ตามปีเดือนที่โอนเป็นทุน')
    n += split_by_unit('asset_register_2567.csv', os.path.join('assets', 'register'),
                       'ทะเบียนสินทรัพย์ 2567')
    n += split_by_unit('asset_review_candidates.csv', os.path.join('assets', 'review_candidates'),
                       'รายการสินทรัพย์ที่ควรตรวจสอบ')

    index = {
        'ชื่อชุดข้อมูล': 'ผลเบิกจ่ายงบประมาณ 2563-2567 และสินทรัพย์คงเหลือ 2567 สำนักงานประกันสังคม',
        'สร้างเมื่อ': datetime.date.today().isoformat(),
        'สร้างจาก': 'CSV 13 ไฟล์ในโฟลเดอร์ dataset ด้วย scripts/build_json.py',
        'จำนวนแถวรวม': n,
        'จำนวนไฟล์': len(MANIFEST) + 1,
        'รูปแบบไฟล์': {
            'records': 'meta + คอลัมน์ + ข้อมูล โดยข้อมูลเป็นอาร์เรย์ของอ็อบเจกต์',
            'columns': 'meta + คอลัมน์ + ข้อมูล โดยข้อมูลเป็นอาร์เรย์ของอาร์เรย์เรียงตามคอลัมน์ '
                       'คอลัมน์ที่มีค่าเดียวทั้งไฟล์ถูกย้ายไปไว้ที่ meta.ค่าคงที่ของไฟล์นี้',
        },
        'ข้อตกลงของค่า': [
            'ค่าว่างในต้นฉบับเป็น null เสมอ ไม่ใช่ 0 (QC-007)',
            'รหัสและเลขที่ย่อยเก็บเป็นข้อความเพื่อรักษาศูนย์นำหน้า (QC-017)',
            'ชนิดข้อมูลของทุกคอลัมน์ยึดตาม meta/data_dictionary.json',
            'รวมยอดงบประมาณให้กรองด้วย เป็นรายการย่อยสุด = ใช่ เท่านั้น มิฉะนั้นจะนับซ้ำ (QC-026)',
            'ห้ามบวกยอดงบประมาณกับยอดมูลค่าสินทรัพย์เข้าด้วยกัน (QC-019)',
            'อัตราเบิกจ่ายแต่ละปีตัดยอดคนละระยะ เทียบข้ามปีต้องแสดงวันที่ตัดยอดกำกับ (QC-028)',
            'คำอธิบายสินทรัพย์ในชุด JSON นี้แก้รูปคำตาม QC-027 แล้ว จึงต่างจาก CSV ต้นทางเฉพาะคอลัมน์นั้น',
        ],
        'การแก้ข้อความตาม_QC027': {
            'ทำอะไร': 'คืนสระอำที่หายไปและตัดสระอำที่เกินมาในคำอธิบายของสินทรัพย์ เช่น น้าเงิน เป็น น้ำเงิน และ เป่ำลม เป็น เป่าลม',
            'ขอบเขต': 'เฉพาะคอลัมน์ คำอธิบายของสินทรัพย์ ใน asset_register_2567 และ asset_review_candidates',
            'วิธีแก้': 'แทนที่ทั้งคำตามตาราง scripts/qc027_word_map.json ซึ่งสร้างจากข้อความต้นฉบับใน PDF โดยเทียบผลของ thaifix เดิมกับที่แก้แล้ว',
            'จำนวนคำในตาราง': len(QC027),
            'จำนวนคำที่แก้จริง': FIXED[0],
            'ตัวเลขทุกคอลัมน์': 'ไม่เปลี่ยนแปลง',
            'ไฟล์ CSV ต้นทาง': 'ยังไม่แก้ ต้องสร้าง CSV ใหม่ทั้งชุดจึงจะตรงกัน',
        },
        'จำนวนค่าที่ไม่ตรงชนิดที่ประกาศ': len(TYPE_NOTES),
        'ค่าที่ไม่ตรงชนิดที่ประกาศ': TYPE_NOTES[:50],
        'ไฟล์ทั้งหมด': sorted(MANIFEST, key=lambda d: d['ไฟล์']),
    }
    with open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8', newline='\n') as fh:
        json.dump(index, fh, ensure_ascii=False, indent=1)
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
    print('เขียน %d ไฟล์ %d แถว รวม %.1f MB ที่ %s' % (len(MANIFEST) + 1, n, size / 1e6, OUT))
    print('ค่าที่ไม่ตรงชนิดที่ประกาศ %d ค่า | แก้คำตาม QC-027 %d คำ' % (len(TYPE_NOTES), FIXED[0]))


if __name__ == '__main__':
    main()
