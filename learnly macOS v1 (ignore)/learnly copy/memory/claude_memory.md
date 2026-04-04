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

### Chinese Flow (zh, zh-hsk1)
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

---

## 12. Future Plans

- Sentence cycling will become standard for all languages (not just HSK 1/2)
- HSK 3-6 may be added as separate studyable lists
- French and German corpora will be expanded
- Audio should always match the displayed sentence for all languages

---

*Last updated: April 4, 2026*
