# ผลตรวจสอบ CSV

ตรวจวันที่ 11 กันยายน 2026 ครอบคลุม CSV 13 ไฟล์ จำนวน 146,847 ระเบียน (ไม่รวมหัวตาราง) ใน dataset โดยไม่แก้ไขไฟล์ต้นฉบับ

## สรุป

โครงสร้าง CSV อ่านได้ครบทุกไฟล์ แต่พบปัญหาคำแนะนำการรวมยอดและชนิดข้อมูลในพจนานุกรม รวมถึงตัวเลขงบประมาณที่ไม่สอดคล้องกันและต้องตรวจต้นทางก่อนแก้ไข

## 1. วิธีกรองแถวสรุปทำให้รวมงบเกินจริง

QC-026 แนะนำให้กรองด้วย `เป็นแถวสรุป` หรือ `เป็นรายการย่อยสุด` แต่สองวิธีให้ผลไม่เท่ากัน พบ 38 แถวที่มีรายการลูกแต่ถูกระบุ `เป็นแถวสรุป = ไม่ใช่` เนื่องจากสคริปต์กำหนดสถานะจากประเภทแถว ไม่ได้พิจารณาว่ามีลูกหรือไม่ บางแถวลูกเป็นรายละเอียดและถูกตัดออก บางแถวลูกเป็นรายการและยังถูกรวม จึงเกิดการนับซ้ำในภาพรวม

ควรใช้ `เป็นรายการย่อยสุด = ใช่` สำหรับรวมยอดจัดสรร และปรับคำอธิบาย QC-026/พจนานุกรมให้ตรงกับการทำงานจริง สำหรับยอดเบิกจ่ายและคงเหลือยังต้องแสดงความต่างตามข้อ 3

| ปี | รวมเมื่อกรองเป็นแถวสรุป = ไม่ใช่ | ยอดรวมรายปี / รายการย่อยสุด | ยอดเกิน (บาท) |
|---|---:|---:|---:|
| 2563 | 5,214,774,532.00 | 4,420,515,932.00 | 794,258,600.00 |
| 2564 | 6,491,635,400.00 | 5,798,710,000.00 | 692,925,400.00 |
| 2565 | 6,149,307,300.00 | 5,528,463,750.00 | 620,843,550.00 |
| 2566 | 7,622,741,960.00 | 6,938,487,760.00 | 684,254,200.00 |
| 2567 | 5,871,429,650.00 | 5,303,083,050.00 | 568,346,600.00 |

## 2. ชนิดข้อมูลหน้าอ้างอิงไม่ตรงกับค่าจริง

พจนานุกรมกำหนด `หน้าอ้างอิง` ของ organization_units.csv และ data_quality_checks.csv เป็นจำนวนเต็ม แต่ข้อมูลเป็นหลายหน้าคั่นด้วย ; หรือข้อความ เช่น ทุกหน้า พบ 189 และ 21 ระเบียนตามลำดับ รวม 210 ค่า หากบังคับชนิดจำนวนเต็มอาจนำเข้าไม่ผ่านหรือสูญเสียข้อมูล ควรแก้ชนิดเป็นข้อความ หรือแยกตารางรายการหน้าอ้างอิง

## 3. ตัวเลขงบประมาณไม่สอดคล้องกัน

พบ 529 แถวที่มีตัวเลขครบทั้งสามช่อง แต่ `จัดสรร - รวมเบิกจ่ายและผูกพัน` ไม่เท่ากับ `คงเหลือ` (เกณฑ์ต่างเกิน 0.02 บาท) ปี 2563: 80 แถว, 2564: 129 แถว, 2565: 117 แถว, 2566: 111 แถว, 2567: 92 แถว ตรงกับจำนวนที่บันทึกใน QC-001 ถึง QC-005 จำนวนนี้รวมทั้งแถวแม่และแถวลูก จึงห้ามบวกผลต่างทุกแถวเพื่อสรุปความเสียหาย

พบยอดสรุปกับผลรวมลูกโดยตรงต่างเกิน 1 บาท 5 จุดดังนี้ (ผลต่าง = ผลรวมลูก - แม่):

| ระเบียน CSV (หัวตารางเป็น 1) | รายละเอียด |
|---:|---|
| 191 | 2563-0190 - ค่าใช้สอย ; รวมเบิกจ่ายและผูกพัน parent=301990950.19 children=293990950.19 difference=-8000000.00 page=6 |
| 372 | 2564-0060 - ค่าใช้สอย ; คงเหลือ parent=91985980.16 children=92020436.51 difference=34456.35 page=2 |
| 446 | 2564-0134 - ค่าวัสดุ ; คงเหลือ parent=15778975.86 children=17469653.38 difference=1690677.52 page=4 |
| 679 | 2565-0059 - ค่าใช้สอย ; คงเหลือ parent=34902277.94 children=34947485.57 difference=45207.63 page=2 |
| 748 | 2565-0128 - ค่าวัสดุ ; คงเหลือ parent=4436116.78 children=5247141.28 difference=811024.50 page=4 |

คอลัมน์จัดสรรของแถวที่มีลูก 235 แถวตรงกับผลรวมลูกตามเกณฑ์ 1 บาท แต่คอลัมน์เบิกจ่ายต่าง 1 จุด และคงเหลือต่าง 4 จุด ข้อผิดปกติเหล่านี้ถูกบันทึกใน QC เดิมแล้ว การตรวจครั้งนี้ยืนยันจาก CSV โดยคำนวณใหม่ ยังไม่ได้ตรวจเทียบตัวเลขกับ PDF ทุกหน้าจึงยังฟันธงไม่ได้ว่าเกิดจากเอกสารต้นทาง การสกัด หรือการปรับปรุงงบ ควรเทียบหน้าที่ระบุก่อนเปลี่ยนค่า

## 4. ค่าว่างและการจับคู่ที่ต้องตีความให้ถูก

budget_items.csv มี 523 แถวที่ระบุว่าต้นฉบับเป็นขีด: จัดสรรว่าง 86 ช่อง เบิกจ่ายว่าง 90 ช่อง และคงเหลือว่าง 422 ช่อง (จำนวนช่องซ้อนกันในแถวเดียวได้) ไม่ควรเติมศูนย์อัตโนมัติ การตรวจสมการรายแถวข้างต้นทำเฉพาะแถวที่มีตัวเลขครบ ส่วนการตรวจยอดลูกเป็นการรวมตัวเลขที่มีอยู่ โดยค่าว่างไม่มีส่วนในผลรวม จึงไม่ใช่หลักฐานว่าค่าว่างเท่ากับศูนย์

project_year_mapping.csv มี 88 แถวที่เสนอชื่อคล้ายกัน ต้องยืนยันการจับคู่ด้วยคนตามสถานะในไฟล์ ไม่ใช่ข้อผิดพลาด CSV

## 5. ผลตรวจที่ผ่าน

- ทุกไฟล์อ่าน UTF-8 ได้ จำนวนคอลัมน์ครบ ไม่มีหัวคอลัมน์ซ้ำ ไม่มีระเบียนซ้ำทั้งแถว และไม่พบอักขระแทนที่ U+FFFD
- คีย์รหัสแถวงบประมาณ รหัสแถวสินทรัพย์ รหัสสินทรัพย์เต็ม และรหัสเอกสารไม่ซ้ำหรือว่าง
- ทะเบียนสินทรัพย์ 82,021 แถว: มูลค่าการได้มา + ค่าเสื่อมสะสม = มูลค่าตามบัญชีครบทุกแถวตามเกณฑ์ 0.02 บาท วันที่ พ.ศ./ค.ศ. อายุ และอัตราค่าเสื่อมที่ตรวจสัมพันธ์กัน
- ยอดเงินและจำนวนรายการในสรุปสินทรัพย์ตามหมวด พื้นที่/ศูนย์ต้นทุน และปีเดือนโอนเป็นทุนตรงกับทะเบียน รวมถึงยอดใน organization_units.csv
- ยอดจัดสรร เบิกจ่าย คงเหลือ จำนวนแถว และอัตราใน budget_annual_summary.csv ตรงกับข้อมูลอ้างอิงที่ตรวจ; ตัวเลขใน budget_category_summary.csv ตรงกับแถวต้นทาง
- รหัสแถวอ้างอิงและคอลัมน์ร่วมของ project_year_mapping.csv และ asset_review_candidates.csv ตรงกับทะเบียนต้นทาง
- รหัสเอกสาร ชื่อไฟล์ต้นทาง และช่วงเลขหน้าเดี่ยว/รายการเลขหน้าในไฟล์ข้อมูลตรงกับ source_documents.csv ตามรายการที่ตรวจ

ยอดสินทรัพย์รวม: ราคาทุน 5,419,079,845.60 บาท ค่าเสื่อมสะสม -4,285,809,628.96 บาท มูลค่าตามบัญชี 1,133,270,216.64 บาท

## รายละเอียดตำแหน่งที่ตรวจพบทั้งหมด

หมายเลขระเบียนนับหัวตารางเป็น 1 หากเซลล์มีข้อความหลายบรรทัด หมายเลขระเบียนอาจต่างจากเลขบรรทัดในโปรแกรมแก้ไขข้อความ

| ไฟล์ | ระเบียน | ประเภท | รายละเอียด |
|---|---:|---|---|
| data_quality_checks.csv | 2 | invalid_number | หน้าอ้างอิง: 1; 2; 3; 4; 5; 6; 7; 8 |
| data_quality_checks.csv | 3 | invalid_number | หน้าอ้างอิง: 1; 2; 3; 4; 5; 6; 7; 8 |
| data_quality_checks.csv | 4 | invalid_number | หน้าอ้างอิง: 1; 2; 3; 4; 5; 6; 7; 8 |
| data_quality_checks.csv | 5 | invalid_number | หน้าอ้างอิง: 1; 2; 3; 4; 5; 6; 7; 8 |
| data_quality_checks.csv | 6 | invalid_number | หน้าอ้างอิง: 1; 2; 3; 4; 5; 6; 7; 8 |
| data_quality_checks.csv | 7 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 8 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 10 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 11 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 16 | invalid_number | หน้าอ้างอิง: 1; 4; 176; 421; 883 |
| data_quality_checks.csv | 17 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 18 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 19 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 20 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 21 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 22 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 23 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 24 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 25 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 26 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| data_quality_checks.csv | 27 | invalid_number | หน้าอ้างอิง: ทุกหน้า |
| organization_units.csv | 3 | invalid_number | หน้าอ้างอิง: 385; 888; 989; 1067; 1098; 1110 |
| organization_units.csv | 4 | invalid_number | หน้าอ้างอิง: 401; 889; 993; 1068; 1132; 1632 |
| organization_units.csv | 5 | invalid_number | หน้าอ้างอิง: 410; 890; 994; 1069; 1636; 1853 |
| organization_units.csv | 6 | invalid_number | หน้าอ้างอิง: 418; 890; 995; 1070; 1132; 1641 |
| organization_units.csv | 7 | invalid_number | หน้าอ้างอิง: 428; 890; 995; 1070; 1645; 1855 |
| organization_units.csv | 8 | invalid_number | หน้าอ้างอิง: 434; 890; 996; 1071; 1646; 1855 |
| organization_units.csv | 9 | invalid_number | หน้าอ้างอิง: 439; 891; 996; 1071; 1132; 1648 |
| organization_units.csv | 10 | invalid_number | หน้าอ้างอิง: 441; 891; 996; 1649; 1856 |
| organization_units.csv | 11 | invalid_number | หน้าอ้างอิง: 444; 891; 997; 1071; 1098; 1650 |
| organization_units.csv | 12 | invalid_number | หน้าอ้างอิง: 448; 891; 997; 1071; 1653; 1857 |
| organization_units.csv | 13 | invalid_number | หน้าอ้างอิง: 458; 892; 998; 1072; 1098; 1659 |
| organization_units.csv | 14 | invalid_number | หน้าอ้างอิง: 478; 892; 998; 1073; 1098; 1662 |
| organization_units.csv | 15 | invalid_number | หน้าอ้างอิง: 480; 893; 999; 1073; 1664; 1858 |
| organization_units.csv | 16 | invalid_number | หน้าอ้างอิง: 481; 893; 999; 1074; 1665; 1858 |
| organization_units.csv | 17 | invalid_number | หน้าอ้างอิง: 497; 893; 999; 1074; 1669; 1859 |
| organization_units.csv | 18 | invalid_number | หน้าอ้างอิง: 507; 894; 1000; 1075; 1671; 1859 |
| organization_units.csv | 19 | invalid_number | หน้าอ้างอิง: 510; 894; 1000; 1075; 1132; 1672 |
| organization_units.csv | 20 | invalid_number | หน้าอ้างอิง: 512; 894; 1000; 1075; 1673; 1860 |
| organization_units.csv | 21 | invalid_number | หน้าอ้างอิง: 526; 895; 1001; 1076; 1099; 1678 |
| organization_units.csv | 22 | invalid_number | หน้าอ้างอิง: 532; 895; 1077; 1132; 1679; 1860 |
| organization_units.csv | 23 | invalid_number | หน้าอ้างอิง: 537; 895; 1001; 1077; 1099; 1681 |
| organization_units.csv | 24 | invalid_number | หน้าอ้างอิง: 539; 895; 1002; 1077; 1682; 1862 |
| organization_units.csv | 25 | invalid_number | หน้าอ้างอิง: 544; 896; 1002; 1078; 1099; 1686 |
| organization_units.csv | 26 | invalid_number | หน้าอ้างอิง: 546; 896; 1002; 1078; 1687; 1863 |
| organization_units.csv | 27 | invalid_number | หน้าอ้างอิง: 549; 896; 1003; 1078; 1690; 1863 |
| organization_units.csv | 28 | invalid_number | หน้าอ้างอิง: 552; 896; 1003; 1078; 1691; 1864 |
| organization_units.csv | 29 | invalid_number | หน้าอ้างอิง: 559; 897; 1004; 1079; 1692; 1864 |
| organization_units.csv | 30 | invalid_number | หน้าอ้างอิง: 559; 897; 1005; 1079; 1133; 1693 |
| organization_units.csv | 31 | invalid_number | หน้าอ้างอิง: 569; 897; 1006; 1079; 1696; 1865 |
| organization_units.csv | 32 | invalid_number | หน้าอ้างอิง: 574; 898; 1006; 1080; 1699; 1866 |
| organization_units.csv | 33 | invalid_number | หน้าอ้างอิง: 577; 898; 1007; 1080; 1701; 1866 |
| organization_units.csv | 34 | invalid_number | หน้าอ้างอิง: 584; 898; 1007; 1080; 1703; 1866 |
| organization_units.csv | 35 | invalid_number | หน้าอ้างอิง: 588; 898; 1008; 1080; 1704; 1867 |
| organization_units.csv | 36 | invalid_number | หน้าอ้างอิง: 595; 899; 1008; 1081; 1706; 1867 |
| organization_units.csv | 37 | invalid_number | หน้าอ้างอิง: 602; 899; 1008; 1081; 1111; 1708 |
| organization_units.csv | 38 | invalid_number | หน้าอ้างอิง: 607; 899; 1009; 1082; 1099; 1111 |
| organization_units.csv | 39 | invalid_number | หน้าอ้างอิง: 611; 900; 1009; 1082; 1710; 1869 |
| organization_units.csv | 40 | invalid_number | หน้าอ้างอิง: 613; 900; 1010; 1082; 1712; 1869 |
| organization_units.csv | 41 | invalid_number | หน้าอ้างอิง: 626; 900; 1016; 1083; 1716; 1872 |
| organization_units.csv | 42 | invalid_number | หน้าอ้างอิง: 632; 901; 1016; 1083; 1718; 1872 |
| organization_units.csv | 43 | invalid_number | หน้าอ้างอิง: 637; 901; 1017; 1084; 1721; 1872 |
| organization_units.csv | 44 | invalid_number | หน้าอ้างอิง: 640; 901; 1017; 1084; 1099; 1722 |
| organization_units.csv | 45 | invalid_number | หน้าอ้างอิง: 648; 901; 1018; 1084; 1724; 1874 |
| organization_units.csv | 46 | invalid_number | หน้าอ้างอิง: 656; 902; 1018; 1084; 1726; 1874 |
| organization_units.csv | 47 | invalid_number | หน้าอ้างอิง: 661; 902; 1019; 1085; 1728; 1874 |
| organization_units.csv | 48 | invalid_number | หน้าอ้างอิง: 664; 902; 1019; 1085; 1731; 1874 |
| organization_units.csv | 49 | invalid_number | หน้าอ้างอิง: 666; 903; 1020; 1085; 1733; 1875 |
| organization_units.csv | 50 | invalid_number | หน้าอ้างอิง: 671; 903; 1020; 1086; 1734; 1877 |
| organization_units.csv | 51 | invalid_number | หน้าอ้างอิง: 674; 903; 1020; 1086; 1736; 1877 |
| organization_units.csv | 52 | invalid_number | หน้าอ้างอิง: 676; 903; 1021; 1086; 1738; 1877 |
| organization_units.csv | 53 | invalid_number | หน้าอ้างอิง: 682; 904; 1021; 1087; 1099; 1740 |
| organization_units.csv | 54 | invalid_number | หน้าอ้างอิง: 685; 904; 1021; 1087; 1099; 1741 |
| organization_units.csv | 55 | invalid_number | หน้าอ้างอิง: 692; 904; 1022; 1087; 1743; 1879 |
| organization_units.csv | 56 | invalid_number | หน้าอ้างอิง: 695; 905; 1022; 1087; 1099; 1745 |
| organization_units.csv | 57 | invalid_number | หน้าอ้างอิง: 701; 905; 1023; 1088; 1748; 1880 |
| organization_units.csv | 58 | invalid_number | หน้าอ้างอิง: 706; 905; 1023; 1089; 1750; 1880 |
| organization_units.csv | 59 | invalid_number | หน้าอ้างอิง: 710; 905; 1023; 1089; 1752; 1881 |
| organization_units.csv | 60 | invalid_number | หน้าอ้างอิง: 712; 906; 1024; 1089; 1753; 1881 |
| organization_units.csv | 61 | invalid_number | หน้าอ้างอิง: 724; 906; 1025; 1089; 1758; 1881 |
| organization_units.csv | 62 | invalid_number | หน้าอ้างอิง: 791; 906; 1026; 1090; 1100; 1764 |
| organization_units.csv | 63 | invalid_number | หน้าอ้างอิง: 793; 907; 1027; 1090; 1133; 1765 |
| organization_units.csv | 64 | invalid_number | หน้าอ้างอิง: 797; 907; 1027; 1090; 1767; 1885 |
| organization_units.csv | 65 | invalid_number | หน้าอ้างอิง: 803; 907; 1028; 1091; 1770; 1886 |
| organization_units.csv | 66 | invalid_number | หน้าอ้างอิง: 820; 908; 1031; 1091; 1775; 1886 |
| organization_units.csv | 67 | invalid_number | หน้าอ้างอิง: 823; 908; 1031; 1091; 1776; 1887 |
| organization_units.csv | 68 | invalid_number | หน้าอ้างอิง: 827; 908; 1032; 1092; 1777; 1887 |
| organization_units.csv | 69 | invalid_number | หน้าอ้างอิง: 836; 908; 1032; 1092; 1780; 1888 |
| organization_units.csv | 70 | invalid_number | หน้าอ้างอิง: 841; 909; 1032; 1093; 1100; 1782 |
| organization_units.csv | 71 | invalid_number | หน้าอ้างอิง: 844; 909; 1033; 1093; 1111; 1783 |
| organization_units.csv | 72 | invalid_number | หน้าอ้างอิง: 848; 909; 1033; 1093; 1785; 1889 |
| organization_units.csv | 73 | invalid_number | หน้าอ้างอิง: 860; 910; 1034; 1094; 1100; 1133 |
| organization_units.csv | 74 | invalid_number | หน้าอ้างอิง: 863; 910; 1034; 1094; 1790; 1891 |
| organization_units.csv | 75 | invalid_number | หน้าอ้างอิง: 865; 910; 1034; 1095; 1791; 1891 |
| organization_units.csv | 76 | invalid_number | หน้าอ้างอิง: 869; 910; 1035; 1095; 1792; 1891 |
| organization_units.csv | 77 | invalid_number | หน้าอ้างอิง: 871; 911; 1035; 1095; 1100; 1794 |
| organization_units.csv | 78 | invalid_number | หน้าอ้างอิง: 874; 911; 1035; 1096; 1795; 1892 |
| organization_units.csv | 79 | invalid_number | หน้าอ้างอิง: 875; 911; 1035; 1096; 1797; 1892 |
| organization_units.csv | 80 | invalid_number | หน้าอ้างอิง: 75; 883; 943; 1039; 1096; 1101 |
| organization_units.csv | 81 | invalid_number | หน้าอ้างอิง: 76; 883; 944; 1039; 1158; 1816 |
| organization_units.csv | 82 | invalid_number | หน้าอ้างอิง: 81; 883; 944; 1040; 1160; 1817 |
| organization_units.csv | 83 | invalid_number | หน้าอ้างอิง: 87; 945; 1040; 1163 |
| organization_units.csv | 84 | invalid_number | หน้าอ้างอิง: 87; 883; 945; 1040; 1165 |
| organization_units.csv | 85 | invalid_number | หน้าอ้างอิง: 132; 953; 1040; 1096; 1101; 1552 |
| organization_units.csv | 86 | invalid_number | หน้าอ้างอิง: 133; 953; 1040; 1555; 1818 |
| organization_units.csv | 87 | invalid_number | หน้าอ้างอิง: 134; 953; 1040; 1111; 1556; 1818 |
| organization_units.csv | 88 | invalid_number | หน้าอ้างอิง: 140; 883; 954; 1040; 1558; 1818 |
| organization_units.csv | 89 | invalid_number | หน้าอ้างอิง: 140; 954; 1040; 1559; 1797; 1818 |
| organization_units.csv | 90 | invalid_number | หน้าอ้างอิง: 145; 884; 954; 1041; 1111; 1562 |
| organization_units.csv | 91 | invalid_number | หน้าอ้างอิง: 145; 884; 954; 1041; 1563; 1819 |
| organization_units.csv | 92 | invalid_number | หน้าอ้างอิง: 150; 884; 957; 1041; 1566; 1820 |
| organization_units.csv | 93 | invalid_number | หน้าอ้างอิง: 151; 958; 1042; 1567; 1820 |
| organization_units.csv | 94 | invalid_number | หน้าอ้างอิง: 154; 884; 960; 1059; 1101; 1570 |
| organization_units.csv | 95 | invalid_number | หน้าอ้างอิง: 160; 884; 960; 1059; 1101; 1573 |
| organization_units.csv | 96 | invalid_number | หน้าอ้างอิง: 168; 884; 961; 1059; 1111; 1576 |
| organization_units.csv | 97 | invalid_number | หน้าอ้างอิง: 184; 884; 966; 1060; 1096; 1580 |
| organization_units.csv | 98 | invalid_number | หน้าอ้างอิง: 190; 885; 967; 1060; 1101; 1584 |
| organization_units.csv | 99 | invalid_number | หน้าอ้างอิง: 219; 885; 967; 1060; 1101; 1111 |
| organization_units.csv | 100 | invalid_number | หน้าอ้างอิง: 225; 885; 968; 1061; 1101; 1590 |
| organization_units.csv | 101 | invalid_number | หน้าอ้างอิง: 235; 885; 970; 1061; 1111; 1594 |
| organization_units.csv | 102 | invalid_number | หน้าอ้างอิง: 242; 885; 970; 1061; 1101; 1600 |
| organization_units.csv | 103 | invalid_number | หน้าอ้างอิง: 248; 886; 971; 1062; 1603; 1826 |
| organization_units.csv | 104 | invalid_number | หน้าอ้างอิง: 252; 886; 971; 1062; 1111; 1605 |
| organization_units.csv | 105 | invalid_number | หน้าอ้างอิง: 256; 886; 972; 1062; 1097; 1103 |
| organization_units.csv | 106 | invalid_number | หน้าอ้างอิง: 267; 887; 975; 1063; 1097; 1106 |
| organization_units.csv | 107 | invalid_number | หน้าอ้างอิง: 303; 887; 984; 1065; 1097; 1106 |
| organization_units.csv | 108 | invalid_number | หน้าอ้างอิง: 314; 887; 986; 1065; 1098; 1108 |
| organization_units.csv | 109 | invalid_number | หน้าอ้างอิง: 366; 888; 987; 1066; 1098; 1110 |
| organization_units.csv | 110 | invalid_number | หน้าอ้างอิง: 369; 988; 1614; 1850 |
| organization_units.csv | 111 | invalid_number | หน้าอ้างอิง: 369; 988; 1066; 1614; 1850 |
| organization_units.csv | 112 | invalid_number | หน้าอ้างอิง: 376; 989; 1066; 1615; 1851 |
| organization_units.csv | 113 | invalid_number | หน้าอ้างอิง: 401; 889; 992; 1068; 1132; 1631 |
| organization_units.csv | 114 | invalid_number | หน้าอ้างอิง: 410; 889; 994; 1069; 1636; 1853 |
| organization_units.csv | 115 | invalid_number | หน้าอ้างอิง: 418; 890; 995; 1070; 1132; 1641 |
| organization_units.csv | 116 | invalid_number | หน้าอ้างอิง: 428; 890; 995; 1070; 1645; 1855 |
| organization_units.csv | 117 | invalid_number | หน้าอ้างอิง: 434; 890; 995; 1070; 1646; 1855 |
| organization_units.csv | 118 | invalid_number | หน้าอ้างอิง: 439; 891; 996; 1071; 1132; 1648 |
| organization_units.csv | 119 | invalid_number | หน้าอ้างอิง: 441; 891; 996; 1649; 1856 |
| organization_units.csv | 120 | invalid_number | หน้าอ้างอิง: 444; 891; 997; 1071; 1098; 1650 |
| organization_units.csv | 121 | invalid_number | หน้าอ้างอิง: 448; 891; 997; 1071; 1653; 1856 |
| organization_units.csv | 122 | invalid_number | หน้าอ้างอิง: 458; 892; 998; 1072; 1098; 1659 |
| organization_units.csv | 123 | invalid_number | หน้าอ้างอิง: 478; 892; 998; 1073; 1098; 1662 |
| organization_units.csv | 124 | invalid_number | หน้าอ้างอิง: 480; 892; 999; 1073; 1664; 1858 |
| organization_units.csv | 125 | invalid_number | หน้าอ้างอิง: 481; 893; 999; 1074; 1665; 1858 |
| organization_units.csv | 126 | invalid_number | หน้าอ้างอิง: 497; 893; 999; 1074; 1669; 1859 |
| organization_units.csv | 127 | invalid_number | หน้าอ้างอิง: 507; 894; 1000; 1075; 1671; 1859 |
| organization_units.csv | 128 | invalid_number | หน้าอ้างอิง: 510; 894; 1000; 1075; 1132; 1672 |
| organization_units.csv | 129 | invalid_number | หน้าอ้างอิง: 512; 894; 1000; 1075; 1673; 1859 |
| organization_units.csv | 130 | invalid_number | หน้าอ้างอิง: 526; 895; 1001; 1076; 1099; 1678 |
| organization_units.csv | 131 | invalid_number | หน้าอ้างอิง: 532; 895; 1077; 1132; 1679; 1860 |
| organization_units.csv | 132 | invalid_number | หน้าอ้างอิง: 537; 895; 1001; 1077; 1099; 1681 |
| organization_units.csv | 133 | invalid_number | หน้าอ้างอิง: 539; 895; 1001; 1077; 1682; 1862 |
| organization_units.csv | 134 | invalid_number | หน้าอ้างอิง: 544; 896; 1002; 1078; 1099; 1686 |
| organization_units.csv | 135 | invalid_number | หน้าอ้างอิง: 546; 896; 1002; 1078; 1687; 1863 |
| organization_units.csv | 136 | invalid_number | หน้าอ้างอิง: 549; 896; 1003; 1078; 1690; 1863 |
| organization_units.csv | 137 | invalid_number | หน้าอ้างอิง: 552; 896; 1003; 1078; 1691; 1864 |
| organization_units.csv | 138 | invalid_number | หน้าอ้างอิง: 559; 897; 1004; 1079; 1133; 1693 |
| organization_units.csv | 139 | invalid_number | หน้าอ้างอิง: 569; 897; 1006; 1079; 1696; 1865 |
| organization_units.csv | 140 | invalid_number | หน้าอ้างอิง: 574; 898; 1006; 1080; 1699; 1866 |
| organization_units.csv | 141 | invalid_number | หน้าอ้างอิง: 577; 898; 1007; 1080; 1701; 1866 |
| organization_units.csv | 142 | invalid_number | หน้าอ้างอิง: 584; 898; 1007; 1080; 1703; 1866 |
| organization_units.csv | 143 | invalid_number | หน้าอ้างอิง: 588; 898; 1007; 1080; 1704; 1866 |
| organization_units.csv | 144 | invalid_number | หน้าอ้างอิง: 595; 899; 1008; 1081; 1706; 1867 |
| organization_units.csv | 145 | invalid_number | หน้าอ้างอิง: 601; 899; 1008; 1081; 1111; 1708 |
| organization_units.csv | 146 | invalid_number | หน้าอ้างอิง: 607; 899; 1009; 1082; 1099; 1111 |
| organization_units.csv | 147 | invalid_number | หน้าอ้างอิง: 611; 899; 1009; 1082; 1710; 1868 |
| organization_units.csv | 148 | invalid_number | หน้าอ้างอิง: 613; 900; 1010; 1082; 1712; 1869 |
| organization_units.csv | 149 | invalid_number | หน้าอ้างอิง: 626; 900; 1016; 1083; 1716; 1872 |
| organization_units.csv | 150 | invalid_number | หน้าอ้างอิง: 632; 901; 1016; 1083; 1718; 1872 |
| organization_units.csv | 151 | invalid_number | หน้าอ้างอิง: 637; 901; 1017; 1083; 1721; 1872 |
| organization_units.csv | 152 | invalid_number | หน้าอ้างอิง: 640; 901; 1017; 1084; 1099; 1722 |
| organization_units.csv | 153 | invalid_number | หน้าอ้างอิง: 648; 901; 1018; 1084; 1724; 1874 |
| organization_units.csv | 154 | invalid_number | หน้าอ้างอิง: 656; 902; 1018; 1084; 1726; 1874 |
| organization_units.csv | 155 | invalid_number | หน้าอ้างอิง: 661; 902; 1019; 1085; 1728; 1874 |
| organization_units.csv | 156 | invalid_number | หน้าอ้างอิง: 664; 902; 1019; 1085; 1731; 1874 |
| organization_units.csv | 157 | invalid_number | หน้าอ้างอิง: 666; 903; 1020; 1085; 1732; 1875 |
| organization_units.csv | 158 | invalid_number | หน้าอ้างอิง: 671; 903; 1020; 1086; 1734; 1877 |
| organization_units.csv | 159 | invalid_number | หน้าอ้างอิง: 674; 903; 1020; 1086; 1736; 1877 |
| organization_units.csv | 160 | invalid_number | หน้าอ้างอิง: 676; 903; 1021; 1086; 1738; 1877 |
| organization_units.csv | 161 | invalid_number | หน้าอ้างอิง: 682; 904; 1021; 1087; 1099; 1740 |
| organization_units.csv | 162 | invalid_number | หน้าอ้างอิง: 685; 904; 1021; 1087; 1099; 1741 |
| organization_units.csv | 163 | invalid_number | หน้าอ้างอิง: 692; 904; 1022; 1087; 1743; 1879 |
| organization_units.csv | 164 | invalid_number | หน้าอ้างอิง: 695; 904; 1022; 1087; 1099; 1745 |
| organization_units.csv | 165 | invalid_number | หน้าอ้างอิง: 701; 905; 1023; 1088; 1748; 1880 |
| organization_units.csv | 166 | invalid_number | หน้าอ้างอิง: 706; 905; 1023; 1088; 1750; 1880 |
| organization_units.csv | 167 | invalid_number | หน้าอ้างอิง: 710; 905; 1023; 1089; 1752; 1881 |
| organization_units.csv | 168 | invalid_number | หน้าอ้างอิง: 712; 906; 1024; 1089; 1753; 1881 |
| organization_units.csv | 169 | invalid_number | หน้าอ้างอิง: 724; 906; 1025; 1089; 1758; 1881 |
| organization_units.csv | 170 | invalid_number | หน้าอ้างอิง: 791; 906; 1026; 1090; 1099; 1764 |
| organization_units.csv | 171 | invalid_number | หน้าอ้างอิง: 793; 907; 1026; 1090; 1133; 1765 |
| organization_units.csv | 172 | invalid_number | หน้าอ้างอิง: 797; 907; 1027; 1090; 1767; 1885 |
| organization_units.csv | 173 | invalid_number | หน้าอ้างอิง: 803; 907; 1028; 1091; 1770; 1886 |
| organization_units.csv | 174 | invalid_number | หน้าอ้างอิง: 820; 908; 1031; 1091; 1775; 1886 |
| organization_units.csv | 175 | invalid_number | หน้าอ้างอิง: 823; 908; 1031; 1091; 1776; 1887 |
| organization_units.csv | 176 | invalid_number | หน้าอ้างอิง: 827; 908; 1032; 1092; 1777; 1887 |
| organization_units.csv | 177 | invalid_number | หน้าอ้างอิง: 836; 908; 1032; 1092; 1780; 1888 |
| organization_units.csv | 178 | invalid_number | หน้าอ้างอิง: 841; 909; 1032; 1093; 1100; 1782 |
| organization_units.csv | 179 | invalid_number | หน้าอ้างอิง: 844; 909; 1033; 1093; 1111; 1783 |
| organization_units.csv | 180 | invalid_number | หน้าอ้างอิง: 848; 909; 1033; 1093; 1785; 1889 |
| organization_units.csv | 181 | invalid_number | หน้าอ้างอิง: 860; 910; 1034; 1094; 1100; 1133 |
| organization_units.csv | 182 | invalid_number | หน้าอ้างอิง: 863; 910; 1034; 1094; 1789; 1891 |
| organization_units.csv | 183 | invalid_number | หน้าอ้างอิง: 865; 910; 1034; 1095; 1791; 1891 |
| organization_units.csv | 184 | invalid_number | หน้าอ้างอิง: 869; 910; 1034; 1095; 1792; 1891 |
| organization_units.csv | 185 | invalid_number | หน้าอ้างอิง: 871; 911; 1035; 1095; 1100; 1794 |
| organization_units.csv | 186 | invalid_number | หน้าอ้างอิง: 874; 911; 1035; 1096; 1795; 1892 |
| organization_units.csv | 187 | invalid_number | หน้าอ้างอิง: 875; 911; 1035; 1096; 1797; 1892 |
| organization_units.csv | 188 | invalid_number | หน้าอ้างอิง: 379; 989; 1067; 1616; 1804; 1851 |
| organization_units.csv | 189 | invalid_number | หน้าอ้างอิง: 382; 888; 989; 1067; 1132; 1618 |
| organization_units.csv | 190 | invalid_number | หน้าอ้างอิง: 385; 888; 989; 1067; 1621; 1851 |
| organization_units.csv | 191 | invalid_number | หน้าอ้างอิง: 559; 897; 1004; 1078; 1692; 1864 |
| budget_items.csv | 5 | budget_equation | 2563-0004 1. ค่าใช้จ่ายในการจ้างพนักงานสำนักงานประกันสังคม ; difference=236610.00 ; page=1 |
| budget_items.csv | 11 | budget_equation | 2563-0010 7. ค่าตอบแทนพิเศษของพนักงานสำนักงานประกันสังคม ผู้ที่ได้รับค่าจ้างถึงขั้นสูง หรือใกล้ถึงขั้นสูงของอันดับหรือตำแหน่ง ; difference=-236610.0 ; page=1 |
| budget_items.csv | 22 | budget_equation | 2563-0021 แผนงานพื้นฐาน ; difference=13411063.00 ; page=1 |
| budget_items.csv | 37 | budget_equation | 2563-0036 รายจ่ายเพื่อบริหารงานประจำ ; difference=13411063.00 ; page=2 |
| budget_items.csv | 38 | budget_equation | 2563-0037 งบดำเนินงาน ; difference=4307928.54 ; page=2 |
| budget_items.csv | 39 | budget_equation | 2563-0038 - ค่าตอบแทน ; difference=-2546840.00 ; page=2 |
| budget_items.csv | 40 | budget_equation | 2563-0039 1. ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ ; difference=-2442740.0 ; page=2 |
| budget_items.csv | 41 | budget_equation | 2563-0040 2. ค่าเบี้ยประชุมคณะกรรมการ//อนุกรรมการคณะทำงาน ; difference=-12600.0 ; page=2 |
| budget_items.csv | 43 | budget_equation | 2563-0042 4. ค่าตอบแทนคณะกรรมการตรวจการจ้างและผู้ควบคุมงาน ก่อสร้างที่มีคำสั่งแต่งตั้งจากทางราชการ ; difference=-91500.0 ; page=2 |
| budget_items.csv | 55 | budget_equation | 2563-0054 - ค่าใช้สอย - ; difference=5265679.54 ; page=2 |
| budget_items.csv | 56 | budget_equation | 2563-0055 1. ค่าเบี้ยเลี้ยง ที่พัก พาหนะ และอื่น ๆ ; difference=1720317.00 ; page=2 |
| budget_items.csv | 57 | budget_equation | 2563-0056 2. ค่าผ่านทางด่วนพิเศษ ; difference=5910.0 ; page=2 |
| budget_items.csv | 58 | budget_equation | 2563-0057 3. ค่าใช้จ่ายในการเดินทางภายในประเทศของผู้รับการอบรม ; difference=-80000.00 ; page=2 |
| budget_items.csv | 59 | budget_equation | 2563-0058 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=1245370.00 ; page=2 |
| budget_items.csv | 60 | budget_equation | 2563-0059 - ค่ารับรองและพิธีการ ; difference=1245370.00 ; page=2 |
| budget_items.csv | 61 | budget_equation | 2563-0060 5. ค่าซ่อมแซมบำรุงรักษาทรัพย์สิน ; difference=-51900.00 ; page=2 |
| budget_items.csv | 64 | budget_equation | 2563-0063 8. ค่าจ้างเหมาบริการต่าง ๆ ; difference=-481840.00 ; page=2 |
| budget_items.csv | 65 | budget_equation | 2563-0064 9. ค่าจ้างเหมากำจัดปลวก มด แมลง และหนู ; difference=49400.0 ; page=3 |
| budget_items.csv | 66 | budget_equation | 2563-0065 10. ค่าจ้างเหมารักษาความปลอดภัยอาคารสำนักงานประกันสังคม ; difference=638248.00 ; page=3 |
| budget_items.csv | 67 | budget_equation | 2563-0066 11. ค่าจ้างเหมารักษาความสะอาดอาคารสำนักงานประกันสังคม ; difference=2191076.54 ; page=3 |
| budget_items.csv | 68 | budget_equation | 2563-0067 12. ค่าจ้างเหมาบำรุงรักษาสวนหย่อม ; difference=76612.00 ; page=3 |
| budget_items.csv | 69 | budget_equation | 2563-0068 13. ค่าจ้างเหมาพนักงานขับรถยนต์ ; difference=-795000.00 ; page=3 |
| budget_items.csv | 70 | budget_equation | 2563-0069 14. ค่าขนย้ายและติดตั้งครุภัณฑ์และทรัพย์สินต่าง ๆ ; difference=-40500.0 ; page=3 |
| budget_items.csv | 75 | budget_equation | 2563-0074 19. ค่าเช่าเครื่องถ่ายเอกสาร ; difference=953020.00 ; page=3 |
| budget_items.csv | 76 | budget_equation | 2563-0075 20. ค่าบำรุงรักษาระบบคอมพิวเตอร์ ; difference=1995678.0 ; page=3 |
| budget_items.csv | 104 | budget_equation | 2563-0103 28. ค่าจ้างบำรุงรักษาระบบสนับสนุนศูนย์คอมพิวเตอร์ (จังหวัดระยอง) พร้อมเชื่อมโยงเครือข่ายสัญญาณ เพื่อรับส่งข้อมูลระหว่างศูนย์คอมพิวเตอร์ ; difference=224655.2 ; page=4 |
| budget_items.csv | 109 | budget_equation | 2563-0108 33. ค่าจ้างบำรุงรักษาระบบจัดเก็บและแปลงเอกสารหลักฐานงานประกันสังคม จากรูปแบบกระดาษให้เป็นข้อมูลอิเล็กทรอนิกส์ ตามมาตรฐานภายใต้กรอบ ของกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม (EDOC) ; difference=118000.0 ; page=4 |
| budget_items.csv | 112 | budget_equation | 2563-0111 22. ค่าใช้จ่ายในการลี้ยงรับรองบุคคลหรือรับรองชาวต่างประเทศ ; difference=142270.0 ; page=4 |
| budget_items.csv | 116 | budget_equation | 2563-0115 26. ค่าธรรมเนียมทางกฎหมาย ; difference=-113140.00 ; page=4 |
| budget_items.csv | 125 | budget_equation | 2563-0124 35. ค่าตกแต่งสถานที่และค่าใช้จ่ายในการจัดงานต่าง ๆ ; difference=-728822.0 ; page=4 |
| budget_items.csv | 126 | budget_equation | 2563-0125 36. ค่าสมัครสมาชิกด้านการลงทุน ; difference=-1218920.00 ; page=4 |
| budget_items.csv | 128 | budget_equation | 2563-0127 - ค่าวัสดุ ; difference=1008769.00 ; page=4 |
| budget_items.csv | 129 | budget_equation | 2563-0128 1. วัสดุสำนักงาน ; difference=-212665.00 ; page=4 |
| budget_items.csv | 130 | budget_equation | 2563-0129 2. วัสดุคอมพิวเตอร์ ; difference=-312855.00 ; page=4 |
| budget_items.csv | 132 | budget_equation | 2563-0131 4. วัสดุแบบพิมพ์ ; difference=1938749.00 ; page=4 |
| budget_items.csv | 135 | budget_equation | 2563-0134 7. วัสดุโฆษณาและเผยแพร่ ; difference=-404460.0 ; page=4 |
| budget_items.csv | 140 | budget_equation | 2563-0139 - ค่าสาธารณูปโภค ; difference=580320.0 ; page=4 |
| budget_items.csv | 141 | budget_equation | 2563-0140 1. ค่าไฟฟ้า ; difference=930000.00 ; page=4 |
| budget_items.csv | 143 | budget_equation | 2563-0142 3. ค่าโทรศัพท์ ; difference=152320.00 ; page=5 |
| budget_items.csv | 144 | budget_equation | 2563-0143 4. ค่าไปรษณีย์ภัณฑ์ ; difference=-502000.00 ; page=5 |
| budget_items.csv | 147 | budget_equation | 2563-0146 งบลงทุน ; difference=-6162880.60 ; page=5 |
| budget_items.csv | 148 | budget_equation | 2563-0147 1. ครุภัณฑ์ ; difference=-3417260.60 ; page=5 |
| budget_items.csv | 151 | budget_equation | 2563-0150 รายการที่ดิน/อาคาร/สิ่งก่อสร้าง ; difference=-2745620.0 ; page=5 |
| budget_items.csv | 152 | budget_equation | 2563-0151 1. รายจ่ายเพื่อดัดแปลง ต่อเติมหรือปรับปรุงสิ่งก่อสร้าง ; difference=-1568920.0 ; page=5 |
| budget_items.csv | 156 | budget_equation | 2563-0155 งบเงินอุดหนุน ; difference=239040.00 ; page=5 |
| budget_items.csv | 158 | budget_equation | 2563-0157 2. ค่าสมาชิกสมาคมการประกันสังคมระหว่างประเทศ (ISSA) ; difference=239040.00 ; page=5 |
| budget_items.csv | 159 | budget_equation | 2563-0158 งบรายจ่ายอื่น ; difference=15026975.06 ; page=5 |
| budget_items.csv | 161 | budget_equation | 2563-0160 2. ค่าใช้จ่ายสนับสนุนการเข้าร่วมประชุมหรือฝึกอบรมของเจ้าหน้าที่และผู้ที่เกี่ยวข้อง ณ ต่างประเทศ ; difference=1250000.0 ; page=5 |
| budget_items.csv | 164 | budget_equation | 2563-0163 5. ค่าใช้จ่ายในการประชุม สัมมนา ฝึกอบรม และเจรจาธุรกิจของข้าราชการ เจ้าหน้าที่ และผู้ที่เกี่ยวข้อง ณ ต่างประเทศ ; difference=4161891.32 ; page=5 |
| budget_items.csv | 177 | budget_equation | 2563-0176 แผนงานยุทธศาสตร์ ; difference=-13411063.00 ; page=6 |
| budget_items.csv | 178 | budget_equation | 2563-0177 โครงการต่อเนื่อง ; difference=-8001500.00 ; page=6 |
| budget_items.csv | 179 | budget_equation | 2563-0178 งบดำเนินงาน ; difference=-7874700.00 ; page=6 |
| budget_items.csv | 180 | budget_equation | 2563-0179 - ค่าใช้สอย ; difference=-7874700.00 ; page=6 |
| budget_items.csv | 183 | budget_equation | 2563-0182 3. โครงการบริการส่งข้อความสั้นทางโทรศัพท์มือถือ Short Message Service (SMS) ; difference=-1665000.00 ; page=6 |
| budget_items.csv | 184 | budget_equation | 2563-0183 4. โครงการเช่าบริการศูนย์บริการข้อมูลประกันสังคม Contact Center 1506 ; difference=-6209700.00 ; page=6 |
| budget_items.csv | 185 | budget_equation | 2563-0184 งบรายจ่ายอื่น ; difference=-126800.0 ; page=6 |
| budget_items.csv | 186 | budget_equation | 2563-0185 - โครงการเพิ่มประสิทธิภาพในงานด้านคณิตศาสตร์ประกันภัย ; difference=-126800.0 ; page=6 |
| budget_items.csv | 187 | budget_equation | 2563-0186 รายจ่ายเพื่อบริหารงาน ; difference=-5409563.00 ; page=6 |
| budget_items.csv | 188 | budget_equation | 2563-0187 งบดำเนินงาน ; difference=-3726363.00 ; page=6 |
| budget_items.csv | 191 | budget_equation | 2563-0190 - ค่าใช้สอย ; difference=-36162480.00 ; page=6 |
| budget_items.csv | 191 | subtotal | 2563-0190 - ค่าใช้สอย ; รวมเบิกจ่ายและผูกพัน parent=301990950.19 children=293990950.19 difference=-8000000.00 page=6 |
| budget_items.csv | 194 | budget_equation | 2563-0193 3. โครงการประชุมชี้แจงสถานพยาบาลและเจ้าหน้าที่ประกันสังคมเกี่ยวกับข้อมูล การใช้บริการทางการแพทย์ของผู้ประกันตนและการตรวจสอบข้อมูล ; difference=415320.0 ; page=6 |
| budget_items.csv | 196 | budget_equation | 2563-0195 5. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=-208730.0 ; page=6 |
| budget_items.csv | 226 | budget_equation | 2563-0225 5.2 โครงการเสริมสร้างสมรรถนะบุคลากรของสำนักงานประกันสังคม ; difference=-208730.0 ; page=7 |
| budget_items.csv | 229 | budget_equation | 2563-0228 6. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม ; difference=-40000.00 ; page=7 |
| budget_items.csv | 230 | budget_equation | 2563-0229 - ค่าจัดประชุมชี้แจงให้ความรู้งานประกันสังคม ; difference=-40000.00 ; page=7 |
| budget_items.csv | 231 | budget_equation | 2563-0230 7. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=3771620.0 ; page=7 |
| budget_items.csv | 233 | budget_equation | 2563-0232 2. ผลิตและออกอากาศสื่อโทรทัศน์ ; difference=2965160.0 ; page=7 |
| budget_items.csv | 235 | budget_equation | 2563-0234 4. ผลิตและประชาสัมพันธ์ทางสื่อสิ่งพิมพ์ ; difference=404460.0 ; page=7 |
| budget_items.csv | 243 | budget_equation | 2563-0242 12. จัดทำปฏิทินประกันสังคม ประจำปี 2564 ; difference=402000.0 ; page=8 |
| budget_items.csv | 253 | budget_equation | 2563-0252 15. โครงการสื่อสารสร้างการรับรู้งานประกันสังคม ; difference=2000000.0 ; page=8 |
| budget_items.csv | 289 | budget_equation | 2563-0288 - ค่าสาธารณูปโภค ; difference=32436117.00 ; page=9 |
| budget_items.csv | 290 | budget_equation | 2563-0289 - ค่าธรรมเนียมการโอนเงินผ่านธนาคาร ; difference=32436117.00 ; page=9 |
| budget_items.csv | 291 | budget_equation | 2563-0290 1. ค่าธรรมเนียมการโอนเงิน ; difference=458558.00 ; page=9 |
| budget_items.csv | 292 | budget_equation | 2563-0291 2. ค่าธรรมเนียมรับเงินสมทบกองทุนประกันสังคมผ่านธนาคาร/หน่วยบริการ ; difference=23171587.0 ; page=9 |
| budget_items.csv | 293 | budget_equation | 2563-0292 3. ค่าธรรมเนียมจ่ายประโยชน์ทดแทน ; difference=8805972.0 ; page=9 |
| budget_items.csv | 294 | budget_equation | 2563-0293 งบลงทุน ; difference=-1750000.0 ; page=9 |
| budget_items.csv | 295 | budget_equation | 2563-0294 ค่าพัฒนา/ปรับปรุงระบบงาน ; difference=-1750000.0 ; page=9 |
| budget_items.csv | 302 | budget_equation | 2563-0301 งบรายจ่ายอื่น ; difference=66800.0 ; page=9 |
| budget_items.csv | 305 | budget_equation | 2563-0304 3. โครงการสำรวจความพึงพอใจสำนักงานประกันสังคม ปี 2563 ; difference=126800.0 ; page=9 |
| budget_items.csv | 311 | budget_equation | 2563-0310 9. โครงการสร้างการรับรู้แก่ผู้ประกันตนชาวเมียนมา (จ้างล่ามภาษาเมียนมา) ; difference=-60000.0 ; page=10 |
| budget_items.csv | 314 | budget_equation | 2564-0002 แผนงานบุคลากรภาครัฐ ; difference=97678339.82 ; page=1 |
| budget_items.csv | 315 | budget_equation | 2564-0003 งบบุคลากร ; difference=96786569.11 ; page=1 |
| budget_items.csv | 316 | budget_equation | 2564-0004 1. ค่าใช้จ่ายในการจ้างพนักงานประกันสังคม ; difference=92829116.00 ; page=1 |
| budget_items.csv | 317 | budget_equation | 2564-0005 2. เงินเพิ่มการครองชีพชั่วคราว ; difference=2143684.00 ; page=1 |
| budget_items.csv | 319 | budget_equation | 2564-0007 4. ค่าตอบแทนสำหรับข้าราชการระดับชำนาญการ/ชำนาญการพิเศษ ซึ่งปฏิบัติ หน้าที่ในฐานะหัวหน้าสำนักงานประกันสังคมจังหวัดสาขา ; difference=-7116.66 ; page=1 |
| budget_items.csv | 320 | budget_equation | 2564-0008 5. ค่าตอบแทนวิชาชีพเฉพาะด้านการลงทุนสำหรับข้าราชการ ; difference=1020883.34 ; page=1 |
| budget_items.csv | 321 | budget_equation | 2564-0009 6. ค่าตอบแทนวิชาชีพเฉพาะด้านคณิตศาสตร์ประกันภัยสำหรับข้าราชการ ; difference=800000.00 ; page=1 |
| budget_items.csv | 322 | budget_equation | 2564-0010 7. เงินค่าตอบแทนพิเศษ (กรณีค่าจ้างถึงขั้นสูง) ; difference=2.43 ; page=1 |
| budget_items.csv | 323 | budget_equation | 2564-0011 งบดำเนินงาน ; difference=891770.71 ; page=1 |
| budget_items.csv | 327 | budget_equation | 2564-0015 - ค่าใช้สอย ; difference=891770.71 ; page=1 |
| budget_items.csv | 328 | budget_equation | 2564-0016 1. เงินสมทบกองทุนประกันสังคม ; difference=891770.71 ; page=1 |
| budget_items.csv | 333 | budget_equation | 2564-0021 แผนงานพื้นฐาน ; difference=22953917.29 ; page=1 |
| budget_items.csv | 334 | budget_equation | 2564-0022 โครงการต่อเนื่อง ; difference=3694890.31 ; page=1 |
| budget_items.csv | 335 | budget_equation | 2564-0023 งบดำเนินงาน ; difference=3694890.31 ; page=1 |
| budget_items.csv | 336 | budget_equation | 2564-0024 - ค่าใช้สอย ; difference=3694890.31 ; page=1 |
| budget_items.csv | 337 | budget_equation | 2564-0025 1. ค่าเช่ารถยนต์ ; difference=4884.0 ; page=1 |
| budget_items.csv | 338 | budget_equation | 2564-0026 2. โครงการจ้างหน่วยงานบริการดูแลและเก็บรักษาหลักทรัพย์ (Custodian) ผู้ให้บริการรายเดิม ; difference=3690006.31 ; page=1 |
| budget_items.csv | 355 | budget_equation | 2564-0043 รายจ่ายเพื่อบริหารงานประจำ ; difference=19259026.98 ; page=2 |
| budget_items.csv | 356 | budget_equation | 2564-0044 งบดำเนินงาน ; difference=22243799.11 ; page=2 |
| budget_items.csv | 357 | budget_equation | 2564-0045 - ค่าตอบแทน ; difference=10658812.77 ; page=2 |
| budget_items.csv | 358 | budget_equation | 2564-0046 1. ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ ; difference=-2213437.23 ; page=2 |
| budget_items.csv | 359 | budget_equation | 2564-0047 2. ค่าเบี้ยประชุมคณะกรรมการ/อนุกรรมการ/คณะทำงาน ; difference=3653800.0 ; page=2 |
| budget_items.csv | 360 | budget_equation | 2564-0048 3. ค่าใช้จ่ายในการเดินทางมาประชุมของคณะกรรมการ ที่ปรึกษา และคณะอนุกรรมการ ; difference=2308500.0 ; page=2 |
| budget_items.csv | 361 | budget_equation | 2564-0049 4. ค่าตอบแทนคณะกรรมการตรวจรับพัสดุในงานจ้างก่อสร้างและผู้ควบคุมงาน ก่อสร้างที่มีคำสั่งแต่งตั้งจากทางราชการ ; difference=22250.0 ; page=2 |
| budget_items.csv | 363 | budget_equation | 2564-0051 6. ค่าตอบแทนประจำปี ; difference=5855100.00 ; page=2 |
| budget_items.csv | 370 | budget_equation | 2564-0058 13. ค่าตอบแทนล่ามในการแปลภาษาท้องถิ่น ภาษต่างประเทศ หรือภาษามือ ; difference=40000.0 ; page=2 |
| budget_items.csv | 372 | budget_equation | 2564-0060 - ค่าใช้สอย ; difference=14392993.54 ; page=2 |
| budget_items.csv | 372 | subtotal | 2564-0060 - ค่าใช้สอย ; คงเหลือ parent=91985980.16 children=92020436.51 difference=34456.35 page=2 |
| budget_items.csv | 373 | budget_equation | 2564-0061 1. ค่าเบี้ยเลี้ยง ที่พัก พาหนะ และอื่น ๆ ; difference=10460181.66 ; page=2 |
| budget_items.csv | 374 | budget_equation | 2564-0062 2. ค่าผ่านทางด่วนพิเศษ ; difference=1000.0 ; page=2 |
| budget_items.csv | 375 | budget_equation | 2564-0063 3. ค่าใช้จ่ายในการเดินทางภายในประเทศของผู้รับการอบรม ; difference=625030.00 ; page=2 |
| budget_items.csv | 376 | budget_equation | 2564-0064 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=2265927.25 ; page=2 |
| budget_items.csv | 377 | budget_equation | 2564-0065 - ค่ารับรองและพิธีการ ; difference=2265927.25 ; page=2 |
| budget_items.csv | 378 | budget_equation | 2564-0066 5. ค่าซ่อมแซมบำรุงรักษาทรัพย์สิน ; difference=-649506.51 ; page=2 |
| budget_items.csv | 380 | budget_equation | 2564-0068 7. ค่าซอมแซมปรับปรุงอาคารหรือสิ่งก่อสร้าง ; difference=-2198367.00 ; page=2 |
| budget_items.csv | 382 | budget_equation | 2564-0070 9. ค่าจ้างเหมากำจัดปลวก มด แมลง และหนู ; difference=65350.00 ; page=3 |
| budget_items.csv | 383 | budget_equation | 2564-0071 10. ค่าจ้างเหมารักษาความปลอดภัยอาคารสำนักงานประกันสังคม ; difference=-145176.00 ; page=3 |
| budget_items.csv | 384 | budget_equation | 2564-0072 11. ค่าจ้างเหมารักษาความสะอาดอาคารสำนักงานประกันสังคม ; difference=1938706.91 ; page=3 |
| budget_items.csv | 385 | budget_equation | 2564-0073 12. ค่าจ้างเหมาบำรุงรักษาสวนหย่อม ; difference=85048.01 ; page=3 |
| budget_items.csv | 386 | budget_equation | 2564-0074 13. ค่าจ้างเหมาพนักงานขับรถยนต์ ; difference=-495774.00 ; page=3 |
| budget_items.csv | 387 | budget_equation | 2564-0075 14. ค่าขนย้ายและติดตั้งครุภัณฑ์และทรัพย์สินต่าง ๆ ; difference=-60990.0 ; page=3 |
| budget_items.csv | 388 | budget_equation | 2564-0076 15. ค่าเช่าอาคารพาณิชย์เป็นที่ทำการสำนักงานประกันสังคมพื้นที่, และอาคารเก็บเอกสาร ; difference=-492000.00 ; page=3 |
| budget_items.csv | 390 | budget_equation | 2564-0078 17. ค่าประกันภัยรถยนต์ราชการ ; difference=786.81 ; page=3 |
| budget_items.csv | 391 | budget_equation | 2564-0079 19. ค่าเช่าเครื่องถ่ายเอกสาร ; difference=1014170.85 ; page=3 |
| budget_items.csv | 392 | budget_equation | 2564-0080 20. ค่าบำรุงรักษาระบบคอมพิวเตอร์ ; difference=343283.02 ; page=3 |
| budget_items.csv | 409 | budget_equation | 2564-0097 17. ค่าจ้างบำรุงรักษาระบบคอมพิวเตอร์พร้อมการรักษาความมั่นคงปลดดภัย ระดับคอมพิวเตอร์ลูกข่าย ; difference=60000.00 ; page=3 |
| budget_items.csv | 410 | budget_equation | 2564-0098 18. ค่าจ้างบำรุงรักษาระบบคอมพิวเตอร์และบริหารศูนย์คอมพิวเตอร์ (Cloud) ; difference=51000.00 ; page=3 |
| budget_items.csv | 420 | budget_equation | 2564-0108 28. ค่าจ้างบำรุงรักษาระบบสนับสนุนศูนย์คอมพิวเตอร์ (จังหวัดระยอง) พร้อมเชื่อมโยงเครือข่ายสัญญาณ เพื่อรับส่งข้อมูลระหว่างศูนย์คอมพิวเตอร์ ; difference=4000.0 ; page=3 |
| budget_items.csv | 423 | budget_equation | 2564-0111 31. ค่าจ้างบำรุงรักษาระบบจ่ายประโยชยน์ทดแทนค่าบริการทางการแพทย์ กรณีเจ็บป่วยฉุกเฉินวิกฤต (UCEP) ; difference=75556.22 ; page=4 |
| budget_items.csv | 429 | budget_equation | 2564-0117 21. ค่าใช้จ่ายในการลี้ยงรับรองบุคคลหรือรับรองชาวต่างประเทศ ; difference=34900.0 ; page=4 |
| budget_items.csv | 430 | budget_equation | 2564-0118 22. ค่าธรรมเนียมอื่น ๆ ; difference=7890.00 ; page=4 |
| budget_items.csv | 431 | budget_equation | 2564-0119 23. ค่าธรรมเนียมบริการรับ - ส่งเงินของ KGS ; difference=32200.00 ; page=4 |
| budget_items.csv | 433 | budget_equation | 2564-0121 25. ค่าธรรมเนียมทางกฎหมาย ; difference=137000.00 ; page=4 |
| budget_items.csv | 440 | budget_equation | 2564-0128 32. ค่าตอบแทนเหมาจ่ายในการติดตามเร่งรัดหนี้นอกสถานที่ ; difference=802785.00 ; page=4 |
| budget_items.csv | 441 | budget_equation | 2564-0129 33. ค่าจ้างทำของที่ระลึก ; difference=-10920.0 ; page=4 |
| budget_items.csv | 442 | budget_equation | 2564-0130 34. ค่าตกแต่งสถานที่และค่าใช้จ่ายในการจัดงานต่าง ๆ ; difference=447200.0 ; page=4 |
| budget_items.csv | 443 | budget_equation | 2564-0131 35. ค่าสมัครสมาชิกด้านการลงทุน ; difference=518418.54 ; page=4 |
| budget_items.csv | 446 | budget_equation | 2564-0134 - ค่าวัสดุ ; difference=-308979.20 ; page=4 |
| budget_items.csv | 446 | subtotal | 2564-0134 - ค่าวัสดุ ; คงเหลือ parent=15778975.86 children=17469653.38 difference=1690677.52 page=4 |
| budget_items.csv | 450 | budget_equation | 2564-0138 4. วัสดุแบบพิมพ์ ; difference=386265.00 ; page=4 |
| budget_items.csv | 451 | budget_equation | 2564-0139 5. หนังสือ วารสาร หนังสือพิมพ์ ; difference=5000.0 ; page=4 |
| budget_items.csv | 456 | budget_equation | 2564-0144 10. วัสดุช่างและไฟฟ้า ; difference=-205500.00 ; page=4 |
| budget_items.csv | 457 | budget_equation | 2564-0145 11. วัสดุก่อสร้าง ; difference=-103800.0 ; page=4 |
| budget_items.csv | 458 | budget_equation | 2564-0146 12. วัสดุน้ำมันเชื้อเพลิงและหล่อลื่น ; difference=309110.00 ; page=4 |
| budget_items.csv | 459 | budget_equation | 2564-0147 - ค่าสาธารณูปโภค ; difference=-2499028.00 ; page=5 |
| budget_items.csv | 460 | budget_equation | 2564-0148 1. ค่าไฟฟ้า ; difference=-250000.00 ; page=5 |
| budget_items.csv | 461 | budget_equation | 2564-0149 2. ค่าน้ำประปา ; difference=4000.00 ; page=5 |
| budget_items.csv | 462 | budget_equation | 2564-0150 3. ค่าโทรศัพท์ ; difference=-120000.00 ; page=5 |
| budget_items.csv | 463 | budget_equation | 2564-0151 4. ค่าไปรษณีย์ภัณฑ์ ; difference=-2055000.00 ; page=5 |
| budget_items.csv | 464 | budget_equation | 2564-0152 5. ค่าบริการสื่อสารและโทรคมนาคม ; difference=18972.00 ; page=5 |
| budget_items.csv | 465 | budget_equation | 2564-0153 6. ค่าธรรมเนียมจ่ายคืนเงินสมทบกองทุนประกันสังคมทั่วประเทศผ่านธนาคาร ; difference=-97000.0 ; page=5 |
| budget_items.csv | 467 | budget_equation | 2564-0155 งบลงทุน ; difference=-4324772.13 ; page=5 |
| budget_items.csv | 468 | budget_equation | 2564-0156 1. ครุภัณฑ์ ; difference=-1600892.13 ; page=5 |
| budget_items.csv | 470 | budget_equation | 2564-0158 รายการที่ดิน/อาคาร/สิ่งก่อสร้าง ; difference=-2723880.0 ; page=5 |
| budget_items.csv | 471 | budget_equation | 2564-0159 - รายจ่ายเพื่อดัดแปลง ต่อเติมหรือปรับปรุงสิ่งก่อสร้าง ; difference=-2723880.0 ; page=5 |
| budget_items.csv | 472 | budget_equation | 2564-0160 งบเงินอุดหนุน ; difference=1000000.00 ; page=5 |
| budget_items.csv | 475 | budget_equation | 2564-0163 งบรายจ่ายอื่น ; difference=340000.0 ; page=5 |
| budget_items.csv | 487 | budget_equation | 2564-0175 แผนงานยุทธศาสตร์ ; difference=-120632257.11 ; page=5 |
| budget_items.csv | 488 | budget_equation | 2564-0176 โครงการต่อเนื่อง ; difference=72691886.96 ; page=5 |
| budget_items.csv | 489 | budget_equation | 2564-0177 งบดำเนินงาน ; difference=8516327.96 ; page=5 |
| budget_items.csv | 490 | budget_equation | 2564-0178 - ค่าใช้สอย ; difference=8516327.96 ; page=5 |
| budget_items.csv | 492 | budget_equation | 2564-0180 2. โครงการบริการส่งข้อความสั้นทางโทรศัพท์มือถือ Short Message Service (SMS) ; difference=8516327.96 ; page=5 |
| budget_items.csv | 493 | budget_equation | 2564-0181 งบลงทุน ; difference=64463559.0 ; page=6 |
| budget_items.csv | 494 | budget_equation | 2564-0182 1. โครงการปรับเปลี่ยนระบบงานประกันสังคมบนเครื่องคอมพิวเตอร์เมนเฟรม เป็นระบบ Web Application ; difference=64463559.0 ; page=6 |
| budget_items.csv | 501 | budget_equation | 2564-0189 รายจ่ายเพื่อบริหารงาน ; difference=-193324144.07 ; page=6 |
| budget_items.csv | 502 | budget_equation | 2564-0190 งบดำเนินงาน ; difference=-212374069.07 ; page=6 |
| budget_items.csv | 503 | budget_equation | 2564-0191 - ค่าตอบแทน ; difference=-1792438.0 ; page=6 |
| budget_items.csv | 504 | budget_equation | 2564-0192 - ค่าตอบแทนส่งเสริมสนับสนุนการปฏิบัติงานให้แก่เครือข่ายประกันสังคมตามมาตรา 40 ; difference=-1792438.0 ; page=6 |
| budget_items.csv | 505 | budget_equation | 2564-0193 - ค่าใช้สอย ; difference=-1401127.31 ; page=6 |
| budget_items.csv | 506 | budget_equation | 2564-0194 1. โครงการส่งเสริมการจ้างงานผู้สูงอายุเข้าทำงานกับสำนักงานประกันสังคม ; difference=89100.0 ; page=6 |
| budget_items.csv | 507 | budget_equation | 2564-0195 2. โครงการส่งเสริมสุขภาพป้องกันโรคเชิงรุก ; difference=4224296.04 ; page=6 |
| budget_items.csv | 509 | budget_equation | 2564-0197 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=36349392.55 ; page=6 |
| budget_items.csv | 510 | budget_equation | 2564-0198 4.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง ; difference=23834653.6 ; page=6 |
| budget_items.csv | 512 | budget_equation | 2564-0200 2. โครงการพัฒนาสมรรถนะข้าราชการรัดบปฏิบัติการ ; difference=530557.0 ; page=6 |
| budget_items.csv | 515 | budget_equation | 2564-0203 5. โครงการพัฒนาศักยภาพผู้นำ ระดับชำนาญการพิเศษ The Leadership Dynamic Program ; difference=798900.0 ; page=6 |
| budget_items.csv | 516 | budget_equation | 2564-0204 6. โครงการสัมมนาผู้บริหารสำนักงานประกันสังคม ; difference=1416543.0 ; page=6 |
| budget_items.csv | 525 | budget_equation | 2564-0213 15. การดำเนินการทางวินัยสำหรับเจ้าหน้าที่สำนักงานประกันสังคม พ.ศ. 2564 ; difference=367440.0 ; page=6 |
| budget_items.csv | 527 | budget_equation | 2564-0215 17. โครงการพัฒนาสมรรถนะบุคลากรด้านการบริหารงานงบประมาณ และแผนปฏิบัติราชการ ; difference=899580.0 ; page=6 |
| budget_items.csv | 528 | budget_equation | 2564-0216 18. โครงการอบรมเชิงปฏิบัติการงานการเงินและบัญชีกองทุน ; difference=493940.0 ; page=7 |
| budget_items.csv | 540 | budget_equation | 2564-0228 30. โครงการอบรมเทคนิคการจัดการข้อร้องเรียน ; difference=773792.0 ; page=7 |
| budget_items.csv | 541 | budget_equation | 2564-0229 4.2 โครงการเสริมสร้างสมรรถนะบุคลากรของสำนักงานประกันสังคม ; difference=11750108.95 ; page=7 |
| budget_items.csv | 542 | budget_equation | 2564-0230 4.3 การฝึกอบรมทักษะด้านภาษาต่างประเทศเพื่อการปฏิบัติงาน ; difference=558400.0 ; page=7 |
| budget_items.csv | 543 | budget_equation | 2564-0231 4.3 การจัดการความรู้สำนักงานประกันสังคม ; difference=206230.0 ; page=7 |
| budget_items.csv | 544 | budget_equation | 2564-0232 5. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม ; difference=6801900.0 ; page=7 |
| budget_items.csv | 545 | budget_equation | 2564-0233 - ค่าจัดประชุมชี้แจงให้ความรู้งานประกันสังคม ; difference=6801900.0 ; page=7 |
| budget_items.csv | 546 | budget_equation | 2564-0234 6. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=20577751.0 ; page=7 |
| budget_items.csv | 548 | budget_equation | 2564-0236 2. ผลิตและออกอากาศสื่อโทรทัศน์ ; difference=10404974.0 ; page=7 |
| budget_items.csv | 550 | budget_equation | 2564-0238 4. ผลิตและประชาสัมพันธ์ทางสื่อสิ่งพิมพ์ ; difference=2784530.0 ; page=7 |
| budget_items.csv | 559 | budget_equation | 2564-0247 7. การจัดส่งข้าราชการและพนักงานสำนักงานประกันสังคมเข้ารับ การอบรมด้านวิชาการที่หน่วยงานภายนอกเป็นผู้จัด ; difference=3860085.0 ; page=7 |
| budget_items.csv | 560 | budget_equation | 2564-0248 8. การอบรมเชิงปฏิบัติการแก่นายจ้างเพื่อจัดทำข้อมูลและจ่ายเงินสมทบ กองทุนประกันสงคมผ่านระบบอิเล็กทรอนิกส์ (e-Payment) ; difference=2044464.5 ; page=7 |
| budget_items.csv | 561 | budget_equation | 2564-0249 9. โครงการให้ความรู้ด้านการประกันสังคมแก่แรงงานต่างด้าว ; difference=466098.4 ; page=7 |
| budget_items.csv | 565 | budget_equation | 2564-0253 13. โครงการเผยแพร่ประชาสัมพันธ์ความรู้เรื่องการประกันสังคมสู่สถานศึกษา ; difference=2351521.00 ; page=7 |
| budget_items.csv | 569 | budget_equation | 2564-0257 17. โครงการออกหน่วยเคลื่อนที่บริการเบ็ดเสร็จ Service Delivery Unit ; difference=2012768.9 ; page=8 |
| budget_items.csv | 570 | budget_equation | 2564-0258 18. โครงการ 1 ตำบล 1 หมู่บ้าน ประกันสังคมทั่วไทย ; difference=571245.0 ; page=8 |
| budget_items.csv | 571 | budget_equation | 2564-0259 19. โครงการพัฒนาศักยภาพแกนนำเครือข่ายประกันสังคม ; difference=3351920.0 ; page=8 |
| budget_items.csv | 573 | budget_equation | 2564-0261 21. โครงการวันประกันสังคม ; difference=112600.0 ; page=8 |
| budget_items.csv | 574 | budget_equation | 2564-0262 22. โครงการประกันสังคมทั่วไทยสู่แรงงานภาคอิสระ ; difference=1589800.0 ; page=8 |
| budget_items.csv | 582 | budget_equation | 2564-0270 30. โครงการฝึกอบรมเชิงปฏิบัติการซักซ้อมแผนการป้องกันและระงับอัคคีภัย ; difference=1309322.3 ; page=8 |
| budget_items.csv | 583 | budget_equation | 2564-0271 31. ค่าจ้างล่ามภาษาต่างประเทศ ; difference=-90000.0 ; page=8 |
| budget_items.csv | 586 | budget_equation | 2564-0274 34. โครงการสนับสนุนการตั้งจุดบริการฉีดวัคซีนโควิด 19 ให้ผู้ประกันตน ; difference=-49837545.0 ; page=8 |
| budget_items.csv | 596 | budget_equation | 2564-0284 - ค่าวัสดุ ; difference=487142.24 ; page=8 |
| budget_items.csv | 597 | budget_equation | 2564-0285 - โครงการประกันสังคมเยี่ยมผู้ประกันตนเจ็บป่วยในสถานพยาบาลและผู้ทุพพลภาพ และผู้ป่วยหลังภาวะวิกฤต (Intermediate Care) ; difference=487142.24 ; page=8 |
| budget_items.csv | 598 | budget_equation | 2564-0286 - ค่าสาธารณูปโภค ; difference=-209667646.00 ; page=8 |
| budget_items.csv | 599 | budget_equation | 2564-0287 - ค่าธรรมเนียมการโอนเงินผ่านธนาคาร ; difference=-209667646.00 ; page=8 |
| budget_items.csv | 600 | budget_equation | 2564-0288 1. ค่าธรรมเนียมการโอนเงิน ; difference=43000.00 ; page=8 |
| budget_items.csv | 601 | budget_equation | 2564-0289 2. ค่าธรรมเนียมรับเงินสมทบกองทุนประกันสังคมผ่านธนาคาร/หน่วยบริการ ; difference=-199255496.00 ; page=8 |
| budget_items.csv | 602 | budget_equation | 2564-0290 3. ค่าธรรมเนียมจ่ายประโยชน์ทดแทน ; difference=-10455150.00 ; page=8 |
| budget_items.csv | 612 | budget_equation | 2564-0300 งบเงินอุดหนุน ; difference=13600000.0 ; page=9 |
| budget_items.csv | 613 | budget_equation | 2564-0301 - โครงการส่งเสริมการมีส่วนร่วม เผยแพร่ ประชาสัมพันธ์งานประกันสังคมสู่ผู้ประกันตน ; difference=13600000.0 ; page=9 |
| budget_items.csv | 614 | budget_equation | 2564-0302 งบรายจ่ายอื่น ; difference=834200.0 ; page=9 |
| budget_items.csv | 617 | budget_equation | 2564-0305 3. โครงการประเมินประสิทธิผลของสิทธิประโยชน์ประกันสังคมกรณีชราภาพ ; difference=288000.0 ; page=9 |
| budget_items.csv | 622 | budget_equation | 2565-0002 แผนงานบุคลากรภาครัฐ ; difference=50255.87 ; page=1 |
| budget_items.csv | 623 | budget_equation | 2565-0003 งบบุคลากร ; difference=-7468544.13 ; page=1 |
| budget_items.csv | 624 | budget_equation | 2565-0004 1. ค่าใช้จ่ายในการจ้างพนักงานประกันสังคม ; difference=-8103874.86 ; page=1 |
| budget_items.csv | 625 | budget_equation | 2565-0005 2. เงินเพิ่มการครองชีพชั่วคราว ; difference=-4640.0 ; page=1 |
| budget_items.csv | 627 | budget_equation | 2565-0007 4. ค่าตอบแทนสำหรับข้าราชการระดับชำนาญการ/ชำนาญการพิเศษ ซึ่งปฏิบัติ หน้าที่ในฐานะหัวหน้าสำนักงานประกันสังคมจังหวัดสาขา ; difference=42455.87 ; page=1 |
| budget_items.csv | 628 | budget_equation | 2565-0008 5. ค่าตอบแทนวิชาชีพเฉพาะด้านการลงทุนสำหรับข้าราชการ ; difference=618356.79 ; page=1 |
| budget_items.csv | 630 | budget_equation | 2565-0010 7. เงินค่าตอบแทนพิเศษ (กรณีค่าจ้างถึงขั้นสูง) ; difference=-20841.93 ; page=1 |
| budget_items.csv | 631 | budget_equation | 2565-0011 งบดำเนินงาน ; difference=7518800.00 ; page=1 |
| budget_items.csv | 636 | budget_equation | 2565-0016 - ค่าใช้สอย ; difference=7518800.0 ; page=1 |
| budget_items.csv | 637 | budget_equation | 2565-0017 1. เงินสมทบกองทุนประกันสังคม ; difference=7518800.0 ; page=1 |
| budget_items.csv | 642 | budget_equation | 2565-0022 แผนงานพื้นฐาน ; difference=6814410.46 ; page=1 |
| budget_items.csv | 643 | budget_equation | 2565-0023 โครงการต่อเนื่อง ; difference=4884.0 ; page=1 |
| budget_items.csv | 663 | budget_equation | 2565-0043 รายจ่ายเพื่อบริหารงานประจำ ; difference=6809526.46 ; page=2 |
| budget_items.csv | 664 | budget_equation | 2565-0044 งบดำเนินงาน ; difference=51794709.32 ; page=2 |
| budget_items.csv | 665 | budget_equation | 2565-0045 - ค่าตอบแทน ; difference=10088486.83 ; page=2 |
| budget_items.csv | 666 | budget_equation | 2565-0046 1. ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ ; difference=331271.3 ; page=2 |
| budget_items.csv | 667 | budget_equation | 2565-0047 2. ค่าเบี้ยประชุมคณะกรรมการ/อนุกรรมการ/คณะทำงาน ; difference=4806965.0 ; page=2 |
| budget_items.csv | 668 | budget_equation | 2565-0048 3. ค่าใช้จ่ายในการเดินทางมาประชุมของคณะกรรมการ ที่ปรึกษา และคณะอนุกรรมการ ; difference=3621950.53 ; page=2 |
| budget_items.csv | 669 | budget_equation | 2565-0049 4. ค่าตอบแทนคณะกรรมการตรวจรับพัสดุในงานจ้างก่อสร้างและผู้ควบคุมงาน ก่อสร้างที่มีคำสั่งแต่งตั้งจากทางราชการ ; difference=121000.0 ; page=2 |
| budget_items.csv | 672 | budget_equation | 2565-0052 7. ค่าตอบแทนกรรมการออกข้อสอบและสอบสัมภาษณ์ ; difference=-5000.0 ; page=2 |
| budget_items.csv | 673 | budget_equation | 2565-0053 8. ค่าตอบแทนเจ้าหน้าที่ดำเนินการสอบ ; difference=-5700.0 ; page=2 |
| budget_items.csv | 674 | budget_equation | 2565-0054 9. ค่าตอบแทนแพทย์ผู้เชี่ยวชาญกรณีที่ให้คำปรึกษาและให้ความเห็น เป็นลายลักษณ์อักษรแก่สำนักงานประกันสังคม คณะกรรมการการแพทย์ และคณะอนุกรรมการในคณะกรรมการการแพทย์ ; difference=100000.0 ; page=2 |
| budget_items.csv | 679 | budget_equation | 2565-0059 - ค่าใช้สอย ; difference=32353140.39 ; page=2 |
| budget_items.csv | 679 | subtotal | 2565-0059 - ค่าใช้สอย ; คงเหลือ parent=34902277.94 children=34947485.57 difference=45207.63 page=2 |
| budget_items.csv | 680 | budget_equation | 2565-0060 1. ค่าเบี้ยเลี้ยง ที่พัก พาหนะ และอื่น ๆ ; difference=6219963.75 ; page=2 |
| budget_items.csv | 681 | budget_equation | 2565-0061 2. ค่าผ่านทางด่วนพิเศษ ; difference=47235.0 ; page=2 |
| budget_items.csv | 682 | budget_equation | 2565-0062 3. ค่าใช้จ่ายในการเดินทางภายในประเทศของผู้รับการอบรม ; difference=188898.00 ; page=2 |
| budget_items.csv | 683 | budget_equation | 2565-0063 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=2654158.41 ; page=2 |
| budget_items.csv | 684 | budget_equation | 2565-0064 - ค่ารับรองและพิธีการ ; difference=2654158.41 ; page=3 |
| budget_items.csv | 685 | budget_equation | 2565-0065 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=135292.26 ; page=3 |
| budget_items.csv | 686 | budget_equation | 2565-0066 - ค่าใช้จ่ายต่าง ๆ เพื่อประชาสัมพันธ์เผยแพร่ข่าวสารงานประกันสังคม ; difference=135292.26 ; page=3 |
| budget_items.csv | 687 | budget_equation | 2565-0067 6. ค่าซ่อมแซมบำรุงรักษาทรัพย์สิน ; difference=-43245.23 ; page=3 |
| budget_items.csv | 688 | budget_equation | 2565-0068 7. ค่าซ่อมแซมบำรุงรักษารถยนต์ ; difference=339405.10 ; page=3 |
| budget_items.csv | 689 | budget_equation | 2565-0069 8. ค่าซอมแซมปรับปรุงอาคารหรือสิ่งก่อสร้าง ; difference=-525216.44 ; page=3 |
| budget_items.csv | 690 | budget_equation | 2565-0070 9. ค่าจ้างเหมาบริการต่าง ๆ ; difference=-793487.56 ; page=3 |
| budget_items.csv | 691 | budget_equation | 2565-0071 10. ค่าจ้างเหมากำจัดปลวก มด แมลง และหนู ; difference=133456.0 ; page=3 |
| budget_items.csv | 692 | budget_equation | 2565-0072 11. ค่าจ้างเหมารักษาความปลอดภัยอาคารสำนักงานประกันสังคม ; difference=255024.00 ; page=3 |
| budget_items.csv | 693 | budget_equation | 2565-0073 12. ค่าจ้างเหมารักษาความสะอาดอาคารสำนักงานประกันสังคม ; difference=3173713.82 ; page=3 |
| budget_items.csv | 695 | budget_equation | 2565-0075 14. ค่าจ้างเหมาพนักงานขับรถยนต์ ; difference=1062146.00 ; page=3 |
| budget_items.csv | 696 | budget_equation | 2565-0076 15. ค่าขนย้ายและติดตั้งครุภัณฑ์และทรัพย์สินต่าง ๆ ; difference=-300441.49 ; page=3 |
| budget_items.csv | 697 | budget_equation | 2565-0077 16. ค่าเช่าอาคารพาณิชย์เป็นที่ทำการสำนักงานประกันสังคมพื้นที่, และอาคารเก็บเอกสาร ; difference=155676.00 ; page=3 |
| budget_items.csv | 699 | budget_equation | 2565-0079 18. ค่าประกันภัยรถยนต์ราชการ ; difference=-25930.89 ; page=3 |
| budget_items.csv | 700 | budget_equation | 2565-0080 19. ค่าเช่าเครื่องถ่ายเอกสาร ; difference=1097166.61 ; page=3 |
| budget_items.csv | 701 | budget_equation | 2565-0081 20. หนังสือ วารสาร หนังสือพิมพ์ ; difference=6000.0 ; page=3 |
| budget_items.csv | 704 | budget_equation | 2565-0084 23. ค่าใช้จ่ายในการลี้ยงรับรองบุคคลหรือรับรองชาวต่างประเทศ ; difference=14200.0 ; page=3 |
| budget_items.csv | 708 | budget_equation | 2565-0088 27. ค่าใช้จ่ายในการจ้างบันทึกข้อมูลเงินสมทบ ; difference=642334.44 ; page=3 |
| budget_items.csv | 709 | budget_equation | 2565-0089 28. ค่าตอบแทนเหมาจ่ายในการติดตามเร่งรัดหนี้นอกสถานที่ ; difference=1208600.0 ; page=3 |
| budget_items.csv | 710 | budget_equation | 2565-0090 29. ค่าธรรมเนียมอื่น ๆ ; difference=12036.0 ; page=3 |
| budget_items.csv | 711 | budget_equation | 2565-0091 30. ค่าธรรมเนียมบริการรับ - ส่งเงินของ KGS ; difference=322454.00 ; page=3 |
| budget_items.csv | 714 | budget_equation | 2565-0094 33. ค่าธรรมเนียมทางกฎหมาย ; difference=200000.0 ; page=3 |
| budget_items.csv | 715 | budget_equation | 2565-0095 34. ค่าป่วยการแก่พยานศาล ; difference=15000.0 ; page=3 |
| budget_items.csv | 716 | budget_equation | 2565-0096 35. ค่าสมัครสมาชิกด้านการลงทุน ; difference=-5355901.08 ; page=3 |
| budget_items.csv | 717 | budget_equation | 2565-0097 36. ค่าบำรุงรักษาระบบคอมพิวเตอร์ ; difference=22920855.74 ; page=3 |
| budget_items.csv | 748 | budget_equation | 2565-0128 - ค่าวัสดุ ; difference=4059199.87 ; page=4 |
| budget_items.csv | 748 | subtotal | 2565-0128 - ค่าวัสดุ ; คงเหลือ parent=4436116.78 children=5247141.28 difference=811024.50 page=4 |
| budget_items.csv | 751 | budget_equation | 2565-0131 3. วัสดุส่วนกลาง ; difference=1522.33 ; page=4 |
| budget_items.csv | 752 | budget_equation | 2565-0132 4. วัสดุแบบพิมพ์ ; difference=2749439.40 ; page=4 |
| budget_items.csv | 755 | budget_equation | 2565-0135 7. วัสดุงานบ้านงานครัว ; difference=92905.39 ; page=4 |
| budget_items.csv | 756 | budget_equation | 2565-0136 8. วัสดุเกษตร ; difference=15000.00 ; page=4 |
| budget_items.csv | 757 | budget_equation | 2565-0137 9. วัสดุช่างและไฟฟ้า ; difference=23047.90 ; page=4 |
| budget_items.csv | 759 | budget_equation | 2565-0139 11. วัสดุน้ำมันเชื้อเพลิงและหล่อลื่น ; difference=3011341.27 ; page=4 |
| budget_items.csv | 760 | budget_equation | 2565-0140 - ค่าสาธารณูปโภค ; difference=5293882.23 ; page=4 |
| budget_items.csv | 761 | budget_equation | 2565-0141 1. ค่าไฟฟ้า ; difference=1845042.45 ; page=4 |
| budget_items.csv | 762 | budget_equation | 2565-0142 2. ค่าน้ำประปา ; difference=137005.63 ; page=4 |
| budget_items.csv | 763 | budget_equation | 2565-0143 3. ค่าโทรศัพท์ ; difference=918517.60 ; page=4 |
| budget_items.csv | 764 | budget_equation | 2565-0144 4. ค่าไปรษณีย์ภัณฑ์ ; difference=2330563.53 ; page=4 |
| budget_items.csv | 765 | budget_equation | 2565-0145 5. ค่าบริการสื่อสารและโทรคมนาคม ; difference=232753.02 ; page=5 |
| budget_items.csv | 766 | budget_equation | 2565-0146 6. ค่าธรรมเนียมจ่ายคืนเงินสมทบกองทุนประกันสังคมทั่วประเทศผ่านธนาคาร ; difference=-170000.0 ; page=5 |
| budget_items.csv | 767 | budget_equation | 2565-0147 งบลงทุน ; difference=-1783105.75 ; page=5 |
| budget_items.csv | 768 | budget_equation | 2565-0148 1. ครุภัณฑ์ ; difference=516947.21 ; page=5 |
| budget_items.csv | 769 | budget_equation | 2565-0149 รายการที่ดิน/อาคาร/สิ่งก่อสร้าง ; difference=-2300052.96 ; page=5 |
| budget_items.csv | 770 | budget_equation | 2565-0150 1. รายจ่ายเพื่อดัดแปลง ต่อเติมหรือปรับปรุงสิ่งก่อสร้าง ; difference=-1801552.96 ; page=5 |
| budget_items.csv | 774 | budget_equation | 2565-0154 งบเงินอุดหนุน ; difference=999156.72 ; page=5 |
| budget_items.csv | 776 | budget_equation | 2565-0156 2. ค่าสมาชิกสมาคมการประกันสังคมระหว่างประเทศ (ISSA) ; difference=99156.72 ; page=5 |
| budget_items.csv | 777 | budget_equation | 2565-0157 งบรายจ่ายอื่น ; difference=-44201233.83 ; page=5 |
| budget_items.csv | 783 | budget_equation | 2565-0163 6. โครงการจ้างวิเคราะห์การจัดกลุ่มวินิจฉัยโรคร่วมและน้ำหนักสัมพัทธ์ของผู้ป่วยใน และวิเคราะห์ข้อมูลผู้ป่วยในที่มีค่าใช้จ่ายสูงเกินปกติ ; difference=-4200000.0 ; page=5 |
| budget_items.csv | 793 | budget_equation | 2565-0173 แผนงานยุทธศาสตร์ ; difference=-6864666.33 ; page=6 |
| budget_items.csv | 794 | budget_equation | 2565-0174 โครงการต่อเนื่อง ; difference=-1743500.0 ; page=6 |
| budget_items.csv | 810 | budget_equation | 2565-0190 งบรายจ่ายอื่น ; difference=-1743500.0 ; page=6 |
| budget_items.csv | 811 | budget_equation | 2565-0191 1. โครงการเพิ่มประสิทธิภาพในงานด้านคณิตศาสตร์ประกันภัย ; difference=-1743500.0 ; page=6 |
| budget_items.csv | 815 | budget_equation | 2565-0195 รายจ่ายเพื่อบริหารงาน ; difference=-5121166.33 ; page=6 |
| budget_items.csv | 816 | budget_equation | 2565-0196 งบดำเนินงาน ; difference=-11916325.60 ; page=6 |
| budget_items.csv | 817 | budget_equation | 2565-0197 - ค่าตอบแทน ; difference=12675.0 ; page=6 |
| budget_items.csv | 818 | budget_equation | 2565-0198 - ค่าตอบแทนส่งเสริมสนับสนุนการปฏิบัติงานให้แก่เครือข่ายประกันสังคมตามมาตรา 40 ; difference=12675.0 ; page=6 |
| budget_items.csv | 819 | budget_equation | 2565-0199 - ค่าใช้สอย ; difference=17923618.24 ; page=6 |
| budget_items.csv | 820 | budget_equation | 2565-0200 1. โครงการส่งเสริมการจ้างงานผู้สูงอายุเข้าทำงานกับสำนักงานประกันสังคม ; difference=1738369.50 ; page=6 |
| budget_items.csv | 821 | budget_equation | 2565-0201 2. โครงการส่งเสริมสุขภาพป้องกันโรคเชิงรุก ; difference=62046.30 ; page=6 |
| budget_items.csv | 822 | budget_equation | 2565-0202 3. โครงการประชุมวิชาการประกันสังคม ; difference=-3887635.00 ; page=6 |
| budget_items.csv | 823 | budget_equation | 2565-0203 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=-1293408.11 ; page=6 |
| budget_items.csv | 824 | budget_equation | 2565-0204 4.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง ; difference=-3700378.58 ; page=6 |
| budget_items.csv | 831 | budget_equation | 2565-0211 7. โครงการพัฒนาทักษะภาษาต่างประเทศ ; difference=529700.0 ; page=7 |
| budget_items.csv | 835 | budget_equation | 2565-0215 11. โครงการอบรมเชิงปฏิบัติการเพื่อการเพิ่มประสิทธิภาพงานวินิจฉัยประโยชน์ทดแทน ; difference=185516.4 ; page=7 |
| budget_items.csv | 838 | budget_equation | 2565-0218 14. โครงการพัฒนาสมรรถนะผู้ปฏิบัติงานด้านกฎหมาย ; difference=72840.0 ; page=7 |
| budget_items.csv | 846 | budget_equation | 2565-0226 4.2 โครงการเสริมสร้างสมรรถนะบุคลากรของสำนักงานประกันสังคม ; difference=2340275.47 ; page=7 |
| budget_items.csv | 847 | budget_equation | 2565-0227 4.3 การฝึกอบรมทักษะด้านภาษาต่างประเทศเพื่อการปฏิบัติงาน ; difference=11500.0 ; page=7 |
| budget_items.csv | 848 | budget_equation | 2565-0228 4.3 การจัดการความรู้สำนักงานประกันสังคม ; difference=55195.00 ; page=7 |
| budget_items.csv | 849 | budget_equation | 2565-0229 5. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม ; difference=213509.45 ; page=7 |
| budget_items.csv | 850 | budget_equation | 2565-0230 - ค่าจัดประชุมชี้แจงให้ความรู้งานประกันสังคม ; difference=213509.45 ; page=7 |
| budget_items.csv | 851 | budget_equation | 2565-0231 6. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=6390603.0 ; page=7 |
| budget_items.csv | 853 | budget_equation | 2565-0233 2. ผลิตและออกอากาศสื่อโทรทัศน์ ; difference=610315.0 ; page=7 |
| budget_items.csv | 864 | budget_equation | 2565-0244 7. การจัดส่งข้าราชการและพนักงานสำนักงานประกันสังคมเข้ารับ การอบรมด้านวิชาการที่หน่วยงานภายนอกเป็นผู้จัด ; difference=2813536.00 ; page=7 |
| budget_items.csv | 865 | budget_equation | 2565-0245 8. โครงการอบรมเชิงปฏิบัติการแก่นายจ้างเพื่อจัดทำข้อมูลและจ่ายเงินสมทบ กองทุนประกันสงคมผ่านระบบอิเล็กทรอนิกส์ (e-Payment) ; difference=438399.95 ; page=7 |
| budget_items.csv | 866 | budget_equation | 2565-0246 9. โครงการให้ความรู้ด้านการประกันสังคมแก่แรงงานต่างด้าว ; difference=4720.0 ; page=8 |
| budget_items.csv | 867 | budget_equation | 2565-0247 10. โครงการตรวจสอบสถานประกอบการเพื่อป้องกันการแสวงประโยชน์ จากการใช้แรงงานและกองทุน ; difference=18522.0 ; page=8 |
| budget_items.csv | 871 | budget_equation | 2565-0251 14. โครงการออกหน่วยเคลื่อนที่บริการเบ็ดเสร็จ Service Delivery Unit ; difference=449460.0 ; page=8 |
| budget_items.csv | 872 | budget_equation | 2565-0252 15. โครงการพัฒนาศักยภาพแกนนำเครือข่ายประกันสังคม ; difference=110775.0 ; page=8 |
| budget_items.csv | 882 | budget_equation | 2565-0262 25. ค่าจ้างล่ามภาษาต่างประเทศ ; difference=35500.0 ; page=8 |
| budget_items.csv | 883 | budget_equation | 2565-0263 26. โครงการสนับสนุนการตั้งจุดบริการฉีดวัคซีนโควิด 19 เข็มกระตุ้นให้ผู้ประกันตน ในกรุงเทพมหานคร และในจังหวัดชลบุรี ระยอง ฉะเชิงเทรา สมุทรปราการ ปทุมธานี สมุทรสาคร นนทบุรี พระนครศรีอยุธยา และสงขลา ; difference=17933990.9 ; page=8 |
| budget_items.csv | 897 | budget_equation | 2565-0277 - ค่าวัสดุ ; difference=23172.24 ; page=8 |
| budget_items.csv | 898 | budget_equation | 2565-0278 - โครงการประกันสังคมเยี่ยมผู้ประกันตนเจ็บป่วยในสถานพยาบาลและผู้ทุพพลภาพ และผู้ป่วยหลังภาวะวิกฤต (Intermediate Care) ; difference=23172.24 ; page=8 |
| budget_items.csv | 899 | budget_equation | 2565-0279 - ค่าสาธารณูปโภค ; difference=-29875791.08 ; page=8 |
| budget_items.csv | 900 | budget_equation | 2565-0280 - ค่าธรรมเนียมการโอนเงินผ่านธนาคาร ; difference=-29875791.08 ; page=8 |
| budget_items.csv | 901 | budget_equation | 2565-0281 1. ค่าธรรมเนียมการโอนเงิน ; difference=489826.92 ; page=8 |
| budget_items.csv | 902 | budget_equation | 2565-0282 2. ค่าธรรมเนียมรับเงินสมทบกองทุนประกันสังคมผ่านธนาคาร/หน่วยบริการ ; difference=-88214634.00 ; page=9 |
| budget_items.csv | 903 | budget_equation | 2565-0283 3. ค่าธรรมเนียมจ่ายประโยชน์ทดแทน ; difference=57849016.00 ; page=9 |
| budget_items.csv | 904 | budget_equation | 2565-0284 งบลงทุน ; difference=1776700.0 ; page=9 |
| budget_items.csv | 913 | budget_equation | 2565-0293 งบเงินอุดหนุน ; difference=2557595.27 ; page=9 |
| budget_items.csv | 914 | budget_equation | 2565-0294 - โครงการส่งเสริมการมีส่วนร่วม เผยแพร่ ประชาสัมพันธ์งานประกันสังคมสู่ผู้ประกันตน ; difference=2557595.27 ; page=9 |
| budget_items.csv | 915 | budget_equation | 2565-0295 งบรายจ่ายอื่น ; difference=2460864.0 ; page=9 |
| budget_items.csv | 924 | budget_equation | 2566-0002 แผนงานบุคลากรภาครัฐ ; difference=660000.00 ; page=1 |
| budget_items.csv | 925 | budget_equation | 2566-0003 งบบุคลากร ; difference=660000.00 ; page=1 |
| budget_items.csv | 930 | budget_equation | 2566-0008 5. ค่าตอบแทนวิชาชีพเฉพาะด้านการลงทุนสำหรับข้าราชการ ; difference=500000.0 ; page=1 |
| budget_items.csv | 931 | budget_equation | 2566-0009 6. ค่าตอบแทนวิชาชีพเฉพาะด้านคณิตศาสตร์ประกันภัยสำหรับข้าราชการ ; difference=160000.0 ; page=1 |
| budget_items.csv | 944 | budget_equation | 2566-0022 แผนงานพื้นฐาน ; difference=-27048370.65 ; page=1 |
| budget_items.csv | 945 | budget_equation | 2566-0023 โครงการต่อเนื่อง ; difference=-5280000.0 ; page=1 |
| budget_items.csv | 965 | budget_equation | 2566-0043 รายจ่ายเพื่อบริหารงานประจำ ; difference=-21768370.65 ; page=2 |
| budget_items.csv | 966 | budget_equation | 2566-0044 งบดำเนินงาน ; difference=7203132.7 ; page=2 |
| budget_items.csv | 967 | budget_equation | 2566-0045 - ค่าตอบแทน ; difference=4879372.00 ; page=2 |
| budget_items.csv | 968 | budget_equation | 2566-0046 1. ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ ; difference=-1256698.00 ; page=2 |
| budget_items.csv | 969 | budget_equation | 2566-0047 2. ค่าเบี้ยประชุมคณะกรรมการ/อนุกรรมการ/คณะทำงาน ; difference=3021640.0 ; page=2 |
| budget_items.csv | 970 | budget_equation | 2566-0048 3. ค่าใช้จ่ายในการเดินทางมาประชุมของคณะกรรมการ ที่ปรึกษา และคณะอนุกรรมการ ; difference=2887600.0 ; page=2 |
| budget_items.csv | 971 | budget_equation | 2566-0049 4. ค่าตอบแทนคณะกรรมการตรวจรับพัสดุในงานจ้างก่อสร้างและผู้ควบคุมงาน ก่อสร้างที่มีคำสั่งแต่งตั้งจากทางราชการ ; difference=-256240.0 ; page=2 |
| budget_items.csv | 974 | budget_equation | 2566-0052 7. ค่าตอบแทนกรรมการออกข้อสอบและสอบสัมภาษณ์ ; difference=206070.0 ; page=2 |
| budget_items.csv | 975 | budget_equation | 2566-0053 8. ค่าตอบแทนเจ้าหน้าที่ดำเนินการสอบ ; difference=227000.0 ; page=2 |
| budget_items.csv | 976 | budget_equation | 2566-0054 9. ค่าตอบแทนแพทย์ผู้เชี่ยวชาญกรณีที่ให้คำปรึกษาและให้ความเห็น เป็นลายลักษณ์อักษรแก่สำนักงานประกันสังคม คณะกรรมการการแพทย์ และคณะอนุกรรมการในคณะกรรมการการแพทย์ ; difference=50000.0 ; page=2 |
| budget_items.csv | 980 | budget_equation | 2566-0058 - ค่าใช้สอย ; difference=13390941.16 ; page=2 |
| budget_items.csv | 981 | budget_equation | 2566-0059 1. ค่าเบี้ยเลี้ยง ที่พัก พาหนะ และอื่น ๆ ; difference=2589335.06 ; page=2 |
| budget_items.csv | 982 | budget_equation | 2566-0060 2. ค่าผ่านทางด่วนพิเศษ ; difference=-5555.94 ; page=2 |
| budget_items.csv | 983 | budget_equation | 2566-0061 3. ค่าใช้จ่ายในการเดินทางภายในประเทศของผู้รับการอบรม ; difference=-180000.0 ; page=2 |
| budget_items.csv | 984 | budget_equation | 2566-0062 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=1762393.11 ; page=2 |
| budget_items.csv | 985 | budget_equation | 2566-0063 - ค่ารับรองและพิธีการ ; difference=1762393.11 ; page=3 |
| budget_items.csv | 986 | budget_equation | 2566-0064 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=181564.15 ; page=3 |
| budget_items.csv | 987 | budget_equation | 2566-0065 - ค่าใช้จ่ายต่าง ๆ เพื่อประชาสัมพันธ์เผยแพร่ข่าวสารงานประกันสังคม ; difference=181564.15 ; page=3 |
| budget_items.csv | 988 | budget_equation | 2566-0066 6. ค่าซ่อมแซมบำรุงรักษาทรัพย์สิน ; difference=-355160.13 ; page=3 |
| budget_items.csv | 989 | budget_equation | 2566-0067 7. ค่าซ่อมแซมบำรุงรักษารถยนต์ ; difference=-513117.56 ; page=3 |
| budget_items.csv | 990 | budget_equation | 2566-0068 8. ค่าซอมแซมปรับปรุงอาคารหรือสิ่งก่อสร้าง ; difference=-853699.95 ; page=3 |
| budget_items.csv | 991 | budget_equation | 2566-0069 9. ค่าจ้างเหมาบริการต่าง ๆ ; difference=1318972.55 ; page=3 |
| budget_items.csv | 992 | budget_equation | 2566-0070 10. ค่าจ้างเหมากำจัดปลวก มด แมลง และหนู ; difference=75400.0 ; page=3 |
| budget_items.csv | 993 | budget_equation | 2566-0071 11. ค่าจ้างเหมารักษาความปลอดภัยอาคารสำนักงานประกันสังคม ; difference=1079768.00 ; page=3 |
| budget_items.csv | 994 | budget_equation | 2566-0072 12. ค่าจ้างเหมารักษาความสะอาดอาคารสำนักงานประกันสังคม ; difference=2075096.86 ; page=3 |
| budget_items.csv | 995 | budget_equation | 2566-0073 13. ค่าจ้างเหมาบำรุงรักษาสวนหย่อม ; difference=29293.00 ; page=3 |
| budget_items.csv | 996 | budget_equation | 2566-0074 14. ค่าจ้างเหมาพนักงานขับรถยนต์ ; difference=409958.00 ; page=3 |
| budget_items.csv | 997 | budget_equation | 2566-0075 15. ค่าขนย้ายและติดตั้งครุภัณฑ์และทรัพย์สินต่าง ๆ ; difference=17493.16 ; page=3 |
| budget_items.csv | 998 | budget_equation | 2566-0076 16. ค่าเช่าอาคารพาณิชย์เป็นที่ทำการสำนักงานประกันสังคมพื้นที่, และอาคารเก็บเอกสาร ; difference=130635.48 ; page=3 |
| budget_items.csv | 1000 | budget_equation | 2566-0078 18. ค่าประกันภัยรถยนต์ราชการ ; difference=672780.00 ; page=3 |
| budget_items.csv | 1001 | budget_equation | 2566-0079 19. ค่าเช่าเครื่องถ่ายเอกสาร ; difference=630733.26 ; page=3 |
| budget_items.csv | 1002 | budget_equation | 2566-0080 20. หนังสือ วารสาร หนังสือพิมพ์ ; difference=17310.35 ; page=3 |
| budget_items.csv | 1003 | budget_equation | 2566-0081 21. ค่าจ้างทำของที่ระลึก ; difference=-1449237.4 ; page=3 |
| budget_items.csv | 1010 | budget_equation | 2566-0088 28. ค่าตอบแทนเหมาจ่ายในการติดตามเร่งรัดหนี้นอกสถานที่ ; difference=29600.00 ; page=3 |
| budget_items.csv | 1012 | budget_equation | 2566-0090 30. ค่าธรรมเนียมกรณีขอรับเงินธนาณัติเป็นแคชเชียร์เช็ค สปส.พื้นที่/จังหวัด/สาขา ; difference=2780.00 ; page=3 |
| budget_items.csv | 1013 | budget_equation | 2566-0091 31. ค่าธรรมเนียมซื้อสมุดเช็ค และอื่น ๆ ; difference=17841.37 ; page=3 |
| budget_items.csv | 1014 | budget_equation | 2566-0092 32. ค่าธรรมเนียมการให้บริการรับสมัครขึ้นทะเบียนผู้ประกันตนตามมาตรา 40 ; difference=25000.0 ; page=3 |
| budget_items.csv | 1015 | budget_equation | 2566-0093 33. ค่าธรรมเนียมบริการรับ - ส่งเงินของ KGS ; difference=29628.00 ; page=3 |
| budget_items.csv | 1018 | budget_equation | 2566-0096 36. ค่าธรรมเนียมทางกฎหมาย ; difference=100000.0 ; page=3 |
| budget_items.csv | 1019 | budget_equation | 2566-0097 37. ค่าป่วยการแก่พยานศาล ; difference=10000.0 ; page=3 |
| budget_items.csv | 1020 | budget_equation | 2566-0098 38. ค่าสมัครสมาชิกด้านการลงทุน ; difference=5140209.79 ; page=3 |
| budget_items.csv | 1021 | budget_equation | 2566-0099 39. ค่าบำรุงรักษาระบบคอมพิวเตอร์ ; difference=251100.00 ; page=3 |
| budget_items.csv | 1043 | budget_equation | 2566-0121 22. ค่าจ้างบำรุงรักษาอุปกรณ์สนับสนุนศูนย์คอมพิวเตอร์หลัก ; difference=900900.00 ; page=4 |
| budget_items.csv | 1044 | budget_equation | 2566-0122 23. ค่าจ้างบำรุงรักษาระบบสนับสนุนศูนย์คอมพิวเตอร์ (จังหวัดระยอง) พร้อมเชื่อมโยงเครือข่ายสัญญาณ เพื่อรับส่งข้อมูลระหว่างศูนย์คอมพิวเตอร์ ; difference=46800.0 ; page=4 |
| budget_items.csv | 1058 | budget_equation | 2566-0136 - ค่าวัสดุ ; difference=1237636.17 ; page=4 |
| budget_items.csv | 1059 | budget_equation | 2566-0137 1. วัสดุสำนักงาน ; difference=1343779.50 ; page=4 |
| budget_items.csv | 1060 | budget_equation | 2566-0138 2. วัสดุคอมพิวเตอร์ ; difference=-2665020.25 ; page=4 |
| budget_items.csv | 1061 | budget_equation | 2566-0139 3. วัสดุส่วนกลาง ; difference=-3680.0 ; page=4 |
| budget_items.csv | 1062 | budget_equation | 2566-0140 4. วัสดุแบบพิมพ์ ; difference=960436.50 ; page=4 |
| budget_items.csv | 1064 | budget_equation | 2566-0142 6. วัสดุโฆษณาและเผยแพร่ ; difference=-360710.35 ; page=4 |
| budget_items.csv | 1065 | budget_equation | 2566-0143 7. วัสดุงานบ้านงานครัว ; difference=39183.25 ; page=4 |
| budget_items.csv | 1066 | budget_equation | 2566-0144 8. วัสดุเกษตร ; difference=5000.00 ; page=4 |
| budget_items.csv | 1067 | budget_equation | 2566-0145 9. วัสดุช่างและไฟฟ้า ; difference=-9126.53 ; page=5 |
| budget_items.csv | 1069 | budget_equation | 2566-0147 11. วัสดุน้ำมันเชื้อเพลิงและหล่อลื่น ; difference=1927774.05 ; page=5 |
| budget_items.csv | 1070 | budget_equation | 2566-0148 - ค่าสาธารณูปโภค ; difference=-12304816.63 ; page=5 |
| budget_items.csv | 1071 | budget_equation | 2566-0149 1. ค่าไฟฟ้า ; difference=-9508302.32 ; page=5 |
| budget_items.csv | 1072 | budget_equation | 2566-0150 2. ค่าน้ำประปา ; difference=115836.95 ; page=5 |
| budget_items.csv | 1073 | budget_equation | 2566-0151 3. ค่าโทรศัพท์ ; difference=858067.63 ; page=5 |
| budget_items.csv | 1074 | budget_equation | 2566-0152 4. ค่าไปรษณีย์ภัณฑ์ ; difference=-3781434.72 ; page=5 |
| budget_items.csv | 1075 | budget_equation | 2566-0153 5. ค่าบริการสื่อสารและโทรคมนาคม ; difference=11015.83 ; page=5 |
| budget_items.csv | 1077 | budget_equation | 2566-0155 งบลงทุน ; difference=-5779950.60 ; page=5 |
| budget_items.csv | 1078 | budget_equation | 2566-0156 1. ครุภัณฑ์ ; difference=-1699626.60 ; page=5 |
| budget_items.csv | 1079 | budget_equation | 2566-0157 รายการที่ดิน/อาคาร/สิ่งก่อสร้าง ; difference=-4080324.00 ; page=5 |
| budget_items.csv | 1080 | budget_equation | 2566-0158 1. รายจ่ายเพื่อดัดแปลง ต่อเติมหรือปรับปรุงสิ่งก่อสร้าง ; difference=-1304000.00 ; page=5 |
| budget_items.csv | 1085 | budget_equation | 2566-0163 งบเงินอุดหนุน ; difference=231447.25 ; page=5 |
| budget_items.csv | 1087 | budget_equation | 2566-0165 2. ค่าสมาชิกสมาคมการประกันสังคมระหว่างประเทศ (ISSA) ; difference=231447.25 ; page=5 |
| budget_items.csv | 1088 | budget_equation | 2566-0166 งบรายจ่ายอื่น ; difference=-23423000.00 ; page=5 |
| budget_items.csv | 1089 | budget_equation | 2566-0167 1. ค่าใช้จ่ายในการประชุม สัมมนา หรือฝึกอบรม ของข้าราชการ เจ้าหน้าที่ และผู้ที่เกี่ยวข้อง ณ ต่างประเทศ ; difference=-400500.00 ; page=5 |
| budget_items.csv | 1104 | budget_equation | 2566-0182 แผนงานยุทธศาสตร์ ; difference=26388370.65 ; page=6 |
| budget_items.csv | 1132 | budget_equation | 2566-0210 รายจ่ายเพื่อบริหารงาน ; difference=26388370.65 ; page=7 |
| budget_items.csv | 1133 | budget_equation | 2566-0211 งบดำเนินงาน ; difference=26719331.65 ; page=7 |
| budget_items.csv | 1136 | budget_equation | 2566-0214 - ค่าใช้สอย ; difference=-10885567.51 ; page=7 |
| budget_items.csv | 1137 | budget_equation | 2566-0215 1. โครงการส่งเสริมการจ้างงานผู้สูงอายุเข้าทำงานกับสำนักงานประกันสังคม ; difference=65425.00 ; page=7 |
| budget_items.csv | 1139 | budget_equation | 2566-0217 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=6418243.22 ; page=7 |
| budget_items.csv | 1140 | budget_equation | 2566-0218 3.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง ; difference=3338057.0 ; page=7 |
| budget_items.csv | 1141 | budget_equation | 2566-0219 1. โครงการอบรมข้าราชการบรรจุใหม่ของ สปส. ; difference=137200.0 ; page=7 |
| budget_items.csv | 1142 | budget_equation | 2566-0220 2. โครงการสัมมนาผู้บริหารสำนักงานประกันสังคม ; difference=2260000.0 ; page=7 |
| budget_items.csv | 1154 | budget_equation | 2566-0232 14. โครงการเสริมสร้างสมรรถนะเจ้าหน้าที่ตรวจสอบบัญชีค่าจ้าง ; difference=130000.0 ; page=7 |
| budget_items.csv | 1157 | budget_equation | 2566-0235 17. โครงการขับเคลื่อนสำนักงานประกันสังคมสู่ความสำเร็จ "SSO TRUST" เพื่อการพัฒนาองค์กรอย่างยั่งยืน สำหรับบุคลากรสำนักงานประกันสังคม ; difference=603167.0 ; page=7 |
| budget_items.csv | 1159 | budget_equation | 2566-0237 3.2 โครงการเสริมสร้างสมรรถนะบุคลากรของสำนักงานประกันสังคม ; difference=3075406.22 ; page=7 |
| budget_items.csv | 1161 | budget_equation | 2566-0239 3.3 การจัดการความรู้สำนักงานประกันสังคม ; difference=4780.0 ; page=7 |
| budget_items.csv | 1162 | budget_equation | 2566-0240 4. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม ; difference=95975.14 ; page=7 |
| budget_items.csv | 1163 | budget_equation | 2566-0241 - ค่าจัดประชุมชี้แจงให้ความรู้งานประกันสังคม ; difference=95975.14 ; page=7 |
| budget_items.csv | 1164 | budget_equation | 2566-0242 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=3660800.0 ; page=7 |
| budget_items.csv | 1165 | budget_equation | 2566-0243 1. จ้างจัดนิทรรศการวัรแงงานแห่งชาติ ; difference=376880.0 ; page=7 |
| budget_items.csv | 1166 | budget_equation | 2566-0244 2. ผลิตและออกอากาศสื่อโทรทัศน์ ; difference=1704400.0 ; page=7 |
| budget_items.csv | 1168 | budget_equation | 2566-0246 4. ผลิตและประชาสัมพันธ์ทางสื่อสิ่งพิมพ์ ; difference=1390000.0 ; page=8 |
| budget_items.csv | 1169 | budget_equation | 2566-0247 5. ผลิตและเผยแพร่ทางสื่อออนไลน์ (เว็บไซต์) หรือสื่อสังคมออนไลน์ (โซเซียลมีเดีย) ; difference=79520.0 ; page=8 |
| budget_items.csv | 1176 | budget_equation | 2566-0254 12. จ้างพิมพ์วารสารประกันสังคม ; difference=5000.0 ; page=8 |
| budget_items.csv | 1177 | budget_equation | 2566-0255 6. การจัดส่งข้าราชการและพนักงานสำนักงานประกันสังคมเข้ารับ การอบรมด้านวิชาการที่หน่วยงานภายนอกเป็นผู้จัด ; difference=708741.0 ; page=8 |
| budget_items.csv | 1178 | budget_equation | 2566-0256 7. โครงการอบรมเชิงปฏิบัติการแก่นายจ้างเพื่อจัดทำข้อมูลและจ่ายเงินสมทบ กองทุนประกันสงคมผ่านระบบอิเล็กทรอนิกส์ (e-Payment) ; difference=63665.13 ; page=8 |
| budget_items.csv | 1180 | budget_equation | 2566-0258 9. โครงการตรวจสอบสถานประกอบการเพื่อป้องกันการแสวงประโยชน์ จากการใช้แรงงานและกองทุน ; difference=27450.0 ; page=8 |
| budget_items.csv | 1186 | budget_equation | 2566-0264 15. โครงการออกหน่วยเคลื่อนที่บริการเบ็ดเสร็จ Service Delivery Unit ; difference=28205.0 ; page=8 |
| budget_items.csv | 1187 | budget_equation | 2566-0265 16. โครงการพัฒนาศักยภาพแกนนำเครือข่ายประกันสังคม ; difference=7160.0 ; page=8 |
| budget_items.csv | 1214 | budget_equation | 2566-0292 - ค่าวัสดุ ; difference=1300.00 ; page=9 |
| budget_items.csv | 1215 | budget_equation | 2566-0293 - โครงการประกันสังคมเยี่ยมผู้ประกันตนเจ็บป่วยในสถานพยาบาลและผู้ทุพพลภาพ และผู้ป่วยหลังภาวะวิกฤต (Intermediate Care) ; difference=1300.00 ; page=9 |
| budget_items.csv | 1216 | budget_equation | 2566-0294 - ค่าสาธารณูปโภค ; difference=37603599.16 ; page=9 |
| budget_items.csv | 1217 | budget_equation | 2566-0295 - ค่าธรรมเนียมการโอนเงินผ่านธนาคาร/หน่วยบริการ ; difference=37603599.16 ; page=9 |
| budget_items.csv | 1218 | budget_equation | 2566-0296 1. ค่าธรรมเนียมการโอนเงินผ่านธนาคาร ; difference=199324.00 ; page=9 |
| budget_items.csv | 1219 | budget_equation | 2566-0297 2. ค่าธรรมเนียมรับเงินสมทบกองทุนประกันสังคมผ่านธนาคาร/หน่วยบริการ ; difference=19752360.16 ; page=9 |
| budget_items.csv | 1220 | budget_equation | 2566-0298 3. ค่าธรรมเนียมจ่ายประโยชน์ทดแทน ; difference=17651915.0 ; page=9 |
| budget_items.csv | 1221 | budget_equation | 2566-0299 งบลงทุน ; difference=-330961.0 ; page=9 |
| budget_items.csv | 1222 | budget_equation | 2566-0300 ค่าพัฒนา/ปรับปรุงระบบงาน ; difference=-330961.0 ; page=9 |
| budget_items.csv | 1223 | budget_equation | 2566-0301 1. โครงการจัดซื้อครุภัณฑ์คอมพิวเตอร์ ประจำปี 2566 ; difference=900056.0 ; page=9 |
| budget_items.csv | 1228 | budget_equation | 2566-0306 6. โครงการจัดหาระบบบริหารจัดการด้านความปลอดภัยฐานข้อมูลของสำนักงานประกันสังคม ; difference=68983.0 ; page=9 |
| budget_items.csv | 1242 | budget_equation | 2567-0002 แผนงานบุคลากรภาครัฐ ; difference=-35730.0 ; page=1 |
| budget_items.csv | 1251 | budget_equation | 2567-0011 งบดำเนินงาน ; difference=143040.00 ; page=1 |
| budget_items.csv | 1256 | budget_equation | 2567-0016 - ค่าใช้สอย ; difference=143040.0 ; page=1 |
| budget_items.csv | 1257 | budget_equation | 2567-0017 1. เงินสมทบกองทุนประกันสังคม ; difference=72000.0 ; page=1 |
| budget_items.csv | 1258 | budget_equation | 2567-0018 2. เงินสมทบกองทุนเงินทดแทน ; difference=71040.0 ; page=1 |
| budget_items.csv | 1260 | budget_equation | 2567-0020 งบรายจ่ายอื่น ; difference=-178770.0 ; page=1 |
| budget_items.csv | 1261 | budget_equation | 2567-0021 - เงินช่วยเหลือในกรณีที่พนักงานถึงแก่ความตาย ; difference=-178770.0 ; page=1 |
| budget_items.csv | 1262 | budget_equation | 2567-0022 แผนงานพื้นฐาน ; difference=-5489805.50 ; page=1 |
| budget_items.csv | 1263 | budget_equation | 2567-0023 รายจ่ายเพื่อบริหารงานประจำ ; difference=-5489805.50 ; page=1 |
| budget_items.csv | 1264 | budget_equation | 2567-0024 งบดำเนินงาน ; difference=393766.50 ; page=1 |
| budget_items.csv | 1265 | budget_equation | 2567-0025 - ค่าตอบแทน ; difference=779356.77 ; page=1 |
| budget_items.csv | 1266 | budget_equation | 2567-0026 1. ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ ; difference=-282410.0 ; page=1 |
| budget_items.csv | 1267 | budget_equation | 2567-0027 2. ค่าเบี้ยประชุมคณะกรรมการ/อนุกรรมการ/คณะทำงาน ; difference=633023.77 ; page=1 |
| budget_items.csv | 1268 | budget_equation | 2567-0028 3. ค่าใช้จ่ายในการเดินทางมาประชุมของคณะกรรมการ ที่ปรึกษา และคณะอนุกรรมการ ; difference=522743.0 ; page=1 |
| budget_items.csv | 1269 | budget_equation | 2567-0029 4. ค่าตอบแทนคณะกรรมการตรวจรับพัสดุในงานจ้างก่อสร้างและผู้ควบคุมงาน ก่อสร้างที่มีคำสั่งแต่งตั้งจากทางราชการ ; difference=-171000.0 ; page=1 |
| budget_items.csv | 1272 | budget_equation | 2567-0032 7. ค่าตอบแทนกรรมการออกข้อสอบและสอบสัมภาษณ์ ; difference=200000.00 ; page=2 |
| budget_items.csv | 1278 | budget_equation | 2567-0038 - ค่าใช้สอย ; difference=414548.30 ; page=2 |
| budget_items.csv | 1279 | budget_equation | 2567-0039 1. ค่าเบี้ยเลี้ยง ที่พัก พาหนะ และอื่น ๆ ; difference=221165.49 ; page=2 |
| budget_items.csv | 1280 | budget_equation | 2567-0040 2. ค่าผ่านทางด่วนพิเศษ ; difference=-10610.0 ; page=2 |
| budget_items.csv | 1281 | budget_equation | 2567-0041 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=424751.0 ; page=2 |
| budget_items.csv | 1282 | budget_equation | 2567-0042 - ค่ารับรองและพิธีการ ; difference=424751.0 ; page=2 |
| budget_items.csv | 1283 | budget_equation | 2567-0043 4. ค่าซ่อมแซมบำรุงรักษาทรัพย์สิน ; difference=-169131.18 ; page=2 |
| budget_items.csv | 1284 | budget_equation | 2567-0044 5. ค่าซ่อมแซมบำรุงรักษายานพาหนะ ; difference=-21825.76 ; page=2 |
| budget_items.csv | 1285 | budget_equation | 2567-0045 6. ค่าจ้างเหมาบริการต่าง ๆ ; difference=-195417.49 ; page=2 |
| budget_items.csv | 1286 | budget_equation | 2567-0046 7. ค่าจ้างเหมากำจัดปลวก มด แมลง และหนู ; difference=-3045.00 ; page=2 |
| budget_items.csv | 1287 | budget_equation | 2567-0047 8. ค่าจ้างบริการรักษาความปลอดภัยอาคารสำนักงานประกันสังคม ; difference=26615.97 ; page=2 |
| budget_items.csv | 1288 | budget_equation | 2567-0048 9. ค่าจ้างทำความสะอาดอาคารสำนักงานประกันสังคม ; difference=136029.03 ; page=2 |
| budget_items.csv | 1289 | budget_equation | 2567-0049 10. ค่าจ้างเหมาบริการดูแลรักษาสวนหย่อม สนามหญ้า และต้นไม้ ; difference=40660.00 ; page=2 |
| budget_items.csv | 1290 | budget_equation | 2567-0050 11. ค่าจ้างเหมาพนักงานขับรถยนต์ ; difference=149890.00 ; page=2 |
| budget_items.csv | 1291 | budget_equation | 2567-0051 12. ค่าขนย้ายและติดตั้งครุภัณฑ์และทรัพย์สินต่าง ๆ ; difference=-391171.96 ; page=2 |
| budget_items.csv | 1294 | budget_equation | 2567-0054 15. ค่าซอมแซมปรับปรุงอาคารหรือสิ่งก่อสร้าง ; difference=-188961.80 ; page=2 |
| budget_items.csv | 1296 | budget_equation | 2567-0056 17. ค่าเช่าเครื่องถ่ายเอกสาร ; difference=-407750.00 ; page=2 |
| budget_items.csv | 1299 | budget_equation | 2567-0059 20. ค่าตกแต่งสถานที่และค่าใช้จ่ายในการจัดงานต่าง ๆ ; difference=-485000.00 ; page=2 |
| budget_items.csv | 1301 | budget_equation | 2567-0061 22. ค่าใช้จ่ายในการจัดทำข้อสอบ ; difference=2000000.0 ; page=2 |
| budget_items.csv | 1302 | budget_equation | 2567-0062 23. ค่าใช้จ่ายในการจ้างบันทึกข้อมูลเงินสมทบ ; difference=16500.00 ; page=2 |
| budget_items.csv | 1304 | budget_equation | 2567-0064 25. ค่าธรรมเนียมกรณีขอรับเงินธนาณัติเป็นแคชเชียร์เช็ค สปส.กทม.พื้นที่/จังหวัด/สาขา ; difference=-20600.41 ; page=2 |
| budget_items.csv | 1305 | budget_equation | 2567-0065 26. ค่าธรรมเนียมซื้อสมุดเช็ค และอื่น ๆ ; difference=-37620.37 ; page=2 |
| budget_items.csv | 1306 | budget_equation | 2567-0066 27. ค่าธรรมเนียมบริการรับ - ส่งเงินของ KTBGS ; difference=38320.78 ; page=2 |
| budget_items.csv | 1309 | budget_equation | 2567-0069 30. ค่าธรรมเนียมทางกฎหมาย ; difference=58850.0 ; page=2 |
| budget_items.csv | 1312 | budget_equation | 2567-0072 - ค่าวัสดุ ; difference=9570.43 ; page=2 |
| budget_items.csv | 1313 | budget_equation | 2567-0073 1. วัสดุสำนักงาน ; difference=1409383.29 ; page=3 |
| budget_items.csv | 1314 | budget_equation | 2567-0074 2. วัสดุคอมพิวเตอร์ ; difference=-2698227.48 ; page=3 |
| budget_items.csv | 1316 | budget_equation | 2567-0076 4. วัสดุแบบพิมพ์ ; difference=30336.0 ; page=3 |
| budget_items.csv | 1319 | budget_equation | 2567-0079 7. วัสดุงานบ้านงานครัว ; difference=-46679.14 ; page=3 |
| budget_items.csv | 1321 | budget_equation | 2567-0081 9. วัสดุช่างและไฟฟ้า ; difference=-144733.39 ; page=3 |
| budget_items.csv | 1323 | budget_equation | 2567-0083 11. วัสดุน้ำมันเชื้อเพลิงและหล่อลื่น ; difference=1459491.15 ; page=3 |
| budget_items.csv | 1324 | budget_equation | 2567-0084 - ค่าสาธารณูปโภค ; difference=-809709.00 ; page=3 |
| budget_items.csv | 1325 | budget_equation | 2567-0085 1. ค่าไฟฟ้า ; difference=32845.66 ; page=3 |
| budget_items.csv | 1326 | budget_equation | 2567-0086 2. ค่าน้ำประปา ; difference=10000.00 ; page=3 |
| budget_items.csv | 1327 | budget_equation | 2567-0087 3. ค่าโทรศัพท์ ; difference=42350.34 ; page=3 |
| budget_items.csv | 1328 | budget_equation | 2567-0088 4. ค่าไปรษณีย์ภัณฑ์ ; difference=-894905.00 ; page=3 |
| budget_items.csv | 1332 | budget_equation | 2567-0092 งบลงทุน ; difference=-5509780.00 ; page=3 |
| budget_items.csv | 1333 | budget_equation | 2567-0093 1. ครุภัณฑ์ ; difference=-5509780.00 ; page=3 |
| budget_items.csv | 1337 | budget_equation | 2567-0097 งบรายจ่ายอื่น ; difference=-373792.00 ; page=3 |
| budget_items.csv | 1340 | budget_equation | 2567-0100 3. ค่าใช้จ่ายในการเดินทางไปราชการต่างประเทศเพื่อแลกเปลี่ยนเรียนรู้ประสบการณ์ ด้านการประกันสังคมของข้าราชการ เจ้าหน้าที่และผู้ที่เกี่ยวข้อง ณ ต่างประเทศ ; difference=-373792.00 ; page=3 |
| budget_items.csv | 1344 | budget_equation | 2567-0104 แผนงานยุทธศาสตร์ ; difference=5525535.50 ; page=3 |
| budget_items.csv | 1345 | budget_equation | 2567-0105 โครงการต่อเนื่อง ; difference=373792.00 ; page=3 |
| budget_items.csv | 1371 | budget_equation | 2567-0131 งบรายจ่ายอื่น ; difference=373792.0 ; page=4 |
| budget_items.csv | 1375 | budget_equation | 2567-0135 4. โครงการจ้างที่ปรึกษาวิเคราะห์การปรับเปลี่ยนระบบโปรแกรมบริหารการลงทุน ; difference=373792.0 ; page=4 |
| budget_items.csv | 1382 | budget_equation | 2567-0142 รายจ่ายเพื่อบริหารงาน ; difference=5151743.50 ; page=5 |
| budget_items.csv | 1383 | budget_equation | 2567-0143 งบดำเนินงาน ; difference=5847329.50 ; page=5 |
| budget_items.csv | 1384 | budget_equation | 2567-0144 - ค่าตอบแทน ; difference=4950.0 ; page=5 |
| budget_items.csv | 1385 | budget_equation | 2567-0145 - ค่าตอบแทนส่งเสริมสนับสนุนการปฏิบัติงานให้แก่เครือข่ายประกันสังคมตามมาตรา 40 ; difference=4950.0 ; page=5 |
| budget_items.csv | 1386 | budget_equation | 2567-0146 - ค่าใช้สอย ; difference=-24625250.50 ; page=5 |
| budget_items.csv | 1389 | budget_equation | 2567-0149 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง ; difference=2445287.00 ; page=5 |
| budget_items.csv | 1406 | budget_equation | 2567-0166 3.2 โครงการเสริมสร้างสมรรถนะบุคลากรของสำนักงานประกันสังคม ; difference=2460580.0 ; page=5 |
| budget_items.csv | 1408 | budget_equation | 2567-0168 3.3 การจัดการความรู้สำนักงานประกันสังคม ; difference=-15293.00 ; page=5 |
| budget_items.csv | 1409 | budget_equation | 2567-0169 4. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม ; difference=130904.00 ; page=5 |
| budget_items.csv | 1410 | budget_equation | 2567-0170 - ค่าจัดประชุมชี้แจงให้ความรู้งานประกันสังคม ; difference=130904.00 ; page=5 |
| budget_items.csv | 1411 | budget_equation | 2567-0171 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม ; difference=2956690.50 ; page=5 |
| budget_items.csv | 1413 | budget_equation | 2567-0173 2. ผลิตและออกอากาศสื่อโทรทัศน์ ; difference=1569650.0 ; page=5 |
| budget_items.csv | 1415 | budget_equation | 2567-0175 4. ผลิตและประชาสัมพันธ์ทางสื่อสิ่งพิมพ์ ; difference=1200000.0 ; page=5 |
| budget_items.csv | 1416 | budget_equation | 2567-0176 5. ผลิตและเผยแพร่ทางสื่อออนไลน์ (เว็บไซต์) หรือสื่อสังคมออนไลน์ (โซเซียลมีเดีย) ; difference=177250.0 ; page=5 |
| budget_items.csv | 1417 | budget_equation | 2567-0177 6. ผลิตสื่อประชาสัมพันธ์เพื่อเผยแพร่ประชาสัมพันธ์ ส่งแรงงานกลับบ้าน ; difference=-40380.0 ; page=5 |
| budget_items.csv | 1424 | budget_equation | 2567-0184 13. ค่าใช้จ่ายต่าง ๆ เพื่อประชาสัมพันธ์เผยแพร่ข่าวสารงานประกันสังคม ; difference=9790.50 ; page=6 |
| budget_items.csv | 1425 | budget_equation | 2567-0185 6. ค่าจ้างบริการบำรุงรักษาระบบคอมพิวเตอร์ ; difference=616200.00 ; page=6 |
| budget_items.csv | 1435 | budget_equation | 2567-0195 10. ค่าจ้างบำรุงรักษาและปรับปรุงระบบสารสนเทศงานประกันสังคมตามมาตรา 40 ; difference=44200.00 ; page=6 |
| budget_items.csv | 1437 | budget_equation | 2567-0197 12. ค่าจ้างบำรงุรักษาและปรับปรุงระบบบริการอิเล็กทรอนิกส์ ; difference=374000.00 ; page=6 |
| budget_items.csv | 1457 | budget_equation | 2567-0217 32. ค่าจ้างบำรุงรักษาและปรับปรุงระบบการเบิกจ่ายประโยชน์ทดแทน ด้วยตนเองของผู้ประกันตนผ่านระบบอิเล็กทรอนิกส์ (e-Self Service) กองทุนประกันสังคม ; difference=198000.00 ; page=6 |
| budget_items.csv | 1469 | budget_equation | 2567-0229 9. โครงการอบรมเชิงปฏิบัติการแก่นายจ้างเพื่อจัดทำข้อมูลและจ่ายเงินสมทบ กองทุนประกันสงคมผ่านระบบอิเล็กทรอนิกส์ (e-Payment) ; difference=15014.60 ; page=7 |
| budget_items.csv | 1477 | budget_equation | 2567-0237 17. โครงการออกหน่วยเคลื่อนที่บริการเบ็ดเสร็จ Service Delivery Unit ; difference=-4225.6 ; page=7 |
| budget_items.csv | 1478 | budget_equation | 2567-0238 18. โครงการพัฒนาศักยภาพแกนนำเครือข่ายประกันสังคม ; difference=-8950.0 ; page=7 |
| budget_items.csv | 1487 | budget_equation | 2567-0247 27. โครงการประกาศเกียรติคุณผู้ทำคุณประโยชน์ต่อสำนักงานประกันสังคม ; difference=-16500.0 ; page=7 |
| budget_items.csv | 1504 | budget_equation | 2567-0264 - ค่าสาธารณูปโภค ; difference=30467630.00 ; page=8 |
| budget_items.csv | 1505 | budget_equation | 2567-0265 - ค่าธรรมเนียมการโอนเงินผ่านธนาคาร/หน่วยบริการ ; difference=30467630.00 ; page=8 |
| budget_items.csv | 1506 | budget_equation | 2567-0266 1. ค่าธรรมเนียมการโอนเงินผ่านธนาคาร ; difference=2218.00 ; page=8 |
| budget_items.csv | 1507 | budget_equation | 2567-0267 2. ค่าธรรมเนียมรับเงินสมทบกองทุนประกันสังคมผ่านธนาคาร/หน่วยบริการ ; difference=26133432.00 ; page=8 |
| budget_items.csv | 1508 | budget_equation | 2567-0268 3. ค่าธรรมเนียมจ่ายประโยชน์ทดแทน ; difference=4331980.00 ; page=8 |
| budget_items.csv | 1509 | budget_equation | 2567-0269 งบลงทุน ; difference=-670000.00 ; page=8 |
| budget_items.csv | 1511 | budget_equation | 2567-0271 รายการที่ดิน/อาคาร/สิ่งก่อสร้าง ; difference=-670000.00 ; page=8 |
| budget_items.csv | 1512 | budget_equation | 2567-0272 1. รายจ่ายเพื่อดัดแปลง ต่อเติมหรือปรับปรุงสิ่งก่อสร้าง ; difference=-670000.00 ; page=8 |
| budget_items.csv | 1524 | budget_equation | 2567-0284 งบรายจ่ายอื่น ; difference=-25586.0 ; page=8 |
| budget_items.csv | 59 | summary_flag_risk | 2563-0058 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 76 | summary_flag_risk | 2563-0075 20. ค่าบำรุงรักษาระบบคอมพิวเตอร์ |
| budget_items.csv | 110 | summary_flag_risk | 2563-0109 21. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 180 | summary_flag_risk | 2563-0179 - ค่าใช้สอย |
| budget_items.csv | 196 | summary_flag_risk | 2563-0195 5. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 197 | summary_flag_risk | 2563-0196 5.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง |
| budget_items.csv | 229 | summary_flag_risk | 2563-0228 6. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม |
| budget_items.csv | 231 | summary_flag_risk | 2563-0230 7. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 376 | summary_flag_risk | 2564-0064 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 392 | summary_flag_risk | 2564-0080 20. ค่าบำรุงรักษาระบบคอมพิวเตอร์ |
| budget_items.csv | 427 | summary_flag_risk | 2564-0115 20. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 490 | summary_flag_risk | 2564-0178 - ค่าใช้สอย |
| budget_items.csv | 509 | summary_flag_risk | 2564-0197 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 510 | summary_flag_risk | 2564-0198 4.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง |
| budget_items.csv | 544 | summary_flag_risk | 2564-0232 5. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม |
| budget_items.csv | 546 | summary_flag_risk | 2564-0234 6. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 683 | summary_flag_risk | 2565-0063 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 685 | summary_flag_risk | 2565-0065 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 717 | summary_flag_risk | 2565-0097 36. ค่าบำรุงรักษาระบบคอมพิวเตอร์ |
| budget_items.csv | 796 | summary_flag_risk | 2565-0176 - ค่าใช้สอย |
| budget_items.csv | 823 | summary_flag_risk | 2565-0203 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 824 | summary_flag_risk | 2565-0204 4.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง |
| budget_items.csv | 849 | summary_flag_risk | 2565-0229 5. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม |
| budget_items.csv | 851 | summary_flag_risk | 2565-0231 6. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 984 | summary_flag_risk | 2566-0062 4. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 986 | summary_flag_risk | 2566-0064 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 1021 | summary_flag_risk | 2566-0099 39. ค่าบำรุงรักษาระบบคอมพิวเตอร์ |
| budget_items.csv | 1107 | summary_flag_risk | 2566-0185 - ค่าใช้สอย |
| budget_items.csv | 1139 | summary_flag_risk | 2566-0217 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 1140 | summary_flag_risk | 2566-0218 3.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง |
| budget_items.csv | 1162 | summary_flag_risk | 2566-0240 4. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม |
| budget_items.csv | 1164 | summary_flag_risk | 2566-0242 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 1281 | summary_flag_risk | 2567-0041 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 1389 | summary_flag_risk | 2567-0149 3. ค่าใช้จ่ายในการจัดประชุม อบรม สัมมนาและค่าอาหารว่าง |
| budget_items.csv | 1390 | summary_flag_risk | 2567-0150 3.1 ค่าใช้จ่ายในการจัดฝึกอบรม สัมมนา และค่าอาหารว่าง |
| budget_items.csv | 1409 | summary_flag_risk | 2567-0169 4. ค่าใช้จ่ายในการจัดประชุม อบรมให้ความรู้งานประกันสังคม |
| budget_items.csv | 1411 | summary_flag_risk | 2567-0171 5. ค่าใช้จ่ายต่าง ๆ เพื่อเผยแพร่ความรู้เกี่ยวกับการประกันสังคม |
| budget_items.csv | 1425 | summary_flag_risk | 2567-0185 6. ค่าจ้างบริการบำรุงรักษาระบบคอมพิวเตอร์ |
