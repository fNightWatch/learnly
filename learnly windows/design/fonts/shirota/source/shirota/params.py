"""Design parameters for every weight x width combination.

Everything that changes between styles is derived here from two inputs:
the vertical stem thickness of the weight and the width factor of the width.
"""

UPM = 1000
CAP = 700
XH = 540
ASC = 750
DESC = -210

# (style name, usWeightClass, vertical stem in the Expanded width)
WEIGHTS = [
    ("Thin", 100, 22),
    ("ExtraLight", 200, 42),
    ("Light", 300, 66),
    ("Regular", 400, 94),
    ("Medium", 500, 122),
    ("SemiBold", 600, 154),
    ("Bold", 700, 188),
    ("ExtraBold", 800, 225),
    ("Black", 900, 262),
]

# (family suffix, wdth axis value, usWidthClass, counter factor, stem factor)
WIDTHS = [
    ("", 100, 5, 1.00, 0.80),
    ("Wide", 125, 7, 1.36, 0.90),
    ("Expanded", 150, 8, 1.75, 1.00),
]

V_MIN, V_MAX = WEIGHTS[0][2], WEIGHTS[-1][2]
V_REG = 94


class Params:
    def __init__(self, weight, width):
        wname, wclass, vexp = weight
        sfx, wdth, wclass_w, f, stemf = width
        self.weight_name = wname
        self.weight_class = wclass
        self.width_name = sfx or "Normal"
        self.width_suffix = sfx
        self.wdth = wdth
        self.width_class = wclass_w
        self.f = f

        t = (vexp - V_MIN) / (V_MAX - V_MIN)
        self.t = t
        self.capH, self.xH, self.asc, self.desc = CAP, XH, ASC, DESC

        # Stems. Horizontals get thinner relative to verticals as weight grows.
        self.V = vexp * stemf
        self.H = self.V * (0.93 - 0.24 * t)
        # Counters shrink as stems get heavier so that black weights do not
        # become absurdly wide.
        self.g = 1.0 - 1.1 * (vexp - V_REG) / CAP

        # Bars in letters with three horizontals (E, B, 8, e, a, s ...).
        cmin_cap = 0.15 * CAP
        self.H3 = min(self.H * 0.95, (CAP - 2 * cmin_cap) / 3.0)
        self.Vl = self.V * 0.95
        self.Hl = self.H * 0.93
        cmin_x = 0.165 * XH
        self.H3l = min(self.Hl * 0.92, (XH - 2 * cmin_x) / 3.0)

        # Corner radii.
        self.R = 150 + 32 * (f - 1) / 0.75
        self.Rl = self.R * 0.82
        self.rmin = 0.2 * self.R

        # Diagonal stroke thickness (perpendicular), a bit lighter than stems.
        self.dt = self.V * 0.86
        self.dtl = self.Vl * 0.86

        # Default sidebearing for straight sides, proportional to the counter
        # of H so spacing tracks the rhythm of each width and weight.
        self.sb = 0.07 * (395 * f * self.g) + 30

        # Punctuation dot.
        self.dot = self.V + 22 * (1 - t) + 6

        # Accent geometry.
        self.acc_gap = 0.09 * CAP + 0.1 * self.H
        self.acc_h = 0.14 * CAP + 0.2 * self.H

    @property
    def family(self):
        return "Shirota" + (" " + self.width_suffix if self.width_suffix else "")

    @property
    def ps_family(self):
        return "Shirota" + self.width_suffix

    def __repr__(self):
        return f"<Params {self.family} {self.weight_name} V={self.V:.0f} H={self.H:.0f}>"


def all_params():
    return [Params(w, d) for d in WIDTHS for w in WEIGHTS]
