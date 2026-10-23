"""Per-case drawing context and shared construction helpers."""

import math

from .geom import S, U, rect, rrect, ring, para, poly, diag_width, line_x_at


class Glyph:
    """Outline plus spacing intent.

    ``shape`` is drawn from x=0 to x=``w``; ``l`` and ``r`` are sidebearing
    factors (multiples of the style's default sidebearing) unless an absolute
    ``lsb``/``rsb`` is given.
    """

    __slots__ = ("shape", "w", "l", "r", "lsb", "rsb")

    def __init__(self, shape, w, l=1.0, r=1.0, lsb=None, rsb=None):
        self.shape = shape
        self.w = w
        self.l = l
        self.r = r
        self.lsb = lsb
        self.rsb = rsb


G = Glyph


class Ctx:
    """Metrics for drawing either capital-height or x-height forms."""

    def __init__(self, p, case="cap"):
        self.p = p
        self.case = case
        if case == "cap":
            self.h = p.capH
            self.V, self.H, self.H3 = p.V, p.H, p.H3
            self.R = p.R
            self.cs = 1.0
            self.dt = p.dt
            self.rmin = p.rmin
            self.tail = 0.19 * p.capH
        else:
            self.h = p.xH
            self.V, self.H, self.H3 = p.Vl, p.Hl, p.H3l
            self.R = p.Rl
            self.cs = 0.76
            self.dt = p.dtl
            self.rmin = p.rmin * 0.85
            self.tail = -p.desc * 0.78
        self.Hm = self.H3 * 0.94
        self.asc, self.desc, self.xh, self.cap = p.asc, p.desc, p.xH, p.capH

    # Horizontal space that scales with the width and weight of the style.
    def u(self, x):
        return x * self.p.f * self.p.g * self.cs

    def w(self, n, x):
        return n * self.V + self.u(x)

    def rin(self, R, sx, sy, floor=True):
        f = self.rmin if floor else 0
        return (max(R - sx, f), max(R - sy, f))


# ---------------------------------------------------------------------------
# Reusable constructions


def bowl_open_left(c, x0, y0, x1, y1, sv, sb, st, rtr, rbr):
    """Right-hand bowl with no left stroke ("ↄ" shape) as used by 3, З, B."""
    outer = rrect(x0, y0, x1, y1, tl=0, bl=0, tr=rtr, br=rbr)
    inner = rrect(x0 - 100, y0 + sb, x1 - sv, y1 - st,
                  tl=0, bl=0, tr=c.rin(rtr, sv, st), br=c.rin(rbr, sv, sb))
    return outer - inner


def c_shape(c, x0, y0, x1, y1, sv, sb, st, R, open_side="r", Rl=None, k=1.0):
    """A 'C': rounded ring with the aperture cut through one vertical side.

    The arms wrap round the outer corners and end with horizontal cuts, so
    light weights read as a squarish C and heavy weights open into a slot.
    ``k`` < 1 cuts the terminals part-way round the corner for a wider
    aperture.
    """
    Rl = R if Rl is None else Rl
    if open_side == "r":
        s = ring(x0, y0, x1, y1, sv, sv, sb, st, tl=Rl, bl=Rl, tr=R, br=R,
                 rmin=c.rmin, nofloor=("tr", "br"))
        lo, hi = y0 + max(R * k, sb), y1 - max(R * k, st)
        xc = x1 - sv - 1 if k >= 1 else max(x1 - R - 1, x0 + sv + 1)
        if hi > lo:
            s = s - rect(xc, lo, x1 + 100, hi)
    else:
        s = ring(x0, y0, x1, y1, sv, sv, sb, st, tl=Rl, bl=Rl, tr=R, br=R,
                 rmin=c.rmin, nofloor=("tl", "bl"))
        lo, hi = y0 + max(Rl * k, sb), y1 - max(Rl * k, st)
        xc = x0 + sv + 1 if k >= 1 else min(x0 + Rl + 1, x1 - sv - 1)
        if hi > lo:
            s = s - rect(x0 - 100, lo, xc, hi)
    return s


def solve_dw(t, dx_of, dy):
    """Horizontal width of a diagonal stroke of perpendicular thickness ``t``
    whose centre-line horizontal run ``dx_of(dw)`` depends on its width."""
    dy = abs(dy)
    dw = t
    for _ in range(16):
        dw = t * math.hypot(max(dx_of(dw), 0.0), dy) / dy
    return dw


def edge_para(xa, ya, xb, yb, dw, y_lo, y_hi, side="left"):
    """Stroke whose left (or right) edge is the line through (xa,ya)-(xb,yb),
    extended/clipped to the band [y_lo, y_hi], with horizontal width dw."""
    xl_lo = line_x_at(xa, ya, xb, yb, y_lo)
    xl_hi = line_x_at(xa, ya, xb, yb, y_hi)
    if side == "left":
        return para(xl_lo, xl_lo + dw, y_lo, xl_hi, xl_hi + dw, y_hi)
    return para(xl_lo - dw, xl_lo, y_lo, xl_hi - dw, xl_hi, y_hi)


def band(y0, y1, x0=-2000, x1=4000):
    return rect(x0, y0, x1, y1)


def k_arms(c, xa, w, h, y0=0, t=None, ym=None):
    """The two arms of K/Ж/к: they leave the stem at mid height (``xa`` is the
    left edge of the arms at the junction) and end flat at top and bottom."""
    t = c.dt if t is None else t
    ym = (y0 + h) / 2.0 if ym is None else ym
    up = h - ym
    dw = solve_dw(t, lambda d: (w - d) - xa, up)
    over = c.H * 0.9
    upper = edge_para(xa, ym, w - dw, h, dw, ym - over, h)
    dwl = solve_dw(t * 1.03, lambda d: (w - d) - xa, ym - y0)
    lower = edge_para(xa, ym, w - dwl, y0, dwl, y0, ym + over)
    # keep the overlap inside the stem so it never pokes out on the left
    keep = rect(xa - c.V * 0.6, y0 - 10, w + 100, h + 10)
    return U(upper, lower) & keep, dw


def dieresis_dots(c, cx, y, size, gap):
    return U(rect(cx - gap / 2 - size, y, cx - gap / 2, y + size),
             rect(cx + gap / 2, y, cx + gap / 2 + size, y + size))
