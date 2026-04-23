# Assumed Words

## Product Intent

Assumed words are words the learner says they probably already know.

The full intended product behavior described by the user is:
- A learner can mark vocabulary as assumed-known
- Assumed words should be test-fed gradually, not dumped into the queue all at once
- The daily number of assumed words tested should be configurable
- If the learner proves they know an assumed word, it should jump straight to learned/review state
- If the learner does not know an assumed word, it should become a learning word, but with a slightly higher starting SRS state than a totally brand-new word

## Current Implemented Scope

Current implementation is intentionally limited to settings only.

What is implemented now:
- The learner can choose assumed words by whole curated lists only
- The selection is persisted in learner settings
- The settings API returns the available assumed-word lists and accepts saved selections
- The web settings overlay exposes an `Assumed words` section where those lists can be toggled

What is not implemented yet:
- Per-day assumed-word testing cap
- Queue scheduling for assumed words
- SRS promotion when an assumed word is known
- Slightly-elevated learning start when an assumed word is not known
- Onboarding/login flow for setting assumed words
- Vocabulary test for estimating assumed knowledge

## Current Product Logic

For the current settings-only phase, the logic is:
- Assumed-word selection is stored as a list of curated list IDs
- The learner selects entire lists, not individual words
- Only valid existing curated lists can be saved
- The backend is the source of truth for which assumed-word lists exist

This gives the product a stable settings foundation before queue and SRS behavior are added.

## Technical Design

### Persistence

The learner settings model now includes:
- `assumedWordListIds: string[]`

This is stored in SQLite in:
- `user_settings.assumed_word_list_ids`

Storage details:
- Stored as JSON text
- Default value is `[]`
- Existing databases are migrated with `ALTER TABLE ... ADD COLUMN assumed_word_list_ids TEXT NOT NULL DEFAULT '[]'`

## Backend Wiring

### Types

Added:
- `AssumedWordListOption`
- `LearnerSettings.assumedWordListIds`

Files:
- `/Users/moi/Desktop/business/learnly/src/lib/demo/types.ts`

### List Catalog

The assumed-word picker is backed by curated lists.

Current source:
- `getCuratedLists()`

Added helper:
- `getAvailableAssumedWordLists()`

It returns:
- `id`
- `title`
- `description`
- `itemCount`

Files:
- `/Users/moi/Desktop/business/learnly/src/lib/demo/lists.ts`

### Store

The store now:
- Provides a default empty assumed-list selection
- Normalizes saved list IDs against the current available list catalog
- Reads and writes `assumedWordListIds` with the rest of learner settings
- Preserves the setting through fresh seeds, legacy migration, and updates

Files:
- `/Users/moi/Desktop/business/learnly/src/lib/demo/store.ts`

### Settings API

`/api/settings` now:
- Returns `availableAssumedWordLists`
- Accepts `assumedWordListIds`
- Validates every incoming list ID against the real assumed-list catalog

File:
- `/Users/moi/Desktop/business/learnly/src/app/api/settings/route.ts`

## Frontend Wiring

The web settings overlay now has:
- A new menu row: `Assumed words`
- A dedicated subpage for assumed-word configuration
- Toggle cards for each curated list
- Summary text in the main settings menu showing selected lists and total words

Current UX behavior:
- Selection is optimistic in the UI
- Changes are saved immediately through the existing settings `PUT` flow
- Only whole-list selection is available

File:
- `/Users/moi/Desktop/business/learnly/src/components/settings/settings-overlay.tsx`

## Files Changed For This Feature

- `/Users/moi/Desktop/business/learnly/src/lib/demo/types.ts`
- `/Users/moi/Desktop/business/learnly/src/lib/demo/lists.ts`
- `/Users/moi/Desktop/business/learnly/src/lib/db/sqlite-schema.ts`
- `/Users/moi/Desktop/business/learnly/src/lib/db/local-client.ts`
- `/Users/moi/Desktop/business/learnly/src/lib/demo/store.ts`
- `/Users/moi/Desktop/business/learnly/src/app/api/settings/route.ts`
- `/Users/moi/Desktop/business/learnly/src/components/settings/settings-overlay.tsx`
- `/Users/moi/Desktop/business/learnly/tests/e2e/core-loop-api.spec.ts`

## Verification Notes

Code-level implementation was completed.

Runtime verification was partially blocked by an existing repo startup issue:
- `seed-db.ts` succeeds
- the documented Next.js fallback still did not bind `127.0.0.1:3000` reliably in this session

So:
- the code changes are in place
- browser-level verification was not completed in this session

## Next Implementation Steps

When assumed words are extended beyond settings, continue in this file and add:
- The exact queue-selection algorithm for assumed words
- The per-day assumed-word cap setting and defaults
- The SRS mapping for `known assumed word` and `unknown assumed word`
- Any onboarding flow or level-estimation flow
- Any dashboard or study-surface changes tied to assumed words
