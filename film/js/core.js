/* СТРАТЕГИЯ — ядро: математика, детерминированный шум, спрайты света, типографика,
   общий таймлайн и данные, которые используют и изображение, и звук. */
(function () {
  'use strict';
  const F = (window.F = window.F || {});

  F.W = 1920;
  F.H = 1080;
  F.DURATION = 210;

  // ───────────────────────── математика ─────────────────────────
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };
  // окно видимости: 0 до a, нарастает fi секунд, держится, гаснет fo секунд к b
  const win = (t, a, b, fi = 0.6, fo = 0.6) =>
    Math.max(0, Math.min(fi > 0 ? seg(t, a, a + fi) : t >= a ? 1 : 0, fo > 0 ? 1 - seg(t, b - fo, b) : t < b ? 1 : 0));

  F.clamp = clamp; F.lerp = lerp; F.seg = seg; F.ease = ease; F.win = win;
  F.TAU = Math.PI * 2;

  // детерминированный ГПСЧ (mulberry32) и хеш
  F.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (n) => {
    let x = (n | 0) * 374761393 + 668265263;
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  F.hash = hash;
  const smooth = (t) => t * t * (3 - 2 * t);
  F.noise1 = (x) => {
    const i = Math.floor(x), f = x - i;
    return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1;
  };
  F.noise2 = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
    const h = (a, b) => hash(a * 7919 + b * 104729);
    return lerp(lerp(h(ix, iy), h(ix + 1, iy), fx), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), fx), fy) * 2 - 1;
  };

  // ───────────────────────── палитра ─────────────────────────
  F.C = {
    ink: [4, 6, 11],
    gold: [255, 178, 70],
    hot: [255, 238, 206],
    steel: [127, 208, 255],
    ember: [255, 90, 56],
    cinnabar: [232, 62, 42],
    mist: [120, 140, 178],
    paper: [233, 228, 216],
    rose: [255, 120, 96],
  };
  F.rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  F.mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  // ───────────────────────── шрифты ─────────────────────────
  F.DISPLAY = '"Unbounded", "Arial Black", "Helvetica Neue", sans-serif';
  F.SERIF = '"Cormorant Garamond", "Cormorant", Georgia, "Times New Roman", serif';
  F.MONO = '"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace';
  F.BRUSH = '"Ma Shan Zheng", "KaiTi", "STKaiti", "Kaiti SC", serif';

  const CYR = 'АБВЁЖЭЯабвёжэя', LAT = 'ABCYabc0123.,:/%', SYM = '→↑Δ×·—–«»';
  F.FONT_FACES = [
    ['200 40px ' + F.DISPLAY, CYR + LAT],
    ['300 40px ' + F.DISPLAY, CYR + LAT],
    ['500 40px ' + F.DISPLAY, CYR + LAT],
    ['800 40px ' + F.DISPLAY, CYR + LAT],
    ['italic 500 40px ' + F.SERIF, CYR + LAT + SYM],
    ['italic 600 40px ' + F.SERIF, CYR + LAT + SYM],
    ['400 40px ' + F.MONO, CYR + LAT + SYM + 'jīhuì'],
    ['500 40px ' + F.MONO, CYR + LAT + SYM],
    ['400 40px ' + F.BRUSH, '机会中文'],
  ];

  F.loadFonts = function (timeoutMs = 6000) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const all = Promise.all(F.FONT_FACES.map(([f, s]) => document.fonts.load(f, s).catch(() => null)));
    const to = new Promise((r) => setTimeout(r, timeoutMs));
    return Promise.race([all, to]).then(() => (document.fonts.ready || Promise.resolve()));
  };

  // ───────────────────────── спрайты света ─────────────────────────
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  F.canvas = canvas;

  function glowSprite(col, core = true, size = 128) {
    const c = canvas(size, size), x = c.getContext('2d'), r = size / 2;
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    if (core) {
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.07, F.rgba(F.mix(col, [255, 255, 255], 0.55), 0.95));
      g.addColorStop(0.2, F.rgba(col, 0.42));
      g.addColorStop(0.45, F.rgba(col, 0.12));
    } else {
      g.addColorStop(0, F.rgba(col, 0.5));
      g.addColorStop(0.35, F.rgba(col, 0.22));
      g.addColorStop(0.7, F.rgba(col, 0.05));
    }
    g.addColorStop(1, F.rgba(col, 0));
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return c;
  }

  function flareSprite(col) {
    // анаморфный блик: длинная горизонтальная полоса
    const w = 1024, h = 48, c = canvas(w, h), x = c.getContext('2d');
    const gx = x.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, F.rgba(col, 0));
    gx.addColorStop(0.35, F.rgba(col, 0.25));
    gx.addColorStop(0.5, 'rgba(255,255,255,1)');
    gx.addColorStop(0.65, F.rgba(col, 0.25));
    gx.addColorStop(1, F.rgba(col, 0));
    x.fillStyle = gx;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-in';
    const gy = x.createLinearGradient(0, 0, 0, h);
    gy.addColorStop(0, 'rgba(0,0,0,0)');
    gy.addColorStop(0.5, 'rgba(0,0,0,1)');
    gy.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gy;
    x.fillRect(0, 0, w, h);
    return c;
  }

  F.initSprites = function () {
    const C = F.C;
    F.S = {
      gold: glowSprite(C.gold),
      hot: glowSprite(C.hot),
      steel: glowSprite(C.steel),
      ember: glowSprite(C.ember),
      cinnabar: glowSprite(C.cinnabar),
      mist: glowSprite(C.mist),
      rose: glowSprite(C.rose),
      haloGold: glowSprite(C.gold, false, 256),
      haloSteel: glowSprite(C.steel, false, 256),
      haloEmber: glowSprite(C.ember, false, 256),
      haloHot: glowSprite(C.hot, false, 256),
      haloCinnabar: glowSprite(C.cinnabar, false, 256),
      flare: flareSprite([150, 190, 255]),
      flareGold: flareSprite([255, 190, 110]),
    };
    // зерно плёнки
    const n = canvas(256, 256), nx = n.getContext('2d'), id = nx.createImageData(256, 256), r = F.rng(77);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = (r() * 255) | 0;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = 255;
    }
    nx.putImageData(id, 0, 0);
    F.S.grain = n;
  };

  F.glow = function (ctx, spr, x, y, r, a = 1) {
    if (a <= 0.003 || r <= 0.2) return;
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
  };
  F.flare = function (ctx, x, y, w, h, a = 1, spr) {
    if (a <= 0.003) return;
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.drawImage(spr || F.S.flare, x - w / 2, y - h / 2, w, h);
  };
  // четырёхлучевая звезда-блик
  F.starburst = function (ctx, x, y, len, a, col) {
    if (a <= 0.01) return;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(x - len, y, x + len, y);
    g.addColorStop(0, F.rgba(col, 0)); g.addColorStop(0.5, F.rgba(col, 1)); g.addColorStop(1, F.rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - len, y - 0.75, len * 2, 1.5);
    const g2 = ctx.createLinearGradient(x, y - len * 0.6, x, y + len * 0.6);
    g2.addColorStop(0, F.rgba(col, 0)); g2.addColorStop(0.5, F.rgba(col, 1)); g2.addColorStop(1, F.rgba(col, 0));
    ctx.fillStyle = g2;
    ctx.fillRect(x - 0.75, y - len * 0.6, 1.5, len * 1.2);
  };

  // ───────────────────────── типографика ─────────────────────────
  const prefixCache = new Map();
  function layout(ctx, str, font, trackPx) {
    const key = font + '|' + trackPx + '|' + str;
    let L = prefixCache.get(key);
    if (L) return L;
    ctx.font = font;
    const chars = Array.from(str), xs = [];
    let acc = '';
    for (let i = 0; i < chars.length; i++) {
      xs.push(ctx.measureText(acc).width + trackPx * i);
      acc += chars[i];
    }
    const width = ctx.measureText(acc).width + trackPx * Math.max(0, chars.length - 1);
    L = { chars, xs, width };
    if (prefixCache.size > 4000) prefixCache.clear();
    prefixCache.set(key, L);
    return L;
  }
  F.font = (fam, size, weight = 400, style = 'normal') => `${style} ${weight} ${size}px ${fam}`;

  /* Текст с разрядкой и побуквенным появлением.
     o: family size weight style track(em) align color alpha reveal(0..1) spread rise */
  F.text = function (ctx, str, x, y, o = {}) {
    const size = o.size || 40;
    const font = F.font(o.family || F.SERIF, size, o.weight || 400, o.style || 'normal');
    const trackPx = (o.track || 0) * size;
    const L = layout(ctx, str, font, trackPx);
    const a0 = o.alpha == null ? 1 : o.alpha;
    if (a0 <= 0.003) return L.width;
    ctx.font = font;
    ctx.textBaseline = o.baseline || 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = o.fill || F.rgba(o.color || F.C.hot, 1);
    let x0 = o.align === 'left' ? x : o.align === 'right' ? x - L.width : x - L.width / 2;
    const reveal = o.reveal == null ? 1 : o.reveal;
    const n = L.chars.length, spread = o.spread || 7, rise = o.rise == null ? 0.22 : o.rise;
    if (reveal >= 1 && trackPx === 0 && !o.perChar) {
      ctx.globalAlpha = a0;
      ctx.fillText(str, x0, y);
      return L.width;
    }
    for (let i = 0; i < n; i++) {
      let p = reveal >= 1 ? 1 : clamp((reveal * (n + spread) - i) / spread);
      if (p <= 0) continue;
      p = ease.out(p);
      ctx.globalAlpha = a0 * p;
      ctx.fillText(L.chars[i], x0 + L.xs[i], y + (1 - p) * size * rise);
    }
    return L.width;
  };
  F.measure = function (ctx, str, o = {}) {
    const size = o.size || 40;
    const font = F.font(o.family || F.SERIF, size, o.weight || 400, o.style || 'normal');
    return layout(ctx, str, font, (o.track || 0) * size).width;
  };

  // выборка пикселей текста → точки для сборки частицами
  F.sampleText = function (str, o) {
    const size = o.size, track = (o.track || 0) * size;
    const c = canvas(2400, Math.ceil(size * 2.2)), x = c.getContext('2d');
    const font = F.font(o.family, size, o.weight || 400, o.style || 'normal');
    const L = layout(x, str, font, track);
    x.font = font;
    x.fillStyle = '#fff';
    x.textBaseline = 'middle';
    const ox = (c.width - L.width) / 2, oy = c.height / 2;
    L.chars.forEach((ch, i) => x.fillText(ch, ox + L.xs[i], oy));
    const d = x.getImageData(0, 0, c.width, c.height).data, pts = [], step = o.step || 3;
    for (let yy = 0; yy < c.height; yy += step)
      for (let xx = 0; xx < c.width; xx += step)
        if (d[(yy * c.width + xx) * 4 + 3] > 140) pts.push([xx - c.width / 2, yy - oy]);
    // перемешать детерминированно и обрезать
    const r = F.rng(o.seed || 1);
    for (let i = pts.length - 1; i > 0; i--) {
      const j = (r() * (i + 1)) | 0;
      const t = pts[i]; pts[i] = pts[j]; pts[j] = t;
    }
    return pts.slice(0, o.max || pts.length);
  };

  // ───────────────────────── таймлайн ─────────────────────────
  F.ACTS = [
    { id: 'P', roman: '', title: 'ПРОЛОГ', t0: 0, t1: 17 },
    { id: 'I', roman: 'I', title: 'ГРАВИТАЦИЯ', sub: 'ОКРУЖЕНИЕ ОПРЕДЕЛЯЕТ ТРАЕКТОРИЮ', t0: 17, t1: 41 },
    { id: 'II', roman: 'II', title: 'ЭКСПЕРИМЕНТЫ', sub: 'МНОГО ПОПЫТОК · ПАРАЛЛЕЛЬНО', t0: 41, t1: 64 },
    { id: 'III', roman: 'III', title: 'СИГНАЛ', sub: 'НАЙТИ ТО, ЧТО РАБОТАЕТ', t0: 64, t1: 84 },
    { id: 'IV', roman: 'IV', title: 'ФОКУС', sub: 'ВСЁ В ОДНУ ТОЧКУ', t0: 84, t1: 105 },
    { id: 'V', roman: 'V', title: 'ТОПЛИВО', sub: 'ДВИГАТЕЛЬ СТРАТЕГИИ', t0: 105, t1: 126 },
    { id: 'VI', roman: 'VI', title: 'СИСТЕМА', sub: '24 ЧАСА · КАЖДЫЙ ДЕНЬ', t0: 126, t1: 176 },
    { id: 'VII', roman: 'VII', title: 'ВЕЛИКОЕ', sub: 'КУДА ВЕДЁТ СТРАТЕГИЯ', t0: 176, t1: 210 },
  ];
  F.actAt = (t) => {
    for (let i = F.ACTS.length - 1; i >= 0; i--) if (t >= F.ACTS[i].t0) return F.ACTS[i];
    return F.ACTS[0];
  };

  // ключевые удары — общие для картинки и звука
  F.T = {
    ignite: 1.5,
    title: 12.9,
    arrive: 34.5,
    flashI: 40.6,
    lock: 77.2,
    laser: 96.5,
    work: 112,
    health: 117,
    flow: 119.5,
    dial: 129.5,
    modules: [136, 143, 150, 157, 164],
    seal: 160.2,
    unify: 171,
    beam: 182,
    nova: 186,
    words: [188.8, 190.05, 191.3, 192.55, 193.8, 195.05],
    finale: 196.3,
    coda: 204,
  };

  // ───────────────────────── общие данные ─────────────────────────
  F.buildData = function () {
    const D = {};

    // Акт II — треки проектов (пузырьковая камера)
    const r = F.rng(4041), tracks = [];
    const waves = [
      { t: 45.2, n: 8, span: 0.9 },
      { t: 48.6, n: 16, span: 1.3 },
      { t: 52.0, n: 24, span: 1.7 },
      { t: 55.4, n: 24, span: 1.7 },
    ];
    let idx = 0;
    waves.forEach((w) => {
      for (let i = 0; i < w.n; i++) {
        idx++;
        const survivor = idx === 41;
        const L = w.t + (i / w.n) * w.span + r() * 0.12;
        let th = r() * F.TAU, dir = r() < 0.5 ? -1 : 1;
        let k0 = 0.0011 + r() * 0.0028, grow = 260 + r() * 520, S = 520 + r() * 900, v = 520 + r() * 520;
        let die = 0.3 + r() * 0.62;
        if (survivor) { th = -0.62; dir = -1; k0 = 0.0016; grow = 900; S = 820; v = 560; die = 1; }
        // путь: интегрирование кривизны, растущей вдоль пути (закручивание в спираль)
        const pts = [];
        let x = 0, y = 0, a = th;
        const ds = 6;
        for (let s = 0; s <= S; s += ds) {
          pts.push(x, y);
          const k = dir * k0 * Math.exp(s / grow);
          a += k * ds;
          x += Math.cos(a) * ds;
          y += Math.sin(a) * ds;
        }
        const T = (S / v) * 1.8;
        const xd = 1 - Math.pow(1 - Math.min(die, 0.999), 1 / 3);
        tracks.push({
          id: idx, label: 'П-' + String(idx).padStart(3, '0'), L, T, S, pts, survivor,
          die, deathT: survivor ? Infinity : L + xd * T,
          hue: survivor ? 'gold' : r() < 0.22 ? 'gold' : 'steel',
          showLabel: survivor || idx % 3 === 0,
          pan: Math.cos(th) * 0.8,
          note: [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84][(r() * 12) | 0],
        });
      }
    });
    D.tracks = tracks;
    D.survivor = tracks.find((t) => t.survivor);

    // Акт V — удары сердца (ускоряются к концу)
    const beats = [];
    let bt = 106.2;
    while (bt < 125.6) {
      beats.push(bt);
      const p = seg(bt, 106, 126);
      bt += lerp(0.88, 0.6, p * p);
    }
    D.beats = beats;

    // тиканье часов (как у Циммера — каждые 1.25 с)
    const ticks = [];
    for (let t = 0.6; t < 11.5; t += 1.25) ticks.push([t, 0.55]);
    for (let t = 128.1; t < 175.9; t += 1.25) ticks.push([t, t > 171 ? 0.75 : 0.5]);
    for (let t = 204.6; t < 210; t += 1.25) ticks.push([t, 0.6]);
    D.ticks = ticks;
    return D;
  };

  // положение головы трека в момент t
  F.trackState = function (tr, t) {
    const tau = t - tr.L;
    if (tau <= 0) return null;
    const tt = Math.min(tau, tr.deathT - tr.L);
    const s = tr.S * ease.out(Math.min(1, tt / tr.T));
    const n = tr.pts.length / 2;
    const fi = Math.min(n - 1, s / 6);
    const i = Math.floor(fi), f = fi - i, j = Math.min(n - 1, i + 1);
    return {
      s, idx: fi,
      x: lerp(tr.pts[i * 2], tr.pts[j * 2], f),
      y: lerp(tr.pts[i * 2 + 1], tr.pts[j * 2 + 1], f),
      dead: t >= tr.deathT,
      sinceDeath: t - tr.deathT,
    };
  };

  // ───────────────────────── закадровые строки ─────────────────────────
  const S = (t0, t1, text, o = {}) => Object.assign({ t0, t1, text }, o);
  F.LINES = [
    S(2.6, 7.0, 'Великое не случается случайно.', { y: 712 }),
    S(7.6, 11.0, 'У него есть стратегия.', { y: 712 }),

    S(21.5, 26.0, 'Иди туда, где собираются лучшие.'),
    S(26.5, 31.0, 'Самые амбициозные. Самые невероятные.'),
    S(32.0, 37.0, 'Будь рядом. Двигайся с их скоростью.'),

    S(45.5, 50.0, 'Делай проекты. Много. Параллельно.'),
    S(50.5, 55.0, 'Пробуй всё, что может сработать.'),
    S(56.5, 62.0, 'Большинство погаснет. Так и задумано.'),

    S(68.5, 72.5, 'Пока одна не загорится.'),
    S(73.0, 77.4, 'Вложенное возвращается многократно.'),
    S(78.4, 83.4, 'ЭТО СИГНАЛ', { big: true }),

    S(88.6, 92.4, 'Остальное — отпустить.'),
    S(92.8, 96.4, 'Всё — в одну точку.'),
    S(97.6, 104.4, 'Рассеянный свет греет.', { y: 846 }),
    S(99.4, 104.4, 'Сфокусированный — прожигает.', { y: 906, gold: true }),

    S(109.5, 114.4, 'Чтобы много пробовать — нужно очень много работать.'),
    S(115.0, 119.4, 'Чтобы много работать — нужно здоровье.'),
    S(120.0, 125.5, 'Здоровье — фундамент всей стратегии.', { gold: true }),

    S(130.5, 134.8, 'Поэтому у каждого дня есть структура.'),
    S(136.4, 142.6, 'Движение встроено в каждый день.'),
    S(143.3, 146.5, 'Дневник: честный анализ — где я сейчас.'),
    S(146.8, 149.8, 'И корректировка курса.'),
    S(150.4, 156.6, 'Книги о бизнесе. Лекции YC. Новые навыки.'),
    S(157.3, 160.0, 'Китайский язык.'),
    S(160.4, 163.8, 'Дверь к возможностям меняющегося мира.'),
    S(164.4, 167.4, 'Социальные навыки. Дружба на десятилетия.'),
    S(167.8, 170.8, 'В долгую это умножает шансы на великое.', { gold: true }),
    S(171.6, 175.6, 'Одна система. Каждый день.'),

    S(204.8, 207.6, 'Каждое утро — снова.', { y: 560 }),
  ];
})();
