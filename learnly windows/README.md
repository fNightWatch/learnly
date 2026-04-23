# Learnly

Learnly is a greenfield prototype for a ranked vocabulary product: one daily FSRS loop, language-aware sessions, and a mobile-first review experience that currently launches with Spanish first.

## What is implemented

- Next.js app scaffold with landing, onboarding, dashboard, and review pages
- Working demo-mode API routes for `session/start`, `reviews`, `progress`, `plan`, settings, and item lookup
- Seeded Spanish launch content plus starter French and German beta decks
- FSRS-backed scheduler wrapper with interval previews and daily-plan forecasting
- Language-aware session modes (`Everyday`, `Review only`, `New only`)
- Drizzle schema for the planned Supabase/Postgres production path
- Ranking helpers for lexical-item and example scoring

## Current build posture

- The app runs in **demo mode** until `DATABASE_URL`, Supabase, and Stripe are wired
- Review sessions use a file-backed prototype store in `.learnly/demo-store.json` so the product loop persists locally
- The scheduler uses the official `ts-fsrs` runtime behind a local wrapper, with Hack Chinese-style product logic layered on top of it
- Landing, dashboard, study, and words all consume the same language-aware study-plan model
- Audio is generated locally per language with cached `say` voices for prototype-quality term and sentence playback

## Suggested local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local`
3. Start the app: `npm run dev`
4. Open `http://localhost:3000`

## Main routes

- `/` landing page with live queue preview and language-aware product story
- `/dashboard` learner metrics, session setup, and queue outlook
- `/study` the language-aware FSRS-backed review flow
- `/words` the studied-word ledger across active languages

## Main API routes

- `POST /api/session/start`
- `GET /api/session/:id/next`
- `POST /api/reviews`
- `GET /api/plan`
- `GET /api/progress`
- `GET/PUT /api/settings`
- `GET /api/item/:id`

## Files worth reading first

- `src/lib/demo/store.ts`
- `src/lib/db/schema.ts`
- `src/lib/content/ranking.ts`
- `src/components/review/review-session.tsx`
- `docs/implementation-notes.md`

## Recommended next implementation moves

1. Replace the file-backed prototype store with Supabase-backed session and progress persistence
2. Move multilingual content out of the demo store and into the Drizzle/Supabase path
3. Add review recovery surfaces like recent mistakes, wrap-up, and answer history
4. Wire Stripe trial and plan state into onboarding and dashboard
