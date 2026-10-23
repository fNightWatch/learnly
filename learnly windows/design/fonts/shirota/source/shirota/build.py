"""Turn the parametric glyph definitions into TrueType fonts."""

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib.tables._g_l_y_f import Glyph as TTGlyph

from .params import UPM, Params
from .ctx import Ctx, G
from . import registry as R
from . import marks as M
from . import punct as P
from .geom import S, U

VERSION = "1.000"
VENDOR = "NONE"


def build_glyphs(p):
    ctx = {"cap": Ctx(p, "cap"), "low": Ctx(p, "low")}
    out = {}
    for name, (cps, case, fn) in R.BASE.items():
        g = fn(ctx[case])
        out[name] = (cps, case, g)
    for name, (cps, basename, _case, marks) in R.COMP.items():
        bcps, case, bg = out[basename]
        out[name] = (cps, case, _compose(p, ctx[case], basename, bg, marks))
    return out


OGONEK_X = {"A": 1.0, "a": 1.0, "E": 0.92, "e": 0.72, "I": 1.0, "U": 0.62,
            "u": 1.0}


def _compose(p, c, basename, bg, marks):
    shape = bg.shape
    b = shape.bounds()
    x0, y0b, x1, y1b = b
    cx = (x0 + x1) / 2.0
    if basename in ("L", "l", "dotlessi", "I", "uni0406"):
        cx = c.V / 2.0 if basename != "L" else c.V * 0.5 + (bg.w - c.V) * 0.12
    if basename in ("r",):
        cx = (c.V + bg.w) / 2.0 - c.V * 0.25
    stack = 0
    parts = [shape]
    for mk in marks:
        if mk in M.MARKS:
            if c.case == "cap":
                ytop = c.cap
            elif basename in R.ASCENDER_BASES:
                ytop = c.asc
            else:
                ytop = c.xh
            mm = M.MarkMetrics(c)
            yb = ytop + mm.gap + stack
            parts.append(M.MARKS[mk](c, cx, yb))
        elif mk == "cedilla":
            parts.append(M.cedilla(c, cx))
        elif mk == "commaaccent":
            parts.append(M.commaaccent(c, cx, -0.05 * c.h - 20))
        elif mk == "ogonek":
            xr = x0 + (x1 - x0) * OGONEK_X.get(basename, 0.9)
            parts.append(M.ogonek(c, xr))
    shape = U(*parts)
    nb = shape.bounds()
    over_l = max(0.0, -nb[0])
    over_r = max(0.0, nb[2] - bg.w)
    lsb = bg.lsb if bg.lsb is not None else p.sb * bg.l
    rsb = bg.rsb if bg.rsb is not None else p.sb * bg.r
    lsb2 = max(lsb - over_l, p.sb * 0.2)
    rsb2 = max(rsb - over_r, p.sb * 0.2)
    shape = shape.moved(over_l)
    return G(shape, bg.w + over_l + over_r, lsb=lsb2, rsb=rsb2)


def _draw(shape, dx):
    pen = TTGlyphPen(None)
    qpen = Cu2QuPen(pen, max_err=0.6, reverse_direction=False)
    tpen = TransformPen(qpen, (1, 0, 0, 1, dx, 0))
    shape.p.draw(tpen)
    return pen.glyph()


def glyph_metrics(p, g):
    lsb = g.lsb if g.lsb is not None else p.sb * g.l
    rsb = g.rsb if g.rsb is not None else p.sb * g.r
    return lsb, rsb


def build_font(p, path, kerning=None):
    glyphs = build_glyphs(p)
    order = [".notdef", "space", "uni00A0"] + list(glyphs.keys())
    cmap = {0x20: "space", 0xA0: "uni00A0"}
    ttglyphs = {}
    metrics = {}

    # .notdef: an outlined box
    nd_w = 500 + 100 * (p.f - 1)
    nd = S()
    from .geom import rect
    nd = rect(0, 0, nd_w - 100, p.capH) - rect(60, 60, nd_w - 160, p.capH - 60)
    ttglyphs[".notdef"] = _draw(nd, 50)
    metrics[".notdef"] = (round(nd_w), 50)
    sw = P.space_width(p)
    for nm in ("space", "uni00A0"):
        ttglyphs[nm] = TTGlyph()
        metrics[nm] = (round(sw), 0)

    for name, (cps, case, g) in glyphs.items():
        lsb, rsb = glyph_metrics(p, g)
        ttglyphs[name] = _draw(g.shape, lsb)
        adv = round(lsb + g.w + rsb)
        metrics[name] = (adv, 0)
        for cp in cps:
            cmap[cp] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(ttglyphs)
    # recompute lsb from real outlines
    glyf = fb.font["glyf"]
    hm = {}
    for name in order:
        gl = glyf[name]
        gl.recalcBounds(glyf)
        hm[name] = (metrics[name][0], getattr(gl, "xMin", 0) if gl.numberOfContours else 0)
    fb.setupHorizontalMetrics(hm)

    ymax = max((glyf[n].yMax for n in order if glyf[n].numberOfContours), default=1000)
    ymin = min((glyf[n].yMin for n in order if glyf[n].numberOfContours), default=-250)

    asc, desc, gap = 950, -250, 0
    fb.setupHorizontalHeader(ascent=asc, descent=desc, lineGap=gap)

    family = p.family
    style = p.weight_name
    ribbi = style in ("Regular", "Bold")
    legacy_family = family if ribbi else f"{family} {style}"
    legacy_style = style if ribbi else "Regular"
    full = f"{family} {style}"
    ps = f"{p.ps_family}-{style}"
    names = {
        "copyright": "Copyright 2026 The Shirota Project Authors",
        "familyName": legacy_family,
        "styleName": legacy_style,
        "uniqueFontIdentifier": f"{VERSION};{VENDOR};{ps}",
        "fullName": full,
        "version": f"Version {VERSION}",
        "psName": ps,
        "description": "Shirota: a squarish extended grotesk with Latin and Cyrillic, "
                       "9 weights in 3 widths.",
        "typographicFamily": family,
        "typographicSubfamily": style,
    }
    fb.setupNameTable(names, mac=False)

    fs_sel = 0
    if style == "Regular":
        fs_sel |= 1 << 6
    if style == "Bold":
        fs_sel |= 1 << 5
    fs_sel |= 1 << 7  # USE_TYPO_METRICS
    fb.setupOS2(
        version=4,
        usWeightClass=p.weight_class,
        usWidthClass=p.width_class,
        fsType=0,
        achVendID=VENDOR,
        fsSelection=fs_sel,
        sTypoAscender=760,
        sTypoDescender=-240,
        sTypoLineGap=200,
        usWinAscent=max(asc, int(ymax) + 10),
        usWinDescent=max(-desc, -int(ymin) + 10),
        sxHeight=p.xH,
        sCapHeight=p.capH,
        ulCodePageRange1=(1 << 0) | (1 << 1) | (1 << 2) | (1 << 4) | (1 << 7),
        ulCodePageRange2=0,
        usDefaultChar=0,
        usBreakChar=32,
        usMaxContext=2,
    )
    fb.font["OS/2"].recalcUnicodeRanges(fb.font)
    fb.font["OS/2"].panose.bFamilyType = 2
    fb.font["OS/2"].panose.bWeight = {100: 2, 200: 3, 300: 4, 400: 5, 500: 6, 600: 7,
                                      700: 8, 800: 9, 900: 10}[p.weight_class]
    fb.font["OS/2"].panose.bProportion = {5: 3, 7: 5, 8: 5}.get(p.width_class, 3)
    fb.setupPost(underlinePosition=-150, underlineThickness=round(max(p.H * 0.7, 40)))
    fb.font["head"].macStyle = (1 if style == "Bold" else 0)
    fb.font["head"].fontRevision = float(VERSION)
    if kerning:
        from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
        addOpenTypeFeaturesFromString(fb.font, kerning(p, glyphs, fb.font))
    fb.font.save(path)
    return path
