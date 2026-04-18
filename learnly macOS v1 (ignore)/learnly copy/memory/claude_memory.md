# LanguageHack (Learnly) - Project Memory

> This file is a living document. Every time you ask me something or make a decision, I update it here. Read this at the start of every session.

---

## 1. Project Overview

**Product Name:** LanguageHack (internal codename: Learnly)
**What it is:** A vocabulary learning app that turns ranked language lists into one daily study system. Users study words with spaced repetition, example sentences, pronunciation audio, and a dashboard showing what's due, what's new, and what's holding.
**Brand direction:** Premium, minimal, warm. Not a demo -- treat it as a real scalable product.
**Tech stack:** Next.js 13.5.6 (App Router), TypeScript, SQLite (better-sqlite3 + Drizzle ORM), Tailwind CSS, ts-fsrs (spaced repetition).

---

## 2. Supported Languages & Corpora

| Code | Name | Words | Source | Notes |
|------|------|-------|--------|-------|
| `es` | Spanish | ~1000 | `spanish-frequency-corpus.ts` (12k lines) | Frequency-ranked core vocabulary |
| `fr` | French | starter | `french-starter-corpus.ts` (212 lines) | Small starter deck |
| `de` | German | starter | `german-starter-corpus.ts` (212 lines) | Small starter deck |
| `zh` | Chinese | ~5500 | `chinese-hsk-corpus.ts` (97k lines) | Full HSK 1-6 |
| `zh-hsk1` | HSK 1 | 500 | `chinese-hsk1-new-corpus.ts` (504 lines) | Separate studyable list, structured like a language. 3 example sentences per word from `corpus-generation/corpus.sqlite` |
| `zh-hsk2` | HSK 2 | 772 | `chinese-hsk2-new-corpus.ts` | Separate studyable list. 3 example sentences per word (2316 total) from `corpus-generation/corpus-hsk-2.sqlite` |

**Type union:** `SupportedLanguageCode = "es" | "fr" | "de" | "zh" | "zh-hsk1" | "zh-hsk2"`

### HSK 1 Specifics
- 500 words generated from `corpus-generation/corpus.sqlite`
- Each item has `languageCode: "zh-hsk1"`, IDs like `new-hsk-1-0001`
- 3 example sentences per word stored in `corpus_item_examples` table
- Sentences cycle on each review (1st view = sentence 1, 2nd = sentence 2, 3rd = sentence 3, then loops)
- Audio pronunciation matches the currently displayed sentence (via `exampleIndex` parameter)
- Language entry: `{ code: "zh-hsk1", name: "HSK 1", nativeName: "HSK 一级", descriptor: "New HSK Level 1 (500 words)", speakerLabel: "Mainland Mandarin", audioVoice: "Tingting" }`

### HSK 2 Specifics
- 772 words generated from `corpus-generation/corpus-hsk-2.sqlite`
- Each item has `languageCode: "zh-hsk2"`, IDs like `new-hsk-2-0001`
- 3 example sentences per word (2316 total) stored in `corpus_item_examples` table
- Same sentence cycling, audio, and Chinese flow behavior as HSK 1
- Language entry: `{ code: "zh-hsk2", name: "HSK 2", nativeName: "HSK 二级", descriptor: "New HSK Level 2 (772 words)", speakerLabel: "Mainland Mandarin", audioVoice: "Tingting" }`

### Corpus Generation
- Located at `corpus-generation/`
- Contains `corpus.sqlite` (HSK 1 data with examples), `corpus-hsk-2.sqlite`
- Python orchestrator with agents for generating corpus data
- Has its own `AGENTS.md` and `ORCHESTRATOR_PROMPT.md`

---

## 3. Architecture

### Directory Structure
```
learnly/
  src/
    app/                    # Next.js App Router pages
      api/                  # API routes
        audio/              # TTS audio generation endpoint
        dashboard/          # Dashboard data
        item/               # Individual item data
        plan/               # Study plan
        progress/           # Progress tracking
        reviews/            # Review submission
        session/            # Session management (start)
        settings/           # User settings
      dashboard/            # Dashboard page
      study/                # Study session page
      words/[id]/           # Word detail page
      v2/                   # V2 design variant (separate)
      library/              # Library page
      lists/                # Lists page
      logo-lab/             # Logo experimentation
      onboarding/           # Onboarding flow
      review/               # Review page
      page.tsx              # Homepage
      layout.tsx            # Root layout
      globals.css           # Global styles
    components/
      dashboard/            # Dashboard components (dashboard-shell.tsx)
      review/               # Review session (review-session.tsx - main study UI)
      site/                 # Site-wide components (header, etc.)
      v2/                   # V2 components
      words/                # Word-related components
      onboarding/           # Onboarding components
    lib/
      content/              # Static content
      db/                   # Database layer
        local-client.ts     # SQLite connection + table creation
        sqlite-schema.ts    # Drizzle schema definitions
      demo/                 # Core business logic (misnamed, treat as real)
        store.ts            # Main data store (sessions, reviews, cards, snapshots)
        types.ts            # All TypeScript types
        content.ts          # Language definitions + corpus aggregation
        audio.ts            # TTS audio generation (ElevenLabs + macOS say fallback)
        audio-source.ts     # Audio URL builder
        lists.ts            # Curated list definitions
        user.ts             # Demo user ID
        generated/          # Generated corpus TypeScript files (110k+ lines total)
      srs/
        scheduler.ts        # FSRS spaced repetition scheduler
  scripts/
    seed-db.ts              # Pre-seed script (runs before dev server)
  corpus-generation/        # Python-based corpus generation pipeline
  .claude/
    launch.json             # Dev server configurations
  .learnly/
    learnly.db              # SQLite database (gitignored)
    audio-cache/            # Generated audio files (gitignored)
```

### Database (SQLite)

**Tables:**
- `corpus_languages` - Language definitions (code, name, native_name, descriptor, speaker_label, audio_voice, beta)
- `corpus_items` - Vocabulary items (id, language_code, type, lemma, display_form, primary_gloss, pos, rank, example, translation, pronunciation, secondary_glosses, notes)
- `corpus_item_examples` - Multiple example sentences per item (id, item_id, sentence, translation, sort_order). Populated for HSK 1 (1500 examples) and HSK 2 (2316 examples)
- `user_settings` - Per-user settings (daily_goal, selected_language_codes, dashboard_language_codes, preferred_study_mode)
- `user_item_states` - SRS state per user+item (status, due_at, stability, difficulty, scheduled_days, learning_steps, lapses, reps, last_rating)
- `sessions` - Study sessions (mode, language_codes, queue, due_count, new_count)
- `review_events` - Review history (item_id, rating, elapsed_ms, mode, state_before, state_after)

**Key indexes:** corpus_items(language_code, rank), corpus_item_examples(item_id, sort_order), user_item_states(user_id, due_at), user_item_states(user_id, status), review_events(user_id, reviewed_at)

### Dev Server Setup

**How to run:**
```bash
npm run dev
# Which runs: tsx scripts/seed-db.ts && next dev
```

**Node version:** `/opt/homebrew/opt/node@22/bin/node` (v22.22.2) -- must be in PATH

**seed-db.ts** runs before the dev server and:
1. Creates all tables if they don't exist
2. Incrementally seeds languages and corpus items from TypeScript files (INSERT OR IGNORE)
3. Seeds `corpus_item_examples` from `corpus-generation/corpus.sqlite` for HSK 1 and from `corpus-generation/corpus-hsk-2.sqlite` for HSK 2
4. Reports what it did or "DB already up to date"

**`.claude/launch.json`** uses `/bin/sh -c` wrapper to run seed then next dev with correct PATH.

**Why seed-db.ts exists:** The old auto-seed in `local-client.ts` used `eval("require")("@/lib/demo/content")` which silently failed because Node can't resolve `@/` path aliases or load `.ts` files. The `try/catch` swallowed the error. `seed-db.ts` runs via `tsx` which handles both.

---

## 4. Study Session Flow

### Binary Rating System
- `BinaryRating = 1 | 3`
- Rating 1 = "No" / "I don't know" (failed)
- Rating 3 = "Yes" / "I know" (success)

### Standard (non-Chinese) Flow
1. Show word/prompt
2. "Do you think you know it?" -> "I don't know" / "I think I know"
3. If "I don't know" -> immediately show StudyRecoveryPanel ("You forgot this word. Take a moment to study it." + "I'm done studying it" button) -> submits rating 1
4. If "I think I know" -> reveal answer -> "Did you know it?" -> "No" shows StudyRecoveryPanel / "Yes" submits rating 3

### New Card Flow
1. "Do you know this word?" -> "Don't know" / "I know"
2. "Don't know" -> StudyRecoveryPanel -> submits rating 1
3. "I know" -> submits rating 3 immediately

### Chinese Flow (zh + all zh-hsk*)
- **Configurable in Settings** via `Chinese review flow`:
  - `4 click` = current Chinese staged flow (pronunciation guess/confirm + definition guess/confirm)
  - `2 click` = same simpler 2-click flow used by non-Chinese cards
- Default is `4 click`
- Applies to `zh` and every `zh-hsk*` list
- Two-stage: pronunciation guess, then definition guess
- Stage 1: "Did you know this pronunciation?" (pinyin hidden initially)
  - "I don't know" -> skip to definition-confirm with pronunciation marked wrong, show StudyRecoveryPanel
  - "I think I know" -> reveal pinyin + audio -> "Did you know the pronunciation?" Yes/No
- Stage 2: "What is the definition of this word?"
  - Same guess/confirm pattern
- Final rating: both pronunciation AND definition must be correct for rating 3
- Any "No" at confirm stage -> StudyRecoveryPanel ("You forgot this word") -> "I'm done studying it" -> submits rating 1

### Session Queue
- `SESSION_FRESH_POOL = 100` -- up to 100 new items per session (not limited by dailyGoal)
- dailyGoal (default 10) is for dashboard display only
- Queue interleaves due items and fresh items (4 due : 1 fresh ratio)

### Sentence Cycling
- `getCycledExample(itemId, reps)` returns sentence at index `reps % exampleCount`
- Only active when `corpus_item_examples` has entries for the item (currently HSK 1 only)
- Falls back to `corpus_items.example` if no examples exist

### Audio System
- **Primary:** ElevenLabs API (when `ELEVENLABS_API_KEY` env var is set)
- **Fallback:** macOS `say` command with `afconvert` to m4a
- **Endpoint:** `GET /api/audio?itemId={id}&mode={term|example}&v={version}&ei={exampleIndex}`
- `mode=term` speaks the word itself (`displayForm`)
- `mode=example` speaks the example sentence
- `ei` parameter (exampleIndex) selects which sentence from `corpus_item_examples` to speak
- Audio is cached per item+mode+exampleIndex in `.learnly/audio-cache/`
- Browser fallback: Web Speech API (`window.speechSynthesis`)
- Cache naming: `{itemId}-{mode}-ei{index}-elevenlabs-{version}.mp3` or `{itemId}-{mode}-ei{index}-{voice}-{version}.m4a`

---

## 5. Key Types

```typescript
type SupportedLanguageCode = "es" | "fr" | "de" | "zh" | "zh-hsk1" | "zh-hsk2";

type SessionCardPayload = {
  itemId: string;
  languageCode: SupportedLanguageCode;
  isNew: boolean;
  displayForm: string;
  lemma: string;
  primaryGloss: string;
  pos: string;
  rank: number;
  example: string;        // Currently displayed sentence (may be cycled)
  translation: string;    // Translation of currently displayed sentence
  pronunciation?: string;
  secondaryGlosses?: string[];
  notes?: string;
  ratingPreviews: RatingPreview[];
  exampleIndex?: number;  // Which sentence from corpus_item_examples
};

type WordDetailSnapshot = {
  item: RankedListEntry;
  lemma: string;
  notes?: string;
  studyReason: string;
  introducedAt: string | null;
  lastReviewedAt: string | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningSteps: number;
  retrievabilityPercent: number | null;
  ratingPreviews: RatingPreview[];
  relatedWords: RankedListEntry[];
  examples: { sentence: string; translation: string }[]; // All sentences for word detail page
};
```

---

## 6. UI/UX Decisions & Preferences

### General
- Premium, minimal, warm aesthetic
- Manrope display font for wordmark
- Warm off-white backgrounds, terracotta/clay/sand/muted sage palette
- No emojis unless explicitly requested
- No "beta" labels
- No "focus word" concept
- Dark mode supported
- Reviews Due uses true linear bar scaling with value labels anchored above each individual bar and the axis label kept in a left gutter so the first-day count never collides with the chart scale

### Study Session
- Binary grading only: Know / Don't know
- **RULE: "No" / "I don't know" ALWAYS goes to StudyRecoveryPanel first** — in ALL flows (standard, Chinese, new card), both button clicks AND keyboard shortcuts. Never call submitReview(1) directly from a "No" action. Always set studyCardStep=1 first.
- Keyboard shortcuts: Up = word audio, Down = sentence audio, Right = reveal/know, Left = don't know, P = pause/resume
- No "If you grade this card..." preview
- No multi-grade controls
- Chinese pinyin hidden during pronunciation guess step
- Session runs until user ends it or cards run out (not limited by dailyGoal)
- Top bar: Timer (left) | Progress bar (#FF991C orange, 6px tall) + "{N} due" label (session-language combined) + Pause (gold) + End (red) (right)
- Pause overlay: light mode = warm frosted backdrop matching theme; dark mode = dark backdrop. Both have pause icon, "Session paused", orange Resume button, P shortcut hint
- Top spacing: `pt-5 sm:pt-8` to match bottom spacing proportions
- Session completion: 6 stat cards -- Time studied, Cards reviewed, Still due, Reviewed today, New words today, Still due by language (with language badges)

### Dashboard
- Mobile: grid-cols-1 stacking (sm:grid-cols-2 on wider)
- Streak dots: solid filled orange for studied days
- No "Live" badge, no queue-mode controls, no "in about X minutes" estimates
- "New words" label instead of "Learned"
- Language chips: flat, no raised selected-tab treatment
- Dashboard colors: gold/clay/violet accents (exception to orange-only site rule)

### Homepage
- One super-bright "Start Study" CTA in top navigation only (no duplicate body CTAs)
- Concrete, commercially legible messaging
- LanguageHack wordmark: one tight word, dedicated display font, not split

### Word Detail Page
- Shows all available example sentences (e.g., "Sentences (3)" with dividers)
- Falls back to single sentence display when no `corpus_item_examples` exist

### Colors
- Main site accent: `#FF991C` orange (outside dashboard)
- Dashboard can use different accent palette
- Filled buttons: white text light mode, dark text dark mode
- **Hard invariant:** any fully filled surface (buttons/cards/pills/badges) must use white text in light theme and black text in dark theme.

---

## 7. Zod Validation

API routes that accept language codes use Zod enums that must include all supported codes:
- `src/app/api/settings/route.ts` -- `z.enum(["es", "fr", "de", "zh", "zh-hsk1", "zh-hsk2"])`, `.max(5)`
- `src/app/api/session/start/route.ts` -- same enum
- `src/app/api/plan/route.ts` -- same enum

When adding a new language, update ALL THREE routes.

---

## 8. Chinese Language Handling

Any code checking for Chinese must use `.startsWith("zh")` instead of `=== "zh"` to cover `zh`, `zh-hsk1`, and `zh-hsk2`:
- `review-session.tsx` -- 3 checks for Chinese flow activation
- `languagePrefixes` and `preferredNames` Record objects include `"zh"`, `"zh-hsk1"`, and `"zh-hsk2"`
- `getSpeechSynthesisLang` has cases for all three
- `ELEVENLABS_LANGUAGE_CODES` maps both `"zh-hsk1"` and `"zh-hsk2"` to `"zh"`
- `FALLBACK_VOICES_BY_LANGUAGE` includes both with same Chinese voices
- `localePrefixes` and `preferredLocalesByLanguage` in `audio.ts` include all three

---

## 9. Known Issues & Gotchas

- **First compilation is slow:** 110k+ lines of corpus TypeScript takes ~23 seconds on first page load in dev mode. This is normal.
- **Port conflicts:** If port 3000 is busy, Next.js auto-selects 3001, 3002, etc.
- **ReadableStream errors in dev:** `ERR_INVALID_STATE: ReadableStream is already closed` is a known Next.js 13 race condition. Harmless, just reload.
- **eval("require") in local-client.ts:** The fallback auto-seed using `eval("require")("@/lib/demo/content")` never works because Node can't handle `@/` aliases or `.ts` files. The `seed-db.ts` pre-seed script is the reliable path.
- **Audio caching:** Audio files cached as immutable. When fixing pronunciation bugs, bust both browser cache and local `audio-cache/` files.
- **Never run `next build` while `next dev` is running** -- corrupts chunk graph.
- **Never run `npm run typecheck` in parallel with `npm run build`** -- `tsconfig.json` includes `.next/types`, causing race conditions.
- **Clear `.next` and `tsconfig.tsbuildinfo` if getting impossible webpack errors** after major refactors.

---

## 10. Process & Working Rules

- Never delete the database or anything affecting app functionality
- Use INSERT OR IGNORE for all seeding -- never delete existing data
- Always verify changes in the browser preview
- No JSON seed files -- use TypeScript imports via tsx
- The `/v2` design variant is fully separate from main product
- `AGENTS.md` contains 106+ learned rules from past sessions (style, UX, arch, process)
- User prefers terse responses with no trailing summaries
- User wants literal, exact changes -- avoid adjacent reinterpretation
- **"sc" = screenshot** -- when user says "sc1", "sc2" etc., they mean the screenshot(s) they attached
- **Always update this memory file** with every request, every rule, and every change made
- Memory should be a living document -- update it at the end of every task

---

## 11. Recent Changes (April 2026)

### Session: April 3, 2026
1. **HSK 1 as studyable list** -- Added `zh-hsk1` language code, 500 words from corpus.sqlite, structured like existing languages. Updated all Zod validators, Chinese flow checks, audio mappings.
2. **Session queue limit removed** -- `SESSION_FRESH_POOL = 100` replaces `dailyGoal` cap in session queue building.
3. **Example sentence cycling** -- Created `corpus_item_examples` table, `getCycledExample()` uses `reps % count` to cycle through 3 sentences per HSK 1 word.
4. **Audio pronunciation fix** -- Added `exampleIndex` parameter through entire audio pipeline (buildAudioUrl -> API route -> getAudioText -> TTS) so audio always matches the displayed cycled sentence.
5. **Dashboard mobile layout** -- Fixed grid collapse on mobile (grid-cols-1 sm:grid-cols-2). Streak dots changed to solid filled orange.
6. **Auto-seed reliability** -- Created `scripts/seed-db.ts` that runs via tsx before dev server. Updated package.json and launch.json.
7. **"No" button -> StudyRecoveryPanel** -- In both standard and Chinese flows, pressing "No"/"I don't know" immediately shows "You forgot this word" panel with "I'm done studying it" button.
8. **Word detail page shows all sentences** -- HSK 1 words display all 3 example sentences with dividers.
9. **Study card layout fixes** -- Bottom buttons pin properly on short viewports, sentence text larger (text-2xl sm:text-3xl), content scrolls on mobile, more top spacing on desktop, reduced bottom padding.

### Session: April 4, 2026
1. **Chinese flow heading suppression** -- When `studyCardStep === 1`, suppress the heading text ("Did you know the definition?") above StudyRecoveryPanel. Wrapped in `{studyCardStep !== 1 && (...)}` guard.
2. **Pause button + progress bar** -- Added gold Pause button and progress bar to study session top bar. Pause overlay with dark blur backdrop, pause icon, orange Resume button, keyboard hint. Timer stops when paused. P key toggles pause.
3. **Progress bar styling** -- Orange accent (#FF991C), taller (6px), wider (w-24/sm:w-36), orange-tinted track, bolder count text.
4. **Top spacing fix** -- Content area padding increased from `pt-2 sm:pt-4` to `pt-4 sm:pt-6`.
5. **Dashboard data accuracy** -- (a) Vocab growth chart uses time-based heuristic for solid classification (estimates review entry date from `lastReviewedAt - scheduledDays`). (b) Retention score excludes words with 0 reps. (c) Streak counts from yesterday if not studied today yet.
6. **Per-language due counts** -- Added `dueByLanguage: Record<string, number>` to `SessionInsights`. Session completion shows 6th stat card with language badges and individual due counts.
7. **Pause overlay redesign** -- Light mode: warm frosted backdrop matching app theme (`color-mix` with `--page-top`). Dark mode: dark backdrop (`bg-night/80`). Both: pause icon, "Session paused" text, orange Resume button, P shortcut hint.
8. **Progress bar shows session-language due count** -- Replaced `reviewed/total` with `{N} due` label showing combined still-due count from `insights.dueByLanguage` for session languages only (not all languages).
9. **Top spacing increased** -- Content area padding `pt-5 sm:pt-8` to better match bottom spacing.
10. **HSK 2 added as studyable language** -- 772 words from `corpus-hsk-2.sqlite`, 2316 example sentences (3 per word). Same structure as HSK 1: `zh-hsk2` language code, IDs like `new-hsk-2-0001`, sentence cycling, Chinese flow. Updated: types, content, Zod validators (3 routes), audio mappings (ELEVENLABS, FALLBACK_VOICES, localePrefixes, preferredLocalesByLanguage), voice mappings (languagePrefixes, preferredNames, getSpeechSynthesisLang), seed-db.ts.
11. **Mobile top bar fix** -- Progress bar track hidden on mobile (`hidden sm:block`), button padding reduced (`px-3 py-1.5`), tighter gaps (`gap-1.5 sm:gap-2.5`). End button no longer pushed off-screen.
12. **"No" → StudyRecoveryPanel fix** -- Fixed all keyboard handlers (ArrowLeft at confirm stages) and Chinese flow confirm handlers to set `studyCardStep=1` instead of calling `submitReview(1)` directly. Affects: standard confirm, Chinese pronunciation-confirm, Chinese definition-confirm. Space/Enter at studyCardStep=1 now submits rating 1 in all flows (not just new cards).
13. **Mobile card layout centering** -- Changed `sm:justify-center` to `justify-center` on card content area so mobile matches desktop layout when answer is showing.
14. **Top spacing increased** -- Top bar padding `py-3.5 sm:py-4`, second row gap `mt-3`, content area `pt-6 sm:pt-10`.

### Session: April 13, 2026
1. **Theme moon icon cleanup** -- Replaced decorative moon icon variant with a clean crescent and removed the extra top dot/star detail in the header theme toggle.
2. **Adaptive low-height recovery layout** -- In study mode, when viewport height is low **and** content overflows, `StudyRecoveryPanel` now switches to compact mode: helper text is one line, `I'm done studying it` button is smaller/narrower, and audio controls move to the right as stacked buttons (`↑ Word` above `↓ Sentence`). The old bottom audio row is hidden only in this compact recovery state.
3. **Adaptive trigger refined to real fit checks** -- Compact recovery layout now triggers using sentence-card fit logic (scroll-content overflow and sentence/example panel clipping or overlap with the action dock), not a simple viewport-height gate. This targets the exact case where sentence content is not fully visible or its outline gets crowded.
4. **Study top-row controls aligned right** -- Direction (`Auto` / language direction) and speed controls (`0.5×`…`2×`) in the study top bar are now right-aligned, matching user request.
5. **Resize lag fix for adaptive recovery mode** -- Reworked compact-layout switching to use `requestAnimationFrame` scheduling plus hysteresis thresholds (`enter` vs `leave`) and state-change-only updates. Removed high-frequency scroll-driven layout checks to stop oscillation and jank while dragging window height.
6. **Single-breakpoint latch behavior for compact recovery** -- Further stabilized resize logic so compact mode latches when sentence/example overlap is first detected, then exits only after clear recovery (`+72px` viewport gain and safe panel gap). This prevents repeated flip-flopping around the threshold during live window-height drag.
7. **Dashboard Today card visual refresh** -- Redesigned the top summary block and mini-stat cards to look more modern/professional: cleaner hierarchy, tighter typography rhythm, refined borders/surfaces, and less clunky block styling while preserving existing metrics and layout structure.
8. **Filled-surface text mode behavior fix** -- Updated the redesigned dashboard Today filled block so text behavior is explicit: white in light mode, black in dark mode (including label + metric + badge text) per user request.
9. **Tailwind opacity token correction** -- Fixed invalid classes (`text-white/62`, `text-white/86`, `text-white/92`) that were ignored and caused dark fallback text in light mode. Replaced with valid tokens (`text-white/70`, `text-white`, `text-white/95`) and matching dark-mode black text tokens.
10. **Dashboard style-system expansion** -- Applied the same premium card language used in `Reviewed/New words` across the remaining dashboard modules: `Languages`, `Reviews Due`, `Vocabulary Growth`, `Streak`, and `Corpus`. Added consistent refined surfaces (rounded border, soft gradient fill, inset highlight, subtle internal metric cards) for a unified modern look.
11. **Dashboard language-toggle runtime fix + All button** -- Fixed `ReferenceError: setSaveError is not defined` in `dashboard-shell.tsx` by restoring `[saveError, setSaveError]` state wiring after filter refactors. Added `All` button in Languages card to activate every available language in one click.
12. **Dashboard extra grid-line cleanup** -- Removed duplicate baseline grid rendering in both `ReviewsDueChart` and `VocabularyGrowthChart` by skipping the lowest overlay grid line where the explicit chart baseline already exists.
13. **Study completion stats modernization + streak** -- Refreshed the Phase 3 completion screen in `review-session.tsx` to match dashboard `Today` card language: stronger blue session summary hero, refined mini stat cards, explicit `Current streak` card, and a cleaner `Still due by language` section with retention badge and per-language pills.
14. **Study completion blue/compact refinement** -- Kept completion stats fully blue as requested, removed the helper sentence under `Still due by language` (`What remains after this session.`), and compressed the top `cards reviewed this session` block to use less vertical space while preserving the modern dashboard-like styling.
15. **Study completion layout cleanup (single-slot + no completed pill)** -- Reworked the completion stats grid so `Cards reviewed this session` is a normal single-slot card (not a full-width hero), removed the `Completed` status pill entirely, and kept all filled blue cards following the white-in-light / black-in-dark text contrast rule.
16. **Contrast rule reinforced as non-negotiable** -- Re-affirmed and documented that all fully filled UI elements must keep white text in light mode and black text in dark mode to prevent repeated regressions.
17. **Completion stats contrast hard-fix** -- Replaced tinted text-opacity classes on filled blue completion cards/pills with explicit `text-white dark:text-black` so labels and metrics no longer fall back to dark text in light mode.
18. **Completion contrast fallback class added** -- Added `.complete-filled` in `globals.css` with `!important` theme-aware text enforcement (white in light, black in dark) and applied it to completion blue cards/pills in `review-session.tsx` to eliminate repeated contrast regressions from class conflicts.
19. **Completion outlines theme fix (browser-verified)** -- Updated filled completion language chips to flip border/background tint by theme (`border-white/45` in light, `dark:border-black/45` in dark; corresponding fill tints), then validated via Playwright screenshots in both light and dark completion screens.
20. **Vocabulary Growth extra-line cleanup (browser-verified)** -- Removed stacked baseline artifacts in `VocabularyGrowthChart` by dropping the bottom chart baseline border and reducing overlay horizontal guides to two lines, eliminating the extra two divider lines around the x-axis labels.
21. **Vocabulary Growth separator cleanup pass 2 (browser-verified)** -- Removed the remaining near-label guide line and removed the `border-t` divider above `Active words / Coverage / Lifetime reviews`, so the x-axis labels no longer sit between two extra separators.
22. **Vocabulary Growth divider restoration correction** -- Restored the normal chart divider structure after over-removal (guide lines + chart baseline + pre-stats divider) because user clarified only one out-of-place line should be removed, not all dividers.
23. **Vocabulary Growth ordinal-line removal** -- Applied exact user instruction to remove `1st from bottom` and `3rd from bottom` separators: removed the pre-stats divider (`border-t`) and removed the lowest in-chart guide line while preserving the remaining divider structure.
24. **Study completion stats visual polish (no behavior changes)** -- Refined only presentation on the completion screen (`review-session.tsx`): improved heading hierarchy, tighter premium spacing, stronger metric sizing rhythm, cleaner blue card gradients/shadows, and more polished chip/button proportions while preserving all existing stats, data, and actions unchanged.
25. **Completion flow persistence + CTA cleanup + dark-outline fix** -- Completion state is now persisted in session storage and restored on refresh (`learnly-last-complete-session`), cleared when starting a new session (`?new` or `New session` action). Removed `Back to dashboard` from completion and switched to a single full-width `New session` CTA in the primary spot. Updated completion card/chip border styling to avoid bright white outlines in dark theme while keeping the blue visual system.
26. **Low-height compact recovery fit tuning** -- In study mode compact recovery state, content now shifts upward when overflow/clip is detected: reduced content paddings, removed vertical centering (`my-auto`) in compact mode, tightened translation/example spacing, and reduced action-dock top padding so sentence + translation fit better on short viewports. Also increased compact `I'm done studying it` text size and matched right-side `Word/Sentence` button heights to the left CTA block.
27. **Completion subtitle removed** -- Removed `Your session stats at a glance.` from the completion screen so only the main `Great focus session!` heading remains, per latest user direction.
28. **Completion top-CTA + heading removal + centering rebalance** -- Moved `New session` to the top of completion stats card and removed the `Great focus session!` heading. For study compact recovery mode, reintroduced centered composition with `min-h-full my-auto` and a controlled upward offset, plus tightened top paddings so the main content (word/translation/example) stays centered and fits better across short heights. Increased compact `I'm done studying it` label size further for readability.
29. **Study bottom-action invariant restored** -- After follow-up correction, reverted layout logic so study action controls stay pinned at the bottom in all states. Kept content-centering work in the content area only (no button relocation), matching user requirement.
30. **Header-level completion CTA + prompt centering correction** -- Completion `New session` action was moved out of the stats card and into the shared study page header CTA position (same slot used by `Start Study` on other pages), driven by `?complete=1` URL state. Also moved stage question prompts from the bottom action dock into the content area so the learning content forms one centered composition while keeping all answer/audio buttons pinned to the bottom.
31. **Prompt position corrected to bottom action zone** -- Reverted prompt-text placement so stage questions (for example `Do you think you know it?`) render immediately above the bottom rating buttons, not in the centered content block. This removes the large dead gap while preserving centered word/content presentation.
32. **True prompt-stage content centering fix** -- Added explicit `justify-center` behavior for prompt-stage content (`!showingAnswer && !showingRecoveryPanel`) in the main study content container so the word block vertically centers in available height instead of staying high in the viewport.
33. **Hover-reveal controls in study top bar** -- Updated study direction (`Auto`) and speed (`x`) controls to expand on hover and collapse on mouse leave, while preserving click-to-toggle fallback behavior for non-hover/touch usage.
34. **Answer-state centering fix** -- Expanded normal-mode vertical centering to all non-compact study states (prompt + answer), so word/sentence content stays centered instead of pinning high when recovery UI is present below. Compact overflow mode remains the only state using lifted/fit behavior.
35. **Recovery-gap alignment fix** -- Adjusted study content alignment so non-compact recovery states no longer vertically center above a large dead zone: prompt states stay centered, while answer/recovery states now anchor near the bottom action dock. Also added `min-h-0` to the scroll container to keep flex sizing stable.
36. **Dark-mode completion blue + chip readability update** -- Set completion dark-mode blue surfaces to explicit `rgb(81,169,236)` (stat cards, `Still due by language` block, and `I'm done studying it` CTA). Lightened dark-theme `Still due by language` chip and count-pill backgrounds/borders so black text remains clearly readable.
37. **CJK top-clipping fix in study prompt** -- Increased the main prompt/character line box (`leading-[1.12]`) and added slight top padding (`pt-1`) in `review-session.tsx` so Chinese characters do not get cut at the top on short-height viewports.
38. **Recovery centering correction** -- Reverted non-compact recovery alignment from dock-anchored (`justify-end`) back to true centered content (`justify-center`) because the dock-anchored variant produced a top-heavy layout with large empty space above the content block.
39. **Pause overlay CTA contrast fix** -- Updated the filled `Resume` button in the pause overlay to follow the strict contrast rule: `text-white dark:text-black`.
40. **Settings overlay `Done` CTA contrast fix** -- Updated the filled orange `Done` button in `settings-overlay.tsx` to follow strict filled-surface contrast: `text-white dark:text-black`.
41. **Dashboard outer-shell simplification** -- Removed the redundant outer `section.card` wrappers from all main dashboard modules (`Today`, `Languages`, `Reviews Due`, `Vocabulary Growth`, `Streak`, `Corpus`) so each module renders as a single panel without square-in-square framing.
42. **Translation hint copy update** -- Updated the sentence-translation reveal hint from `tap to reveal` to `tap or press shift` in study mode so the Shift shortcut is clearly communicated.
43. **Dark-mode Today mini-card readability boost** -- Lightened the dark-mode `Reviewed` and `New words` mini cards in `TodayCard` (brighter blue-tinted fill/border/highlight) and increased label/value text contrast for improved readability.
44. **Dark-mode completion contrast and glow cleanup** -- Reduced blue neon bleed on completion stats by replacing bright glow shadows with subtle dark-depth shadows and stronger, cleaner blue panel contrast. Also increased `Still due by language` chip/readout contrast (lighter chip fills + clearer borders/count pills).
45. **Light-mode Today-card shadow cleanup** -- Removed the light-theme drop shadow from the dashboard `Today` card and kept only a subtle dark-mode shadow so the blue card sits cleanly on the page without leftover beige/blue bleed.
46. **Home orb accent-color alignment** -- Updated the homepage decorative spheres from yellow-gold to the product’s orange accent family (`#FF991C` centered) so the hero background matches the main CTA and overall brand system more closely.
47. **Settings theme palettes (5 variants) + root palette persistence** -- Added a user-selectable palette system with five presets in Settings (`classic`, `brume-menthe`, `mint-sea`, `lime-forest`, `violet-lime`), each represented by four semantic slots (`accent`, `blue`, `darker blue`, `coral`). Root layout boot script now restores `data-palette` from `localStorage` (`languagehack-palette`) on first paint, alongside light/dark theme. Global CSS now maps semantic colors through palette variables (`--palette-*` -> `--color-*`) and dashboard theme tokens were switched to consume these palette variables so palette changes apply consistently across dashboard surfaces.
48. **Hardcoded accent cleanup for palette compatibility** -- Replaced remaining fixed-orange CTA styling in Settings and study pause overlay with semantic accent-variable styling (`rgb(var(--color-accent))`) so all major filled actions follow selected palettes. Updated accent hover/shadow behavior in global button classes to use theme variables instead of fixed orange values.
49. **Blue tokenization for theme-aware study/session/dashboard surfaces** -- Replaced remaining hardcoded study blues (`rgb(81,169,236)` and fixed blue gradients/hexes) in `review-session.tsx` with semantic palette tokens (`--color-gold`, `--color-pine`) across active-session controls, recovery actions, and completion statistics cards/chips. Updated dashboard `Today` hero + mini stat cards in `dashboard-shell.tsx` to variable-driven blue gradients/borders, so changing theme palette now updates blue and dark-blue surfaces consistently.
50. **Removed unwanted glossy blue-card effect + contrast-first token mapping** -- Replaced the diagonal/glossy gradient treatment in study completion stats and `Still due by language` with flatter palette-token fills. Updated dashboard `Today` hero and mini cards to flat/clean palette-token fills (no sheen effect) and tuned borders/chip surfaces for readable contrast while keeping user-provided palette colors unchanged.

### Session: April 14, 2026
1. **HSK 3 parallel generator-09 batch completed** -- Generated ranks 846-909 into [generator-09.jsonl](/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-3/parallel/generated/generator-09.jsonl), validated successfully against `corpus-hsk-3.sqlite`, and wrote the companion summary at [generator-09.txt](/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-3/parallel/summaries/generator-09.txt).
2. **Malformed HSK 3 suffix seed rows normalized** -- Corrected `source_translation_seeds` rank 869 to plain `员` / `yuán` and rank 885 to plain `者` / `zhě` in `corpus-hsk-3.sqlite` so suffix-focused rows can pass target-form matching and HSK 1-3 lexicon validation.
3. **generator-09 blocker repairs** -- Rewrote `影视` with more idiomatic sentence contexts, replaced explanation-style `员` / `者` examples with natural compound-word usage, repaired the awkward third `早已` example, and replaced the weak third `争取` example before revalidating the batch.
4. **generator-09 English/gloss polish pass** -- Repaired remaining awkward learner-facing English in rows `营养`, `由`, `有的是`, and `整体`, including more natural active phrasing and replacing `overall whole` with `whole; overall`.
5. **HSK 3 holes batch completed** -- Generated the final 31 missing HSK 3 rows into [generator-holes-31.jsonl](/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-3/parallel/generated/generator-holes-31.jsonl), validated successfully against `corpus-hsk-3.sqlite`, and wrote the companion summary at [generator-holes-31.txt](/Users/moi/Desktop/business/learnly/corpus-generation/runs/new-hsk-3/parallel/summaries/generator-holes-31.txt).
51. **Classic-theme visual baseline restored** -- User flagged that Classic was unintentionally restyled. Reverted blue surfaces in study completion + dashboard `Today` cards away from stylized darkening effects and back to a cleaner, established classic look while retaining palette-token wiring so non-classic themes still switch correctly.
52. **Classic blue values + stable blue-surface classes restored** -- Reset Classic palette blue slots to the established pair (`--palette-blue: 54 103 146`, `--palette-blue-dark: 81 169 236`) and added dedicated classes (`dashboard-today-hero`, `dashboard-today-mini`, `complete-blue-metric`, `complete-blue-block`) so dashboard/study-stat blue surfaces render consistently in Classic while still following palette changes in other themes.
53. **Non-classic palette contrast remapping (light + dark)** -- Added per-palette token remaps for the four new themes (`brume-menthe`, `mint-sea`, `lime-forest`, `violet-lime`) so filled UI surfaces keep readable contrast with the enforced text rule (white text in light mode, black text in dark mode). Added matching overrides inside `.dashboard-theme` scope so dashboard cards/statistics follow the same contrast-safe mapping.
54. **Reviews Due uncapped + adaptive y-layout fix** -- Updated dashboard data generation to stop using the `REVIEW_SOFT_CAP` for Reviews Due (today now counts all truly due items via full state scan). In `ReviewsDueChart`, added dynamic axis rounding (`axisMax`), responsive bar scaling against that axis, and a fixed top scale-label lane so high values no longer overlap surrounding dashboard text.
55. **Chinese 2-click / 4-click setting added (incl. HSK)** -- Added persisted `chineseReviewFlow` in `user_settings` (`four-click` default), wired through `/api/settings`, surfaced in `SettingsOverlay` as `2 click` vs `4 click`, and connected study gating in `review-session.tsx` so Chinese staged flow runs only when this setting is `four-click`; `two-click` reuses the standard non-Chinese flow for `zh` and all `zh-hsk*` cards.
56. **Screenshot bundle curated down to 10 key images + written UI inventory** -- Reduced the original 466-image audit dump in `design/screenshots-2026-04-14T08-17-07-329Z` to 10 representative screenshots in the root folder and replaced the rest with a detailed summary covering the removed dashboard, study, words, theme-toggle, settings, mobile, and dark-mode states.
57. **Theme-mixing fix: removed per-palette ad-hoc remaps** -- Removed non-classic palette overrides that were rewriting semantic slots (`--color-*`) with custom extra tones in both global and `.dashboard-theme` scopes. Themes now resolve from their own 4-color palette slots directly, so switching palettes no longer feels like cross-theme color mixing.
58. **Theme-mixing correction + study control unification** -- User flagged visible palette mixing in study state. Restored contrast-safe per-palette token remaps and unified study decision/speed controls to the same semantic blue slot (`--color-gold`) so the active study UI no longer mixes two competing accent hues within a single prompt state.
59. **Positive study actions restored to orange lane** -- Reverted study decision semantics so `I think I know`, `I know`, and `Yes` buttons use `bg-clay` (orange/accent lane) while `I don't know`/`No` remain blue (`--color-gold`), matching the original UX color meaning. Verified with fresh screenshot at `artifacts/theme-audit/classic-study-orange-verify.png`.
60. **Palette purity restored (no custom remaps)** -- Removed all non-classic per-palette semantic remaps in `globals.css` (both root and `.dashboard-theme`) so themes now use only their original user-provided palette values without introducing custom replacement tones that caused perceived palette mixing.
61. **Chinese-flow helper line removed from Settings** -- Deleted the text `Applies to Chinese and all HSK lists.` from `settings-overlay.tsx` per user request to keep the settings panel cleaner.
62. **Settings IA moved to subpages + dashboard-language ownership moved to Dashboard** -- Reworked `settings-overlay.tsx` from one long panel into a menu + dedicated subpages (`Theme`, `Daily new words`, `Study languages`, `Preferred study mode`, `Chinese review flow`). Removed Dashboard Languages from Settings UI entirely. In `dashboard-shell.tsx`, language chip toggles now persist directly via `PUT /api/settings { dashboardLanguageCodes }`, so dashboard selection memory lives where users make that choice. Expanded `dashboardLanguageCodes` validation in `api/settings` to allow all currently supported languages (`max(7)`).
63. **New session completion bug fixed** -- `ReviewSession` now remounts when the `new` query param is present by keying it from study-page search params (`complete/new` signature). This guarantees clicking `New session` from completion (`/study?new`) starts a fresh setup lifecycle instead of sticking on completion state.
64. **End/timer warning color updated to user-provided coral** -- In `review-session.tsx`, changed the active-session `End` button fill to `#F56762` and changed the `< 1 minute` timer warning text color to `#F56762` so both critical states share the exact user-requested warning hue.
65. **Auto refresh-direction stitch fix (Chinese/HSK + Auto mode)** -- Hardened study-session refresh persistence in `review-session.tsx` so reloading keeps the exact current card orientation. Added persisted fields `currentDirection` and `currentCardItemId` to active-session storage, introduced a resume-only direction override ref, preserved that override during resume boot reset, and synced active-session storage on card/direction changes. This prevents the same card from flipping prompt direction (for example Chinese prompt switching to English) after refresh.
66. **Reviews Due value-label position restored** -- In `dashboard-shell.tsx` (`ReviewsDueChart`), moved daily values back above each individual bar/indicator using per-bar absolute anchors. Removed the fixed top-row value lane so numbers no longer sit across the chart header and instead track the bars as intended.
67. **Dashboard Today mini cards set to white in light mode** -- Updated `.dashboard-today-mini` in `globals.css` to use an opaque paper background instead of translucent white, removing the light-blue tint from `Reviewed` / `New words` so they match the other light dashboard sections.
68. **Dashboard Today mini cards aligned to Languages surface style** -- Updated `.dashboard-today-mini` in `globals.css` to use the same border/gradient/inset treatment as the `Languages` panel family (including dark-mode counterpart), so `Reviewed` and `New words` now look coherent with the `Languages` section.
69. **Dashboard Today hero blue parity in light mode** -- Updated `.dashboard-today-hero` in `globals.css` to use `rgb(var(--color-gold))` in light mode (same bright blue family used in dark mode) so the `Today` card keeps the exact blue tone the user approved.
70. **Streak card finish pass (dark-mode polish)** -- Refined `StreakCard` + `ConsistencyGrid` in `dashboard-shell.tsx` to look complete: added a proper inner panel for the dot matrix, improved active/inactive dot contrast in dark mode, added subtle spacing rhythm + helper caption (`Last 4 weeks`), and tightened hierarchy while preserving streak functionality. Verified with `npm run typecheck` (passes).
71. **Vocabulary utility stats compacted** -- Reduced vertical footprint of the `Active words / Learning rate / Lifetime reviews` row in `dashboard-shell.tsx`: tighter card padding, smaller label/unit typography, condensed value rhythm, and earlier 3-column breakpoint (`min-[520px]`) so these secondary metrics stop consuming excessive space.
72. **Languages-card duplicate sublabel removed** -- Removed `Study languages` from the dashboard `Languages` card in `dashboard-shell.tsx` and kept the `All` control right-aligned, so the module no longer repeats itself (`Languages` + `Choose what to show today` is sufficient).
73. **Dashboard `All` chip now deselects on second press** -- Implemented true toggle behavior for the `All` language chip in `dashboard-shell.tsx`: when all languages are selected, pressing `All` now clears the dashboard language selection (`[]`), and pressing again reselects all. Updated persistence pipeline to support empty dashboard selections by allowing empty arrays in `/api/settings` schema and store normalization (`normalizeLanguageCodes(..., { allowEmpty: true })`) plus dashboard snapshot building. Added empty-state copy fallback for Reviews Due subtitle (`no active languages selected`).

### Session: April 15, 2026
1. **Progress restore + empty language guard** -- Restored missing Chinese/HSK progress into the live DB from `/Users/moi/Desktop/business/learnly copy/.learnly/learnly.db` using insert-only merge semantics after backing up the live DB to `.learnly/backups/20260415-090253-before-progress-restore/learnly.db`. Live progress now includes 265 item states: Spanish 112, Chinese 12, HSK 1 98, HSK 2 41, HSK 3 2. Also added an empty-array guard in `getCorpusItemsByLanguages` so clearing all dashboard languages returns no items instead of crashing Drizzle `inArray`.
2. **Reviews Due duplicate scale label removed** -- Removed the standalone left-side axis max number from `ReviewsDueChart` so Today's count appears only above the Today bar while gridlines, bar heights, and per-bar labels remain unchanged.
3. **Progress protection guardrails added** -- Added DB-level progress protection in `src/lib/db/progress-protection.ts`: automatic protected SQLite snapshots under `.learnly/progress-backups`, a manifest under `.learnly/progress-protection/manifest.json`, triggers that block deleting `user_item_states`/`review_events` or mutating immutable review history, settings-update backups, and review-submit count-regression checks. Current protected baseline is 265 item states, 399 review events, and 72 sessions for `demo-user`.
4. **Study completion runtime crash fixed (`dueChipClass`)** -- Fixed `ReferenceError: dueChipClass is not defined` in `src/components/review/review-session.tsx` by restoring local completion-screen helper constants (`dueChipClass`, `dueCountBadgeClass`) to match existing `.complete-due-*` styles in `globals.css`. Verified with `npm run typecheck` (passes).
5. **Completion “Still due by language” visual refinement** -- Redesigned the language separation section in study completion to look cleaner and more premium: moved from free-wrapping pills to an even responsive tile grid (`grid cols`) with consistent tile sizing, balanced spacing, and refined chip surface/border treatment. Kept all behavior/data unchanged and verified with `npm run typecheck`.
6. **Chinese 2-click first-decision audio parity fixed** -- In `review-session.tsx`, introduced a shared helper (`shouldPlayWordOnFirstDecision`) and applied it across click + keyboard paths so Chinese `2-click` mode in `Target→English` now auto-plays term pronunciation on first decision press, matching behavior that already worked in `English→Target`.
7. **Dark-mode language-chip polish in completion** -- Adjusted `.complete-due-chip` and `.complete-due-count` dark-mode styling in `globals.css` to reduce the frosty, over-bright look (softer white alpha, calmer badge fill, subtler inset highlight) while preserving readability and existing behavior.
8. **Top-bar shell visual parity with dashboard mini cards** -- Unified the main header shell surfaces (`.floating-nav` and `.study-header-shell`) to match the same panel treatment used by the liked `Reviewed/New words` mini cards: same border strength, same light/dark background blend, same subtle inset highlight, and no extra backdrop blur layer in `site-header.tsx`.
9. **Homepage forced-dark lock** -- Locked `/` to dark mode only by forcing `data-theme="dark"` during first paint in `layout.tsx` when `pathname === "/"`, and removed the homepage theme-toggle control in `home-glass-landing.tsx`. Also added mount-time dark enforcement + cleanup in the landing client component so the home surface remains dark-only while other routes can still use normal theme behavior.
10. **Homepage orb layering + fullscreen density update** -- Updated `home-glass-landing.tsx` so all spheres render in a single background-only layer (`z-0`) behind the glass card (`z-10`) with no foreground overlap. Expanded the orb layout to a denser edge-distributed 12-sphere field for better fullscreen coverage while keeping the central glass area clear.
11. **Vocabulary utility stats compressed without data loss** -- In `dashboard-shell.tsx`, reduced the `Active words / Learning rate / Lifetime reviews` block from tall stacked cards to a compact single horizontal strip (`flex` row with compact cards and horizontal overflow fallback). All three metrics and units are preserved; only layout density changed.
12. **Completion count-pill refinement (no dark heavy ovals)** -- Softened `Still due by language` number pills in `globals.css` (`.complete-due-count`) by replacing the dark/heavy oval treatment with lighter glass-like fills and subtler borders in both light and dark themes, keeping the same structure/data while making the chips look less cheap.
13. **Streak module visual emphasis upgrade** -- Redesigned the dashboard `Streak` block in `dashboard-shell.tsx` to be much more prominent: larger hero metric card with flame accent, bigger streak number, explicit `day(s) streak` wording, weekday header row, larger consistency dots, and active-day check marks. Kept all streak/consistency data logic unchanged (visual-only polish inspired by provided reference).
14. **Today card emphasis update (`DUE` removed + bigger primary number)** -- Updated `TodayCard` in `dashboard-shell.tsx` to remove the redundant `DUE` badge and increase the due-count typography to a much larger hero scale (`text-[54px]`, `sm:text-[66px]`) so the key metric is immediately dominant.
15. **Homepage mobile-orb density reduction** -- Split homepage orb rendering in `home-glass-landing.tsx` into separate `mobileOrbs` and `desktopOrbs`. Mobile now uses a smaller 6-orb set with reduced sizes/clutter, while desktop keeps the richer fullscreen field.
16. **Homepage center-orb balance pass (without re-adding clutter)** -- Rebalanced orb coordinates/opacities so common orientations keep a subtle center-area presence (especially top-center and bottom-center) while staying behind the glass card and preserving reduced mobile density.
17. **Dark-mode completion due-chip polish (premium cleanup)** -- Refined only dark-mode styling for `Still due by language` in `globals.css`: flatter chip and count-pill surfaces, softer border contrast, reduced plastic/gloss effect, and gentler block shading for a cleaner premium look while keeping the liked light-mode appearance intact.
18. **Dashboard top-row compaction (Today + stacked minis + Languages)** -- Reorganized the dashboard top section in `dashboard-shell.tsx` to reduce wasted space: `Today` hero now stands alone, `Reviewed` and `New words` were moved into a stacked `TodayMiniStack` column, and `Languages` was tightened with smaller paddings/spacing and inline `All` control. Desktop now uses a compact 3-column row; smaller breakpoints keep clean wrapping without losing functionality.
19. **Reviews Due axis switched to numeric day labels with sparse cadence** -- Updated `ReviewsDueChart` in `dashboard-shell.tsx` to replace weekday labels (`Today/Sa/Tu...`) with numeric day offsets (`1d...30d`) and show labels every 3rd day plus first/last tick for cleaner readability.
20. **Reviews Due first/last label clipping fix** -- Updated `ReviewsDueChart` in `dashboard-shell.tsx` so edge value labels are inset (`left-2` / `right-2`) and chart rows have slight horizontal padding (`px-1`), preventing three-digit counts like `129` from clipping to `29` at the chart boundaries.
21. **Corpus stats compacted to single-row layout** -- Updated `CorpusCard` in `dashboard-shell.tsx` from three tall stacked stat rows to one dense horizontal strip (`Ranked words`, `Examples`, `Audio coverage`) with tighter paddings and one-line visual rhythm, preserving all values while reducing vertical space substantially.
22. **Start Study delay bug fixed (non-blocking preferences save)** -- In `review-session.tsx`, updated `handleStartStudy()` so `persistSessionPreferences(...)` runs in the background instead of being awaited before `setPhase("studying")`. This removes the visible 1+ second delay before study starts, while still persisting settings safely when the request succeeds.
23. **Homepage background switched to interactive orange dot field** -- Replaced the old floating orb/sphere background in `home-glass-landing.tsx` with a canvas-based dense dot field that reacts to hover/pointer movement (Antigravity-style motion language), keeps dots behind the glass panel, and uses the product orange accent instead of gray.
24. **Homepage marketing messaging upgraded for conversion** -- Reworked home hero content in `home-glass-landing.tsx` into clearer value positioning: direct problem statement (`Stop forgetting words after week one`), competitor contrast (`Most apps optimize for streak taps`), and concise benefit blocks (`Adaptive SRS`, `Context first`, `One clear daily queue`) while keeping a premium visual hierarchy.

---

## 12. Future Plans

- Sentence cycling will become standard for all languages (not just HSK 1/2)
- HSK 3-6 may be added as separate studyable lists
- French and German corpora will be expanded
- Audio should always match the displayed sentence for all languages

---

*Last updated: April 14, 2026*

67. **Native macOS app scaffolded with heavy Liquid Glass (SwiftUI)** -- Added standalone macOS product at `/Users/moi/Desktop/business/learnly/macos/LanguageHackMac` (SwiftPM executable app target `LanguageHack`, macOS 26 baseline). Implemented 4 core surfaces (`Home`, `Dashboard`, `Study`, `Words`) with system-wide Liquid Glass usage (`glassEffect`, `GlassEffectContainer`, `glassEffectID`, interactive glass controls, soft scroll-edge effects), plus native `NavigationSplitView` shell and toolbar grouping (`ToolbarSpacer`).
68. **Swift data/business layer added with SQLite parity path** -- Implemented `LearningRepository` port and concrete `SQLiteLearningRepository` backed by local SQLite in `~/Library/Application Support/LanguageHack/learnly.db`, with first-launch seed copy from bundled `learnly-seed.db`, persisted settings/session/review flow, queue generation, review submission, dashboard snapshots, words listing, and word detail/example loading.
69. **Study loop + keyboard/audio foundations implemented in native app** -- Added native study state machine (standard flow + Chinese 2-click/4-click staged flow), binary grading path with recovery stage, keyboard shortcuts (`Up/Down/Right/Left`, `P`, `Shift`), session insights tracking, and audio provider abstraction with macOS voice playback plus optional ElevenLabs fetch/cache path.
70. **macOS run pipeline integrated into repo tooling** -- Added `/Users/moi/Desktop/business/learnly/script/build_and_run_macos.sh` (run/debug/log/telemetry/verify modes), updated `/Users/moi/Desktop/business/learnly/.codex/environments/environment.toml` with dedicated `Run macOS` action, and added `/Users/moi/Desktop/business/learnly/macos/LanguageHackMac/README.md` for architecture/run instructions.
71. **Web baseline blocker fixed and revalidated** -- Fixed nullability issue in `/Users/moi/Desktop/business/learnly/src/lib/demo/store.ts` (`retrievabilityPercent` now null-safe), and confirmed `npm run build` succeeds again after the patch.
72. **macOS launch crash fixed (repository queue reentrancy)** -- Fixed a startup crash in `SQLiteLearningRepository` where `loadDashboard` called `loadSettings` inside the same serial `queue.sync`, triggering `dispatch_sync called on queue already owned` and immediate app termination. Added `loadSettingsInternal` (no extra sync) and routed internal calls through it, restoring successful app launch/window creation.
73. **macOS P0 UX/logic stabilization pass** -- Removed nested split on Words screen (`WordsView` now uses `HSplitView` inside root detail), added shared error banners (`ErrorBanner`) for app/study/words failures, and tightened keyboard scope so shortcuts are active only in active Study sessions.
74. **Study pause semantics fixed** -- `StudyViewModel` now tracks real paused time (`pauseStartedAt` + `accumulatedPausedSeconds`), freezes elapsed timer while paused, and blocks review actions during pause overlay; also added monitor teardown on view disappearance.
75. **Session progress/resume correctness improved** -- `StudySession` now carries `queueCount` (progress based on real queue, not `due+new`), repository can `resumeLatestSession`, and bootstrap restores an unfinished session into Study.
76. **Dashboard/query resilience updates** -- `Reviews Due` buckets are now per-day (`>= day start && < next day`), dashboard/start-session language scopes now normalize empty language lists, and SQLite placeholder helper returns `NULL` for zero-count placeholder sets.
77. **Screenshot policy preference captured** -- User asked to stop screenshot-taking during implementation; no new screenshots should be taken unless explicitly requested in that moment.
78. **macOS readability-first pass (no screenshots)** -- User reported the native app as unusable due to low text legibility. Implemented contrast-first UI pass across `LiquidGlassStyle`, `HomeView`, `DashboardView`, `StudyView`, `WordsView`, and `RootShellView`: added explicit AppKit label-based text tokens (`Color.glassTextPrimary/Secondary/Tertiary`), switched text layers from low-opacity `.primary` variants to high-contrast label colors, increased small-copy prominence in chart/status labels, and reduced backdrop/orb + glass haze so content remains readable.
79. **Glass surface contrast baseline strengthened** -- `GlassCardModifier` now uses color-scheme-aware base fills and borders (`light: stronger white panel + dark border`, `dark: stronger dark panel + light border`) with controlled tint overlay, preventing text from sinking into overly translucent tinted glass.
80. **Toolbar/settings action contrast alignment** -- Prominent actions now use the shared `studyActionProminent` path with explicit theme-aware foreground, and settings/toolbar text was moved to readable label colors for consistent legibility.
81. **Screenshot restraint reinforced** -- Continued honoring user instruction to avoid screenshots during implementation unless explicitly requested in that moment.
82. **Light-mode shadow cleanup for dashboard/chips** -- Reduced shadow budget in macOS `SurfaceTokens`, removed light-theme shadows from shared `readableSurface` backgrounds, removed light-mode shadow from the dashboard `Today` hero card, and softened light-mode shadow on the orange prominent CTA to keep visuals flatter and closer to the website.
83. **Dashboard learning-rate reality fix (macOS)** -- Replaced placeholder `newAvailableCount / 3` in native dashboard UI with a real `averageNewPerDay` metric computed in `SQLiteLearningRepository` from active words and earliest `introduced_at` across the active language scope, rounded to one decimal (web-parity behavior).
84. **Settings modal redesign (macOS)** -- Rebuilt `SettingsSheet` in `RootShellView.swift` from basic controls to a premium sectioned panel: custom daily-goal step controls, polished segmented pills for preferred mode/chinese flow, language selection chips (replacing raw checkbox list), cleaner header, and balanced footer actions (`Cancel` + orange `Done`) to better match the site-quality visual system.
85. **Study pause UI redesign (macOS)** -- Replaced the old small centered pause modal card (with duplicate in-card Resume button) by a cleaner pause presentation in `StudyView.swift`: soft full-screen scrim + compact horizontal paused-status banner (`Paused`, shortcut hint, `P` key pill), while resume action stays in the top control bar.
86. **Study recovery wording clarity fix (macOS)** -- Renamed the recovery secondary CTA from `Still studying` to `Need more time` in `StudyView.swift` to remove confusing phrasing and make the action intent explicit.
87. **Words sidebar box-artifact fix (macOS)** -- Replaced native `List` in `WordsView.sidebar` with `ScrollView + LazyVStack` row buttons to eliminate extra white boxed list background/selection slab and keep the left column as a clean single-surface panel.
88. **Study setup-first flow + setup UI rebuild (macOS)** -- `Start Study` no longer auto-starts a session (`AppViewModel.startStudyFromAnywhere` now only routes to `.study`; header CTA also exits completion and opens setup first). Rebuilt `StudyView` setup card toward web parity: centered `Study session / Ready to study?`, language pills, custom `Session mode` segmented control, new `Time mode` (`Timer`/`Stopwatch`) control, timer-duration slider card (`1..60 min`), and primary `Start Study` CTA.
89. **Wide top-bar parity update (macOS)** -- Reworked `RootShellView.webParityHeader` to match the approved wide-header reference when space allows: one-row layout with logo at left (acts as Home), centered `Dashboard/Words` capsule nav, right-side settings+theme icon buttons, and fixed-width orange `Start Study` CTA; compact multi-row header remains as fallback on narrower widths.
90. **Study sentence-translation tape reveal added (macOS)** -- In `StudyView`/`StudyViewModel`, sentence translation is now hidden behind an interactive tape in answer/recovery states and reveals only on tap or `Shift` (`tap or press shift`), resetting per card/stage so each new reveal starts covered.
91. **Dark-mode filled-button text rule re-enforced in macOS UI** -- Updated filled controls to use theme-aware foregrounds so dark mode always uses black text on filled buttons: Study top controls (`cards left`, gear, pause, end), Study decision CTAs, Study setup selected segmented pills, and Dashboard `7/30 days` selected toggle.
92. **Header Study CTA hidden in Study section (macOS)** -- Updated `RootShellView` so the top `Start Study` button is not rendered when `selectedSection == .study` (both wide and compact headers), keeping Study setup/session/completion as dedicated in-mode flows without redundant cross-mode CTA.
93. **Study pause style shifted to compact top status bar (macOS)** -- Reworked `pauseOverlay` in `StudyView.swift` from a centered long white pill to a cleaner top-aligned paused status strip with reduced scrim intensity and a small filled `Session paused` badge + shortcut hint, keeping pause state visible without obscuring the study card.
94. **Study setup visual polish pass (macOS)** -- Refined setup UI in `StudyView.swift` to remove the heavy/cheap look: full-width `Start Study` CTA, softer segmented tracks, less aggressive selected segment fills, cleaner language-chip surfaces/borders, larger slider control weight, and slightly roomier card spacing/padding for closer web-quality hierarchy.
95. **Timer-mode countdown + graceful card-finish completion (macOS)** -- `StudyViewModel` now exposes countdown clock logic for `timeMode == .timer` (`displayedClockSeconds`) and final-minute warning state (`isTimerInFinalMinute`). The top study timer now counts down from selected minutes to `00:00`. When timer reaches zero, the session no longer interrupts immediately; instead, current card review can be finished, and then the flow auto-completes into completion state instead of loading another card.
96. **Full-shape button hit-area fix (macOS)** -- Updated custom button controls in `StudyView.swift`, `RootShellView.swift`, and `DashboardView.swift` so tap/click detection follows the whole visible control geometry (`Capsule`/`RoundedRectangle`/`Circle`) rather than only text bounds; key CTA/segment/chip/control buttons now define explicit `contentShape(...)` and use label-based `Button(action:)` where needed.
97. **Study setup language-chip layout cleanup (macOS)** -- Replaced the setup `Languages` adaptive-grid row in `StudyView.swift` with a horizontal intrinsic-width chip row (`ScrollView + HStack`) and forced chip labels to keep intrinsic width (`fixedSize(horizontal: true, vertical: false)`), eliminating the stretched connected-pill seams/oval artifacts between language chips.
98. **Post-session completion stats now shown on manual End (macOS)** -- Updated session-ending flow so pressing `End` during an active card no longer clears directly to setup. `StudyViewModel.endSession()` now routes active sessions into completion mode, fetches real `SessionInsights` through a new repository port (`LearningRepository.loadSessionInsights`), and freezes elapsed time via completion snapshot so the stats panel remains stable. Exiting from completion still clears to setup.
99. **Header Start Study CTA compact sizing in short-height layouts (macOS)** -- Updated `RootShellView` so wide-header mode depends on width only (`>=1320`) and compact fallback no longer renders a full-width `Start Study` bar. The compact CTA now right-aligns as a smaller fixed-width button (`compactStudyButtonMinWidth`) for cleaner web-parity hierarchy when there is enough horizontal space.
100. **Dashboard Today hero badge cleanup (macOS)** -- Removed the top-right `DUE` pill/badge from `DashboardView.todayHeroCard` so the module focuses on `Today`, the large due number, and `cards due today` only.
101. **Dashboard language selection visibility boost (macOS)** -- Updated `DashboardView` language filters so selected chips now use a clear orange active state (solid accent fill + contrast text) and `All` also turns orange when every language is selected, making selection state immediately visible.
102. **Settings modal header simplification (macOS)** -- Removed the redundant `gearshape` icon pill from `SettingsSheet.headerSection` in `RootShellView.swift`, leaving a clean text-only header (`Settings` + subtitle).
103. **Dashboard streak redesigned with Duolingo-like energy (macOS)** -- Reworked `DashboardView.streakCard` to a more gamified layout: prominent flame badge with warm gradient, stronger streak count hierarchy (`X days in a row`), contextual momentum copy, weekday header, and a denser 4-week dot grid with trailing active progression and today flame marker.
104. **macOS theme toggle now preserves `system` auto-follow mode** -- Updated `RootShellView` theme behavior so the header theme button cycles `system -> dark -> light -> system` (instead of locking to manual dark/light), and added a distinct icon for auto mode. This keeps app appearance synced with device theme whenever `system` is active.
105. **Vocabulary Growth now shows per-day hover stats (macOS)** -- Upgraded `DashboardView.vocabularyCard` with interactive bar hover behavior: hovering an individual bar now updates the selected-day summary (`Today / Yesterday / N days ago` + date), highlights the active bar, and shows a polished floating popover above the chart with exact `Strong`, `Learning`, and `Total` counts for that hovered day. Leaving the chart resets to `Today`.
106. **Active-state visibility fix for top tabs + Words list (macOS)** -- Reworked selection styling in `RootShellView` and `WordsView` to remove weak shadow-based selected cues and use explicit high-contrast active states: selected top nav tabs now get a clear filled capsule + border with theme-aware readable text, and selected word rows now get an unmistakable filled card + stroke treatment with full-row hit shape.
107. **Header/density organization pass for dashboard parity (macOS)** -- Tightened shell structure to reduce the “unorganized / wasted space” feel: lowered wide-header breakpoint (`1120`) so desktop widths use the one-row website-like header more often, rebuilt compact-header second row to keep nav + CTA grouped instead of drifting into large empty zones, and constrained dashboard top-left column to a deliberate width (`430`) so `Today + mini stats` and `Languages` align in a clearer web-style rhythm.
108. **Web dashboard top strip forced to one-row desktop/tablet layout** -- Updated `/src/components/dashboard/dashboard-shell.tsx` so the top dashboard stack now uses a 3-column row from `sm` and no longer uses the `sm:col-span-2` queue fallback that dropped `Languages` to a second line. `Today`, stacked `Reviewed/New`, and `Languages` now stay in one horizontal strip on non-mobile widths.
109. **Web dashboard top strip compacted to remove vertical waste** -- Tightened the same top-row modules in `/src/components/dashboard/dashboard-shell.tsx`: reduced min heights (`~170/188` instead of `236`), reduced internal paddings, and slightly compressed mini-card metric scales so `Today + Reviewed/New + Languages` remains one line while using much less vertical space.
110. **Top floating header opacity restored** -- Updated `/src/app/globals.css` `.floating-nav` (and dark variant) to use stronger glass opacity + blur so the top bar is readable and no longer overly transparent over dashboard content.
111. **Dashboard streak section compacted** -- Refactored streak area in `/src/components/dashboard/dashboard-shell.tsx` into a denser two-column module (`streak summary` + `last 5 weeks grid`) with reduced paddings/sizes and tighter dot matrix spacing, preserving all streak information while cutting vertical space substantially.
112. **Dashboard top strip compacted for narrow/mobile widths** -- Updated `/src/components/dashboard/dashboard-shell.tsx` to reduce wasted space in the top stack: smaller `Today` hero height/number scale, denser `Reviewed/New` mini cards, tighter `Languages` card spacing, and a responsive top-grid strategy (`2-column compact layout from narrow widths, `Languages` spanning below it, 3-column strip restored on wide widths) so the section no longer feels oversized.
113. **Homepage shell/cards removed for stronger background impact** -- Updated `/src/components/home/home-glass-landing.tsx` and `/src/app/globals.css` to remove the outer glass box and nested stat/pitch cards. The homepage now uses a box-free content layout (clean nav + hero + inline metrics + separator-based pitch rows) so the orange dot-field background reads as the primary visual impact instead of being muted by container layers.
114. **Dashboard top strip re-compacted into one desktop row** -- Updated `/src/components/dashboard/dashboard-shell.tsx` so desktop now enforces a single horizontal strip (`Today` + stacked `Reviewed/New` + `Languages`) and tightened module heights/paddings (`Today`, mini cards, and Languages) to remove obvious vertical waste.
115. **Reproducible Git sync workflow added** -- Added `/Users/moi/Desktop/business/learnly/SYNC.md` plus executable `/Users/moi/Desktop/business/learnly/script/sync_macos_v1_to_remote.sh`. Workflow now reliably syncs local `learnly` into remote path `learnly macOS v1 (ignore)/learnly copy`, supports `--dry-run`, and can optionally fast-forward merge into `main` via `--merge-main`.
116. **Sync-to-main is now default behavior** -- Updated `/Users/moi/Desktop/business/learnly/script/sync_macos_v1_to_remote.sh` and `/Users/moi/Desktop/business/learnly/SYNC.md` so a normal run now syncs branch + fast-forward merges into `main` automatically. New `--no-merge-main` flag keeps branch-only mode when needed.
117. **iOS startup crash root cause fixed (`learnly-seed.db` missing in bundle)** -- Diagnosed iOS simulator `quit unexpectedly` as `Fatal error: Bundled seed database learnly-seed.db is missing.` during `LanguageHackiOSApp` initialization. Root cause: generated Xcode project had no `PBXResourcesBuildPhase`, so seed DB and Assets were not copied to app bundle.
118. **XcodeGen resource wiring corrected for iOS app** -- Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/project.yml` to include `LanguageHackiOS/Resources` under `sources` with `buildPhase: resources`, then regenerated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS.xcodeproj`. Verified `project.pbxproj` now contains `Assets.xcassets` and `learnly-seed.db` in `PBXResourcesBuildPhase`, and `./script/build_and_run_ios.sh --verify` launches successfully on iPhone/iPad simulators.
119. **iPhone shell switched to full-screen edge-to-edge layout** -- User flagged that iOS app looked non-full-screen. Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/App/RootShellView.swift` adaptive metrics to enable phone full-screen mode (`usePhoneFullscreenShell`): removed root horizontal/bottom insets, removed top inset, set content width to full (`.infinity`), and flattened header radius on phone to avoid framed/card-window appearance.
120. **iPhone navigation switched to bottom liquid-glass bar** -- Reworked `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/App/RootShellView.swift` so phone layout no longer renders the desktop top header shell. Added a touch-first bottom glass nav bar (`Home`, `Dashboard`, `Study`, `Words` + `Settings`) via `safeAreaInset`, kept iPad/desktop shell unchanged, and moved phone settings presentation to full-screen cover for native mobile flow.
121. **Study mobile adaptation + shortcut cleanup (iPhone)** -- Refactored `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/Views/StudyView.swift` with separate mobile/desktop layouts: phone now uses scrollable study/setup/completion sections with bottom action dock inset, while desktop keeps previous structure. Disabled keyboard bridge/monitor on phone, removed phone shortcut affordances (`↑/↓`, `Press P`, `Shift` hint), and replaced with touch-only labels (`Word`, `Sentence`, `tap to reveal`).
122. **Words mobile flow changed from split squeeze to list→detail** -- Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/Views/WordsView.swift` for iPhone: show list-first screen and open selected word details in full-screen overlay with `Done` action, instead of rendering split/stacked desktop-style panels on narrow phone layouts.
123. **Theme UX corrected for mobile iOS** -- Removed theme toggle from navigation bars in `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/App/RootShellView.swift` and moved theme control into Settings only. `SettingsSheet` now includes a `Theme` section with `System / Light / Dark`, with `System` explicitly documented to follow device appearance automatically. This resolves the previous confusing behavior where icon state changed in-bar while theme switching felt unreliable.
124. **iOS theme application moved to app-root scene for reliable dark/light switching** -- Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/App/LanguageHackiOSApp.swift` to read `@AppStorage("languagehack.ios.theme")` and apply `.preferredColorScheme(...)` directly on the `WindowGroup` root view (`RootShellView`). This ensures `System / Light / Dark` selection propagates across all screens and overlays.
125. **iPhone Settings presentation forced to true fullscreen flow** -- Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/App/RootShellView.swift` to remove mixed `sheet/fullScreenCover` branching and always present `SettingsSheet` with `fullScreenCover`, plus phone-safe edge-to-edge frame/padding tuning in `SettingsSheet` to avoid inset card/form-sheet appearance.
126. **Mobile settings readability + theme control polish** -- Updated `SettingsSheet` theme controls in `RootShellView.swift` to use `ViewThatFits` fallback rows and non-wrapping segmented labels (`lineLimit(1)`, `minimumScaleFactor`) so `System / Light / Dark` remains legible on narrow iPhone widths.
127. **iOS visual-parity polish pass (Dashboard/Study/Words)** -- Updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/Views/DashboardView.swift` mobile top stack (`Today + stacked Reviewed/New + Languages`) and set selected `7/30 days` range chip fill to light-blue (`WebParityPalette.blueDark`) instead of black; updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/Views/StudyView.swift` setup selected segments to light-blue, setup language selections to orange filled chips, and completion filled-card text to theme-correct contrast (white in light, black in dark); updated `/Users/moi/Desktop/business/learnly/languagehack_ios/LanguageHackiOS/Sources/Views/WordsView.swift` iPhone sidebar to remove the extra outer boxed surface and keep a cleaner full-screen list-first look.
128. **Build/run verification after fixes** -- Rebuilt and launched successfully with `./script/build_and_run_ios.sh --verify` on `iPhone 17 Pro` simulator (`AB1003F8-9920-4257-A536-E387608A59A3`) after the fullscreen + dark-theme fixes.
129. **Learnly web startup fallback recorded** -- For this session, I read `RUN.md` and `.claude/launch.json` before booting the site. `npm run dev` and plain `next dev` both seeded successfully but then stalled without giving reliable HTTP responses, while `next build` also failed to become useful. The workable startup path was `./node_modules/.bin/tsx ./scripts/seed-db.ts && ./node_modules/.bin/next dev --turbo -H 127.0.0.1 -p 3000`, which reached `Ready` on port `3000`; keep that as the first fallback when the standard Next dev path hangs again on this machine.
130. **Root web TypeScript scope narrowed to stop Next dev timeouts** -- Updated `/Users/moi/Desktop/business/learnly/tsconfig.json` to replace broad root-level `**/*.ts` / `**/*.tsx` includes with explicit web-relevant paths (`src`, `scripts`, `tests`, `data`, and config files) and to exclude heavy non-web trees like `macos`, `languagehack_ios`, and `corpus-generation`. After clearing `.next` and restarting with Turbopack, both `/` and `/dashboard` compiled cleanly and returned `200 OK`.
131. **RUN.md now documents the real web startup runbook** -- Expanded `/Users/moi/Desktop/business/learnly/RUN.md` so it no longer describes only the happy path. It now includes the exact April 18, 2026 recovery steps: what failed (`failed to receive message`), why it failed (root `tsconfig.json` too broad), the exact cleanup commands, the exact Turbopack startup command that worked, `curl` verification commands, the Node 20 / `better-sqlite3` ABI caveat, and guidance for Claude Code Preview fallback.
