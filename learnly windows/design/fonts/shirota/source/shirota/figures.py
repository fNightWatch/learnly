"""Lining figures (cap height), all on a common tabular-friendly width."""

from .geom import U, rect, rrect, ring, para, poly, diag_width
from .ctx import G, bowl_open_left, c_shape, solve_dw
from . import caps


def _w(c):
    return c.w(2, 300)


def zero(c):
    w = _w(c)
    s = ring(0, 0, w, c.h, c.V, c.V, c.H, c.H, r=c.R, rmin=c.rmin)
    return G(s, w, 0.9, 0.9)


def one(c):
    V, H, h = c.V, c.H, c.h
    w = _w(c)
    xs = w / 2.0 - V / 2.0 + c.u(20)
    s = U(rect(xs, 0, xs + V, h), rect(xs - c.u(110) - V * 0.3, h - H, xs + 1, h))
    return G(s, w, 0.9, 0.9)


def two(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = _w(c)
    ym = h * 0.52
    ru = min(c.R, (h - ym + Hm / 2) * 0.45)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    up = bowl_open_left(c, 0, ym - Hm / 2, w, h, V, Hm, H3, ru, ru)
    lo = rrect(0, 0, w, ym + Hm / 2, tl=rl) - rrect(V, H3, w + 10, ym - Hm / 2,
                                                    tl=c.rin(rl, V, Hm))
    return G(up | lo, w, 0.85, 0.85)


def three(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = _w(c)
    ym = h * 0.52
    ru = min(c.R, (h - ym + Hm / 2) * 0.45)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    s = U(bowl_open_left(c, 0, ym - Hm / 2, w, h, V, Hm, H3, ru, ru),
          bowl_open_left(c, 0, 0, w, ym + Hm / 2, V, H3, Hm, rl, rl))
    s = s - rect(-10, ym - Hm / 2 - 1, w * 0.32, ym + Hm / 2 + 1)
    return G(s, w, 0.85, 0.85)


def four(c):
    V, H, h = c.V, c.Hm, c.h
    w = _w(c)
    yb = h * 0.28
    xr = w - V - c.u(20)
    rb = min(c.R, (h - yb) * 0.4)
    left = rrect(0, yb, xr + V, h, bl=rb) - rrect(V, yb + H, xr, h + 10,
                                                  bl=c.rin(rb, V, H))
    s = U(left, rect(xr, 0, xr + V, h), rect(0, yb, w, yb + H))
    return G(s, w, 0.85, 0.85)


def five(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = _w(c)
    ym = h * 0.56
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    lo = bowl_open_left(c, 0, 0, w, ym + Hm / 2, V, H3, Hm, rl, rl)
    s = U(lo, rect(0, ym - Hm / 2, V, h), rect(0, h - H3, w, h))
    return G(s, w, 0.85, 0.85)


def six(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = _w(c)
    ym = h * 0.56
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    lo = ring(0, 0, w, ym + Hm / 2, V, V, H3, Hm, r=rl, rmin=c.rmin)
    ru = min(c.R, w * 0.35)
    up = rrect(0, ym, w, h, tl=ru) - rrect(V, ym - 10, w + 10, h - H3,
                                           tl=c.rin(ru, V, H3))
    return G(lo | up, w, 0.85, 0.85)


def seven(c):
    V, H, h = c.V, c.H, c.h
    w = _w(c)
    xb = w * 0.18
    dw = solve_dw(c.dt, lambda d: (w - d / 2) - (xb + d / 2), h - H)
    s = U(rect(0, h - H, w, h), para(xb, xb + dw, 0, w - dw, w, h - H + 1))
    return G(s, w, 0.85, 0.7)


def eight(c):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = _w(c)
    ym = h * 0.53
    inset = c.u(14)
    ru = min(c.R, (h - ym + Hm / 2) * 0.45)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    lo = ring(0, 0, w, ym + Hm / 2, V, V, H3, Hm, r=rl, rmin=c.rmin)
    up = ring(inset, ym - Hm / 2, w - inset, h, V, V, Hm, H3, r=ru,
              rmin=c.rmin)
    return G(lo | up, w, 0.85, 0.85)


def nine(c):
    g = six(c)
    return G(g.shape.rotated180(g.w / 2.0, c.h / 2.0), g.w, 0.85, 0.85)
