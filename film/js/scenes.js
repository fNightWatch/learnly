/* СТРАТЕГИЯ — сцены. Каждый кадр — чистая функция времени t (секунды),
   поэтому фильм одинаково играется в браузере и рендерится покадрово в MP4. */
(function () {
  'use strict';
  const F = window.F;
  const { clamp, lerp, seg, ease, win, TAU } = F;
  const C = F.C;
  let S, D;
  const R = {};

  // ───────────────────────── помощники ─────────────────────────
  const add = (ctx) => (ctx.globalCompositeOperation = 'lighter');
  const norm = (ctx) => (ctx.globalCompositeOperation = 'source-over');
  const pad3 = (n) => String(n).padStart(3, '0');
  function hud(ctx, str, x, y, o = {}) {
    return F.text(ctx, str, x, y, Object.assign(
      { family: F.MONO, size: 14, track: 0.25, color: C.steel, alpha: 0.75, align: 'left', weight: 400 }, o));
  }
  function hudBlock(ctx, label, value, x, y, a, col = C.hot, align = 'left') {
    hud(ctx, label, x, y, { size: 13, track: 0.36, alpha: a * 0.75, align });
    hud(ctx, value, x, y + 38, { size: 30, track: 0.08, weight: 500, alpha: a * 0.95, color: col, align });
  }
  function black(ctx, a) {
    if (a <= 0.003) return;
    norm(ctx);
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillStyle = '#04060b';
    ctx.fillRect(-60, -60, 2040, 1200);
  }
  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function brackets(ctx, x, y, half, len, rot, col, a, lw = 1.6) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = F.rgba(col);
    ctx.globalAlpha = a;
    ctx.lineWidth = lw;
    for (let k = 0; k < 4; k++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-half, -half + len);
      ctx.lineTo(-half, -half);
      ctx.lineTo(-half + len, -half);
      ctx.stroke();
    }
    ctx.restore();
  }
  function dotGrid(ctx, a, step = 48, col = C.steel) {
    if (a <= 0.01) return;
    norm(ctx);
    ctx.fillStyle = F.rgba(col);
    ctx.globalAlpha = a * 0.16;
    for (let y = 24; y < 1080; y += step) for (let x = 24; x < 1920; x += step) ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  function ellipseGlow(ctx, x, y, rx, ry, a, spr) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    F.glow(ctx, spr, 0, 0, rx, a);
    ctx.restore();
  }

  // ───────────────────────── подготовка ─────────────────────────
  F.initScenes = function () {
    F.initSprites();
    S = F.S;
    D = F.data = F.buildData();
    const r = F.rng(2024);

    R.stars = [];
    for (let i = 0; i < 1100; i++)
      R.stars.push({ x: (r() * 2 - 1) * 2600, y: (r() * 2 - 1) * 1500, z: r() * 4000, b: Math.pow(r(), 1.6), w: r() });

    // титр из частиц
    R.title = F.sampleText('СТРАТЕГИЯ', { family: F.DISPLAY, weight: 500, size: 150, track: 0.16, step: 3, max: 3800, seed: 3 });
    R.tStart = R.title.map((q) => {
      const ang = r() * TAU;
      return {
        x: 960 + (r() * 2 - 1) * 1150, y: 540 + (r() * 2 - 1) * 680,
        d: ((q[0] + 700) / 1400) * 0.55 + r() * 0.35,
        sw: (r() * 2 - 1) * 160, nx: Math.cos(ang), ny: Math.sin(ang), tw: r() * TAU,
      };
    });

    // Акт I — люди и галактика
    const CW = (R.CW = { x: 380, y: -40, z: 1900 });
    R.dim = [];
    for (let i = 0; i < 1300; i++)
      R.dim.push({
        p: [(r() * 2 - 1) * 2600, (r() * 2 - 1) * 1500, 420 + r() * 3200],
        h: [CW.x + (r() * 2 - 1) * 1300, CW.y + (r() * 2 - 1) * 800, CW.z + (r() * 2 - 1) * 1100],
        b: r(),
      });
    R.bright = [];
    for (let i = 0; i < 72; i++) {
      const arm = i % 2, rr = 40 + Math.pow(r(), 0.8) * 470;
      R.bright.push({
        p: [(r() * 2 - 1) * 2000, (r() * 2 - 1) * 1150, 700 + r() * 2500],
        r: rr, a: arm * Math.PI + rr * 0.0105 + (r() - 0.5) * 0.5, yj: (r() - 0.5) * 40,
        d: r() * 2.2, mag: r(), ph: r() * TAU,
      });
    }
    R.dust = [];
    for (let i = 0; i < 1200; i++) {
      const arm = i % 2, rr = 8 + Math.pow(r(), 0.7) * 560;
      R.dust.push({
        r: rr, a: arm * Math.PI + rr * 0.0105 + (r() - 0.5) * (0.3 + rr / 1300),
        yj: (r() - 0.5) * (24 + 70 * (1 - rr / 560)), b: r(),
      });
    }
    R.tags = [
      [5, 'ОСНОВАТЕЛЬ'], [12, 'ИНЖЕНЕР'], [21, 'ИНВЕСТОР'], [30, 'УЧЁНЫЙ'], [43, 'ДИЗАЙНЕР'], [58, 'ИЗОБРЕТАТЕЛЬ'],
    ];

    // Акт III — график окупаемости
    R.chart = { x: 600, y: 660, w: 760, h: 420 };
    R.cpts = D.tracks.map((tr) => {
      const st = F.trackState(tr, 63.5);
      const rx = 0.07 + r() * 0.86;
      return {
        start: [760 + 0.92 * st.x, 540 + 0.92 * st.y],
        rx: tr.survivor ? 0.3 : rx,
        ry: tr.survivor ? 0.22 : Math.min(0.9, rx * (0.1 + r() * 0.78)),
        ang: r() * TAU,
      };
    });

    // Акт IV — лучи, стена, искры
    R.rays = [];
    for (let i = 0; i < 160; i++)
      R.rays.push({ y0: 170 + r() * 740, a: (r() - 0.5) * 0.95, h: r(), ph: r() * TAU, k: 0.35 + r() * 0.5 });
    R.wall = [];
    for (let i = 0; i < 950; i++) {
      const x = 1560 + (r() - 0.5) * 34, y = 165 + r() * 750;
      const dx = x - 1560, dy = y - 540, d0 = Math.hypot(dx, dy) + 0.001;
      R.wall.push({ x, y, d0, nx: dx / d0, ny: dy / d0, v: 0.6 + r() * 0.8, b: r() });
    }
    R.sparks = [];
    for (let i = 0; i < 300; i++) {
      const back = r() < 0.45;
      R.sparks.push({
        t0: F.T.laser + 0.05 + r() * 8.2, life: 0.45 + r() * 0.9,
        ang: (back ? Math.PI : 0) + (r() - 0.5) * 2.3, sp: 280 + r() * 820, b: r(),
      });
    }

    // Акт VI — знания, люди
    R.glyphs = [];
    const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789';
    for (let i = 0; i < 170; i++) {
      const side = r();
      const sx = side < 0.6 ? 1780 + r() * 120 : 1000 + r() * 780;
      const sy = side < 0.6 ? 260 + r() * 560 : side < 0.8 ? 250 : 830;
      R.glyphs.push({ sx, sy, cx: lerp(sx, 1420, 0.5) + (r() - 0.5) * 380, cy: lerp(sy, 540, 0.5) + (r() - 0.5) * 380, h: r(), sp: 0.25 + r() * 0.3, ch: AL[(r() * AL.length) | 0] });
    }
    R.books = ['СТРАТЕГИЯ', 'ПРОДУКТ', 'ПРОДАЖИ', 'ФИНАНСЫ', 'ЛИДЕРСТВО', 'ПЕРЕГОВОРЫ', 'МАРКЕТИНГ', 'РОСТ'].map((t, i) => ({
      t, w: 190 + r() * 60, h: 24 + r() * 8, dx: (r() - 0.5) * 22,
    }));
    R.hanzi = F.sampleText('机会', { family: F.BRUSH, size: 300, step: 3, max: 3200, seed: 9 });
    R.hStart = R.hanzi.map(() => ({
      x: 1370 + (r() * 2 - 1) * 700, y: 520 + (r() * 2 - 1) * 520, d: r() * 0.9,
      sw: (r() * 2 - 1) * 140, nx: Math.cos(r() * TAU), ny: Math.sin(r() * TAU),
    }));
    R.nodes = [];
    for (let i = 0; i < 19; i++) {
      const a = (i / 19) * TAU + (r() - 0.5) * 0.4, rr = 120 + r() * 210;
      R.nodes.push({ x: 1370 + Math.cos(a) * rr * 1.25, y: 520 + Math.sin(a) * rr * 0.78, s: 0.6 + r() * 0.8, ph: r() * TAU });
    }
    R.edges = [];
    R.nodes.forEach((n, i) => {
      const ds = R.nodes.map((m, j) => [Math.hypot(m.x - n.x, m.y - n.y), j]).filter((q) => q[1] !== i).sort((a, b) => a[0] - b[0]);
      [ds[0][1], ds[1][1], ...(i % 3 === 0 ? [ds[3][1]] : [])].forEach((j) => {
        if (!R.edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) R.edges.push({ a: i, b: j, w: 0.5 + r() * 0.5, t0: r() });
      });
      if (i % 2 === 0) R.edges.push({ a: i, b: -1, w: 0.7 + r() * 0.3, t0: r() });
    });

    // Акт VII — угольки
    R.embers = [];
    for (let i = 0; i < 260; i++)
      R.embers.push({ x: r() * 1920, sp: 50 + r() * 150, off: r() * 1300, sw: 10 + r() * 40, ph: r() * TAU, b: r() });
  };

  // ───────────────────────── звёзды ─────────────────────────
  function drawStars(ctx, camZ, alpha, t, o = {}) {
    if (alpha <= 0.01) return;
    const f = 760, cx = 960, cy = 540, streak = o.streak || 0;
    add(ctx);
    ctx.fillStyle = 'rgb(205,218,255)';
    ctx.strokeStyle = 'rgb(205,218,255)';
    for (const s of R.stars) {
      const z = ((((s.z - camZ) % 4000) + 4000) % 4000) + 30;
      const k = f / z, x = cx + s.x * k, y = cy + s.y * k;
      if (x < -40 || x > 1960 || y < -40 || y > 1120) continue;
      const tw = 0.75 + 0.25 * Math.sin(t * 2.3 + s.w * 40);
      const a = alpha * Math.min(1, (4030 - z) / 1400) * Math.min(1, z / 260) * (0.22 + 0.78 * s.b) * tw;
      const sz = Math.max(0.8, Math.min(4.5, k * 2.6 * (0.4 + s.b)));
      ctx.globalAlpha = a;
      if (streak > 0) {
        const k2 = f / (z + streak);
        ctx.lineWidth = sz * 0.7;
        line(ctx, x, y, cx + s.x * k2, cy + s.y * k2);
      } else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      if (s.b > 0.93) F.glow(ctx, S.hot, x, y, sz * 7, a * 0.55);
    }
  }

  // ───────────────────────── ПРОЛОГ ─────────────────────────
  function prologue(ctx, t) {
    drawStars(ctx, t * 70, seg(t, 4.6, 9.6) * (1 - seg(t, 10.9, 12.8)), t);
    const ig = F.T.ignite;
    if (t >= ig) {
      const age = t - ig, pa = 1 - seg(t, 11.0, 12.3);
      add(ctx);
      F.glow(ctx, S.haloGold, 960, 540, 60 + 760 * ease.out(seg(age, 0, 0.5)), (1 - seg(age, 0.05, 2.8)) * 0.9);
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const p = seg(age, k * 0.25, k * 0.25 + 3.4);
        if (p <= 0 || p >= 1) continue;
        ctx.globalAlpha = (1 - p) * (0.55 - k * 0.13);
        ctx.strokeStyle = F.rgba(k ? C.steel : C.gold);
        ctx.beginPath();
        ctx.arc(960, 540, 20 + ease.out(p) * 1300, 0, TAU);
        ctx.stroke();
      }
      const pulse = 1 + 0.1 * Math.sin(age * 2.6);
      F.glow(ctx, S.gold, 960, 540, 42 * pulse, pa);
      F.glow(ctx, S.haloGold, 960, 540, 210 * pulse, 0.35 * pa);
      F.flare(ctx, 960, 540, 1100, 20, 0.45 * pa * seg(age, 0, 1.2), S.flareGold);
    }
    drawTitle(ctx, t);
  }

  function drawTitle(ctx, t) {
    if (t < 10.7 || t > 17) return;
    const cx = 960, cy = 548;
    const disp = ease.in(seg(t, 15.3, 17));
    add(ctx);
    ctx.fillStyle = F.rgba(C.hot);
    for (let i = 0; i < R.title.length; i++) {
      const q = R.title[i], m = R.tStart[i];
      const p = ease.inOut(seg(t, 11.0 + m.d, 12.6 + m.d));
      const sw = Math.sin(p * Math.PI) * m.sw;
      let x = lerp(m.x, cx + q[0], p) + sw * m.nx;
      let y = lerp(m.y, cy + q[1], p) + sw * m.ny;
      if (disp > 0) {
        x += (x - cx) * disp * 0.5 + m.nx * disp * 160;
        y += (y - cy) * disp * 0.9 - disp * 70 + m.ny * disp * 160;
      }
      const settled = seg(t, 12.6 + m.d, 13.5 + m.d);
      let a = p <= 0 ? 0.28 * seg(t, 10.7, 11.2) : lerp(0.35 + 0.5 * Math.sin(p * Math.PI), 0.16 + 0.2 * Math.sin(t * 5 + m.tw), settled);
      a *= 1 - disp;
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillRect(x - 1, y - 1, 2.1, 2.1);
    }
    const ta = seg(t, 12.7, 13.7) * (1 - seg(t, 15.2, 16.1));
    if (ta > 0) {
      add(ctx);
      F.flare(ctx, 960, cy, 1900, 150, 0.1 * ta, S.flareGold);
      norm(ctx);
      F.text(ctx, 'СТРАТЕГИЯ', cx, cy, { family: F.DISPLAY, weight: 500, size: 150, track: 0.16, color: C.hot, alpha: ta, baseline: 'middle' });
    }
    // блик, проходящий через титр
    const sweep = win(t, 12.7, 13.9, 0.15, 0.35);
    if (sweep > 0) {
      add(ctx);
      const x = lerp(-300, 2220, ease.inOut(seg(t, 12.7, 13.9)));
      F.flare(ctx, x, cy, 1500, 34, sweep);
      F.glow(ctx, S.hot, x, cy, 90, sweep * 0.8);
    }
    const sa = win(t, 13.8, 16.2, 0.8, 0.8);
    if (sa > 0) {
      norm(ctx);
      const w = hud(ctx, 'ФИЛЬМ В СЕМИ АКТАХ', 960, 672, { size: 19, track: 0.7, align: 'center', alpha: sa * 0.85, color: C.gold, reveal: seg(t, 13.8, 15.0) });
      ctx.strokeStyle = F.rgba(C.gold);
      ctx.globalAlpha = sa * 0.45;
      ctx.lineWidth = 1;
      const L = 140 * ease.out(seg(t, 14.0, 15.2));
      line(ctx, 960 - w / 2 - 30 - L, 666, 960 - w / 2 - 30, 666);
      line(ctx, 960 + w / 2 + 22, 666, 960 + w / 2 + 22 + L, 666);
    }
  }

  // ───────────────────────── АКТ I · ГРАВИТАЦИЯ ─────────────────────────
  function galaxy(b, lt, g) {
    const CW = R.CW;
    const ang = b.a + lt * 0.1 + lt * 0.05 * (150 / (b.r + 150));
    const x = Math.cos(ang) * b.r, z = Math.sin(ang) * b.r, y = b.yj;
    const ct = Math.cos(1.12), st = Math.sin(1.12);
    const y2 = y * ct - z * st, z2 = y * st + z * ct;
    const cz = Math.cos(0.38), sz = Math.sin(0.38);
    return [CW.x + x * cz - y2 * sz, CW.y + x * sz + y2 * cz, CW.z + z2];
  }
  const P0 = [-1100, 330, 1300], P1 = [-460, -560, 1500];
  function protoPos(u) {
    const CW = R.CW, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u;
    return [a * P0[0] + b * P1[0] + c * CW.x, a * P0[1] + b * P1[1] + c * CW.y, a * P0[2] + b * P1[2] + c * CW.z];
  }

  function actI(ctx, lt, t) {
    const A = seg(lt, 2.6, 5.0);
    if (A <= 0) return;
    const CW = R.CW;
    const dive = ease.inExpo(seg(lt, 20.0, 23.8));
    const camX = lerp(150 * ease.inOut(seg(lt, 2, 20)), CW.x, dive);
    const camY = lerp(0, CW.y, dive);
    const camZ = lt * 22 + dive * (CW.z - 150 - lt * 22);
    const f = 900;
    const P = (x, y, z) => {
      const dz = z - camZ;
      if (dz < 25) return null;
      const k = f / dz;
      return [960 + (x - camX) * k, 540 + (y - camY) * k, k];
    };
    const g = ease.inOut(seg(lt, 4.5, 14));
    const boost = lt >= 17.5 ? 1 + 0.9 * Math.exp(-(lt - 17.5) * 1.1) : 1;
    add(ctx);

    ctx.fillStyle = F.rgba(C.mist);
    for (const d of R.dim) {
      const q = P(lerp(d.p[0], d.h[0], 0.3 * g), lerp(d.p[1], d.h[1], 0.3 * g), lerp(d.p[2], d.h[2], 0.3 * g));
      if (!q || q[0] < -10 || q[0] > 1930 || q[1] < -10 || q[1] > 1090) continue;
      const sz = Math.min(6, Math.max(0.9, q[2] * 2.4));
      ctx.globalAlpha = Math.min(1, (0.16 + 0.42 * d.b) * Math.min(1, q[2] * 2.2));
      ctx.fillRect(q[0], q[1], sz, sz);
    }

    if (g > 0.01) {
      ctx.fillStyle = F.rgba(C.gold);
      for (const d of R.dust) {
        const w = galaxy(d, lt), q = P(w[0], w[1], w[2]);
        if (!q || q[0] < -10 || q[0] > 1930 || q[1] < -10 || q[1] > 1090) continue;
        const sz = Math.min(8, Math.max(0.9, q[2] * 2.0));
        ctx.globalAlpha = Math.min(1, g * (0.1 + 0.3 * d.b) * boost * (1 + (1 - d.r / 560) * 0.8));
        ctx.fillRect(q[0], q[1], sz, sz);
      }
      // ядро галактики
      const qc = P(CW.x, CW.y, CW.z);
      if (qc) {
        ellipseGlow(ctx, qc[0], qc[1], 520 * qc[2] * 1.6, 230 * qc[2] * 1.6, g * 0.35 * boost, S.haloGold);
        F.glow(ctx, S.haloHot, qc[0], qc[1], 180 * qc[2] * 1.6, g * 0.4 * boost);
      }
    }

    const tagPos = {};
    R.bright.forEach((b, i) => {
      const gi = ease.inOut(seg(lt, 4.5 + b.d, 12.5 + b.d));
      const gw = galaxy(b, lt);
      const dr = 30 * Math.sin(lt * 0.4 + b.ph);
      const q = P(lerp(b.p[0] + dr, gw[0], gi), lerp(b.p[1] + dr * 0.6, gw[1], gi), lerp(b.p[2], gw[2], gi));
      if (!q) return;
      const [x, y, k] = q;
      if (x < -60 || x > 1980 || y < -60 || y > 1140) return;
      const tw = 0.8 + 0.2 * Math.sin(lt * 3 + b.ph);
      const rad = Math.min(160, (7 + 12 * b.mag) * k * 1.5);
      F.glow(ctx, b.mag > 0.5 ? S.hot : S.gold, x, y, rad * 2.2, tw * Math.min(1, boost * 0.95));
      if (b.mag > 0.72) F.starburst(ctx, x, y, rad * 4, 0.55 * tw, C.hot);
      tagPos[i] = q;
    });

    // ты — золотая точка
    const u = ease.inOut(seg(lt, 9.5, 17.5));
    const trailA = seg(lt, 9.5, 10.5);
    if (trailA > 0 && u < 1) {
      ctx.strokeStyle = F.rgba(C.gold);
      let prev = null;
      for (let j = 0; j <= 40; j++) {
        const uu = Math.max(0, u - 0.32 + (j / 40) * 0.32);
        const q = P(...protoPos(uu));
        if (q && prev) {
          ctx.globalAlpha = (j / 40) * 0.8 * trailA;
          ctx.lineWidth = 0.5 + (j / 40) * 3;
          line(ctx, prev[0], prev[1], q[0], q[1]);
        }
        prev = q;
      }
    }
    const pq = P(...protoPos(u));
    if (pq) {
      const pulse = 1 + 0.12 * Math.sin(lt * 3.1);
      const big = lt >= 17.5 ? 1.5 + 0.6 * Math.exp(-(lt - 17.5) * 1.5) : 1;
      const rr = Math.min(400, 30 * pq[2] * 1.6 * pulse * big);
      F.glow(ctx, S.gold, pq[0], pq[1], rr * 1.6, 1);
      F.glow(ctx, S.haloGold, pq[0], pq[1], rr * 5, 0.45);
      F.flare(ctx, pq[0], pq[1], rr * 30, rr * 0.6, 0.3, S.flareGold);
      if (lt < 17.5) {
        hud(ctx, 'ТЫ', pq[0] + 22, pq[1] - 18, { size: 13, track: 0.4, color: C.gold, alpha: A * 0.9 * (1 - seg(lt, 15.5, 17)) });
      }
    }
    // волны прибытия
    if (lt >= 17.5) {
      const qc = P(CW.x, CW.y, CW.z);
      if (qc)
        for (let k = 0; k < 3; k++) {
          const p = seg(lt, 17.5 + k * 0.3, 17.5 + k * 0.3 + 2.6);
          if (p <= 0 || p >= 1) continue;
          ctx.globalAlpha = (1 - p) * 0.6;
          ctx.strokeStyle = F.rgba(k === 1 ? C.steel : C.gold);
          ctx.lineWidth = 1.6;
          ctx.save();
          ctx.translate(qc[0], qc[1]);
          ctx.scale(1, 0.45);
          ctx.beginPath();
          ctx.arc(0, 0, ease.out(p) * 820, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
    }

    // HUD
    norm(ctx);
    const ha = A * win(lt, 4.0, 21.5, 1.0, 1.0);
    if (ha > 0) {
      R.tags.forEach(([bi, name], i) => {
        const q = tagPos[bi];
        if (!q) return;
        const a = ha * win(lt, 6 + i * 1.1, 6 + i * 1.1 + 5.5, 0.5, 0.8);
        if (a <= 0 || q[0] < 140 || q[0] > 1480 || q[1] < 300 || q[1] > 800) return;
        ctx.strokeStyle = F.rgba(C.steel);
        ctx.globalAlpha = a * 0.6;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(q[0] + 9, q[1] - 9);
        ctx.lineTo(q[0] + 46, q[1] - 40);
        ctx.lineTo(q[0] + 62, q[1] - 40);
        ctx.stroke();
        brackets(ctx, q[0], q[1], 11, 5, 0, C.steel, a * 0.7, 1);
        hud(ctx, name, q[0] + 68, q[1] - 35, { size: 13, track: 0.22, alpha: a, reveal: seg(lt, 6 + i * 1.1, 6.8 + i * 1.1) });
      });
      hudBlock(ctx, 'СКОПЛЕНИЕ · ПЛОТНОСТЬ АМБИЦИЙ', '×' + lerp(1, 38, g).toFixed(1), 150, 196, ha, C.gold);
      hudBlock(ctx, 'ОБЪЕКТ · ТЫ', 'ДО ЦЕЛИ ' + String(Math.round((1 - u) * 1840)).padStart(4, '0'), 1770, 196, ha, C.hot, 'right');
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ II · ЭКСПЕРИМЕНТЫ ─────────────────────────
  function drawTracks(ctx, t, mul, s) {
    const lw = 1.5 / s;
    for (const tr of D.tracks) {
      const st = F.trackState(tr, t);
      if (!st) continue;
      const sd = st.dead ? st.sinceDeath : -1;
      let col = tr.hue === 'gold' ? C.gold : C.steel, a = 0.8;
      if (sd >= 0) {
        col = F.mix(col, C.ember, seg(sd, 0, 0.5));
        a = lerp(0.8, 0.13, ease.out(seg(sd, 0.2, 2.8)));
      }
      if (tr.survivor) { col = C.gold; a = 1; }
      a *= mul;
      if (a <= 0.004) continue;
      add(ctx);
      ctx.strokeStyle = F.rgba(col);
      ctx.fillStyle = F.rgba(col);
      ctx.globalAlpha = a;
      ctx.lineWidth = tr.survivor ? lw * 1.8 : lw;
      const n = Math.floor(st.idx);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 1; i <= n; i++) ctx.lineTo(tr.pts[i * 2], tr.pts[i * 2 + 1]);
      ctx.lineTo(st.x, st.y);
      ctx.stroke();
      ctx.globalAlpha = a * 0.6;
      const b = 2.2 / s;
      for (let i = 2; i <= n; i += 3) ctx.fillRect(tr.pts[i * 2] - b / 2, tr.pts[i * 2 + 1] - b / 2, b, b);
      if (!st.dead) {
        F.glow(ctx, tr.hue === 'gold' || tr.survivor ? S.gold : S.steel, st.x, st.y, (tr.survivor ? 34 : 18) / s, mul);
        if (tr.survivor) F.glow(ctx, S.haloGold, st.x, st.y, (110 + 14 * Math.sin(t * 3)) / s, 0.4 * mul);
      } else if (sd < 0.8) F.glow(ctx, S.ember, st.x, st.y, (40 * (1 - sd / 0.8)) / s, mul * (1 - sd / 0.8));
      if (tr.showLabel) {
        const la = (st.dead ? 1 - seg(sd, 0, 0.6) : seg(t - tr.L, 0, 0.3)) * mul;
        if (la > 0.01) {
          ctx.save();
          ctx.translate(st.x, st.y);
          ctx.scale(1 / s, 1 / s);
          norm(ctx);
          hud(ctx, tr.label, 14, -12, { size: 12, track: 0.12, alpha: la * 0.85, color: tr.survivor ? C.gold : C.steel });
          ctx.restore();
        }
      }
    }
  }

  function actII(ctx, lt, t) {
    const A = seg(lt, 3.7, 4.8) * (1 - seg(lt, 22.0, 23.0));
    if (A <= 0) return;
    dotGrid(ctx, A * 0.7);
    const s = lerp(1.18, 0.92, ease.inOut(seg(lt, 3, 22)));
    ctx.save();
    ctx.translate(760, 540);
    ctx.scale(s, s);
    // магнитное поле — концентрические круги
    norm(ctx);
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.lineWidth = 1 / s;
    for (let k = 1; k <= 6; k++) {
      ctx.globalAlpha = 0.05;
      ctx.beginPath();
      ctx.arc(0, 0, k * 170, 0, TAU);
      ctx.stroke();
    }
    drawTracks(ctx, t, 1, s);
    let pulse = 0;
    for (const tr of D.tracks) {
      const d = t - tr.L;
      if (d >= 0 && d < 0.5) pulse += 1 - d / 0.5;
    }
    add(ctx);
    pulse = Math.min(3, pulse);
    F.glow(ctx, S.gold, 0, 0, 40 + 10 * pulse, 1);
    F.glow(ctx, S.haloGold, 0, 0, 170 + 30 * pulse, 0.5);
    ctx.restore();

    norm(ctx);
    const ha = A * seg(lt, 4.2, 5.2);
    if (ha > 0) {
      let launched = 0, dead = 0;
      for (const tr of D.tracks) {
        if (tr.L <= t) launched++;
        if (tr.deathT <= t) dead++;
      }
      hudBlock(ctx, 'ЗАПУЩЕНО', pad3(launched), 150, 196, ha, C.hot);
      hudBlock(ctx, 'АКТИВНО', pad3(launched - dead), 330, 196, ha, C.gold);
      hudBlock(ctx, 'ПОГАСЛО', pad3(dead), 510, 196, ha, C.ember);
      hud(ctx, 'ПУЗЫРЬКОВАЯ КАМЕРА · B = 1,5 Тл', 1770, 196, { size: 12, track: 0.32, alpha: ha * 0.55, align: 'right' });
      hud(ctx, 'ТРЕКИ ПРОЕКТОВ', 1770, 222, { size: 12, track: 0.32, alpha: ha * 0.4, align: 'right' });
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ III · СИГНАЛ ─────────────────────────
  function chartXY(rx, ry) {
    const O = R.chart;
    return [O.x + rx * O.w, O.y - ry * O.h];
  }
  function survivorChart(lt) {
    const u = seg(lt, 9.2, 13.2);
    const e = (Math.exp(4.2 * u) - 1) / (Math.exp(4.2) - 1);
    return [lerp(0.3, 0.36, u), lerp(0.22, 0.96, e), u];
  }

  function actIII(ctx, lt, t) {
    const A = seg(lt, 3.7, 4.7) * (1 - seg(lt, 19.2, 20));
    if (A <= 0) return;
    const ghostA = A * (1 - seg(lt, 4.6, 6.8));
    if (ghostA > 0) {
      ctx.save();
      ctx.translate(760, 540);
      ctx.scale(0.92, 0.92);
      drawTracks(ctx, 63.5, ghostA * 0.8, 0.92);
      ctx.restore();
    }
    dotGrid(ctx, A * 0.5);
    const O = R.chart;
    const ax = A * seg(lt, 3.6, 5.0);
    const lock = seg(lt, 13.2, 15);
    if (ax > 0) {
      norm(ctx);
      // зона отдачи над диагональю
      ctx.fillStyle = F.rgba(C.gold);
      ctx.globalAlpha = ax * (0.025 + 0.05 * lock);
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(O.x, O.y - O.h);
      ctx.lineTo(O.x + O.w, O.y - O.h);
      ctx.closePath();
      ctx.fill();
      const dp = ease.out(seg(lt, 3.6, 4.8));
      ctx.strokeStyle = F.rgba(C.steel);
      ctx.globalAlpha = ax * 0.6;
      ctx.lineWidth = 1.2;
      line(ctx, O.x, O.y, O.x + O.w * dp, O.y);
      line(ctx, O.x, O.y, O.x, O.y - O.h * dp);
      for (let i = 1; i <= 10; i++) {
        if (i / 10 > dp) break;
        ctx.globalAlpha = ax * 0.4;
        line(ctx, O.x + (O.w * i) / 10, O.y, O.x + (O.w * i) / 10, O.y + 7);
        line(ctx, O.x, O.y - (O.h * i) / 10, O.x - 7, O.y - (O.h * i) / 10);
      }
      ctx.setLineDash([6, 8]);
      ctx.globalAlpha = ax * 0.4;
      line(ctx, O.x, O.y, O.x + O.w * dp, O.y - O.h * dp);
      ctx.setLineDash([]);
      hud(ctx, 'РЕСУРСЫ →', O.x + O.w, O.y + 32, { size: 13, track: 0.35, alpha: ax * 0.7, align: 'right' });
      hud(ctx, 'РЕЗУЛЬТАТ ↑', O.x - 4, O.y - O.h - 20, { size: 13, track: 0.35, alpha: ax * 0.7 });
      ctx.save();
      ctx.translate(O.x + O.w * 0.78, O.y - O.h * 0.78 - 12);
      ctx.rotate(Math.atan2(-O.h, O.w));
      hud(ctx, 'ТОЧКА ОКУПАЕМОСТИ', 0, 0, { size: 11, track: 0.3, alpha: ax * 0.5, align: 'center' });
      ctx.restore();
      hud(ctx, 'ЗОНА ОТДАЧИ', O.x + 18, O.y - O.h + 26, { size: 11, track: 0.35, alpha: ax * (0.25 + 0.5 * lock), color: C.gold });
    }

    // точки проектов
    add(ctx);
    const sv = survivorChart(lt);
    D.tracks.forEach((tr, i) => {
      const cp = R.cpts[i];
      const p = ease.inOut(seg(lt, 4.6 + i * 0.022, 6.6 + i * 0.022));
      if (p <= 0) return;
      const [cx, cy] = tr.survivor ? chartXY(sv[0], sv[1]) : chartXY(cp.rx, cp.ry);
      const x = lerp(cp.start[0], cx, p) + Math.sin(p * Math.PI) * 60 * Math.cos(cp.ang);
      const y = lerp(cp.start[1], cy, p) + Math.sin(p * Math.PI) * 60 * Math.sin(cp.ang);
      if (tr.survivor) return;
      const a = A * p * (1 - 0.55 * lock);
      F.glow(ctx, S.ember, x, y, 16, a * 0.55);
      ctx.fillStyle = F.rgba(C.rose);
      ctx.globalAlpha = a * 0.9;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    });

    // выживший взлетает
    const sp = ease.inOut(seg(lt, 4.6 + 40 * 0.022, 6.6 + 40 * 0.022));
    if (sp > 0) {
      const cp = R.cpts[40];
      const [tx, ty] = chartXY(sv[0], sv[1]);
      const x = lerp(cp.start[0], tx, sp), y = lerp(cp.start[1], ty, sp);
      if (sv[2] > 0) {
        ctx.strokeStyle = F.rgba(C.gold);
        let prev = null;
        for (let j = 0; j <= 30; j++) {
          const uu = Math.max(0, sv[2] - 0.45 + (j / 30) * 0.45);
          const e = (Math.exp(4.2 * uu) - 1) / (Math.exp(4.2) - 1);
          const q = chartXY(lerp(0.3, 0.36, uu), lerp(0.22, 0.96, e));
          if (prev) {
            ctx.globalAlpha = A * (j / 30) * 0.9;
            ctx.lineWidth = 1 + (j / 30) * 3.5;
            line(ctx, prev[0], prev[1], q[0], q[1]);
          }
          prev = q;
        }
      }
      const heat = sv[2];
      F.glow(ctx, S.gold, x, y, 22 + 26 * heat, A);
      F.glow(ctx, S.haloGold, x, y, 60 + 160 * heat + 20 * Math.sin(lt * 4), A * (0.25 + 0.4 * heat));
      if (lt >= 13.2) {
        const lk = seg(lt, 13.2, 13.9);
        F.flare(ctx, x, y, 1400, 26, A * (1 - seg(lt, 13.3, 15.5)) * 0.9);
        const half = lerp(110, 30, ease.outExpo(lk));
        norm(ctx);
        brackets(ctx, x, y, half, 12, (1 - ease.out(lk)) * Math.PI * 0.5, C.gold, A * seg(lt, 13.2, 13.4));
        // перекрестие к осям
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = F.rgba(C.gold);
        ctx.globalAlpha = A * 0.45 * seg(lt, 13.6, 14.4);
        ctx.lineWidth = 1;
        line(ctx, x, y + 34, x, O.y);
        line(ctx, x - 34, y, O.x, y);
        ctx.setLineDash([]);
        const pa = A * seg(lt, 13.8, 14.6);
        hud(ctx, 'П-041', x + 52, y - 14, { size: 15, track: 0.2, color: C.gold, alpha: pa, reveal: seg(lt, 13.8, 14.4) });
        hud(ctx, 'ОТДАЧА ×24', x + 52, y + 14, { size: 22, track: 0.1, weight: 500, color: C.hot, alpha: pa, reveal: seg(lt, 14.0, 14.7) });
        const blink = Math.sin(lt * 9) > 0 ? 1 : 0.35;
        add(ctx);
        F.glow(ctx, S.gold, x + 58, y + 37, 9, pa * blink);
        norm(ctx);
        hud(ctx, 'СТАТУС: РАБОТАЕТ', x + 72, y + 42, { size: 12, track: 0.3, color: C.gold, alpha: pa * 0.9, reveal: seg(lt, 14.3, 15.0) });
        hud(ctx, 'ВЛОЖЕНО 1×', x, O.y + 32, { size: 11, track: 0.3, color: C.gold, alpha: pa * 0.7, align: 'center' });
      }
    }

    // осциллограф
    const oa = A * seg(lt, 3.6, 5.0);
    if (oa > 0) {
      const y0 = 778, x0 = 300, x1 = 1620;
      const noiseAmp = 1 - ease.inOut(seg(lt, 9, 14)), sigAmp = ease.inOut(seg(lt, 7.5, 13.5));
      const col = F.mix(C.mist, C.gold, lock * 0.8 + sigAmp * 0.2);
      add(ctx);
      for (let pass = 0; pass < 2; pass++) {
        ctx.strokeStyle = F.rgba(pass ? C.hot : col);
        ctx.lineWidth = pass ? 1.3 : 4.5;
        ctx.globalAlpha = oa * (pass ? 0.85 : 0.16);
        ctx.beginPath();
        for (let x = x0; x <= x1; x += 4) {
          const env = Math.pow(Math.sin((Math.PI * (x - x0)) / (x1 - x0)), 0.6);
          const n = F.noise1(x * 0.09 + lt * 31) * 0.7 + F.noise1(x * 0.31 - lt * 53) * 0.3;
          const y = y0 + env * (noiseAmp * 28 * n + sigAmp * 30 * Math.sin(x * 0.028 - lt * 5.5));
          if (x === x0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      norm(ctx);
      hud(ctx, 'ОСЦИЛЛОГРАФ · ВХОД', x0, 734, { size: 11, track: 0.35, alpha: oa * 0.5 });
      const snr = lerp(-12, 31, sigAmp * (1 - 0.5 * noiseAmp));
      hud(ctx, 'С/Ш ' + (snr >= 0 ? '+' : '') + snr.toFixed(1) + ' дБ', x1, 734, { size: 11, track: 0.3, alpha: oa * 0.6, align: 'right', color: lock > 0 ? C.gold : C.steel });
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ IV · ФОКУС ─────────────────────────
  const FX = 1080, FY = 540, LX = 760, HIT = 1560;
  function actIV(ctx, lt, t) {
    const A = seg(lt, 4.0, 4.9) * (1 - seg(lt, 20.2, 21));
    if (A <= 0) return;
    const c = ease.inOut(seg(lt, 8.6, 12.2));
    const fire = lt >= 12.5;
    // оптическая ось
    norm(ctx);
    ctx.setLineDash([4, 10]);
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.globalAlpha = A * 0.22 * seg(lt, 7, 9);
    ctx.lineWidth = 1;
    line(ctx, 200, FY, 1760, FY);
    ctx.setLineDash([]);

    // остальные точки уплывают
    add(ctx);
    let left = 0;
    D.tracks.forEach((tr, i) => {
      if (tr.survivor) return;
      const cp = R.cpts[i];
      const p = ease.in(seg(lt, 4.4 + i * 0.04, 8.0 + i * 0.04));
      if (p < 1) left++;
      const [cx, cy] = chartXY(cp.rx, cp.ry);
      const dx = cx - 873, dy = cy - 257, d = Math.hypot(dx, dy) + 1;
      const x = cx + (dx / d) * p * 1100, y = cy + (dy / d) * p * 1100;
      const a = A * (1 - p) * 0.45;
      if (a <= 0.01) return;
      F.glow(ctx, S.ember, x, y, 14, a);
      ctx.fillStyle = F.rgba(C.rose);
      ctx.globalAlpha = a;
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    });

    // лучи
    const ra = A * seg(lt, 7.8, 9.5) * (fire ? 0.6 : 1);
    if (ra > 0) {
      add(ctx);
      for (const ry of R.rays) {
        const wob = Math.sin(lt * 1.4 + ry.ph) * 0.07 * (1 - c);
        const a = ry.a + wob;
        const ylS = ry.y0 + Math.tan(a) * (LX + 40);
        const ylF = FY + (ry.y0 - FY) * 0.8;
        const yl = lerp(ylS, ylF, c);
        const endS = [LX + 1300, yl + Math.tan(a) * 1300];
        const dxF = FX - LX, dyF = FY - yl;
        const endF = [FX + dxF * 0.55, FY + dyF * 0.55];
        const ex = lerp(endS[0], endF[0], c), ey = lerp(endS[1], endF[1], c);
        const fa = seg(lt, 7.8 + ry.h * 1.2, 8.8 + ry.h * 1.2);
        ctx.strokeStyle = F.rgba(ry.h > 0.5 ? C.hot : C.gold);
        ctx.globalAlpha = ra * fa * (0.07 + 0.12 * ry.k);
        ctx.lineWidth = 1.2;
        const mx = lerp(LX, ex, 0.645), my = lerp(yl, ey, 0.645);
        ctx.beginPath();
        ctx.moveTo(-40, ry.y0);
        ctx.lineTo(LX, yl);
        ctx.lineTo(mx, my);
        ctx.stroke();
        ctx.globalAlpha *= 0.35;
        line(ctx, mx, my, ex, ey);
      }
    }
    // линза
    const la = A * seg(lt, 7.4, 9.0);
    if (la > 0) {
      norm(ctx);
      const g = ctx.createLinearGradient(LX - 70, 0, LX + 70, 0);
      g.addColorStop(0, F.rgba(C.steel, 0.02));
      g.addColorStop(0.5, F.rgba(C.steel, 0.16));
      g.addColorStop(1, F.rgba(C.steel, 0.02));
      ctx.globalAlpha = la;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(LX, 230);
      ctx.quadraticCurveTo(LX - 92, FY, LX, 850);
      ctx.quadraticCurveTo(LX + 92, FY, LX, 230);
      ctx.fill();
      ctx.strokeStyle = F.rgba(C.steel);
      ctx.globalAlpha = la * 0.8;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = la * 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LX, 270);
      ctx.quadraticCurveTo(LX - 55, FY, LX, 810);
      ctx.quadraticCurveTo(LX + 55, FY, LX, 270);
      ctx.stroke();
      for (let k = -6; k <= 6; k++) {
        ctx.globalAlpha = la * 0.4;
        line(ctx, LX - 6, FY + k * 46, LX + 6, FY + k * 46);
      }
      // фокусное расстояние
      const da = la * seg(lt, 8.6, 9.6);
      ctx.strokeStyle = F.rgba(C.steel);
      ctx.globalAlpha = da * 0.55;
      line(ctx, LX, 205, FX, 205);
      line(ctx, LX, 197, LX, 213);
      line(ctx, FX, 197, FX, 213);
      hud(ctx, 'ФОКУСНОЕ РАССТОЯНИЕ', (LX + FX) / 2, 190, { size: 11, track: 0.32, alpha: da * 0.6, align: 'center' });
      hud(ctx, 'ЛИНЗА', LX, 878, { size: 11, track: 0.4, alpha: la * 0.5, align: 'center' });
    }

    // проект → в фокус
    const mv = ease.inOut(seg(lt, 4, 8));
    const px = lerp(873.6, FX, mv), py = lerp(256.8, FY, mv);
    add(ctx);
    const fGlow = 1 + c * 1.6 + (fire ? 1.2 : 0);
    F.glow(ctx, S.gold, px, py, 26 * fGlow, A);
    F.glow(ctx, S.haloGold, px, py, 120 * fGlow, A * 0.4);

    // стена
    const wa = A * seg(lt, 9.4, 11);
    if (wa > 0) {
      const hr = 170 * ease.out(seg(lt, 12.6, 14.4));
      for (const w of R.wall) {
        let x = w.x, y = w.y, a = wa * (0.25 + 0.4 * w.b), col = C.mist;
        if (fire && w.d0 < 170) {
          const tb = 12.6 + (w.d0 / 170) * 1.8;
          if (lt > tb) {
            const age = lt - tb;
            x += w.nx * age * 160 * w.v + age * 260 * w.v;
            y += w.ny * age * 160 * w.v + 0.5 * 240 * age * age;
            a *= 1 - seg(age, 0, 1.6);
            col = C.ember;
          } else if (w.d0 < hr + 40) col = C.hot;
        }
        if (a <= 0.01) continue;
        ctx.fillStyle = F.rgba(col);
        ctx.globalAlpha = a;
        ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
      }
      norm(ctx);
      hud(ctx, 'ПРЕПЯТСТВИЕ', HIT + 34, 905, { size: 12, track: 0.4, alpha: wa * 0.7 * (1 - seg(lt, 13, 14)) });
    }

    // лазер
    if (fire) {
      add(ctx);
      const ext = ease.outExpo(seg(lt, 12.5, 12.8));
      const thru = ease.out(seg(lt, 14.0, 14.8));
      const xe = lerp(FX, HIT, ext) + thru * 460;
      const fl = 1 + 0.12 * F.noise1(lt * 40);
      const layers = [[46, 0.08, C.gold], [20, 0.22, C.gold], [7, 0.75, C.hot], [2.2, 1, [255, 255, 255]]];
      for (const [w, a, col] of layers) {
        ctx.strokeStyle = F.rgba(col);
        ctx.globalAlpha = A * a;
        ctx.lineWidth = w * fl;
        line(ctx, FX, FY, xe, FY);
      }
      F.flare(ctx, FX, FY, 2400, 40, A * 0.9, S.flareGold);
      F.glow(ctx, S.hot, FX, FY, 70 * fl, A);
      if (xe >= HIT - 2) {
        F.glow(ctx, S.hot, HIT, FY, 90 * fl, A * (1 - 0.5 * thru));
        F.glow(ctx, S.haloEmber, HIT, FY, 320, A * 0.5);
      }
      // искры
      for (const sp of R.sparks) {
        const age = lt + 84 - sp.t0;
        if (age < 0 || age > sp.life) continue;
        const k = age / sp.life;
        const vx = Math.cos(sp.ang) * sp.sp, vy = Math.sin(sp.ang) * sp.sp;
        const x = HIT + vx * age, y = FY + vy * age + 0.5 * 900 * age * age;
        ctx.strokeStyle = F.rgba(F.mix(C.hot, C.ember, k));
        ctx.globalAlpha = A * (1 - k) * (0.5 + 0.5 * sp.b);
        ctx.lineWidth = 1.6;
        line(ctx, x, y, x - vx * 0.025, y - (vy + 900 * age) * 0.025);
      }
    }

    norm(ctx);
    const ha = A * seg(lt, 4.0, 5.0);
    if (ha > 0) {
      hudBlock(ctx, 'ОТВЛЕЧЕНИЯ', pad3(left), 150, 196, ha, left > 0 ? C.ember : C.hot);
      const pw = fire ? 100 : Math.round(c * 92);
      hudBlock(ctx, 'МОЩНОСТЬ ЛУЧА', String(pw).padStart(3, '0') + '%', 1770, 196, ha, C.gold, 'right');
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ V · ТОПЛИВО ─────────────────────────
  const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));
  function ecg(tau) {
    let v = 0;
    for (const b of D.beats) {
      const dt = tau - b;
      if (dt < -0.3 || dt > 0.45) continue;
      v += 9 * gauss(dt + 0.16, 0.022) - 14 * gauss(dt + 0.022, 0.007) + 140 * gauss(dt, 0.0095) - 34 * gauss(dt - 0.027, 0.009) + 20 * gauss(dt - 0.24, 0.045);
    }
    return v;
  }
  const CHAIN = [
    ['ВЕЛИКОЕ', 222], ['ФОКУС', 306], ['СИГНАЛ', 390], ['ПОПЫТКИ', 474], ['РАБОТА', 580], ['ЗДОРОВЬЕ', 694],
  ];
  function actV(ctx, lt, t) {
    const A = seg(lt, 3.7, 4.7) * (1 - seg(lt, 20.2, 21));
    if (A <= 0) return;
    dotGrid(ctx, A * 0.45);
    // кардиограмма — бегущая развёртка
    const base = 694, sweep = 4, head = ((t - 105) % sweep) / sweep * 1920;
    add(ctx);
    const hcol = F.mix(C.rose, C.gold, 0.25);
    ctx.strokeStyle = F.rgba(hcol);
    ctx.lineWidth = 2;
    let px = null, py = null;
    for (let x = 0; x <= 1920; x += 4) {
      let back = head - x;
      if (back < 0) back += 1920;
      if (back > 1920 - 70) { px = null; continue; }
      const tau = t - (back / 1920) * sweep;
      const y = base - ecg(tau);
      if (px !== null) {
        ctx.globalAlpha = A * Math.pow(1 - back / 1920, 1.4) * 0.9;
        line(ctx, px, py, x, y);
      }
      px = x; py = y;
    }
    F.glow(ctx, S.rose, head, base - ecg(t), 22, A);

    // цепочка
    const reveal = [4.0, 4.3, 4.6, 4.9, 7.0, 12.0];
    let beatPulse = 0;
    for (const b of D.beats) if (t >= b && t - b < 0.4) beatPulse = 1 - (t - b) / 0.4;
    CHAIN.forEach(([label, y], i) => {
      const ra = A * ease.out(seg(lt, reveal[i], reveal[i] + 0.9));
      if (ra <= 0) return;
      const isBase = i === 5, isWork = i === 4;
      const lit = seg(lt, 14.5 + (5 - i) * 0.6, 15.1 + (5 - i) * 0.6);
      const w = isBase ? 540 : 380, h = isBase ? 72 : 54;
      const x0 = 960 - w / 2, y0 = y - h / 2;
      let col = i < 4 ? C.steel : isWork ? C.gold : C.rose;
      col = F.mix(col, C.gold, lit * (isBase ? 0.3 : 1));
      norm(ctx);
      ctx.fillStyle = '#04060b';
      ctx.globalAlpha = ra * 0.88;
      ctx.fillRect(x0, y0, w, h);
      add(ctx);
      if (isBase) {
        const pulse = seg(lt, 12, 12.8) * (0.5 + 0.5 * beatPulse);
        ellipseGlow(ctx, 960, y, w * 0.8, h * 1.6, ra * pulse * 0.55, S.haloEmber);
      }
      if (lit > 0) ellipseGlow(ctx, 960, y, w * 0.7, h * 1.3, ra * lit * (i === 0 ? 0.8 : 0.35), S.haloGold);
      ctx.strokeStyle = F.rgba(col);
      ctx.globalAlpha = ra * (0.45 + 0.5 * Math.max(lit, i >= 4 ? 1 : 0));
      ctx.lineWidth = isBase ? 2 : 1.4;
      ctx.strokeRect(x0, y0, w, h);
      ctx.globalAlpha = ra * 0.8;
      for (const sx of [x0, x0 + w]) {
        line(ctx, sx - 8, y, sx + 8, y);
      }
      norm(ctx);
      F.text(ctx, label, 960, y + (isBase ? 12 : 9), {
        family: F.DISPLAY, weight: isBase ? 500 : 300, size: isBase ? 31 : 24, track: 0.34,
        color: lit > 0.5 || i >= 4 ? F.mix(C.hot, col, 0.3) : C.paper, alpha: ra * (0.7 + 0.3 * lit), reveal: seg(lt, reveal[i], reveal[i] + 1),
      });
      if (i === 0 && lit > 0) {
        add(ctx);
        F.flare(ctx, 960, y, 1600 * lit, 30, A * lit * 0.7, S.flareGold);
      }
    });
    // связи и поток энергии снизу вверх
    add(ctx);
    for (let i = 0; i < 5; i++) {
      const yTop = CHAIN[i][1] + 27, yBot = CHAIN[i + 1][1] - (i + 1 === 5 ? 36 : 27);
      const ca = A * ease.out(seg(lt, reveal[i + 1], reveal[i + 1] + 0.9));
      if (ca <= 0) continue;
      ctx.strokeStyle = F.rgba(C.steel);
      ctx.globalAlpha = ca * 0.5;
      ctx.lineWidth = 1;
      line(ctx, 960, yTop, 960, yBot);
      ctx.beginPath();
      ctx.moveTo(952, yTop + 10);
      ctx.lineTo(960, yTop + 2);
      ctx.lineTo(968, yTop + 10);
      ctx.stroke();
      const flow = seg(lt, 14.5 + (4 - i) * 0.6, 15.0 + (4 - i) * 0.6);
      if (flow > 0)
        for (let k = 0; k < 7; k++) {
          const ph = (lt * 1.6 + k / 7) % 1;
          const y = lerp(yBot, yTop, ph);
          F.glow(ctx, S.gold, 960 + Math.sin(k * 3.1 + lt * 2) * 6, y, 9, ca * flow * Math.sin(ph * Math.PI));
        }
    }
    norm(ctx);
    const ha = A * seg(lt, 4.0, 5.0);
    if (ha > 0) {
      let bpm = 68;
      for (let i = 1; i < D.beats.length; i++) if (D.beats[i] <= t) bpm = Math.round(60 / (D.beats[i] - D.beats[i - 1]));
      hudBlock(ctx, 'ПУЛЬС · УД/МИН', pad3(bpm), 150, 196, ha, C.rose);
      const cells = Math.round(10 * ease.inOut(seg(lt, 12, 18.5)));
      hud(ctx, 'ЗАПАС ЭНЕРГИИ', 1770, 196, { size: 12, track: 0.38, alpha: ha * 0.55, align: 'right' });
      for (let k = 0; k < 10; k++) {
        ctx.fillStyle = F.rgba(k < cells ? C.gold : C.mist);
        ctx.globalAlpha = ha * (k < cells ? 0.95 : 0.25);
        ctx.fillRect(1770 - (10 - k) * 22, 214, 16, 22);
      }
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ VI · СИСТЕМА ─────────────────────────
  const MODS = [
    { title: 'СПОРТ', col: [255, 138, 61], h: [7, 9] },
    { title: 'ДНЕВНИК', col: [233, 228, 216], h: [21, 22] },
    { title: 'ЗНАНИЯ', col: [127, 208, 255], h: [12, 14] },
    { title: '中文', col: [232, 62, 42], h: [15, 16.5], brush: true },
    { title: 'ЛЮДИ', col: [255, 178, 70], h: [18, 21] },
  ];
  const BASE_ARCS = [
    { h: [23, 31], col: [90, 110, 160], label: 'СОН' },
    { h: [9, 12], col: C.steel, label: 'РАБОТА' },
    { h: [14, 15], col: C.steel },
    { h: [16.5, 18], col: C.steel },
  ];
  const hourAng = (h) => -Math.PI / 2 + (h / 24) * TAU;
  function handAngle(t) {
    if (t < 128.1) return -Math.PI / 2;
    const x = (t - 128.1) / 1.25, k = Math.floor(x), fr = x - k;
    return -Math.PI / 2 + (k + ease.outBack(clamp(fr * 5))) * (TAU / 8);
  }
  function arc(ctx, cx, cy, r, h0, h1) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, hourAng(h0), hourAng(h1));
    ctx.stroke();
  }

  function drawDial(ctx, cx, cy, R0, lt, t, asm, litOf, active) {
    const sc = R0 / 300;
    norm(ctx);
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(cx, cy, R0, -Math.PI / 2, -Math.PI / 2 + TAU * asm);
    ctx.stroke();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(cx, cy, R0 * 1.055, -Math.PI / 2, -Math.PI / 2 + TAU * asm);
    ctx.stroke();
    for (let i = 0; i < 96; i++) {
      const fr = i / 96;
      if (fr > asm) break;
      const a = -Math.PI / 2 + fr * TAU, major = i % 4 === 0, l = major ? R0 * 0.07 : R0 * 0.03;
      ctx.globalAlpha = major ? 0.75 : 0.32;
      ctx.lineWidth = major ? 1.6 : 1;
      line(ctx, cx + Math.cos(a) * (R0 - l), cy + Math.sin(a) * (R0 - l), cx + Math.cos(a) * R0, cy + Math.sin(a) * R0);
    }
    for (let h = 0; h < 24; h++) {
      if (h / 24 > asm) break;
      const a = hourAng(h);
      hud(ctx, String(h).padStart(2, '0'), cx + Math.cos(a) * R0 * 1.15, cy + Math.sin(a) * R0 * 1.15 + 5 * sc,
        { size: Math.max(10, 13 * sc), track: 0.05, align: 'center', alpha: 0.55 * seg(asm, h / 24, h / 24 + 0.1) });
    }
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.setLineDash([2, 6]);
    ctx.globalAlpha = 0.28 * asm;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R0 * 0.62, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.16 * asm;
    ctx.beginPath();
    ctx.arc(cx, cy, R0 * 0.4, 0, TAU);
    ctx.stroke();

    // сектора дня
    const ra = R0 * 0.85, lw = 15 * sc, arcA = seg(asm, 0.6, 1);
    ctx.lineCap = 'butt';
    BASE_ARCS.forEach((b) => {
      ctx.strokeStyle = F.rgba(b.col);
      ctx.globalAlpha = 0.2 * arcA;
      ctx.lineWidth = lw * 0.7;
      arc(ctx, cx, cy, ra, b.h[0] + 0.06, b.h[1] - 0.06);
      if (b.label) {
        const am = hourAng((b.h[0] + b.h[1]) / 2);
        hud(ctx, b.label, cx + Math.cos(am) * R0 * 0.71, cy + Math.sin(am) * R0 * 0.71 + 4 * sc,
          { size: Math.max(9, 10 * sc), track: 0.3, align: 'center', alpha: 0.35 * arcA });
      }
    });
    MODS.forEach((m, i) => {
      const lit = litOf(i);
      const act = active === i ? 1 : 0;
      add(ctx);
      ctx.strokeStyle = F.rgba(m.col);
      if (lit > 0) {
        ctx.globalAlpha = 0.18 * lit * (1 + act * (0.6 + 0.4 * Math.sin(t * 5)));
        ctx.lineWidth = lw * 2.8;
        arc(ctx, cx, cy, ra, m.h[0] + 0.06, m.h[1] - 0.06);
      }
      norm(ctx);
      ctx.globalAlpha = (0.14 + 0.84 * lit) * arcA;
      ctx.lineWidth = lw * (1 + act * 0.35);
      arc(ctx, cx, cy, ra, m.h[0] + 0.06, m.h[1] - 0.06);
      const am = hourAng((m.h[0] + m.h[1]) / 2);
      const lx = cx + Math.cos(am) * R0 * 0.69, ly = cy + Math.sin(am) * R0 * 0.69 + 4 * sc;
      if (m.brush)
        F.text(ctx, m.title, lx, ly + 3 * sc, { family: F.BRUSH, size: 17 * sc, color: m.col, alpha: (0.25 + 0.75 * lit) * arcA, align: 'center' });
      else hud(ctx, m.title, lx, ly, { size: Math.max(9, 11 * sc), track: 0.25, align: 'center', color: m.col, alpha: (0.25 + 0.75 * lit) * arcA });
    });

    // стрелка
    const ang = handAngle(t);
    add(ctx);
    ctx.fillStyle = F.rgba(C.gold);
    for (let j = 0; j < 7; j++) {
      ctx.globalAlpha = 0.06 * (1 - j / 7) * asm;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R0 * 0.95, ang - (j + 1) * 0.07, ang - j * 0.07);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = F.rgba(C.gold);
    ctx.globalAlpha = 0.95 * asm;
    ctx.lineWidth = 2;
    line(ctx, cx, cy, cx + Math.cos(ang) * R0 * 0.97, cy + Math.sin(ang) * R0 * 0.97);
    F.glow(ctx, S.gold, cx + Math.cos(ang) * R0 * 0.97, cy + Math.sin(ang) * R0 * 0.97, 14 * sc, asm);
    F.glow(ctx, S.gold, cx, cy, 30 * sc, asm);
    F.glow(ctx, S.haloGold, cx, cy, 120 * sc, asm * 0.4);
    norm(ctx);
    const hours = ((((ang + Math.PI / 2) / TAU) * 24) % 24 + 24) % 24;
    const hh = Math.floor(hours), mm = Math.floor((hours - hh) * 60);
    hud(ctx, String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'), cx, cy + 58 * sc,
      { size: Math.max(12, 18 * sc), track: 0.15, align: 'center', color: C.hot, alpha: 0.85 * asm, weight: 500 });
  }

  function moduleSport(ctx, mt, ma, col) {
    add(ctx);
    const cx = 1370, cy = 470;
    for (let k = 0; k < 4; k++) {
      const ph = ((mt + k * 0.75) % 3) / 3;
      ctx.strokeStyle = F.rgba(col);
      ctx.globalAlpha = ma * (1 - ph) * 0.55;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 30 + ph * 260, 0, TAU);
      ctx.stroke();
    }
    F.glow(ctx, S.ember, cx, cy, 70 + 10 * Math.sin(mt * 8), ma);
    F.glow(ctx, S.haloEmber, cx, cy, 240, ma * 0.4);
    for (let i = 0; i < 15; i++) {
      const x = 1070 + i * 43;
      const env = seg(mt, 0.2 + i * 0.04, 0.9 + i * 0.04);
      const hgt = (30 + 170 * Math.pow(Math.abs(Math.sin(mt * 3.2 + i * 0.45)), 2)) * env;
      const g = ctx.createLinearGradient(0, 790, 0, 790 - hgt);
      g.addColorStop(0, F.rgba(col, 0.15));
      g.addColorStop(1, F.rgba(F.mix(col, C.hot, 0.5), 0.9));
      ctx.globalAlpha = ma;
      ctx.fillStyle = g;
      ctx.fillRect(x, 790 - hgt, 16, hgt);
    }
    norm(ctx);
    hud(ctx, 'ПОВТОРЫ ' + pad3(Math.floor(Math.max(0, mt - 0.3) / 0.38)), 1760, 330, { size: 14, track: 0.3, align: 'right', color: col, alpha: ma * 0.8 });
    hud(ctx, 'ТЕЛО · ЭНЕРГИЯ · ВЫНОСЛИВОСТЬ', 1070, 822, { size: 11, track: 0.4, alpha: ma * 0.5 });
  }

  function moduleJournal(ctx, mt, ma, col) {
    const Sx = 1050, Sy = 760, Gx = 1680, Gy = 360;
    norm(ctx);
    ctx.fillStyle = F.rgba(C.steel);
    for (let y = 330; y <= 790; y += 40)
      for (let x = 1010; x <= 1730; x += 40) {
        ctx.globalAlpha = ma * 0.14;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    ctx.setLineDash([7, 9]);
    ctx.strokeStyle = F.rgba(col);
    ctx.globalAlpha = ma * 0.35;
    ctx.lineWidth = 1.2;
    line(ctx, Sx, Sy, Gx, Gy);
    ctx.setLineDash([]);
    add(ctx);
    F.glow(ctx, S.gold, Gx, Gy, 26, ma);
    F.starburst(ctx, Gx, Gy, 60, ma * 0.7, C.hot);
    norm(ctx);
    hud(ctx, 'ЦЕЛЬ', Gx - 16, Gy - 30, { size: 12, track: 0.4, color: C.gold, alpha: ma * 0.9, align: 'right' });
    const L = Math.hypot(Gx - Sx, Gy - Sy), nx = -(Gy - Sy) / L, ny = (Gx - Sx) / L;
    const cps = [0.27, 0.55, 0.81], amp = [78, -62, 44];
    const dev = (u) => {
      let d = 0, st = 0.02;
      for (let k = 0; k < 3; k++) {
        d += amp[k] * ease.sine(seg(u, st, cps[k])) * (1 - ease.inOut(seg(u, cps[k], cps[k] + 0.09)));
        st = cps[k] + 0.06;
      }
      return d;
    };
    const P = (u) => { const d = dev(u); return [lerp(Sx, Gx, u) + nx * d, lerp(Sy, Gy, u) + ny * d]; };
    const up = ease.inOut(seg(mt, 0.3, 6.3));
    add(ctx);
    ctx.strokeStyle = F.rgba(col);
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = ma * 0.9;
    ctx.beginPath();
    for (let j = 0; j <= 120; j++) {
      const q = P((j / 120) * up);
      if (j === 0) ctx.moveTo(q[0], q[1]);
      else ctx.lineTo(q[0], q[1]);
    }
    ctx.stroke();
    cps.forEach((cu, k) => {
      if (up < cu) return;
      const q = P(cu), pl = [lerp(Sx, Gx, cu), lerp(Sy, Gy, cu)];
      const fa = ma * seg(up, cu, cu + 0.05);
      norm(ctx);
      ctx.strokeStyle = F.rgba(C.steel);
      ctx.globalAlpha = fa * 0.6;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      line(ctx, q[0], q[1], pl[0], pl[1]);
      ctx.setLineDash([]);
      ctx.strokeStyle = F.rgba(C.gold);
      ctx.globalAlpha = fa;
      ctx.strokeRect(q[0] - 6, q[1] - 6, 12, 12);
      hud(ctx, 'АНАЛИЗ 0' + (k + 1), q[0] + (amp[k] > 0 ? -16 : 16), q[1] + (amp[k] > 0 ? -14 : 24),
        { size: 11, track: 0.3, color: C.gold, alpha: fa, align: amp[k] > 0 ? 'right' : 'left' });
      hud(ctx, 'Δ ' + Math.abs(amp[k]), (q[0] + pl[0]) / 2 + 10, (q[1] + pl[1]) / 2, { size: 10, track: 0.2, alpha: fa * 0.6 });
      add(ctx);
      F.glow(ctx, S.gold, q[0], q[1], 40, ma * (1 - seg(up, cu, cu + 0.12)));
    });
    const hq = P(up), hq2 = P(Math.max(0, up - 0.01));
    const dir = Math.atan2(hq[1] - hq2[1], hq[0] - hq2[0]);
    add(ctx);
    F.glow(ctx, S.hot, hq[0], hq[1], 20, ma);
    // компас
    norm(ctx);
    const kx = 1080, ky = 380;
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.globalAlpha = ma * 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(kx, ky, 30, 0, TAU);
    ctx.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      line(ctx, kx + Math.cos(a) * 26, ky + Math.sin(a) * 26, kx + Math.cos(a) * 31, ky + Math.sin(a) * 31);
    }
    ctx.strokeStyle = F.rgba(C.gold);
    ctx.globalAlpha = ma;
    ctx.lineWidth = 2;
    line(ctx, kx - Math.cos(dir) * 18, ky - Math.sin(dir) * 18, kx + Math.cos(dir) * 24, ky + Math.sin(dir) * 24);
    hud(ctx, 'КУРС', kx, ky + 54, { size: 10, track: 0.4, alpha: ma * 0.55, align: 'center' });
  }

  function moduleLearn(ctx, mt, ma, col) {
    const nx = 1440, ny = 560;
    norm(ctx);
    ctx.font = F.font(F.MONO, 13, 400);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = F.rgba(col);
    for (const g of R.glyphs) {
      const p = (mt * g.sp + g.h) % 1;
      const a = ma * Math.sin(p * Math.PI) * 0.75 * seg(mt, g.h * 0.6, g.h * 0.6 + 0.6);
      if (a <= 0.01) continue;
      const u = 1 - p, x = u * u * g.sx + 2 * u * p * g.cx + p * p * nx, y = u * u * g.sy + 2 * u * p * g.cy + p * p * ny;
      ctx.globalAlpha = a;
      ctx.fillText(g.ch, x, y);
    }
    add(ctx);
    const grow = seg(mt, 0, 6);
    F.glow(ctx, S.steel, nx, ny, 40 + 30 * grow, ma);
    F.glow(ctx, S.haloSteel, nx, ny, 200 + 120 * grow, ma * 0.45);
    norm(ctx);
    hud(ctx, 'НОВЫЕ НАВЫКИ', nx, ny + 92, { size: 12, track: 0.4, color: col, alpha: ma * 0.8, align: 'center' });
    // книги
    let y = 800;
    R.books.forEach((b, i) => {
      const tb = 0.3 + i * 0.55, p = seg(mt, tb, tb + 0.5);
      if (p <= 0) { y -= b.h + 4; return; }
      const drop = (1 - ease.outBack(p)) * -120;
      const x = 1090 + b.dx;
      ctx.globalAlpha = ma * p;
      ctx.fillStyle = '#060a12';
      ctx.fillRect(x, y - b.h + drop, b.w, b.h);
      ctx.strokeStyle = F.rgba(col);
      ctx.globalAlpha = ma * p * 0.75;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y - b.h + drop, b.w, b.h);
      hud(ctx, b.t, x + 12, y - b.h / 2 + drop + 4, { size: 11, track: 0.25, color: C.paper, alpha: ma * p * 0.85 });
      y -= b.h + 4;
    });
    hud(ctx, 'КНИГИ О БИЗНЕСЕ', 1090, 822, { size: 11, track: 0.4, alpha: ma * 0.55 });
    // видео-лекция
    const vx = 1530, vy = 330, vw = 224, vh = 126, va = ma * seg(mt, 1.0, 1.6);
    if (va > 0) {
      ctx.strokeStyle = F.rgba(col);
      ctx.globalAlpha = va * 0.8;
      ctx.lineWidth = 1.3;
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.fillStyle = F.rgba(col);
      ctx.globalAlpha = va * 0.9;
      ctx.beginPath();
      ctx.moveTo(vx + vw / 2 - 12, vy + vh / 2 - 16);
      ctx.lineTo(vx + vw / 2 + 18, vy + vh / 2);
      ctx.lineTo(vx + vw / 2 - 12, vy + vh / 2 + 16);
      ctx.closePath();
      ctx.fill();
      const pr = seg(mt, 1.2, 6.8);
      ctx.globalAlpha = va * 0.3;
      ctx.fillRect(vx, vy + vh + 10, vw, 3);
      ctx.globalAlpha = va;
      ctx.fillRect(vx, vy + vh + 10, vw * pr, 3);
      hud(ctx, 'ЛЕКЦИИ YC', vx, vy - 14, { size: 12, track: 0.4, color: col, alpha: va });
      const sec = Math.floor(pr * 48 * 60);
      hud(ctx, String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0') + ' / 48:00', vx + vw, vy + vh + 34,
        { size: 10, track: 0.2, alpha: va * 0.6, align: 'right' });
    }
  }

  function moduleChinese(ctx, mt, ma, col) {
    const cx = 1350, cy = 505;
    add(ctx);
    ellipseGlow(ctx, cx, cy, 520, 260, ma * 0.3 * seg(mt, 1.5, 3), S.haloCinnabar);
    const settled = seg(mt, 2.6, 3.4);
    for (let i = 0; i < R.hanzi.length; i++) {
      const q = R.hanzi[i], m = R.hStart[i];
      const p = ease.inOut(seg(mt, 0.15 + m.d, 2.2 + m.d));
      if (p <= 0) continue;
      const sw = Math.sin(p * Math.PI) * m.sw;
      const x = lerp(m.x, cx + q[0], p) + sw * m.nx, y = lerp(m.y, cy + q[1], p) + sw * m.ny;
      ctx.fillStyle = F.rgba(i % 5 === 0 ? C.cinnabar : C.gold);
      ctx.globalAlpha = ma * (0.25 + 0.55 * Math.sin(p * Math.PI) + 0.3 * p) * (1 - 0.75 * settled);
      ctx.fillRect(x - 1, y - 1, 2.2, 2.2);
    }
    norm(ctx);
    if (settled > 0) {
      const g = ctx.createLinearGradient(0, cy - 150, 0, cy + 150);
      g.addColorStop(0, F.rgba(C.hot));
      g.addColorStop(1, F.rgba(C.gold));
      F.text(ctx, '机会', cx, cy, { family: F.BRUSH, size: 300, fill: g, alpha: ma * settled, baseline: 'middle' });
    }
    const pa = ma * seg(mt, 2.8, 3.6);
    hud(ctx, 'jī · huì', cx, cy + 222, { size: 22, track: 0.3, color: C.hot, alpha: pa, align: 'center' });
    hud(ctx, 'ВОЗМОЖНОСТЬ', cx, cy + 256, { size: 13, track: 0.55, color: col, alpha: pa * 0.9, align: 'center' });
    // печать
    const st = F.T.seal - 157;
    const sp = seg(mt, st, st + 0.22);
    if (sp > 0) {
      const sx = 1680, sy = 700, s = lerp(1.9, 1, ease.outExpo(sp)), half = 50;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-0.05);
      ctx.scale(s, s);
      ctx.globalAlpha = ma * sp * 0.95;
      ctx.fillStyle = F.rgba(C.cinnabar);
      ctx.fillRect(-half, -half, half * 2, half * 2);
      ctx.fillStyle = '#04060b';
      for (let k = 0; k < 40; k++) {
        const hx = F.hash(k * 3 + 1), hy = F.hash(k * 7 + 2), hs = F.hash(k * 11 + 3);
        ctx.globalAlpha = ma * sp * 0.5;
        ctx.fillRect(-half + hx * half * 2, -half + hy * half * 2, 1 + hs * 3, 1 + hs * 3);
      }
      ctx.strokeStyle = F.rgba(C.paper);
      ctx.globalAlpha = ma * sp * 0.85;
      ctx.lineWidth = 2;
      ctx.strokeRect(-half + 7, -half + 7, half * 2 - 14, half * 2 - 14);
      F.text(ctx, '中文', 0, 2, { family: F.BRUSH, size: 40, color: C.paper, alpha: ma * sp, baseline: 'middle' });
      ctx.restore();
    }
  }

  function modulePeople(ctx, mt, ma, col) {
    const Y = ease.inOut(seg(mt, 1.0, 6.4));
    const center = { x: 1370, y: 520 };
    add(ctx);
    R.edges.forEach((e, k) => {
      const a = R.nodes[e.a], b = e.b < 0 ? center : R.nodes[e.b];
      const ea = ma * seg(mt, 0.4 + e.t0 * 1.6, 0.9 + e.t0 * 1.6);
      if (ea <= 0) return;
      ctx.strokeStyle = F.rgba(F.mix(C.steel, col, Y));
      ctx.globalAlpha = ea * (0.25 + 0.55 * Y);
      ctx.lineWidth = 0.6 + 2.8 * Y * e.w;
      line(ctx, a.x, a.y, b.x, b.y);
      const ph = (mt * 0.6 + e.t0) % 1;
      F.glow(ctx, S.gold, lerp(a.x, b.x, ph), lerp(a.y, b.y, ph), 8 + 6 * Y, ea * Y * Math.sin(ph * Math.PI));
    });
    R.nodes.forEach((n, i) => {
      const na = ma * seg(mt, 0.1 + i * 0.05, 0.6 + i * 0.05);
      F.glow(ctx, S.gold, n.x, n.y, (10 + 10 * Y) * n.s * (1 + 0.1 * Math.sin(mt * 3 + n.ph)), na);
    });
    F.glow(ctx, S.gold, center.x, center.y, 34 + 10 * Y, ma);
    F.glow(ctx, S.haloGold, center.x, center.y, 180 + 120 * Y, ma * 0.45);
    norm(ctx);
    hud(ctx, 'ТЫ', center.x, center.y + 46, { size: 11, track: 0.4, color: C.gold, alpha: ma * 0.8, align: 'center' });
    const x0 = 1060, x1 = 1700, yy = 800;
    ctx.strokeStyle = F.rgba(C.steel);
    ctx.globalAlpha = ma * 0.45;
    ctx.lineWidth = 1;
    line(ctx, x0, yy, x1, yy);
    [['1 ГОД', 0], ['5 ЛЕТ', 0.25], ['10 ЛЕТ', 0.55], ['20 ЛЕТ', 1]].forEach(([lab, p]) => {
      const x = lerp(x0, x1, p);
      ctx.globalAlpha = ma * 0.5;
      line(ctx, x, yy - 5, x, yy + 5);
      hud(ctx, lab, x, yy + 26, { size: 11, track: 0.3, alpha: ma * (Y >= p - 0.02 ? 0.85 : 0.35), align: 'center', color: Y >= p - 0.02 ? C.gold : C.steel });
    });
    add(ctx);
    F.glow(ctx, S.gold, lerp(x0, x1, Y), yy, 14, ma);
  }
  const MOD_DRAW = [moduleSport, moduleJournal, moduleLearn, moduleChinese, modulePeople];

  function actVI(ctx, lt, t) {
    const A = seg(lt, 3.6, 4.6) * (1 - seg(lt, 49.2, 50));
    if (A <= 0) return;
    dotGrid(ctx, A * 0.4);
    const toSide = ease.inOut(seg(lt, 9, 10.6)), back = ease.inOut(seg(lt, 45, 46.6));
    const k = toSide * (1 - back);
    const cx = lerp(960, 540, k), cy = lerp(505, 515, k), R0 = lerp(300, 230, k) * (1 + 0.04 * ease.out(seg(lt, 46, 50)));
    const asm = ease.inOut(seg(lt, 3.8, 6.4));
    let active = -1;
    for (let m = 0; m < 5; m++) if (lt >= 10 + 7 * m && lt < 17 + 7 * m) active = m;
    const unify = seg(lt, 45, 46.5);
    const litOf = (m) => Math.max(seg(lt, 10.3 + 7 * m, 11.2 + 7 * m), unify);
    ctx.save();
    ctx.globalAlpha = 1;
    drawDial(ctx, cx, cy, R0, lt, t, asm, litOf, back > 0.5 ? -1 : active);
    ctx.restore();
    if (unify > 0) {
      add(ctx);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      F.glow(ctx, S.haloGold, cx, cy, R0 * 2.4, 0.25 * unify * (0.7 + 0.3 * pulse));
      ctx.strokeStyle = F.rgba(C.gold);
      ctx.lineWidth = 1.4;
      for (let j = 0; j < 3; j++) {
        const p = ((lt - 45 + j * 0.9) % 2.7) / 2.7;
        ctx.globalAlpha = 0.4 * unify * (1 - p);
        ctx.beginPath();
        ctx.arc(cx, cy, R0 * (1.1 + p * 0.6), 0, TAU);
        ctx.stroke();
      }
    }
    if (active >= 0) {
      const m = MODS[active], mt = lt - (10 + 7 * active), ma = A * win(mt, 0, 7, 0.6, 0.55);
      norm(ctx);
      // указатель от активного сектора наружу
      const am = hourAng((m.h[0] + m.h[1]) / 2);
      const lp = ease.out(seg(mt, 0.1, 0.7));
      const r0 = R0 * 0.93, r1 = R0 * (0.93 + 0.42 * lp);
      ctx.strokeStyle = F.rgba(m.col);
      ctx.globalAlpha = ma * 0.7;
      ctx.lineWidth = 1.2;
      line(ctx, cx + Math.cos(am) * r0, cy + Math.sin(am) * r0, cx + Math.cos(am) * r1, cy + Math.sin(am) * r1);
      add(ctx);
      F.glow(ctx, S.hot, cx + Math.cos(am) * r1, cy + Math.sin(am) * r1, 12, ma * lp);
      norm(ctx);
      hud(ctx, 'МОДУЛЬ 0' + (active + 1) + ' / 05', 980, 205, { size: 13, track: 0.45, alpha: ma * 0.6, reveal: seg(mt, 0.2, 0.9) });
      if (m.brush) {
        F.text(ctx, m.title, 980, 272, { family: F.BRUSH, size: 70, color: m.col, alpha: ma, align: 'left' });
        hud(ctx, 'КИТАЙСКИЙ', 1130, 262, { size: 16, track: 0.5, color: C.paper, alpha: ma * 0.75 });
      } else
        F.text(ctx, m.title, 980, 268, { family: F.DISPLAY, weight: 500, size: 56, track: 0.14, color: m.col, alpha: ma, align: 'left', reveal: seg(mt, 0, 0.9), spread: 3 });
      ctx.strokeStyle = F.rgba(m.col);
      ctx.globalAlpha = ma * 0.35;
      line(ctx, 980, 294, 980 + 780 * ease.out(seg(mt, 0.3, 1.2)), 294);
      MOD_DRAW[active](ctx, mt, ma, m.col);
    }
    black(ctx, 1 - A);
  }

  // ───────────────────────── АКТ VII · ВЕЛИКОЕ ─────────────────────────
  const GX = 690, GY = 600, STX = 1500, STY = 300;
  function rot(p, ax, ay, az) {
    let [x, y, z] = p;
    let c = Math.cos(ax), s = Math.sin(ax);
    [y, z] = [y * c - z * s, y * s + z * c];
    c = Math.cos(ay); s = Math.sin(ay);
    [x, z] = [x * c + z * s, -x * s + z * c];
    c = Math.cos(az); s = Math.sin(az);
    [x, y] = [x * c - y * s, x * s + y * c];
    return [x, y, z];
  }
  function gyroRing(ctx, R0, ax, ay, az, col, a, lw, spans) {
    const N = 140, pts = [];
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * TAU - Math.PI / 2;
      const p = rot([Math.cos(th) * R0, Math.sin(th) * R0, 0], ax, ay, az);
      const k = 1100 / (1100 + p[2]);
      pts.push([GX + p[0] * k, GY + p[1] * k, p[2]]);
    }
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[i + 1];
      const depth = 0.35 + 0.65 * (1 - (p[2] + R0) / (2 * R0));
      let c2 = col, w = lw;
      if (spans) {
        const h = (i / N) * 24;
        for (const m of MODS) if (h >= m.h[0] && h <= m.h[1]) { c2 = m.col; w = lw * 3.2; }
      }
      ctx.strokeStyle = F.rgba(c2);
      ctx.globalAlpha = a * depth;
      ctx.lineWidth = w;
      line(ctx, p[0], p[1], q[0], q[1]);
    }
  }

  function icon(ctx, i, x, y, s, a, t) {
    add(ctx);
    ctx.strokeStyle = F.rgba(C.gold);
    ctx.fillStyle = F.rgba(C.gold);
    ctx.lineWidth = 2;
    ctx.globalAlpha = a;
    if (i === 0) {
      for (let k = 0; k < 90; k++) {
        const arm = k % 2, r = (k / 90) * s, ang = arm * Math.PI + r * 0.09 + t * 0.6;
        ctx.globalAlpha = a * (1 - k / 110);
        ctx.fillRect(x + Math.cos(ang) * r - 1.5, y + Math.sin(ang) * r * 0.55 - 1.5, 3, 3);
      }
      F.glow(ctx, S.gold, x, y, 16, a);
    } else if (i === 1) {
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        let px = x, py = y, ang = (k / 5) * TAU;
        ctx.moveTo(px, py);
        for (let j = 0; j < 30; j++) {
          ang += 0.02 + j * 0.006;
          px += Math.cos(ang) * 2.4;
          py += Math.sin(ang) * 2.4;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      F.glow(ctx, S.gold, x, y, 14, a);
    } else if (i === 2) {
      ctx.beginPath();
      for (let k = -s; k <= s; k += 3) {
        const yy = y + Math.sin(k * 0.12 + t * 6) * s * 0.35;
        if (k === -s) ctx.moveTo(x + k, yy);
        else ctx.lineTo(x + k, yy);
      }
      ctx.stroke();
    } else if (i === 3) {
      ctx.beginPath();
      ctx.moveTo(x - 10, y - s * 0.8);
      ctx.quadraticCurveTo(x - 30, y, x - 10, y + s * 0.8);
      ctx.quadraticCurveTo(x + 10, y, x - 10, y - s * 0.8);
      ctx.stroke();
      for (let k = -2; k <= 2; k++) {
        ctx.globalAlpha = a * 0.6;
        line(ctx, x - s * 1.2, y + k * 12, x - 10, y + k * 9);
        line(ctx, x - 10, y + k * 9, x + s * 0.8, y);
      }
      F.glow(ctx, S.hot, x + s * 0.8, y, 18, a);
    } else if (i === 4) {
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x - s * 0.3, y);
      ctx.lineTo(x - s * 0.15, y + 10);
      ctx.lineTo(x, y - s * 0.75);
      ctx.lineTo(x + s * 0.15, y + 18);
      ctx.lineTo(x + s * 0.3, y);
      ctx.lineTo(x + s, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.7, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * TAU;
        line(ctx, x + Math.cos(ang) * s * 0.55, y + Math.sin(ang) * s * 0.55, x + Math.cos(ang) * s * 0.7, y + Math.sin(ang) * s * 0.7);
      }
      const ang = t * 3;
      line(ctx, x, y, x + Math.cos(ang) * s * 0.6, y + Math.sin(ang) * s * 0.6);
      F.glow(ctx, S.gold, x, y, 12, a);
    }
  }

  const WORDS = ['ОКРУЖЕНИЕ', 'ЭКСПЕРИМЕНТЫ', 'СИГНАЛ', 'ФОКУС', 'ЗДОРОВЬЕ', 'СИСТЕМА'];
  function actVII(ctx, lt, t) {
    // ── гироскоп, луч, сверхновая
    if (lt < 12.6) {
      const A = seg(lt, 3.7, 4.7);
      if (A > 0) {
        const warp = ease.in(seg(lt, 4, 10));
        drawStars(ctx, 300 + lt * 60 + warp * warp * 2600, A * 0.9, t, { streak: warp * 260 });
        add(ctx);
        const spin = lt;
        gyroRing(ctx, 250, 1.1 + spin * 0.35, 0.3, 0.2, C.steel, A * 0.85, 1.6, true);
        gyroRing(ctx, 215, 0.4, 0.9 + spin * 0.5, 0.6, C.gold, A * 0.7, 1.4);
        gyroRing(ctx, 180, 2.0 + spin * 0.6, 1.4 + spin * 0.22, 0.1, C.hot, A * 0.55, 1.2);
        let beat = 0;
        const bp = (lt % 0.75) / 0.75;
        beat = Math.exp(-bp * 6);
        F.glow(ctx, S.gold, GX, GY, 46 + 16 * beat, A);
        F.glow(ctx, S.haloGold, GX, GY, 220 + 50 * beat, A * 0.5);
        // звезда-цель
        const grow = ease.in(seg(lt, 6.2, 10.2));
        const rS = lerp(4, 80, grow);
        F.glow(ctx, S.hot, STX, STY, rS * 3 + 6 * Math.sin(lt * 6), A);
        F.glow(ctx, S.haloHot, STX, STY, rS * 10, A * (0.25 + 0.5 * grow));
        if (grow > 0) {
          ctx.strokeStyle = F.rgba(C.hot);
          for (let k = 0; k < 28; k++) {
            const ang = (k / 28) * TAU + lt * 0.15;
            const len = rS * (4 + 4 * F.hash(k)) * (1 + grow * 2);
            ctx.globalAlpha = A * grow * 0.25;
            ctx.lineWidth = 1.2;
            line(ctx, STX + Math.cos(ang) * rS, STY + Math.sin(ang) * rS, STX + Math.cos(ang) * len, STY + Math.sin(ang) * len);
          }
        }
        F.starburst(ctx, STX, STY, 40 + rS * 6, A * 0.8, C.hot);
        // луч
        if (lt >= 6) {
          const bp2 = ease.outExpo(seg(lt, 6, 6.5));
          const ex = lerp(GX, STX, bp2), ey = lerp(GY, STY, bp2);
          const fl = 1 + 0.1 * F.noise1(lt * 35);
          for (const [w, a, col] of [[30, 0.08, C.gold], [12, 0.25, C.gold], [4, 0.85, C.hot], [1.6, 1, [255, 255, 255]]]) {
            ctx.strokeStyle = F.rgba(col);
            ctx.globalAlpha = A * a;
            ctx.lineWidth = w * fl;
            line(ctx, GX, GY, ex, ey);
          }
        }
        // ударная волна сверхновой
        const np = seg(lt, 10, 12.6);
        if (np > 0) {
          F.glow(ctx, S.haloHot, STX, STY, 300 + 2600 * ease.out(np), (1 - np) * 0.9);
          ctx.strokeStyle = F.rgba(C.hot);
          ctx.lineWidth = 3;
          ctx.globalAlpha = (1 - np) * 0.8;
          ctx.beginPath();
          ctx.arc(STX, STY, 40 + 2200 * ease.out(np), 0, TAU);
          ctx.stroke();
        }
        norm(ctx);
        const ha = A * win(lt, 4.0, 10, 0.8, 0.6);
        hud(ctx, 'СИСТЕМА → ЯДРО → ЦЕЛЬ', 150, 196, { size: 12, track: 0.38, alpha: ha * 0.55 });
        hud(ctx, 'ЦЕЛЬ', STX + 36, STY - 30, { size: 12, track: 0.4, color: C.gold, alpha: ha * 0.8 });
      }
    }
    // ── монтаж слов
    const wl0 = F.T.words[0] - 176, wl1 = F.T.finale - 176;
    if (lt >= wl0 - 0.6 && lt < wl1 + 0.4) {
      const ba = seg(lt, wl0 - 0.6, wl0) * (1 - seg(lt, wl1 - 0.2, wl1 + 0.4));
      drawStars(ctx, 900 + lt * 140, ba * 0.7, t, { streak: 40 });
      add(ctx);
      ellipseGlow(ctx, 960, 590, 900, 320, ba * 0.22, S.haloGold);
    }
    WORDS.forEach((w, i) => {
      const w0 = F.T.words[i] - 176, wt = lt - w0;
      if (wt < 0 || wt > 1.25) return;
      const a = seg(wt, 0, 0.06) * (1 - seg(wt, 1.02, 1.25));
      const sc = lerp(1.1, 1.0, ease.outExpo(seg(wt, 0, 0.9)));
      add(ctx);
      ellipseGlow(ctx, 960, 600, 760, 150, a * 0.35 * (1 - seg(wt, 0, 1.2) * 0.5), S.haloGold);
      F.flare(ctx, 960, 600, 2200 * ease.outExpo(seg(wt, 0, 0.5)), 40, a * 0.45 * (1 - seg(wt, 0, 0.9)), S.flareGold);
      ctx.strokeStyle = F.rgba(C.gold);
      ctx.lineWidth = 1.5;
      const rp = seg(wt, 0, 1.2);
      ctx.globalAlpha = (1 - rp) * 0.35;
      ctx.beginPath();
      ctx.arc(960, 560, 120 + rp * 900, 0, TAU);
      ctx.stroke();
      icon(ctx, i, 960, 390, 66, a, lt);
      norm(ctx);
      ctx.save();
      ctx.translate(960, 600);
      ctx.scale(sc, sc);
      F.text(ctx, w, 0, 0, { family: F.DISPLAY, weight: 800, size: 108, track: 0.06, color: C.hot, alpha: a, baseline: 'middle' });
      ctx.restore();
      hud(ctx, '0' + (i + 1) + ' / 06', 960, 712, { size: 14, track: 0.6, color: C.gold, alpha: a * 0.8, align: 'center' });
    });
    // ── финал
    const fl0 = F.T.finale - 176;
    if (lt >= fl0 && lt < 28.6) {
      const ft = lt - fl0;
      const FA = seg(ft, 0, 0.25) * (1 - seg(lt, 27.3, 28.4));
      add(ctx);
      F.glow(ctx, S.haloGold, 960, 620, 1100, FA * 0.32);
      for (const e of R.embers) {
        const y = 1140 - ((ft * e.sp + e.off) % 1300);
        const x = e.x + Math.sin(ft * 1.3 + e.ph) * e.sw;
        const a = FA * (0.3 + 0.7 * e.b) * Math.min(1, (y + 60) / 400) * seg(ft, 0, 1.5);
        F.glow(ctx, e.b > 0.7 ? S.hot : S.gold, x, y, 5 + 7 * e.b, a);
      }
      F.flare(ctx, 960, 640, 2400 * ease.out(seg(ft, 0, 1)), 60, FA * 0.55, S.flareGold);
      norm(ctx);
      F.text(ctx, 'СОЗДАТЬ', 960, 470, {
        family: F.DISPLAY, weight: 300, size: 50, track: lerp(1.1, 0.75, ease.outQuint(seg(ft, 0, 4))),
        color: C.hot, alpha: FA * seg(ft, 0, 0.9),
      });
      const g = ctx.createLinearGradient(0, 560, 0, 720);
      g.addColorStop(0, F.rgba(C.hot));
      g.addColorStop(0.55, F.rgba([255, 205, 120]));
      g.addColorStop(1, F.rgba(C.gold));
      F.text(ctx, 'ВЕЛИКОЕ', 960, 640, {
        family: F.DISPLAY, weight: 800, size: 172, track: lerp(0.14, 0.05, ease.outQuint(seg(ft, 0, 5))),
        fill: g, alpha: FA, reveal: seg(ft, 0.15, 1.3), spread: 3, rise: 0.12, baseline: 'middle',
      });
    }
    // ── кода
    if (lt >= 28) {
      const ct = lt;
      const pa = win(ct, 30.8, 34, 0.8, 1.2);
      add(ctx);
      F.glow(ctx, S.gold, 960, 470, 16 * (1 + 0.1 * Math.sin(ct * 2.6)), pa);
      F.glow(ctx, S.haloGold, 960, 470, 90, pa * 0.4);
      norm(ctx);
      F.text(ctx, 'СТРАТЕГИЯ', 960, 590, { family: F.DISPLAY, weight: 300, size: 40, track: 0.7, color: C.hot, alpha: win(ct, 31.5, 34, 0.9, 1.1) });
    }
  }

  // ───────────────────────── титр акта ─────────────────────────
  function drawCard(ctx, act, lt) {
    if (lt > 4.5) return;
    const big = act.id === 'VII';
    add(ctx);
    const hw = (big ? 900 : 700) * ease.outExpo(seg(lt, 0, 1.0));
    const ha = (1 - seg(lt, 0.5, 3.4)) * 0.9;
    const g = ctx.createLinearGradient(960 - hw, 0, 960 + hw, 0);
    g.addColorStop(0, F.rgba(C.gold, 0));
    g.addColorStop(0.5, F.rgba(C.hot, 1));
    g.addColorStop(1, F.rgba(C.gold, 0));
    ctx.fillStyle = g;
    ctx.globalAlpha = ha;
    ctx.fillRect(960 - hw, 611, hw * 2, 1.5);
    F.flare(ctx, 960, 612, (big ? 2600 : 1900) * ease.out(seg(lt, 0, 0.6)), big ? 60 : 36, (1 - seg(lt, 0, 1.5)) * (big ? 1 : 0.75), S.flareGold);
    if (big) F.glow(ctx, S.haloGold, 960, 560, 900, (1 - seg(lt, 0, 2.5)) * 0.4);
    norm(ctx);
    const a = win(lt, 0.05, 4.25, 0.5, 0.75);
    F.text(ctx, 'АКТ ' + act.roman, 960, 450, { family: F.MONO, weight: 500, size: 18, track: 0.9, color: C.gold, alpha: a * 0.9 });
    F.text(ctx, act.title, 960, 580, {
      family: F.DISPLAY, weight: 200, size: big ? 118 : 104, track: lerp(0.95, 0.42, ease.outQuint(seg(lt, 0, 4.4))),
      color: C.hot, alpha: a,
    });
    F.text(ctx, act.sub, 960, 658, {
      family: F.MONO, size: 17, track: 0.55, color: C.steel, alpha: win(lt, 0.9, 4.3, 0.7, 0.8) * 0.85, reveal: seg(lt, 0.9, 2.2),
    });
  }

  // ───────────────────────── субтитры ─────────────────────────
  function drawLines(ctx, t) {
    for (const L of F.LINES) {
      if (t < L.t0 || t > L.t1) continue;
      const lt = t - L.t0, n = L.text.length;
      const out = 1 - seg(t, L.t1 - 0.65, L.t1);
      const reveal = ease.out(seg(lt, 0, 0.6 + n * 0.024));
      const y = (L.y || 885) - (1 - out) * 10;
      norm(ctx);
      if (!L.big) {
        ctx.save();
        ctx.translate(960, y - 16);
        ctx.scale(1, 0.12);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 760);
        g.addColorStop(0, 'rgba(2,3,7,0.62)');
        g.addColorStop(1, 'rgba(2,3,7,0)');
        ctx.fillStyle = g;
        ctx.globalAlpha = out * seg(lt, 0, 0.4);
        ctx.fillRect(-760, -760, 1520, 1520);
        ctx.restore();
      }
      if (L.big) {
        F.text(ctx, L.text, 960, y, { family: F.DISPLAY, weight: 800, size: 66, track: 0.34, color: C.gold, alpha: out, reveal, spread: 3 });
        continue;
      }
      F.text(ctx, L.text, 960, y, {
        family: F.SERIF, style: 'italic', weight: 500, size: 52, track: 0.01, perChar: true,
        color: L.gold ? [255, 200, 120] : C.hot, alpha: out, reveal, spread: 9, rise: 0.18,
      });
    }
  }

  // ───────────────────────── эффекты кадра ─────────────────────────
  const HITS = [
    [1.5, 2], [12.9, 5], [17, 3], [34.5, 3], [41, 4], [64, 3], [77.2, 5], [84, 3], [96.5, 13], [105, 3], [112, 3],
    [117, 7], [126, 3], [160.2, 6], [176, 7], [182, 4], [186, 16], [196.3, 9],
  ];
  F.T.words.forEach((w) => HITS.push([w, 4]));
  function shakeAt(t) {
    if (F.reduced) return [0, 0];
    let a = 0;
    for (const [h, amp] of HITS) {
      const d = t - h;
      if (d >= 0 && d < 2.5) a += amp * Math.exp(-d * 3.5);
    }
    if (t > 96.5 && t < 104.5) a += 1.3;
    if (a < 0.05) return [0, 0];
    return [a * F.noise1(t * 28), a * F.noise1(t * 28 + 57)];
  }
  F.flashAt = function (t) {
    let a = 0;
    a = Math.max(a, 0.22 * win(t, 12.85, 13.5, 0.05, 0.6));
    a = Math.max(a, seg(t, 40.0, 41.0) * (1 - seg(t, 41.0, 41.9)));
    a = Math.max(a, 0.32 * win(t, 77.15, 77.9, 0.05, 0.65));
    a = Math.max(a, 0.75 * win(t, 96.45, 97.4, 0.05, 0.9));
    a = Math.max(a, 0.4 * win(t, 116.95, 117.7, 0.05, 0.7));
    a = Math.max(a, 0.3 * win(t, 160.15, 160.7, 0.04, 0.5));
    a = Math.max(a, 0.5 * win(t, 176, 176.8, 0.03, 0.75));
    a = Math.max(a, seg(t, 185.0, 186.0) * (1 - seg(t, 186.8, 188.5)));
    for (const w of F.T.words) a = Math.max(a, 0.2 * win(t, w, w + 0.45, 0.02, 0.42));
    a = Math.max(a, 0.55 * win(t, 196.25, 197.6, 0.05, 1.2));
    return F.reduced ? a * 0.35 : a;
  };
  F.barsAt = function (t) {
    const full = (1080 - 1920 / 2.39) / 2;
    if (t < 186) return full;
    if (t < 203) return full * (1 - ease.inOut(seg(t, 186.0, 187.6)));
    return full * ease.inOut(seg(t, 203.4, 204.4));
  };

  const SCENES = { P: prologue, I: actI, II: actII, III: actIII, IV: actIV, V: actV, VI: actVI, VII: actVII };

  // кадр в логических координатах 1920×1080
  F.drawScene = function (ctx, t) {
    norm(ctx);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#04060b';
    ctx.fillRect(0, 0, 1920, 1080);
    const sh = shakeAt(t);
    ctx.save();
    ctx.translate(sh[0], sh[1]);
    const act = F.actAt(t), lt = t - act.t0;
    SCENES[act.id](ctx, lt, t);
    if (act.roman) drawCard(ctx, act, lt);
    ctx.restore();
    drawLines(ctx, t);
    norm(ctx);
    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  };

  // пост-обработка в пикселях: bloom, вспышка, зерно, виньетка, шторки
  const post = {};
  F.post = function (cv, ctx, t) {
    const w = cv.width, h = cv.height;
    if (!post.b1 || post.w !== w || post.h !== h) {
      post.w = w; post.h = h;
      post.b1 = F.canvas(Math.max(1, Math.round(w / 4)), Math.max(1, Math.round(h / 4)));
      post.b2 = F.canvas(Math.max(1, Math.round(w / 12)), Math.max(1, Math.round(h / 12)));
      post.x1 = post.b1.getContext('2d');
      post.x2 = post.b2.getContext('2d');
      const v = F.canvas(w, h), vx = v.getContext('2d');
      const g = vx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.56);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.62)');
      vx.fillStyle = g;
      vx.fillRect(0, 0, w, h);
      post.vig = v;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const { b1, b2, x1, x2 } = post;
    x1.globalCompositeOperation = 'copy';
    x1.drawImage(cv, 0, 0, b1.width, b1.height);
    x2.globalCompositeOperation = 'copy';
    x2.drawImage(b1, 0, 0, b2.width, b2.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22;
    ctx.drawImage(b1, 0, 0, w, h);
    ctx.globalAlpha = 0.34;
    ctx.drawImage(b2, 0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    const fa = F.flashAt(t);
    if (fa > 0.003) {
      ctx.globalAlpha = Math.min(1, fa);
      ctx.fillStyle = 'rgb(255,246,228)';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(post.vig, 0, 0);
    // зерно
    const gr = S.grain, fr = Math.floor(t * 24), ox = -((F.hash(fr) * 256) | 0), oy = -((F.hash(fr + 999) * 256) | 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.07;
    const gs = Math.max(1, Math.round(w / 1920));
    for (let y = oy; y < h; y += 256 * gs) for (let x = ox; x < w; x += 256 * gs) ctx.drawImage(gr, x, y, 256 * gs, 256 * gs);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    const bar = Math.round(F.barsAt(t) * (h / 1080));
    if (bar > 0) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, bar);
      ctx.fillRect(0, h - bar, w, bar);
    }
  };

  F.renderFrame = function (cv, ctx, t) {
    const s = cv.width / 1920;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    F.drawScene(ctx, t);
    F.post(cv, ctx, t);
  };
})();
