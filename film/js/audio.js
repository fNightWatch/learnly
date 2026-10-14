/* СТРАТЕГИЯ — саундтрек. Синтезируется целиком в Web Audio (без сэмплов)
   и рендерится оффлайн в один буфер, поэтому идеально совпадает с картинкой. */
(function () {
  'use strict';
  const F = window.F;
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function Score(ctx) {
    this.ctx = ctx;
    this.rnd = F.rng(909);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 10;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.006;
    comp.release.value = 0.3;
    const master = ctx.createGain();
    master.gain.value = 0.62;
    master.connect(comp);
    comp.connect(ctx.destination);
    const rev = ctx.createConvolver();
    rev.normalize = true;
    rev.buffer = this.impulse(5.5, 2.4);
    const revIn = ctx.createGain();
    const revOut = ctx.createGain();
    revOut.gain.value = 0.5;
    revIn.connect(rev);
    rev.connect(revOut);
    revOut.connect(master);
    this.master = master;
    this.rev = revIn;

    const sr = ctx.sampleRate, nb = ctx.createBuffer(1, sr * 6, sr), d = nb.getChannelData(0), r = F.rng(31);
    for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
    this.noiseBuf = nb;

    const harm = [0, 1, 0.55, 0.32, 0.26, 0.12, 0.16, 0.06, 0.1, 0.03, 0.05, 0.02, 0.03];
    this.organ = ctx.createPeriodicWave(new Float32Array(harm.length), new Float32Array(harm));
    const curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) curve[i] = Math.tanh(((i / 2047) * 2 - 1) * 3);
    this.curve = curve;
  }
  const P = Score.prototype;

  P.impulse = function (dur, decay) {
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * dur), b = ctx.createBuffer(2, len, sr), r = F.rng(5);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len, a = 0.12 + 0.8 * k;
        lp = lp + (1 - a) * ((r() * 2 - 1) - lp);
        d[i] = lp * Math.pow(1 - k, decay) * (i < sr * 0.012 ? i / (sr * 0.012) : 1);
      }
    }
    return b;
  };

  P.out = function (node, dry = 1, wet = 0.3, pan = 0) {
    const ctx = this.ctx;
    let n = node;
    if (pan) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      node.connect(p);
      n = p;
    }
    if (dry > 0) {
      const g = ctx.createGain();
      g.gain.value = dry;
      n.connect(g);
      g.connect(this.master);
    }
    if (wet > 0) {
      const g = ctx.createGain();
      g.gain.value = wet;
      n.connect(g);
      g.connect(this.rev);
    }
  };

  P.noise = function (t, dur) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    s.start(t, this.rnd() * 5);
    s.stop(t + dur);
    return s;
  };

  P.env = function (g, t, peak, att, hold, rel) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + att);
    g.gain.setValueAtTime(peak, t + att + hold);
    g.gain.linearRampToValueAtTime(0, t + att + hold + rel);
  };

  // органный/струнный пэд
  P.pad = function (t0, t1, notes, o = {}) {
    const ctx = this.ctx, vol = o.vol == null ? 0.03 : o.vol;
    const att = Math.min(o.att == null ? 2 : o.att, (t1 - t0) * 0.9), rel = o.rel == null ? 2 : o.rel;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 0.6;
    filt.frequency.setValueAtTime(o.cut || 1200, t0);
    filt.frequency.linearRampToValueAtTime(o.cut1 || o.cut || 1200, t1);
    const g = ctx.createGain();
    this.env(g, t0, vol, att, Math.max(0, t1 - t0 - att), rel);
    filt.connect(g);
    this.out(g, o.dry == null ? 0.8 : o.dry, o.wet == null ? 0.55 : o.wet);
    for (const m of notes)
      for (const det of [-6, 6]) {
        const osc = ctx.createOscillator();
        if (o.wave === 'saw') osc.type = 'sawtooth';
        else if (o.wave === 'tri') osc.type = 'triangle';
        else osc.setPeriodicWave(this.organ);
        osc.frequency.value = mtof(m);
        osc.detune.value = det + (this.rnd() - 0.5) * 3;
        const p = ctx.createStereoPanner();
        p.pan.value = det < 0 ? -0.45 : 0.45;
        osc.connect(p);
        p.connect(filt);
        osc.start(t0);
        osc.stop(t1 + rel + 0.05);
      }
  };

  P.sub = function (t0, t1, m, vol = 0.16, att = 1.5, rel = 1.5) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = mtof(m);
    att = Math.min(att, (t1 - t0) * 0.9);
    this.env(g, t0, vol, att, Math.max(0, t1 - t0 - att), rel);
    o.connect(g);
    this.out(g, 1, 0.04);
    o.start(t0);
    o.stop(t1 + rel + 0.05);
  };

  // «брааам» — дисторшн-пила + суб-удар + шумовой хвост
  P.braam = function (t, root = 33, o = {}) {
    const ctx = this.ctx, vol = o.vol == null ? 0.5 : o.vol, dur = o.dur || 4.5, br = o.bright == null ? 1 : o.bright;
    const pre = ctx.createGain();
    pre.gain.value = 0.3;
    const sh = ctx.createWaveShaper();
    sh.curve = this.curve;
    sh.oversample = '2x';
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 2.2;
    f.frequency.setValueAtTime(90, t);
    f.frequency.exponentialRampToValueAtTime(260 + 1300 * br, t + 0.2);
    f.frequency.exponentialRampToValueAtTime(140, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    pre.connect(sh);
    sh.connect(f);
    f.connect(g);
    this.out(g, 0.85, 0.7);
    [[0, -9], [0, 9], [12, -6], [12, 7], [7, 0], [19, 4], [-12, 0]].forEach(([iv, det]) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = mtof(root + iv);
      osc.detune.value = det;
      osc.connect(pre);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    });
    const s = ctx.createOscillator(), sg = ctx.createGain();
    s.type = 'sine';
    s.frequency.setValueAtTime(mtof(root) * 1.7, t);
    s.frequency.exponentialRampToValueAtTime(mtof(root) * 0.8, t + 0.8);
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(vol * 1.3, t + 0.012);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    s.connect(sg);
    this.out(sg, 1, 0);
    s.start(t);
    s.stop(t + 2.7);
    const n = this.noise(t, 2.6), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
    nf.type = 'lowpass';
    nf.frequency.setValueAtTime(2600 * br + 400, t);
    nf.frequency.exponentialRampToValueAtTime(220, t + 2.2);
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    n.connect(nf);
    nf.connect(ng);
    this.out(ng, 0.6, 0.8);
  };

  P.tick = function (t, vol = 0.5) {
    const ctx = this.ctx;
    const n = this.noise(t, 0.07), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass';
    bp.frequency.value = 3600;
    bp.Q.value = 2.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(bp);
    bp.connect(g);
    this.out(g, 0.8, 0.3, 0.12);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.value = 1900;
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(vol * 0.1, t + 0.001);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    o.connect(og);
    this.out(og, 0.8, 0.3, 0.12);
    o.start(t);
    o.stop(t + 0.05);
  };

  P.pluck = function (t, m, vol = 0.08, pan = 0, dec = 1.6) {
    const ctx = this.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = mtof(m);
    o2.type = 'sine';
    o2.frequency.value = mtof(m + 12);
    g2.gain.value = 0.3;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(4200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dec);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(f);
    o2.connect(g2);
    g2.connect(f);
    f.connect(g);
    this.out(g, 0.6, 0.6, pan);
    o.start(t);
    o2.start(t);
    o.stop(t + dec + 0.05);
    o2.stop(t + dec + 0.05);
  };

  P.bell = function (t, m, vol = 0.08, pan = 0, dec = 4) {
    const ctx = this.ctx, bus = ctx.createGain();
    this.out(bus, 0.5, 0.8, pan);
    [[1, 1, 1], [2, 0.45, 0.7], [2.76, 0.32, 0.5], [4.07, 0.18, 0.34], [5.4, 0.1, 0.22]].forEach(([ratio, amp, dk]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = mtof(m) * ratio;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * amp, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec * dk);
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + dec * dk + 0.05);
    });
  };

  P.gong = function (t, vol = 0.3) {
    const ctx = this.ctx, bus = ctx.createGain();
    this.out(bus, 0.7, 0.9);
    [[1, 1, 7], [1.47, 0.6, 6], [1.92, 0.5, 5], [2.56, 0.35, 4.2], [3.21, 0.25, 3.4], [4.12, 0.16, 2.6], [5.3, 0.1, 2]].forEach(([ratio, amp, dk]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(82 * ratio, t);
      o.frequency.linearRampToValueAtTime(82 * ratio * 1.035, t + 1.2);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol * amp, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dk);
      o.connect(g);
      g.connect(bus);
      o.start(t);
      o.stop(t + dk + 0.05);
    });
    const n = this.noise(t, 0.4), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    n.connect(f);
    f.connect(g);
    g.connect(bus);
  };

  P.thump = function (t, vol = 0.5, f0 = 78, f1 = 38, dec = 0.32) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(g);
    this.out(g, 1, 0.08);
    o.start(t);
    o.stop(t + dec + 0.05);
  };
  P.heartbeat = function (t, vol) {
    this.thump(t, vol);
    this.thump(t + 0.27, vol * 0.62);
  };
  P.drum = function (t, vol = 0.5) {
    this.thump(t, vol, 120, 42, 0.9);
    const ctx = this.ctx, n = this.noise(t, 0.3), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass';
    f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    n.connect(f);
    f.connect(g);
    this.out(g, 0.8, 0.5);
  };

  P.riser = function (t0, t1, vol = 0.25) {
    const ctx = this.ctx, d = t1 - t0;
    const n = this.noise(t0, d + 0.05), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass';
    bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(250, t0);
    bp.frequency.exponentialRampToValueAtTime(7000, t1);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t1 - 0.02);
    g.gain.linearRampToValueAtTime(0, t1 + 0.03);
    n.connect(bp);
    bp.connect(g);
    this.out(g, 0.7, 0.5);
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), og = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(mtof(45), t0);
    o.frequency.exponentialRampToValueAtTime(mtof(69), t1);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(300, t0);
    f.frequency.exponentialRampToValueAtTime(3500, t1);
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(vol * 0.35, t1 - 0.02);
    og.gain.linearRampToValueAtTime(0, t1 + 0.03);
    o.connect(f);
    f.connect(og);
    this.out(og, 0.6, 0.6);
    o.start(t0);
    o.stop(t1 + 0.05);
  };

  P.laser = function (t, vol = 0.35) {
    const ctx = this.ctx, o = ctx.createOscillator(), sh = ctx.createWaveShaper(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(3400, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.9);
    sh.curve = this.curve;
    f.type = 'lowpass';
    f.frequency.value = 5000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    o.connect(sh);
    sh.connect(f);
    f.connect(g);
    this.out(g, 0.7, 0.6);
    o.start(t);
    o.stop(t + 1.35);
  };

  P.burn = function (t0, t1, vol = 0.05) {
    const ctx = this.ctx, n = this.noise(t0, t1 - t0 + 0.6), bp = ctx.createBiquadFilter(), g = ctx.createGain(), r = F.rng(77);
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 0.7;
    g.gain.setValueAtTime(0, t0);
    for (let t = t0; t < t1; t += 1 / 28) g.gain.setValueAtTime(vol * (0.35 + r() * 0.65) * Math.min(1, (t1 - t) * 1.5), t);
    g.gain.setValueAtTime(0, t1);
    n.connect(bp);
    bp.connect(g);
    this.out(g, 0.7, 0.4, 0.2);
  };

  P.bed = function (t0, t1, vol = 0.05, cut = 800) {
    const ctx = this.ctx, n = this.noise(t0, t1 - t0 + 2), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass';
    f.frequency.value = cut;
    this.env(g, t0, vol, 2, Math.max(0, t1 - t0 - 3.5), 1.5);
    n.connect(f);
    f.connect(g);
    this.out(g, 0.8, 0.4);
  };

  P.tone = function (t0, t1, m, vol = 0.05, att = 3, rel = 1.5) {
    const ctx = this.ctx, o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.frequency.value = mtof(m);
    lfo.frequency.value = 5.2;
    lg.gain.value = mtof(m) * 0.004;
    lfo.connect(lg);
    lg.connect(o.frequency);
    this.env(g, t0, vol, Math.min(att, (t1 - t0) * 0.9), Math.max(0, t1 - t0 - att), rel);
    o.connect(g);
    this.out(g, 0.7, 0.7);
    o.start(t0);
    lfo.start(t0);
    o.stop(t1 + rel + 0.05);
    lfo.stop(t1 + rel + 0.05);
  };

  P.arp = function (t0, t1, step, chordAt, vol0, vol1, oct = 24) {
    let i = 0;
    for (let t = t0; t < t1; t += step, i++) {
      const ch = chordAt(t), notes = [ch[1], ch[2], ch[3], ch[4] || ch[3] + 5, ch[3], ch[2]];
      const v = vol0 + (vol1 - vol0) * ((t - t0) / (t1 - t0));
      this.pluck(t, notes[i % notes.length] + oct - 12, v, i % 2 ? 0.35 : -0.35, 0.9);
    }
  };

  // ───────────────────────── партитура ─────────────────────────
  F.buildScore = function (ctx) {
    const s = new Score(ctx), T = F.T, D = F.data;
    const Am = [45, 52, 57, 60, 64], Fm = [41, 48, 57, 60, 65], Cm = [48, 55, 60, 64, 67], G = [43, 50, 55, 59, 62];
    const Em = [40, 47, 52, 55, 59], Dsus = [38, 45, 50, 52, 57], E = [40, 47, 52, 56, 59], AM = [45, 52, 57, 61, 64, 69];
    const AmBig = [45, 52, 57, 60, 64, 69], FBig = [41, 48, 53, 57, 60, 65, 69];
    const chordFn = (list) => (t) => { let c = list[0][1]; for (const [t0, ch] of list) if (t >= t0) c = ch; return c; };

    D.ticks.forEach(([t, v]) => s.tick(t, v));

    // ПРОЛОГ
    s.braam(T.ignite, 33, { vol: 0.22, dur: 5, bright: 0.35 });
    s.bell(T.ignite, 81, 0.06, 0, 6);
    s.bell(T.ignite + 0.03, 88, 0.035, 0.25, 5);
    s.pad(T.ignite, 12.7, Am, { vol: 0.03, att: 4, rel: 1.2, cut: 500, cut1: 1500 });
    s.sub(T.ignite, 12.7, 33, 0.14, 4, 0.5);
    s.riser(10.2, T.title, 0.22);
    s.braam(T.title, 33, { vol: 0.55, dur: 6 });
    s.pad(T.title, 16.2, AmBig, { vol: 0.036, att: 0.05, rel: 2.2, cut: 2600, cut1: 1600 });
    s.sub(T.title, 16.2, 33, 0.2, 0.05, 1.5);
    [69, 76, 81, 84].forEach((m, i) => s.bell(T.title + 0.15 + i * 0.18, m, 0.045, i % 2 ? 0.3 : -0.3, 5));

    // АКТ I
    s.braam(17, 33, { vol: 0.42, dur: 4.5, bright: 0.8 });
    const chI = [[17, Am], [23, Fm], [29, Cm], [35, G]];
    s.pad(17.4, 23.2, Am, { vol: 0.03, att: 2.5, rel: 1, cut: 700, cut1: 1300 });
    s.pad(23, 29.2, Fm, { vol: 0.031, att: 1.2, rel: 1, cut: 900, cut1: 1600 });
    s.pad(29, 35.2, Cm, { vol: 0.032, att: 1.2, rel: 1, cut: 1100, cut1: 2000 });
    s.pad(35, 40.7, G, { vol: 0.034, att: 1.2, rel: 0.6, cut: 1400, cut1: 2800 });
    s.sub(17.4, 23.2, 33, 0.14);
    s.sub(23, 29.2, 29, 0.14, 1);
    s.sub(29, 35.2, 36, 0.13, 1);
    s.sub(35, 40.7, 31, 0.14, 1, 0.4);
    s.arp(25, 40.6, 0.3, chordFn(chI), 0.035, 0.075);
    s.braam(T.arrive, 36, { vol: 0.24, dur: 4, bright: 0.55 });
    [72, 76, 79, 84].forEach((m, i) => s.bell(T.arrive + i * 0.09, m, 0.05, (i - 1.5) * 0.25, 5));
    s.riser(38.2, 40.95, 0.3);

    // АКТ II
    s.braam(41, 33, { vol: 0.5, dur: 5 });
    s.pad(41.5, 63.4, [33, 45, 52], { vol: 0.068, att: 3, rel: 1, cut: 380, cut1: 900 });
    s.pad(52, 63, [69, 72, 76], { wave: 'tri', vol: 0.017, att: 4, rel: 1, cut: 3000 });
    for (let t = 45; t < 62.6; t += 0.5) s.thump(t, 0.2 + 0.2 * ((t - 45) / 17.6), 64, 40, 0.22);
    D.tracks.forEach((tr) => s.pluck(tr.L, tr.note, 0.09, tr.pan, 1.8));
    s.riser(62.1, 64, 0.2);

    // АКТ III
    s.braam(64, 26, { vol: 0.34, dur: 5, bright: 0.55 });
    s.bed(64.5, 77, 0.07, 900);
    s.pad(64.5, 77.1, Dsus, { vol: 0.028, att: 3, rel: 0.4, cut: 500, cut1: 900 });
    s.sub(64.5, 77.1, 26, 0.13, 2, 0.3);
    s.tone(71.5, 83.6, 81, 0.045, 4.5, 1.2);
    s.tone(T.lock, 83.6, 88, 0.025, 0.3, 1.2);
    s.braam(T.lock, 29, { vol: 0.46, dur: 5 });
    [77, 81, 84, 89].forEach((m, i) => s.bell(T.lock + i * 0.07, m, 0.05, (i - 1.5) * 0.3, 5));
    s.pad(T.lock, 83.4, [41, 48, 53, 57, 60, 65], { vol: 0.036, att: 0.08, rel: 1.4, cut: 2400, cut1: 1500 });
    s.sub(T.lock, 83.4, 29, 0.17, 0.05, 1.2);
    s.drum(78.4, 0.4);

    // АКТ IV
    s.braam(84, 28, { vol: 0.36, dur: 5, bright: 0.6 });
    s.pad(84.5, 96.45, E, { vol: 0.03, att: 3, rel: 0.04, cut: 500, cut1: 1900 });
    s.sub(84.5, 96.45, 28, 0.15, 2, 0.04);
    s.pad(89.5, 96.45, [64, 68, 71, 76], { wave: 'saw', vol: 0.011, att: 5, rel: 0.04, cut: 700, cut1: 4200 });
    s.riser(92.3, T.laser, 0.34);
    s.laser(T.laser, 0.34);
    s.braam(T.laser, 33, { vol: 0.72, dur: 6, bright: 1.25 });
    s.pad(T.laser, 100.6, AmBig, { vol: 0.042, att: 0.04, rel: 1, cut: 2800, cut1: 1800 });
    s.pad(100.5, 104.6, [48, 55, 60, 64, 67, 72], { vol: 0.04, att: 0.6, rel: 1.4, cut: 1800, cut1: 1200 });
    s.sub(T.laser, 104.6, 33, 0.2, 0.05, 1);
    s.burn(96.6, 104.4, 0.05);

    // АКТ V
    s.braam(105, 29, { vol: 0.34, dur: 4.5, bright: 0.5 });
    D.beats.forEach((b) => s.heartbeat(b, b < T.health ? 0.32 : 0.55));
    s.pad(105.5, 112, Fm, { vol: 0.027, att: 2.5, rel: 0.6, cut: 600, cut1: 1000 });
    s.braam(T.work, 31, { vol: 0.3, dur: 4, bright: 0.6 });
    s.pad(T.work, 117, G, { vol: 0.03, att: 0.6, rel: 0.5, cut: 900, cut1: 1400 });
    s.braam(T.health, 33, { vol: 0.5, dur: 5 });
    s.bell(T.health, 69, 0.07, 0, 6);
    s.pad(T.health, 121.4, Am, { vol: 0.034, att: 0.3, rel: 0.6, cut: 1200, cut1: 1800 });
    s.pad(121.3, 123.6, Cm, { vol: 0.036, att: 0.5, rel: 0.4, cut: 1600, cut1: 2200 });
    s.pad(123.5, 125.9, G, { vol: 0.04, att: 0.4, rel: 0.3, cut: 2000, cut1: 3400 });
    s.sub(T.health, 125.9, 33, 0.14, 0.3, 0.3);
    s.arp(T.flow, 125.9, 0.25, chordFn([[0, Am], [121.3, Cm], [123.5, G]]), 0.04, 0.085);
    [72, 76, 79, 84].forEach((m, i) => s.bell(122.5 + i * 0.08, m, 0.05, (i - 1.5) * 0.3, 5));
    s.riser(123.4, 126, 0.26);

    // АКТ VI
    s.braam(126, 33, { vol: 0.42, dur: 5 });
    [69, 72, 74, 76, 79, 81, 84].forEach((m, i) => s.bell(T.dial + i * 0.38, m, 0.04, (i / 6 - 0.5) * 0.8, 4));
    s.pad(130, 143.1, Am, { vol: 0.027, att: 3, rel: 0.6, cut: 700, cut1: 1200 });
    s.sub(130, 143.1, 33, 0.12, 2, 0.6);
    const motifs = [[81, 76, 69], [76, 74, 72], [79, 81, 84], [76, 74, 71], [74, 79, 83]];
    T.modules.forEach((m0, i) => {
      s.drum(m0, 0.32);
      motifs[i].forEach((m, k) => s.bell(m0 + 0.1 + k * 0.22, m, 0.045, (k - 1) * 0.35, 4));
    });
    for (let t = 136.75; t < 142.6; t += 0.75) s.thump(t, 0.22, 90, 45, 0.25);
    s.pad(143, 150.1, Fm, { vol: 0.027, att: 0.8, rel: 0.6, cut: 800, cut1: 1300 });
    s.sub(143, 150.1, 29, 0.12, 0.8, 0.6);
    s.pad(150, 157.1, Cm, { vol: 0.027, att: 0.8, rel: 0.6, cut: 1000, cut1: 1500 });
    s.sub(150, 157.1, 36, 0.11, 0.8, 0.6);
    const pent = [64, 67, 69, 71, 74, 76, 79, 81];
    const rr = F.rng(150);
    for (let t = 150.6; t < 156.6; t += 0.2) s.pluck(t, pent[(rr() * pent.length) | 0] + 12, 0.018, rr() * 1.4 - 0.7, 0.6);
    s.pad(157, 164.1, Em, { vol: 0.027, att: 0.8, rel: 0.6, cut: 900, cut1: 1400 });
    s.sub(157, 164.1, 28, 0.12, 0.8, 0.6);
    [76, 74, 71, 69, 71, 74, 76, 79].forEach((m, k) => s.pluck(157.4 + k * 0.33, m, 0.07, (k % 2 ? 0.3 : -0.3), 1.4));
    s.gong(T.seal, 0.34);
    s.braam(T.seal, 28, { vol: 0.25, dur: 4, bright: 0.4 });
    s.pad(164, 171.1, G, { vol: 0.029, att: 0.8, rel: 0.6, cut: 1000, cut1: 1600 });
    s.sub(164, 171.1, 31, 0.12, 0.8, 0.6);
    s.pad(171, 173.6, Fm, { vol: 0.034, att: 0.4, rel: 0.4, cut: 1400, cut1: 2200 });
    s.pad(173.5, 175.95, G, { vol: 0.038, att: 0.3, rel: 0.05, cut: 2000, cut1: 3600 });
    s.sub(171, 175.95, 29, 0.14, 0.4, 0.05);
    s.arp(171, 175.9, 0.1875, chordFn([[0, Fm], [173.5, G]]), 0.035, 0.08);
    s.riser(173.4, 176, 0.32);

    // АКТ VII
    s.braam(176, 33, { vol: 0.62, dur: 6, bright: 1.1 });
    s.drum(176, 0.5);
    s.pad(179, 182.1, Am, { vol: 0.03, att: 2, rel: 0.6, cut: 900, cut1: 2000 });
    s.pad(182, 186, Fm, { vol: 0.04, att: 0.4, rel: 0.05, cut: 1600, cut1: 3800 });
    s.pad(179, 186, [57, 60, 64, 69], { wave: 'saw', vol: 0.011, att: 4, rel: 0.05, cut: 600, cut1: 5200 });
    s.sub(179, 186, 33, 0.14, 2, 0.05);
    s.arp(180, 185.95, 0.15, chordFn([[0, Am], [182, Fm]]), 0.03, 0.085);
    s.laser(T.beam, 0.2);
    s.riser(183, T.nova, 0.4);
    s.braam(T.nova, 29, { vol: 0.75, dur: 6.5, bright: 1.35 });
    s.pad(T.nova, 188.6, FBig, { vol: 0.044, att: 0.05, rel: 1.2, cut: 3600, cut1: 1800 });
    s.sub(T.nova, 188.6, 29, 0.2, 0.05, 1);
    const stabs = [Am, Fm, Cm, G, Am, E];
    T.words.forEach((w, i) => {
      s.drum(w, 0.55);
      s.pad(w, w + 0.95, stabs[i], { vol: 0.036, att: 0.02, rel: 0.35, cut: 2600, cut1: 1400 });
      s.sub(w, w + 1.1, stabs[i][0] - 12, 0.16, 0.02, 0.2);
    });
    s.braam(T.finale, 33, { vol: 0.78, dur: 7.5, bright: 1.35 });
    s.drum(T.finale, 0.6);
    s.pad(T.finale, 203.1, AM, { vol: 0.05, att: 0.05, rel: 2.8, cut: 3400, cut1: 2000 });
    s.pad(T.finale, 203.1, [69, 73, 76, 81], { wave: 'saw', vol: 0.013, att: 0.6, rel: 2.5, cut: 4200, cut1: 2200 });
    s.sub(T.finale, 203.1, 33, 0.24, 0.05, 2.4);
    [81, 85, 88, 93, 97].forEach((m, i) => s.bell(T.finale + 0.2 + i * 0.16, m, 0.045, (i - 2) * 0.25, 6));

    // КОДА
    s.bell(207.6, 69, 0.05, 0, 6);
    s.pad(207.6, 209.4, [57, 64, 69, 73], { vol: 0.012, att: 1, rel: 0.5, cut: 900 });
    return s;
  };

  // оффлайн-рендер всего саундтрека в один буфер
  F.renderAudio = function (sampleRate, onProgress) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.reject(new Error('Web Audio недоступен'));
    const len = Math.ceil(F.DURATION * sampleRate);
    const ctx = new OAC(2, len, sampleRate);
    F.buildScore(ctx);
    if (onProgress && typeof ctx.suspend === 'function') {
      for (let t = 10; t < F.DURATION; t += 10)
        ctx.suspend(t).then(() => { onProgress(t / F.DURATION); ctx.resume(); }).catch(() => {});
    }
    return ctx.startRendering().then((buf) => {
      let peak = 0;
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > peak) peak = v; }
      }
      const g = peak > 0 ? 0.9 / peak : 1;
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i++) d[i] *= g;
      }
      return buf;
    });
  };
})();
