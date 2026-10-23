"""Automatic kerning from glyph side profiles.

The sidebearings already encode how each side should be spaced (straight,
round, diagonal ...). What sidebearings cannot express is how two *open*
sides interlock -- A next to V, T over o, L before a quote. For every pair we
compare the narrowest real gap between the two outlines with the sum of
their sidebearings; when the outlines cannot get that close because their
extremes sit at different heights, the pair is tightened by part of that
excess, limited so the shapes never collide.
"""

import numpy as np

from . import registry as R

BAND = 24.0
Y0, Y1 = -260.0, 960.0
NB = int((Y1 - Y0) / BAND)
BLUR = 1  # bands of vertical tolerance either side

# Only these take part in kerning (figures stay tabular).
LETTER_CATS = set(range(0x41, 0x5B)) | set(range(0x61, 0x7B)) | set(range(0xC0, 0x250)) \
    | set(range(0x400, 0x530))
PUNCT = {".", ",", ":", ";", "-", "hyphen", "period", "comma", "colon", "semicolon",
         "quotesingle", "quotedbl", "quoteleft", "quoteright", "quotedblleft",
         "quotedblright", "quotesinglbase", "quotedblbase", "guillemetleft",
         "guillemetright", "guilsinglleft", "guilsinglright", "parenleft",
         "parenright", "bracketleft", "bracketright", "braceleft", "braceright",
         "slash", "backslash", "ellipsis", "endash", "emdash", "exclam", "question",
         "asterisk"}


def _edges(shape, dx):
    """Flatten a shape into line segments (N x 4 array)."""
    from fontTools.pens.recordingPen import RecordingPen
    rp = RecordingPen()
    shape.p.draw(rp)
    segs = []
    cur = start = None
    for op, args in rp.value:
        if op == "moveTo":
            cur = start = args[0]
        elif op == "lineTo":
            segs.append((cur, args[0]))
            cur = args[0]
        elif op == "curveTo":
            p0 = cur
            p1, p2, p3 = args
            prev = p0
            for i in range(1, 9):
                t = i / 8.0
                mt = 1 - t
                pt = (mt**3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t**3 * p3[0],
                      mt**3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t**3 * p3[1])
                segs.append((prev, pt))
                prev = pt
            cur = p3
        elif op == "qCurveTo":
            segs.append((cur, args[-1]))
            cur = args[-1]
        elif op in ("closePath", "endPath"):
            if cur is not None and start is not None and cur != start:
                segs.append((cur, start))
            cur = start
    if not segs:
        return np.zeros((0, 4))
    return np.array([(a[0] + dx, a[1], b[0] + dx, b[1]) for a, b in segs], dtype=float)


def profile(shape, dx):
    """Per band: leftmost and rightmost ink (nan where empty)."""
    e = _edges(shape, dx)
    lo = np.full(NB, np.nan)
    hi = np.full(NB, np.nan)
    if not len(e):
        return lo, hi
    x0, y0, x1, y1 = e.T
    ymin = np.minimum(y0, y1)
    ymax = np.maximum(y0, y1)
    for b in range(NB):
        ya, yb = Y0 + b * BAND, Y0 + (b + 1) * BAND
        m = (ymax >= ya) & (ymin <= yb)
        if not m.any():
            continue
        xa, ya_, xb, yb_ = x0[m], y0[m], x1[m], y1[m]
        dy = yb_ - ya_
        with np.errstate(divide="ignore", invalid="ignore"):
            ta = np.clip((ya - ya_) / dy, 0, 1)
            tb = np.clip((yb - ya_) / dy, 0, 1)
        ta = np.where(dy == 0, 0, ta)
        tb = np.where(dy == 0, 1, tb)
        xs = np.concatenate([xa + (xb - xa) * ta, xa + (xb - xa) * tb])
        lo[b] = xs.min()
        hi[b] = xs.max()
    return lo, hi


def _blur(arr, mode):
    out = arr.copy()
    for s in range(1, BLUR + 1):
        for sh in (s, -s):
            rolled = np.roll(arr, sh)
            if sh > 0:
                rolled[:sh] = np.nan
            else:
                rolled[sh:] = np.nan
            if mode == "max":
                out = np.fmax(out, rolled)
            else:
                out = np.fmin(out, rolled)
    return out


def kern_feature(p, glyphs, font):
    hmtx = font["hmtx"].metrics
    from .build import glyph_metrics

    # which glyphs take part
    names = []
    for name, (cps, case, g) in glyphs.items():
        if name in R.COMP:
            continue
        if name in PUNCT or any(cp in LETTER_CATS for cp in cps):
            names.append(name)

    right = {}
    left = {}
    sbs = {}
    for name in names:
        cps, case, g = glyphs[name]
        lsb, rsb = glyph_metrics(p, g)
        adv = hmtx[name][0]
        lo, hi = profile(g.shape, lsb)
        # gap from the ink to the advance edge (right side) / origin (left)
        right[name] = _blur(adv - hi, "min")
        left[name] = _blur(lo, "min")
        sbs[name] = (np.nanmin(lo) if np.isfinite(lo).any() else 0,
                     adv - np.nanmax(hi) if np.isfinite(hi).any() else 0)

    # group identical profiles so the feature stays compact
    def groups(prof):
        keyed = {}
        for n in names:
            v = prof[n]
            key = tuple(np.where(np.isnan(v), -9999, np.round(v / 4.0)).astype(int))
            keyed.setdefault(key, []).append(n)
        return list(keyed.values())

    lgroups = groups(right)   # glyphs on the left of a pair, keyed by right side
    rgroups = groups(left)

    # members: base glyph + composites built on it
    comp_of = {}
    for cname, (cps, base, _c, _m) in R.COMP.items():
        comp_of.setdefault(base, []).append(cname)

    def members(group):
        out = []
        for n in group:
            out.append(n)
            out.extend(comp_of.get(n, []))
        return out

    sb = p.sb
    dmin = 0.62 * sb
    beta = 0.72
    kmax = (115 + 55 * (p.f - 1)) * (1.0 + 0.2 * p.t)

    pairs = []
    for gl in lgroups:
        rl = right[gl[0]]
        for gr in rgroups:
            lr = left[gr[0]]
            both = np.isfinite(rl) & np.isfinite(lr)
            if not both.any():
                continue
            gap = rl + lr
            gmin = np.nanmin(gap[both])
            nominal = sbs[gl[0]][1] + sbs[gr[0]][0]
            excess = gmin - nominal
            if excess <= 0:
                continue
            k = beta * excess
            k = min(k, gmin - dmin, kmax)
            k = int(round(k / 5.0) * 5)
            if k >= 10:
                pairs.append((gl, gr, -k))

    if not pairs:
        return "languagesystem DFLT dflt;\n"

    lines = ["languagesystem DFLT dflt;", "languagesystem latn dflt;",
             "languagesystem cyrl dflt;", ""]
    lname = {}
    rname = {}
    for i, g in enumerate(lgroups):
        lname[id(g)] = f"@kL{i}"
        lines.append(f"@kL{i} = [{' '.join(members(g))}];")
    for i, g in enumerate(rgroups):
        rname[id(g)] = f"@kR{i}"
        lines.append(f"@kR{i} = [{' '.join(members(g))}];")
    lines.append("")
    lines.append("feature kern {")
    for gl, gr, k in pairs:
        lines.append(f"    pos {lname[id(gl)]} {rname[id(gr)]} {k};")
    lines.append("} kern;")
    return "\n".join(lines) + "\n"
