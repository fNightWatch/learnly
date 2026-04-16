"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  phase: number;
  weight: number;
};

const ORANGE_BASE = [255, 153, 28] as const;

function createDots(width: number, height: number) {
  const area = Math.max(width * height, 1);
  const isCompact = Math.min(width, height) < 900;
  const targetCount = Math.max(
    isCompact ? 550 : 900,
    Math.min(isCompact ? 1450 : 2500, Math.round(area / (isCompact ? 1700 : 1300))),
  );

  const cols = Math.max(12, Math.round(Math.sqrt((targetCount * width) / Math.max(height, 1))));
  const gap = width / cols;
  const rows = Math.max(10, Math.round(height / Math.max(gap, 1)));
  const dots: Dot[] = [];

  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 === 0 ? gap * 0.5 : 0;
    for (let col = 0; col < cols; col += 1) {
      const homeX = col * gap + offset;
      const homeY = (row + 0.5) * (height / rows);
      if (homeX < -8 || homeX > width + 8) continue;

      dots.push({
        x: homeX + (Math.random() - 0.5) * 3,
        y: homeY + (Math.random() - 0.5) * 3,
        homeX,
        homeY,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2,
        weight: 0.65 + Math.random() * 0.9,
      });
    }
  }

  return dots;
}

function AntigravityDotField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, vx: 0, vy: 0 };
    let dots: Dot[] = [];
    let dpr = 1;
    let width = 1;
    let height = 1;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = createDots(width, height);
      pointer.tx = width * 0.5;
      pointer.ty = height * 0.5;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nextX = event.clientX - rect.left;
      const nextY = event.clientY - rect.top;
      pointer.vx = nextX - pointer.tx;
      pointer.vy = nextY - pointer.ty;
      pointer.tx = nextX;
      pointer.ty = nextY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.tx = width * 0.5;
      pointer.ty = height * 0.5;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running && rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(frame);
      }
    };

    let previous = performance.now();
    const frame = (now: number) => {
      rafRef.current = null;
      if (!running) return;

      const dt = Math.min((now - previous) / 16.6667, 2.4);
      previous = now;
      const t = now * 0.001;

      pointer.x += (pointer.tx - pointer.x) * 0.13 * dt;
      pointer.y += (pointer.ty - pointer.y) * 0.13 * dt;

      ctx.clearRect(0, 0, width, height);

      const influence = Math.max(140, Math.min(width, height) * 0.25);
      const influenceSq = influence * influence;
      const swirlStrength = pointer.active ? 0.75 : 0.18;
      const repelStrength = pointer.active ? 0.55 : 0.1;
      const trailKick = Math.min(
        8,
        Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy) * 0.06,
      );

      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        const toHomeX = dot.homeX - dot.x;
        const toHomeY = dot.homeY - dot.y;

        let fx = toHomeX * (0.012 + dot.weight * 0.0024);
        let fy = toHomeY * (0.012 + dot.weight * 0.0024);

        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < influenceSq) {
          const dist = Math.sqrt(Math.max(distSq, 0.0001));
          const near = 1 - dist / influence;
          const nx = dx / dist;
          const ny = dy / dist;

          const repel = near * near * repelStrength * dot.weight;
          fx += nx * repel;
          fy += ny * repel;

          const tx = -ny;
          const ty = nx;
          const swirl = near * swirlStrength * (0.45 + dot.weight * 0.25);
          fx += tx * swirl;
          fy += ty * swirl;

          if (pointer.active && trailKick > 0) {
            fx += pointer.vx * near * 0.004 * trailKick;
            fy += pointer.vy * near * 0.004 * trailKick;
          }
        }

        const waveA = Math.sin(t * 0.9 + dot.phase + dot.homeY * 0.011);
        const waveB = Math.cos(t * 0.73 + dot.phase * 0.7 + dot.homeX * 0.01);
        fx += waveA * 0.008;
        fy += waveB * 0.008;

        dot.vx = (dot.vx + fx * dt) * 0.915;
        dot.vy = (dot.vy + fy * dt) * 0.915;
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;

        const proximity = Math.max(
          0,
          1 - Math.sqrt((dot.x - pointer.x) ** 2 + (dot.y - pointer.y) ** 2) / influence,
        );
        const glow = pointer.active ? proximity * 0.9 : proximity * 0.35;
        const radius = 0.72 + dot.weight * 0.34 + glow * 1.45;
        const alpha = 0.12 + dot.weight * 0.11 + glow * 0.44;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ORANGE_BASE[0]}, ${ORANGE_BASE[1]}, ${ORANGE_BASE[2]}, ${Math.min(
          alpha,
          0.96,
        ).toFixed(4)})`;
        ctx.fill();
      }

      pointer.vx *= 0.82;
      pointer.vy *= 0.82;

      rafRef.current = window.requestAnimationFrame(frame);
    };

    resize();
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    rafRef.current = window.requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4">
      <p className="text-4xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/55">{label}</p>
    </div>
  );
}

const MARKETING_POINTS = [
  {
    title: "Adaptive scheduling",
    body: "Reviews move by memory state, so your time goes to words that are actually at risk.",
  },
  {
    title: "Context-first learning",
    body: "Every card ships with real examples and pronunciation for speaking and reading transfer.",
  },
  {
    title: "One focused queue",
    body: "No noisy gamification. Just the next meaningful cards that move your retention forward.",
  },
];

export function HomeGlassLanding() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <AntigravityDotField />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(1200px_560px_at_50%_16%,rgba(255,153,28,0.17),transparent_58%),radial-gradient(980px_480px_at_10%_100%,rgba(255,153,28,0.11),transparent_70%),radial-gradient(980px_480px_at_90%_100%,rgba(255,153,28,0.11),transparent_70%)]"
      />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-12 pt-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between rounded-3xl border border-white/12 bg-black/55 px-6 py-4 backdrop-blur-xl">
          <div className="text-[2.2rem] font-semibold tracking-tight text-white">LanguageHack</div>
          <nav className="hidden items-center gap-6 text-lg text-white/75 md:flex">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/words" className="transition hover:text-white">
              Words
            </Link>
          </nav>
          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded-full border border-[#ffcc7a] bg-[#ff991c] px-7 py-3 text-lg font-semibold text-black shadow-[0_14px_34px_rgba(255,153,28,0.34)] transition hover:brightness-105"
          >
            Start Studying
          </Link>
        </header>

        <div className="mt-12 grid flex-1 items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.34em] text-[#ff991c]">Built For Serious Recall</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Stop forgetting words after week one.
            </h1>
            <p className="mt-6 max-w-2xl text-2xl leading-relaxed text-white/74">
              LanguageHack is designed for retention, not streak taps. Learn with adaptive SRS,
              real examples, and pronunciation that transfers to conversation.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/review"
                className="inline-flex items-center justify-center rounded-full border border-[#ffcc7a] bg-[#ff991c] px-8 py-3 text-xl font-semibold text-black shadow-[0_14px_34px_rgba(255,153,28,0.34)] transition hover:brightness-105"
              >
                Start Studying
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/[0.03] px-8 py-3 text-xl font-medium text-white/82 transition hover:bg-white/[0.08] hover:text-white"
              >
                Dashboard
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <StatPill label="Active words" value="141" />
              <StatPill label="Day streak" value="1" />
              <StatPill label="Retention" value="75%" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/12 bg-black/55 p-6 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.34em] text-white/72">Why Learners Switch</p>
            <div className="mt-6 space-y-4">
              {MARKETING_POINTS.map((point) => (
                <article
                  key={point.title}
                  className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4"
                >
                  <h2 className="text-xl font-semibold tracking-tight text-white">{point.title}</h2>
                  <p className="mt-1 text-base leading-relaxed text-white/72">{point.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <footer className="mt-10 text-sm text-white/45">© {year} LanguageHack</footer>
      </section>
    </main>
  );
}

export default HomeGlassLanding;
