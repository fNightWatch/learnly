# Implementation Notes

## What this repo is optimizing for

- A founder can run or inspect the product loop immediately
- The architecture stays aligned with the long-term Supabase/Drizzle path
- The first layer of code proves the product shape without waiting on external services

## Intentional shortcuts

- Demo-mode file-backed store instead of database persistence
- Local FSRS wrapper instead of a fully productized multi-user scheduling service
- Hand-authored launch corpora instead of a full ingestion pipeline
- No auth or billing wiring yet, even though the surfaces are planned

## What is already real

- Lexical-item-first schema
- API shapes for starting sessions and posting reviews
- Queue construction rules: due-first, limited new items, and language-aware study modes
- Daily-plan forecasting shared by landing, dashboard, words, and review
- Ranking and example scoring functions
- Mobile-first review UI with keyboard shortcuts, cached per-language audio, and queue configuration

## Chinese sentence preview notes

- Scope is intentionally limited to `zh-hsk1`, `zh-hsk2`, and `zh-hsk3`. The monolithic `zh` corpus and non-Chinese languages stay unchanged.
- Sentence matching uses deterministic greedy longest-match tokenization over the scoped HSK lexicon:
  - `zh-hsk1` matches HSK 1 only
  - `zh-hsk2` matches HSK 1 + HSK 2
  - `zh-hsk3` matches HSK 1 + HSK 2 + HSK 3
- Unmatched characters remain inert plain text so the sentence layout never breaks if a sentence uses a token outside the current scoped lexicon.
- Duplicate surface forms are merged into one preview. Each matching item becomes one sense row, and each row deduplicates repeated gloss text while preserving the primary-gloss-first order.
- `Learn` is additive and idempotent:
  - it creates the normal `createInitialState(...)` learner state if the item is still unseen
  - if a valid active session id is supplied, it injects the learned item at queue index `1` unless that item is already current or already queued
- The preview suppresses the orange CTA as soon as any matched candidate for that surface form already has learner state.

## Rollback steps

- Remove the `ChineseSentencePreview` client component wiring from Study and Word Detail.
- Remove `exampleTokens` / sentence-token payload generation from `src/lib/demo/store.ts`.
- Delete `src/lib/demo/chinese-sentence-preview.ts`.
- Delete `POST /api/item/[id]/learn`.
- Remove the preview-specific API and UI tests.

## Recommended next files to add

- `src/app/api/billing/checkout/route.ts`
- `src/app/(admin)/content/page.tsx`
- `scripts/import-subtitle-frequency.ts`
- `scripts/seed-supabase.ts`
- `src/app/api/review-history/route.ts`
