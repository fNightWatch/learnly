/* СТРАТЕГИЯ — плеер: постер, звук, таймлайн с актами, клавиатура, полный экран.
   В режиме рендера (window.__FILM_RENDER__) отдаёт кадры и звук наружу для сборки MP4. */
(function () {
  'use strict';
  const F = window.F;
  const RENDER = !!window.__FILM_RENDER__;
  const DUR = F.DURATION;
  const POSTER_T = 15.1;
  try { F.reduced = !RENDER && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { F.reduced = false; }

  const $ = (id) => document.getElementById(id);
  const fmt = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function boot() {
    F.loadFonts().then(() => {
      F.initScenes();
      if (RENDER) setupRender();
      else setupPlayer();
    });
  }

  // ───────────────────────── режим рендера ─────────────────────────
  function setupRender() {
    const cv = $('film');
    cv.width = 1920;
    cv.height = 1080;
    const ctx = cv.getContext('2d');
    let audioBuf = null;
    window.__film = {
      ready: true,
      duration: DUR,
      frame(t, q) {
        F.renderFrame(cv, ctx, t);
        return cv.toDataURL('image/jpeg', q || 0.93);
      },
      png(t) {
        F.renderFrame(cv, ctx, t);
        return cv.toDataURL('image/png');
      },
      audio(sr) {
        return F.renderAudio(sr || 48000).then((b) => { audioBuf = b; return { sr: b.sampleRate, len: b.length }; });
      },
      audioChunk(c, start, n) {
        const d = audioBuf.getChannelData(c).subarray(start, start + n);
        const i16 = new Int16Array(d.length);
        for (let i = 0; i < d.length; i++) i16[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
        const u8 = new Uint8Array(i16.buffer);
        let s = '';
        for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
        return btoa(s);
      },
    };
  }

  // ───────────────────────── плеер ─────────────────────────
  function setupPlayer() {
    const frame = $('frame'), cv = $('film'), ctx = cv.getContext('2d');
    const cover = $('cover'), bigPlay = $('bigPlay'), status = $('status');
    const playBtn = $('playBtn'), muteBtn = $('muteBtn'), fsBtn = $('fsBtn');
    const timeline = $('timeline'), fill = $('fill'), timeEl = $('time'), marks = $('marks');

    const audio = $('score');
    let audioOk = !!(audio && audio.canPlayType && audio.canPlayType('audio/mpeg'));
    let playing = false, offset = 0, startedAt = 0, dirty = true, started = false, isReady = false;
    let lastAT = -1, lastPN = 0;

    // размер холста = размер кадра × DPR, но не больше 1920
    function resize() {
      const r = frame.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.min(1920, Math.round(Math.min(r.width, (r.height * 16) / 9) * dpr)));
      if (cv.width !== w) {
        cv.width = w;
        cv.height = Math.round((w * 9) / 16);
        dirty = true;
      }
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(frame);
    window.addEventListener('resize', resize);
    resize();

    // маркеры актов на таймлайне
    F.ACTS.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mark';
      b.style.left = (a.t0 / DUR) * 100 + '%';
      b.textContent = a.roman || '◦';
      b.title = (a.roman ? 'Акт ' + a.roman + ' · ' : '') + a.title.charAt(0) + a.title.slice(1).toLowerCase();
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (!started) start(a.t0); else seek(a.t0); });
      marks.appendChild(b);
    });

    // звук: готовая дорожка, синтезированная тем же кодом (audio.js) и отрендеренная заранее
    status.textContent = 'Загружаю звук';
    function ready() {
      if (isReady) return;
      isReady = true;
      bigPlay.disabled = false;
      bigPlay.setAttribute('aria-label', 'Смотреть фильм');
      status.textContent = audioOk ? 'Смотреть со звуком' : 'Звук не загрузился · смотреть без звука';
      frame.classList.add('is-ready');
    }
    if (audioOk) {
      audio.addEventListener('canplay', ready, { once: true });
      audio.addEventListener('error', () => { audioOk = false; ready(); }, { once: true });
      audio.load();
      if (audio.readyState >= 3) ready();
      setTimeout(ready, 7000);
    } else ready();

    function now() {
      if (!playing) return offset;
      const pn = performance.now() / 1000;
      if (audioOk && !audio.paused) {
        const at = audio.currentTime;
        if (at !== lastAT) { lastAT = at; lastPN = pn; }
        return lastAT + Math.min(pn - lastPN, 0.25);
      }
      return offset + (pn - startedAt);
    }
    function play() {
      if (offset >= DUR - 0.05) offset = 0;
      startedAt = performance.now() / 1000;
      lastAT = -1;
      if (audioOk) {
        try {
          audio.currentTime = offset;
          const p = audio.play();
          // AbortError — запуск прерван нашей же паузой или перемоткой; это не поломка звука
          if (p && p.catch) p.catch((e) => { if (!e || e.name !== 'AbortError') audioOk = false; });
        } catch (e) { audioOk = false; }
      }
      playing = true;
      frame.classList.add('is-playing');
      frame.classList.remove('is-ended');
      playBtn.setAttribute('aria-label', 'Пауза');
      wake();
    }
    function pause() {
      offset = Math.min(DUR, now());
      playing = false;
      if (audioOk) audio.pause();
      frame.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Смотреть');
      dirty = true;
      wake();
    }
    function toggle() { if (!started) start(0); else if (playing) pause(); else play(); }
    function start(from) {
      if (bigPlay.disabled) return;
      started = true;
      cover.hidden = true;
      offset = from || 0;
      play();
    }
    function seek(t) {
      offset = Math.max(0, Math.min(DUR - 0.01, t));
      startedAt = performance.now() / 1000;
      lastAT = -1;
      if (audioOk) { try { audio.currentTime = offset; } catch (e) { /* позиция применится при запуске */ } }
      dirty = true;
    }
    function end() {
      pause();
      started = false;
      frame.classList.add('is-ended');
      cover.hidden = false;
      bigPlay.setAttribute('aria-label', 'Смотреть снова');
      status.textContent = 'Смотреть снова';
      offset = POSTER_T;
      dirty = true;
    }

    let lastUi = -1;
    function loop() {
      let t = now();
      if (playing && t >= DUR) { end(); t = offset; }
      if (playing || dirty) {
        F.renderFrame(cv, ctx, Math.min(t, DUR - 0.001));
        dirty = false;
      }
      const shown = started || playing ? t : 0;
      if (Math.abs(shown - lastUi) > 0.1) {
        lastUi = shown;
        fill.style.width = (Math.min(shown, DUR) / DUR) * 100 + '%';
        timeEl.textContent = fmt(shown) + ' / ' + fmt(DUR);
        timeline.setAttribute('aria-valuenow', String(Math.round(shown)));
        timeline.setAttribute('aria-valuetext', fmt(shown));
      }
      requestAnimationFrame(loop);
    }
    offset = POSTER_T;
    requestAnimationFrame(loop);

    // перемотка мышью/пальцем
    let drag = false;
    function posToT(e) {
      const r = timeline.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DUR;
    }
    timeline.addEventListener('pointerdown', (e) => {
      drag = true;
      timeline.setPointerCapture(e.pointerId);
      if (!started) { started = true; cover.hidden = true; offset = 0; }
      seek(posToT(e));
    });
    timeline.addEventListener('pointermove', (e) => { if (drag) seek(posToT(e)); });
    timeline.addEventListener('pointerup', () => { drag = false; });
    timeline.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') return;
      if (e.key === 'Home') { e.preventDefault(); seek(0); }
      if (e.key === 'End') { e.preventDefault(); seek(DUR - 1); }
    });

    bigPlay.addEventListener('click', () => start(0));
    playBtn.addEventListener('click', toggle);
    cv.addEventListener('click', () => { if (started) toggle(); });
    muteBtn.addEventListener('click', toggleMute);
    fsBtn.addEventListener('click', toggleFs);
    function toggleMute() {
      audio.muted = !audio.muted;
      frame.classList.toggle('is-muted', audio.muted);
      muteBtn.setAttribute('aria-label', audio.muted ? 'Включить звук' : 'Выключить звук');
    }
    function toggleFs() {
      const d = document;
      try {
        if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
        else {
          const req = frame.requestFullscreen || frame.webkitRequestFullscreen;
          const p = req && req.call(frame);
          if (p && p.catch) p.catch(() => {});
        }
      } catch (e) { /* полный экран недоступен */ }
    }
    document.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = e.key;
      if (k === ' ' || k === 'k' || k === 'K' || k === 'л' || k === 'Л') { e.preventDefault(); toggle(); }
      else if (k === 'ArrowRight') { e.preventDefault(); if (!started) { started = true; cover.hidden = true; offset = 0; } seek(now() + 5); }
      else if (k === 'ArrowLeft') { e.preventDefault(); if (!started) { started = true; cover.hidden = true; offset = 0; } seek(now() - 5); }
      else if (k === 'f' || k === 'F' || k === 'а' || k === 'А') toggleFs();
      else if (k === 'm' || k === 'M' || k === 'ь' || k === 'Ь') toggleMute();
      else return;
      wake();
    });

    // скрывать панель и курсор, пока фильм идёт
    let idleT = 0;
    function wake() {
      frame.classList.remove('is-idle');
      clearTimeout(idleT);
      idleT = setTimeout(() => { if (playing) frame.classList.add('is-idle'); }, 2600);
    }
    frame.addEventListener('pointermove', wake);
    frame.addEventListener('pointerdown', wake);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
