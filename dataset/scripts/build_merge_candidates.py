# -*- coding: utf-8 -*-
"""สร้าง/อัปเดต dataset/manual_merge.csv

ไฟล์นั้นคือ "ทะเบียนคำตัดสินของคน" ว่ารายการคู่ไหนคือรายการเดียวกัน
สคริปต์นี้เตรียมเฉพาะ *รายชื่อคู่ที่ต้องตัดสิน* ให้ ไม่ตัดสินแทนคน
ช่อง การตัดสิน จึงถูกเว้นว่างไว้เสมอสำหรับคู่ที่ยังไม่เคยตัดสิน

รันซ้ำได้ คำตัดสินที่กรอกไว้แล้วจะไม่ถูกเขียนทับ
ถ้า project_year_mapping.csv มีคู่ใหม่โผล่มา จะถูกเติมเข้าไปแบบเว้นว่าง

    python dataset/scripts/build_merge_candidates.py
"""
import csv
import difflib
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATASET = os.path.dirname(HERE)
SRC = os.path.join(DATASET, "project_year_mapping.csv")
DST = os.path.join(DATASET, "manual_merge.csv")

COLS = [
    "รหัสกลาง_ก", "ชื่อ_ก", "ปีที่พบ_ก",
    "รหัสกลาง_ข", "ชื่อ_ข", "ปีที่พบ_ข",
    "ค่าความคล้าย_ร้อยละ", "ความต่างของชื่อ",
    "การตัดสิน", "ชื่อที่ใช้หลังรวม", "ผู้ตัดสิน", "วันที่ตัดสิน", "เหตุผล",
]


def read_csv(path):
    with io.open(path, encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def name_diff(a, b):
    """สรุปว่าชื่อสองอันต่างกันตรงไหน ให้คนอ่านตัดสินได้เร็วโดยไม่ต้องเทียบเอง"""
    parts = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
        if tag == "equal":
            continue
        parts.append("%s -> %s" % (a[i1:i2] or "(ว่าง)", b[j1:j2] or "(ว่าง)"))
    return " ; ".join(parts) or "(ต่างที่ช่องว่างหรือมองไม่เห็น)"


def main():
    rows = read_csv(SRC)

    # ข้อมูลรายรหัสกลาง เอาแถวแรกที่เจอเป็นตัวแทน
    info, years = {}, {}
    for r in rows:
        k = r["รหัสกลาง"]
        info.setdefault(k, r)
        years.setdefault(k, set()).add(r["ปีงบประมาณ"])
    code_of_name = {}
    for r in rows:
        code_of_name.setdefault(r["ชื่อมาตรฐาน"], r["รหัสกลาง"])

    # คู่ที่ต้องให้คนตัดสิน = รายการที่ระบบติดธงไว้ว่ามีชื่อใกล้กันในปีอื่น
    pairs = set()
    for r in rows:
        st = r["สถานะตรวจสอบการจับคู่"]
        if "ต้องตรวจสอบด้วยคน" not in st and "ตรวจเพิ่ม" not in st:
            continue
        other = code_of_name.get(r["ชื่อที่อาจเป็นรายการเดียวกัน"])
        if other and other != r["รหัสกลาง"]:
            pairs.add(tuple(sorted((r["รหัสกลาง"], other))))

    # คำตัดสินเดิมต้องไม่หาย ไฟล์นี้คืองานที่คนลงแรงตรวจไว้
    old = {}
    if os.path.exists(DST):
        for r in read_csv(DST):
            old[(r["รหัสกลาง_ก"], r["รหัสกลาง_ข"])] = r

    out, kept, added = [], 0, 0
    for a, b in sorted(pairs):
        na, nb = info[a]["ชื่อมาตรฐาน"], info[b]["ชื่อมาตรฐาน"]
        prev = old.get((a, b), {})
        if prev:
            kept += 1
        else:
            added += 1
        out.append({
            "รหัสกลาง_ก": a, "ชื่อ_ก": na, "ปีที่พบ_ก": " | ".join(sorted(years[a])),
            "รหัสกลาง_ข": b, "ชื่อ_ข": nb, "ปีที่พบ_ข": " | ".join(sorted(years[b])),
            "ค่าความคล้าย_ร้อยละ": info[a]["ค่าความคล้าย_ร้อยละ"],
            "ความต่างของชื่อ": name_diff(na, nb),
            # สี่ช่องนี้เป็นของคนกรอก สคริปต์แตะเฉพาะตอนที่ยังว่าง
            "การตัดสิน": prev.get("การตัดสิน", ""),
            "ชื่อที่ใช้หลังรวม": prev.get("ชื่อที่ใช้หลังรวม", ""),
            "ผู้ตัดสิน": prev.get("ผู้ตัดสิน", ""),
            "วันที่ตัดสิน": prev.get("วันที่ตัดสิน", ""),
            "เหตุผล": prev.get("เหตุผล", ""),
        })

    dropped = [k for k in old if k not in pairs]
    with io.open(DST, "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=COLS)
        w.writeheader()
        w.writerows(out)

    undecided = sum(1 for r in out if not r["การตัดสิน"].strip())
    print("เขียน %s" % DST)
    print("  คู่ทั้งหมด %d  (เดิม %d / ใหม่ %d)" % (len(out), kept, added))
    print("  ยังไม่ตัดสิน %d คู่" % undecided)
    if dropped:
        print("  เตือน: มี %d คู่ในไฟล์เดิมที่ไม่อยู่ในรายการติดธงแล้ว ถูกตัดออก" % len(dropped))
        for k in dropped:
            print("    %s + %s" % k)


if __name__ == "__main__":
    sys.exit(main())
