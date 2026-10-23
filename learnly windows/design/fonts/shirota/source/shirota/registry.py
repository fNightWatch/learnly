"""Glyph set: names, code points and how each glyph is constructed."""

from .geom import U, rect, rrect, ring, para, diag_width
from .ctx import Ctx, G, solve_dw
from . import caps as C
from . import lower as L
from . import figures as F
from . import punct as P
from . import marks as M


# Base glyphs: name -> (codepoints, case, builder(ctx) -> Glyph)
BASE = {}
# Composites: name -> (codepoints, base glyph, case, [(mark, position)])
COMP = {}


def base(name, cps, case, fn):
    if isinstance(cps, int):
        cps = [cps]
    BASE[name] = (cps, case, fn)


def comp(name, cps, basename, case, *marks):
    if isinstance(cps, int):
        cps = [cps]
    COMP[name] = (cps, basename, case, list(marks))


# --- Latin capitals ---------------------------------------------------------
base("A", 0x41, "cap", C.A)
base("B", 0x42, "cap", C.Ve)
base("C", 0x43, "cap", C.C)
base("D", 0x44, "cap", C.D)
base("E", 0x45, "cap", C.E)
base("F", 0x46, "cap", C.F)
base("G", 0x47, "cap", C.G_)
base("H", 0x48, "cap", C.H)
base("I", 0x49, "cap", C.I)
base("J", 0x4A, "cap", C.J)
base("K", 0x4B, "cap", C.K)
base("L", 0x4C, "cap", C.L)
base("M", 0x4D, "cap", C.M)
base("N", 0x4E, "cap", C.N)
base("O", 0x4F, "cap", C.O)
base("P", 0x50, "cap", C.P)
base("Q", 0x51, "cap", C.Q)
base("R", 0x52, "cap", C.R)
base("S", 0x53, "cap", C.S_)
base("T", 0x54, "cap", C.T)
base("U", 0x55, "cap", C.U_)
base("V", 0x56, "cap", C.V_)
base("W", 0x57, "cap", C.W)
base("X", 0x58, "cap", C.X)
base("Y", 0x59, "cap", C.Y)
base("Z", 0x5A, "cap", C.Z)

# --- Latin lowercase --------------------------------------------------------
base("a", 0x61, "low", L.a)
base("b", 0x62, "low", L.b)
base("c", 0x63, "low", L.c_)
base("d", 0x64, "low", L.d)
base("e", 0x65, "low", L.e)
base("f", 0x66, "low", L.f)
base("g", 0x67, "low", L.g)
base("h", 0x68, "low", L.h)
base("i", 0x69, "low", L.i)
base("j", 0x6A, "low", L.j)
base("k", 0x6B, "low", L.k)
base("l", 0x6C, "low", L.l)
base("m", 0x6D, "low", L.m)
base("n", 0x6E, "low", L.n)
base("o", 0x6F, "low", L.o)
base("p", 0x70, "low", L.p_)
base("q", 0x71, "low", L.q)
base("r", 0x72, "low", L.r)
base("s", 0x73, "low", L.s_)
base("t", 0x74, "low", L.t)
base("u", 0x75, "low", L.u)
base("v", 0x76, "low", L.v)
base("w", 0x77, "low", L.w_)
base("x", 0x78, "low", L.x)
base("y", 0x79, "low", L.y)
base("z", 0x7A, "low", L.z)
base("dotlessi", 0x131, "low", L.dotless_i)
base("dotlessj", 0x237, "low", L.dotless_j)

# --- Cyrillic capitals ------------------------------------------------------
CYR_CAP = {
    0x410: C.A, 0x411: C.Be, 0x412: C.Ve, 0x413: C.Ge, 0x414: C.De,
    0x415: C.E, 0x416: C.Zhe, 0x417: C.Ze, 0x418: C.Ii, 0x41A: C.K,
    0x41B: C.El, 0x41C: C.M, 0x41D: C.H, 0x41E: C.O, 0x41F: C.Pe,
    0x420: C.P, 0x421: C.C, 0x422: C.T, 0x423: C.Ucyr, 0x424: C.Ef,
    0x425: C.X, 0x426: C.Tse, 0x427: C.Che, 0x428: C.Sha,
    0x429: lambda c: C.Sha(c, tail=True), 0x42A: C.HardSign, 0x42B: C.Yeru,
    0x42C: C.SoftSign, 0x42D: C.Ereversed, 0x42E: C.Yu, 0x42F: C.Ya,
    0x404: C.Ye, 0x405: C.S_, 0x406: C.I, 0x408: C.J, 0x490: C.Gheup,
}
for cp, fn in CYR_CAP.items():
    base("uni%04X" % cp, cp, "cap", fn)

# --- Cyrillic lowercase -----------------------------------------------------
CYR_LOW = {
    0x430: L.a, 0x431: L.be, 0x432: C.Ve, 0x433: C.Ge, 0x434: L.de,
    0x435: L.e, 0x436: C.Zhe, 0x437: C.Ze, 0x438: C.Ii, 0x43A: C.K,
    0x43B: C.El, 0x43C: C.M, 0x43D: C.H, 0x43E: L.o, 0x43F: C.Pe,
    0x440: L.p_, 0x441: L.c_, 0x442: C.T, 0x443: L.y, 0x444: L.ef,
    0x445: L.x, 0x446: L.tse, 0x447: C.Che, 0x448: C.Sha, 0x449: L.shcha,
    0x44A: C.HardSign, 0x44B: C.Yeru, 0x44C: C.SoftSign, 0x44D: C.Ereversed,
    0x44E: C.Yu, 0x44F: C.Ya, 0x454: C.Ye, 0x455: L.s_, 0x456: L.i,
    0x458: L.j, 0x491: C.Gheup,
}
for cp, fn in CYR_LOW.items():
    base("uni%04X" % cp, cp, "low", fn)


# Serbian / Macedonian additions built from parts.
def _Lje(c):
    el = C.El(c)
    sb = C.SoftSign(c, bw=c.w(2, 270))
    x = el.w - c.V
    return G(U(el.shape, sb.shape.moved(x)), x + sb.w, el.l, sb.r)


def _Nje(c):
    V = c.V
    sb = C.SoftSign(c, bw=c.w(2, 270))
    x = V + c.u(300)
    s = U(rect(0, 0, V, c.h), rect(V - 1, c.h * 0.51 - c.H / 2, x + 1, c.h * 0.51 + c.H / 2),
          sb.shape.moved(x))
    return G(s, x + sb.w, 1, sb.r)


def _Dzhe(c):
    V = c.V
    w = c.w(2, 380)
    cx = w / 2.0
    s = U(rect(0, 0, V, c.h), rect(w - V, 0, w, c.h), rect(0, 0, w, c.H),
          rect(cx - V * 0.45, -c.tail, cx + V * 0.45, c.H))
    return G(s, w)


def _Tshe(c, hook=False):
    V, H, h = c.V, c.H, c.h
    xs = c.u(110) + V * 0.3
    w = xs + c.w(2, 300)
    top = rect(0, h - H, xs + V + c.u(200), h)
    stem = rect(xs, 0, xs + V, h)
    yt = h * 0.62
    R = min(c.R, yt * 0.5)
    arch = rrect(xs, 0, w, yt, tr=R) - rrect(xs + V, -10, w - V, yt - H, tr=c.rin(R, V, H))
    s = U(top, stem, arch)
    if hook:
        s = s - rect(w - V - 10, -10, w + 10, h * 0.25)
        rh = min(c.R * 0.8, h * 0.2)
        s = s | (rrect(w - V - c.u(60), -c.tail * 0.9, w, h * 0.3, br=rh)
                 - rect(w - V - c.u(60) - 10, -c.tail * 0.9 + H, w - V, h * 0.3 + 10))
    return G(s, w, 0.35, 1)


for cp, fn in {0x409: _Lje, 0x40A: _Nje, 0x40F: _Dzhe, 0x40B: _Tshe,
               0x402: lambda c: _Tshe(c, hook=True)}.items():
    base("uni%04X" % cp, cp, "cap", fn)
for cp, fn in {0x459: _Lje, 0x45A: _Nje, 0x45F: _Dzhe}.items():
    base("uni%04X" % cp, cp, "low", fn)


def _tshe_low(c, hook=False):
    V, H = c.V, c.H
    xs = c.u(60) + V * 0.25
    w = xs + c.w(2, 300)
    stem = rect(xs, 0, xs + V, c.asc)
    bar = rect(0, c.asc - (c.asc - c.xh) * 0.45 - c.Hm, xs + V + c.u(170), c.asc - (c.asc - c.xh) * 0.45)
    R = c.R
    arch = rrect(xs, 0, w, c.xh, tr=R) - rrect(xs + V, -10, w - V, c.xh - H, tr=c.rin(R, V, H))
    s = U(stem, bar, arch)
    if hook:
        rh = min(c.R, -c.desc * 0.6)
        s = s | (rrect(w - V - c.u(70), c.desc, w, c.xh * 0.5, br=rh)
                 - rect(w - V - c.u(70) - 10, c.desc + H, w - V, c.xh))
    return G(s, w, 0.4, 1)


base("uni045B", 0x45B, "low", _tshe_low)
base("uni0452", 0x452, "low", lambda c: _tshe_low(c, hook=True))

# --- Figures ----------------------------------------------------------------
for i, (nm, fn) in enumerate([("zero", F.zero), ("one", F.one), ("two", F.two),
                              ("three", F.three), ("four", F.four), ("five", F.five),
                              ("six", F.six), ("seven", F.seven), ("eight", F.eight),
                              ("nine", F.nine)]):
    base(nm, 0x30 + i, "cap", fn)

# --- Punctuation & symbols --------------------------------------------------
PUNCT = [
    ("period", 0x2E, P.period), ("comma", 0x2C, P.comma), ("colon", 0x3A, P.colon),
    ("semicolon", 0x3B, P.semicolon), ("exclam", 0x21, P.exclam),
    ("exclamdown", 0xA1, P.exclamdown), ("question", 0x3F, P.question),
    ("questiondown", 0xBF, P.questiondown), ("quotesingle", 0x27, P.quotesingle),
    ("quotedbl", 0x22, P.quotedbl), ("quoteleft", 0x2018, P.quoteleft),
    ("quoteright", 0x2019, P.quoteright), ("quotesinglbase", 0x201A, P.quotesinglbase),
    ("quotedblleft", 0x201C, P.quotedblleft), ("quotedblright", 0x201D, P.quotedblright),
    ("quotedblbase", 0x201E, P.quotedblbase), ("guilsinglleft", 0x2039, P.guilsinglleft),
    ("guilsinglright", 0x203A, P.guilsinglright), ("guillemetleft", 0xAB, P.guillemetleft),
    ("guillemetright", 0xBB, P.guillemetright), ("hyphen", [0x2D, 0x2010], P.hyphen),
    ("endash", 0x2013, P.endash), ("emdash", 0x2014, P.emdash),
    ("underscore", 0x5F, P.underscore), ("parenleft", 0x28, P.parenleft),
    ("parenright", 0x29, P.parenright), ("bracketleft", 0x5B, P.bracketleft),
    ("bracketright", 0x5D, P.bracketright), ("braceleft", 0x7B, P.braceleft),
    ("braceright", 0x7D, P.braceright), ("slash", 0x2F, P.slash),
    ("backslash", 0x5C, P.backslash), ("bar", 0x7C, P.bar), ("brokenbar", 0xA6, P.brokenbar),
    ("numbersign", 0x23, P.numbersign), ("dollar", 0x24, P.dollar), ("percent", 0x25, P.percent),
    ("ampersand", 0x26, P.ampersand), ("asterisk", 0x2A, P.asterisk), ("at", 0x40, P.at),
    ("plus", 0x2B, P.plus), ("minus", 0x2212, P.minus), ("equal", 0x3D, P.equal),
    ("less", 0x3C, P.less), ("greater", 0x3E, P.greater), ("plusminus", 0xB1, P.plusminus),
    ("multiply", 0xD7, P.multiply), ("divide", 0xF7, P.divide),
    ("asciicircum", 0x5E, P.asciicircum), ("asciitilde", 0x7E, P.asciitilde),
    ("bullet", 0x2022, P.bullet), ("periodcentered", 0xB7, P.periodcentered),
    ("ellipsis", 0x2026, P.ellipsis), ("uni2116", 0x2116, P.numero), ("Euro", 0x20AC, P.euro),
    ("uni20BD", 0x20BD, P.ruble), ("cent", 0xA2, P.cent), ("sterling", 0xA3, P.sterling),
    ("yen", 0xA5, P.yen), ("copyright", 0xA9, P.copyright), ("registered", 0xAE, P.registered),
    ("trademark", 0x2122, P.trademark), ("degree", 0xB0, P.degree), ("section", 0xA7, P.section),
]
for nm, cp, fn in PUNCT:
    base(nm, cp, "cap", fn)


# --- Special Latin letters --------------------------------------------------
def _Oslash(c, lowfn=None):
    g = lowfn(c) if lowfn else C.O(c)
    w, h = g.w, c.h
    t = c.dt * 0.72
    e = c.V * 0.2 + 15
    dw = diag_width(t, w + 2 * e, h + 2 * e)
    s = g.shape | para(-e, -e + dw, -e, w + e - dw, w + e, h + e)
    return G(s, w, g.l, g.r)


base("Oslash", 0xD8, "cap", _Oslash)
base("oslash", 0xF8, "low", lambda c: _Oslash(c, L.o))


def _AE(c):
    V, h = c.V, c.h
    e = C.E(c, x=280)
    xa = c.u(330) + V * 0.6
    dw = solve_dw(c.dt, lambda d: xa, h)
    diag = para(0, dw, 0, xa, xa + dw, h)
    hull = para(0, 10000, 0, xa, 10000, h)
    yb = h * 0.2
    bar = rect(0, yb, xa + V, yb + c.Hm) & hull
    return G(U(diag, bar, e.shape.moved(xa)), xa + e.w, 0.15, e.r)


base("AE", 0xC6, "cap", _AE)


def _OE(c):
    V, H, h, R = c.V, c.H, c.h, c.R
    wo = c.w(2, 300)
    left = rrect(0, 0, wo, h, tl=R, bl=R) - rrect(V, H, wo + 10, h - H, tl=c.rin(R, V, H), bl=c.rin(R, V, H))
    e = C.E(c, x=280)
    return G(U(left, e.shape.moved(wo - V)), wo - V + e.w, 0.85, e.r)


base("OE", 0x152, "cap", _OE)


def _ae(c):
    a = L.a(c)
    e = L.e(c)
    x = a.w - c.V
    return G(U(a.shape, e.shape.moved(x)), x + e.w, a.l, e.r)


def _oe(c):
    o = L.o(c)
    e = L.e(c)
    x = o.w - c.V
    return G(U(o.shape, e.shape.moved(x)), x + e.w, o.l, e.r)


base("ae", 0xE6, "low", _ae)
base("oe", 0x153, "low", _oe)


def _germandbls(c):
    V, H3, Hm = c.V, c.H3, c.Hm
    w = c.w(2, 310)
    ym = c.xh * 0.86
    wu = w - c.u(40)
    ru = min(c.R, (c.asc - ym) * 0.45)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    up = ring(0, ym - Hm / 2, wu, c.asc, V, V, Hm, H3, tl=ru, tr=ru, br=ru, bl=0, rmin=c.rmin)
    lo = ring(0, 0, w, ym + Hm / 2, V, V, H3, Hm, tl=0, bl=0, tr=rl, br=rl, rmin=c.rmin)
    lo = lo - rect(V, H3, V + c.u(60), ym - Hm / 2) - rect(V + 1, -10, V + c.u(60), H3 + 1)
    s = U(rect(0, 0, V, c.asc - ru), up, lo)
    return G(s, w, 1, 0.85)


base("germandbls", 0xDF, "low", _germandbls)


def _eth(c):
    V, H = c.V, c.H
    g = L.o(c)
    w = g.w
    top = c.asc
    R = min(c.R, (w - w * 0.4) * 0.6)
    hook = rrect(w * 0.4, 0, w, top, tr=R) - rrect(w * 0.4 - 10, -10, w - V, top - H,
                                               tr=c.rin(R, V, H))
    yb = c.xh + (top - H - c.xh) * 0.3
    t = c.Hm * 0.85
    bar = rect(w * 0.5, yb, w + c.u(40), yb + t)
    return G(U(g.shape, hook, bar), w + c.u(40), g.l, 0.5)


base("eth", 0xF0, "low", _eth)
base("thorn", 0xFE, "low", lambda c: L.b(c, desc=True, asc=True))


def _Thorn(c):
    V, H, h = c.V, c.H, c.h
    w = c.w(2, 330)
    yb, yt = h * 0.17, h * 0.83
    rb = min(c.R, (yt - yb) * 0.45)
    s = U(rect(0, 0, V, h), ring(0, yb, w, yt, V, V, H, H, tl=0, bl=0, tr=rb, br=rb, rmin=c.rmin))
    return G(s, w, 1, 0.85)


base("Thorn", 0xDE, "cap", _Thorn)


def _Eth(c):
    d = C.D(c)
    e = c.u(60) + c.V * 0.3
    ym = c.h * 0.5
    s = U(d.shape.moved(e), rect(0, ym - c.Hm / 2, e + c.V + c.u(110), ym + c.Hm / 2))
    return G(s, d.w + e, 0.4, d.r)


base("Eth", [0xD0, 0x110], "cap", _Eth)


def _dcroat(c):
    d = L.d(c)
    y = c.xh + (c.asc - c.xh) * 0.45
    s = d.shape | rect(d.w - c.V - c.u(110), y, d.w + c.u(30), y + c.Hm * 0.9)
    return G(s, d.w + c.u(30), d.l, 0.5)


base("dcroat", 0x111, "low", _dcroat)


def _Lslash(c):
    V, h = c.V, c.h
    e = c.u(60) + V * 0.3
    l = C.L(c)
    t = c.Hm * 0.95
    run = V + 2 * e * 0.9
    y0, y1 = h * 0.34, h * 0.62
    dw = diag_width(t, run, y1 - y0)
    sl = para(e + V / 2 - run / 2, e + V / 2 - run / 2 + dw, y0, e + V / 2 + run / 2 - dw, e + V / 2 + run / 2, y1)
    return G(U(l.shape.moved(e), sl), l.w + e, 0.4, l.r)


def _lslash(c):
    V = c.V
    e = c.u(70) + V * 0.3
    t = c.Hm * 0.95
    run = V + 2 * e * 0.9
    y0, y1 = c.asc * 0.4, c.asc * 0.64
    dw = diag_width(t, run, y1 - y0)
    cx = e + V / 2
    sl = para(cx - run / 2, cx - run / 2 + dw, y0, cx + run / 2 - dw, cx + run / 2, y1)
    return G(U(rect(e, 0, e + V, c.asc), sl), 2 * e + V, 0.4, 0.4)


base("Lslash", 0x141, "cap", _Lslash)
base("lslash", 0x142, "low", _lslash)


def _mu(c):
    u = L.u(c)
    return G(u.shape | rect(0, c.desc, c.V, c.xh * 0.6), u.w, 1, 1)


base("mu", [0xB5, 0x3BC], "low", _mu)


def _apostrophe_after(fn, xfrac=None, top=None):
    """Letters whose caron is drawn as an apostrophe (ď ľ ť Ľ)."""
    def build(c):
        g = fn(c)
        d = P.dsize(c) * 0.85
        yt = (c.asc if top is None else top(c))
        x = g.w + c.p.sb * 0.6
        s = g.shape | P._comma_shape(d, x, yt - d)
        return G(s, x + d, g.l, 0.7)
    return build


base("dcaron", 0x10F, "low", _apostrophe_after(L.d))
base("lcaron", 0x13E, "low", _apostrophe_after(L.l))
base("tcaron", 0x165, "low", _apostrophe_after(L.t, top=lambda c: c.xh + (c.asc - c.xh) * 0.62))
base("Lcaron", 0x13D, "cap", _apostrophe_after(lambda c: G(rect(0, 0, c.V, c.h), c.V), top=lambda c: c.h))


# --- Accented letters -------------------------------------------------------
ACC = [
    # name, codepoint, base, marks
    ("Agrave", 0xC0, "A", ["grave"]), ("Aacute", 0xC1, "A", ["acute"]),
    ("Acircumflex", 0xC2, "A", ["circumflex"]), ("Atilde", 0xC3, "A", ["tilde"]),
    ("Adieresis", 0xC4, "A", ["dieresis"]), ("Aring", 0xC5, "A", ["ring"]),
    ("Ccedilla", 0xC7, "C", ["cedilla"]), ("Egrave", 0xC8, "E", ["grave"]),
    ("Eacute", 0xC9, "E", ["acute"]), ("Ecircumflex", 0xCA, "E", ["circumflex"]),
    ("Edieresis", 0xCB, "E", ["dieresis"]), ("Igrave", 0xCC, "I", ["grave"]),
    ("Iacute", 0xCD, "I", ["acute"]), ("Icircumflex", 0xCE, "I", ["circumflex"]),
    ("Idieresis", 0xCF, "I", ["dieresis"]), ("Ntilde", 0xD1, "N", ["tilde"]),
    ("Ograve", 0xD2, "O", ["grave"]), ("Oacute", 0xD3, "O", ["acute"]),
    ("Ocircumflex", 0xD4, "O", ["circumflex"]), ("Otilde", 0xD5, "O", ["tilde"]),
    ("Odieresis", 0xD6, "O", ["dieresis"]), ("Ugrave", 0xD9, "U", ["grave"]),
    ("Uacute", 0xDA, "U", ["acute"]), ("Ucircumflex", 0xDB, "U", ["circumflex"]),
    ("Udieresis", 0xDC, "U", ["dieresis"]), ("Yacute", 0xDD, "Y", ["acute"]),
    ("agrave", 0xE0, "a", ["grave"]), ("aacute", 0xE1, "a", ["acute"]),
    ("acircumflex", 0xE2, "a", ["circumflex"]), ("atilde", 0xE3, "a", ["tilde"]),
    ("adieresis", 0xE4, "a", ["dieresis"]), ("aring", 0xE5, "a", ["ring"]),
    ("ccedilla", 0xE7, "c", ["cedilla"]), ("egrave", 0xE8, "e", ["grave"]),
    ("eacute", 0xE9, "e", ["acute"]), ("ecircumflex", 0xEA, "e", ["circumflex"]),
    ("edieresis", 0xEB, "e", ["dieresis"]), ("igrave", 0xEC, "dotlessi", ["grave"]),
    ("iacute", 0xED, "dotlessi", ["acute"]), ("icircumflex", 0xEE, "dotlessi", ["circumflex"]),
    ("idieresis", 0xEF, "dotlessi", ["dieresis"]), ("ntilde", 0xF1, "n", ["tilde"]),
    ("ograve", 0xF2, "o", ["grave"]), ("oacute", 0xF3, "o", ["acute"]),
    ("ocircumflex", 0xF4, "o", ["circumflex"]), ("otilde", 0xF5, "o", ["tilde"]),
    ("odieresis", 0xF6, "o", ["dieresis"]), ("ugrave", 0xF9, "u", ["grave"]),
    ("uacute", 0xFA, "u", ["acute"]), ("ucircumflex", 0xFB, "u", ["circumflex"]),
    ("udieresis", 0xFC, "u", ["dieresis"]), ("yacute", 0xFD, "y", ["acute"]),
    ("ydieresis", 0xFF, "y", ["dieresis"]),
    # Latin Extended-A
    ("Amacron", 0x100, "A", ["macron"]), ("amacron", 0x101, "a", ["macron"]),
    ("Abreve", 0x102, "A", ["breve"]), ("abreve", 0x103, "a", ["breve"]),
    ("Aogonek", 0x104, "A", ["ogonek"]), ("aogonek", 0x105, "a", ["ogonek"]),
    ("Cacute", 0x106, "C", ["acute"]), ("cacute", 0x107, "c", ["acute"]),
    ("Ccircumflex", 0x108, "C", ["circumflex"]), ("ccircumflex", 0x109, "c", ["circumflex"]),
    ("Cdotaccent", 0x10A, "C", ["dotaccent"]), ("cdotaccent", 0x10B, "c", ["dotaccent"]),
    ("Ccaron", 0x10C, "C", ["caron"]), ("ccaron", 0x10D, "c", ["caron"]),
    ("Dcaron", 0x10E, "D", ["caron"]),
    ("Emacron", 0x112, "E", ["macron"]), ("emacron", 0x113, "e", ["macron"]),
    ("Ebreve", 0x114, "E", ["breve"]), ("ebreve", 0x115, "e", ["breve"]),
    ("Edotaccent", 0x116, "E", ["dotaccent"]), ("edotaccent", 0x117, "e", ["dotaccent"]),
    ("Eogonek", 0x118, "E", ["ogonek"]), ("eogonek", 0x119, "e", ["ogonek"]),
    ("Ecaron", 0x11A, "E", ["caron"]), ("ecaron", 0x11B, "e", ["caron"]),
    ("Gcircumflex", 0x11C, "G", ["circumflex"]), ("gcircumflex", 0x11D, "g", ["circumflex"]),
    ("Gbreve", 0x11E, "G", ["breve"]), ("gbreve", 0x11F, "g", ["breve"]),
    ("Gdotaccent", 0x120, "G", ["dotaccent"]), ("gdotaccent", 0x121, "g", ["dotaccent"]),
    ("Gcommaaccent", 0x122, "G", ["commaaccent"]),
    ("Hcircumflex", 0x124, "H", ["circumflex"]),
    ("Itilde", 0x128, "I", ["tilde"]), ("itilde", 0x129, "dotlessi", ["tilde"]),
    ("Imacron", 0x12A, "I", ["macron"]), ("imacron", 0x12B, "dotlessi", ["macron"]),
    ("Ibreve", 0x12C, "I", ["breve"]), ("ibreve", 0x12D, "dotlessi", ["breve"]),
    ("Iogonek", 0x12E, "I", ["ogonek"]), ("Idotaccent", 0x130, "I", ["dotaccent"]),
    ("Jcircumflex", 0x134, "J", ["circumflex"]), ("jcircumflex", 0x135, "dotlessj", ["circumflex"]),
    ("Kcommaaccent", 0x136, "K", ["commaaccent"]), ("kcommaaccent", 0x137, "k", ["commaaccent"]),
    ("Lacute", 0x139, "L", ["acute"]), ("lacute", 0x13A, "l", ["acute"]),
    ("Lcommaaccent", 0x13B, "L", ["commaaccent"]), ("lcommaaccent", 0x13C, "l", ["commaaccent"]),
    ("Nacute", 0x143, "N", ["acute"]), ("nacute", 0x144, "n", ["acute"]),
    ("Ncommaaccent", 0x145, "N", ["commaaccent"]), ("ncommaaccent", 0x146, "n", ["commaaccent"]),
    ("Ncaron", 0x147, "N", ["caron"]), ("ncaron", 0x148, "n", ["caron"]),
    ("Omacron", 0x14C, "O", ["macron"]), ("omacron", 0x14D, "o", ["macron"]),
    ("Obreve", 0x14E, "O", ["breve"]), ("obreve", 0x14F, "o", ["breve"]),
    ("Ohungarumlaut", 0x150, "O", ["hungarumlaut"]), ("ohungarumlaut", 0x151, "o", ["hungarumlaut"]),
    ("Racute", 0x154, "R", ["acute"]), ("racute", 0x155, "r", ["acute"]),
    ("Rcommaaccent", 0x156, "R", ["commaaccent"]), ("rcommaaccent", 0x157, "r", ["commaaccent"]),
    ("Rcaron", 0x158, "R", ["caron"]), ("rcaron", 0x159, "r", ["caron"]),
    ("Sacute", 0x15A, "S", ["acute"]), ("sacute", 0x15B, "s", ["acute"]),
    ("Scircumflex", 0x15C, "S", ["circumflex"]), ("scircumflex", 0x15D, "s", ["circumflex"]),
    ("Scedilla", 0x15E, "S", ["cedilla"]), ("scedilla", 0x15F, "s", ["cedilla"]),
    ("Scaron", 0x160, "S", ["caron"]), ("scaron", 0x161, "s", ["caron"]),
    ("Tcedilla", 0x162, "T", ["cedilla"]), ("tcedilla", 0x163, "t", ["cedilla"]),
    ("Tcaron", 0x164, "T", ["caron"]),
    ("Utilde", 0x168, "U", ["tilde"]), ("utilde", 0x169, "u", ["tilde"]),
    ("Umacron", 0x16A, "U", ["macron"]), ("umacron", 0x16B, "u", ["macron"]),
    ("Ubreve", 0x16C, "U", ["breve"]), ("ubreve", 0x16D, "u", ["breve"]),
    ("Uring", 0x16E, "U", ["ring"]), ("uring", 0x16F, "u", ["ring"]),
    ("Uhungarumlaut", 0x170, "U", ["hungarumlaut"]), ("uhungarumlaut", 0x171, "u", ["hungarumlaut"]),
    ("Uogonek", 0x172, "U", ["ogonek"]), ("uogonek", 0x173, "u", ["ogonek"]),
    ("Wcircumflex", 0x174, "W", ["circumflex"]), ("wcircumflex", 0x175, "w", ["circumflex"]),
    ("Ycircumflex", 0x176, "Y", ["circumflex"]), ("ycircumflex", 0x177, "y", ["circumflex"]),
    ("Ydieresis", 0x178, "Y", ["dieresis"]),
    ("Zacute", 0x179, "Z", ["acute"]), ("zacute", 0x17A, "z", ["acute"]),
    ("Zdotaccent", 0x17B, "Z", ["dotaccent"]), ("zdotaccent", 0x17C, "z", ["dotaccent"]),
    ("Zcaron", 0x17D, "Z", ["caron"]), ("zcaron", 0x17E, "z", ["caron"]),
    ("Scommaaccent", 0x218, "S", ["commaaccent"]), ("scommaaccent", 0x219, "s", ["commaaccent"]),
    ("Tcommaaccent", 0x21A, "T", ["commaaccent"]), ("tcommaaccent", 0x21B, "t", ["commaaccent"]),
    # Cyrillic
    ("uni0401", 0x401, "uni0415", ["dieresis"]), ("uni0451", 0x451, "uni0435", ["dieresis"]),
    ("uni0419", 0x419, "uni0418", ["breve"]), ("uni0439", 0x439, "uni0438", ["breve"]),
    ("uni040E", 0x40E, "uni0423", ["breve"]), ("uni045E", 0x45E, "uni0443", ["breve"]),
    ("uni0407", 0x407, "uni0406", ["dieresis"]), ("uni0457", 0x457, "dotlessi", ["dieresis"]),
    ("uni0403", 0x403, "uni0413", ["acute"]), ("uni0453", 0x453, "uni0433", ["acute"]),
    ("uni040C", 0x40C, "uni041A", ["acute"]), ("uni045C", 0x45C, "uni043A", ["acute"]),
    ("uni0400", 0x400, "uni0415", ["grave"]), ("uni0450", 0x450, "uni0435", ["grave"]),
    ("uni040D", 0x40D, "uni0418", ["grave"]), ("uni045D", 0x45D, "uni0438", ["grave"]),
]
for nm, cp, b, mk in ACC:
    comp(nm, cp, b, None, *mk)

# Glyphs whose marks should sit above the ascender rather than the x-height.
ASCENDER_BASES = {"l", "k", "h", "d", "b"}
