"""Punctuation, symbols and currency signs."""

import math

from .geom import U, S, rect, rrect, ring, para, poly, diag_width, stroke
from .ctx import G, bowl_open_left, c_shape, solve_dw
from . import caps, figures


def dsize(c):
    return c.p.dot


def _dot(x, y, d):
    return rect(x, y, x + d, y + d)


def period(c):
    d = dsize(c)
    return G(_dot(0, 0, d), d, 0.9, 0.9)


def _comma_shape(d, x=0, y=0):
    return poly([(x, y + d), (x + d, y + d), (x + d, y),
                 (x + d * 0.6, y - d * 0.85), (x + d * 0.02, y - d * 0.85),
                 (x + d * 0.38, y), (x, y)])


def comma(c):
    d = dsize(c)
    return G(_comma_shape(d), d, 0.9, 0.9)


def colon(c):
    d = dsize(c)
    return G(U(_dot(0, 0, d), _dot(0, c.xh - d, d)), d, 1.0, 1.0)


def semicolon(c):
    d = dsize(c)
    return G(U(_comma_shape(d), _dot(0, c.xh - d, d)), d, 1.0, 1.0)


def exclam(c):
    d = dsize(c)
    gap = d * 0.38 + 34
    s = U(_dot(0, 0, d), rect(d * 0.04, d + gap, d * 0.96, c.cap))
    return G(s, d, 1.1, 1.1)

def exclamdown(c):
    g = exclam(c)
    return G(g.shape.rotated180(g.w / 2.0, c.xh / 2.0), g.w, 1.1, 1.1)


def question(c):
    V, H, h = c.V, c.H, c.cap
    d = dsize(c)
    w = c.w(2, 250)
    yb = h * 0.36
    R = min(c.R, (h - yb) * 0.45)
    xc = w * 0.5
    sw = max(d * 0.9, V * 0.9)
    top = bowl_open_left(c, 0, yb, w, h, V, H, H, R, R)
    top = top - rect(-10, yb - 1, xc - sw / 2, yb + H + 1)
    gap = d * 0.38 + 34
    s = U(top, rect(xc - sw / 2, d + gap, xc + sw / 2, yb + 1),
          _dot(xc - d / 2, 0, d))
    return G(s, w, 0.7, 0.8)

def questiondown(c):
    g = question(c)
    return G(g.shape.rotated180(g.w / 2.0, (c.xh + c.desc * 0.0) / 2.0 + 0),
             g.w, 0.8, 0.7)


def quotesingle(c):
    d = dsize(c)
    w = d * 0.72
    hh = max(c.cap * 0.3, w * 1.5)
    return G(rect(0, c.cap - hh, w, c.cap), w, 1, 1)

def quotedbl(c):
    d = dsize(c)
    w = d * 0.72
    hh = max(c.cap * 0.3, w * 1.5)
    gap = d * 0.55 + 20
    s = U(rect(0, c.cap - hh, w, c.cap), rect(w + gap, c.cap - hh, 2 * w + gap, c.cap))
    return G(s, 2 * w + gap, 1, 1)

def quoteright(c):
    d = dsize(c)
    return G(_comma_shape(d, 0, c.cap - d), d, 1, 1)


def quoteleft(c):
    d = dsize(c)
    s = _comma_shape(d, 0, c.cap - d).rotated180(d / 2.0, c.cap - d * 0.85 / 2.0 - d * 0.075)
    return G(s, d, 1, 1)


def quotesinglbase(c):
    return comma(c)


def _double(g, gap):
    s = U(g.shape, g.shape.moved(g.w + gap))
    return G(s, 2 * g.w + gap, g.l, g.r)


def quotedblright(c):
    return _double(quoteright(c), dsize(c) * 0.5)


def quotedblleft(c):
    return _double(quoteleft(c), dsize(c) * 0.5)


def quotedblbase(c):
    return _double(comma(c), dsize(c) * 0.5)


def _chevron(c, scale=1.0, t=None):
    """Left-pointing chevron with flat horizontal ends."""
    t = (c.Hm * 1.05 if t is None else t)
    b = c.xh * 0.3 * scale
    a = b * (0.9 + 0.25 * (c.p.f - 1))
    tt = t * math.hypot(a, b) / b
    ym = c.xh * 0.5
    s = poly([(0, ym), (a, ym + b), (a + tt, ym + b), (tt, ym),
              (a + tt, ym - b), (a, ym - b)])
    return s, a + tt


def guilsinglleft(c):
    s, w = _chevron(c)
    return G(s, w, 0.6, 0.6)


def guilsinglright(c):
    s, w = _chevron(c)
    return G(s.mirror_x(w / 2.0), w, 0.6, 0.6)


def guillemetleft(c):
    s, w = _chevron(c)
    gap = w * 0.12 + c.V * 0.3
    off = w * 0.62 + gap
    return G(U(s, s.moved(off)), w + off, 0.6, 0.6)


def guillemetright(c):
    g = guillemetleft(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.6, 0.6)


def less(c):
    s, w = _chevron(c, scale=1.25, t=c.Hm * 1.05)
    return G(s.moved(0, c.cap * 0.36 - c.xh * 0.5), w, 0.8, 0.8)


def greater(c):
    g = less(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.8, 0.8)


def _math_t(c):
    return (c.V + c.H) * 0.42


def _math_w(c):
    return c.u(330) + c.V * 0.9


def _math_y(c):
    return c.cap * 0.36


def hyphen(c):
    w = c.u(190) + c.V * 0.65
    ym = c.xh * 0.5
    th = c.Hm
    return G(rect(0, ym - th / 2, w, ym + th / 2), w, 0.6, 0.6)


def endash(c):
    w = c.u(420) + c.V
    ym = c.xh * 0.5
    th = c.Hm
    return G(rect(0, ym - th / 2, w, ym + th / 2), w, 0.4, 0.4)


def emdash(c):
    w = c.u(860) + 2 * c.V
    ym = c.xh * 0.5
    th = c.Hm
    return G(rect(0, ym - th / 2, w, ym + th / 2), w, 0.4, 0.4)


def underscore(c):
    w = c.u(420) + c.V
    th = c.Hm
    return G(rect(0, -0.16 * c.cap - th, w, -0.16 * c.cap), w, 0.1, 0.1)


def plus(c):
    w = _math_w(c)
    t = _math_t(c)
    ym = _math_y(c)
    cx = w / 2.0
    s = U(rect(0, ym - t / 2, w, ym + t / 2), rect(cx - t / 2, ym - w / 2, cx + t / 2, ym + w / 2))
    return G(s, w, 0.8, 0.8)


def minus(c):
    w = _math_w(c)
    t = _math_t(c)
    ym = _math_y(c)
    return G(rect(0, ym - t / 2, w, ym + t / 2), w, 0.8, 0.8)


def equal(c):
    w = _math_w(c)
    t = _math_t(c) * 0.92
    ym = _math_y(c)
    gap = t * 0.7 + 40
    s = U(rect(0, ym + gap / 2, w, ym + gap / 2 + t), rect(0, ym - gap / 2 - t, w, ym - gap / 2))
    return G(s, w, 0.8, 0.8)


def plusminus(c):
    w = _math_w(c)
    t = _math_t(c)
    ym = _math_y(c) + t * 0.6
    cx = w / 2.0
    arm = w / 2.0 - t * 0.2
    s = U(rect(0, ym - t / 2, w, ym + t / 2), rect(cx - t / 2, ym - arm, cx + t / 2, ym + arm),
          rect(0, ym - arm - t * 1.4 - t, w, ym - arm - t * 1.4))
    return G(s, w, 0.8, 0.8)


def multiply(c):
    w = _math_w(c) * 0.85
    t = _math_t(c)
    ym = _math_y(c)
    dw = diag_width(t, w, w)
    s = U(para(0, dw, ym - w / 2, w - dw, w, ym + w / 2), para(w - dw, w, ym - w / 2, 0, dw, ym + w / 2))
    return G(s, w, 0.9, 0.9)


def divide(c):
    w = _math_w(c)
    t = _math_t(c)
    ym = _math_y(c)
    d = dsize(c) * 0.9
    cx = w / 2.0
    gap = t * 0.5 + d * 0.3 + 20
    s = U(rect(0, ym - t / 2, w, ym + t / 2), rect(cx - d / 2, ym + t / 2 + gap, cx + d / 2, ym + t / 2 + gap + d),
          rect(cx - d / 2, ym - t / 2 - gap - d, cx + d / 2, ym - t / 2 - gap))
    return G(s, w, 0.8, 0.8)


def asciicircum(c):
    w = _math_w(c)
    t = _math_t(c)
    half = w / 2.0
    hh = c.cap * 0.38
    y0 = c.cap - hh
    dw = solve_dw(t, lambda d: half - d / 2.0, hh)
    left = para(0, dw, y0, half - dw / 2, half + dw / 2, c.cap)
    return G(U(left, left.mirror_x(half)), w, 0.7, 0.7)


def _zigzag(x0, x1, y0, y1, t, tv=None):
    """Squarish wave (a tilde): an arch followed by a cup sharing the middle
    upright, with rounded outer corners."""
    tv = t * 1.1 if tv is None else tv
    xm = (x0 + x1) / 2.0
    r = min((xm - x0) * 0.5, (y1 - y0) * 0.8)
    ri = (max(r - tv, 3), max(r - t, 3))
    arch = rrect(x0, y0, xm + tv / 2, y1, tl=r, tr=r) - rrect(
        x0 + tv, y0 - 100, xm - tv / 2, y1 - t, tl=ri, tr=ri)
    cup = arch.rotated180(xm, (y0 + y1) / 2.0)
    return U(arch, cup)

def asciitilde(c):
    w = _math_w(c)
    t = _math_t(c) * 0.85
    ym = _math_y(c)
    hh = t * 2.6
    s = _zigzag(0, w, ym - hh / 2, ym + hh / 2, t)
    return G(s, w, 0.8, 0.8)

def slash(c):
    t = c.dt * 0.82
    y0, y1 = -0.1 * c.cap, c.cap * 1.0
    run = c.u(230) + c.V * 0.6
    dw = diag_width(t, run, y1 - y0)
    s = para(0, dw, y0, run - dw, run, y1)
    return G(s, run, 0.15, 0.15)


def backslash(c):
    g = slash(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.15, 0.15)


def bar(c):
    w = c.V * 0.8
    return G(rect(0, c.desc, w, c.asc), w, 1.1, 1.1)


def brokenbar(c):
    w = c.V * 0.8
    mid = (c.desc + c.asc) / 2.0
    gap = c.H * 0.8 + 40
    return G(U(rect(0, c.desc, w, mid - gap / 2), rect(0, mid + gap / 2, w, c.asc)), w, 1.1, 1.1)


def _paren_shape(c):
    V, H = c.V * 0.86, c.H * 0.86
    y0, y1 = c.desc * 0.72, c.cap + 0.06 * c.cap
    w = c.u(120) + V * 1.05
    R = min(c.R * 1.05, w * 0.95, (y1 - y0) * 0.3)
    return c_shape(c, 0, y0, w, y1, V, H, H, R), w


def parenleft(c):
    s, w = _paren_shape(c)
    return G(s, w, 1, 0.3)


def parenright(c):
    s, w = _paren_shape(c)
    return G(s.mirror_x(w / 2.0), w, 0.3, 1)


def bracketleft(c):
    V, H = c.V * 0.86, c.H * 0.86
    y0, y1 = c.desc * 0.72, c.cap + 0.06 * c.cap
    w = c.u(100) + V * 1.05
    s = U(rect(0, y0, V, y1), rect(0, y1 - H, w, y1), rect(0, y0, w, y0 + H))
    return G(s, w, 1, 0.3)


def bracketright(c):
    g = bracketleft(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.3, 1)


def braceleft(c):
    V, H = c.V * 0.8, c.H * 0.8
    y0, y1 = c.desc * 0.72, c.cap + 0.06 * c.cap
    nb = c.u(60) + V * 0.4
    w = nb + V + c.u(80)
    ym = (y0 + y1) / 2.0
    R = min(c.R * 0.6, (w - nb) * 0.8)
    col = rrect(nb, y0, w, y1, tl=R, bl=R) - rrect(nb + V, y0 + H, w + 10, y1 - H,
                                                 tl=c.rin(R, V, H), bl=c.rin(R, V, H))
    s = U(col, rect(0, ym - H / 2, nb + 1, ym + H / 2))
    return G(s, w, 0.6, 0.3)


def braceright(c):
    g = braceleft(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.3, 0.6)


def numbersign(c):
    t = _math_t(c) * 0.95
    w = c.u(360) + c.V * 0.9
    h = c.cap * 0.82
    y0 = (c.cap - h) / 2.0 - c.cap * 0.04
    gx = w * 0.3
    sl = w * 0.08
    v1 = para(gx - t / 2 - sl, gx + t / 2 - sl, y0, gx - t / 2 + sl, gx + t / 2 + sl, y0 + h)
    v2 = v1.moved(w - 2 * gx)
    hy = h * 0.3
    s = U(v1, v2, rect(0, y0 + hy - t / 2, w, y0 + hy + t / 2),
          rect(0, y0 + h - hy - t / 2, w, y0 + h - hy + t / 2))
    return G(s, w, 0.5, 0.5)


def dollar(c):
    g = caps.S_(c, x=320)
    t = c.V * 0.55
    cx = g.w / 2.0
    ext = 0.12 * c.cap
    s = g.shape | rect(cx - t / 2, -ext, cx + t / 2, c.cap + ext)
    return G(s, g.w, 0.75, 0.75)


def _small_o(c, ow, oh):
    V, H = c.V * 0.62, c.H * 0.6
    R = min(c.R * 0.75, ow * 0.4, oh * 0.4)
    return ring(0, 0, ow, oh, V, V, H, H, r=R, rmin=c.rmin * 0.6)


def percent(c):
    V = c.V * 0.62
    ow = c.u(150) + 2 * V
    oh = c.cap * 0.44
    o = _small_o(c, ow, oh)
    gap = c.u(40) + V * 0.3
    w = ow * 2 + gap * 2 + c.u(60)
    t = c.dt * 0.62
    dw = diag_width(t, w - 2 * ow * 0.55, c.cap)
    sl = para(ow * 0.55, ow * 0.55 + dw, 0, w - ow * 0.55 - dw, w - ow * 0.55, c.cap)
    s = U(o.moved(0, c.cap - oh), o.moved(w - ow, 0), sl)
    return G(s, w, 0.6, 0.6)

def ampersand(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.cap
    w = c.w(2, 400)
    ym = h * 0.58
    u0, u1 = c.u(40) + V * 0.15, w * 0.66
    ru = min(c.R, (h - ym) * 0.45, (u1 - u0) * 0.35)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    up = ring(u0, ym - Hm / 2, u1, h, V, V, Hm, H3, r=ru, rmin=c.rmin)
    wl = w * 0.84
    lo = ring(0, 0, wl, ym + Hm / 2, V, V, H3, Hm, r=rl, rmin=c.rmin,
              nofloor=("tr", "br"))
    lo = lo - rect(wl - V - 1, max(rl, H3), wl + 100, ym + Hm / 2 + 10)
    lo = lo - rect(u1 - 1, ym - Hm / 2 - 10, wl + 100, ym + Hm / 2 + 10)
    xs = u1 - V * 0.9
    t = c.dt
    dw = solve_dw(t, lambda d: (w - d / 2) - (xs + d / 2), ym)
    leg = para(w - dw, w, 0, xs, xs + dw, ym + Hm / 2)
    s = U(up, lo, leg) & rect(-10, 0, w + 10, h + 10)
    return G(s, w, 0.85, 0.2)

def asterisk(c):
    t = _math_t(c) * 0.62
    L = c.cap * 0.44
    cx, cy = L / 2.0, c.cap - L / 2.0
    s = rect(cx - t / 2, cy - L / 2, cx + t / 2, cy + L / 2)
    parts = [s]
    for ang in (60, -60):
        a = math.radians(ang)
        cs, sn = math.cos(a), math.sin(a)
        p = s.p.transform(scaleX=cs, skewX=-sn, skewY=sn, scaleY=cs,
                          translateX=cx - cs * cx + sn * cy,
                          translateY=cy - sn * cx - cs * cy)
        parts.append(S(p).simplified())
    return G(U(*parts), L, 0.6, 0.6)

def at(c):
    k = 0.72 - 0.12 * c.p.t
    sv, sh = c.V * k, c.H * k
    y0, y1 = c.desc * 0.6, c.cap
    w = c.u(620) + 3.2 * sv
    R = min(c.R * 1.1, (y1 - y0) * 0.33)
    gx = max(c.u(50), sv * 0.9)
    gy = max(0.08 * (y1 - y0), sh * 0.9)
    xi0, xi1 = sv + gx, w - sv - gx
    yi0, yi1 = y0 + sh + gy, y1 - sh - gy
    ri = min(c.R * 0.8, (yi1 - yi0) * 0.4, (xi1 - xi0) * 0.3)
    inner = ring(xi0, yi0, xi1, yi1, sv, sv, sh, sh, tl=ri, bl=ri, tr=0,
                 br=0, rmin=c.rmin * 0.6)
    outer = ring(0, y0, w, y1, sv, sv, sh, sh, r=R, rmin=c.rmin * 0.8)
    yhi = (yi0 + yi1) / 2.0
    outer = outer - rect(w - sv - 1, yi0 + sh, w + 100, yhi)
    tail = rect(xi1 - sv, yi0, w - sv + 1, yi0 + sh)
    return G(U(outer, inner, tail), w, 0.8, 0.8)

def bullet(c):
    d = dsize(c) * 1.25 + 20
    ym = c.xh * 0.5
    return G(rect(0, ym - d / 2, d, ym + d / 2), d, 1, 1)


def periodcentered(c):
    d = dsize(c)
    ym = c.xh * 0.5
    return G(rect(0, ym - d / 2, d, ym + d / 2), d, 1, 1)


def ellipsis(c):
    d = dsize(c)
    gap = d * 0.6 + c.p.sb * 0.9
    s = U(_dot(0, 0, d), _dot(d + gap, 0, d), _dot(2 * (d + gap), 0, d))
    return G(s, 3 * d + 2 * gap, 0.9, 0.9)


def numero(c):
    n = caps.N(c)
    V = c.V * 0.62
    H = c.H * 0.6
    ow = c.u(150) + 2 * V
    oh = c.cap * 0.44
    o = _small_o(c, ow, oh)
    x = n.w + c.u(50) + V * 0.3
    yb = c.cap * 0.2
    s = U(n.shape, o.moved(x, c.cap - oh), rect(x, yb, x + ow, yb + H))
    return G(s, x + ow, 1, 0.8)

def euro(c):
    g = caps.C(c, x=372)
    t = c.Hm * 0.8
    gap = t * 0.6 + 30
    ym = c.cap * 0.5
    x0 = -c.u(60) - c.V * 0.2
    x1 = g.w * 0.62
    s = U(g.shape, rect(x0, ym + gap / 2, x1, ym + gap / 2 + t), rect(x0, ym - gap / 2 - t, x1, ym - gap / 2))
    return G(s.moved(-x0), g.w - x0, 0.4, 0.55)


def ruble(c):
    V, H = c.V, c.H
    g = caps.P(c, x=320)
    e = c.u(70) + V * 0.25
    bh = caps.bowl_h(c)
    yb = c.cap - bh
    s = U(g.shape.moved(e), rect(0, yb, e + V, yb + H),
          rect(0, c.cap * 0.2 - c.Hm / 2, e + V + c.u(190), c.cap * 0.2 + c.Hm / 2))
    return G(s, g.w + e, 0.4, 0.85)


def cent(c):
    g = caps.C(c, x=318)
    t = c.V * 0.55
    cx = g.w * 0.5
    ext = 0.12 * c.xh
    s = g.shape | rect(cx - t / 2, -ext, cx + t / 2, c.xh + ext)
    return G(s, g.w, 0.85, 0.55)


def sterling(c):
    V, H = c.V, c.H
    w = c.w(2, 300)
    xs = c.u(50) + V * 0.3
    R = min(c.R, (w - xs) * 0.5)
    top = rrect(xs, 0, w, c.cap, tl=R) - rrect(xs + V, -10, w + 10, c.cap - H, tl=c.rin(R, V, H))
    s = U(top, rect(0, 0, w, H), rect(0, c.cap * 0.42 - c.Hm / 2, xs + V + c.u(150), c.cap * 0.42 + c.Hm / 2))
    return G(s, w, 0.6, 0.6)


def yen(c):
    g = caps.Y(c)
    t = c.Hm * 0.8
    w = g.w
    xc = w / 2.0
    hw = c.V * 0.5 + c.u(150)
    s = U(g.shape, rect(xc - hw, c.cap * 0.32 - t, xc + hw, c.cap * 0.32),
          rect(xc - hw, c.cap * 0.32 - t * 2.4, xc + hw, c.cap * 0.32 - t * 1.4))
    return G(s, w, 0.2, 0.2)


def _circle_frame(c):
    V, H = c.V * 0.62, c.H * 0.62
    sz = c.cap * 1.0
    w = sz + c.u(120)
    R = min(c.R * 1.2, sz * 0.4)
    return ring(0, 0, w, sz, V, V, H, H, r=R, rmin=c.rmin), w, sz


def copyright(c):
    frame, w, sz = _circle_frame(c)
    from .ctx import Ctx
    cl = Ctx(c.p, "low")
    inner = caps.C(cl, x=230)
    sc = 0.62
    ish = inner.shape.transformed(xx=sc, yy=sc)
    s = U(frame, ish.moved(w / 2.0 - inner.w * sc / 2.0, sz / 2.0 - c.xh * sc / 2.0))
    return G(s, w, 0.8, 0.8)


def registered(c):
    frame, w, sz = _circle_frame(c)
    from .ctx import Ctx
    cl = Ctx(c.p, "low")
    inner = caps.R(cl)
    sc = 0.62
    ish = inner.shape.transformed(xx=sc, yy=sc)
    s = U(frame, ish.moved(w / 2.0 - inner.w * sc / 2.0, sz / 2.0 - c.xh * sc / 2.0))
    return G(s, w, 0.8, 0.8)


def trademark(c):
    from .ctx import Ctx
    cl = Ctx(c.p, "low")
    sc = 0.55
    t = caps.T(cl)
    m = caps.M(cl)
    ts = t.shape.transformed(xx=sc, yy=sc)
    ms = m.shape.transformed(xx=sc, yy=sc)
    y = c.cap - c.xh * sc
    gap = c.u(40) + c.V * 0.2
    s = U(ts.moved(0, y), ms.moved(t.w * sc + gap, y))
    return G(s, t.w * sc + gap + m.w * sc, 0.6, 0.6)


def degree(c):
    V, H = c.V * 0.7, c.H * 0.7
    sz = c.cap * 0.36
    w = sz * 0.95 + c.u(20)
    R = min(c.R * 0.6, sz * 0.4)
    s = ring(0, c.cap - sz, w, c.cap, V, V, H, H, r=R, rmin=c.rmin * 0.6)
    return G(s, w, 0.7, 0.7)


def section(c):
    from .ctx import Ctx
    g = caps.S_(c, x=290)
    s1 = g.shape.transformed(yy=0.62).moved(0, c.cap * 0.38)
    s2 = g.shape.transformed(yy=0.62).moved(0, -c.cap * 0.12)
    return G(U(s1, s2), g.w, 0.75, 0.75)


def space_width(p):
    return 210 + 60 * (p.f - 1) + p.V * 0.25
