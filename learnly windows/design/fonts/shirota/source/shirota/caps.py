"""Capital forms. Every function takes a Ctx so the same construction also
draws the small-capital shaped Cyrillic lowercase (в, г, д, ж, к, л ...)."""

from .geom import U, rect, rrect, ring, para, poly, diag_width, line_x_at
from .ctx import (G, bowl_open_left, c_shape, solve_dw, edge_para, band,
                  k_arms)


def _bar(x0, x1, yc, th):
    return rect(x0, yc - th / 2.0, x1, yc + th / 2.0)


def bowl_h(c):
    """Height of the bowl of P, Р, Ь, Б, R (bigger in heavy weights)."""
    return c.h * (0.6 + 0.12 * c.p.t)


# --- straight letters -------------------------------------------------------

def H(c, x=390):
    w = c.w(2, x)
    ym = c.h * 0.51
    s = U(rect(0, 0, c.V, c.h), rect(w - c.V, 0, w, c.h),
          _bar(c.V - 1, w - c.V + 1, ym, c.H))
    return G(s, w)


def I(c):
    return G(rect(0, 0, c.V, c.h), c.V)


def E(c, x=300, bottom=True, mid=0.9):
    w = c.w(2, x)
    h, V, H3, Hm = c.h, c.V, c.H3, c.Hm
    ym = h * 0.505
    wm = V + (w - V) * mid
    parts = [rect(0, 0, V, h), rect(0, h - H3, w, h),
             _bar(0, wm, ym if bottom else ym - H3 * 0.1, Hm)]
    if bottom:
        parts.append(rect(0, 0, w, H3))
    return G(U(*parts), w, 1, 0.55)


def F(c):
    g = E(c, x=280, bottom=False, mid=0.86)
    return G(g.shape, g.w, 1, 0.5)


def L(c):
    w = c.w(2, 250)
    return G(U(rect(0, 0, c.V, c.h), rect(0, 0, w, c.H)), w, 1, 0.4)


def Ge(c):  # Г
    w = c.w(2, 240)
    return G(U(rect(0, 0, c.V, c.h), rect(0, c.h - c.H, w, c.h)), w, 1, 0.45)


def Gheup(c):  # Ґ
    g = Ge(c)
    up = c.h * 0.17
    s = g.shape | rect(g.w - c.V * 0.9, c.h - c.H, g.w, c.h + up)
    return G(s, g.w, 1, 0.6)


def T(c, x=330):
    w = c.w(2, x)
    cx = w / 2.0
    s = U(rect(0, c.h - c.H, w, c.h), rect(cx - c.V / 2, 0, cx + c.V / 2, c.h))
    return G(s, w, 0.35, 0.35)


def Pe(c, x=390):  # П
    w = c.w(2, x)
    s = U(rect(0, 0, c.V, c.h), rect(w - c.V, 0, w, c.h),
          rect(0, c.h - c.H, w, c.h))
    return G(s, w)


def Sha(c, x=230, tail=False):  # Ш / Щ
    V = c.V
    cw = c.u(x)
    w = 3 * V + 2 * cw
    parts = [rect(0, 0, V, c.h), rect(V + cw, 0, 2 * V + cw, c.h),
             rect(w - V, 0, w, c.h), rect(0, 0, w, c.H)]
    rw = w
    if tail:
        ext = 0.3 * V + c.u(30)
        rw = w + ext
        parts.append(rect(0, 0, rw, c.H))
        parts.append(rect(rw - V * 0.9, -c.tail, rw, c.H))
    return G(U(*parts), rw, 1, 0.5 if tail else 1)


def Tse(c):  # Ц
    V = c.V
    w = c.w(2, 380)
    ext = 0.3 * V + c.u(30)
    rw = w + ext
    s = U(rect(0, 0, V, c.h), rect(w - V, 0, w, c.h), rect(0, 0, rw, c.H),
          rect(rw - V * 0.9, -c.tail, rw, c.H))
    return G(s, rw, 1, 0.5)


def De(c):  # Д
    V, H, h = c.V, c.H, c.h
    e = 0.28 * V + c.u(34)
    w = 2 * e + c.w(2, 330)
    st = V * 0.9
    s = U(rect(e, 0, e + V, h), rect(w - e - V, 0, w - e, h),
          rect(e, h - H, w - e, h), rect(0, 0, w, H),
          rect(0, -c.tail, st, H), rect(w - st, -c.tail, w, H))
    return G(s, w, 0.6, 0.6)


def El(c):  # Л
    V, H, h = c.V, c.H, c.h
    e = 0.3 * V + c.u(52)
    w = e + c.w(2, 330)
    rf = min(c.R * 0.9, (e + V) * 0.75, h * 0.3)
    foot = rrect(0, 0, e + V, h, br=rf) - rect(-10, H, e, h + 10)
    s = U(foot, rect(e, h - H, w, h), rect(w - V, 0, w, h))
    return G(s, w, 0.45, 1)


def Che(c):  # Ч
    V, H, h = c.V, c.H, c.h
    w = c.w(2, 350)
    yb = h * 0.3 + c.p.t * h * 0.04
    rb = min(c.R, (h - yb) * 0.45, w * 0.3)
    cup = rrect(0, yb, w, h, bl=rb) - rrect(V, yb + H, w - V, h + 10,
                                            bl=c.rin(rb, V, H))
    return G(cup | rect(w - V, 0, w, c.h), w)


def SoftSign(c, bw=None, flag=0):  # Ь (and the body of Ъ, Ы)
    V, H, h = c.V, c.H, c.h
    w = c.w(2, 330) if bw is None else bw
    bh = bowl_h(c)
    rb = min(c.R, bh * 0.45)
    s = U(rect(0, 0, V, h),
          ring(0, 0, w, bh, V, V, H, H, tl=0, bl=0, tr=rb, br=rb, rmin=c.rmin))
    return G(s, w, 1, 0.85)


def HardSign(c):  # Ъ
    e = c.u(120) + c.V * 0.25
    g = SoftSign(c)
    s = U(rect(0, c.h - c.H, e + c.V, c.h), g.shape.moved(e))
    return G(s, g.w + e, 0.35, 0.85)


def Yeru(c):  # Ы
    g = SoftSign(c, bw=c.w(2, 250))
    gap = c.u(120) + c.V * 0.2
    x = g.w + gap
    w = x + c.V
    return G(U(g.shape, rect(x, 0, w, c.h)), w)


def Be(c):  # Б
    V, H, h = c.V, c.H, c.h
    w = c.w(2, 340)
    g = SoftSign(c, bw=w)
    s = U(g.shape, rect(0, h - H, w - c.u(12), h))
    return G(s, w, 1, 0.8)


def Ve(c):  # В / B
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = c.w(2, 345)
    ym = h * 0.53
    wu = w - c.u(26) - V * 0.05
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    ru = min(c.R, (h - ym + Hm / 2) * 0.45)
    lower = ring(0, 0, w, ym + Hm / 2, V, V, H3, Hm, tl=0, bl=0, tr=rl,
                 br=rl, rmin=c.rmin)
    upper = ring(0, ym - Hm / 2, wu, h, V, V, Hm, H3, tl=0, bl=0, tr=ru,
                 br=ru, rmin=c.rmin)
    return G(U(lower, upper), w, 1, 0.85)


def P(c, x=345):
    V, H, h = c.V, c.H, c.h
    w = c.w(2, x)
    bh = bowl_h(c)
    rb = min(c.R, bh * 0.45)
    s = U(rect(0, 0, V, h),
          ring(0, h - bh, w, h, V, V, H, H, tl=0, bl=0, tr=rb, br=rb,
               rmin=c.rmin))
    return G(s, w, 1, 0.85)


def R(c):
    V, H, h = c.V, c.H, c.h
    g = P(c, x=345)
    w = g.w
    bh = bowl_h(c)
    yb = h - bh
    ytop = yb + H * 0.5
    xl = V + (w - 2 * V) * 0.32
    dw = solve_dw(c.dt, lambda d: w - d - xl, ytop)
    leg = para(w - dw, w, 0, xl, xl + dw, ytop)
    return G(g.shape | leg, w, 1, 0.3)


def Ya(c):  # Я
    g = R(c)
    return G(g.shape.mirror_x(g.w / 2.0), g.w, 0.3, 1)


def D(c):
    w = c.w(2, 385)
    s = ring(0, 0, w, c.h, c.V, c.V, c.H, c.H, tl=0, bl=0, tr=c.R, br=c.R,
             rmin=c.rmin)
    return G(s, w, 1, 0.85)


def O(c, x=400):
    w = c.w(2, x)
    s = ring(0, 0, w, c.h, c.V, c.V, c.H, c.H, r=c.R, rmin=c.rmin)
    return G(s, w, 0.85, 0.85)


def Q(c):
    g = O(c)
    w, h, V, H = g.w, c.h, c.V, c.H
    t = c.H * 1.0
    yb, yt = -h * 0.12, H + h * 0.12
    x0 = w - V - c.u(70)
    dw = diag_width(t * 1.1, (yt - yb) * 0.9 + t, yt - yb)
    tail = para(x0 + (yt - yb) * 0.9, x0 + (yt - yb) * 0.9 + dw, yb,
                x0, x0 + dw, yt)
    return G(g.shape | tail, w, 0.85, 0.85)


def C(c, x=372):
    w = c.w(2, x)
    s = c_shape(c, 0, 0, w, c.h, c.V, c.H, c.H, c.R)
    return G(s, w, 0.85, 0.55)


def G_(c):
    V, H, h, R = c.V, c.H, c.h, c.R
    w = c.w(2, 386)
    s = ring(0, 0, w, h, V, V, H, H, r=R, rmin=c.rmin, nofloor=("tr",))
    ytop = h * 0.5 + c.Hm * 0.5
    hi = h - max(R, H)
    s = s - rect(w - V - 1, ytop, w + 100, hi)
    s = s | rect(w * 0.5, ytop - c.Hm, w - V + 1, ytop)
    return G(s, w, 0.85, 0.9)


def Ereversed(c):  # Э
    V, Hm, h = c.V, c.Hm, c.h
    w = c.w(2, 372)
    s = c_shape(c, 0, 0, w, h, V, c.H, c.H, c.R).mirror_x(w / 2.0)
    s = s | _bar(w * 0.36, w - V + 1, h * 0.505, Hm)
    return G(s, w, 0.55, 0.85)


def Ye(c):  # Є
    V, Hm, h = c.V, c.Hm, c.h
    w = c.w(2, 372)
    s = c_shape(c, 0, 0, w, h, V, c.H, c.H, c.R)
    s = s | _bar(V - 1, w * 0.64, h * 0.505, Hm)
    return G(s, w, 0.85, 0.55)


def Ze(c):  # З
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = c.w(2, 330)
    ym = h * 0.53
    wu = w - c.u(24) - V * 0.05
    ru = min(c.R, (h - ym + Hm / 2) * 0.45)
    rl = min(c.R, (ym + Hm / 2) * 0.45)
    s = U(bowl_open_left(c, 0, ym - Hm / 2, wu, h, V, Hm, H3, ru, ru),
          bowl_open_left(c, 0, 0, w, ym + Hm / 2, V, H3, Hm, rl, rl))
    s = s - rect(-10, ym - Hm / 2 - 1, w * 0.3, ym + Hm / 2 + 1)
    return G(s, w, 0.55, 0.85)


def S_(c, x=345):
    V, H3, Hm, h = c.V, c.H3, c.Hm, c.h
    w = c.w(2, x)
    ym = h * 0.52
    wu = w - c.u(18) - V * 0.04
    ru = min(c.R, (h - ym + Hm / 2) * 0.42)
    rl = min(c.R, (ym + Hm / 2) * 0.42)
    k = 0.5
    up = ring(0, ym - Hm / 2, wu, h, V, V, Hm, H3, r=ru, rmin=c.rmin,
              nofloor=("tr", "br"))
    up = up - rect(max(wu - ru - 1, V + 1), ym - Hm / 2 - 1, wu + 100,
                   h - max(ru * k, H3))
    lo = ring(0, 0, w, ym + Hm / 2, V, V, H3, Hm, r=rl, rmin=c.rmin,
              nofloor=("tl", "bl"))
    lo = lo - rect(-100, max(rl * k, H3), min(rl + 1, w - V - 1),
                   ym + Hm / 2 + 1)
    return G(up | lo, w, 0.75, 0.75)


def U_(c, x=390):  # Latin U
    V, H, h, R = c.V, c.H, c.h, c.R
    w = c.w(2, x)
    s = rrect(0, 0, w, h, bl=R, br=R) - rrect(V, H, w - V, h + 10,
                                              bl=c.rin(R, V, H),
                                              br=c.rin(R, V, H))
    return G(s, w)


def J(c):
    V, H, h, R = c.V, c.H, c.h, c.R
    w = c.w(2, 320)
    s = rrect(0, 0, w, h, bl=R, br=R) - rrect(V, H, w - V, h + 10,
                                              bl=c.rin(R, V, H),
                                              br=c.rin(R, V, H))
    s = s - rect(-10, max(R, H) + h * 0.12, V + 1, h + 10)
    return G(s, w, 0.6, 1)


def Je_cyr(c):  # Ј
    return J(c)


def Ef(c):  # Ф
    V, H, h = c.V, c.H, c.h
    cw = c.u(195)
    w = 3 * V + 2 * cw
    yb, yt = h * 0.07, h * 0.93
    rb = min(c.R, (yt - yb) * 0.45)
    bowl = ring(0, yb, w, yt, V, V, H, H, r=rb, rmin=c.rmin)
    cx = w / 2.0
    return G(bowl | rect(cx - V / 2, 0, cx + V / 2, h), w, 0.85, 0.85)


def Yu(c):  # Ю
    V, H, h = c.V, c.H, c.h
    e = c.u(70) + V * 0.15
    o = O(c, x=320)
    x0 = V + e
    s = U(rect(0, 0, V, h), _bar(V - 1, x0 + 10, h * 0.51, H),
          o.shape.moved(x0))
    return G(s, x0 + o.w, 1, 0.85)


def Ii(c, x=394):  # И
    V, h = c.V, c.h
    w = c.w(2, x)
    dw = diag_width(c.dt, w, h)
    s = U(rect(0, 0, V, h), rect(w - V, 0, w, h), para(0, dw, 0, w - dw, w, h))
    return G(s, w)


def N(c, x=394):
    g = Ii(c, x)
    return G(g.shape.mirror_x(g.w / 2.0), g.w)


def K(c, x=410):
    V, h = c.V, c.h
    w = c.w(2, x)
    arms, dw = k_arms(c, V * 0.82, w, h)
    s = U(rect(0, 0, V, h), arms) & band(0, h)
    return G(s, w, 1, 0.2)


def Zhe(c):  # Ж
    V, h = c.V, c.h
    half = c.w(1.5, 380)
    w = 2 * half + V
    cx = w / 2.0
    arms, dw = k_arms(c, V * 0.82, half + V, h)
    right = arms.moved(cx - V / 2.0)
    left = right.mirror_x(cx)
    s = U(rect(cx - V / 2, 0, cx + V / 2, h), right, left) & band(0, h)
    return G(s, w, 0.2, 0.2)


def M(c, x=490):
    V, h = c.V, c.h
    w = c.w(2, x)
    cx = w / 2.0
    t = c.dt * 0.92
    dw = solve_dw(t, lambda d: cx - d / 2.0, h)
    left = para(cx - dw / 2, cx + dw / 2, 0, 0, dw, h)
    s = U(rect(0, 0, V, h), rect(w - V, 0, w, h), left,
          left.mirror_x(cx))
    return G(s, w)


def V_(c, x=440):
    h = c.h
    w = c.w(2, x)
    cx = w / 2.0
    dw = solve_dw(c.dt, lambda d: cx - d / 2.0, h)
    left = para(cx - dw / 2, cx + dw / 2, 0, 0, dw, h)
    return G(U(left, left.mirror_x(cx)), w, 0.15, 0.15)


def A(c, x=440):
    h = c.h
    w = c.w(2, x)
    cx = w / 2.0
    dw = solve_dw(c.dt, lambda d: cx - d / 2.0, h)
    left = para(0, dw, 0, cx - dw / 2, cx + dw / 2, h)
    hull = poly([(0, 0), (cx - dw / 2, h), (cx + dw / 2, h), (w, 0)])
    yb = h * 0.2
    bar = rect(0, yb, w, yb + c.Hm) & hull
    return G(U(left, left.mirror_x(cx), bar), w, 0.15, 0.15)


def W(c, x=760):
    h = c.h
    w = c.w(2, x)
    cx = w / 2.0
    t = c.dt * 0.9
    q = cx * 0.5
    dw = solve_dw(t, lambda d: q - d / 2.0, h)
    outer = para(q - dw / 2, q + dw / 2, 0, 0, dw, h)
    inner = para(q - dw / 2, q + dw / 2, 0, cx - dw / 2, cx + dw / 2, h)
    half = U(outer, inner)
    return G(U(half, half.mirror_x(cx)), w, 0.15, 0.15)


def X(c, x=430):
    h = c.h
    w = c.w(2, x)
    dw = diag_width(c.dt, w, h)
    s = U(para(0, dw, 0, w - dw, w, h), para(w - dw, w, 0, 0, dw, h))
    return G(s, w, 0.2, 0.2)


def Y(c, x=430):
    V, h = c.V, c.h
    w = c.w(2, x)
    cx = w / 2.0
    ys = h * 0.4
    xs = cx - V / 2.0
    dw = solve_dw(c.dt, lambda d: xs - 0 + d * 0.0, h - ys)
    left = edge_para(0, h, xs, ys, dw, ys - h * 0.3, h)
    arms = U(left, left.mirror_x(cx))
    clip = U(rect(-10, ys, w + 10, h), rect(xs, 0, xs + V, h))
    s = (arms & clip) | rect(xs, 0, xs + V, ys + 1)
    return G(s, w, 0.15, 0.15)


def Ucyr(c, x=400, depth=0):  # У (and the shape of у)
    h = c.h
    w = c.w(2, x)
    y0 = -depth
    t = c.dt
    xb = c.u(20)
    dw = solve_dw(t, lambda d: (w - d) - xb, h - y0)
    main = para(xb, xb + dw, y0, w - dw, w, h)
    # the short arm joins the main stroke a little above the baseline
    yj = h * 0.22 if depth == 0 else 0
    xj = line_x_at(xb + dw / 2, y0, w - dw / 2, h, yj)
    dwa = solve_dw(t * 0.97, lambda d: xj - d / 2.0, h - yj)
    arm = edge_para(0, h, xj - dwa / 2.0, yj, dwa, yj, h)
    clip = rect(-10, y0, w + 10, h)
    s = U(main, arm & clip) & band(y0, h)
    return G(s, w, 0.15, 0.15)


def Z(c, x=360):
    V, H, h = c.V, c.H3, c.h
    w = c.w(2, x)
    dw = diag_width(c.dt, w, h - 2 * H)
    s = U(rect(0, h - H, w, h), rect(0, 0, w, H),
          para(0, dw, H - 1, w - dw, w, h - H + 1))
    return G(s, w, 0.6, 0.6)
