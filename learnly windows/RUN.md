# How to run Learnly

A total stranger should be able to go from a fresh clone to a working app in under 3 minutes by following this page top-to-bottom.

---

## TL;DR

```bash
git clone <this-repo>
cd learnly
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in a browser.

No database, no API keys, no `.env` file needed.

If `npm run dev` hangs after `seed-db: DB already up to date.` or the browser shows a Next.js dev-bundler error like `failed to receive message`, use the exact fallback that worked here:

```bash
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
pkill -f "tsx ./scripts/seed-db.ts" 2>/dev/null
rm -rf .next tsconfig.tsbuildinfo .next/cache/.tsbuildinfo 2>/dev/null
./node_modules/.bin/tsx ./scripts/seed-db.ts && ./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

`npm run dev` now runs guarded startup (`scripts/dev-stable.sh`) with:

- automatic DB safety snapshot before launch
- lightweight health checks on `/api/health`
- default warmup on `/`, `/dashboard`, and `/study`
- delayed re-verification of those core routes after startup
- automatic fallback to `next dev --turbo` if plain `next dev` reaches health but the core pages still stall
- auto-restart only after sustained health failure (to avoid false restarts during cold compile)

---

## 1. What you need installed

| Tool | Version | How to check | Where to get it |
|---|---|---|---|
| Node.js | 18 or newer | `node --version` | [nodejs.org](https://nodejs.org) |
| npm | Any recent | `npm --version` | ships with Node |
| git | Any recent | `git --version` | [git-scm.com](https://git-scm.com) |

Nothing else. The app runs entirely on your machine from an embedded SQLite database.

---

## 2. Install the project

From the folder where you want the project to live:

```bash
git clone <this-repo-url> learnly
cd learnly
npm install
```

`npm install` takes about a minute. It's done when you see something like:

```
added 412 packages in 58s
```

---

## 3. Start the app

```bash
npm run dev
```

You should see, within a few seconds:

```
seed-db: DB already up to date.
  ▲ Next.js 13.5.6
  - Local:        http://localhost:3000

 ✓ Ready in 1511ms
```

What just happened:

1. A safety snapshot of `.learnly/learnly.db` is created in `.learnly/safety-backups/` (if DB exists).
2. The seed script updates corpus tables incrementally (no destructive reset).
3. Next.js starts on port **3000**, waits for `/api/health`, warms `/`, `/dashboard`, and `/study`, then rechecks those routes after a short delay.
4. If plain `next dev` reaches health but those core routes still do not answer, the watchdog restarts in `--turbo` mode automatically.

Open **[http://localhost:3000](http://localhost:3000)** in your browser. In this repo, a cold first compile can take much longer (sometimes 60-120+ seconds), then warm requests become fast.

### Exact recovery path that was required in this repo on April 18, 2026

This section documents the exact sequence that was needed to get the site working in this workspace when the standard dev path stalled.

#### What failed

- `npm run dev` ran `seed-db.ts`, but plain `next dev` bound the port and then stalled while serving requests.
- The browser showed a Next.js error overlay with `Error: failed to receive message`.
- `next build` also stalled, so this was not just a bad hot-reload state.
- A temporary Node 20 fallback was **not** usable because `better-sqlite3` in `node_modules` had been built against Node 22 ABI.

#### Root cause that mattered

- The root `tsconfig.json` used to include broad `**/*.ts` and `**/*.tsx` globs.
- This repo contains heavy non-web trees at the root (`macos/`, `languagehack_ios/`, `corpus-generation/`, etc.).
- Letting Next inspect the whole repo could trigger dev-bundler timeouts and the `failed to receive message` error.
- The fix was to narrow `tsconfig.json` to web-relevant paths only (`src`, `scripts`, `tests`, `data`, and config files) and explicitly exclude the heavy non-web directories.

#### Exact commands that worked

1. Kill stale Learnly dev processes:

```bash
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
pkill -f "tsx ./scripts/seed-db.ts" 2>/dev/null
```

2. Clear generated Next/TypeScript artifacts:

```bash
rm -rf .next tsconfig.tsbuildinfo .next/cache/.tsbuildinfo 2>/dev/null
```

3. Start the app with the manual seed + Turbopack path:

```bash
./node_modules/.bin/tsx ./scripts/seed-db.ts && ./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000
```

4. Wait for output like:

```text
seed-db: DB already up to date.
  ▲ Next.js 13.5.6
  - Local:        http://127.0.0.1:3000

 ✓ Ready in 638ms
```

5. Verify the server is actually answering:

```bash
curl --noproxy '*' -I --max-time 20 http://127.0.0.1:3000/
curl --noproxy '*' -I --max-time 30 http://127.0.0.1:3000/dashboard
```

Expected result for both is `HTTP/1.1 200 OK`.

#### Why this fallback is the current best run command

- It keeps the required `seed-db.ts` step.
- It avoids the stalled standard dev path seen in this repo on Node 22.
- After the `tsconfig.json` narrowing, it compiled `/` and `/dashboard` successfully and served both pages with `200 OK`.

---

## 4. Navigate the app

| Page | URL | What's there |
|---|---|---|
| Landing | [localhost:3000](http://localhost:3000) | Marketing + live queue preview |
| Dashboard | [localhost:3000/dashboard](http://localhost:3000/dashboard) | Metrics, session setup, queue outlook |
| Study | [localhost:3000/study](http://localhost:3000/study) | Active FSRS review session |
| Words | [localhost:3000/words](http://localhost:3000/words) | All studied words across languages |

---

## Performance & Latency Toolkit (April 20, 2026)

This repo now ships runtime timing + benchmark tooling for repeatable speed checks.

### 1) API timing headers

Hot routes now return:

- `server-timing` (parse/data/submit/total where relevant)
- `x-response-time-ms`

Routes covered:

- `GET /api/dashboard` (plus ETag + short private SWR caching)
- `GET /api/settings` and `PUT /api/settings`
- `POST /api/session/start`
- `GET /api/session/:id/resume`
- `GET /api/session/:id/next`
- `POST /api/reviews` (includes idempotency support)

### 2) Idempotent review submissions

`POST /api/reviews` now accepts optional header:

```http
x-idempotency-key: <client-generated-key>
```

If the same `user + session + item + key` is retried, the stored response is returned and duplicate write work is skipped.

### 3) Repeatable benchmark commands

Non-mutating benchmark suite:

```bash
npm run perf:bench
```

This measures:

- `GET /api/health`
- `GET /api/settings`
- `GET /api/dashboard`
- `POST /api/session/start`
- `GET /dashboard`
- `GET /study`

Mutating `/api/reviews` flow benchmark (explicit opt-in only):

```bash
ALLOW_MUTATING_BENCH=1 npm run perf:bench:reviews
```

This runs up to 100 real review submissions and changes learner progress.
Never run it unless you intentionally want to mutate progress (or you have already backed up/restored a disposable DB snapshot).

---

## 5. Stop the app

Press **Ctrl + C** in the terminal running `npm run dev`.

If you started it in the background and lost the terminal, kill it by port:

```bash
pkill -f "next dev"
pkill -f "next-router-worker"
```

---

## User Data Safety (Hard Rule)

User progress is priority-zero data in this repo.

- Never run `rm .learnly/learnly.db` as routine troubleshooting.
- Never overwrite `.learnly/learnly.db` without first creating a timestamped backup copy.
- Always compare progress counts before and after any restore/recovery step.
- Always prefer highest-progress backup from `.learnly/progress-backups/` when recovery is needed.

Quick count check:

```bash
node - <<'NODE'
const Database = require('better-sqlite3');
const db = new Database('.learnly/learnly.db', { readonly: true });
const user = 'demo-user';
console.log({
  itemStates: db.prepare('select count(*) c from user_item_states where user_id=?').get(user).c,
  reviewEvents: db.prepare('select count(*) c from review_events where user_id=?').get(user).c,
  sessions: db.prepare('select count(*) c from sessions where user_id=?').get(user).c
});
NODE
```

---

## Troubleshooting

**"Port 3000 is in use"**
Next.js will fall back to 3001, 3002, etc. automatically — look at the `Local:` line in the terminal for the actual URL. To free up 3000: `pkill -f "next dev"`.

**`npm install` fails on `better-sqlite3`**
`better-sqlite3` compiles native bindings. On macOS, make sure Xcode Command Line Tools are installed: `xcode-select --install`. On Linux, you need `build-essential` and `python3`.

**Blank page or "Cannot GET /"**
The first request compiles the route. Give it 10–15 seconds on cold start, then refresh.

**Changes to code aren't showing up**
The dev server hot-reloads automatically. If it seems stuck, stop it (Ctrl + C) and run `npm run dev` again.

**Progress looks gone (dashboard dropped to zeros)**
Do not reseed blindly. First inspect `.learnly/progress-backups/` and restore the highest-progress DB snapshot.

Fastest safe option:

```bash
npm run progress:best
npm run progress:restore-best
HOST=127.0.0.1 PORT=3000 npm run dev
```

Safe restore flow:

```bash
cd /Users/moi/Desktop/business/learnly
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
cp -p .learnly/learnly.db ".learnly/learnly.db.before-restore-$(date +%Y%m%d-%H%M%S)"
cp -p .learnly/progress-backups/<chosen-backup>.db .learnly/learnly.db
rm -f .learnly/learnly.db-wal .learnly/learnly.db-shm
HOST=127.0.0.1 PORT=3000 npm run dev
```

Verify restored counts quickly:

```bash
node - <<'NODE'
const Database = require('better-sqlite3');
const db = new Database('.learnly/learnly.db', { readonly: true });
const user = 'demo-user';
console.log({
  itemStates: db.prepare('select count(*) c from user_item_states where user_id=?').get(user).c,
  reviewEvents: db.prepare('select count(*) c from review_events where user_id=?').get(user).c,
  sessions: db.prepare('select count(*) c from sessions where user_id=?').get(user).c
});
NODE
```

**Warning in Codex: `maximum number of unified exec processes ...`**
This warning is from the Codex terminal session manager (too many open command sessions), not from Next.js itself. In this state, old sessions can be auto-pruned, and a dev server started in one of those sessions may disappear.

Use this safe sequence:

```bash
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
HOST=127.0.0.1 PORT=3000 npm run dev
```

Then verify the three core routes sequentially (not all at once on cold start; use long first-run timeouts):

```bash
curl --max-time 120 -I http://127.0.0.1:3000/
curl --max-time 180 -I http://127.0.0.1:3000/dashboard
curl --max-time 180 -I http://127.0.0.1:3000/study
```

Expected result for each: `HTTP/1.1 200 OK`.

**Next.js overlay says `Error: failed to receive message`**
This repo has hit a dev-bundler timeout mode where plain `next dev` stalls even though the seed step succeeds. Use the exact recovery path from Section 3:

```bash
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
pkill -f "tsx ./scripts/seed-db.ts" 2>/dev/null
rm -rf .next tsconfig.tsbuildinfo .next/cache/.tsbuildinfo 2>/dev/null
./node_modules/.bin/tsx ./scripts/seed-db.ts && ./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000
```

Also make sure `tsconfig.json` is still narrowly scoped to the web app. If someone widens it back to root-level `**/*.ts(x)` globs, the error can return.

**Why not just switch to Node 20 temporarily?**
Do not assume that is safe in an existing install. In this workspace, `better-sqlite3` was already compiled for Node 22, so an ad hoc Node 20 run failed with a native module ABI mismatch.

### April 18, 2026: second recovery sequence (app "running" but routes broken)

This exact failure happened in this repo:

- `next dev` reached `Ready`
- `/` timed out or hung
- `/dashboard` and `/study` returned `500`

Root causes found:

1. `src/lib/demo/store.ts` used `require("./store.runtime.cjs")`, which resolves from `.next` chunk paths in dev and fails with `Cannot find module './store.runtime.cjs'`.
2. `data/corpus-seed.json` was truncated (`Unexpected end of JSON input`) so seeding could silently fail.
3. `.learnly/learnly.db` became invalid (`file is not a database`).

Fix sequence that worked:

```bash
cd /Users/moi/Desktop/business/learnly

# 1) make sure Next is pinned to the known-good major for this repo
npm install next@13.5.6

# 2) repair dependencies after version changes
rm -rf node_modules
npm install

# 3) regenerate valid corpus JSON
./node_modules/.bin/tsx ./scripts/export-corpus-json.ts

# 4) backup broken DB and reseed from scratch
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
mv .learnly/learnly.db ".learnly/learnly.db.corrupt-$(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
./node_modules/.bin/tsx ./scripts/seed-db.ts

# 5) start server
./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000
```

Expected verification:

```bash
curl --noproxy '*' -I --max-time 40 http://127.0.0.1:3000/
curl --noproxy '*' -I --max-time 40 http://127.0.0.1:3000/dashboard
curl --noproxy '*' -I --max-time 40 http://127.0.0.1:3000/study
```

All three should return `HTTP/1.1 200 OK`.

### April 18, 2026: `progress protection` runtime crash after DB restore

If the app shows:

```text
Error: progress protection: current learner progress is lower than the last protected snapshot
```

and it happens right after replacing/reseeding `.learnly/learnly.db`, do this:

```bash
cd /Users/moi/Desktop/business/learnly
npm run build:store-runtime
pkill -f "next dev" 2>/dev/null
pkill -f "next-router-worker" 2>/dev/null
./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000
```

Why this now works:

- `src/lib/db/progress-protection.ts` now detects DB file replacement (inode/birthtime identity change).
- On replacement, it refreshes the protected baseline instead of throwing and killing route render.
- Accidental in-place progress drops in the same DB file are still blocked.

### April 18, 2026: invalid hook call (`useContext` / `usePathname`) + random dev freezes

Observed failures:

- `Unhandled Runtime Error` with `TypeError: Cannot read properties of null (reading 'useContext')`
- stack paths included Next internal chunks around `usePathname` / `ErrorBoundary`
- occasional route timeouts despite process being alive (`/dashboard` or `/study` hanging)
- intermittent `ERR_CONNECTION_REFUSED` after backgrounded launch/session pruning

Operational hardening added:

- default dev launch moved to watchdog script: `scripts/dev-stable.sh`
- launcher config now uses watchdog path instead of one-shot `next dev`
- health checks use lightweight `/api/health`
- startup warms `/`, `/dashboard`, and `/study` with long timeouts
- restart happens only after sustained health failure, not a few short probe misses
- startup now snapshots DB before any run cycle

This does not make development mathematically crash-proof, but it prevents silent dead-server states and auto-recovers from most random local dev failures.

### April 19, 2026: reliability root cause and hardening update

Observed during investigation:

- `next dev` could print `Ready` while first route requests still hung for a long time.
- Measured cold `/dashboard` first response took over 2 minutes before the first `200`.
- Short-timeout probes against heavy routes (`/dashboard`, `/study`) misclassified this normal cold compile as a crash and caused restart loops.

Fix now applied:

- added lightweight health endpoint: `src/app/api/health/route.ts`
- updated `scripts/dev-stable.sh` to:
  - wait for `/api/health` with long startup grace (`STARTUP_HEALTH_TIMEOUT_SEC`, default `300`)
  - skip heavy route warmup by default to avoid false crash loops on cold compile
  - support optional explicit warmup routes via `WARMUP_ROUTES` (comma-separated)
  - monitor with conservative threshold (`MONITOR_MAX_FAILURES`, default `10` every `20s`)
  - enforce single watcher lock (`.learnly/dev-stable.lock`) to avoid parallel watchdog instances

Optional tuning on slower machines:

```bash
STARTUP_HEALTH_TIMEOUT_SEC=420 MONITOR_MAX_FAILURES=12 npm run dev
WARMUP_ROUTES=/,/dashboard,/study WARMUP_TIMEOUT_SEC=300 npm run dev
```

### April 18, 2026: complete startup incident list handled in this workspace

Errors encountered and fixed:

1. `Error: failed to receive message` (Next dev-bundler timeout)
2. `Cannot find module './store.runtime.cjs'` (runtime import path issue)
3. `Unexpected end of JSON input` for `data/corpus-seed.json` (truncated seed export)
4. SQLite `file is not a database` (corrupted `.learnly/learnly.db`)
5. `progress protection: current learner progress is lower than the last protected snapshot` (DB replacement baseline mismatch)
6. `Cannot read properties of null (reading 'useContext')` from Next app runtime during route render
7. Codex warning `maximum number of unified exec processes` causing fragile detached server sessions

Fixes that are now documented and preserved:

- narrowed `tsconfig.json` scope for web app
- pinned Next to `13.5.6` in this repo path
- rebuilt `store.runtime.cjs` from `store-source.ts`
- regenerated corpus export JSON
- restored DB from highest-progress backups when needed
- updated progress-protection replacement handling
- switched launch path to guarded watchdog mode with liveness checks and restarts

---

## Other useful commands

| Command | Purpose |
|---|---|
| `npm run build` | Production build |
| `npm start` | Run the production build (requires `npm run build` first) |
| `npm run dev:plain` | One-shot dev startup without watchdog (fallback/debug only) |
| `npm run dev:turbo` | Manual Turbopack startup path on 127.0.0.1:3000 (fallback) |
| `npm run progress:best` | Show current progress vs highest backup (dry run) |
| `npm run progress:restore-best` | Restore highest-progress backup safely (auto-snapshots current DB first) |
| `npm run typecheck` | TypeScript check, no output |
| `npm run test:e2e` | Playwright end-to-end tests in headless Chrome |
| `npm run test:e2e:headed` | Same, with a visible browser window |
| `npx drizzle-kit studio` | Browse the SQLite schema in a web UI at :4983 |

---

## Under the hood

- **Framework:** Next.js 13 App Router + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite via `better-sqlite3`, stored at `.learnly/learnly.db` (gitignored)
- **Scheduler:** `ts-fsrs` (Free Spaced Repetition Scheduler)
- **Audio:** pre-generated `.m4a` files under `public/audio/` and `.learnly/audio-cache/`
- **Production DB path (unused in demo mode):** Drizzle ORM targeting Supabase/Postgres via `DATABASE_URL`

---

## Launching from Claude Code Preview

If you use Claude Code, three launch configs are wired up in `.claude/launch.json`:

- **Next.js Dev Server** — runs the guarded launcher (`scripts/dev-stable.sh`) with DB snapshot + health-checked auto-restart on port 3000.
- **Drizzle Studio** — opens the DB browser on port 4983.
- **Performance Benchmark** — runs `npm run perf:bench` against `127.0.0.1:3000`.

Pick either from the Preview launcher; no extra setup required.

If the Preview launcher uses the standard dev path and stalls with the same bundler error described above, stop it and run the manual Turbopack fallback from Section 3 in a terminal.

---

## Git Sync Note

The canonical sync workflow is still the one documented in [SYNC.md](./SYNC.md) and implemented by:

```bash
cd /Users/moi/Desktop/business/learnly
./script/sync_macos_v1_to_remote.sh
```

That script syncs the current repo into the remote clone target:

- source: `/Users/moi/Desktop/business/learnly`
- remote clone: `/Users/moi/Desktop/business/learnly-remote`
- target subdir: `learnly macOS v1 (ignore)/learnly copy`
- branch: `sync/macos-v1`
- then fast-forward merges into `main` by default

### Sync failure that happened here on April 18, 2026

The script initially failed before `rsync`/push completed with:

```text
fatal: bad object refs/heads/sync/macos-v1 2
```

Root cause:

- the local remote clone had a stray duplicate ref file:
  `../learnly-remote/.git/refs/heads/sync/macos-v1 2`
- the valid branch ref was still:
  `../learnly-remote/.git/refs/heads/sync/macos-v1`
- removing only the stray duplicate fixed the existing sync workflow

Exact fix:

```bash
rm -f "../learnly-remote/.git/refs/heads/sync/macos-v1 2"
```

Then rerun the same canonical sync command:

```bash
cd /Users/moi/Desktop/business/learnly
./script/sync_macos_v1_to_remote.sh
```

### Performance note

This sync can take a long time because the snapshot is large.

- `rsync` may copy tens of MB and thousands of files
- `git add --all "learnly macOS v1 (ignore)/learnly copy"` can be very slow
- `git commit` can also take a while on the large target tree

Do not assume the process is hung just because output pauses for a few minutes during the git phase.

### What successful completion looked like here

The sync completed with merge to `main`, and both remote refs ended up at the same commit:

```text
2dfc05c291066f652d14b7de4a84b51d06f715ab
```

with commit message:

```text
Sync macOS v1 snapshot (2026-04-18 08:52:18 +0300)
```
