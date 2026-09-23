/* เข้าใจงบ ประกันสังคม
   ตัวเลขทั้งหมดอ่านจาก window.SSO ที่ build_data.py สร้างจาก dataset/*.csv
   ไม่มีตัวเลขจากชุดข้อมูลตัวไหนถูกพิมพ์ลงในไฟล์นี้ */
(function () {
"use strict";

var D = window.SSO;
if (!D) { console.error("ไม่พบ data.js"); return; }

/* ---------- บริบทภายนอก: ไม่ได้มาจากชุดข้อมูลนี้ ต้องมีลิงก์กำกับเสมอ ---------- */
var EXT = {
  fund:      2657245e6,
  fundAsOf:  "31 ธันวาคม 2567",
  fundLabel: "เงินลงทุนกองทุนประกันสังคม",
  fundUrl:   "https://www.prachachat.net/finance/news-1760529",
  capPct:    10,
  /* ตัวบท พ.ร.บ.ประกันสังคม 2533 จากเว็บสำนักงานประกันสังคมเอง
     มาตรา 24 คือที่มาของเพดาน 10% ที่อ้างถึงในหน้านี้
     ลิงก์เดิมชี้ไป law.thaihealth.or.th ซึ่งย้ายไฟล์แล้วและตอบ 404 */
  lawUrl:    "https://www.sso.go.th/wpr/assets/upload/files_storage/sso_th/7d900b368467d904cf25f13b46f20e21.pdf",
  /* หน้ารวมกฎหมายของ สปส. เผื่อไฟล์ PDF ข้างบนถูกอัปโหลดใหม่จนชื่อไฟล์เปลี่ยน */
  lawIndexUrl: "https://www.sso.go.th/wpr/main/law/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9A%E0%B8%B1%E0%B8%8D%E0%B8%8D%E0%B8%B1%E0%B8%95%E0%B8%B4_category_list-label_1_106_0"
};

/* ================================================================ utils */
var NF = new Intl.NumberFormat("th-TH");
var LAST = D.years[D.years.length - 1];

function n0(v) { return NF.format(Math.round(v)); }
function n2(v) { return NF.format(Math.round(v * 100) / 100); }

/** ยอดเงินแบบย่อ หน่วยล้านบาท — ค่าว่างคืนขีด ไม่ใช่ศูนย์ */
function mb(v) {
  if (v === null || v === undefined) return "—";
  var m = v / 1e6, a = Math.abs(m);
  var s = a >= 1000 ? NF.format(Math.round(m))
        : a >= 10   ? NF.format(Math.round(m * 10) / 10)
                    : NF.format(Math.round(m * 100) / 100);
  return s + " ล้านบาท";
}
function mbShort(v) {
  if (v === null || v === undefined) return "—";
  var m = v / 1e6, a = Math.abs(m);
  return a >= 1000 ? NF.format(Math.round(m))
       : a >= 10   ? NF.format(Math.round(m * 10) / 10)
                   : NF.format(Math.round(m * 100) / 100);
}
function fullBaht(v) {
  return v === null || v === undefined ? "—" : n2(v) + " บาท";
}
function pct(v, d) { return v === null || v === undefined ? "—" : (Math.round(v * Math.pow(10, d || 1)) / Math.pow(10, d || 1)) + "%"; }

function el(tag, attrs, kids) {
  var e = document.createElement(tag);
  if (attrs) for (var k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k === "text") e.textContent = attrs[k];
    else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
  }
  (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
  return e;
}
function svgEl(tag, attrs) {
  var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
  return e;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }

/* ---------- สีอ่านจาก CSS custom properties เพื่อให้สลับธีมแล้วกราฟตามไปด้วย ---------- */
function cssv(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function hex2rgb(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(a, b, t) {
  var A = hex2rgb(a), B = hex2rgb(b);
  return "rgb(" + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); }).join(",") + ")";
}
/** ความสว่างตามนิยาม WCAG คือผ่าน gamma ก่อนถ่วงน้ำหนัก
    ค่านี้เอาไปคิด contrast ratio ได้ตรง ๆ ต่างจากค่าเฉลี่ยดิบที่ใช้เดาไม่ได้ */
function wcagLum(hexOrRgb) {
  var c = hexOrRgb.charAt(0) === "#" ? hex2rgb(hexOrRgb)
        : hexOrRgb.replace(/[^\d,]/g, "").split(",").map(Number);
  var f = c.map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
function contrast(a, b) {
  var l1 = wcagLum(a), l2 = wcagLum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
/* หมึกเข้มคงที่ ไม่ผูกกับ --ink เพราะในโหมดมืด --ink เป็นสีอ่อน
   ถ้าใช้ตามธีมแล้วเจอกล่องสีอ่อน จะได้ตัวอักษรอ่อนบนพื้นอ่อน */
var TILE_INK = "#111a22";
/** เลือกสีตัวอักษรบนพื้นสีโดยเทียบ contrast ratio จริงทั้งสองตัวเลือก
    วิธีเดิมตัดที่ค่าความสว่าง 0.58 ซึ่งไม่ตรงกับ WCAG ทำให้ได้ตัวขาวบนพื้นเขียวที่ 2.82:1 */
function inkOn(fill) {
  return contrast(fill, "#ffffff") >= contrast(fill, TILE_INK) ? "#ffffff" : TILE_INK;
}
function series(i) { return cssv("--s" + (i % 6 + 1)); }

/* ---------- tooltip ---------- */
var tipEl = document.getElementById("tip");
function showTip(html, ev) {
  tipEl.innerHTML = html;
  tipEl.classList.add("on");
  moveTip(ev);
}
function moveTip(ev) {
  var pad = 14, r = tipEl.getBoundingClientRect();
  var x = ev.clientX + pad, y = ev.clientY + pad;
  if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
  tipEl.style.left = Math.max(8, x) + "px";
  tipEl.style.top = Math.max(8, y) + "px";
}
function hideTip() { tipEl.classList.remove("on"); }
/* เลื่อนเมื่อไหร่ ให้ tooltip หายทันที ไม่ค้างทับเนื้อหา
   ใช้ capture เพื่อจับการเลื่อนในกล่องที่เลื่อนได้เอง (เช่นรายการใน modal) ด้วย
   เพราะ scroll ของ element ไม่ bubble ขึ้นมาถึง window */
window.addEventListener("scroll", hideTip, { passive: true, capture: true });
window.addEventListener("blur", hideTip);
/* tooltip แบบ hover ใช้กับเมาส์และปากกาเท่านั้น
   บนจอสัมผัส pointerenter ยิงทันทีที่นิ้วแตะ แม้ตั้งใจจะแค่ลากเลื่อน
   tooltip จึงเด้งขึ้นตลอดเวลาที่เลื่อนผ่านรายการ ส่วนการแตะยังทำงานตาม click ของแต่ละรายการเหมือนเดิม */
var hoverMQ = window.matchMedia ? window.matchMedia("(hover: hover)") : null;
/* เช็กทั้งชนิด pointer และความสามารถของอุปกรณ์ เพราะ in-app browser บางตัวรายงาน pointerType ผิด */
function canHoverTip(e) { return e.pointerType !== "touch" && (!hoverMQ || hoverMQ.matches); }
function bindTip(node, htmlFn) {
  node.addEventListener("pointerenter", function (e) { if (canHoverTip(e)) showTip(htmlFn(), e); });
  node.addEventListener("pointermove", function (e) { if (canHoverTip(e)) moveTip(e); });
  node.addEventListener("pointerleave", hideTip);
  /* กดแล้วมักมีแผงกางออกมาใต้แถว ปิด tooltip ไม่ให้บังสิ่งที่เพิ่งเปิด */
  node.addEventListener("click", hideTip);
}

/** วัดความกว้างข้อความโดยประมาณ ใช้ตัดสินใจว่าจะใส่ label ในกล่องได้ไหม */
function textW(s, size) {
  var w = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    w += (c >= 0x0e30 && c <= 0x0e4f) ? 0.06 : (c < 128 ? 0.52 : 0.58);
  }
  return w * size;
}

/* ---------- ป้ายอ้างอิง ---------- */
function srcChip(page, doc) {
  var t = page ? ("หน้า " + page) : "เอกสารต้นฉบับ";
  return '<span class="src" title="' + esc(doc || "") + '">' + esc(t) + "</span>";
}
function extChip(text, url) {
  return '<span class="src src--ext">' + (url ? '<a href="' + url + '" target="_blank" rel="noopener">' + esc(text) + "</a>" : esc(text)) + "</span>";
}

/* รายการที่ต้อง re-render เมื่อสลับธีมหรือเปลี่ยนขนาดจอ */
var redraws = [];
function onRedraw(fn) { redraws.push(fn); fn(); }
function redrawAll() { redraws.forEach(function (f) { f(); }); }

/** จอแคบ: กราฟ SVG ต้องใช้ viewBox แคบลง ตัวอักษรจะได้ไม่ถูกย่อจนอ่านไม่ออก */
function narrow() { return window.innerWidth < 640; }

/** ความกว้างจริงของกล่องเป็นพิกเซล ใช้เป็นหน่วยของ viewBox เพื่อให้ 1 หน่วย = 1 พิกเซล
    ถ้าตั้ง viewBox ตายตัวแล้วกล่องแคบกว่านั้น เบราว์เซอร์จะย่อทั้งภาพ
    ตัวอักษรที่ประกาศไว้ 14 จะเหลือ 8–9 พิกเซล ซึ่งอ่านไม่ออก */
function boxW(node, fallback) {
  var w = node.getBoundingClientRect().width;
  return w > 40 ? Math.round(w) : fallback;
}

var lastNarrow = narrow(), lastW = window.innerWidth, rzTimer = null;
window.addEventListener("resize", function () {
  clearTimeout(rzTimer);
  rzTimer = setTimeout(function () {
    var nw = narrow(), w = window.innerWidth;
    /* viewBox ผูกกับความกว้างกล่องแล้ว จึงต้องวาดใหม่เมื่อความกว้างเปลี่ยน
       ไม่ใช่เฉพาะตอนข้ามเส้น 640 เหมือนเดิม */
    if (nw !== lastNarrow || Math.abs(w - lastW) >= 24) {
      lastNarrow = nw; lastW = w; redrawAll();
    }
  }, 180);
}, { passive: true });

/* ================================================================ HERO */
function heroScale() {
  var box = document.getElementById("scaleFig");
  var admin = LAST.alloc;
  var share = admin / EXT.fund;

  // HTML keeps labels readable at every viewport and follows the current theme.
  var pctTxt = Math.round(share * 10000) / 100;
  box.appendChild(el("div", { class: "scale-summary" }, [
    el("div", { class: "scale-kicker", text: "มองภาพรวมก่อนอ่านงบ" }),
    el("div", { class: "scale-percent", html: pctTxt + '<span>%</span>' }),
    el("p", { class: "scale-caption", text: "งบบริหารงานปี " + LAST.year + " เมื่อเทียบกับเงินลงทุนกองทุน" }),
    el("span", { class: "scale-ratio", text: "ประมาณ 1 ใน " + n0(1 / share) + " ส่วน" })
  ]));
  var track = el("div", { class: "scale-track", "aria-hidden": "true" });
  var mark = el("span", { class: "scale-mark" });
  mark.style.width = (share * 100) + "%";
  track.appendChild(mark);
  box.appendChild(el("div", { class: "scale-comparison" }, [
    el("div", { class: "scale-fund" }, [
      el("span", { class: "scale-label", text: EXT.fundLabel }),
      el("div", { class: "scale-amount", html: n0(EXT.fund / 1e6) + '<span>ล้านบาท</span>' }),
      el("span", { class: "scale-date", text: "ณ " + EXT.fundAsOf })
    ]),
    track,
    el("div", { class: "scale-track-note", text: "แถบสีทองแสดงสัดส่วนงบบริหารงานประมาณ " + pctTxt + "%" }),
    el("div", { class: "scale-admin" }, [
      el("div", {}, [
        el("span", { class: "scale-label", text: "งบบริหารงานสำนักงาน" }),
        el("span", { class: "scale-date", text: "ปีงบประมาณ " + LAST.year })
      ]),
      el("div", { class: "scale-amount", html: mbShort(admin) + '<span>ล้านบาท</span>' })
    ])
  ]));

  /* ---- การ์ดสามก้อน ---- */
  var tiers = [
    {
      label: "กองทุนประกันสังคม", ext: true,
      value: n0(EXT.fund / 1e6), unit: "ล้านบาท",
      body: "เงินที่สะสมจากเงินสมทบของผู้ประกันตน นายจ้าง และรัฐ แล้วนำไปลงทุนเพื่อเตรียมจ่ายสิทธิประโยชน์ในอนาคต เป็นเงินส่วนใหญ่ที่สุดของระบบ และมีข้อกำหนดในการนำไปใช้ " + extChip("ที่มา: เงินลงทุน ณ " + EXT.fundAsOf, EXT.fundUrl)
    },
    {
      label: "เงินสิทธิประโยชน์", ext: true,
      value: "จ่ายออก", unit: "ตามสิทธิที่เกิดขึ้นจริง",
      body: "เงินที่จ่ายให้ผู้ประกันตนเมื่อใช้สิทธิ — ค่ารักษาพยาบาล เงินทดแทนการขาดรายได้ เงินสงเคราะห์บุตร บำนาญชราภาพ ว่างงาน ก้อนนี้ไม่ได้อยู่ในเอกสารชุดนี้ จึงไม่แสดงตัวเลข"
    },
    {
      label: "งบบริหารงานสำนักงาน", focus: true,
      value: mbShort(LAST.alloc), unit: "ล้านบาท · ปีงบประมาณ " + LAST.year,
      body: "ค่าใช้จ่ายเพื่อให้สำนักงานทำงานและให้บริการได้ — เงินเดือนพนักงาน ค่าไฟ ค่าไปรษณีย์ ระบบคอมพิวเตอร์ ค่าธรรมเนียมธนาคาร กฎหมายกำหนดเพดานไว้ไม่เกิน " + EXT.capPct + "% ของเงินสมทบที่เก็บได้ในแต่ละปี " + extChip("พ.ร.บ.ประกันสังคม 2533 ม.24", EXT.lawUrl) + " <strong>หน้านี้อธิบายงบส่วนนี้</strong> " + srcChip(LAST.year === LAST.year ? 1 : 1, LAST.srcFile)
    }
  ];

  var host = document.getElementById("tiers");
  tiers.forEach(function (t, i) {
    var body = el("div", { class: "tier-body", html: t.body });
    var card = el("details", { class: "tier" + (t.focus ? " is-focus" : "") });
    var summary = el("summary", { class: "tier-summary" }, [
      el("span", { class: "tier-topline" }, [
        el("span", { class: "tier-number", text: "0" + (i + 1) }),
        el("span", { class: "tier-tag", text: t.focus ? "งบที่เราจะพาดู" : (i === 0 ? "เงินสะสมและลงทุน" : "เงินที่จ่ายตามสิทธิ") })
      ]),
      el("span", { class: "tier-label" }, [
        el("span", { text: t.label })
      ]),
      el("span", { class: "tier-val", text: t.value }),
      el("span", { class: "tier-unit", text: t.unit }),
      el("span", { class: "tier-action" }, [
        el("span", { class: "tier-action-label", text: "อ่านรายละเอียด" }),
        el("span", { class: "tier-chev", text: "+", "aria-hidden": "true" })
      ])
    ]);
    card.appendChild(summary);
    card.appendChild(body);
    card.addEventListener("toggle", function () {
      summary.querySelector(".tier-action-label").textContent = card.open ? "ปิดรายละเอียด" : "อ่านรายละเอียด";
      summary.querySelector(".tier-chev").textContent = card.open ? "−" : "+";
    });
    host.appendChild(card);
  });
}

/* ================================================================ §1 คำศัพท์ */
function vocab() {
  var y = LAST;
  var terms = [
    { key: "alloc", name: "จัดสรร", color: "--ink-3",
      plain: "วงเงินที่ได้รับอนุมัติไว้สำหรับใช้จ่ายตามแผน เปรียบเหมือนงบที่มีให้ใช้ แต่ยังไม่ได้หมายความว่าจ่ายไปแล้ว",
      val: y.alloc },
    { key: "disb", name: "รวมเบิกจ่ายและผูกพัน", color: "--s1",
      plain: "เงินที่จ่ายออกไปแล้ว รวมกับเงินที่ทำสัญญาไว้และต้องจ่ายในภายหลัง รายงานนี้รวมเงินทั้งสองส่วนไว้ในช่องเดียวกัน",
      val: y.disb },
    { key: "remain", name: "คงเหลือ", color: "--s4",
      plain: "เงินที่ยังไม่ได้ใช้และยังไม่มีสัญญาผูกพันให้ต้องจ่าย ตัวเลขนี้ใช้ตามเอกสารต้นฉบับ โดยไม่ได้คำนวณใหม่",
      val: y.remain },
    { key: "rate", name: "อัตราเบิกจ่าย", color: "--s3",
      plain: "นำยอดเบิกจ่ายและผูกพันมาเทียบกับวงเงินจัดสรร แล้วแสดงเป็นเปอร์เซ็นต์ เพื่อดูว่าใช้หรือทำสัญญาไว้แล้วมากน้อยแค่ไหน",
      val: null, isRate: true }
  ];
  var active = 0;

  var barBox = document.getElementById("vocabBar");
  var tabBox = document.getElementById("vocabTabs");
  var defBox = document.getElementById("vocabDef");

  function drawBar() {
    clear(barBox);
    var nw = narrow();
    var W = nw ? 460 : boxW(barBox, 900), H = 134, L = 4, R = 4, bw = W - L - R, top = 40, bh = 48;
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "โครงสร้างงบปี " + y.year });
    var track = cssv("--track"), blue = cssv("--s1"), gold = cssv("--s4"), ink3 = cssv("--ink-3"), ink2 = cssv("--ink-2");
    var surf = cssv("--surface");

    var fillW = bw * (y.disb / y.alloc);
    var dim = function (on) { return on ? 1 : .26; };

    /* ราง = จัดสรร */
    s.appendChild(svgEl("rect", { x: L, y: top, width: bw, height: bh, rx: 5, fill: track, opacity: dim(active === 0) }));
    /* ช่วง 2px สีพื้นคั่นระหว่างสองก้อน ไม่ใช้เส้นขอบ */
    s.appendChild(svgEl("rect", { x: L, y: top, width: fillW - 1, height: bh, rx: 5, fill: blue, opacity: dim(active === 1 || active === 3) }));
    s.appendChild(svgEl("rect", { x: L + fillW + 1, y: top, width: bw - fillW - 1, height: bh, rx: 5, fill: gold, opacity: dim(active === 2) }));

    /* ป้ายบอกช่วง */
    function bracket(x1, x2, label, val, anchorMid) {
      var yb = top + bh + 12;
      s.appendChild(svgEl("line", { x1: x1, y1: yb, x2: x2, y2: yb, stroke: ink3, "stroke-width": 1 }));
      s.appendChild(svgEl("line", { x1: x1, y1: yb - 4, x2: x1, y2: yb + 4, stroke: ink3, "stroke-width": 1 }));
      s.appendChild(svgEl("line", { x1: x2, y1: yb - 4, x2: x2, y2: yb + 4, stroke: ink3, "stroke-width": 1 }));
      var tx = anchorMid ? (x1 + x2) / 2 : x1;
      var t = svgEl("text", { x: tx, y: yb + 22, fill: ink2, "font-size": 13, "font-weight": 600, "text-anchor": anchorMid ? "middle" : "start" });
      t.textContent = label + " " + val;
      s.appendChild(t);
    }
    if (active === 0) bracket(L, L + bw, "จัดสรร", mb(y.alloc), true);
    else if (active === 2) bracket(L + fillW + 1, L + bw, "คงเหลือ", mb(y.remain), false);
    else bracket(L, L + fillW, "เบิกจ่ายและผูกพัน", mb(y.disb), true);

    var head = svgEl("text", { x: L, y: 22, fill: ink3, "font-size": 13, "font-weight": 600 });
    head.textContent = nw ? "ปีงบประมาณ " + y.year : "ปีงบประมาณ " + y.year + " · ยอดตัดถึง " + y.cutThai;
    s.appendChild(head);

    barBox.appendChild(s);
    void surf;
  }

  function drawDef() {
    clear(defBox);
    var t = terms[active];
    defBox.appendChild(el("h3", { text: t.name }));
    defBox.appendChild(el("div", { class: "amount", text: t.isRate ? pct(y.rate, 2) : mb(t.val) }));
    defBox.appendChild(el("p", { text: t.plain }));
    var meta = el("p", { class: "fig-note", html: (t.isRate
      ? mb(y.disb) + " ÷ " + mb(y.alloc)
      : fullBaht(t.val)) + " " + srcChip(1, y.srcFile) });
    defBox.appendChild(meta);
  }

  terms.forEach(function (t, i) {
    var b = el("button", { class: "vtab", type: "button", role: "tab", "aria-selected": i === 0 ? "true" : "false" }, [
      el("span", { class: "sw" }), el("span", { text: t.name })
    ]);
    b.querySelector(".sw").style.background = "var(" + t.color + ")";
    b.addEventListener("click", function () {
      active = i;
      [].forEach.call(tabBox.children, function (c, j) { c.setAttribute("aria-selected", j === i ? "true" : "false"); });
      drawBar(); drawDef();
    });
    tabBox.appendChild(b);
  });

  onRedraw(function () { drawBar(); drawDef(); });
}

/* ================================================================ §2 ห้าปี */
function years() {
  var box = document.getElementById("yearChart");
  var btn = document.getElementById("revealBtn");
  var hint = document.getElementById("revealHint");
  var revealBox = document.getElementById("revealBox");
  var revealed = false;
  var maxAlloc = Math.max.apply(null, D.years.map(function (y) { return y.alloc; }));
  /* ปีที่อัตราเบิกจ่ายต่ำสุดคือจุดที่สะดุดตาที่สุดของบทนี้ เน้นไว้ให้เด่นกว่าปีอื่น */
  var minRate = Math.min.apply(null, D.years.map(function (y) { return y.rate; }));

  function draw() {
    clear(box);
    var nw = narrow();
    var W = nw ? 470 : boxW(box, 900), L = nw ? 38 : 56, R = nw ? 54 : 176;
    /* จอแคบย้ายป้ายค่าลงมาไว้ใต้แท่ง แถวจึงต้องสูงขึ้น */
    var rowH = nw ? (revealed ? 104 : 74) : (revealed ? 86 : 66);
    var bh = 24, top = 30;
    var H = top + D.years.length * rowH + 16;
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "งบจัดสรรและเบิกจ่ายปี 2563 ถึง 2567" });
    var track = cssv("--track"), blue = cssv("--s1"), gold = cssv("--gold");
    var ink = cssv("--ink"), ink2 = cssv("--ink-2"), ink3 = cssv("--ink-3"), grid = cssv("--grid");
    var bw = W - L - R;

    /* แกนบนสุด: เส้นบอกสเกลแบบบาง ๆ */
    var ticks = nw ? [0, 3e9, 6e9] : [0, 2e9, 4e9, 6e9];
    ticks.forEach(function (t) {
      var x = L + bw * (t / maxAlloc);
      if (t / maxAlloc > 1) return;
      s.appendChild(svgEl("line", { x1: x, y1: top - 8, x2: x, y2: H - 18, stroke: grid, "stroke-width": 1 }));
      var tl = svgEl("text", { x: x, y: top - 14, fill: ink3, "font-size": nw ? 10.5 : 11, "text-anchor": t === 0 ? "start" : "middle" });
      tl.textContent = t === 0 ? "0" : n0(t / 1e6);
      s.appendChild(tl);
    });
    if (!nw) {
      var unit = svgEl("text", { x: W - R + 8, y: top - 14, fill: ink3, "font-size": 11 });
      unit.textContent = "ล้านบาท";
      s.appendChild(unit);
    }

    D.years.forEach(function (y, i) {
      var cy = top + i * rowH + 8;
      var isLast = y.year === LAST.year;
      var full = bw * (y.alloc / maxAlloc);
      var fill = bw * (y.disb / maxAlloc);

      var yl = svgEl("text", { x: 0, y: cy + bh * .72, fill: isLast && revealed ? ink : ink2, "font-size": 14, "font-weight": isLast && revealed ? 700 : 600 });
      yl.textContent = y.year;
      s.appendChild(yl);

      var gTrack = svgEl("rect", { x: L, y: cy, width: full, height: bh, rx: 4, fill: track });
      s.appendChild(gTrack);
      var gFill = svgEl("rect", { x: L, y: cy, width: Math.max(0, fill - 1), height: bh, rx: 4, fill: blue });
      s.appendChild(gFill);

      var hit = svgEl("rect", { x: L, y: cy - 6, width: full, height: bh + 12, fill: "transparent", class: "year-hit", tabindex: "0", role: "button", "aria-label": "ปี " + y.year + " กดเพื่อดูโครงสร้างงบปีนี้", style: "cursor:pointer" });
      bindTip(hit, function () {
        return "<b>ปีงบประมาณ " + y.year + "</b><br>จัดสรร " + mb(y.alloc) +
          "<br>เบิกจ่ายและผูกพัน " + mb(y.disb) + "<br>คงเหลือ " + mb(y.remain) +
          "<br>อัตราเบิกจ่าย " + pct(y.rate, 2) + "<br>ยอดตัดถึง " + y.cutThai + "<br><i>กดเพื่อดูโครงสร้างงบปีนี้</i>";
      });
      hit.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hit.dispatchEvent(new MouseEvent("click")); } });
      hit.addEventListener("click", function () { window.tmSetYear && window.tmSetYear(y.year); });
      s.appendChild(hit);

      /* ป้ายค่า: จอกว้างวางที่ปลายแท่ง จอแคบวางบรรทัดใต้แท่ง */
      var vt = svgEl("text", nw
        ? { x: L, y: cy + bh + 15, fill: ink2, "font-size": 12 }
        : { x: L + full + 10, y: cy + bh * .72, fill: ink2, "font-size": 12.5 });
      vt.textContent = mbShort(y.disb) + " / " + mbShort(y.alloc) + (nw ? " ล้านบาท" : "");
      s.appendChild(vt);

      var isMin = y.rate === minRate;
      var rt = svgEl("text", { x: W - 4, y: cy + bh * .72, fill: isMin ? blue : (isLast && revealed ? cssv("--gold-deep") : ink3), "font-size": isMin ? 13.5 : (nw ? 11.5 : 12.5), "font-weight": isMin || (isLast && revealed) ? 700 : 600, "text-anchor": "end" });
      rt.textContent = (nw ? Math.round(y.rate) + "%" : pct(y.rate, 2)) + (isMin && !nw ? " · ต่ำสุด" : "");
      s.appendChild(rt);

      if (revealed) {
        var late = y.monthsAfterYearEnd;
        var barMax = 5;
        var cw = nw ? 56 : 72, cx = L, cyy = cy + bh + (nw ? 26 : 11);
        s.appendChild(svgEl("rect", { x: cx, y: cyy, width: cw, height: 7, rx: 3.5, fill: track }));
        s.appendChild(svgEl("rect", { x: cx, y: cyy, width: cw * (late / barMax), height: 7, rx: 3.5, fill: isLast ? gold : mix(cssv("--ink-3"), cssv("--surface"), .45) }));
        var ct = svgEl("text", { x: cx + cw + 9, y: cyy + 7, fill: isLast ? ink : ink3, "font-size": nw ? 11.5 : 12, "font-weight": isLast ? 700 : 400 });
        ct.textContent = nw ? "ตัดยอดหลังสิ้นปีงบ " + late + " เดือน"
                            : "ตัดยอด " + y.cutThai + " — หลังสิ้นปีงบ " + late + " เดือน";
        s.appendChild(ct);
      }
    });

    box.appendChild(s);
  }

  btn.addEventListener("click", function () {
    revealed = !revealed;
    btn.setAttribute("aria-pressed", revealed ? "true" : "false");
    btn.textContent = revealed ? "ซ่อนวันที่ตัดยอด" : "ทำไมต้องดูวันที่ตัดยอด?";
    hint.textContent = revealed ? "แถบสั้นหมายถึงนับยอดหลังสิ้นปีงบไม่นาน จึงยังไม่รวมเงินที่เบิกจ่ายหลังจากนั้น" : "ดูว่าแต่ละปีนับยอดเงินถึงวันไหน";
    draw();
    clear(revealBox);
    if (revealed) {
      var lateLast = LAST.monthsAfterYearEnd;
      var others = D.years.filter(function (y) { return y.year !== LAST.year; }).map(function (y) { return y.monthsAfterYearEnd; });
      var mn = Math.min.apply(null, others), mx = Math.max.apply(null, others);
      revealBox.appendChild(el("div", {
        class: "callout", html:
          "<strong>แต่ละปีนับยอดถึงคนละช่วงเวลา จึงยังสรุปว่าทำงานช้าลงไม่ได้</strong><br>" +
          "ปีงบประมาณไทยสิ้นสุด 30 กันยายน แต่การเบิกจ่ายยังทยอยเกิดต่อไปอีกหลายเดือน " +
          "เอกสารปี " + LAST.year + " ตัดยอดเมื่อ <strong>" + LAST.cutThai + "</strong> คือหลังสิ้นปีงบเพียง <strong>" + lateLast + " เดือน</strong> " +
          "ขณะที่อีกสี่ปีตัดยอดหลังสิ้นปีงบไป " + mn + "–" + mx + " เดือน " +
          "ตัวเลข " + pct(LAST.rate, 2) + " จึงยังเทียบกับปีอื่นตรง ๆ ไม่ได้ ต้องรอเอกสารฉบับที่ตัดยอดช้ากว่านี้ก่อน"
      }));
    }
  });

  onRedraw(draw);

  /* ตารางคู่กราฟ */
  var tbl = document.getElementById("yearTable");
  tbl.innerHTML =
    "<thead><tr><th>ปีงบประมาณ</th><th class='n'>จัดสรร</th><th class='n'>เบิกจ่ายและผูกพัน</th><th class='n'>คงเหลือ</th><th class='n'>อัตราเบิกจ่าย</th><th>วันที่ตัดยอด</th><th class='n'>หลังสิ้นปีงบ</th></tr></thead><tbody>" +
    D.years.map(function (y) {
      return "<tr><td>" + y.year + "</td><td class='n'>" + n2(y.alloc) + "</td><td class='n'>" + n2(y.disb) +
        "</td><td class='n'>" + n2(y.remain) + "</td><td class='n'>" + pct(y.rate, 2) + "</td><td>" + esc(y.cutThai) +
        "</td><td class='n'>" + y.monthsAfterYearEnd + " เดือน</td></tr>";
    }).join("") + "</tbody>";
}

/* ================================================================ §3 treemap */
function treemap() {
  var holder = document.getElementById("tmHolder");
  var crumbs = document.getElementById("tmCrumbs");
  var yearsBox = document.getElementById("tmYears");
  var totalNote = document.getElementById("tmTotal");
  var legendNote = document.getElementById("tmLegendNote");
  var tbl = document.getElementById("tmTable");

  var curYear = LAST.year;
  var path = [];
  /* render() ลบ DOM เดิมทิ้งหมด โฟกัสจึงตกไปที่ body ทุกครั้งที่เจาะหรือถอย
     ธงนี้บอกว่าการวาดรอบนี้มาจากการกดของผู้ใช้ ไม่ใช่การโหลดหน้าหรือสลับธีม */
  var wantFocus = false;
  function drillTo(next) { path = next; wantFocus = true; render(); }

  var BUDGET_CAT_HELP = {
    "งบบุคลากร": "เงินเดือน ค่าจ้าง และสวัสดิการของคนที่ทำงานให้สำนักงาน",
    "งบดำเนินงาน": "ค่าใช้จ่ายให้องค์กรเดินได้ในแต่ละวัน ค่าไฟ ค่าน้ำ ค่าจ้างเหมา ค่าวัสดุ",
    "งบลงทุน": "ของที่ซื้อแล้วใช้ได้หลายปี ครุภัณฑ์ อาคาร ที่ดิน ระบบคอมพิวเตอร์",
    "งบเงินอุดหนุน": "เงินที่ให้หน่วยงานหรือองค์กรอื่นไปใช้ตามวัตถุประสงค์ที่กำหนด",
    "งบรายจ่ายอื่น": "รายจ่ายที่ไม่เข้าสี่หมวดข้างบน เช่น ค่าใช้จ่ายโครงการเฉพาะกิจ"
  };

  function roots() { return D.tree[curYear] || []; }
  function nodeAt(p) {
    var list = roots(), node = null;
    for (var i = 0; i < p.length; i++) {
      node = null;
      for (var j = 0; j < list.length; j++) if (list[j].name === p[i]) { node = list[j]; break; }
      if (!node) return null;
      list = node.children;
    }
    return node;
  }
  function currentList() {
    if (!path.length) return roots();
    var n = nodeAt(path);
    return n && n.children.length ? n.children : [];
  }
  function rootIndexOf(name) {
    var r = roots();
    for (var i = 0; i < r.length; i++) if (r[i].name === name) return i;
    return 0;
  }

  /* ---- squarified treemap ---- */
  function squarify(nodes, X, Y, W, H) {
    var total = nodes.reduce(function (s, n) { return s + (n.alloc || 0); }, 0);
    if (total <= 0 || W <= 0 || H <= 0) return [];
    var scale = (W * H) / total;
    var items = nodes.map(function (n) { return { node: n, area: (n.alloc || 0) * scale }; })
                     .filter(function (i) { return i.area > 0; });
    var out = [], x = X, y = Y, w = W, h = H;

    function worst(row, len, extra) {
      var areas = row.map(function (i) { return i.area; });
      if (extra) areas = areas.concat([extra]);
      if (!areas.length) return Infinity;
      var sum = areas.reduce(function (a, b) { return a + b; }, 0);
      var mx = Math.max.apply(null, areas), mn = Math.min.apply(null, areas);
      var l2 = len * len, s2 = sum * sum;
      return Math.max(l2 * mx / s2, s2 / (l2 * mn));
    }
    function place(row, rowArea) {
      var horizontal = w >= h;
      var len = horizontal ? h : w;
      if (len <= 0) return;
      var thick = rowArea / len, off = 0;
      row.forEach(function (it) {
        var frac = it.area / rowArea, seg = len * frac;
        out.push(horizontal
          ? { node: it.node, x: x, y: y + off, w: thick, h: seg }
          : { node: it.node, x: x + off, y: y, w: seg, h: thick });
        off += seg;
      });
      if (horizontal) { x += thick; w -= thick; } else { y += thick; h -= thick; }
    }

    var row = [], rowArea = 0, i = 0;
    while (i < items.length) {
      var it = items[i], len = Math.min(w, h);
      if (len <= 0) break;
      if (!row.length || worst(row, len, it.area) <= worst(row, len)) {
        row.push(it); rowArea += it.area; i++;
      } else { place(row, rowArea); row = []; rowArea = 0; }
    }
    if (row.length) place(row, rowArea);
    return out;
  }

  /** แปลง tree node เป็นตัวกรองรายการย่อยสุด แล้วเปิด Modal Dashboard ของ Section 4 */
  function cleanPathName(s) { return String(s).replace(/^[-\s]+/, "").replace(/[-\s]+$/, ""); }
  function filterForNode(node) {
    var f = {}, disp = [];
    var list = roots();
    for (var i = 0; i < node.path.length; i++) {
      /* เทียบทั้ง name (ชื่อกลุ่มที่แสดง) และ path ท้าย (ค่าดิบตรงกับ vocab รายการย่อยสุด)
         เพราะชั้นหมวดค่าใช้จ่าย name มีขีดคั่น เช่น "- ค่าใช้สอย" แต่ค่าดิบคือ "ค่าใช้สอย" */
      var found = null;
      for (var j = 0; j < list.length; j++) {
        var cd = list[j];
        var tail = cd.path.length ? cd.path[cd.path.length - 1] : null;
        if (cd.name === node.path[i] || tail === node.path[i]) { found = cd; break; }
      }
      if (!found) break;
      var key = found.level === "แผนงาน" ? "plan"
              : found.level === "กลุ่มรายจ่าย" ? "group"
              : found.level === "หมวดงบรายจ่าย" ? "bcat" : "ecat";
      f[key] = node.path[i];
      disp.push(cleanPathName(node.path[i]));
      list = found.children;
    }
    return { f: f, label: "ปี " + curYear + " · " + disp.join(" › ") };
  }

  /** จอแคบ: treemap ย่อแล้วอ่านป้ายไม่ออก เปลี่ยนเป็นรายการแท่งแนวนอนแทน */
  function drawBars(list) {
    var sorted = list.slice().sort(function (a, b) { return (b.alloc || 0) - (a.alloc || 0); });
    var max = sorted.length ? (sorted[0].alloc || 1) : 1;
    var parentHue = path.length ? rootIndexOf(path[0]) : null;
    var wrap = el("div", { class: "barlist" });

    sorted.forEach(function (node, idx) {
      var hue = parentHue === null ? idx : parentHue;
      var color = series(hue);
      var hasKids = node.children.length > 0;
      var nm = node.name.replace(/^-\s*/, "");

      var row = el(hasKids ? "button" : "div", { class: "barrow" + (hasKids ? " tm-barbtn" : "") });
      if (hasKids) {
        row.type = "button";
        row.setAttribute("aria-label", nm + " " + mb(node.alloc) + " กดเพื่อดูรายละเอียด");
        row.addEventListener("click", function () { drillTo(path.concat([node.name])); });
      }
      row.appendChild(el("div", { class: "nm", text: nm + (hasKids ? " ›" : "") }));
      row.appendChild(el("div", { class: "vl", text: mb(node.alloc) }));
      var tr = el("div", { class: "tr" });
      var fl = el("div", { class: "fl" });
      fl.style.width = Math.max(1, ((node.alloc || 0) / max) * 100) + "%";
      fl.style.background = color;
      tr.appendChild(fl);
      row.appendChild(tr);
      row.appendChild(el("div", { class: "mt", text:
        "เบิกจ่าย " + mb(node.disb) + " · คงเหลือ " + mb(node.remain) +
        (node.nLeaf ? " · " + n0(node.nLeaf) + " รายการย่อยสุด" : "") }));
      wrap.appendChild(row);
      if (node.nLeaf && window.ssoOpenItems) {
        var dl = el("button", { class: "btn btn--ghost tm-dashlink", type: "button",
          text: "ดูทั้งหมด →",
          "aria-label": nm + " ดูรายการย่อยสุดทั้งหมด " + n0(node.nLeaf) + " รายการในหน้ารายละเอียด" });
        dl.addEventListener("click", function () {
          var fo = filterForNode(node);
          window.ssoOpenItems({ year: curYear, f: fo.f, label: fo.label });
        });
        wrap.appendChild(dl);
      }
    });
    holder.appendChild(wrap);
  }

  function draw() {
    clear(holder);
    var list = currentList();

    if (narrow() || path.length >= 2) {
      if (!list.length) {
        holder.appendChild(el("div", { class: "empty", text: "รายการนี้ไม่มีชั้นย่อยลงไปอีก" }));
      } else {
        drawBars(list);
      }
      legendNote.textContent = "กำลังดูระดับ " +
        ["แผนงาน", "กลุ่มรายจ่าย / หมวดงบรายจ่าย", "หมวดงบรายจ่าย / หมวดค่าใช้จ่าย", "หมวดค่าใช้จ่าย"][Math.min(3, path.length)] +
        " · " + list.length + " รายการ · ความยาวแท่งคือยอดจัดสรร · กดปุ่มใต้แถบเพื่อดูรายการย่อยสุด หรือรายการที่ไม่แยกย่อยต่อแล้ว";
      return;
    }

    var W = boxW(holder, 1040), H = Math.max(360, Math.min(560, 360 + list.length * 4));
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "สัดส่วนงบปี " + curYear });
    var surf = cssv("--surface"), ink3 = cssv("--ink-3");

    if (!list.length) {
      var t = svgEl("text", { x: W / 2, y: H / 2, fill: ink3, "font-size": 15, "text-anchor": "middle" });
      t.textContent = "รายการนี้ไม่มีชั้นย่อยลงไปอีก";
      s.appendChild(t); holder.appendChild(s); return;
    }

    var sorted = list.slice().sort(function (a, b) { return (b.alloc || 0) - (a.alloc || 0); });
    var cells = squarify(sorted, 0, 0, W, H);
    var parentHue = path.length ? rootIndexOf(path[0]) : null;

    cells.forEach(function (c, idx) {
      var hue = parentHue === null ? idx : parentHue;
      var base = series(hue);
      /* ลูกใต้แม่เดียวกันใช้ขั้นความสว่างของสีแม่ เพื่อบอกว่าเป็นพวกเดียวกัน */
      var tone = parentHue === null ? 0 : Math.min(.62, .12 + idx * .105);
      var fill = tone ? mix(base.charAt(0) === "#" ? base : "#005c9e", surf.charAt(0) === "#" ? surf : "#ffffff", tone) : base;

      var g = svgEl("g", { class: "tm-tile" + (c.node.children.length ? "" : " leaf") });
      /* ช่อง 2px สีพื้นทำหน้าที่คั่น ไม่วาดเส้นขอบรอบกล่อง */
      g.appendChild(svgEl("rect", {
        x: c.x + 1, y: c.y + 1, width: Math.max(0, c.w - 2), height: Math.max(0, c.h - 2),
        rx: 4, fill: fill
      }));

      var fg = inkOn(fill);
      var pad = 11, fs = 14, sfs = 12.5;
      var nm = c.node.name.replace(/^-\s*/, "");
      /* วาด label เฉพาะตอนที่วัดแล้วว่าใส่ลงจริง ไม่ปล่อยให้ถูกตัด */
      if (c.w > 78 && c.h > 46) {
        var maxW = c.w - pad * 2;
        var label = nm;
        if (textW(label, fs) > maxW) {
          while (label.length > 4 && textW(label + "…", fs) > maxW) label = label.slice(0, -1);
          if (label !== nm) label += "…";
        }
        var t1 = svgEl("text", { x: c.x + pad, y: c.y + pad + fs * .86, fill: fg, "font-size": fs, "font-weight": 600 });
        t1.textContent = label;
        g.appendChild(t1);
        if (c.h > 68) {
          var vs = mb(c.node.alloc);
          if (textW(vs, sfs) <= maxW) {
            var t2 = svgEl("text", { x: c.x + pad, y: c.y + pad + fs * .86 + sfs + 6, fill: fg, "font-size": sfs, opacity: .88 });
            t2.textContent = vs;
            g.appendChild(t2);
          }
        }
      }

      var hasKids = c.node.children.length > 0;
      if (hasKids) {
        g.addEventListener("click", function () { drillTo(path.concat([c.node.name])); });
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
        g.setAttribute("aria-label", nm + " " + mb(c.node.alloc) + " กดเพื่อดูรายละเอียด");
        g.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drillTo(path.concat([c.node.name])); }
        });
      }
      bindTip(g, function () {
        var help = BUDGET_CAT_HELP[c.node.name];
        return "<b>" + esc(nm) + "</b>" + (help ? "<br>" + esc(help) : "") +
          "<br>จัดสรร " + mb(c.node.alloc) +
          "<br>เบิกจ่ายและผูกพัน " + mb(c.node.disb) +
          "<br>คงเหลือ " + mb(c.node.remain) +
          (c.node.nLeaf ? "<br>มีรายการย่อยสุด " + n0(c.node.nLeaf) + " รายการ" : "") +
          (hasKids ? "<br><i>กดเพื่อดูรายละเอียด</i>" : "");
      });
      s.appendChild(g);
    });

    holder.appendChild(s);

    var depthName = ["แผนงาน", "กลุ่มรายจ่าย / หมวดงบรายจ่าย", "หมวดงบรายจ่าย / หมวดค่าใช้จ่าย", "หมวดค่าใช้จ่าย"][Math.min(3, path.length)];
    legendNote.textContent = "กำลังดูระดับ " + depthName + " · " + list.length + " กล่อง · ขนาดกล่องคือยอดจัดสรร";
  }

  function renderCrumbs() {
    clear(crumbs);
    var mk = function (label, toDepth, isCur) {
      if (isCur) return el("span", { class: "cur", text: label });
      return el("button", { type: "button", text: label, onclick: function () { drillTo(path.slice(0, toDepth)); } });
    };
    crumbs.appendChild(mk("งบทั้งปี " + curYear, 0, path.length === 0));
    path.forEach(function (p, i) {
      crumbs.appendChild(el("span", { class: "sep", text: "›" }));
      crumbs.appendChild(mk(p.replace(/^-\s*/, ""), i + 1, i === path.length - 1));
    });
  }

  function renderTable() {
    var list = currentList().slice().sort(function (a, b) { return (b.alloc || 0) - (a.alloc || 0); });
    tbl.innerHTML =
      "<thead><tr><th>รายการ</th><th class='n'>จัดสรร</th><th class='n'>เบิกจ่ายและผูกพัน</th><th class='n'>คงเหลือ</th><th class='n'>รายการย่อยสุด</th></tr></thead><tbody>" +
      list.map(function (n) {
        return "<tr><td class='wrap-cell'>" + esc(n.name.replace(/^-\s*/, "")) + "</td><td class='n'>" + (n.alloc === null ? "—" : n2(n.alloc)) +
          "</td><td class='n'>" + (n.disb === null ? "—" : n2(n.disb)) + "</td><td class='n'>" + (n.remain === null ? "—" : n2(n.remain)) +
          "</td><td class='n'>" + n0(n.nLeaf) + "</td></tr>";
      }).join("") + "</tbody>";
  }

  var lastTableLocation = null;
  function render() {
    hideTip();
    var yr = null;
    for (var i = 0; i < D.years.length; i++) if (D.years[i].year === curYear) yr = D.years[i];
    totalNote.innerHTML = "ยอดจัดสรรทั้งปี " + mb(yr.alloc) + " " + srcChip(1, yr.srcFile);
    [].forEach.call(yearsBox.children, function (b) {
      b.setAttribute("aria-pressed", b.dataset.year === curYear ? "true" : "false");
    });
    renderCrumbs(); draw(); renderTable();
    var tableLocation = JSON.stringify([curYear, path]);
    if (lastTableLocation !== tableLocation) tbl.closest("details").open = path.length >= 2;
    lastTableLocation = tableLocation;

    /* คืนโฟกัสไปที่ชั้นปัจจุบันใน breadcrumb ซึ่งอ่านออกเสียงว่าตอนนี้อยู่ตรงไหน
       และเป็นจุดที่กด Tab ต่อไปถึงกล่องหรือแท่งได้ทันที */
    if (wantFocus) {
      wantFocus = false;
      var cur = crumbs.querySelector(".cur");
      if (cur) { cur.setAttribute("tabindex", "-1"); cur.focus({ preventScroll: true }); }
    }
  }

  /* ถอยขึ้นหนึ่งชั้นด้วย Escape เดิมมีแต่ breadcrumb ซึ่งอยู่เหนือกราฟ
     คนที่ใช้คีย์บอร์ดต้อง Shift+Tab ย้อนกลับไปทุกครั้ง */
  document.getElementById("s3").addEventListener("keydown", function (e) {
    if (e.key === "Escape" && path.length) { e.preventDefault(); drillTo(path.slice(0, -1)); }
  });

  D.years.forEach(function (y) {
    var b = el("button", { type: "button", text: y.year, "aria-pressed": "false" });
    b.dataset.year = y.year;
    b.addEventListener("click", function () { curYear = y.year; path = []; render(); });
    yearsBox.appendChild(b);
  });

  window.tmSetYear = function (y) {
    curYear = y; path = []; render();
    document.getElementById("s3").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  onRedraw(render);
}

/* ================================================================ §4 รายการ */
function items() {
  var IX = {};
  D.items.cols.forEach(function (c, i) { IX[c] = i; });
  var V = D.items.vocab;
  var rows = D.items.rows.map(function (r) {
    return {
      year: r[IX.year], name: r[IX.name],
      plan: r[IX.plan] < 0 ? "" : V[r[IX.plan]],
      group: r[IX.group] < 0 ? "" : V[r[IX.group]],
      bcat: r[IX.bcat] < 0 ? "" : V[r[IX.bcat]],
      ecat: r[IX.ecat] < 0 ? "" : V[r[IX.ecat]],
      alloc: r[IX.alloc], disb: r[IX.disb], remain: r[IX.remain], page: r[IX.page],
      /* ลำดับใน series.list ของรายการเดียวกันข้ามปี -1 คือจับคู่ไม่ได้ */
      sid: IX.sid === undefined ? -1 : r[IX.sid]
    };
  });

  var BCATS = [];
  rows.forEach(function (r) { if (r.bcat && BCATS.indexOf(r.bcat) < 0) BCATS.push(r.bcat); });
  BCATS.sort();
  function bcatColor(b) { var i = BCATS.indexOf(b); return series(i < 0 ? 0 : i); }

  /* ---------- ทายก่อนดู ---------- */
  function find(year, needle) {
    var hits = rows.filter(function (r) { return r.year === year && r.name.indexOf(needle) >= 0 && r.alloc; });
    hits.sort(function (a, b) { return b.alloc - a.alloc; });
    return hits[0] || null;
  }
  var quizItems = [
    { it: find(LAST.year, "จ้างพนักงานประกันสังคม"), q: "ค่าจ้างพนักงานประกันสังคมทั้งประเทศ ปี " + LAST.year + " ใช้เงินเท่าไหร่?",
      after: "เป็นรายการเดี่ยวที่ใหญ่ที่สุดในงบทั้งปี คนคือต้นทุนก้อนใหญ่ที่สุดของสำนักงาน" },
    { it: find(LAST.year, "ค่าธรรมเนียมรับเงินสมทบ"), q: "ค่าธรรมเนียมที่จ่ายให้ธนาคาร เพื่อรับเงินสมทบจากผู้ประกันตน ปีละเท่าไหร่?",
      after: "ทุกครั้งที่เงินสมทบวิ่งผ่านธนาคารหรือหน่วยบริการ มีค่าธรรมเนียมตามมา และจ่ายแบบนี้ทุกปี" },
    { it: find("2566", "เมนเฟรม"), q: "โครงการย้ายระบบประกันสังคมจากเครื่องเมนเฟรมมาเป็นเว็บ ตั้งงบไว้เท่าไหร่ (ปี 2566)?",
      after: "งบลงทุนไอทีก้อนใหญ่ที่ทำให้ยอดรวมปี 2566 สูงกว่าปีอื่นอย่างชัดเจน" },
    { it: find(LAST.year, "ค่าไฟฟ้า"), q: "ค่าไฟฟ้าของสำนักงานประกันสังคมทั่วประเทศ ปีละเท่าไหร่?",
      after: "ห้าปีที่ผ่านมาอยู่ราว 91–97 ล้านบาททุกปี เป็นตัวอย่างของรายจ่ายประจำที่แทบไม่ขยับ" }
  ].filter(function (q) { return q.it; });

  var qi = 0, answered = false;
  var card = document.getElementById("guessCard");

  function renderGuess() {
    clear(card);
    var q = quizItems[qi], actual = q.it.alloc;
    /* ช่วงของแถบและตำแหน่งเริ่มต้นต้องสุ่ม ไม่งั้นกึ่งกลางจะเท่ากับ 1.2 เท่าของคำตอบเสมอ
       ซึ่งอยู่ในเกณฑ์ "ใกล้มาก" พอดี คนที่ไม่แตะแถบเลยจะทายถูกทุกข้อ */
    var spread = 2.2 + Math.random() * 1.6;
    var max = Math.ceil(actual * spread / 1e7) * 1e7;
    var step = Math.max(1e6, Math.round(max / 200 / 1e6) * 1e6);
    var val = Math.round(max * (0.1 + Math.random() * 0.25) / step) * step;

    card.appendChild(el("div", { class: "guess-q", text: q.q }));

    var out = el("div", { class: "guess-your", text: mb(val) });
    var slider = el("input", {
      class: "guess-slider", type: "range", min: 0, max: max, step: step, value: val,
      id: "guessRange", "aria-label": "ทายยอดเงิน"
    });
    card.appendChild(out);
    card.appendChild(slider);
    card.appendChild(el("div", { class: "guess-scale" }, [
      el("span", { text: "0" }), el("span", { text: mb(max) })
    ]));
    var hint = el("p", { class: "fig-note", text: "เลื่อนแถบเลือกจำนวนเงินที่คิดไว้ แล้วกด “เฉลย”" });
    card.appendChild(hint);

    var result = el("div", { class: "guess-result", hidden: "" });
    var nav = el("div", { class: "guess-nav" });
    var reveal = el("button", { class: "btn", type: "button", text: "เฉลย" });
    /* บังคับให้ต้องทายจริงก่อน ไม่งั้นตำแหน่งที่ระบบตั้งให้จะกลายเป็นคำตอบของผู้ใช้ */
    reveal.disabled = true;
    slider.addEventListener("input", function () {
      out.textContent = mb(+slider.value);
      if (reveal.disabled) { reveal.disabled = false; hint.textContent = "กดเฉลยเพื่อดูคำตอบจริง"; }
    });
    var next = el("button", { class: "btn btn--ghost", type: "button", text: "ข้อถัดไป →" });
    var dots = el("div", { class: "guess-dots" });
    quizItems.forEach(function (_, i) { dots.appendChild(el("span", { class: i === qi ? "on" : "" })); });

    reveal.addEventListener("click", function () {
      if (answered) return;
      answered = true;
      var guess = +slider.value;
      var off = Math.abs(guess - actual) / actual;
      /* สามระดับ เกณฑ์เดิม 25% กว้างเกินไปจนแทบไม่มีทางพลาด */
      var head = off <= 0.15 ? "<strong>แม่นมาก</strong> — "
               : off <= 0.4  ? "<strong>ใกล้เคียงแล้ว</strong> — "
                             : "<strong>ลองดูยอดจริงกัน</strong> — ";
      var gap = guess > actual ? "สูงกว่าจริง " : "ต่ำกว่าจริง ";
      result.className = "guess-result " + (off <= 0.15 ? "hot" : "cold");
      result.hidden = false;
      result.innerHTML =
        head + "คุณทาย " + mb(guess) +
        (off < 0.005 ? " ตรงพอดี" : " " + gap + Math.round(off * 100) + "%") +
        " คำตอบจริงคือ" +
        "<span class='guess-actual'>" + mb(actual) + "</span>" +
        esc(q.after) + "<br><span class='fig-note'>" + esc(q.it.name.replace(/^\d+\.\s*/, "")) +
        " · ปี " + q.it.year + " · " + fullBaht(actual) + " " + srcChip(q.it.page) + "</span>";
      slider.disabled = true;
      reveal.disabled = true;
      hint.textContent = "";
    });
    next.addEventListener("click", function () {
      qi = (qi + 1) % quizItems.length; answered = false; renderGuess();
    });

    nav.appendChild(reveal); nav.appendChild(next); nav.appendChild(dots);
    card.appendChild(result);
    card.appendChild(nav);
  }
  renderGuess();

  /* ---------- หน้าแรก Top 5 + Modal Dashboard ---------- */
  var previewBox = document.getElementById("itemPreview");
  var previewNote = document.getElementById("itemPreviewNote");
  var previewCount = document.getElementById("itemPreviewCount");
  var openBtn = document.getElementById("itemOpenAll");
  var modal = document.getElementById("itemModal");
  var closeBtn = document.getElementById("itemClose");
  var modalSub = document.getElementById("itemModalSub");
  var kpiBox = document.getElementById("itemKpis");
  var groupBox = document.getElementById("itemGroups");
  var ctxBox = document.getElementById("itemCtx");
  /* ตัวกรองเสริมที่ส่งมาจาก Section 3 (path ในผังโครงสร้างงบ) */
  var ctx = null;
  function matchCtx(r) {
    var f = ctx.f;
    if (f.plan && r.plan !== f.plan) return false;
    if (f.group && r.group !== f.group) return false;
    if (f.bcat && r.bcat !== f.bcat) return false;
    if (f.ecat && r.ecat !== f.ecat) return false;
    return true;
  }
  function renderCtx() {
    if (!ctxBox) return;
    clear(ctxBox);
    if (!ctx) { ctxBox.hidden = true; return; }
    ctxBox.hidden = false;
    ctxBox.appendChild(el("span", { text: ctx.label }));
    var x = el("button", { class: "ctx-clear", type: "button", text: "ล้าง ✕",
      "aria-label": "ล้างตัวกรองจากแผนผังโครงสร้างงบ" });
    x.addEventListener("click", function () { ctx = null; catSel.value = ""; refilter(); });
    ctxBox.appendChild(x);
  }
  var fBox = document.getElementById("itemFilters");
  var list = document.getElementById("itemList");
  var countEl = document.getElementById("itemCount");

  var search = el("input", { type: "search", id: "itemSearch", placeholder: "ค้นหาชื่อรายการ เช่น ค่าไฟฟ้า, Contact Center" });
  var yearSel = el("select", { id: "itemYear", "aria-label": "ปีงบประมาณ" });
  D.years.slice().reverse().forEach(function (y) {
    yearSel.appendChild(el("option", { value: y.year, text: "ปี " + y.year }));
  });
  yearSel.value = LAST.year;
  var catSel = el("select", { id: "itemCat", "aria-label": "หมวดงบรายจ่าย" });
  catSel.appendChild(el("option", { value: "", text: "ทุกหมวดงบรายจ่าย" }));
  BCATS.forEach(function (b) { catSel.appendChild(el("option", { value: b, text: b })); });
  var sortSel = el("select", { id: "itemSort", "aria-label": "เรียงตาม" });
  [
    ["alloc-desc", "เรียง: จัดสรรสูงสุด"],
    ["alloc-asc", "เรียง: จัดสรรต่ำสุด"],
    ["disb-desc", "เรียง: เบิกจ่ายสูงสุด"],
    ["remain-desc", "เรียง: คงเหลือสูงสุด"],
    ["name-asc", "เรียง: ชื่อ ก–ฮ"]
  ].forEach(function (o) { sortSel.appendChild(el("option", { value: o[0], text: o[1] })); });

  fBox.appendChild(search); fBox.appendChild(yearSel); fBox.appendChild(catSel); fBox.appendChild(sortSel);

  function cleanName(s) { return String(s).replace(/^\d+\.\s*/, "").replace(/^-\s*/, ""); }

  /* ---------- ประวัติ 5 ปีของแต่ละรายการ ----------
     ผูกด้วยคอลัมน์ sid ที่ build_data.py คำนวณจาก project_year_mapping.csv
     ไม่ได้เทียบชื่อฝั่งเบราว์เซอร์ เพราะชื่อมาตรฐานกับชื่อตามเอกสารไม่ตรงกัน */
  var SY = D.series.years;

  function histOf(r) {
    if (r.sid === undefined || r.sid === null || r.sid < 0) return null;
    return D.series.list[r.sid] || null;
  }
  /* ยอดปีก่อนหน้าของรายการเดียวกัน ใช้คิดส่วนต่างเทียบปีก่อน */
  function prevAlloc(r) {
    var h = histOf(r);
    if (!h) return null;
    var i = SY.indexOf(r.year);
    if (i <= 0) return null;
    for (var j = i - 1; j >= 0; j--) {
      if (h.alloc[j] !== null && h.alloc[j] !== undefined) return { val: h.alloc[j], year: SY[j] };
    }
    return null;
  }
  /* ป้ายส่วนต่างเทียบปีก่อน ขึ้น = ส้ม ลง = เขียว ไม่ได้แปลว่าดีหรือแย่ แค่ทิศทาง */
  function deltaTag(r) {
    var p = prevAlloc(r);
    if (!p || !p.val || r.alloc === null || r.alloc === undefined) return "";
    var d = (r.alloc - p.val) / p.val * 100;
    var cls = Math.abs(d) < 0.05 ? "flat" : (d > 0 ? "up" : "down");
    var sign = d > 0 ? "+" : (d < 0 ? "−" : "±");
    var mag = Math.abs(d) >= 10 ? Math.round(Math.abs(d)) : Math.round(Math.abs(d) * 10) / 10;
    return '<span class="delta ' + cls + '" title="เทียบปี ' + esc(p.year) + " " + esc(n0(p.val)) +
      ' บาท">' + sign + mag + "%</span>";
  }

  /** กราฟแท่งจัดสรร 5 ปีของรายการเดียว แท่งของปีที่กำลังดูจะเข้มกว่าปีอื่น */
  function histChart(h, curYear, color, holder) {
    /* top ต้องเผื่อที่ให้ป้ายตัวเลขที่ลอยอยู่เหนือแท่ง
       แท่งที่ยอดสูงสุดจะสูงเต็ม bh เสมอ ป้ายของมันจึงอยู่ที่ top - 8 พอดี
       ถ้า top น้อยกว่านี้ป้ายจะถูกดันขึ้นไปทับของที่อยู่ข้างบนหรือหลุดขอบ viewBox */
    var W = boxW(holder, 520), padL = 4, padR = 4, top = 24, bh = 116, gap = 10;
    var vals = h.alloc;
    var nums = vals.filter(function (v) { return v !== null && v !== undefined; });
    var max = nums.length ? Math.max.apply(null, nums) : 1;
    var H = top + bh + 44;
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "ยอดจัดสรรรายปีของ " + h.name });
    var ink2 = cssv("--ink-2"), ink3 = cssv("--ink-3"), track = cssv("--track");
    var colW = (W - padL - padR - gap * (vals.length - 1)) / vals.length;

    vals.forEach(function (v, i) {
      var x = padL + i * (colW + gap);
      var isCur = SY[i] === curYear;
      /* รางจาง ๆ ทุกปี ทำให้เห็นว่าปีไหนไม่มีข้อมูล ไม่ใช่เท่ากับศูนย์ */
      s.appendChild(svgEl("rect", { x: x, y: top, width: colW, height: bh, rx: 4, fill: track, opacity: .45 }));
      if (v === null || v === undefined) {
        var dash = svgEl("text", { x: x + colW / 2, y: top + bh / 2 + 5, fill: ink3,
          "font-size": 13, "text-anchor": "middle" });
        dash.textContent = "—";
        s.appendChild(dash);
      } else {
        var hgt = Math.max(2, bh * (v / max));
        s.appendChild(svgEl("rect", { x: x, y: top + bh - hgt, width: colW, height: hgt, rx: 4,
          fill: color, opacity: isCur ? 1 : .42 }));
        var vt = svgEl("text", { x: x + colW / 2, y: top + bh - hgt - 8, fill: isCur ? cssv("--ink") : ink3,
          "font-size": 12, "font-weight": isCur ? 700 : 500, "text-anchor": "middle" });
        vt.textContent = mbShort(v);
        s.appendChild(vt);
      }
      var yl = svgEl("text", { x: x + colW / 2, y: top + bh + 20, fill: isCur ? ink2 : ink3,
        "font-size": 12, "font-weight": isCur ? 700 : 400, "text-anchor": "middle" });
      yl.textContent = SY[i];
      s.appendChild(yl);
    });

    /* หน่วยไปอยู่ในหัวข้อที่เป็น HTML แทนที่จะวาดลงใน SVG
       ของที่ลอยอยู่ในพิกัดเดียวกับป้ายตัวเลขมีแต่จะชนกันเวลาแท่งสูงเต็ม */
    holder.appendChild(s);
  }

  /** เนื้อหาในแผงประวัติ เรียกตอนกางครั้งแรกและตอนวาดใหม่ */
  function fillHist(box, r) {
    clear(box);
    var h = histOf(r);
    if (!h) {
      box.appendChild(el("p", { class: "none", text:
        "รายการนี้จับคู่กับปีอื่นไม่ได้ จึงยังไม่มีประวัติย้อนหลังให้เทียบ " +
        "อาจเป็นโครงการที่ตั้งงบปีเดียว หรือชื่อในเอกสารเปลี่ยนไปจนระบบไม่ยืนยันว่าเป็นรายการเดียวกัน" }));
      return;
    }
    box.appendChild(el("div", { class: "hd", text:
      "ยอดจัดสรรย้อนหลัง " + SY.length + " ปี · หน่วยล้านบาท" }));
    var holder = el("div");
    box.appendChild(holder);
    histChart(h, r.year, bcatColor(r.bcat), holder);

    var seen = h.alloc.filter(function (v) { return v !== null && v !== undefined; });
    var lines = [];
    lines.push("พบในเอกสาร " + h.nYears + " จาก " + SY.length + " ปี · รวมทุกปี " + mb(h.total));
    if (seen.length > 1) {
      var lo = Math.min.apply(null, seen), hi = Math.max.apply(null, seen);
      lines.push("ต่ำสุด " + mb(lo) + " · สูงสุด " + mb(hi));
    }
    var p = prevAlloc(r);
    if (p && p.val && r.alloc !== null && r.alloc !== undefined) {
      var diff = r.alloc - p.val;
      lines.push("เทียบปี " + p.year + " " + (diff >= 0 ? "เพิ่มขึ้น " : "ลดลง ") +
        n0(Math.abs(diff)) + " บาท");
    }
    box.appendChild(el("p", { class: "note", text: lines.join(" · ") }));
    /* การจับคู่ข้ามปีทั้งชุดใช้ "ชื่อตรงกันทุกตัวอักษรหลังปรับรูป" ไม่มีการเดาจากความคล้าย
       ตัวเลขที่แสดงจึงเป็นของรายการนี้แน่นอน ความเสี่ยงคือ "ปีไม่ครบ"
       เพราะบางปีอาจถูกบันทึกไว้ใต้ชื่อที่สะกดต่างกันนิดเดียวจนกลายเป็นคนละรหัส */
    if (h.needsReview) {
      var w = el("p", { class: "note warn" });
      var lead = h.reviewKind === "single"
        ? "รายการนี้พบในเอกสารปีเดียว แต่มีชื่อที่ใกล้กันมากอยู่ในปีอื่น"
        : "ประวัติข้างบนมาจากชื่อที่ตรงกันทุกตัวอักษร แต่ยังมีชื่อที่ใกล้กันมากอยู่ในปีอื่น";
      w.appendChild(el("strong", { text: "⚠ ประวัติอาจไม่ครบทุกปี" }));
      w.appendChild(el("span", { text: " — " + lead +
        " ถ้าสองชื่อนี้คือรายการเดียวกัน แปลว่ายังมีปีที่ไม่ได้นับรวมอยู่ " +
        "ชุดข้อมูลเลือกไม่รวมให้อัตโนมัติ เพราะการรวมผิดจะทำให้ประวัติงบผิดไปด้วย" }));
      if (h.nearName) {
        w.appendChild(el("br"));
        w.appendChild(el("span", { class: "near", text:
          "ชื่อที่ใกล้กัน: “" + h.nearName + "”" +
          (h.nearSim ? " (เหมือนกัน " + h.nearSim + "%" : "") +
          (h.nearYears && h.nearYears.length ? " · พบในปี " + h.nearYears.join(", ") : "") +
          (h.nearSim ? ")" : "") }));
      }
      box.appendChild(w);
    }
  }

  function barRow(r, max, rank, isTop) {
    var color = bcatColor(r.bcat);
    var row = el("div", { class: "barrow" + (isTop ? " barrow--top" : "") });
    var nm = el("div", { class: "nm" });
    if (isTop && rank) nm.appendChild(el("span", { class: "rank", text: String(rank) }));
    nm.appendChild(el("span", { text: cleanName(r.name) }));
    row.appendChild(nm);
    /* ยอดเต็มหน่วยบาท ไม่ปัดเป็นล้าน เพราะหน้านี้มีไว้ให้ตรวจย้อนกลับกับเอกสาร
       ตามด้วยส่วนต่างเทียบปีก่อนของรายการเดียวกัน */
    row.appendChild(el("div", { class: "vl", html:
      (r.alloc === null || r.alloc === undefined ? "—" : n0(r.alloc) + " บาท") + deltaTag(r) }));
    var tr = el("div", { class: "tr" });
    var fl = el("div", { class: "fl" });
    fl.style.width = (r.alloc === null || r.alloc === undefined) ? "0%"
      : Math.max(0.6, (r.alloc / max) * 100) + "%";
    fl.style.background = color;
    tr.appendChild(fl);
    row.appendChild(tr);
    row.appendChild(el("div", { class: "mt", html:
      '<span style="display:inline-flex;align-items:center;gap:.35rem"><span style="width:.55rem;height:.55rem;border-radius:2px;background:' + color + ';display:inline-block"></span>' + esc(r.bcat || "—") + "</span>" +
      "<span>เบิกจ่าย " + mb(r.disb) + "</span>" +
      "<span>คงเหลือ " + mb(r.remain) + "</span>" +
      srcChip(r.page) }));
    bindTip(row, function () {
      return "<b>" + esc(r.name) + "</b><br>จัดสรร " + fullBaht(r.alloc) +
        "<br>เบิกจ่ายและผูกพัน " + fullBaht(r.disb) + "<br>คงเหลือ " + fullBaht(r.remain) +
        "<br>" + esc(r.plan) + (r.ecat ? " · " + esc(r.ecat) : "");
    });
    return row;
  }

  /** แถวที่กดเปิดประวัติ 5 ปีได้ ใส่ลง parent ทั้งตัวแถวและแผงที่กางออกมา
      วาดกราฟตอนกางครั้งแรกเท่านั้น จะได้ไม่ต้องวาด SVG ทิ้งไว้ทีละ 40 อัน */
  function appendExpandableRow(parent, r, max) {
    var row = barRow(r, max, 0, false);
    row.classList.add("barrow--openable");
    row.setAttribute("role", "button");
    row.setAttribute("tabindex", "0");
    row.setAttribute("aria-expanded", "false");
    row.setAttribute("aria-label", cleanName(r.name) + " " + n0(r.alloc) + " บาท กดเพื่อดูย้อนหลัง 5 ปี");
    row.querySelector(".mt").appendChild(el("span", { class: "hint", text: "ย้อนหลัง 5 ปี" }));

    var panel = el("div", { class: "item-hist", hidden: "" });
    var filled = false;
    function toggle() {
      var open = row.getAttribute("aria-expanded") === "true";
      row.setAttribute("aria-expanded", open ? "false" : "true");
      panel.hidden = open;
      if (!open && !filled) { fillHist(panel, r); filled = true; }
    }
    row.addEventListener("click", toggle);
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    parent.appendChild(row);
    parent.appendChild(panel);
  }

  function yearRows(yr) {
    return rows.filter(function (r) { return r.year === yr && r.alloc !== null; });
  }

  function renderPreview() {
    if (!previewBox) return;
    var all = yearRows(LAST.year).sort(function (a, b) { return b.alloc - a.alloc; });
    var top = all.slice(0, 5);
    var max = top.length ? top[0].alloc : 1;
    clear(previewBox);
    top.forEach(function (r, i) { previewBox.appendChild(barRow(r, max, i + 1, true)); });
    var sumTop = top.reduce(function (s, r) { return s + r.alloc; }, 0);
    var sumAll = all.reduce(function (s, r) { return s + r.alloc; }, 0);
    if (previewNote) previewNote.textContent = "ปีงบประมาณ " + LAST.year + " · 5 อันดับแรกได้รับงบรวม " + mb(sumTop) + " จากทั้งหมด " + mb(sumAll);
    if (previewCount) previewCount.textContent = "จากทั้งหมด " + n0(all.length) + " รายการ";
    if (openBtn) { openBtn.textContent = "ดูทั้งหมด →"; openBtn.setAttribute("aria-label", "ดูรายการทั้งหมด " + n0(all.length) + " รายการ"); }
  }

  function filtered() {
    /* ชื่อรายการมีภาษาอังกฤษปนเยอะ เทียบตรง ๆ จะทำให้ "contact center" หาไม่เจอ
       ทั้งที่ตัวอย่างใน placeholder ของช่องค้นหาเองก็เขียนไว้แบบนั้น */
    var q = search.value.trim().toLowerCase();
    var yr = yearSel.value, cat = catSel.value, sort = sortSel.value;
    var sel = rows.filter(function (r) {
      if (r.year !== yr) return false;
      if (cat && r.bcat !== cat) return false;
      if (q && r.name.toLowerCase().indexOf(q) < 0) return false;
      if (ctx && !matchCtx(r)) return false;
      /* ปกติซ่อนแถวที่ต้นฉบับพิมพ์ขีดไว้ แต่โหมดที่เจาะมาจาก Section 3 ต้องโชว์ให้ครบตาม nLeaf */
      if (r.alloc === null && !ctx) return false;
      return true;
    });
    var byName = function (a, b) { return cleanName(a.name).localeCompare(cleanName(b.name), "th"); };
    /* null ไว้ท้ายเสมอ ไม่ว่าจะเรียงขึ้นหรือลง */
    var cmpAlloc = function (a, b, asc) {
      var an = a.alloc === null || a.alloc === undefined, bn = b.alloc === null || b.alloc === undefined;
      if (an && bn) return 0;
      if (an) return 1;
      if (bn) return -1;
      return asc ? a.alloc - b.alloc : b.alloc - a.alloc;
    };
    if (sort === "alloc-asc") sel.sort(function (a, b) { return cmpAlloc(a, b, true); });
    else if (sort === "disb-desc") sel.sort(function (a, b) { return (b.disb || 0) - (a.disb || 0); });
    else if (sort === "remain-desc") sel.sort(function (a, b) { return (b.remain || 0) - (a.remain || 0); });
    else if (sort === "name-asc") sel.sort(byName);
    else sel.sort(function (a, b) { return cmpAlloc(a, b, false); });
    return sel;
  }

  function renderKpis(sel) {
    if (!kpiBox) return;
    clear(kpiBox);
    var sumA = sel.reduce(function (s, r) { return s + (r.alloc || 0); }, 0);
    var sumD = sel.reduce(function (s, r) { return s + (r.disb || 0); }, 0);
    var sumR = sel.reduce(function (s, r) { return s + (r.remain || 0); }, 0);
    var rate = sumA ? (sumD / sumA * 100) : null;
    [
      { lb: "รายการที่กรองได้", vl: n0(sel.length), sub: "รายการ · ปี " + yearSel.value },
      { lb: "รวมจัดสรร", vl: mbShort(sumA), sub: "ล้านบาท" },
      { lb: "รวมเบิกจ่ายและผูกพัน", vl: mbShort(sumD), sub: "ล้านบาท · " + (rate === null ? "—" : (Math.round(rate * 100) / 100 + "% ของที่กรองได้")) },
      { lb: "คงเหลือ", vl: mbShort(sumR), sub: "ล้านบาท" }
    ].forEach(function (s) {
      kpiBox.appendChild(el("div", { class: "stat" }, [
        el("div", { class: "lb", text: s.lb }),
        el("div", { class: "vl", text: s.vl }),
        el("div", { class: "sub", text: s.sub })
      ]));
    });
    if (modalSub) modalSub.textContent = "ปี " + yearSel.value + " · " + n0(sel.length) + " รายการ · รวมจัดสรร " + mb(sumA);

    /* สัดส่วนตามหมวด */
    if (groupBox) {
      clear(groupBox);
      var byCat = {};
      sel.forEach(function (r) {
        var k = r.bcat || "—";
        if (!byCat[k]) byCat[k] = { sum: 0, n: 0 };
        byCat[k].sum += r.alloc || 0;
        byCat[k].n += 1;
      });
      var groups = Object.keys(byCat).map(function (k) { return { name: k, sum: byCat[k].sum, n: byCat[k].n }; })
        .sort(function (a, b) { return b.sum - a.sum; });
      if (!groups.length) {
        groupBox.appendChild(el("div", { class: "empty", text: "ไม่มีข้อมูลตามเงื่อนไข" }));
        return;
      }
      /* แท่งเดียวแบ่งสีตามสัดส่วนยอดจัดสรรที่กรองได้ */
      var stack = el("div", { class: "item-catstack", role: "img",
        "aria-label": groups.map(function (g) {
          return g.name + " " + (Math.round(g.sum / (sumA || 1) * 1000) / 10) + "%";
        }).join(" · ") });
      groups.forEach(function (g) {
        var pctShare = sumA ? (g.sum / sumA * 100) : 0;
        var seg = el("div", { class: "seg", title: g.name + " " + mb(g.sum) + " (" + (Math.round(pctShare * 10) / 10) + "%)" });
        seg.style.width = pctShare + "%";
        seg.style.background = bcatColor(g.name);
        bindTip(seg, function () {
          return "<b>" + esc(g.name) + "</b><br>จัดสรร " + fullBaht(g.sum) +
            "<br>" + (Math.round(pctShare * 10) / 10) + "% ของยอดที่กรองได้" +
            "<br>" + n0(g.n) + " รายการ";
        });
        stack.appendChild(seg);
      });
      groupBox.appendChild(stack);

      var legList = el("div", { class: "cat-leglist" });
      groups.forEach(function (g) {
        var color = bcatColor(g.name);
        var pctShare = sumA ? (Math.round(g.sum / sumA * 1000) / 10) : 0;
        var nm = el("span", { class: "nm" });
        var dot = el("span", { class: "dot" });
        dot.style.background = color;
        nm.appendChild(dot);
        nm.appendChild(el("span", { text: g.name }));
        legList.appendChild(el("div", { class: "cat-leg" }, [
          nm,
          el("span", { class: "vl", text: mb(g.sum) }),
          el("span", { class: "pc", text: n0(g.n) + " รายการ · " + pctShare + "%" })
        ]));
      });
      groupBox.appendChild(legList);
    }
  }

  /* แสดงทุกรายการที่กรองได้ในครั้งเดียว ไม่แบ่งหน้า */
  function renderList() {
    var sel = filtered();
    renderCtx();
    renderKpis(sel);
    var max = sel.length ? Math.max.apply(null, sel.map(function (r) { return r.alloc || 0; }).concat([1])) : 1;

    clear(list);
    if (!sel.length) {
      list.appendChild(el("div", { class: "empty", text: "ไม่พบรายการที่ตรงกับเงื่อนไข" }));
      countEl.textContent = "";
      return;
    }
    sel.forEach(function (r) {
      appendExpandableRow(list, r, max);
    });

    countEl.textContent = "แสดงทั้งหมด " + n0(sel.length) +
      " รายการ · รวมยอดจัดสรรที่กรองได้ " + mb(sel.reduce(function (s, r) { return s + (r.alloc || 0); }, 0));
  }

  function refilter() { renderList(); }
  search.addEventListener("input", refilter);
  yearSel.addEventListener("change", refilter);
  catSel.addEventListener("change", refilter);
  sortSel.addEventListener("change", refilter);

  /* ---------- เปิด/ปิด Modal ---------- */
  var lastFocus = null;
  var tipHost = null;
  function openModal() {
    if (!modal || typeof modal.showModal !== "function") return;
    lastFocus = document.activeElement;
    refilter();
    /* tooltip อยู่นอก dialog จะถูก backdrop ของ top-layer บัง ต้องย้ายเข้าไปข้างใน */
    tipHost = tipEl.parentNode;
    try { modal.appendChild(tipEl); } catch (e) {}
    document.body.style.overflow = "hidden";
    if (!modal.open) modal.showModal();
    var box = modal.querySelector(".item-modal-scroll");
    if (box) box.scrollTop = 0;
    (search || closeBtn).focus({ preventScroll: true });
  }
  function closeModal() {
    if (modal && modal.open) modal.close();
  }
  function restoreModal() {
    document.body.style.overflow = "";
    hideTip();
    if (tipHost && tipEl.parentNode !== tipHost) {
      try { tipHost.appendChild(tipEl); } catch (e) {}
      tipHost = null;
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  if (openBtn) openBtn.addEventListener("click", function () { ctx = null; openModal(); });
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    modal.addEventListener("close", restoreModal);
  }

  /* เปิด Modal จาก Section 3 พร้อมตัวกรองตาม path ในผังโครงสร้างงบ */
  window.ssoOpenItems = function (o) {
    if (!o) return;
    if (o.year) yearSel.value = o.year;
    search.value = "";
    catSel.value = (o.f && o.f.bcat) || "";
    ctx = { f: o.f || {}, label: o.label || "" };
    openModal();
  };

  onRedraw(function () { renderPreview(); renderList(); });
}

/* ================================================================ §5 งบประจำ */
function seriesSection() {
  var S = D.series;
  var seg = document.getElementById("seriesSeg");
  var listBox = document.getElementById("seriesList");
  var lede = document.getElementById("seriesLede");
  var previewBox = document.getElementById("seriesPreview");
  var previewNote = document.getElementById("seriesPreviewNote");
  var previewCount = document.getElementById("seriesPreviewCount");
  var openBtn = document.getElementById("seriesOpenAll");
  var modal = document.getElementById("seriesModal");
  var closeBtn = document.getElementById("seriesClose");
  var modalSub = document.getElementById("seriesModalSub");
  var modalCount = document.getElementById("seriesModalCount");

  var nAll = S.byNYears[String(S.years.length)] || 0;
  var nOnce = S.byNYears["1"] || 0;
  lede.innerHTML = "จากรายการทั้งหมดที่จับคู่ข้ามปีได้ มี <strong>" + n0(nAll) +
    " รายการที่พบครบทั้ง " + S.years.length + " ปี</strong> และ <strong>" + n0(nOnce) +
    " รายการที่พบเพียงปีเดียว</strong> กลุ่มแรกช่วยให้เห็นค่าใช้จ่ายประจำที่ต้องใช้ต่อเนื่อง ส่วนกลุ่มหลังช่วยให้เห็นโครงการที่ทำให้ยอดรวมแต่ละปีต่างกัน";

  var mode = "all";
  var modes = [
    { k: "all", label: "พบครบ " + S.years.length + " ปี" },
    { k: "once", label: "พบปีเดียว" },
    { k: "any", label: "ทั้งหมด" }
  ];
  function modeLabel() {
    for (var i = 0; i < modes.length; i++) if (modes[i].k === mode) return modes[i].label;
    return "";
  }
  /* โหมดทั้งหมดรวมรายการที่พบ 2–4 ปี ซึ่งสองโหมดแรกไม่แสดง ไว้ให้ Modal แสดงครบ */
  function filtered() {
    return S.list.filter(function (s) {
      return mode === "all" ? s.nYears === S.years.length : mode === "once" ? s.nYears === 1 : true;
    });
  }
  modes.forEach(function (m) {
    var b = el("button", { type: "button", text: m.label, "aria-pressed": m.k === mode ? "true" : "false" });
    b.addEventListener("click", function () {
      mode = m.k;
      [].forEach.call(seg.children, function (c, i) { c.setAttribute("aria-pressed", modes[i].k === mode ? "true" : "false"); });
      render();
    });
    seg.appendChild(b);
  });

  function sparkline(vals, color) {
    var W = 108, H = 30, pad = 4;
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" });
    var nums = vals.filter(function (v) { return v !== null && v !== undefined; });
    if (nums.length < 2) return s;
    var mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
    var span = mx - mn || mx || 1;
    var pts = [];
    vals.forEach(function (v, i) {
      if (v === null || v === undefined) return;
      var x = pad + (W - pad * 2) * (i / (vals.length - 1));
      var y = H - pad - (H - pad * 2) * ((v - mn) / span);
      pts.push([x, y]);
    });
    s.appendChild(svgEl("polyline", {
      points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "),
      fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round"
    }));
    var last = pts[pts.length - 1];
    s.appendChild(svgEl("circle", { cx: last[0], cy: last[1], r: 4, fill: color, stroke: cssv("--surface"), "stroke-width": 2 }));
    return s;
  }

  /* ---------- กราฟแนวโน้ม 5 ปี + สรุปขึ้น/ลงในรายละเอียด ---------- */
  function shortYear(y) { return String(y).slice(-2); }

  function trendChart(item, color) {
    var vals = item.alloc;
    var idx = [];
    vals.forEach(function (v, i) { if (v !== null && v !== undefined) idx.push(i); });
    var W = 560, H = 200, L = 54, R = 12, T = 24, B = 26;
    var s = svgEl("svg", { viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "แนวโน้มยอดจัดสรร " + item.name });
    if (idx.length < 2) return s;
    var nums = idx.map(function (i) { return vals[i]; });
    var mn = Math.min.apply(null, nums), mx = Math.max.apply(null, nums);
    var span = (mx - mn) || Math.abs(mx) || 1;
    var lo = mn - span * 0.15, hi = mx + span * 0.22;
    var X = function (i) { return L + (W - L - R) * (i / (vals.length - 1)); };
    var Y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (hi - lo)); };
    var grid = cssv("--grid"), ink2 = cssv("--ink-2"), ink3 = cssv("--ink-3"), surf = cssv("--surface");
    [mn, (mn + mx) / 2, mx].forEach(function (g) {
      s.appendChild(svgEl("line", { x1: L, y1: Y(g), x2: W - R, y2: Y(g), stroke: grid, "stroke-width": 1 }));
      var t = svgEl("text", { x: L - 6, y: Y(g) + 4, fill: ink3, "font-size": 11, "text-anchor": "end" });
      t.textContent = mbShort(g);
      s.appendChild(t);
    });
    var unit = svgEl("text", { x: L, y: 13, fill: ink3, "font-size": 11 });
    unit.textContent = "ล้านบาท";
    s.appendChild(unit);
    /* เส้นขาดตอนที่ค่าเป็น null */
    var segs = [], cur = [];
    vals.forEach(function (v, i) {
      if (v === null || v === undefined) { if (cur.length) segs.push(cur); cur = []; }
      else cur.push([X(i), Y(v)]);
    });
    if (cur.length) segs.push(cur);
    segs.forEach(function (pts) {
      if (pts.length < 2) return;
      s.appendChild(svgEl("polyline", {
        points: pts.map(function (p) { return Math.round(p[0] * 10) / 10 + "," + Math.round(p[1] * 10) / 10; }).join(" "),
        fill: "none", stroke: color, "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round"
      }));
    });
    idx.forEach(function (i, k) {
      var cx = X(i), cy = Y(vals[i]), last = k === idx.length - 1;
      var c = svgEl("circle", { cx: cx, cy: cy, r: last ? 5.5 : 4, fill: color, stroke: surf, "stroke-width": 2 });
      bindTip(c, function () {
        return "<b>ปี " + S.years[i] + "</b><br>จัดสรร " + fullBaht(vals[i]) +
          "<br>เบิกจ่าย " + fullBaht(item.disb[i]);
      });
      s.appendChild(c);
      /* ป้ายค่าจุดแรก/จุดสุดท้ายชิดขอบกราฟ ถ้าวางกึ่งกลางจะล้ำไปทับป้ายแกน Y หรือหลุดขอบขวา
         จึงชิดซ้าย/ชิดขวาตามลำดับ จุดกลางคงกึ่งกลางไว้ */
      var first = k === 0;
      var vx = first ? cx + 9 : (last ? cx - 9 : cx);
      var v = svgEl("text", { x: vx, y: cy - 10, fill: ink2, "font-size": 11,
        "font-weight": last ? 700 : 400, "text-anchor": first ? "start" : (last ? "end" : "middle") });
      v.textContent = mbShort(vals[i]);
      s.appendChild(v);
      var x = svgEl("text", { x: cx, y: H - 8, fill: ink3, "font-size": 11, "text-anchor": "middle" });
      x.textContent = S.years[i];
      s.appendChild(x);
    });
    return s;
  }

  function fmtPct(p) {
    var r = Math.round(Math.abs(p) * 10) / 10;
    return (p < 0 ? "−" : "+") + r + "%";
  }

  function buildTrendDetail(box, item, color) {
    var vals = item.alloc;
    var idx = [];
    vals.forEach(function (v, i) { if (v !== null && v !== undefined) idx.push(i); });
    if (idx.length >= 2) {
      var first = vals[idx[0]], last = vals[idx[idx.length - 1]];
      var diff = last - first;
      var p = first ? diff / Math.abs(first) * 100 : null;
      var cls = p === null ? "" : (p > 1 ? "up" : (p < -1 ? "down" : ""));
      var dir = p === null ? "" : (p > 1 ? "เพิ่มขึ้น" : (p < -1 ? "ลดลง" : "ทรงตัว"));
      box.appendChild(el("div", { class: "trend-head", html:
        "ปี " + S.years[idx[0]] + " → " + S.years[idx[idx.length - 1]] +
        " จาก <strong>" + mb(first) + "</strong> เป็น <strong>" + mb(last) + "</strong>" +
        (p === null ? "" : " <strong class='" + cls + "'>" + dir + " " + mb(Math.abs(diff)) +
          " (" + fmtPct(p) + ")</strong>") }));

      var cw = el("div", { class: "trend-chart" });
      cw.appendChild(trendChart(item, color));
      box.appendChild(cw);

      var yoy = el("div", { class: "trend-yoy" });
      for (var k = 0; k + 1 < vals.length; k++) {
        var a = vals[k], b = vals[k + 1], ch = null;
        if (a !== null && a !== undefined && b !== null && b !== undefined && a) ch = (b - a) / Math.abs(a) * 100;
        yoy.appendChild(el("span", {
          class: "yoy" + (ch === null ? "" : (ch > 0.05 ? " up" : (ch < -0.05 ? " down" : ""))),
          text: shortYear(S.years[k]) + "→" + shortYear(S.years[k + 1]) + (ch === null ? " —" : " " + fmtPct(ch))
        }));
      }
      box.appendChild(yoy);

      var nums = idx.map(function (i) { return vals[i]; });
      var mx = Math.max.apply(null, nums), mn = Math.min.apply(null, nums);
      box.appendChild(el("p", { class: "fig-note", text:
        "สูงสุดปี " + S.years[vals.indexOf(mx)] + " (" + mb(mx) + ") · ต่ำสุดปี " +
        S.years[vals.indexOf(mn)] + " (" + mb(mn) + ")" }));
    } else if (idx.length === 1) {
      box.appendChild(el("div", { class: "trend-head", html:
        "พบในปี " + S.years[idx[0]] + " เพียงปีเดียว ยอดจัดสรร <strong>" + mb(vals[idx[0]]) +
        "</strong> — จึงยังแสดงแนวโน้มข้ามปีไม่ได้" }));
    }
    var tw = el("div", { class: "tablescroll" });
    tw.innerHTML =
      "<table><thead><tr><th>ปี</th>" +
      S.years.map(function (y) { return "<th class='n'>" + y + "</th>"; }).join("") +
      "</tr></thead><tbody><tr><td>จัดสรร</td>" +
      item.alloc.map(function (v) { return "<td class='n'>" + (v === null ? "—" : n2(v)) + "</td>"; }).join("") +
      "</tr><tr><td>เบิกจ่าย</td>" +
      item.disb.map(function (v) { return "<td class='n'>" + (v === null ? "—" : n2(v)) + "</td>"; }).join("") +
      "</tr></tbody></table>";
    box.appendChild(tw);
    if (item.needsReview) {
      box.appendChild(el("p", { class: "fig-note",
        text: "⚠ รายการนี้มีชื่อคล้ายกับรายการในปีอื่น ระบบยังไม่ยืนยันว่าเป็นรายการเดียวกัน" }));
    }
  }

  function cleanSeriesName(s) { return String(s).replace(/^\d+\.\s*/, "").replace(/^-\s*/, ""); }

  /* แถวรายการกางดูกราฟแนวโน้มได้เหมือนเดิม สร้างกราฟตอนกดครั้งแรกเพื่อให้ Modal ที่มีหลายร้อยแถวเปิดได้ไว */
  function buildRow(item) {
    var color = series(0);
    var detail = el("div", { class: "spark-detail", hidden: "" });
    var row = el("button", { class: "sparkrow", type: "button", "aria-expanded": "false" }, [
      el("span", { class: "nm", text: cleanSeriesName(item.name) }),
      el("span", { class: "sp" }),
      el("span", { class: "tot", text: mb(item.total) })
    ]);
    row.querySelector(".sp").appendChild(sparkline(item.alloc, color));
    row.addEventListener("click", function () {
      var open = row.getAttribute("aria-expanded") === "true";
      if (!open && !detail.dataset.built) { buildTrendDetail(detail, item, color); detail.dataset.built = "1"; }
      row.setAttribute("aria-expanded", open ? "false" : "true");
      detail.hidden = open;
    });
    bindTip(row, function () {
      return "<b>" + esc(item.name) + "</b><br>" + S.years.map(function (y, i) {
        return y + ": " + (item.alloc[i] === null ? "—" : mb(item.alloc[i]));
      }).join("<br>");
    });
    return [row, detail];
  }

  /* ---------- หน้าแรก Top 5 + Modal รวมทุกรายการ ---------- */
  function renderPreview() {
    if (!previewBox) return;
    var all = filtered();
    clear(previewBox);
    all.slice(0, 5).forEach(function (item) {
      var parts = buildRow(item);
      previewBox.appendChild(parts[0]);
      previewBox.appendChild(parts[1]);
    });
    if (previewNote) previewNote.textContent = "กลุ่ม" + modeLabel() + " · 5 อันดับแรกตามยอดจัดสรรรวมทุกปี";
    if (previewCount) previewCount.textContent = "จากทั้งหมด " + n0(all.length) + " รายการ";
    if (openBtn) { openBtn.textContent = "ดูทั้งหมด →"; openBtn.setAttribute("aria-label", "ดูรายการทั้งหมด " + n0(all.length) + " รายการ"); }
  }

  /* แสดงทุกรายการที่กรองได้ในครั้งเดียว ไม่แบ่งหน้า แบบเดียวกับ Modal ของ Section 4 */
  function renderModalList() {
    clear(listBox);
    var all = filtered();
    if (!all.length) {
      listBox.appendChild(el("div", { class: "empty", text: "ไม่มีรายการในกลุ่มนี้" }));
    } else {
      all.forEach(function (item) {
        var parts = buildRow(item);
        listBox.appendChild(parts[0]);
        listBox.appendChild(parts[1]);
      });
    }
    if (modalSub) modalSub.textContent = "กลุ่ม" + modeLabel() + " · " + n0(all.length) + " รายการ";
    if (modalCount) modalCount.textContent = "แสดงทั้งหมด " + n0(all.length) + " รายการ เรียงตามยอดจัดสรรรวมทุกปี";
  }

  function render() { renderPreview(); renderModalList(); }

  /* ---------- เปิด/ปิด Modal แบบเดียวกับ Section 4 ---------- */
  var lastFocus = null;
  var tipHost = null;
  function openModal() {
    if (!modal || typeof modal.showModal !== "function") return;
    lastFocus = document.activeElement;
    renderModalList();
    /* tooltip อยู่นอก dialog จะถูก backdrop ของ top-layer บัง ต้องย้ายเข้าไปข้างใน */
    tipHost = tipEl.parentNode;
    try { modal.appendChild(tipEl); } catch (e) {}
    document.body.style.overflow = "hidden";
    if (!modal.open) modal.showModal();
    var box = modal.querySelector(".item-modal-scroll");
    if (box) box.scrollTop = 0;
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }
  function closeModal() {
    if (modal && modal.open) modal.close();
  }
  function restoreModal() {
    document.body.style.overflow = "";
    hideTip();
    if (tipHost && tipEl.parentNode !== tipHost) {
      try { tipHost.appendChild(tipEl); } catch (e) {}
      tipHost = null;
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  }
  if (openBtn) openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    modal.addEventListener("close", restoreModal);
  }

  onRedraw(render);
}

/* ================================================================ §6 สินทรัพย์ */
function assets() {
  var A = D.assets, T = A.totals;
  var statBox = document.getElementById("assetStats");
  var catBox = document.getElementById("assetCats");
  var tbl = document.getElementById("assetTable");

  document.getElementById("nearZeroN").textContent = n0(A.review.nearZero);

  function renderStats() {
    clear(statBox);
    [
      { lb: "ราคาที่ซื้อมาทั้งหมด", vl: mbShort(T.acq), sub: "ล้านบาท · " + n0(T.lines) + " รายการ" },
      { lb: "ค่าเสื่อมราคาสะสม", vl: "−" + mbShort(Math.abs(T.dep)), sub: "ล้านบาท · ตัดไปแล้ว " + pct(T.depPct, 1) + " ของราคาทุน" },
      { lb: "มูลค่าที่เหลือตามบัญชี", vl: mbShort(T.book), sub: "ล้านบาท · ณ " + A.asOfThai },
      { lb: "กระจายอยู่ใน", vl: n0(A.nAreas), sub: "พื้นที่ทั่วประเทศ" }
    ].forEach(function (s) {
      statBox.appendChild(el("div", { class: "stat" }, [
        el("div", { class: "lb", text: s.lb }),
        el("div", { class: "vl", text: s.vl }),
        el("div", { class: "sub", text: s.sub })
      ]));
    });
  }

  function renderCats() {
    clear(catBox);
    var max = A.categories[0].acq;
    A.categories.forEach(function (c) {
      var row = el("div", { class: "deprow" });
      row.appendChild(el("div", { class: "nm", text: c.name }));
      row.appendChild(el("div", { class: "vl", text: mbShort(c.acq) + " → " + mbShort(c.book) + " ล้านบาท" }));
      var tr = el("div", { class: "tr" });
      tr.style.width = Math.max(2, (c.acq / max) * 100) + "%";
      var bookPct = c.acq ? (c.book / c.acq) * 100 : 0;
      var bk = el("div", { class: "bk" });
      bk.style.width = bookPct + "%";
      bk.style.background = series(0);
      var rest = el("div", { class: "acq" });
      rest.style.flex = "1";
      tr.appendChild(bk); tr.appendChild(rest);
      row.appendChild(tr);
      bindTip(row, function () {
        return "<b>" + esc(c.name) + "</b><br>ราคาที่ได้มา " + fullBaht(c.acq) +
          "<br>ค่าเสื่อมสะสม " + fullBaht(c.dep) +
          "<br>มูลค่าตามบัญชี " + fullBaht(c.book) +
          "<br>เสื่อมไปแล้ว " + pct(c.depPct, 1) +
          "<br>" + n0(c.lines) + " รายการ · " + n0(c.codes) + " รหัสสินทรัพย์";
      });
      catBox.appendChild(row);
    });
    catBox.appendChild(el("p", { class: "fig-note", html:
      "แถบสีน้ำเงินคือมูลค่าที่ยังเหลือตามบัญชี ส่วนสีเทาคือมูลค่าที่ตัดเป็นค่าเสื่อมไปแล้ว ความยาวรวมคือราคาที่ซื้อมา " + srcChip(1, "2. สินทรัพย์คงเหลือ2567_1.pdf") }));
  }

  tbl.innerHTML =
    "<thead><tr><th>หมวดสินทรัพย์</th><th class='n'>รายการ</th><th class='n'>ราคาที่ได้มา</th><th class='n'>ค่าเสื่อมสะสม</th><th class='n'>มูลค่าตามบัญชี</th><th class='n'>เสื่อมไปแล้ว</th><th class='n'>หน้า</th></tr></thead><tbody>" +
    A.categories.map(function (c) {
      return "<tr><td>" + esc(c.name) + "</td><td class='n'>" + n0(c.lines) + "</td><td class='n'>" + n2(c.acq) +
        "</td><td class='n'>" + n2(c.dep) + "</td><td class='n'>" + n2(c.book) + "</td><td class='n'>" + pct(c.depPct, 1) +
        "</td><td class='n'>" + c.page + "</td></tr>";
    }).join("") +
    "<tr><td><strong>รวม</strong></td><td class='n'><strong>" + n0(T.lines) + "</strong></td><td class='n'><strong>" + n2(T.acq) +
    "</strong></td><td class='n'><strong>" + n2(T.dep) + "</strong></td><td class='n'><strong>" + n2(T.book) +
    "</strong></td><td class='n'><strong>" + pct(T.depPct, 1) + "</strong></td><td class='n'>—</td></tr></tbody>";

  onRedraw(function () { renderStats(); renderCats(); });
}

/* ================================================================ §7 quiz */
function quiz() {
  var qc = D.qc;
  var oc = qc.overcountByYear[LAST.year];
  var diffs = Object.keys(qc.overcountByYear).map(function (y) { return qc.overcountByYear[y].diff; });
  var dmin = Math.min.apply(null, diffs), dmax = Math.max.apply(null, diffs);
  var lateOthers = D.years.filter(function (y) { return y.year !== LAST.year; }).map(function (y) { return y.monthsAfterYearEnd; });

  var Q = [
    {
      claim: "งบ " + mb(LAST.alloc) + " คือเงินประกันสังคมทั้งหมดที่เก็บจากผู้ประกันตน",
      answer: false,
      why: "นี่คือ<strong>งบบริหารงาน</strong>ของสำนักงาน ใช้จ่ายเงินเดือน ค่าไฟ ค่าระบบไอที ไม่ใช่เงินกองทุนและไม่ใช่เงินสิทธิประโยชน์ที่จ่ายให้ผู้ประกันตน เทียบกับเงินลงทุนของกองทุนแล้วคิดเป็นราว " +
        (Math.round(LAST.alloc / EXT.fund * 10000) / 100) + "% เท่านั้น " + extChip("เงินลงทุนกองทุน ณ " + EXT.fundAsOf, EXT.fundUrl)
    },
    {
      claim: "ในรายงานงบ ช่อง “คงเหลือ” เท่ากับ จัดสรร ลบ เบิกจ่าย เสมอ",
      answer: false,
      why: "ตรวจแล้วพบ <strong>" + n0(qc.mismatchTotal) + " แถว</strong> จากทั้งหมด " + n0(qc.rawRows) +
        " แถว ที่ยอดจัดสรรลบยอดเบิกจ่ายแล้วไม่ตรงกับยอดคงเหลือ สาเหตุน่าจะมาจากการโอนหรือปรับปรุงงบระหว่างปี ชุดข้อมูลนี้จึงยึดตัวเลขตามที่พิมพ์ในเอกสาร ไม่คำนวณใหม่"
    },
    {
      claim: "ถ้าเอาทุกแถวในรายงานมาบวกกัน จะได้ยอดรวมทั้งปีพอดี",
      answer: false,
      why: "จะได้เกินจริง เพราะรายงานมีทั้งแถวสรุปและแถวรายการปนกัน บวกหมดคือนับซ้ำ เฉพาะปี " + LAST.year +
        " เกินไป <strong>" + mb(oc.diff) + "</strong> และทั้งห้าปีเกินระหว่าง " + mb(dmin) + " ถึง " + mb(dmax) +
        " ต้องนับเฉพาะรายการย่อยสุด ซึ่งมี " + n0(qc.leafItems) + " รายการ"
    },
    {
      claim: "ปี " + LAST.year + " เบิกจ่ายได้แค่ " + pct(LAST.rate, 2) + " แปลว่าปีนั้นทำงานช้าลง",
      answer: false,
      why: "เอกสารปี " + LAST.year + " ตัดยอดเมื่อ " + LAST.cutThai + " คือหลังสิ้นปีงบเพียง <strong>" +
        LAST.monthsAfterYearEnd + " เดือน</strong> ส่วนปีอื่นตัดยอดหลังไป " +
        Math.min.apply(null, lateOthers) + "–" + Math.max.apply(null, lateOthers) +
        " เดือน เงินที่ทยอยเบิกหลังจากนั้นยังไม่ถูกนับ ตัวเลขสองปีจึงเทียบกันตรง ๆ ไม่ได้"
    },
    {
      claim: "ในทะเบียนสินทรัพย์ มีของที่มูลค่าเหลือไม่ถึง 1 บาท อยู่หลายหมื่นรายการ",
      answer: true,
      why: "จริง มี <strong>" + n0(D.assets.review.nearZero) + " รายการ</strong> จากทั้งหมด " + n0(D.assets.totals.lines) +
        " รายการ แต่<strong>ไม่ได้แปลว่าของหายหรือพัง</strong> — แปลว่าตัดค่าเสื่อมครบตามอายุบัญชีแล้ว ของอาจยังตั้งใช้งานอยู่ตามปกติ ชุดข้อมูลต้นทางระบุไว้ชัดว่ายังไม่ได้ยืนยันสภาพการใช้งานจริง"
    }
  ];

  var host = document.getElementById("quiz");
  var scoreEl = document.getElementById("quizScore");
  var done = 0, right = 0;

  Q.forEach(function (q, i) {
    var ans = el("div", { class: "qans", hidden: "" });
    ans.innerHTML = "<span class='qverdict'>" + (q.answer ? "จริง" : "ไม่จริง") + "</span> — " + q.why;

    var btns = el("div", { class: "qbtns" });
    var bT = el("button", { class: "qbtn", type: "button", text: "จริง" });
    var bF = el("button", { class: "qbtn", type: "button", text: "ไม่จริง" });

    function pick(v, btn) {
      if (btn.disabled) return;
      bT.disabled = true; bF.disabled = true;
      var ok = v === q.answer;
      btn.classList.add(ok ? "picked-right" : "picked-wrong");
      (q.answer ? bT : bF).classList.add("is-answer");
      ans.hidden = false;
      done++; if (ok) right++;
      scoreEl.textContent = "ตอบแล้ว " + done + " จาก " + Q.length + " ข้อ · ถูก " + right + " ข้อ";
    }
    bT.addEventListener("click", function () { pick(true, bT); });
    bF.addEventListener("click", function () { pick(false, bF); });
    btns.appendChild(bT); btns.appendChild(bF);

    host.appendChild(el("div", { class: "qcard" }, [
      el("div", { class: "qclaim", text: q.claim }),
      btns, ans
    ]));
    void i;
  });
}

/* ================================================================ §8 ที่มา */
function sources() {
  var host = document.getElementById("srcList");
  D.sources.forEach(function (s) {
    host.appendChild(el("div", { class: "srcitem" }, [
      el("div", { class: "id", text: s.id }),
      el("div", { class: "fn", text: s.file }),
      el("div", { class: "mt", text:
        s.kind + " · " + n0(s.pages) + " หน้า · สกัดได้ " + n0(s.rows) + " แถว · ยอด ณ " + s.asOfThai })
    ]));
  });

  document.getElementById("disclaim").innerHTML =
    "หน้านี้เป็นงานอ่านและเรียบเรียงข้อมูลจากเอกสารสาธารณะ ไม่ใช่เอกสารทางการของสำนักงานประกันสังคม " +
    "ตัวเลขจากชุดข้อมูลยึดตามที่พิมพ์ในต้นฉบับโดยไม่แก้ไข ส่วนตัวเลขบริบทภายนอก (เงินลงทุนกองทุนและเพดานตามกฎหมาย) มาจากแหล่งอื่นและมีลิงก์กำกับไว้ทุกจุด " +
    "หากตัวเลขในเอกสารต้นฉบับมีข้อสงสัย ให้ยึดเอกสารต้นฉบับเป็นหลักและตรวจที่เลขหน้าที่ระบุไว้ · สร้างข้อมูลเมื่อ " + D.generatedAt;
}

/* ================================================================ §8 ดาวน์โหลด */
function downloads() {
  /* ---------- สร้างไฟล์ฝั่งเบราว์เซอร์ ทำงานได้ทั้งบนเซิร์ฟเวอร์ ไฟล์ local
       และในไฟล์รวมไฟล์เดียว โดยไม่ต้องก๊อป dataset 150 MB มาไว้ข้าง ๆ ---------- */

  function csvCell(v) {
    if (v === null || v === undefined) return "";        /* ค่าว่าง ไม่ใช่ศูนย์ */
    var s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function toCSV(cols, rows) {
    var out = [cols.join(",")];
    rows.forEach(function (r) {
      out.push(cols.map(function (c) { return csvCell(r[c]); }).join(","));
    });
    /* BOM เพื่อให้ Excel เปิดภาษาไทยไม่เพี้ยน */
    return "﻿" + out.join("\r\n") + "\r\n";
  }
  function save(name, text, mime) {
    var blob = new Blob([text], { type: mime + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  var Y = D.series.years;

  /* ---------- แปลงข้อมูลบนหน้าเป็นตารางแบน ---------- */
  function annualRows() {
    return D.years.map(function (y) {
      return {
        "ปีงบประมาณ": y.year, "ปีคริสต์ศักราช": y.ce,
        "วันที่ตัดยอด": y.cutIso, "วันที่ตัดยอด_ไทย": y.cutThai,
        "สิ้นปีงบประมาณ": y.fyEndThai, "เดือนหลังสิ้นปีงบ": y.monthsAfterYearEnd,
        "จัดสรร": y.alloc, "รวมเบิกจ่ายและผูกพัน": y.disb, "คงเหลือ": y.remain,
        "อัตราเบิกจ่าย_ร้อยละ": y.rate, "จำนวนแผนงาน": y.nPlans,
        "รหัสเอกสาร": y.doc, "ไฟล์ต้นทาง": y.srcFile
      };
    });
  }

  function structureRows() {
    var out = [];
    Object.keys(D.tree).sort().forEach(function (year) {
      (function walk(nodes) {
        nodes.forEach(function (n) {
          out.push({
            "ปีงบประมาณ": year, "ระดับสรุป": n.level, "ระดับชั้น": n.path.length,
            "เส้นทาง": n.path.join(" > "), "ชื่อกลุ่ม": n.name,
            "จัดสรร": n.alloc, "รวมเบิกจ่ายและผูกพัน": n.disb, "คงเหลือ": n.remain,
            "จำนวนรายการย่อยสุดภายใต้กลุ่ม": n.nLeaf, "หน้าอ้างอิง": n.page
          });
          if (n.children.length) walk(n.children);
        });
      })(D.tree[year]);
    });
    return out;
  }

  function itemRows() {
    var IX = {}; D.items.cols.forEach(function (c, i) { IX[c] = i; });
    var V = D.items.vocab;
    var pick = function (i) { return i < 0 ? "" : V[i]; };
    return D.items.rows.map(function (r) {
      return {
        "ปีงบประมาณ": r[IX.year], "ชื่อรายการ": r[IX.name],
        "แผนงาน": pick(r[IX.plan]), "กลุ่มรายจ่าย": pick(r[IX.group]),
        "หมวดงบรายจ่าย": pick(r[IX.bcat]), "หมวดค่าใช้จ่าย": pick(r[IX.ecat]),
        "จัดสรร": r[IX.alloc], "รวมเบิกจ่ายและผูกพัน": r[IX.disb],
        "คงเหลือ": r[IX.remain], "หน้าอ้างอิง": r[IX.page]
      };
    });
  }

  function seriesRows() {
    return D.series.list.map(function (s) {
      var o = { "ชื่อมาตรฐาน": s.name, "จำนวนปีที่พบ": s.nYears };
      Y.forEach(function (y, i) { o["จัดสรร_" + y] = s.alloc[i]; });
      Y.forEach(function (y, i) { o["เบิกจ่าย_" + y] = s.disb[i]; });
      o["รวมจัดสรรทุกปี"] = s.total;
      o["ต้องตรวจสอบการจับคู่ด้วยคน"] = s.needsReview ? "ใช่" : "ไม่ใช่";
      return o;
    });
  }

  function assetCatRows() {
    return D.assets.categories.map(function (c) {
      return {
        "รหัสหมวดสินทรัพย์": c.code, "ชื่อหมวดมาตรฐาน": c.name, "ชื่อหมวดตามเอกสาร": c.shortName,
        "จำนวนรายการย่อย": c.lines, "จำนวนรหัสสินทรัพย์": c.codes,
        "มูลค่าการได้มา": c.acq, "ค่าเสื่อมราคาสะสม": c.dep, "มูลค่าตามบัญชี": c.book,
        "สัดส่วนค่าเสื่อมสะสม_ร้อยละ": c.depPct, "หน้าที่พบครั้งแรก": c.page,
        "วันที่ยอดข้อมูล": D.assets.asOfThai
      };
    });
  }

  function capYearRows() {
    return D.assets.byCapYear.map(function (c) {
      return { "ปีที่โอนเป็นทุน_พศ": c.year, "จำนวนรายการย่อย": c.lines,
               "มูลค่าการได้มา": c.acq, "มูลค่าตามบัญชี": c.book };
    });
  }

  function areaRows() {
    return D.assets.areas.map(function (a) {
      return { "รหัสพื้นที่": a.code, "ชื่อพื้นที่": a.name,
               "จำนวนรายการย่อย": a.lines, "มูลค่าการได้มา": a.acq, "มูลค่าตามบัญชี": a.book };
    });
  }

  function sourceRows() {
    return D.sources.map(function (s) {
      return { "รหัสเอกสาร": s.id, "ชื่อไฟล์": s.file, "ประเภทเอกสาร": s.kind,
               "กลุ่มข้อมูล": s.group, "ปีงบประมาณ": s.year, "วันที่ยอดข้อมูล_ไทย": s.asOfThai,
               "จำนวนหน้า": s.pages, "จำนวนแถวที่สกัดได้": s.rows,
               "หัวเรื่องในเอกสาร": s.title, "วิธีการสกัดข้อมูล": s.method };
    });
  }

  var SETS = [
    { file: "sso_งบรายปี_2563-2567", nm: "งบรายปี 2563–2567",
      ds: "ยอดจัดสรร เบิกจ่าย คงเหลือ อัตราเบิกจ่าย พร้อมวันที่ตัดยอดและระยะห่างจากสิ้นปีงบ",
      make: annualRows },
    { file: "sso_งบตามโครงสร้าง", nm: "งบตามโครงสร้าง",
      ds: "งบทุกระดับ ตั้งแต่แผนงานถึงหมวดค่าใช้จ่าย พร้อมบอกว่าแต่ละรายการอยู่ใต้กลุ่มใด เพื่อแยกรายการที่ชื่อซ้ำกัน",
      make: structureRows },
    { file: "sso_รายการย่อยสุด", nm: "รายการย่อยสุดทุกปี",
      ds: "ไฟล์ที่ควรใช้เวลารวมยอด ไม่มีแถวสรุปปนมาจึงไม่นับซ้ำ",
      make: itemRows },
    { file: "sso_รายการเทียบข้ามปี", nm: "รายการเทียบข้ามปี",
      ds: "จัดสรรและเบิกจ่ายของรายการเดียวกันเรียงทั้ง 5 ปี ใช้ดูว่าอะไรเป็นรายจ่ายประจำ",
      make: seriesRows },
    { file: "sso_สินทรัพย์ตามหมวด_2567", nm: "สินทรัพย์ตามหมวด",
      ds: "ราคาที่ได้มา ค่าเสื่อมสะสม และมูลค่าคงเหลือของครุภัณฑ์แต่ละหมวด ณ 30 ก.ย. 2567",
      make: assetCatRows },
    { file: "sso_สินทรัพย์ตามปีที่โอนเป็นทุน", nm: "สินทรัพย์ตามปีที่โอนเป็นทุน",
      ds: "สินทรัพย์ในทะเบียนนี้เริ่มบันทึกเข้าบัญชีในปีใดบ้าง",
      make: capYearRows },
    { file: "sso_สินทรัพย์ตามพื้นที่", nm: "สินทรัพย์ตามพื้นที่",
      ds: "12 พื้นที่ที่ถือสินทรัพย์มูลค่าสูงสุด",
      make: areaRows },
    { file: "sso_เอกสารต้นทาง", nm: "เอกสารต้นทาง",
      ds: "รายชื่อ PDF ทั้ง 6 ไฟล์ จำนวนหน้า วันที่ยอดข้อมูล และวิธีสกัด",
      make: sourceRows }
  ];

  var grid = document.getElementById("dlGrid");
  SETS.forEach(function (set) {
    var rows = set.make();
    var cols = Object.keys(rows[0] || {});

    function flash(btn, label) {
      var old = btn.textContent;
      btn.textContent = label; btn.classList.add("done");
      setTimeout(function () { btn.textContent = old; btn.classList.remove("done"); }, 1400);
    }
    var bCsv = el("button", { class: "dl-btn", type: "button", text: "CSV" });
    var bJson = el("button", { class: "dl-btn", type: "button", text: "JSON" });
    bCsv.addEventListener("click", function () {
      save(set.file + ".csv", toCSV(cols, rows), "text/csv");
      flash(bCsv, "โหลดแล้ว");
    });
    bJson.addEventListener("click", function () {
      save(set.file + ".json", JSON.stringify(rows, null, 2), "application/json");
      flash(bJson, "โหลดแล้ว");
    });

    grid.appendChild(el("div", { class: "dl-card" }, [
      el("div", { class: "nm", text: set.nm }),
      el("div", { class: "ds", text: set.ds }),
      el("div", { class: "rc", text: n0(rows.length) + " แถว · " + cols.length + " คอลัมน์" }),
      el("div", { class: "dl-btns" }, [bCsv, bJson])
    ]));
  });

  /* ---------- ก้อนเดียวจบ ---------- */
  var allBtn = document.getElementById("dlAllBtn");
  var bundle = {
    เกี่ยวกับ: {
      ชื่อชุดข้อมูล: "งบบริหารงานสำนักงานประกันสังคม 2563-2567 และทะเบียนสินทรัพย์ 2567",
      สร้างเมื่อ: D.generatedAt,
      ที่มา: "สกัดจากเอกสาร PDF ราชการ 6 ไฟล์ ดูรายละเอียดใน เอกสารต้นทาง",
      ข้อควรระวัง: [
        "ค่า null คือช่องที่ต้นฉบับพิมพ์ขีด ไม่ใช่ศูนย์",
        "คงเหลือยึดตามที่พิมพ์ในเอกสาร ไม่ได้คำนวณใหม่ มีแถวที่ จัดสรร ลบ เบิกจ่าย ไม่เท่ากับ คงเหลือ",
        "รวมยอดให้ใช้ รายการย่อยสุด เท่านั้น ถ้าเอาแถวสรุปมาบวกด้วยจะนับซ้ำ",
        "เทียบอัตราเบิกจ่ายข้ามปีต้องดู เดือนหลังสิ้นปีงบ ประกอบเสมอ"
      ]
    },
    งบรายปี: annualRows(),
    งบตามโครงสร้าง: structureRows(),
    รายการย่อยสุด: itemRows(),
    รายการเทียบข้ามปี: seriesRows(),
    สินทรัพย์ตามหมวด: assetCatRows(),
    สินทรัพย์ตามปีที่โอนเป็นทุน: capYearRows(),
    สินทรัพย์ตามพื้นที่: areaRows(),
    ยอดรวมสินทรัพย์: D.assets.totals,
    เอกสารต้นทาง: sourceRows(),
    บันทึกการตรวจสอบ: D.qc
  };
  var bundleText = JSON.stringify(bundle, null, 2);
  document.getElementById("dlAllNote").textContent =
    "รวมทุกตารางไว้ในไฟล์เดียว ขนาดราว " + Math.round(new Blob([bundleText]).size / 1024) + " KB";
  allBtn.addEventListener("click", function () {
    save("sso_ชุดข้อมูลงบประกันสังคม_" + D.generatedAt + ".json", bundleText, "application/json");
    allBtn.textContent = "ดาวน์โหลดแล้ว";
    setTimeout(function () { allBtn.textContent = "ดาวน์โหลดทุกตารางในไฟล์ JSON เดียว"; }, 1600);
  });

  /* ---------- ไฟล์ดิบที่ใหญ่เกินกว่าจะฝังมา ---------- */
  var rawHost = document.getElementById("dlRaw");
  if (!rawHost) return;
  [
    { path: "dataset/asset_register_2567.csv", mt: "ทะเบียนสินทรัพย์รายบรรทัด 82,021 แถว · ราว 39 MB" },
    { path: "dataset/asset_review_candidates.csv", mt: "รายการที่เข้าเกณฑ์ตรวจสอบเพิ่ม 60,221 แถว · ราว 48 MB" },
    { path: "dataset/asset_group_summary_2567.csv", mt: "ยอดสินทรัพย์ตามศูนย์ต้นทุนและพื้นที่ 789 แถว" },
    { path: "dataset/data_dictionary.csv", mt: "คำอธิบายทุกคอลัมน์ของทุกไฟล์ในชุดข้อมูล" },
    { path: "dataset/json/", mt: "ชุดเดียวกันในรูปแบบ JSON แยกเป็น 268 ไฟล์" }
  ].forEach(function (f) {
    var btn = el("button", { class: "dl-copy", type: "button", text: "คัดลอกที่อยู่ไฟล์" });
    btn.addEventListener("click", function () {
      var done = function () {
        btn.textContent = "คัดลอกแล้ว"; btn.classList.add("done");
        setTimeout(function () { btn.textContent = "คัดลอกที่อยู่ไฟล์"; btn.classList.remove("done"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(f.path).then(done, function () {});
      } else {
        var ta = document.createElement("textarea");
        ta.value = f.path; document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    rawHost.appendChild(el("div", { class: "dl-rawitem" }, [
      el("div", { class: "pth", text: f.path }),
      btn,
      el("div", { class: "mt", text: f.mt })
    ]));
  });
}

/* ================================================================ theme */
function theme() {
  var btn = document.getElementById("themeBtn");
  var saved = null;
  try { saved = localStorage.getItem("sso-theme"); } catch (e) {}
  if (saved) document.documentElement.setAttribute("data-theme", saved);

  btn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var isDark = cur ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("sso-theme", next); } catch (e) {}
    redrawAll();
  });

  /* สี SVG ถูกอ่านจาก CSS variable ตอนวาดแล้วเขียนติดไว้เป็น attribute
     ถ้าระบบสลับโหมดเองตามเวลา ตัวหนังสือกับพื้นจะเปลี่ยนตาม CSS แต่กราฟจะค้างสีเดิม
     จึงต้องดักการเปลี่ยนของระบบแล้ววาดใหม่ เฉพาะตอนที่ผู้ใช้ยังไม่ได้เลือกธีมเอง */
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var onScheme = function () {
    if (!document.documentElement.getAttribute("data-theme")) redrawAll();
  };
  if (mq.addEventListener) mq.addEventListener("change", onScheme);
  else if (mq.addListener) mq.addListener(onScheme);
}


/* Reading helpers use the current page URL, including subdirectory deployments. */
function readingTools() {
  var sections = Array.from(document.querySelectorAll(".chapter[id], .foot[id]"));
  var status = document.getElementById("copyStatus"), statusTimer;
  function pageUrl(hash) { var u = new URL(location.href); u.hash = hash || ""; return u.href; }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        var field = el("textarea", { "aria-label": "ข้อความสำหรับคัดลอก" });
        field.value = text; field.style.cssText = "position:fixed;left:0;top:0;opacity:0";
        var previous = document.activeElement;
        document.body.appendChild(field); field.select();
        var ok = document.execCommand("copy"); field.remove();
        if (previous) previous.focus({ preventScroll: true });
        if (!ok) throw new Error("copy failed");
      }
      status.textContent = "คัดลอกแล้ว พร้อมนำไปแชร์";
    } catch (e) { status.textContent = "คัดลอกอัตโนมัติไม่ได้ กรุณาคัดลอกข้อความจากช่องที่เปิด"; window.prompt("คัดลอกข้อความนี้", text); }
    clearTimeout(statusTimer); statusTimer = setTimeout(function () { status.textContent = ""; }, 4000);
  }
  sections.forEach(function (section, i) {
    var heading = section.querySelector(".chapter-title"), title = heading.textContent;
    heading.appendChild(el("button", { class: "copy-anchor", type: "button", text: "#", "aria-label": "คัดลอกลิงก์บท " + (i + 1) + " " + title, title: "คัดลอกลิงก์บทนี้", onclick: function () { copy(pageUrl(section.id)); } }));
  });
  var progress = document.querySelector(".progress-tab"),
      fill = progress && progress.querySelector(".progress-fill");
  function update() {
    var total = document.documentElement.scrollHeight - innerHeight;
    var percent = total > 0 ? Math.min(100, Math.max(0, scrollY / total * 100)) : 100;
    if (progress) {
      if (fill) fill.style.width = percent + "%";
      progress.setAttribute("aria-valuenow", Math.round(percent));
    }
  }
  var queued = false;
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); } }
  window.addEventListener("scroll", schedule, { passive:true });
  window.addEventListener("resize", schedule);
  new ResizeObserver(schedule).observe(document.body);
  update();
  function prepareTables() {
    document.querySelectorAll(".tablescroll").forEach(function (scroller) {
      if (scroller.dataset.enhanced) return;
      scroller.dataset.enhanced = "true";
      var frame = el("div", { class:"table-frame" });
      scroller.before(frame); frame.appendChild(scroller);
      scroller.tabIndex = 0;
      scroller.setAttribute("role", "region");
      scroller.setAttribute("aria-label", "ตารางข้อมูล เลื่อนเพื่อดูคอลัมน์และแถวเพิ่มเติม");
      function shade() { frame.classList.toggle("has-more", scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 2); }
      scroller.addEventListener("scroll", shade, { passive:true });
      var resize = new ResizeObserver(shade); resize.observe(scroller); resize.observe(scroller.querySelector("table"));
      shade();
    });
  }
  prepareTables();
  new MutationObserver(prepareTables).observe(document.querySelector("main"), { childList:true, subtree:true });
  var printState;
  window.addEventListener("beforeprint", function () {
    if (printState) return;
    printState = { theme:document.documentElement.getAttribute("data-theme"), details:Array.from(document.querySelectorAll("details")).map(function (d) { return [d,d.open]; }) };
    printState.details.forEach(function (entry) { entry[0].open = true; });
    document.documentElement.setAttribute("data-theme", "light"); redrawAll();
    printState.details.forEach(function (entry) { entry[0].open = true; });
  });
  window.addEventListener("afterprint", function () {
    if (!printState) return;
    if (printState.theme === null) document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme",printState.theme);
    redrawAll();
    printState.details.forEach(function (entry) { entry[0].open = entry[1]; });
    printState = null;
  });
}

/* ================================================================ scroll motion */
function scrollMotion() {
  if (!("IntersectionObserver" in window)) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = new WeakSet();
  var selector = [
    ".hero h1", ".hero-sub", ".scale-fig", ".tier", ".legend-key",
    ".chapter-title", ".chapter .lede", ".figure", ".card", ".callout",
    ".vocab-tabs", ".vocab-def", ".barrow", ".sparkrow", ".stat", ".deprow",
    ".qcard", ".dl-card", ".source-card", ".tableview"
  ].join(",");
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });

  function register(root) {
    var nodes = [];
    if (root.nodeType === 1 && root.matches(selector)) nodes.push(root);
    if (root.querySelectorAll) nodes = nodes.concat(Array.from(root.querySelectorAll(selector)));
    nodes.forEach(function (node) {
      if (seen.has(node) || node.closest("[hidden]")) return;
      seen.add(node);
      node.classList.add("motion-item");
      if (node.matches(".sparkrow, .deprow")) node.classList.add("motion-from-left");
      if (node.matches(".tier, .stat, .qcard, .dl-card, .card")) node.classList.add("motion-scale");
      var parent = node.parentElement;
      var siblings = parent ? Array.from(parent.children).filter(function (el) { return el.matches(selector); }) : [];
      var index = Math.max(0, siblings.indexOf(node));
      node.style.setProperty("--motion-delay", Math.min(index, 7) * (innerWidth <= 640 ? 45 : 65) + "ms");
      if (reduce || node.getBoundingClientRect().top < innerHeight * .92) node.classList.add("is-visible");
      else observer.observe(node);
    });
  }

  document.documentElement.classList.add("motion-ready");
  register(document);
  new MutationObserver(function (records) {
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) { if (node.nodeType === 1) register(node); });
    });
  }).observe(document.querySelector("main"), { childList:true, subtree:true });

  /* SVG charts are redrawn on resize/theme changes. Give each new drawing a
     short entrance without replaying the whole section reveal. */
  ["scaleFig", "vocabBar", "yearChart", "tmHolder"].forEach(function (id) {
    var host = document.getElementById(id);
    if (!host) return;
    new MutationObserver(function () {
      var graphic = host.firstElementChild;
      if (!graphic || reduce) return;
      graphic.classList.remove("motion-svg-in");
      requestAnimationFrame(function () { graphic.classList.add("motion-svg-in"); });
    }).observe(host, { childList:true });
  });
}

/* ================================================================ go */
theme();
heroScale();
vocab();
years();
treemap();
items();
seriesSection();
assets();
quiz();
sources();
downloads();
readingTools();
scrollMotion();

})();
