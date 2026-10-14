// Рендер фильма в MP4: headless Chromium рисует кадры, ffmpeg собирает видео и звук.
//   node film/render/render.mjs --out strategy.mp4 [--fps 30] [--workers 3]
//   node film/render/render.mjs --stills 14.4,30,52 --dir ./stills   (контрольные кадры PNG)
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node22/lib/node_modules/playwright'); }

const here = path.dirname(fileURLToPath(import.meta.url));
const page_url = pathToFileURL(path.join(here, '..', 'index.html')).href;
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const FPS = Number(args.fps || 30);
const WORKERS = Number(args.workers || 3);
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  await page.addInitScript(() => { window.__FILM_RENDER__ = true; });
  await page.goto(page_url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout: 60000 });
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight + ' ' + f.style));
  return { page, fonts: [...new Set(fonts)] };
}

function run(cmd, argv, opts = {}) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, argv, { stdio: ['pipe', 'inherit', 'inherit'], ...opts });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error(cmd + ' exited ' + c))));
    p.on('error', rej);
    if (opts.feed) opts.feed(p.stdin).then(() => p.stdin.end(), rej);
  });
}

async function stills(browser) {
  const dir = args.dir || 'stills';
  fs.mkdirSync(dir, { recursive: true });
  const { page, fonts } = await openPage(browser);
  console.log('fonts:', fonts.join(' | '));
  for (const t of args.stills.split(',').map(Number)) {
    const url = await page.evaluate((tt) => window.__film.png(tt), t);
    const file = path.join(dir, 't' + String(t.toFixed(2)).padStart(7, '0') + '.png');
    fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    console.log('still', file);
  }
}

async function audio(browser, wav) {
  const { page } = await openPage(browser);
  const t0 = Date.now();
  const { sr, len } = await page.evaluate(() => window.__film.audio(48000));
  console.log(`audio rendered: ${len} samples @ ${sr} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const chans = [];
  const CH = sr * 10;
  for (let c = 0; c < 2; c++) {
    const parts = [];
    for (let s = 0; s < len; s += CH) {
      const b64 = await page.evaluate(([cc, ss, nn]) => window.__film.audioChunk(cc, ss, nn), [c, s, Math.min(CH, len - s)]);
      parts.push(Buffer.from(b64, 'base64'));
    }
    chans.push(new Int16Array(new Uint8Array(Buffer.concat(parts)).buffer));
  }
  const data = Buffer.alloc(len * 4);
  for (let i = 0; i < len; i++) { data.writeInt16LE(chans[0][i], i * 4); data.writeInt16LE(chans[1][i], i * 4 + 2); }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(wav, Buffer.concat([h, data]));
  await page.close();
}

async function segment(browser, from, to, file) {
  const { page } = await openPage(browser);
  const t0 = Date.now();
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], {
    feed: async (stdin) => {
      for (let f = from; f < to; f++) {
        const url = await page.evaluate((tt) => window.__film.frame(tt, 0.94), f / FPS);
        const buf = Buffer.from(url.split(',')[1], 'base64');
        if (!stdin.write(buf)) await new Promise((r) => stdin.once('drain', r));
        if ((f - from) % 150 === 0) console.log(`  ${path.basename(file)}: frame ${f - from}/${to - from} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
      }
    },
  });
  await page.close();
}

async function film(browser) {
  const out = path.resolve(args.out || 'strategy.mp4');
  const work = path.resolve(args.work || path.join(path.dirname(out), 'render-work'));
  fs.mkdirSync(work, { recursive: true });
  const dur = Number(args.duration || 210);
  const total = Math.round(dur * FPS);
  const wav = args.wav ? path.resolve(args.wav) : path.join(work, 'audio.wav');
  const withAudio = !args.noaudio;
  if (withAudio && (!fs.existsSync(wav) || args.reaudio)) await audio(browser, wav);
  const per = Math.ceil(total / WORKERS), segs = [];
  for (let w = 0; w < WORKERS; w++) segs.push([w * per, Math.min(total, (w + 1) * per), path.join(work, `seg${w}.mp4`)]);
  await Promise.all(segs.map(([a, b, f]) => segment(browser, a, b, f)));
  const list = path.join(work, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s[2]}'`).join('\n'));
  const audioArgs = withAudio ? ['-i', wav, '-c:a', 'aac', '-b:a', '256k', '-shortest'] : [];
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, ...audioArgs,
    '-c:v', 'copy', '-movflags', '+faststart', out]);
  console.log('done:', out);
}

const browser = await playwright.chromium.launch({ proxy, args: ['--autoplay-policy=no-user-gesture-required'] });
try {
  if (args.stills) await stills(browser);
  else if (args.audio) await audio(browser, path.resolve(args.audio));
  else await film(browser);
} finally {
  await browser.close();
}
