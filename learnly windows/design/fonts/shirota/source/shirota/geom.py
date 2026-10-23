"""Shape primitives and boolean operations used to draw every glyph.

All coordinates are font units, y pointing up. Shapes are wrappers around
skia-pathops paths so that glyphs can be composed with ``|`` (union),
``-`` (difference) and ``&`` (intersection).
"""

import math

import pathops
from pathops import Path, PathOp

# Bezier handle factor for rounded corners. 0.5523 draws a circular arc;
# a slightly larger value gives the softer "squircle" corners of the design.
KAPPA = 0.6


class S:
    __slots__ = ("p",)

    def __init__(self, path=None):
        self.p = path if path is not None else Path()

    def __or__(self, other):
        return S(pathops.op(self.p, other.p, PathOp.UNION, clockwise=True))

    def __sub__(self, other):
        return S(pathops.op(self.p, other.p, PathOp.DIFFERENCE, clockwise=True))

    def __and__(self, other):
        return S(pathops.op(self.p, other.p, PathOp.INTERSECTION, clockwise=True))

    def transformed(self, xx=1, yx=0, xy=0, yy=1, dx=0, dy=0):
        # skia matrix: x' = scaleX*x + skewX*y + tx ; y' = skewY*x + scaleY*y + ty
        p = self.p.transform(scaleX=xx, skewX=xy, skewY=yx, scaleY=yy,
                             translateX=dx, translateY=dy)
        return S(pathops.simplify(p, clockwise=True))

    def moved(self, dx=0, dy=0):
        return self.transformed(dx=dx, dy=dy)

    def mirror_x(self, axis):
        """Mirror horizontally around the vertical line x = axis."""
        return self.transformed(xx=-1, dx=2 * axis)

    def mirror_y(self, axis):
        """Mirror vertically around the horizontal line y = axis."""
        return self.transformed(yy=-1, dy=2 * axis)

    def rotated180(self, cx, cy):
        return self.transformed(xx=-1, yy=-1, dx=2 * cx, dy=2 * cy)

    def bounds(self):
        if not list(self.p.contours):
            return None
        return self.p.bounds

    def simplified(self):
        return S(pathops.simplify(self.p, clockwise=True))


def U(*shapes):
    """Union of any number of shapes (None entries are ignored)."""
    out = S()
    for s in shapes:
        if s is None:
            continue
        if isinstance(s, (list, tuple)):
            s = U(*s)
        out = out | s
    return out


def _corner(v, w, h):
    if v is None:
        v = 0
    if isinstance(v, tuple):
        rx, ry = v
    else:
        rx = ry = v
    rx = max(0.0, min(rx, w / 2.0))
    ry = max(0.0, min(ry, h / 2.0))
    if rx < 0.5 or ry < 0.5:
        return 0.0, 0.0
    return rx, ry


def rrect(x0, y0, x1, y1, r=0, tl=None, tr=None, br=None, bl=None, k=KAPPA):
    """Rectangle with independently rounded corners.

    ``r`` is the default radius; ``tl``/``tr``/``br``/``bl`` override it.
    A radius may be a number or an ``(rx, ry)`` tuple.
    """
    if x1 < x0:
        x0, x1 = x1, x0
    if y1 < y0:
        y0, y1 = y1, y0
    w, h = x1 - x0, y1 - y0
    if w <= 0 or h <= 0:
        return S()
    tl = _corner(r if tl is None else tl, w, h)
    tr = _corner(r if tr is None else tr, w, h)
    br = _corner(r if br is None else br, w, h)
    bl = _corner(r if bl is None else bl, w, h)
    c = 1 - k
    p = Path()
    pen = p.getPen()
    pen.moveTo((x0, y0 + bl[1]))
    pen.lineTo((x0, y1 - tl[1]))
    if tl[0]:
        pen.curveTo((x0, y1 - tl[1] * c), (x0 + tl[0] * c, y1), (x0 + tl[0], y1))
    pen.lineTo((x1 - tr[0], y1))
    if tr[0]:
        pen.curveTo((x1 - tr[0] * c, y1), (x1, y1 - tr[1] * c), (x1, y1 - tr[1]))
    pen.lineTo((x1, y0 + br[1]))
    if br[0]:
        pen.curveTo((x1, y0 + br[1] * c), (x1 - br[0] * c, y0), (x1 - br[0], y0))
    pen.lineTo((x0 + bl[0], y0))
    if bl[0]:
        pen.curveTo((x0 + bl[0] * c, y0), (x0, y0 + bl[1] * c), (x0, y0 + bl[1]))
    pen.closePath()
    return S(pathops.simplify(p, clockwise=True))


def rect(x0, y0, x1, y1):
    return rrect(x0, y0, x1, y1, 0)


def poly(pts):
    p = Path()
    pen = p.getPen()
    pen.moveTo(pts[0])
    for pt in pts[1:]:
        pen.lineTo(pt)
    pen.closePath()
    return S(pathops.simplify(p, clockwise=True))


def para(xb0, xb1, yb, xt0, xt1, yt):
    """Quadrilateral with a horizontal bottom edge [xb0, xb1] at ``yb`` and a
    horizontal top edge [xt0, xt1] at ``yt`` -- the basic diagonal stroke."""
    return poly([(xb0, yb), (xt0, yt), (xt1, yt), (xb1, yb)])


def diag_width(t, span, dy):
    """Horizontal width of a diagonal stroke with perpendicular thickness
    ``t`` whose outer edges cover a horizontal ``span`` over height ``dy``."""
    dy = abs(dy)
    dw = t
    for _ in range(12):
        dw = t * math.hypot(max(span - dw, 0.0), dy) / dy
    return dw


def stroke(x0, y0, x1, y1, t):
    """Diagonal stroke between two centre points with horizontal end cuts."""
    dx, dy = x1 - x0, y1 - y0
    hw = t * math.hypot(dx, dy) / abs(dy) / 2.0
    if y1 < y0:
        x0, y0, x1, y1 = x1, y1, x0, y0
    return para(x0 - hw, x0 + hw, y0, x1 - hw, x1 + hw, y1)


def line_x_at(x0, y0, x1, y1, y):
    """x coordinate of the line through two points at height y."""
    if y1 == y0:
        return x0
    return x0 + (x1 - x0) * (y - y0) / (y1 - y0)


def ring(x0, y0, x1, y1, sl, sr, sb, st, r=0, tl=None, tr=None, br=None,
         bl=None, rmin=0, nofloor=()):
    """Rounded rectangle with a concentric counter (an 'O' shaped bowl).

    ``sl``/``sr``/``sb``/``st`` are the stroke thicknesses of the left, right,
    bottom and top sides. Inner corner radii follow the outer ones offset by
    the stroke, never going below ``rmin`` (except for corners listed in
    ``nofloor``, which may become sharp so that apertures cut cleanly).
    """
    radii = {}
    for name, v in (("tl", tl), ("tr", tr), ("br", br), ("bl", bl)):
        v = r if v is None else v
        if isinstance(v, tuple):
            radii[name] = v
        else:
            radii[name] = (v, v)
    outer = rrect(x0, y0, x1, y1, tl=radii["tl"], tr=radii["tr"],
                  br=radii["br"], bl=radii["bl"])
    side = {"tl": (sl, st), "tr": (sr, st), "br": (sr, sb), "bl": (sl, sb)}
    inner = {}
    for name, (rx, ry) in radii.items():
        if rx <= 0 or ry <= 0:
            inner[name] = 0
            continue
        sx, sy = side[name]
        floor = 0 if name in nofloor else rmin
        inner[name] = (max(rx - sx, floor), max(ry - sy, floor))
    if x1 - sr <= x0 + sl or y1 - st <= y0 + sb:
        return outer
    counter = rrect(x0 + sl, y0 + sb, x1 - sr, y1 - st, tl=inner["tl"],
                    tr=inner["tr"], br=inner["br"], bl=inner["bl"])
    return outer - counter
