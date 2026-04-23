# Startup Reliability Fix

## Date

- 2026-04-22

## User Goal

- Diagnose why the site does not start reliably.
- Fix the startup path safely.
- Do not touch or risk user data in `.learnly/learnly.db`.

## Safety Constraints

- Never delete, overwrite, move, or recreate `.learnly/learnly.db`.
- Prefer non-mutating verification.
- Treat the app as not running until `/`, `/dashboard`, and `/study` all answer successfully.

## Findings So Far

- The installed `node_modules/next` package had many `dataless` files and specific runtime imports inside Next hung during `require(...)`.
- Replacing only `node_modules/next` with a fresh `next-13.5.6` package repaired those internal hangs without touching user data.
- After that repair, lightweight API routes answered normally, which showed the database and core store calls were not the main startup blocker.
- The remaining issue was route rendering for `/`, `/dashboard`, and `/study`, which still hung even though `/api/health` was healthy.
- A separate real build defect existed in generated corpus files: `data/generated/chinese-hsk2-new-corpus.ts` and `data/generated/chinese-hsk3-new-corpus.ts` imported `DemoLexicalItem` from `../types`, which does not exist from that directory.

## Changes Applied

- Fixed the generated type imports in:
  - `data/generated/chinese-hsk2-new-corpus.ts`
  - `data/generated/chinese-hsk3-new-corpus.ts`
- Added typed runtime contracts in `src/lib/demo/store.ts` so Next type-checking does not lose store return shapes across the CJS boundary.
- Fixed strict TypeScript issues in:
  - `src/app/api/settings/route.ts`
  - `src/components/dashboard/dashboard-shell.tsx`
- Hardened `scripts/dev-stable.sh` so default `npm run dev` now:
  - warms `/`, `/dashboard`, and `/study` automatically
  - re-verifies those core routes after a short delay
  - falls back to `next dev --turbo` on the next restart if plain dev reaches health but core pages still stall
- Updated `RUN.md` to document the new guarded startup behavior.

## Next Checks

- `npm run build` passes fully.
- Default `npm run dev` now starts successfully through `scripts/dev-stable.sh`.
- Verified `GET /`, `GET /dashboard`, and `GET /study` all return `200`.
- Progress counts stayed unchanged before and after recovery verification:
  - `user_item_states = 376`
  - `review_events = 1012`
  - `sessions = 17`
