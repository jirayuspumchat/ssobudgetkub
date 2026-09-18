# -*- coding: utf-8 -*-
import re
COMB = '\u0e31\u0e34\u0e35\u0e36\u0e37\u0e38\u0e39\u0e3a\u0e47\u0e48\u0e49\u0e4a\u0e4b\u0e4c\u0e4d\u0e4e'
TONE = '\u0e48\u0e49\u0e4a\u0e4b'
_sp_comb = re.compile('[ ]+([' + COMB + '])')
_AM = '\ue000'                                                  # stands in for a real SARA AM while repairing
_am_tone_aa = re.compile('[ ]([' + TONE + '])[ ]\u0e33')        # "เป ่ ำลม"  -> เป่าลม
_am_tone = re.compile('([\u0e01-\u0e2e]?)[ ]([' + TONE + '])\u0e33')   # "น ้ำเงิน" -> น้ำเงิน

# Syllables where 'space + tone + SARA AM' still means SARA AA. ฝ่ำ is not a Thai
# syllable: the asset report prints ฝ่าย this way 479 times, against 2,076 hits of
# น้ำ ต่ำ คว่ำ บ้ำ that are a real SARA AM. Keyed by consonant + tone.
AA_AFTER_TONE = frozenset(('\u0e1d\u0e48',))                    # ฝ + MAI EK


def tis620(s):
    """pypdf returns TIS-620 bytes mis-decoded as latin-1; repair."""
    out = []
    for ch in s:
        o = ord(ch)
        if 0xa0 <= o <= 0xff:
            try:
                out.append(bytes([o]).decode('cp874'))
            except Exception:
                out.append(ch)
        else:
            out.append(ch)
    return ''.join(out)


def fix_budget(s):
    """Budget PDFs: SARA AM is emitted as 'space + SARA AA'."""
    s = s.replace('\u0020\u0e32', '\u0e33')
    return _sp_comb.sub(r'\1', s)


def _am_after_tone(m):
    cons, tone = m.group(1), m.group(2)
    return cons + tone + ('\u0e32' if cons + tone in AA_AFTER_TONE else _AM)


def fix_assets(s):
    """Asset PDF: SARA AA is emitted as SARA AM; real SARA AM as 'space + SARA AM'.

    A tone mark moves that space: 'น ้ำ' (space before the tone) is a real SARA AM,
    while 'เป ่ ำ' (space on both sides of the tone) is SARA AA. Both forms have to be
    settled before the plain 'space + SARA AM' rule, which would otherwise read the
    first as SARA AA and the second as a real SARA AM.
    """
    s = _am_tone_aa.sub(lambda m: m.group(1) + '\u0e32', s)
    s = _am_tone.sub(_am_after_tone, s)
    s = s.replace('\u0020\u0e33', _AM)
    s = s.replace('\u0e33', '\u0e32')
    s = s.replace(_AM, '\u0e33')
    return _sp_comb.sub(r'\1', s)


def clean(s):
    return re.sub(r'[ \t]+', ' ', s).strip()
