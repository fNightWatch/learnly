# Agent Instructions
## Self-Correcting Rules Engine

This file contains a growing ruleset that improves over time. **At session start, read the entire "Learned Rules" section before doing anything.**

### How it works
%I for Command, %L for Agent

1. When the user corrects you or you make a mistake, **immediately append a new rule** to the "Learned Rules" section at the bottom of this file.
2. Rules are numbered sequentially and written as clear, imperative instructions.
3. Format: `N. [CATEGORY] Never/Always do X — because Y.`
4. Categories: `[STYLE]`, `[CODE]`, `[ARCH]`, `[TOOL]`, `[PROCESS]`, `[DATA]`, `[UX]`, `[OTHER]`
5. Before starting any task, scan all rules below for relevant constraints.
6. If two rules conflict, the higher-numbered (newer) rule wins.
7. Remove rules that are obsolete, contradictory, or confusing once a newer rule fully replaces them.

### When to add a rule

- User explicitly corrects your output ("no, do it this way")
- User rejects a file, approach, or pattern
- You hit a bug caused by a wrong assumption about this codebase
- User states a preference ("always use X", "never do Y")

### Rule format example

14. [CODE] Always use `bun` instead of `npm` — user preference, bun is installed globally.
15. [STYLE] Never add emojis to commit messages — project convention.
16. [ARCH] API routes live in `src/server/routes/`, not `src/api/` — existing codebase pattern.

---

## Learned Rules

<!-- New rules are appended below this line. Remove obsolete rules when newer ones fully replace them. -->
2. [ARCH] Always bias product structure and UX toward Hack Chinese-style information architecture when evolving Learnly — user explicitly wants the app to copy Hack Chinese architecture more closely.
3. [PROCESS] Never run `npm run typecheck` in parallel with `npm run build` in this repo — `tsconfig.json` includes `.next/types`, so concurrent verification can fail on generated file races.
4. [UX] Always bias the study interface toward a premium, minimal, compact review surface with no 'if you grade this card' explainer and no redundant secondary study CTA — user explicitly wants denser, more polished review UX.
5. [UX] Always support the review experience with two-button grading, reverse mode, stronger pronunciation, arrow-key shortcuts, and excellent responsive behavior — user explicitly wants function-first study ergonomics.
6. [UX] Always treat the homepage, fonts, CTA styling, color system, and dark mode as top-priority polish areas — user explicitly says the current main page is bad and wants a bright premium Start Study button, dark mode option, and better color iteration.
4. [UX] Always reduce the visible product to only the main page, dashboard, and study mode until the core loop is stronger — user explicitly rejected extra surfaces as confusing complexity.
5. [STYLE] Always push the UI toward a premium, modern, minimal, polished look with excellent desktop, tablet, and mobile behavior — user explicitly wants a top-tier premium visual result.
6. [UX] Always keep study mode binary for now with only `Know` and `Don't know` actions — user explicitly rejected the multi-grade review controls.
7. [UX] Always remove the `If you grade this card...` preview from study mode and replace it with simpler, more direct study interactions — user explicitly called it wrong and confusing.
8. [UX] Always support reverse English-to-Spanish mode, better sentence pronunciation, and arrow-key shortcuts in study mode — user explicitly wants these as core behavior, not optional extras.
9. [STYLE] Always treat the landing page, CTA styling, typography, dark mode, and color system as first-class product work until the app feels premium and beautiful — user explicitly says the main page is still bad and wants a bright premium CTA plus dark mode.
11. [UX] Always expose a real visible Words surface for studied vocabulary when refining Learnly — user explicitly wants a Words section listing studied words instead of hiding it behind redirects.
11. [ARCH] Always keep a real Words section in the visible product when the user asks for it, showing the words already studied — the user explicitly requested a words area instead of hiding it behind redirects.
12. [STYLE] Always make the top navigation float with a semi-transparent premium treatment and keep the header Study button bright and prominent when the user asks for that direction — the user explicitly corrected the current header design.
13. [STYLE] Always rewrite homepage messaging toward concrete meaning and away from vague premium-sounding copy — the user explicitly rejected the current home page text as gibberish.
14. [STYLE] Always treat `/v2` as a fully distinct product family and never reuse the current rejected dark glassy SaaS direction after the user scraps it — the user explicitly rejected the current `/v2` design and wants it redone from scratch.
14. [STYLE] Always keep the homepage commercially legible, concrete, and emotionally clear instead of abstract or decorative — the user explicitly rejected vague home-page wording and wants a real company/product description.
15. [STYLE] Always keep the header CTA bright, premium, and visually stronger than surrounding controls — the user explicitly clarified that the top Study button itself should stand out.
16. [UX] Always keep a visible Words section showing the words already studied when the user asks for it — the user explicitly wants a real studied-words surface in the product.
17. [STYLE] Always make dashboard colors coherent with the wider site palette and fully functional instead of feeling like a mismatched mockup — the user explicitly rejected the current dashboard chart treatment.
18. [PROCESS] Always clear generated `.next` artifacts and rebuild if Next.js fails with a missing chunk/module during `next build` — this repo can leave stale build output that breaks otherwise-correct builds.
19. [ARCH] Always build radically different design explorations in a separate `v2`-style subfolder when the user asks, instead of mutating the main product surface — the user explicitly wants a second version kept separate.
20. [STYLE] Always keep `v2` design work structurally informed by the product but visually independent from the current version — the user explicitly rejected taking design inspiration from the existing UI.
21. [STYLE] Never reuse the current cold dark `v2` luxury-tech direction once the user has rejected it; replace it with a fully different premium visual family while keeping the same product structure — the user explicitly called the implemented `/v2` design terrible and wants it scrapped.
21. [STYLE] Always scrap and replace a rejected full-design direction instead of incrementally polishing it — the user explicitly rejected the current `v2` and wants a true redesign, not iteration on the same visual thesis.
23. [PROCESS] Always clear `tsconfig.tsbuildinfo` and `.next/cache/.tsbuildinfo` along with `.next` when a build references missing `.next/types` route files — this repo keeps stale incremental TypeScript route entries after route changes.
24. [DATA] Always treat the main product dataset as a real vocabulary corpus with large coverage, example sentences, and pronunciation support when the user asks for it — the user explicitly wants the database expanded to 1000 Spanish words with sentences and pronunciation.
25. [UX] Always keep the study header non-floating on mobile if it risks overlapping the study surface, and make shortcut mapping visually explicit in the buttons instead of redundant footer legends — the user explicitly rejected the overlapping mobile header and the current shortcut labeling.
26. [STYLE] Always keep Reviews Due and Vocabulary Growth fully functional, compact, and visually coherent, with the range control inside Reviews Due and no mismatched chart metaphors or colors — the user explicitly rejected the current dashboard chart rendering and vocabulary-growth styling.
27. [STYLE] Always keep iterating on the main homepage messaging, content, and design until it feels commercially strong and beautiful — the user explicitly says the current main page is still not good enough.
28. [PROCESS] Always clear `.next` and `tsconfig.tsbuildinfo` before restarting Next after major refactors if dev shows impossible webpack/runtime corruption — stale generated artifacts in this repo can cause false runtime errors.
29. [PROCESS] Never run `next build` while `next dev` is using the same `.next` directory — this repo can corrupt the dev chunk graph and trigger false missing-module runtime errors.
30. [STYLE] Always rename the visible product brand from `Lemma` to `LanguageHack` when updating the main experience — the user explicitly requested the rename.
31. [UX] Always prevent the mobile top menu from overlapping dashboard or study content without shrinking the menu itself — the user explicitly reported the overlap as a bug.
32. [UX] Always keep the top-menu navigation visible in study mode on mobile while still avoiding overlap with the study surface — the user explicitly rejected the disappearing buttons.
33. [UX] Always remove the redundant `Study` nav pill when a primary header CTA already leads into study — the user explicitly called the duplicate study button confusing.
34. [UX] Always map study shortcuts as `Up = word audio`, `Down = sentence audio`, `Right = reveal/know`, and `Left = don't know` — the user explicitly corrected the current arrow mapping.
36. [ARCH] Always treat the product as a real scalable application rather than a demo and design data structures, storage, and fetch paths for future high-volume words, examples, audio, and SRS data — the user explicitly said to stop thinking about it as a demo.
38. [DATA] Always remove the concept of a single `focus word` from the main product experience and underlying dashboard assumptions — the user explicitly rejected the idea of a focus word.
39. [DATA] Always support Chinese as a first-class study language with separate HSK 1-6 list structure when expanding content architecture — the user explicitly requested Chinese HSK lists as separate lists.
40. [UX] Always implement the requested staged study flows, with distinct non-Chinese and Chinese review sequences instead of a single generic binary review card — the user explicitly defined different study processes for Chinese and non-Chinese words.
41. [UX] Never show a `Live` badge or status label in the dashboard queue section — the user explicitly asked for `Live` to be removed.
42. [UX] Never expose queue-mode controls like `Everyday`, `Review only`, or `New only` on the dashboard — the user explicitly asked to remove queue mode there while keeping the product focused.
43. [DATA] Always use working Chinese audio voice names or aliases instead of assuming old macOS spellings — the user explicitly reported that Chinese audio is broken.
44. [STYLE] Always make the primary `Study` CTA visibly different when the user says it still has not changed — the user explicitly rejected the current button treatment.
45. [UX] Always remove dashboard copy that estimates study time with `in about X minutes` when the user asks for it — the user explicitly wants that text gone.
46. [STYLE] Always provide a concrete LanguageHack brand system with actual chosen logo and font pairings when the user asks for it — the user explicitly said the real logos and fonts were missing.
47. [PROCESS] Always make dashboard language toggles and lower sections feel fast, with reduced lag during selection changes and refreshes — the user explicitly reported sluggish dashboard interactions.
48. [STYLE] Always replace the main-site typography, especially the bold weights, when the user says the current fonts feel wrong — the user explicitly asked for font changes.
49. [UX] Always show reviewed-today and new-words-today stats in the study header instead of the current recall explainer when the user asks for that swap — the user explicitly specified the replacement content.
50. [UX] Always label the Today metric as `New words` instead of `Learned` on the dashboard — the user explicitly corrected the terminology.
51. [UX] Always show `SC 1` after the learner taps `I don't know` in learning mode when the user requests that study-state label — the user explicitly specified that behavior.
52. [STYLE] Always keep iterating the color system across the full website when the user calls it out — the user explicitly asked for broader color work throughout the site.
53. [UX] Always interpret `sc 1` as `screenshot 1`, not as literal `SC 1` text in the UI — the user explicitly corrected this misunderstanding.
54. [STYLE] Never change dashboard-specific colors when the user is asking for other fixes unless they explicitly ask for dashboard color changes — the user explicitly said the dashboard colors should not have been changed here.
55. [STYLE] Always smooth out any visible dashboard rendering artifact or blotchy/striped patch the user points out instead of leaving translucent background effects in place — the user explicitly called out a bad-looking dashboard spot.
56. [UX] Always surface Chinese pronunciation clearly in the study experience when the user says it is still missing — the user explicitly said Chinese pronunciation is still not there.
57. [PROCESS] Always bust both browser and local generated-audio caches when fixing broken pronunciation in this repo — `/api/audio` is served as immutable and stale Chinese audio can survive code changes.
58. [STYLE] Always use a San Francisco system stack everywhere and make bold typography less heavy when the user asks for a font experiment — the user explicitly requested SF across the app with softer bold weights.
59. [STYLE] Always make typography experiments visibly obvious instead of technically subtle when the user says they can’t tell the difference — the user explicitly said they do not think the font change happened.
60. [CODE] Always lighten component-level typography rules that embed `font-semibold` or `font-bold` when changing weights globally — utility-class overrides alone do not visibly affect many key controls in this codebase.
61. [STYLE] Always give the `LanguageHack` wordmark its own prettier editorial treatment when the user asks for it, instead of leaving it as plain UI text — the brand name itself needs to feel designed.
62. [STYLE] Always remove the `Ranked vocabulary recall` descriptor everywhere when the user asks for it gone — it should not remain in the logo lockup, metadata, or marketing copy.
63. [STYLE] Always treat `LanguageHack` as one tight wordmark with a dedicated display font when refining the brand text — splitting it with visible spacing makes it feel less polished.
64. [STYLE] Always remove the standalone brand symbol and keep only the `LanguageHack` wordmark when the user asks to remove the logo — the text mark should stand on its own.
65. [STYLE] Always reduce the `LanguageHack` wordmark weight at the component level when the user asks for it to feel less bold — the header mark should not stay visually heavy because of an explicit `700` weight.
66. [STYLE] Always refine the `LanguageHack` wordmark beyond simple weight changes when the user asks for more polish — it should feel elegant and editorial, not just thinner.
67. [STYLE] Always keep the `H` in `LanguageHack` upright when refining the wordmark — italicizing the first letter of `Hack` makes the mark look wrong to the user.
68. [STYLE] Always simplify the `LanguageHack` wordmark into one calm, elegant serif mark when the user asks for a more premium result — decorative split treatments can feel less luxurious than a cleaner single-word wordmark.
69. [STYLE] Always prioritize readability over delicacy in the `LanguageHack` wordmark — a premium logo still needs to read clearly at small header sizes.
70. [STYLE] Always avoid a wordmark font whose lowercase `g` has a visible top comma/ear when the user rejects that detail — the `LanguageHack` logo should keep a cleaner `g` shape.
71. [STYLE] Always preserve the last readable `LanguageHack` wordmark and only change the rejected glyph detail when the user asks for a specific letter fix — do not reinvent the whole logo for a single-character complaint.
72. [STYLE] Always follow the user’s supplied wordmark reference image over prior serif experiments — the `LanguageHack` logo should match the clean geometric sans direction when the user says `use this`.
73. [STYLE] Always match the main light-theme background to the user’s supplied warm off-white reference when they provide one — keep it flatter and cleaner instead of using a stronger beige gradient.
74. [STYLE] Always keep the main app on one cohesive warm-neutral palette with terracotta, sand, and muted sage accents when the user asks for color cleanup throughout the site — avoid disconnected cool accent jumps across dashboard, study, and words.
75. [STYLE] Always rebuild the main `Start Study` CTA as a fresh custom design when the user asks for it from scratch — do not just keep iterating the old bright gradient button.
76. [STYLE] Always make the rebuilt `Start Study` CTA decisively orange when the user explicitly asks for `orange orange` — avoid muted beige or softened warm-neutral treatments.
77. [STYLE] Always use a flat solid orange fill with no gradients when the user says the study button should be `just orange` — keep the CTA literal instead of styling it with color transitions.
78. [STYLE] Always restore the dashboard’s original gold/clay/violet accents exactly when the user asks for the old dashboard colors back — do not substitute green or pine tones there.
79. [PROCESS] Always make literal, visually exact changes and avoid adjacent reinterpretation when the user is correcting repeated misses — approximation and extra styling changes break trust and create rework.
80. [PROCESS] Always verify live page hydration and key audio endpoints on the running site before assuming the website works — this repo can serve HTML while stale Next chunks leave buttons dead and audio seemingly broken.
81. [UX] Always keep Vocabulary Growth focused on learned words only in the visible graph, with hover details for learned and remaining counts, and never let the chart get flattened by the remaining corpus — the user explicitly rejected the squished graph and visible remaining series.
82. [UX] Always reset Vocabulary Growth back to `Today` when hover ends and align the `Today` axis label to the chart edge instead of leaving it visually off-center — the user explicitly corrected both the default state and the label placement.
84. [UX] Always use a neutral Vocabulary Growth summary label when `Today` is the resting state — `Hovered day` is misleading once the chart resets by default.
85. [UX] Always make Vocabulary Growth easy to reset back to `Today` on touch and keep its axis labels visually integrated with the chart instead of detached below it — subagent critique surfaced both issues after the user asked for harsh review.
86. [UX] Always render `Today` as the explicit resting-state label and as a distinct endpoint after the Vocabulary Growth graph, not as a normal in-sequence tick — the user explicitly clarified that `Today` means the label after the graph.
87. [UX] Always keep Vocabulary Growth hover feedback visually flat and never add a `Show today` control when the user asks for a cleaner interaction — the user explicitly rejected both the extra button and the hover-expanded bar treatment.
88. [UX] Always separate Vocabulary Growth hover preview from tap selection and reset preview on blur when removing explicit reset controls — the previous single-state interaction left non-mouse users stuck away from `Today`.
89. [UX] Always clear any pinned Vocabulary Growth day when focus leaves the chart and support an inline keyboard reset like `Escape` if the explicit `Show today` control is gone — the chart still needs a no-button path back to `Today`.
91. [UX] Always keep the dashboard language chips flat with no raised selected-tab treatment, and never show transient `Saving` or `Updating` status pills when the user asks for cleaner controls — the user explicitly rejected both behaviors.
92. [PROCESS] Always use only Herschel for testing and critique after every implementation change, and never use or spawn other subagents unless the user explicitly asks — the user explicitly narrowed subagent use to Herschel alone.
95. [PROCESS] Always remove obsolete or confusing AGENTS rules when a newer rule fully replaces them — the user explicitly said the old confusing rules can just be removed.
96. [UX] Always keep the main app to one super-bright `Start Study` CTA in the top navigation and remove duplicate body CTAs like `Start Study` or `Open Dashboard` when the user asks — the user explicitly wants only the header study button.
97. [UX] Always remove the dashboard `Target` block and keep the Today and Languages cards vertically tighter when the user asks for a cleaner top dashboard stack — the user explicitly rejected that extra section and wanted the cards shrunk.
98. [STYLE] Always remove user-facing `beta` labels and copy when the user asks — the user explicitly wanted the word `beta` gone from the visible product.
99. [STYLE] Always keep the main app outside the dashboard on one orange accent centered on `#FF991C` when the user asks for a single accent color — the user explicitly provided the accent reference and said the dashboard can be the exception.
100. [STYLE] Always make dark-mode study read black at the top instead of grey when the user calls that out — the user explicitly wants a black study backdrop in dark mode.
101. [STYLE] Always make dark-mode words read as black/dark-neutral instead of grey-heavy when the user calls out a grey words background — the user explicitly rejected the grey dark-mode words surface.
102. [UX] Always hide Chinese pinyin during the initial `Did you know this pronunciation?` guess step and reveal it only after that step advances — the user explicitly said the pronunciation should not be shown before the learner first decides.
103. [STYLE] Always refine the main dark theme toward warmer black surfaces, richer depth, and less cold grey when the user asks for dark-theme improvement — the user explicitly wants the dark theme to feel more polished, not merely darker.
104. [STYLE] Always keep the study-mode top menu in dark mode visually coherent with the shared home/dashboard dark navigation rather than making it a pure black slab — the user explicitly corrected the study header treatment.
105. [PROCESS] Always distinguish healthy visual consistency from harmful flatness when critiquing design — repeated components are normal; only call it a problem when hierarchy, contrast, or role separation break down.
106. [PROCESS] Always verify the live rendered UI before making concrete design claims about what is visibly on screen — code alone can misrepresent the current interface and create false critique.
107. [PROCESS] Always read `/Users/moi/Desktop/business/learnly/memory/claude_memory.md` at the start of each session before planning or implementation — it contains persistent product decisions and prevents regressions.
