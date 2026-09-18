#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สร้าง web/data.js จาก dataset/*.csv

ตัวเลขทุกตัวบนหน้าเว็บมาจากสคริปต์นี้ ไม่มีการพิมพ์มือ
สคริปต์จะ assert ยอดรวมกับ budget_annual_summary.csv ถ้าไม่ตรงจะ build ไม่ผ่าน

ใช้งาน:
    python build_data.py            # เขียน web/data.js
    python build_data.py --inline   # เขียน web/index.standalone.html ด้วย
"""
import csv
import io
import json
import os
import sys
import datetime
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DS = os.path.join(ROOT, "dataset")


# ---------------------------------------------------------------- helpers

def read(name):
    """อ่าน CSV ด้วย utf-8-sig เพราะไฟล์ต้นทางมี BOM"""
    path = os.path.join(DS, name)
    with io.open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def num(v):
    """แปลงเป็นตัวเลข; ช่องว่างคืน None เพราะต้นฉบับพิมพ์ขีด ไม่ใช่ศูนย์"""
    if v is None:
        return None
    v = v.strip()
    if v == "" or v == "-":
        return None
    return float(v)


def rnd(v, d=2):
    return None if v is None else round(v, d)


def thai_date(iso):
    """แปลง '2564-01-31' (พ.ศ.) เป็น date object (ค.ศ.)"""
    y, m, d = (int(x) for x in iso.split("-"))
    return datetime.date(y - 543, m, d)


# ---------------------------------------------------------------- 1. years

def build_years():
    """ยอดรวมรายปี + ระยะห่างระหว่างสิ้นปีงบกับวันที่ตัดยอด

    ระยะห่างนี้คือหัวใจของบทเรียนในส่วนที่ 2: ปี 2567 ตัดยอดหลังสิ้นปีงบ
    เพียง 1 เดือน ขณะที่ปีอื่นตัดยอดหลังไป 3-5 เดือน อัตราเบิกจ่าย
    จึงเทียบกันตรง ๆ ไม่ได้
    """
    out = []
    for r in read("budget_annual_summary.csv"):
        year = int(r["ปีงบประมาณ"])
        fy_end = datetime.date(year - 543, 9, 30)   # ปีงบประมาณไทยสิ้นสุด 30 ก.ย.
        cut = thai_date(r["วันที่ตัดยอด"])
        months = (cut.year - fy_end.year) * 12 + (cut.month - fy_end.month)
        out.append({
            "year": r["ปีงบประมาณ"],
            "ce": int(r["ปีคริสต์ศักราช"]),
            "cutIso": r["วันที่ตัดยอด"],
            "cutThai": r["วันที่ตัดยอด_ไทย"],
            "fyEndThai": "30 กันยายน %d" % year,
            "monthsAfterYearEnd": months,
            "alloc": num(r["จัดสรรรวม"]),
            "disb": num(r["รวมเบิกจ่ายและผูกพันรวม"]),
            "remain": num(r["คงเหลือรวม"]),
            "rate": num(r["อัตราเบิกจ่าย_ร้อยละ"]),
            "nPlans": int(r["จำนวนแผนงาน"]),
            "doc": r["รหัสเอกสาร"],
            "srcFile": r["ไฟล์ต้นทาง"],
        })
    out.sort(key=lambda x: x["year"])
    return out


# ---------------------------------------------------------------- 2. tree

def build_tree():
    """ต้นไม้งบ: แผนงาน > กลุ่มรายจ่าย > หมวดงบรายจ่าย > หมวดค่าใช้จ่าย

    สำคัญ: คีย์ต้องเป็น path เต็ม ไม่ใช่ชื่อเดี่ยว เพราะชื่อหมวดค่าใช้จ่าย
    เช่น 'ค่าใช้สอย' ปรากฏหลายครั้งใต้แผนงานคนละอัน ถ้าคีย์ด้วยชื่อจะยุบรวมผิด
    """
    by_year = collections.defaultdict(dict)    # year -> path tuple -> node

    for r in read("budget_category_summary.csv"):
        year = r["ปีงบประมาณ"]
        level = r["ระดับสรุป"]
        plan, group = r["แผนงาน"], r["กลุ่มรายจ่าย"]
        bcat, ecat = r["หมวดงบรายจ่าย"], r["หมวดค่าใช้จ่าย"]

        # แถว 'กลุ่มรายจ่าย' ที่ไม่มีชื่อกลุ่ม จะได้ path ชนกับแถวแผนงาน
        if level == "กลุ่มรายจ่าย" and not group:
            continue

        path = [plan]
        if level != "แผนงาน":
            if group:
                path.append(group)
            if level in ("หมวดงบรายจ่าย", "หมวดค่าใช้จ่าย"):
                path.append(bcat)
            if level == "หมวดค่าใช้จ่าย":
                path.append(ecat)

        by_year[year][tuple(path)] = {
            "name": r["ชื่อกลุ่ม"] or path[-1],
            "level": level,
            "alloc": num(r["จัดสรร"]),
            "disb": num(r["รวมเบิกจ่ายและผูกพัน"]),
            "remain": num(r["คงเหลือ"]),
            "nLeaf": int(r["จำนวนรายการย่อยสุดภายใต้กลุ่ม"] or 0),
            "page": r["หน้าอ้างอิง"],
            "path": list(path),
            "children": [],
        }

    trees = {}
    for year, nodes in by_year.items():
        roots = []
        for path in sorted(nodes, key=len):      # พ่อมาก่อนลูกเสมอ
            node = nodes[path]
            parent = nodes.get(path[:-1])
            (parent["children"] if parent else roots).append(node)
        for n in nodes.values():
            n["children"].sort(key=lambda c: -(c["alloc"] or 0))
        roots.sort(key=lambda c: -(c["alloc"] or 0))
        trees[year] = roots
    return trees


# ---------------------------------------------------------------- 3. items

def build_items(series_pairs=None):
    """รายการย่อยสุดเท่านั้น

    ต้องกรอง เป็นรายการย่อยสุด == 'ใช่' ห้ามใช้ เป็นแถวสรุป == 'ไม่ใช่'
    เพราะวิธีหลังนับซ้ำเกินจริง 568-794 ล้านบาทต่อปี
    (outputs/csv_audit_2026-09-11/report_th.md ข้อ 1)

    เก็บเป็น array + ตารางคำศัพท์ เพื่อลดขนาดไฟล์
    """
    vocab, vidx = [], {}

    def vid(s):
        if not s:
            return -1
        if s not in vidx:
            vidx[s] = len(vocab)
            vocab.append(s)
        return vidx[s]

    pairs = series_pairs or {}
    rows = []
    matched = 0
    for r in read("budget_items.csv"):
        if r["เป็นรายการย่อยสุด"] != "ใช่":
            continue
        # sid = ลำดับใน series.list ของรายการเดียวกันข้ามปี, -1 คือจับคู่ไม่ได้
        # เก็บเป็นตัวเลขต่อแถว ไม่ใช่ตารางคีย์ด้วยชื่อ เพราะชื่อไทยยาวทำให้ไฟล์โตขึ้นราว 200 KB
        sid = pairs.get("%s\t%s" % (r["ปีงบประมาณ"], r["ชื่อรายการ"]), -1)
        if sid >= 0:
            matched += 1
        rows.append([
            r["ปีงบประมาณ"],
            r["ชื่อรายการ"],
            vid(r["แผนงาน"]),
            vid(r["กลุ่มรายจ่าย"]),
            vid(r["หมวดงบรายจ่าย"]),
            vid(r["หมวดค่าใช้จ่าย"]),
            rnd(num(r["จัดสรร"])),
            rnd(num(r["รวมเบิกจ่ายและผูกพัน"])),
            rnd(num(r["คงเหลือ"])),
            int(r["หน้าอ้างอิง"] or 0),
            sid,
        ])
    if pairs:
        print("  จับคู่รายการกับประวัติข้ามปีได้ %d จาก %d แถว" % (matched, len(rows)))
    return {
        "cols": ["year", "name", "plan", "group", "bcat", "ecat",
                 "alloc", "disb", "remain", "page", "sid"],
        "vocab": vocab,
        "rows": rows,
    }


# ---------------------------------------------------------------- 4. series

def read_manual_merges():
    """คู่รายการที่ 'คนยืนยันแล้ว' ว่าเป็นรายการเดียวกัน

    อ่านจาก dataset/manual_merge.csv ซึ่งสร้างโครงด้วย
    dataset/scripts/build_merge_candidates.py แล้วให้คนกรอกคำตัดสินเอง

    รวมให้เฉพาะแถวที่ การตัดสิน == 'รวม' และมี ผู้ตัดสิน กำกับ
    แถวที่เว้นว่างไว้ถือว่ายังไม่ตัดสิน ไม่รวมให้ และยังติดธงเตือนบนหน้าเว็บเหมือนเดิม
    ตั้งใจให้เข้มแบบนี้ เพราะการรวมผิดจะทำให้ประวัติงบของรายการนั้นผิดไปทั้งเส้น
    """
    path = os.path.join(DS, "manual_merge.csv")
    if not os.path.exists(path):
        return [], {}, 0, 0
    accepted, names, rejected, pending = [], {}, 0, 0
    for r in read("manual_merge.csv"):
        decision = (r.get("การตัดสิน") or "").strip()
        who = (r.get("ผู้ตัดสิน") or "").strip()
        a, b = r["รหัสกลาง_ก"].strip(), r["รหัสกลาง_ข"].strip()
        if decision == "รวม" and who:
            accepted.append((a, b))
            canon = (r.get("ชื่อที่ใช้หลังรวม") or "").strip()
            if canon:
                names[(a, b)] = canon
        elif decision == "ไม่รวม" and who:
            rejected += 1
        else:
            pending += 1
    return accepted, names, rejected, pending


def build_series(years):
    """รายการเดียวกันข้ามปี ใช้สอนว่างบส่วนไหนเป็นรายจ่ายประจำ

    การจับคู่หลักใช้ 'ชื่อตรงกันทุกตัวอักษรหลังปรับรูป' เท่านั้น ไม่เดาจากความคล้าย
    รายการที่มีชื่อใกล้กันมากในปีอื่นจะติดธง needsReview ไว้ให้หน้าเว็บเตือนว่า
    ประวัติอาจไม่ครบปี จนกว่าจะมีคนตัดสินใน dataset/manual_merge.csv
    """
    ylist = [y["year"] for y in years]
    groups = collections.defaultdict(lambda: {"alloc": {}, "disb": {}, "years": set()})
    meta = {}

    def acc(d, y, v):
        """บวกสะสม ไม่ใช่เขียนทับ

        มี 4 รหัสกลางที่มีหลายแถวในปีเดียวกัน เพราะเอกสารแยกเป็นหลายบรรทัด
        ถ้าเขียนทับจะเหลือแค่บรรทัดสุดท้าย ตัวเลขปีนั้นจะต่ำกว่าความจริง
        ค่าว่างยังคงเป็นค่าว่าง ไม่ถูกนับเป็นศูนย์
        """
        if v is None:
            d.setdefault(y, None)
        elif d.get(y) is None:
            d[y] = v
        else:
            d[y] += v

    merged = 0
    for r in read("project_year_mapping.csv"):
        key = r["รหัสกลาง"]
        yr = r["ปีงบประมาณ"]
        g = groups[key]
        if yr in g["years"]:
            merged += 1
        g["years"].add(yr)
        acc(g["alloc"], yr, num(r["จัดสรร"]))
        acc(g["disb"], yr, num(r["รวมเบิกจ่ายและผูกพัน"]))
        meta[key] = {
            "name": r["ชื่อมาตรฐาน"],
            "status": r["สถานะตรวจสอบการจับคู่"],
            # ชื่อที่สะกดใกล้กันมากในปีอื่น อาจเป็นรายการเดียวกันที่ถูกแยกไว้คนละรหัส
            # เก็บไว้แสดงบนหน้าเว็บ เพื่อให้คนอ่านตามไปตรวจเองได้ ไม่ใช่แค่บอกว่า "ระวัง"
            "nearName": r["ชื่อที่อาจเป็นรายการเดียวกัน"],
            "nearSim": r["ค่าความคล้าย_ร้อยละ"],
            "nearYears": r["ปีของรายการที่อาจเป็นรายการเดียวกัน"],
        }

    # ---- รวมคู่ที่คนยืนยันแล้ว ----
    accepted, canon_names, n_rejected, n_pending = read_manual_merges()
    # union-find เพราะบางรายการติดธงคู่กับสองตัว ถ้ายืนยันทั้งคู่ต้องยุบเป็นก้อนเดียว
    parent = {}

    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    applied = 0
    for a, b in accepted:
        if a in groups and b in groups:
            union(a, b)
            applied += 1
        else:
            print("  เตือน: manual_merge อ้างรหัสที่ไม่มีในข้อมูล %s หรือ %s" % (a, b))

    # ทุกรหัสเดิมต้องชี้ไปที่ก้อนหลังรวมได้ ไม่งั้นรายการที่ถูกยุบจะหาประวัติตัวเองไม่เจอ
    root_of = {k: find(k) for k in groups}

    if applied:
        before = sum(v for g in groups.values() for v in g["alloc"].values() if v)
        merged_groups = collections.defaultdict(
            lambda: {"alloc": {}, "disb": {}, "years": set()})
        merged_meta = {}
        for key, g in groups.items():
            root = find(key)
            mg = merged_groups[root]
            mg["years"] |= g["years"]
            for y, v in g["alloc"].items():
                acc(mg["alloc"], y, v)
            for y, v in g["disb"].items():
                acc(mg["disb"], y, v)
            # ชื่อหลังรวมยึดของรหัสที่เป็นราก ถ้าคนระบุ ชื่อที่ใช้หลังรวม ไว้จะใช้ตามนั้น
            if root not in merged_meta:
                merged_meta[root] = dict(meta[root])
        for (a, b), nm in canon_names.items():
            if a in groups and b in groups:
                merged_meta[find(a)]["name"] = nm
        # รวมแล้วเงินต้องไม่งอกไม่หาย ย้ายที่ได้อย่างเดียว
        after = sum(v for g in merged_groups.values() for v in g["alloc"].values() if v)
        if abs(before - after) > 0.02:
            raise SystemExit("รวมรายการแล้วยอดเพี้ยน: %.2f -> %.2f" % (before, after))
        # คู่ที่คนยืนยันแล้วถือว่าจบ ไม่ต้องเตือนบนหน้าเว็บอีก
        for root in merged_meta:
            if len({k for k in groups if find(k) == root}) > 1:
                merged_meta[root]["status"] = "ยืนยันด้วยคนแล้วว่าเป็นรายการเดียวกัน"
        groups, meta = merged_groups, merged_meta

    print("  manual_merge: รวมแล้ว %d คู่ · ตัดสินว่าไม่รวม %d · ยังไม่ตัดสิน %d"
          % (applied, n_rejected, n_pending))

    out = []
    key_of_row = {}          # ลำดับใน out -> รหัสกลาง ไว้ผูกกลับทีหลัง
    for key, g in groups.items():
        m = meta[key]
        alloc = [rnd(g["alloc"].get(y)) for y in ylist]
        total = sum(v for v in alloc if v)
        flagged = ("ต้องตรวจสอบด้วยคน" in m["status"] or "ตรวจเพิ่ม" in m["status"])
        key_of_row[key] = {
            "name": m["name"],
            # นับจากปีที่พบจริง ไม่ยึดคอลัมน์ จำนวนปีที่พบ ซึ่งนับแถวไม่ใช่ปี
            "nYears": len(g["years"]),
            "alloc": alloc,
            "disb": [rnd(g["disb"].get(y)) for y in ylist],
            "total": rnd(total),
            # ทุกคู่ในไฟล์นี้จับด้วย "ชื่อตรงกันทุกตัวอักษรหลังปรับรูป" ไม่มีการเดาจากความคล้าย
            # ธงนี้จึงไม่ได้แปลว่าตัวเลขที่แสดงอาจเป็นของรายการอื่น
            # แต่แปลว่ามีชื่อที่ใกล้กันมากอยู่ในปีอื่น ประวัติที่เห็นจึงอาจ "ไม่ครบปี"
            "needsReview": flagged,
        }
        # ใส่รายละเอียดเฉพาะ 54 รายการที่ติดธง ไม่ใส่คีย์ค่าว่างให้อีก 475 รายการ
        # ถ้าใส่ครบทุกแถว ต่อให้เป็น null ก็ยังกินพื้นที่ในไฟล์อีกราว 30 KB โดยไม่ได้ใช้
        if flagged:
            # แยกสองกรณีออกจากกัน เพราะความเสี่ยงคนละแบบ
            #   partial = จับข้ามปีได้แล้ว แต่อาจมีปีอื่นซ่อนอยู่ใต้ชื่อที่ต่างกันนิดเดียว
            #   single  = รายการนี้พบปีเดียว และมีชื่อใกล้กันอยู่ในปีอื่น
            key_of_row[key]["reviewKind"] = (
                "single" if "ต้องตรวจสอบด้วยคน" in m["status"] else "partial")
            if m["nearName"]:
                key_of_row[key]["nearName"] = m["nearName"]
            if m["nearSim"]:
                key_of_row[key]["nearSim"] = float(m["nearSim"])
            ny = [y.strip() for y in (m["nearYears"] or "").split("|") if y.strip()]
            if ny:
                key_of_row[key]["nearYears"] = ny
        out.append(key_of_row[key])
    out.sort(key=lambda s: -s["total"])

    # ดัชนีหลังเรียง ใช้ชี้จากรายการรายปีมาหาประวัติ 5 ปีของตัวเอง
    # ต้องผูกด้วยรหัสกลางจาก project_year_mapping.csv เท่านั้น
    # ห้ามเดาด้วยการเทียบชื่อฝั่งเบราว์เซอร์ เพราะชื่อมาตรฐานกับชื่อตามเอกสารไม่ตรงกัน
    idx_of_root = {}
    for i, s in enumerate(out):
        for key, obj in key_of_row.items():
            if obj is s:
                idx_of_root[key] = i
                break
    # ขยายให้ครอบคลุมรหัสเดิมที่ถูกยุบเข้าไปด้วย ไม่ใช่เฉพาะรหัสที่เป็นราก
    idx_of_key = {k: idx_of_root[root] for k, root in root_of.items() if root in idx_of_root}

    dist = collections.Counter(s["nYears"] for s in out)
    if merged:
        print("  หมายเหตุ: รวม %d แถวที่ซ้ำปีเดียวกันเข้าด้วยกัน แทนการเขียนทับ" % merged)
    return ({"years": ylist, "list": out, "byNYears": dict(dist), "mergedRows": merged},
            idx_of_key)


def build_series_index(idx_of_key):
    """(ปีงบประมาณ, ชื่อรายการเดิมตามเอกสาร) -> ลำดับใน series.list

    คีย์ใช้ชื่อเดิมตามเอกสาร เพราะนั่นคือชื่อเดียวกับที่อยู่ใน budget_items.csv
    ส่วน ชื่อมาตรฐาน ถูกปรับรูปแล้วจึงเอามาเทียบตรง ๆ ไม่ได้
    """
    pairs = {}
    for r in read("project_year_mapping.csv"):
        i = idx_of_key.get(r["รหัสกลาง"])
        if i is None:
            continue
        pairs["%s\t%s" % (r["ปีงบประมาณ"], r["ชื่อรายการเดิมตามเอกสาร"])] = i
    return pairs


# ---------------------------------------------------------------- 5. assets

def build_assets():
    """ทะเบียนสินทรัพย์คงเหลือ ณ 30 ก.ย. 2567

    ไม่ฝังทะเบียนดิบ 82,021 แถว ใช้เฉพาะยอดสรุปตามหมวด ตามปีที่โอนเป็นทุน
    และตามพื้นที่
    """
    cats = []
    tot_acq = tot_dep = tot_book = 0.0
    tot_lines = tot_codes = 0
    for r in read("asset_categories.csv"):
        acq = num(r["มูลค่าการได้มา"]) or 0.0
        dep = num(r["ค่าเสื่อมราคาสะสม"]) or 0.0
        book = num(r["มูลค่าตามบัญชี"]) or 0.0
        lines = int(r["จำนวนรายการย่อย"])
        codes = int(r["จำนวนรหัสสินทรัพย์"])
        cats.append({
            "code": r["รหัสหมวดสินทรัพย์"],
            "name": r["ชื่อหมวดมาตรฐาน"],
            "shortName": r["ชื่อหมวดตามเอกสาร"],
            "lines": lines,
            "codes": codes,
            "acq": rnd(acq), "dep": rnd(dep), "book": rnd(book),
            "depPct": rnd(abs(dep) / acq * 100, 1) if acq else None,
            "page": int(r["หน้าที่พบครั้งแรก"]),
        })
        tot_acq += acq
        tot_dep += dep
        tot_book += book
        tot_lines += lines
        tot_codes += codes
    cats.sort(key=lambda c: -c["acq"])

    # ปีที่โอนเป็นทุน = ของพวกนี้เข้าบัญชีมาตั้งแต่เมื่อไหร่
    by_year = collections.defaultdict(lambda: [0.0, 0.0, 0])
    for r in read("asset_capitalization_summary.csv"):
        y = r["ปีที่โอนเป็นทุน_พศ"]
        if not y:
            continue
        b = by_year[y]
        b[0] += num(r["มูลค่าการได้มา"]) or 0.0
        b[1] += num(r["มูลค่าตามบัญชี"]) or 0.0
        b[2] += int(r["จำนวนรายการย่อย"])
    caps = [{"year": y, "acq": rnd(v[0]), "book": rnd(v[1]), "lines": v[2]}
            for y, v in sorted(by_year.items())]

    areas = []
    for r in read("organization_units.csv"):
        if r["ประเภทรหัส"] != "พื้นที่":
            continue
        areas.append({
            "code": r["รหัส"],
            "name": r["ชื่อหน่วยงาน"],
            "acq": rnd(num(r["มูลค่าการได้มา"]) or 0.0),
            "book": rnd(num(r["มูลค่าตามบัญชี"]) or 0.0),
            "lines": int(r["จำนวนรายการย่อยสินทรัพย์"]),
        })
    areas.sort(key=lambda a: -a["acq"])
    n_areas = len(areas)

    # รายการที่ถูกคัดมาตรวจเพิ่ม นับอย่างเดียว ไม่ฝังรายแถว
    reasons = collections.Counter()
    prio = collections.Counter()
    n_review = 0
    for r in read("asset_review_candidates.csv"):
        n_review += 1
        prio[r["ระดับความสำคัญเบื้องต้น"]] += 1
        for part in r["เหตุผลที่คัดเลือก"].split("+"):
            reasons[part.strip()] += 1

    return {
        "asOfThai": "30 กันยายน 2567",
        "totals": {
            "acq": rnd(tot_acq), "dep": rnd(tot_dep), "book": rnd(tot_book),
            "lines": tot_lines, "codes": tot_codes,
            "depPct": rnd(abs(tot_dep) / tot_acq * 100, 1),
        },
        "categories": cats,
        "byCapYear": caps,
        "areas": areas[:12],
        "nAreas": n_areas,
        "review": {
            "n": n_review,
            "byPriority": dict(prio),
            "nearZero": reasons.get("มูลค่าตามบัญชีเหลือไม่เกิน 1 บาท", 0),
            "heavilyDepreciated": reasons.get(
                "ค่าเสื่อมราคาสะสมตั้งแต่ร้อยละ 95 ของมูลค่าการได้มา", 0),
        },
    }


# ---------------------------------------------------------------- 6. meta

def build_sources():
    out = []
    for r in read("source_documents.csv"):
        out.append({
            "id": r["รหัสเอกสาร"],
            "file": r["ชื่อไฟล์"],
            "kind": r["ประเภทเอกสาร"],
            "group": r["กลุ่มข้อมูล"],
            "year": r["ปีงบประมาณ"],
            "asOfThai": r["วันที่ยอดข้อมูล_ไทย"],
            "pages": int(r["จำนวนหน้า"]),
            "rows": int(r["จำนวนแถวที่สกัดได้"]),
            "method": r["วิธีการสกัดข้อมูล"],
            "title": r["หัวเรื่องในเอกสาร"],
        })
    return out


def build_qc(items):
    """ตัวเลขที่ใช้สอนเรื่องกับดักการอ่านข้อมูล คำนวณสดจาก CSV ทุกครั้ง"""
    raw = read("budget_items.csv")

    # แถวที่ จัดสรร - เบิกจ่าย != คงเหลือ (เฉพาะแถวที่มีตัวเลขครบสามช่อง)
    mismatch = collections.Counter()
    for r in raw:
        a = num(r["จัดสรร"])
        d = num(r["รวมเบิกจ่ายและผูกพัน"])
        c = num(r["คงเหลือ"])
        if a is not None and d is not None and c is not None:
            if abs((a - d) - c) > 0.02:
                mismatch[r["ปีงบประมาณ"]] += 1

    # ผลต่างจากการนับซ้ำ ถ้ากรองผิดวิธี
    ann = {r["ปีงบประมาณ"]: num(r["จัดสรรรวม"])
           for r in read("budget_annual_summary.csv")}
    wrong = collections.defaultdict(float)
    for r in raw:
        if r["เป็นแถวสรุป"] == "ไม่ใช่":
            wrong[r["ปีงบประมาณ"]] += num(r["จัดสรร"]) or 0.0
    overcount = {y: {"wrong": rnd(v), "right": ann[y], "diff": rnd(v - ann[y])}
                 for y, v in sorted(wrong.items())}

    dash_rows = sum(1 for r in raw if r["คอลัมน์ที่ต้นฉบับแสดงขีด"].strip())

    return {
        "mismatchByYear": dict(mismatch),
        "mismatchTotal": sum(mismatch.values()),
        "overcountByYear": overcount,
        "dashRows": dash_rows,
        "leafItems": len(items["rows"]),
        "rawRows": len(raw),
    }


# ---------------------------------------------------------------- assemble

def verify(data):
    """ยอดรวมต้องตรงกับต้นทางบาทต่อบาท ไม่ตรงคือ build ไม่ผ่าน"""
    errs = []

    # 1. ผลบวกรายการย่อยสุด ต้องเท่ากับยอดรวมรายปี
    idx = {c: i for i, c in enumerate(data["items"]["cols"])}
    tot = collections.defaultdict(float)
    for row in data["items"]["rows"]:
        tot[row[idx["year"]]] += row[idx["alloc"]] or 0.0
    for y in data["years"]:
        got, want = tot[y["year"]], y["alloc"]
        if abs(got - want) > 0.02:
            errs.append("จัดสรรปี %s: leaf=%.2f annual=%.2f" % (y["year"], got, want))

    # 2. ผลบวกแผนงานระดับบนสุด ต้องเท่ากับยอดรวมรายปี
    for y in data["years"]:
        got = sum(n["alloc"] or 0.0 for n in data["tree"][y["year"]])
        if abs(got - y["alloc"]) > 0.02:
            errs.append("tree ปี %s: %.2f != %.2f" % (y["year"], got, y["alloc"]))

    # 3. ยอดสินทรัพย์ ต้องตรงกับรายงานตรวจสอบใน outputs/
    t = data["assets"]["totals"]
    for label, got, want in (("ราคาทุน", t["acq"], 5419079845.60),
                             ("ค่าเสื่อมสะสม", t["dep"], -4285809628.96),
                             ("มูลค่าตามบัญชี", t["book"], 1133270216.64)):
        if abs(got - want) > 0.02:
            errs.append("สินทรัพย์ %s: %.2f != %.2f" % (label, got, want))

    # 4. มูลค่าการได้มา + ค่าเสื่อมสะสม = มูลค่าตามบัญชี
    if abs((t["acq"] + t["dep"]) - t["book"]) > 0.02:
        errs.append("สมการสินทรัพย์ไม่ลงตัว")

    if errs:
        raise SystemExit("ตรวจยอดไม่ผ่าน:\n  " + "\n  ".join(errs))
    print("ตรวจยอดผ่าน: %d ปี / %d รายการย่อยสุด / สินทรัพย์ %s รายการ"
          % (len(data["years"]), len(data["items"]["rows"]),
             "{:,}".format(t["lines"])))


def write_standalone(payload):
    """ฝังทั้งข้อมูลและสคริปต์ลงใน HTML ไฟล์เดียว ไว้ส่งต่อให้คนอื่นเปิด"""
    src = os.path.join(HERE, "index.html")
    app = os.path.join(HERE, "app.js")
    for path, label in ((src, "index.html"), (app, "app.js")):
        if not os.path.exists(path):
            print("ข้าม --inline: ยังไม่มี %s" % label)
            return

    with io.open(src, encoding="utf-8") as fh:
        html = fh.read()
    with io.open(app, encoding="utf-8") as fh:
        js = fh.read()

    for tag in ('<script src="data.js"></script>', '<script src="app.js"></script>'):
        if tag not in html:
            raise SystemExit("หาแท็ก %s ใน index.html ไม่พบ" % tag)

    # กัน '</script>' ที่อาจโผล่ในสตริงของ payload หรือ js ไปปิดแท็กก่อนเวลา
    safe = lambda s: s.replace("</script>", "<\\/script>")
    html = html.replace('<script src="data.js"></script>',
                        "<script>window.SSO=" + safe(payload) + ";</script>")
    html = html.replace('<script src="app.js"></script>',
                        "<script>" + safe(js) + "</script>")

    dst = os.path.join(HERE, "index.standalone.html")
    with io.open(dst, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("wrote %s (%.0f KB)" % (dst, os.path.getsize(dst) / 1024.0))


def main():
    years = build_years()
    series, idx_of_key = build_series(years)
    # ต้องสร้าง series ก่อน items เพราะแต่ละแถวของ items ต้องรู้ลำดับของตัวเองใน series.list
    items = build_items(build_series_index(idx_of_key))
    data = {
        "generatedAt": datetime.date.today().isoformat(),
        "years": years,
        "tree": build_tree(),
        "items": items,
        "series": series,
        "assets": build_assets(),
        "sources": build_sources(),
        "qc": build_qc(items),
    }

    verify(data)

    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    out_js = os.path.join(HERE, "data.js")
    with io.open(out_js, "w", encoding="utf-8") as fh:
        fh.write("/* generated by build_data.py - do not edit by hand */\n")
        fh.write("window.SSO=")
        fh.write(payload)
        fh.write(";\n")
    print("wrote %s (%.0f KB)" % (out_js, os.path.getsize(out_js) / 1024.0))

    if "--inline" in sys.argv:
        write_standalone(payload)


if __name__ == "__main__":
    main()
