# Sentence Preview Feature

This document describes the sentence preview feature exactly as it is currently implemented in this repo. It is not a theoretical design doc. The goal is to make the feature easy to understand, easy to copy, and easy to rebuild for other language databases.

## What the feature does

For supported Chinese study content, the app turns example sentences into interactive token streams.

- Hover, focus, or tap a matched word inside the sentence.
- Show a preview card with pronunciation and all matched definitions.
- Show an orange `Learn` button only when none of the matched senses are already in learner state.
- If the learner presses `Learn`, create learner state for that word and optionally inject it into the active session queue.

Today this is enabled only for:

- `zh-hsk1`
- `zh-hsk2`
- `zh-hsk3`

It is intentionally not enabled for:

- `zh`
- `es`
- `fr`
- `de`

## Files involved

These are the files that currently make the feature work:

- `src/lib/demo/chinese-sentence-preview.ts`
- `src/lib/demo/types.ts`
- `src/lib/demo/store.ts`
- `src/components/words/chinese-sentence-preview.tsx`
- `src/app/api/item/[id]/learn/route.ts`
- `src/components/review/review-session.tsx`
- `src/app/words/[id]/page.tsx`
- `tests/e2e/core-loop-api.spec.ts`
- `tests/e2e/core-loop-study.spec.ts`

## Data this implementation depends on

The preview system is built on top of the existing DB tables. No new tables were added.

### `corpus_items`

The matcher uses these fields from `corpus_items`:

- `id`
- `language_code`
- `display_form`
- `rank`
- `pronunciation`
- `primary_gloss`
- `secondary_glosses`
- `notes`

These fields are enough to:

- identify a token
- group duplicate surface forms
- sort candidate senses
- show all glosses
- show pronunciation
- power the `Learn` action

### `corpus_item_examples`

The sentence surfaces come from `corpus_item_examples`:

- `item_id`
- `sentence`
- `translation`
- `sort_order`

### `user_item_states`

The feature checks learner progress in `user_item_states` to decide:

- whether a token is already being learned
- whether the orange `Learn` CTA should be hidden

### `sessions`

If a preview learn action happens during an active session, the feature updates `sessions.queue` so the learned word can appear in the current session.

## Public types added for the feature

The feature is driven by two additive types in `src/lib/demo/types.ts`.

```ts
export type SentenceTokenSense = {
  itemId: string;
  languageCode: SupportedLanguageCode;
  pronunciation?: string;
  primaryGloss: string;
  glosses: string[];
  notes?: string;
};

export type SentenceTokenPreview = {
  text: string;
  matched: boolean;
  pronunciation?: string;
  senses?: SentenceTokenSense[];
  learnItemId?: string;
  alreadyLearning?: boolean;
};
```

These types are then added to two existing payloads:

- `SessionCardPayload.exampleTokens?: SentenceTokenPreview[]`
- `WordDetailSnapshot.examples[].tokens?: SentenceTokenPreview[]`

That means the UI never tokenizes on the client. The client only renders token data that was already prepared on the server.

## End-to-end flow

The implemented flow is:

1. Load a sentence from the DB.
2. Decide whether the sentence language supports preview tokenization.
3. Build token previews on the server.
4. Send those tokens in the existing session card or word detail payload.
5. Render interactive sentence tokens on the client.
6. Call `POST /api/item/[id]/learn` if the learner presses `Learn`.
7. Update local token UI and, if relevant, the active study queue.

## Server-side sentence matching

The matching logic lives in `src/lib/demo/chinese-sentence-preview.ts`.

### Supported language gate

The module starts by explicitly gating preview support:

```ts
type HskSentencePreviewLanguage = "zh-hsk1" | "zh-hsk2" | "zh-hsk3";
```

It also provides:

- `isHskSentencePreviewLanguage(...)`
- `buildChineseSentenceTokenPreviews(...)`

If a sentence language is not one of those three codes, the builder returns `undefined`.

### Scope rules

The Chinese implementation uses cumulative HSK scope:

- `zh-hsk1` matches `zh-hsk1`
- `zh-hsk2` matches `zh-hsk1` + `zh-hsk2`
- `zh-hsk3` matches `zh-hsk1` + `zh-hsk2` + `zh-hsk3`

This is implemented in the `HSK_SCOPE` constant.

### Lexicon building

For a given sentence language, the module queries all in-scope rows from `corpus_items`, then builds a lexicon in memory.

Each row becomes a `PreviewLexiconEntry` with:

- `itemId`
- `languageCode`
- `displayForm`
- `rank`
- `pronunciation`
- `primaryGloss`
- `secondaryGlosses`
- `notes`
- `length`

The builder then:

1. Groups entries by `displayForm`.
2. Sorts same-surface entries with a deterministic priority.
3. Indexes grouped surfaces by their first character.
4. Sorts each first-character candidate list by longest surface first.

### Why the lexicon is cached

The final lexicon is cached in:

```ts
const lexiconCache = new Map<HskSentencePreviewLanguage, PreviewLexicon>();
```

That means the server does not rebuild the scoped lexicon every time a session card is created. It builds it once per supported language per process.

### Candidate ordering

Duplicate surface forms are sorted with `sortEntriesForLanguage(...)`.

The priority is:

1. exact sentence language first
2. lower rank first
3. language code
4. item id

This ordering matters because:

- the first entry becomes the token-level pronunciation
- the first entry becomes the default `learnItemId`
- all entries still appear as separate sense rows in the preview

### Longest-match tokenization

The actual sentence scan is deterministic greedy longest-match tokenization.

Algorithm:

1. Convert the sentence into a character array.
2. Look up candidate surfaces by the current character.
3. Because candidates are already sorted longest-first, take the first surface that fully matches the upcoming character slice.
4. If there is no match, append the character to a plain-text buffer.
5. Flush the plain-text buffer whenever a real token match is found.
6. Continue until the sentence ends.

This gives the behavior we wanted:

- multi-character words beat smaller overlapping words
- unmatched characters remain visible
- punctuation and unknown text stay inert

### Unmatched text handling

Any character run that does not match the scoped lexicon becomes:

```ts
{ text: plainTextBuffer, matched: false }
```

This is important because the feature does not break the sentence if the corpus contains a token that is outside the preview lexicon.

## Sense building inside a matched token

When a surface is matched, the implementation converts every grouped entry into a `SentenceTokenSense`.

Each sense contains:

- `itemId`
- `languageCode`
- `pronunciation`
- `primaryGloss`
- `glosses`
- `notes`

### Gloss deduplication

Gloss text is built by:

1. taking `primaryGloss`
2. appending `secondaryGlosses`
3. trimming empty values
4. removing duplicates while preserving order

This is done by `dedupeGlosses(...)`.

So the preview shows all definitions we already have, but avoids repeating identical gloss strings.

## Learn state calculation inside a token

The matched token builder checks all entries for that surface against the learner state map.

```ts
const alreadyLearning = entries.some((entry) => Boolean(stateMap[entry.itemId]));
```

That means the orange CTA is suppressed if any matched sense already exists in learner state.

The matched preview payload is then built like this:

- `senses`: all matched senses
- `pronunciation`: from the first sorted entry
- `alreadyLearning`: true if any sense already has learner state
- `learnItemId`: the first sorted entry's `itemId`, but only if `alreadyLearning` is false

So v1 behavior is:

- show all senses
- learn only one primary sense

## How token data gets attached to existing app payloads

`src/lib/demo/store.ts` contains the integration layer.

### Shared helper

The store uses a thin wrapper:

```ts
function buildExampleTokens(
  sentence: string,
  languageCode: SupportedLanguageCode,
  stateMap: Record<string, UserItemState>
) {
  return buildChineseSentenceTokenPreviews({
    sentence,
    languageCode,
    stateMap,
  });
}
```

### Study session cards

`toCard(...)` attaches preview tokens here:

- `exampleTokens: buildExampleTokens(example, item.languageCode, previewStateMap)`

So the current study example sentence can arrive with token data already attached.

### Word detail examples

`getWordSnapshot(...)` attaches preview tokens to every example sentence:

- `tokens: buildExampleTokens(r.sentence, item.languageCode, stateMap)`

So Word Detail and Study both use the same server-side token builder.

## Client rendering

The UI component lives in `src/components/words/chinese-sentence-preview.tsx`.

Even though the name is Chinese-specific, the component itself is mostly a generic token-preview renderer. The Chinese-specific part is mainly the source of the tokens and the level labels.

### What the component receives

The component takes:

- `tokens`
- `className?`
- `sessionId?`
- `onLearned?`

### Plain text vs interactive tokens

For each token:

- if `matched` is `false`, it renders plain text
- if `matched` is `true` and senses exist, it renders a button

This is why unmatched punctuation or unknown text still reads normally.

### Desktop behavior

On desktop:

- `mouseenter` opens the preview while nothing is pinned
- `mouseleave` clears hover if nothing is pinned
- `focus` opens the preview
- `click` pins or unpins the preview
- `Escape` closes it
- outside click closes it

The desktop preview is rendered with `createPortal(...)` and positioned with `buildDesktopPreviewPosition(...)`.

### Mobile behavior

The component switches to compact mode when:

- `max-width: 767px`, or
- pointer is coarse

In compact mode:

- tapping a token opens one bottom-sheet-style preview
- only one mobile preview stays open at a time
- tapping the backdrop closes it

### Preview card contents

The preview card shows:

- token text
- token pronunciation, if present
- one sense row per matched sense
- HSK level label per sense
- all glosses joined with ` • `
- notes, if present
- orange `Learn` button when `learnItemId` exists and `alreadyLearning` is false
- muted `Learning` pill otherwise

## Learn API

The API route is:

- `POST /api/item/[id]/learn`

Its route implementation is in `src/app/api/item/[id]/learn/route.ts`.

### Request body

```json
{ "sessionId": "optional-session-id" }
```

`sessionId` is optional.

### Response shape

```ts
{
  itemId: string;
  introduced: boolean;
  sessionInjected: boolean;
  status: string;
}
```

### What the route does

The route:

1. validates the JSON body with Zod
2. calls `learnPreviewItem(...)`
3. returns JSON

### What `learnPreviewItem(...)` does

The real business logic lives in `src/lib/demo/store.ts`.

It performs these steps:

1. load the item by id
2. fail if the item does not exist
3. fail if the item language is not `zh-hsk1`, `zh-hsk2`, or `zh-hsk3`
4. load current learner state
5. if there is no learner state, create one with `createInitialState(...)`
6. if `sessionId` exists and the item is not already in the queue, inject it right after the current item
7. protect against progress regression with the existing progress-count checks
8. return `{ itemId, introduced, sessionInjected, status }`

### Session injection rule

If a valid active session is provided, the implementation injects the learned item like this:

- empty queue: `[itemId]`
- non-empty queue: `[currentItem, itemId, ...rest]`

It does not duplicate items. If the item is already in the queue, it does nothing.

## Where the UI is wired

### Study page

`src/components/review/review-session.tsx`

When the answer state is showing the example sentence:

- if `card.exampleTokens` exists, render `ChineseSentencePreview`
- otherwise render plain `card.example`

The study surface passes:

- `tokens={card.exampleTokens}`
- `sessionId={sessionId}`
- `onLearned(...)`

If the learn call injects a word into the session, the component increments the local remaining count.

### Word detail page

`src/app/words/[id]/page.tsx`

Each example sentence renders:

- `ChineseSentencePreview` when `ex.tokens` exists
- plain sentence text otherwise

## Current behavior that is important to preserve

These details are easy to break if someone rewrites the feature:

- tokenization happens on the server, not on the client
- the UI is additive and falls back to plain text if no tokens are provided
- unmatched text is preserved
- duplicate surface forms show all senses, not just one
- the orange button is hidden if any matched sense is already in learner state
- the learn action is idempotent
- session injection never duplicates queue items

## How to replicate this for another language DB

The safest way to expand this feature is to copy the same architecture, not to rewrite it from scratch.

### Step 1: keep the token payload types

Reuse:

- `SentenceTokenSense`
- `SentenceTokenPreview`

Do not invent a second payload shape unless the new language truly needs one.

### Step 2: build a new language-specific matcher module

Create a new server module similar to:

- `src/lib/demo/chinese-sentence-preview.ts`

For example:

- `src/lib/demo/japanese-sentence-preview.ts`
- `src/lib/demo/thai-sentence-preview.ts`
- `src/lib/demo/german-sentence-preview.ts`

That module should:

1. define the supported language codes
2. define any level-scope rules
3. query the needed rows from `corpus_items`
4. build a lexicon cache
5. convert a sentence into `SentenceTokenPreview[]`

### Step 3: choose a segmentation strategy that matches the language

This repo currently uses greedy longest-match because Chinese text does not come with spaces between words.

For another language:

- if the language is also unsegmented, reuse the same longest-match structure
- if the language is space-separated, you can still return the same token shape, but the tokenization step can be simpler
- if punctuation should stay inert, continue returning unmatched runs as `matched: false`

The important part is not the exact algorithm. The important part is returning the same token payload shape to the UI.

### Step 4: keep duplicate-sense merging

If multiple DB rows share the same displayed token, group them before rendering.

That gives you the same benefits as Chinese:

- one interactive token in the sentence
- multiple sense rows in the preview
- one deterministic primary `learnItemId`

### Step 5: add a dispatcher in `buildExampleTokens(...)`

Right now `buildExampleTokens(...)` always calls the Chinese builder.

To add more languages cleanly, convert it into a dispatcher, for example:

```ts
function buildExampleTokens(sentence, languageCode, stateMap) {
  if (isHskSentencePreviewLanguage(languageCode)) {
    return buildChineseSentenceTokenPreviews({ sentence, languageCode, stateMap });
  }

  if (isJapaneseSentencePreviewLanguage(languageCode)) {
    return buildJapaneseSentenceTokenPreviews({ sentence, languageCode, stateMap });
  }

  return undefined;
}
```

That keeps Study and Word Detail unchanged.

### Step 6: decide whether the same client component can be reused

In many cases you can reuse `ChineseSentencePreview` directly if:

- the new language returns the same token shape
- the preview card structure is still token text + pronunciation + senses + learn CTA

If you want it to become fully generic, the clean migration would be:

- rename `ChineseSentencePreview` to something like `SentenceTokenPreviewInline`
- keep the prop contract the same
- make level-label rendering configurable if needed

The current implementation does not require this rename yet, but it is the most obvious reuse path.

### Step 7: decide whether preview learn should be allowed for that language

Right now `learnPreviewItem(...)` explicitly rejects non-HSK Chinese items.

To support another language, update the eligibility rule there.

Do this only after the sentence matching is reliable, because the `Learn` CTA depends on those item ids being correct.

### Step 8: keep the same test pattern

The current tests cover:

- Chinese session cards returning `exampleTokens`
- non-Chinese cards not returning them
- learn route idempotency
- active-session injection
- study hover preview
- word-detail learn CTA suppression
- mobile bottom-sheet preview behavior

When porting to another language, copy the same test pattern first and only then adjust for language-specific behavior.

## Minimal checklist for adding preview to another language

If you want the shortest practical checklist, use this:

1. Ensure the DB has `corpus_items` rows with `displayForm`, glosses, pronunciation, notes, and stable ids.
2. Ensure sentence examples exist in `corpus_item_examples`.
3. Build a matcher that returns `SentenceTokenPreview[]`.
4. Reuse or extend `buildExampleTokens(...)`.
5. Keep Study and Word Detail reading `exampleTokens` / `tokens`.
6. Reuse the existing preview UI if the token payload shape still fits.
7. Extend `learnPreviewItem(...)` eligibility only after matching works.
8. Add API and UI tests before broadening rollout.

## Limitations of the current implementation

This is important if someone is about to extend it.

- The feature is hard-gated to `zh-hsk1`, `zh-hsk2`, and `zh-hsk3`.
- The UI component name is Chinese-specific even though most of the rendering logic is generic.
- The learn route only allows HSK preview items.
- The preview chooses one primary `learnItemId` even when multiple senses are shown.
- The lexicon cache is process-local memory.

## If you need to rebuild this feature from scratch

If this code were deleted and needed to be rebuilt, the implementation order should be:

1. add `SentenceTokenSense` and `SentenceTokenPreview`
2. build the sentence matcher in a server module
3. attach token payloads in `store.ts`
4. render tokens in a reusable client component
5. add `POST /api/item/[id]/learn`
6. wire the component into Study and Word Detail
7. add API and UI tests

That order matches the current implementation and keeps the feature easy to reason about.
