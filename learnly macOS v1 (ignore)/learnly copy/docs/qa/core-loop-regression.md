# Core Loop QA Regression Guide

This QA layer is intentionally narrow: it covers `home`, `dashboard`, `study`, the shared shell/theme/settings behavior around those routes, and the supporting study APIs. It does not try to lock down `words`, `v2`, `library`, `lists`, `onboarding`, or legacy review yet.

## Commands
- `npm run test:e2e`
  Chrome-focused smoke and regression suite for the core loop.
- `npm run test:e2e:safari`
  WebKit sanity pass for `home`, `dashboard`, and `study`.
- `npm run qa:core-loop:capture`
  Generates a curated screenshot set under `artifacts/core-loop-qa/<timestamp>/`.
- `npm run qa:core-loop`
  Runs the screenshot capture, Chrome regression suite, and Safari sanity when WebKit is available, then writes a combined report into the same artifact folder.
- `npm run qa:fixture -- fresh`
  Prints the seeded fresh-user fixture JSON.
- `npm run qa:fixture -- in-progress '{"selectedLanguages":["es"]}'`
  Prints a deterministic in-progress fixture JSON.

## Required matrix

### Browser coverage
- Chrome is the primary automated target.
- Safari is a sanity target through the WebKit project plus manual checks when visual fidelity matters.

### Viewports
- Desktop: `1512x982`
- Standard mobile: `390x844`
- Short-height mobile: `390x680`

### Themes
- Light
- Dark

### Study modes and states
- Standard non-Chinese flow
- Chinese `4 click`
- Chinese `2 click`
- Setup
- Prompt
- Reveal
- Recovery
- Paused
- Completed
- Refresh-restored

## Deterministic fixture states
All browser and API tests should start from one of these fixture kinds:
- `fresh`
  Seeded baseline, no active session, clean setup state.
- `in-progress`
  Seeded baseline plus an already-started session with one reviewed card and persisted resume state.
- `recovery`
  Seeded baseline plus an active session restored on the first card, ready to enter the recovery branch with one interaction.

Fixtures are generated out-of-process through `scripts/qa/demo-user-fixture.ts` so the store seed logic re-runs cleanly after every reset.

## Manual audit checklist

### Home
- Verify the first screen clearly states what LanguageHack is and why it is different.
- Verify the primary CTA is honest about the next step.
- Verify desktop and mobile expose the same product structure.
- Verify decorative background does not overpower headline, CTA, or stats.
- Verify the visual transition from home into the app shell feels like one product family.

### Dashboard
- Verify the first screen answers: what is due, what is new, what should I do next.
- Verify `Today` remains the dominant block.
- Verify chart readability in both light and dark themes.
- Verify language filters update quickly, correctly, and without stale UI.
- Verify counts align with the current dashboard language selection.
- Verify mobile scroll order surfaces the most important content first.
- Verify light mode does not collapse into weak card-on-card hierarchy.

### Study
- Verify setup is understandable and the primary action is visible above the fold on mobile.
- Verify prompt, reveal, and recovery states feel distinct.
- Verify the learner always understands what is being asked.
- Verify `No` / `I don't know` enters recovery before fail submission completes.
- Verify Chinese pinyin stays hidden before the pronunciation decision in `4 click`.
- Verify translation reveal behavior feels intentional after failure.
- Verify the top rail never visually outranks the learning object.
- Verify short-height layouts do not clip the main CJK line, example card, or recovery CTA.
- Verify pause, resume, end, and refresh restore preserve session meaning.

### Theme and shell
- Verify light/dark parity across home, dashboard, and study.
- Verify navigation, icons, and CTA behavior remain coherent between desktop and mobile.
- Verify settings access is obvious and screen-reader safe.
- Verify theme toggling updates all relevant surfaces, not only the page background.

## What every QA cycle should output
- A curated screenshot folder in `artifacts/core-loop-qa/<timestamp>/screenshots`
- `manifest.json` with screenshot metadata
- `report.md` grouped into:
  - functional regressions
  - UX blockers
  - visual inconsistencies
  - regression summary
  - core-loop scorecard
- `results/summary.json` with the automated browser-run counts and failed/skipped test titles

## Acceptance criteria
- No blank or partially rendered core screens.
- No uncaught console or page errors in happy paths.
- No 4xx/5xx API failures in seeded happy paths.
- The core CTA remains visible and semantically honest.
- Mobile core flow stays usable with no clipped primary actions.
- Recovery always provides immediate help after failure.
- Desktop and mobile expose the same product structure.
- Dark mode feels like the same product, not a degraded fallback.
