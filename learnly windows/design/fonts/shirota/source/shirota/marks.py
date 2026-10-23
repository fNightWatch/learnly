"""Diacritical marks. Each function returns a shape centred on ``cx`` whose
bottom sits at ``y0`` (above-marks) or whose top sits at ``y0`` (below)."""

import math

from .geom import U, rect, rrect, ring, para, poly, stroke
from .ctx import bowl_open_left, solve_dw


class MarkMetrics:
    def __init__(self, c):
        p = c.p
        self.c = c
        self.t = c.Hm * 0.92 if c.case == "cap" else c.Hm * 0.95
        self.ah = (0.15 * p.capH + 0.25 * c.H) * (0.92 if c.case == "cap" else 1.0)
        self.ds = c.V * 0.62 + 0.4 * (p.dot - c.V) * 0.62 + 10
        self.ds = max(self.ds, self.t * 1.05)
        self.gap = (0.07 * p.capH + 0.1 * c.H) if c.case == "cap" else (
            0.1 * p.xH + 0.22 * c.H)
        self.wf = 0.9 + 0.25 * (p.f - 1)


def _acute(m, cx, y0, flip=False):
    ah = m.ah * 0.95
    run = ah * 1.15 * m.wf
    dw = solve_dw(m.t * 1.12, lambda d: run, ah)
    s = para(cx - run / 2 - dw / 2, cx - run / 2 + dw / 2, y0,
             cx + run / 2 - dw / 2, cx + run / 2 + dw / 2, y0 + ah)
    if flip:
        s = s.mirror_x(cx)
    return s


def acute(c, cx, y0):
    return _acute(MarkMetrics(c), cx, y0)


def grave(c, cx, y0):
    return _acute(MarkMetrics(c), cx, y0, flip=True)


def hungarumlaut(c, cx, y0):
    m = MarkMetrics(c)
    off = m.ah * 0.62 * m.wf + m.t * 0.4
    return U(_acute(m, cx - off / 2, y0), _acute(m, cx + off / 2, y0))


def circumflex(c, cx, y0, flip=False):
    m = MarkMetrics(c)
    ah = m.ah * 0.85
    half = ah * 1.2 * m.wf
    dw = solve_dw(m.t * 1.1, lambda d: half - d / 2.0, ah)
    left = para(cx - half - dw / 2, cx - half + dw / 2, y0,
                cx - dw / 2, cx + dw / 2, y0 + ah)
    s = U(left, left.mirror_x(cx))
    if flip:
        s = s.mirror_y(y0 + ah / 2.0)
    return s


def caron(c, cx, y0):
    return circumflex(c, cx, y0, flip=True)


def dieresis(c, cx, y0):
    m = MarkMetrics(c)
    ds = m.ds
    gap = ds * 0.85 + 30 * m.wf
    return U(rect(cx - gap / 2 - ds, y0, cx - gap / 2, y0 + ds),
             rect(cx + gap / 2, y0, cx + gap / 2 + ds, y0 + ds))


def dotaccent(c, cx, y0):
    m = MarkMetrics(c)
    ds = m.ds
    return rect(cx - ds / 2, y0, cx + ds / 2, y0 + ds)


def macron(c, cx, y0):
    m = MarkMetrics(c)
    hw = m.ah * 1.35 * m.wf
    return rect(cx - hw, y0, cx + hw, y0 + m.t)


def ring_(c, cx, y0):
    m = MarkMetrics(c)
    hh = m.ah * 1.05
    hw = hh * 0.62 * m.wf + m.t * 0.3
    st = m.t * 0.95
    return ring(cx - hw, y0, cx + hw, y0 + hh, st * 1.1, st * 1.1, st, st,
                r=hh * 0.38, rmin=hh * 0.08)


def breve(c, cx, y0):
    m = MarkMetrics(c)
    sv, sh = m.t * 1.05, m.t * 0.92
    hh = max(m.ah * 0.9, sh * 2.0)
    hw = hh * 1.15 * m.wf + m.t * 0.3
    rb = min(hh * 0.7, hw * 0.6)
    outer = rrect(cx - hw, y0, cx + hw, y0 + hh, bl=rb, br=rb)
    inner = rrect(cx - hw + sv, y0 + sh, cx + hw - sv, y0 + hh + 50,
                  bl=(max(rb - sv, 4), max(rb - sh, 4)),
                  br=(max(rb - sv, 4), max(rb - sh, 4)))
    return outer - inner


def tilde(c, cx, y0):
    from .punct import _zigzag
    m = MarkMetrics(c)
    t = m.t * 0.85
    hh = max(m.ah * 0.72, t * 2.5)
    hw = hh * 1.15 * m.wf + t * 0.5
    return _zigzag(cx - hw, cx + hw, y0, y0 + hh, t)

def cedilla(c, cx, y0=0):
    m = MarkMetrics(c)
    t = m.t
    depth = -c.p.desc * 0.9
    hw = m.ah * 0.75 * m.wf + t * 0.2
    stub = rect(cx - t * 0.55, -depth * 0.45, cx + t * 0.55, 5)
    hook = bowl_open_left(c, cx - hw, -depth, cx + hw * 0.9, -depth * 0.45 + t,
                          t * 1.05, t, t, min(hw * 0.5, depth * 0.25),
                          min(hw * 0.5, depth * 0.25))
    return U(stub, hook)


def ogonek(c, x_right, y0=0):
    m = MarkMetrics(c)
    t = m.t
    depth = -c.p.desc * 0.85
    w = m.ah * 0.9 * m.wf + t
    x0 = x_right - w
    r = min(w * 0.6, depth * 0.6)
    s = rrect(x0, -depth, x_right, 5, bl=r) - rrect(x0 + t * 1.1, -depth + t,
                                                 x_right + 10, 10,
                                                 bl=(max(r - t, 4), max(r - t, 4)))
    return s


def commaaccent(c, cx, ytop):
    """Comma-shaped mark hanging below the baseline (ytop is its top)."""
    m = MarkMetrics(c)
    ds = m.ds * 0.95
    d = ds
    return poly([(cx - d / 2, ytop), (cx + d / 2, ytop),
                 (cx + d / 2, ytop - d), (cx - d * 0.05, ytop - d * 1.75),
                 (cx - d * 0.55, ytop - d * 1.75), (cx - d * 0.1, ytop - d),
                 (cx - d / 2, ytop - d)])


MARKS = {
    "acute": acute, "grave": grave, "circumflex": circumflex, "caron": caron,
    "dieresis": dieresis, "dotaccent": dotaccent, "macron": macron,
    "ring": ring_, "breve": breve, "tilde": tilde,
    "hungarumlaut": hungarumlaut,
}

BELOW = {"cedilla": cedilla, "commaaccent": commaaccent}
