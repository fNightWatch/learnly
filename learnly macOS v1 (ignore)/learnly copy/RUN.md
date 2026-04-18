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

1. The seed script populated `.learnly/learnly.db` (local SQLite file) from the corpus files in `corpus-generation/`.
2. Next.js started a dev server on port **3000**.

Open **[http://localhost:3000](http://localhost:3000)** in your browser. The first page load compiles on demand and can take 5–15 seconds. Every load after that is instant.

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

## 5. Stop the app

Press **Ctrl + C** in the terminal running `npm run dev`.

If you started it in the background and lost the terminal, kill it by port:

```bash
pkill -f "next dev"
pkill -f "next-router-worker"
```

---

## Reset your progress

All study progress is in one file: `.learnly/learnly.db`. To start from scratch:

```bash
rm .learnly/learnly.db
npm run dev
```

The next `npm run dev` re-seeds a clean database automatically.

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

---

## Other useful commands

| Command | Purpose |
|---|---|
| `npm run build` | Production build |
| `npm start` | Run the production build (requires `npm run build` first) |
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

If you use Claude Code, two launch configs are wired up in `.claude/launch.json`:

- **Next.js Dev Server** — stops any running `next dev` workers, re-seeds, and starts on port 3000.
- **Drizzle Studio** — opens the DB browser on port 4983.

Pick either from the Preview launcher; no extra setup required.

If the Preview launcher uses the standard dev path and stalls with the same bundler error described above, stop it and run the manual Turbopack fallback from Section 3 in a terminal.
