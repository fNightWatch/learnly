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

## Recommended next files to add

- `src/app/api/billing/checkout/route.ts`
- `src/app/(admin)/content/page.tsx`
- `scripts/import-subtitle-frequency.ts`
- `scripts/seed-supabase.ts`
- `src/app/api/review-history/route.ts`
