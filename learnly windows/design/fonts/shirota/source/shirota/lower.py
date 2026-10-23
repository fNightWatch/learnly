"""Lowercase forms with ascenders/descenders (Latin and the Cyrillic letters
that are not simply small capitals)."""

from .geom import U, rect, rrect, ring, para, poly, diag_width
from .ctx import G, c_shape, solve_dw, edge_para, band, k_arms
from . import caps


def _arch(c, w, h, R):
    """Top bar + right stem with a rounded shoulder (the right half of n)."""
    V, H = c.V, c.H
    return rrect(0, 0, w, h, tr=R) - rrect(V, -10, w - V, h - H,
                                           tr=c.rin(R, V, H))


def dot(c, cx, y0=None):
    p = c.p
    sz = c.V + 0.6 * (p.dot - c.V)
    y0 = c.xh + 0.13 * c.xh + 0.3 * c.H if y0 is None else y0
    return rect(cx - sz / 2, y0, cx + sz / 2, y0 + sz)


def n(c, x=320, asc=False):
    w = c.w(2, x)
    top = c.asc if asc else c.xh
    s = U(rect(0, 0, c.V, top), _arch(c, w, c.xh, c.R))
    return G(s, w)


def h(c):
    return n(c, asc=True)


def m(c):
    V = c.V
    cw = c.u(250)
    w = 3 * V + 2 * cw
    a = _arch(c, 2 * V + cw, c.xh, c.R)
    s = U(rect(0, 0, V, c.xh), a, a.moved(V + cw))
    return G(s, w)


def u(c):
    g = n(c)
    return G(g.shape.rotated180(g.w / 2.0, c.xh / 2.0), g.w)


def r(c):
    V, H = c.V, c.H
    w = c.w(1.3, 190)
    R = min(c.R, w - V)
    s = U(rect(0, 0, V, c.xh), _arch(c, w, c.xh, R)
          - rect(w - V - 1, -10, w + 10, c.xh - max(R, H)))
    return G(s, w, 1, 0.45)


def b(c, desc=False, asc=True):
    V, H = c.V, c.H
    w = c.w(2, 330)
    y0 = c.desc if desc else 0
    y1 = c.asc if asc else c.xh
    s = U(rect(0, y0, V, y1),
          ring(0, 0, w, c.xh, V, V, H, H, tl=0, bl=0, tr=c.R, br=c.R,
               rmin=c.rmin))
    return G(s, w, 1, 0.85)


def d(c):
    g = b(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.85, 1)


def p_(c):
    return b(c, desc=True, asc=False)


def q(c):
    g = p_(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.85, 1)


def o(c):
    return caps.O(c, x=340)


def c_(c):
    return caps.C(c, x=318)


def e(c):
    V, H3, Hm, xh, R = c.V, c.H3, c.Hm, c.xh, c.R
    w = c.w(2, 330)
    ym = xh * 0.53
    s = rrect(0, 0, w, xh, r=R)
    rm = c.rmin
    ri = c.rin(R, V, H3)
    s = s - rrect(V, ym + Hm / 2, w - V, xh - H3, tl=ri, tr=ri, bl=rm, br=rm)
    s = s - rrect(V, H3, w - V, ym - Hm / 2, tl=rm, tr=0, bl=ri,
                  br=c.rin(R, V, H3, floor=False))
    lo = max(R, H3)
    hi = ym - Hm / 2
    if hi > lo:
        s = s - rect(w - V - 1, lo, w + 100, hi)
    return G(s, w, 0.85, 0.6)


def a(c):
    V, H3, Hm, xh = c.V, c.H3, c.Hm, c.xh
    w = c.w(2, 300)
    yt = xh * 0.56
    R = c.R
    top = rrect(0, 0, w, xh, tr=R) - rrect(-10, -10, w - V, xh - H3,
                                           tr=c.rin(R, V, H3))
    rb = min(R, yt * 0.45)
    bowl = ring(0, 0, w, yt + Hm / 2, V, V, H3, Hm, tl=rb, bl=rb, tr=0, br=0,
                rmin=c.rmin)
    return G(top | bowl, w, 0.75, 1)


def f(c):
    V, H, Hm = c.V, c.H, c.Hm
    xs = 0.3 * V + c.u(40)
    w = xs + c.w(1, 190)
    R = min(c.R, (w - xs) * 0.6)
    s = rrect(xs, 0, w, c.asc, tl=R) - rrect(xs + V, -10, w + 10, c.asc - H,
                                             tl=c.rin(R, V, H))
    s = s | rect(0, c.xh - Hm, xs + V + (w - xs - V) * 0.62, c.xh)
    return G(s, w, 0.4, 0.3)


def t(c):
    V, H, Hm = c.V, c.H, c.Hm
    xs = 0.3 * V + c.u(40)
    w = xs + c.w(1, 170)
    top = c.xh + (c.asc - c.xh) * 0.62
    R = min(c.R, (w - xs) * 0.6)
    s = rrect(xs, 0, w, top, bl=R) - rrect(xs + V, H, w + 10, top + 10,
                                           bl=c.rin(R, V, H))
    s = s | rect(0, c.xh - Hm, xs + V + (w - xs - V) * 0.8, c.xh)
    return G(s, w, 0.4, 0.4)


def g(c):
    V, H, xh = c.V, c.H, c.xh
    w = c.w(2, 330)
    R = c.R
    bowl = ring(0, 0, w, xh, V, V, H, H, tl=R, bl=R, tr=0, br=0, rmin=c.rmin)
    rd = min(R, (-c.desc + H) * 0.5)
    tail = rrect(0, c.desc, w, xh, br=rd) - rrect(-10, c.desc + H, w - V,
                                                 xh + 10, br=c.rin(rd, V, H))
    tail = tail - rect(-10, c.desc + H - 1, w * 0.12, c.desc - 10)
    return G(bowl | tail, w, 0.85, 1)


def i(c):
    V = c.V
    s = rect(0, 0, V, c.xh) | dot(c, V / 2.0)
    return G(s, V)


def dotless_i(c):
    return G(rect(0, 0, c.V, c.xh), c.V)


def j(c, with_dot=True):
    V, H = c.V, c.H
    xs = 0.3 * V + c.u(70)
    w = xs + V
    rj = min(c.R, w * 0.7, (-c.desc) * 0.6)
    s = rrect(0, c.desc, w, c.xh, br=rj) - rect(-10, c.desc + H, xs, c.xh + 10)
    if with_dot:
        s = s | dot(c, xs + V / 2.0)
    return G(s, w, 0.3, 1)


def dotless_j(c):
    return j(c, with_dot=False)


def k(c):
    V = c.V
    w = c.w(2, 330)
    arms, dw = k_arms(c, V * 0.82, w, c.xh)
    s = U(rect(0, 0, V, c.asc), arms) & band(0, c.asc)
    return G(s, w, 1, 0.2)


def l(c):
    return G(rect(0, 0, c.V, c.asc), c.V)


def s_(c):
    return caps.S_(c, x=320)


def v(c):
    return caps.V_(c, x=390)


def w_(c):
    return caps.W(c, x=640)


def x(c):
    return caps.X(c, x=380)


def y(c):
    return caps.Ucyr(c, x=390, depth=-c.desc)


def z(c):
    return caps.Z(c, x=320)


# --- Cyrillic lowercase that are not small capitals --------------------------

def be(c):  # б
    V, H = c.V, c.H
    w = c.w(2, 330)
    R = c.R
    top = c.asc
    body = ring(0, 0, w, c.xh, V, V, H, H, r=R, rmin=c.rmin)
    stem = rrect(0, c.xh * 0.5, w * 0.86, top, tl=min(R, w * 0.3))
    stem = stem - rrect(V, -10, w + 10, top - H,
                        tl=c.rin(min(R, w * 0.3), V, H))
    return G(body | stem, w, 0.85, 0.85)


def ef(c):  # ф
    V, H = c.V, c.H
    cw = c.u(170)
    w = 3 * V + 2 * cw
    cx = w / 2.0
    bowl = ring(0, 0, w, c.xh, V, V, H, H, r=c.R, rmin=c.rmin)
    return G(bowl | rect(cx - V / 2, c.desc, cx + V / 2, c.asc), w, 0.85, 0.85)


def de(c):  # д
    return caps.De(c)


def tse(c):
    return caps.Tse(c)


def shcha(c):
    return caps.Sha(c, tail=True)
