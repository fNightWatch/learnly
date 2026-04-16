# Curated Screenshot Set

Original dump: `466` PNGs.  
Kept: `10` representative screenshots in this folder.  
Removed: `456` screenshots after summarizing their UI coverage below.

## Kept Screenshots

- `01_home_desktop_light.png` — landing page, desktop light
- `02_home_desktop_dark.png` — landing page, desktop dark
- `03_dashboard_desktop_light.png` — main dashboard, desktop light
- `04_dashboard_mobile_dark.png` — main dashboard, mobile dark
- `05_study_setup_desktop_light.png` — study setup screen, desktop light
- `06_study_session_paused_desktop_light.png` — active review session with pause overlay, desktop light
- `07_study_setup_mobile_dark.png` — study setup screen, mobile dark
- `08_words_desktop_light.png` — vocabulary list, desktop light
- `09_word_detail_desktop_light.png` — vocabulary detail page, desktop light
- `10_words_mobile_dark.png` — vocabulary list, mobile dark

## Removed Screenshot Coverage

### Home variants

- Removed shots covered both light and dark home screens on desktop and mobile.
- Shared visible elements:
  - `LanguageHack` wordmark
  - top-right theme toggle
  - nav links `Dashboard` and `Words`
  - eyebrow `Spaced Repetition`
  - headline `Build lasting vocabulary`
  - supporting copy about adaptive flashcards
  - bright `Start Studying` CTA
  - secondary `Dashboard` CTA
  - three stat cards: `Active words`, `Day streak`, `Retention`
  - animated orange orb background around the glass hero card
- Mobile kept the same hierarchy with tighter spacing and a narrower layout.

### Shared app header and theme states

- Desktop app routes used the floating `LanguageHack` header with:
  - `Dashboard` and `Words` nav links
  - settings gear button
  - theme toggle
  - bright `Start Study` CTA on dashboard and words surfaces
- Mobile app routes used:
  - top row with `LanguageHack`, settings gear, and theme toggle
  - second row with `Home`, `Dashboard`, and `Words`
  - bright full-width `Start Study` CTA on dashboard and words surfaces
- Removed screenshots captured theme-toggle states in both directions:
  - `Switch to dark mode`
  - `Switch to light mode`
- Theme toggles were captured on home, dashboard, study, words, library, and lists.

### Dashboard and lists coverage

- `/dashboard` and `/lists` rendered the same dashboard surface in the capture set.
- Visible modules covered by removed shots:
  - `Today`
  - `Languages`
  - `Reviews Due`
  - `Vocabulary Growth`
  - `Streak`
  - `Corpus`
- Captured `Today` hero values:
  - `129 due today`
  - `36 reviewed today`
  - `0 new words today`
- Captured language controls:
  - `ALL`
  - `Spanish`
  - `French`
  - `German`
  - `Chinese`
  - `HSK 1`
  - `HSK 2`
  - `HSK 3`
- Captured Reviews Due controls:
  - `7 days`
  - `30 days`
  - many chart hover/tap states across individual day labels
- Captured Vocabulary Growth elements:
  - description about introductions becoming durable vocabulary
  - `strong` and `learning` series
  - `Today` resting state label
  - stats `Strong 99`, `Learning 63`, `Active words 162`, `Learning rate 11.6 words per day`, `Lifetime reviews 533`
- Captured Streak element:
  - `3 days`
- Captured Corpus element:
  - `Ranked words 1597`
  - `Examples 100%`
  - `Audio coverage 100%`

### Study setup and live review coverage

- Removed shots covered the study setup screen in light/dark and desktop/mobile variants.
- Visible study setup elements:
  - H1 `Ready to study?`
  - language chips `Spanish`, `French`, `German`, `Chinese`, `HSK 1`, `HSK 2`, `HSK 3`
  - session mode chips `Everyday`, `Review only`, `New only`
  - time mode chips `Timer`, `Stopwatch`
  - duration control with `15 min`, `1 MIN`, and `60 MIN`
  - `Start Study` button
- Removed live-session shots covered the active review screen and pause state.
- Captured live-session elements:
  - timer `14:58`
  - `41 cards left`
  - top-bar buttons `Pause` and `End`
  - top-bar controls `Auto` and `1×`
  - Chinese prompt card example `啊`
  - question `Do you think you know the pronunciation?`
  - answer buttons `← I don't know` and `I think I know →`
  - audio buttons `↑ Word` and `↓ Sentence`
- Captured pause-overlay elements:
  - `Session paused`
  - `Resume`
  - `Press P to resume`

### Words, library, and word-detail coverage

- `/words` and `/library` rendered the same vocabulary surface in the capture set.
- Visible vocabulary-page elements covered by removed shots:
  - H1 `Your vocabulary`
  - helper copy about filtering, sorting, and browsing studied words
  - top metrics `Studied words 162`, `Due now 100`, `Active languages 3`
  - language filters `All 162`, `HSK 1 102`, `HSK 2 47`, `HSK 3 13`
  - sort controls `Due date`, `Strength`, `A → Z`, `Most reviewed`
  - group controls `Status`, `Language`
  - sections `Review Now` and `Review Later`
- Row fields visible across removed shots:
  - word or character
  - language badge
  - part of speech
  - English gloss
  - learning/review state
  - lapse or clean status
  - due timing
  - strength percentage
  - repetition count
- Representative row examples captured across deleted shots:
  - `爱心`
  - `安排`
  - `安装`
  - `按`
  - `按照`
  - `把（介）`
  - `把（量）`
  - `把握`
  - `白（副）`
  - `白菜`
  - `班级`
  - HSK 1 rows such as `爱`, `爱好`, `爸爸`, `吧`, `北`, `北京`, `本`, `本子`, `比`, `别`
- The removed word-detail states covered:
  - `Play word`
  - `Play sentence`
  - `Back to words`
  - `See all words`
  - `Why it is here`
  - `Notes`
  - `Status`
  - `Next due`
  - `Sentences (3)`
  - `Study state`
  - `Introduced`
  - `Last reviewed`
  - `Rank`
  - related-word cards such as `安排` and `安装`

### Settings overlay coverage

- Removed settings shots were taken from the shared header gear across app surfaces.
- Visible settings-modal elements:
  - title `Settings`
  - `Daily new words` stepper with `−` and `+`
  - `Study languages` chip group
  - `Dashboard languages` chip group
  - `Chinese review flow` with `2 click` and `4 click`
  - helper text `Applies to Chinese and all HSK lists.`
  - `Preferred study mode` with `Everyday`, `Review only`, `New only`
  - `Theme palette` picker with:
    - `Original`
    - `Brume Menthe`
    - `Mint Sea Orange`
    - `Lime Forest`
    - `Violet Lime`
  - per-palette swatch rows and `Active` pill
  - bottom `Done` button
  - footer hint `Press Esc to close`

## Notes

- This summary is based on the original 466-shot capture plus a direct live DOM audit of the running app on `http://localhost:3000`.
- No preserved screenshots were produced for onboarding, `v2`, or a distinct `/review` surface beyond the study launcher/session flow already described here.
