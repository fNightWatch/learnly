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
108. [STYLE] Always keep the header moon icon as a clean crescent with no decorative top dot/star when refining the theme toggle — the user explicitly rejected the extra dot detail.
109. [UX] Always switch the study recovery area to a compact side-audio layout only on short overflowing viewports: keep the helper text on one line, make `I'm done studying it` smaller/narrower, and stack `Word` above `Sentence` on the right — the user explicitly requested this adaptive behavior for low-height screens.
110. [UX] Always trigger compact study-recovery layout from real sentence-card fit checks (sentence hidden/covered or outline clipped), not just viewport height, and keep `Auto` + speed pills right-aligned in study mode — the user explicitly corrected both behaviors.
111. [UX] Always debounce and hysteresis-guard adaptive study-layout switching during resize so it flips once at the overlap breakpoint instead of lagging and oscillating repeatedly — the user explicitly reported heavy resize lag and repeated switching.
112. [UX] Always latch compact study recovery once overlap is detected and only release it after clear height recovery with safe spacing, so drag-resize cannot thrash between layouts near the breakpoint — the user explicitly said it should switch at one point, not many times.
113. [STYLE] Always style dashboard summary cards with clean premium hierarchy and refined surfaces (no bulky or cheap-looking blocks) when the user flags them as ugly — the user explicitly requested a modern professional redesign.
114. [STYLE] Always set text on newly implemented filled UI surfaces to white in light mode and black in dark mode when the user asks for that contrast behavior — the user explicitly corrected the filled-surface text behavior.
115. [CODE] Always use valid Tailwind opacity tokens (or bracket opacity syntax) for text colors on filled surfaces — invalid classes silently fall back and can break light/dark contrast.
116. [STYLE] Always carry the refined `Reviewed/New words` premium card style across the rest of dashboard modules when requested, so Languages, Reviews Due, Vocabulary Growth, Streak, and Corpus look like one cohesive visual system.
117. [UX] Always include an `All` selector in the dashboard language filters when requested and ensure it activates every available language in one action.
118. [CODE] Always keep dashboard filter error state wired (`saveError` + setter) whenever language filtering logic is edited — dropping the setter causes runtime crashes during language toggles.
119. [STYLE] Always keep the study completion statistics palette blue and compact when refining that screen — the user explicitly asked to preserve the blue color and reduce the space used by the `cards reviewed this session` block.
120. [STYLE] Always keep `Cards reviewed this session` as a single-card metric and never show a `Completed` status pill on the study completion screen when the user asks for a cleaner layout.
121. [STYLE] Always treat fully filled UI elements as strict contrast surfaces: white text in light theme and black text in dark theme — the user explicitly emphasized this must be memorized and never forgotten.
122. [STYLE] Always use explicit `text-white dark:text-black` on fully filled surfaces instead of tinted opacity variants when strict filled-surface contrast is required — opacity shorthand caused visible regressions.
123. [STYLE] Always enforce filled-surface contrast with a theme-aware fallback class when utility styles can regress (`.complete-filled`: white in light, black in dark) — the user reported repeated misses and this prevents ambiguity.
124. [STYLE] Always theme-flip outlines/borders on filled completion chips too (light: white-tinted borders, dark: black-tinted borders) — the user explicitly flagged that text was fixed but outlines were still wrong.
125. [UX] Always remove duplicate baseline dividers in Vocabulary Growth when the user flags extra lines near the x-axis labels — keep only necessary grid structure and avoid stacked separators.
126. [UX] Always remove both separators around Vocabulary Growth x-axis labels when user flags extra lines (the near-label guide line and the pre-stats divider) — partial cleanup still looked wrong.
127. [UX] Always preserve the normal Vocabulary Growth divider rhythm and remove only the single out-of-place separator the user points out — user explicitly said not to remove all lines.
128. [UX] Always honor ordinal divider removals exactly when specified (e.g., `1st from bottom` and `3rd from bottom`) in Vocabulary Growth instead of broad line cleanup.
129. [STYLE] Always keep requested completion-screen polish strictly visual-only with no functionality changes when the user explicitly asks for styling improvements only.
129. [PROCESS] Always back UI/UX reviews with many screenshots across key pages, states, and breakpoints when the user asks for a serious audit — sparse capture leads to shallow critique.
130. [PROCESS] Always make design reviews specific, user-cost-driven, and improvement-oriented instead of generic aesthetic commentary when the user asks for a no-BS review.
131. [STYLE] Always remove bright/white outlines from dark-theme completion stats surfaces when the user flags them — completion cards should keep a darker integrated edge in dark mode.
132. [UX] Always keep the completion screen to a single `New session` CTA and persist completion stats through refresh until a new session starts — the user explicitly requested this flow.
133. [UX] Always shift study content upward in low-height compact recovery mode (while keeping the left `I'm done studying it` + right stacked `Word/Sentence` layout) and increase the `I'm done studying it` label size — the user explicitly corrected short-height fitting behavior.
134. [STYLE] Always remove the completion subtitle copy when the user asks and keep only the main success heading — the user explicitly rejected `Your session stats at a glance.`
135. [UX] Always place `New session` at the top of completion and remove `Great focus session!` when requested, and keep study content visually centered across different viewport heights with compact-mode upward balancing only when needed.
136. [STYLE] Always use study blue `rgb(81, 169, 236)` for blue-filled controls in study mode when the user specifies this exact value.
137. [UX] Always center study prompt-stage content and action controls as one balanced block across viewport heights and never leave a huge empty vertical gap between the word area and answer buttons.
138. [UX] Always keep study action buttons pinned to the bottom; only recenter the content area itself when tuning height responsiveness.
139. [UX] Always place completion `New session` in the top header CTA slot (where `Start Study` appears on other pages), not as an in-card button.
140. [UX] Always keep the stage question (`Do you think you know it?` etc.) directly above the bottom answer buttons, not up in the centered content area, while keeping the core word/content centered.
141. [UX] Always use true vertical centering (`justify-center` in the content container) for prompt-stage study content so the word block sits in the middle of available height and does not drift toward the top.
142. [UX] Always make study top-bar `Auto` direction and speed (`x`) controls reveal their full option sets on hover, while keeping click-toggle behavior as fallback.
143. [UX] Always vertically center the study content block in normal mode across both prompt and answer states; only disable that centering when compact overflow layout is active.
144. [UX] Always anchor study answer/recovery content close to the bottom action dock in non-compact mode to eliminate large dead gaps; reserve true vertical centering for prompt-stage content.
145. [STYLE] Always set completion-screen dark-mode blue surfaces (stats cards and recovery CTA) to exact `rgb(81, 169, 236)` and keep `Still due by language` chips light enough for readable text when the user requests this color correction.
146. [UX] Always give the main study prompt/character line enough top padding and line-height so tall CJK glyphs never clip at the top in short-height layouts.
147. [UX] Always keep non-compact study content truly centered even during recovery states; anchoring recovery content to the action dock creates a visibly top-heavy layout.
148. [STYLE] Always enforce the filled-surface text rule on pause-overlay CTA buttons too (`Resume` included): white text in light theme and black text in dark theme.
149. [STYLE] Always enforce the filled-surface text rule on the settings overlay `Done` CTA as well (white in light, black in dark); it is a filled orange button and must not stay white in dark mode.
150. [STYLE] Always remove redundant outer dashboard card shells when modules already have a refined inner panel; avoid square-in-square framing unless explicitly requested.
151. [UX] Always show translation-reveal helper text as `tap or press shift` so the Shift keyboard shortcut is explicitly discoverable in-study.
152. [STYLE] Always raise dark-mode contrast on dashboard mini stat cards (`Reviewed`/`New words`) with lighter panel fills and stronger label/value text when readability is flagged.
153. [STYLE] Always remove neon-like blue shadow bleed on dark completion/dashboard stat surfaces; use cleaner low-glow shadows and higher panel/chip contrast when dark mode looks muddy.
154. [STYLE] Always keep the dashboard `Today` card free of visible light-mode drop-shadow bleed when the user flags leftover shadow around it — the blue hero card should sit cleanly on the page in light theme.
155. [STYLE] Always keep the home-page decorative orbs in the same orange accent family as the main CTA when the user asks for accent-color consistency — avoid drifting back to yellower gold tones.
156. [STYLE] Always keep a user-selectable multi-palette theme picker in Settings (classic + user-provided fun palettes) using the four semantic brand slots (`accent`, `blue`, `darker blue`, `coral`) — the user explicitly asked to add 5 theme variants from provided references.
157. [STYLE] Always bind study/session blues and dashboard blue surfaces to semantic palette tokens (`--color-pine` / `--color-gold`) rather than hardcoded RGB/hex values so theme switching updates them everywhere.
158. [STYLE] Always avoid glossy/diagonal highlight effects on blue study-stat and dashboard cards unless explicitly requested, and use existing palette colors with contrast-safe mapping instead of inventing new tones.
159. [STYLE] Always preserve the established Classic theme look when adding palette support; theme plumbing must not visually restyle Classic beyond bug fixes the user explicitly asks for.
160. [STYLE] Always run a contrast/readability pass across all four non-classic palettes and remap which semantic color slot each filled surface uses when needed, so every theme remains legible in both light and dark modes.
161. [UX] Always keep Reviews Due uncapped by the session soft cap and scale chart axes/labels responsively so top values never collide with surrounding text.
162. [UX] Always provide a Chinese study-flow setting with `2 click` and `4 click` modes, and apply it uniformly to all Chinese cards including HSK lists — the user explicitly requested flow control parity for Chinese and HSK.
163. [PROCESS] Always turn oversized screenshot dumps into a curated top set plus an accurate written UI inventory when the user asks for screenshot coverage cleanup — the user explicitly prefers 10 key screenshots over hundreds of raw captures.
164. [STYLE] Always keep each non-classic theme self-contained to its own 4-color set and never cross-remap semantic slots with ad-hoc extra tones that make themes feel mixed — the user explicitly flagged palette mixing.
165. [UX] Always keep the positive study actions (`I think I know`, `I know`, `Yes`) in the orange/accent lane while keeping negative actions (`I don't know`, `No`) in the blue lane, matching the original decision-color semantics.
166. [STYLE] Never alter the user-provided palette color values for custom themes; only assign existing palette slots to UI roles — the user explicitly said palette colors must not be changed.
167. [UX] Always remove auxiliary helper copy under the Chinese flow setting when the user asks for a cleaner Settings panel — the line `Applies to Chinese and all HSK lists.` should stay removed.
168. [UX] Always structure Settings as a menu with dedicated subpages per setting area, and keep dashboard language selection exclusively inside Dashboard (persisted from Dashboard interactions, not editable in Settings) — the user explicitly requested subpage navigation and no dashboard-language control in Settings.
169. [UX] Always make `New session` from completion open a fresh study setup state (`/study?new`) instead of leaving the user on completion or resuming old state — the user explicitly reported this as a bug.
170. [STYLE] Always use the exact coral `#F56762` for the study `End` button and the under-1-minute timer warning state when the user requests that warning color — the user explicitly provided this hex as the target.
171. [UX] Always persist and restore auto-direction state across study-page refresh so the current card does not flip between target/English unexpectedly in Auto mode — the user explicitly reported this refresh-switch bug.
172. [UX] Always restore Auto-mode refresh state using both the persisted card item id and the persisted effective direction so refresh cannot stitch the same card from Chinese prompt into English prompt (or vice versa) mid-session.
173. [UX] Always keep Reviews Due value labels anchored above their individual bar indicators, never moved into a fixed top lane — the user explicitly rejected top-row labels.
174. [STYLE] Always keep the dashboard `Today` mini stat cards (`Reviewed` and `New words`) white in light mode when the user asks for parity with other sections — avoid translucent blue tint in those two cards.
175. [STYLE] Always style dashboard `Today` mini stat cards (`Reviewed` and `New words`) with the same panel surface treatment as `Languages` so they look like one coherent module family.
176. [STYLE] Always use the same bright blue tone on the dashboard `Today` hero card in light mode that the user approves in dark mode when they request that exact parity.
177. [STYLE] Always polish the dashboard `Streak` module to look finished (refined inner panel, clear dot contrast, deliberate hierarchy) when the user flags it as unfinished.
178. [STYLE] Always keep dashboard utility stat rows like `Active words / Learning rate / Lifetime reviews` compact and space-efficient — avoid tall oversized cards for these secondary metrics.
179. [UX] Always remove duplicate language copy in the dashboard Languages card — `Study languages` should stay hidden because `Languages` + `Choose what to show today` already communicate it.
180. [UX] Always make the dashboard `All` language chip a true toggle: when all languages are already selected, pressing `All` must deselect everything.
175. [PROCESS] Always prioritize review depth on `home`, `dashboard`, and `study` over `words` when the user says `words` is not important — spend critique budget on the core loop first.
154. [CODE] Always validate macOS 26 SwiftUI APIs directly against the local SDK interfaces before wiring them into shared view code — some transitions and toolbar modifiers are platform-limited and can fail first compile on macOS.
155. [CODE] Never call a public repository method that does `queue.sync` from inside another `queue.sync` block in the same repository — it deadlocks/crashes (`dispatch_sync called on queue already owned`) and makes the macOS app fail to launch.

181. [PROCESS] Never take any new UI screenshots unless the user explicitly asks for them in that moment — the user said to stop screenshots until they request them again.
182. [CODE] Always guard empty dashboard/study language arrays before passing them into Drizzle `inArray` queries — empty selections are valid UI states and must return empty results instead of crashing.
183. [STYLE] Always prioritize strict text readability on macOS app surfaces (label/secondaryLabel contrast, larger small-copy sizes, less murky glass overlays) before decorative glass intensity — the user explicitly said the app is unusable when text cannot be read.
184. [UX] Never render a separate left-side Reviews Due scale number when bar value labels are already visible — it duplicates the Today value and confuses the chart.
185. [DATA] Always treat learner progress as protected append-only user data with backups, DB-level delete blockers, and count-regression checks — settings/filter changes may hide progress but must never delete it silently.
185. [STYLE] Always keep Liquid Glass present but restrained in the macOS app — preserve glass for hierarchy/controls, never so much that readability or usability degrades.

186. [STYLE] Always target very high visual resemblance between the macOS app and the main website UI (layout hierarchy, spacing, typography, and control styling) when refining the native shell — the user explicitly wants the app to look much closer to the site.
187. [UX] Always keep a visible top header/navigation in the macOS app on every section (including Study) and wire arrow-key shortcuts through a reliable system-level fallback (`onMoveCommand`) — the user explicitly rejected missing top bar/nav and non-working shortcuts.
188. [UX] Always drive the Study timer with an explicit per-second UI tick in SwiftUI (`Timer`/`TimelineView`) so elapsed time visibly updates without requiring other state changes — the user explicitly reported that study time was not running.
189. [STYLE] Always map macOS app colors directly to the same canonical web tokens from `src/app/globals.css` (paper/panel/line/accent/blue/gold + dark equivalents) and keep Study `End` on `#F56762` — the user explicitly rejected color drift from the main app.
190. [STYLE] Always keep the macOS app backdrop visually flat and web-faithful (no decorative blobs or extra glass haze), matching the main site background gradient stops and tone per section — the user explicitly said the current background looks ugly and unlike the site.
191. [PROCESS] Always keep study actions non-blocking by avoiding heavy per-card recomputation/refresh and by offloading review submission work away from the immediate UI interaction path — the user explicitly reported very slow responsiveness.
192. [STYLE] Always map macOS Study blue controls to the same web role tokens as the site (`cards left`, settings, pause, negative decision lane = `--color-gold` / `#51A9EC`) and avoid role drift to darker blues unless the web uses them — the user explicitly said colors still do not match.
193. [UX] Always back any visible `7/30 days` dashboard range switch with real 30-day source series (not a 7-day series) so toggling changes the chart output immediately — the user explicitly reported the switch as non-working.
194. [CODE] Always define completion-screen class helper constants in local scope before JSX usage and run typecheck after refactors — missing helper bindings (like `dueChipClass`) crash study completion at runtime.
195. [STYLE] Always style `Still due by language` as clean, evenly spaced language tiles (no cluttered nested-pill feel) when refining completion UI — the user explicitly asked to improve language separation aesthetics.
196. [UX] Always auto-play Chinese word audio on the first decision click in `2-click` mode for `Target→English` too (not only `English→Target`) so decision-step pronunciation behavior stays direction-consistent.
197. [STYLE] Always keep `Still due by language` dark-mode chips subdued and refined (not frosty/over-bright) so the section remains premium and coherent on the blue surface.
196. [STYLE] Always match web-level micro-contrast exactly by reducing soft/muddy shadows and aligning subtle panel/control color deltas to the main site tokens — the user explicitly said the macOS design still feels sluggish vs the modern website.
197. [UX] Always implement real responsive breakpoints for macOS layout across width and height (not just font scaling), including stacked/fallback arrangements for header, study controls, and words split content when the window is narrow or short — the user explicitly said the app is not adaptive while the site is.
198. [STYLE] Always keep the primary `Start Study` CTA physically thick and prominent (larger vertical padding/min-height) when the user says it looks thin — the top action must feel substantial, not lightweight.
199. [UX] Always remove global focus-ring outlines from the Study surface and keep top-right menu chevrons stylistically neutral (no random blue indicator tint) when the user flags blue artifacts — these markers read as broken UI, not intentional hierarchy.
200. [UX] Always render a full study statistics panel on completion (cards reviewed, time studied, reviewed today, new words today, streak, retention, and still due by language) with web-parity blue card styling when the user asks for that reference layout.
201. [STYLE] Always keep Study palette role-consistent with the approved reference: one shared light-blue lane for all blue controls (`cards left`, gear, pause, negative action), orange for positive action, and coral warning color for the timer under 1 minute.
202. [STYLE] Always keep dashboard and chip surfaces near-shadowless in light mode when the user asks for cleaner visuals — heavy drop shadows make the app look cheap versus the website.
203. [DATA] Always compute dashboard `Learning rate` from real introduced-word history over elapsed days in the active language scope, never from `newAvailableCount` heuristics — inflated placeholder math does not match reality.
204. [STYLE] Always style the macOS Settings modal as a clean premium control panel (sectioned cards + refined chips/segments) and never leave raw default steppers/checkbox rows as the primary visual language when the user flags it as ugly.
205. [STYLE] Always keep Study pause state visually minimal and modern (soft scrim + compact status banner) and avoid tiny centered modal cards with duplicate Resume CTA when the user flags pause UI as ugly.
206. [UX] Always use clear plain-English labels for Study recovery actions and avoid ambiguous phrasing like `Still studying` when the user flags confusion — recovery secondary action should read as explicit extra-time intent.
207. [STYLE] Always keep Words sidebar on a single-layer surface and avoid native `List` backgrounds/selection blocks that create extra white boxy containers when the user flags that artifact.
208. [PROCESS] Always verify real HTTP responsiveness (`curl` 200) on the target route before saying the app is running — the Next dev process can listen on port 3000 while first-request compilation still makes the app appear down.
209. [UX] Always keep the homepage in dark mode only (no light variant and no theme toggle on that page) when the user requests it — home should render and stay dark regardless of saved global theme.
210. [STYLE] Always keep homepage spheres strictly in the background (never foreground overlap on top of the glass card) and increase edge-sphere density for large fullscreen layouts when the user asks for more visual fullness.
211. [UX] Always keep secondary dashboard utility stats (`Active words`, `Learning rate`, `Lifetime reviews`) in a compact one-row strip rather than tall stacked cards when the user asks for major space reduction without data loss.
208. [UX] Always open the Study setup page first when the user presses `Start Study` (with languages, session mode, time mode, and timer controls), never auto-start the session from that CTA.
209. [STYLE] Always render a single-row wide top bar (logo left, centered Dashboard/Words capsule, settings+theme icons, strong Start Study CTA right) when viewport width allows, and fall back only on narrower widths.
210. [UX] Always hard-freeze the Study timer while paused and fully reset timer/session clock state on `End` (including `sessionStartAt`), so time can never keep advancing after pause or session termination.
211. [UX] Always hide sentence translations behind an interactive tape in Study answer states and reveal them only via tap or `Shift` — the user explicitly requested this parity behavior.
212. [STYLE] Always render black text in dark mode for every fully filled button in the macOS app (including study controls, decision CTAs, and filled range toggles) — the user explicitly corrected this again.
213. [UX] Always hide the top-header `Start Study` CTA whenever the user is already in the `Study` section, since setup/session/completion are separate study modes and the cross-mode CTA is redundant there.
214. [STYLE] Always keep Study pause UI as a discreet top status banner with light scrim (not a large centered white pill/modal), because the user explicitly rejected the current paused look as ugly.
215. [STYLE] Always keep the Study setup screen close to web quality with a full-width primary `Start Study` CTA, restrained segment styling, and polished language chips — tiny CTA pills and heavy dark segment bars are explicitly rejected as ugly.
216. [UX] Always run Study `Timer` mode as a countdown from the selected minutes to `00:00` and only auto-complete after the learner submits the current card when time is up — never interrupt mid-card.
217. [STYLE] Always keep numeric count pills in `Still due by language` light and refined (never dark/heavy ovals) so they look premium instead of cheap — the user explicitly rejected dark outlined number badges.
218. [STYLE] Always treat Streak as a high-importance hero module with larger visual scale, stronger hierarchy, and a more expressive badge rhythm when the user says it feels underwhelming.
219. [UX] Always make the entire visible button/pill outline area fully clickable (not just the text glyphs) by defining explicit hit shapes on custom SwiftUI controls — the user explicitly reported text-only click behavior as broken responsiveness.
220. [STYLE] Always keep the dashboard Today card focused on one oversized due number and remove redundant `DUE` badges when the user asks for stronger metric emphasis.
221. [STYLE] Always render Study setup language chips as clean separated pills with intrinsic width and consistent gaps (no stretched merged segments or seam artifacts) — the user explicitly rejected the current connected/oval seam look.
222. [STYLE] Always keep homepage orb density significantly lower on mobile than desktop — the user explicitly rejected an overcrowded mobile background.
223. [UX] Always show the full completion statistics panel after ending a study session (cards reviewed, time studied, reviewed today, new words today, streak, retention, due by language) instead of jumping straight back to setup — the user explicitly said post-session stats were missing.
224. [STYLE] Always keep a subtle center-area orb presence in homepage layouts while preserving low mobile clutter — the user explicitly rejected center-empty orientations.
225. [STYLE] Always keep dark-mode `Still due by language` surfaces premium and restrained (flatter chips, less glossy/plastic glow) while preserving the approved light-mode look.
225. [STYLE] Always keep the header `Start Study` CTA compact (not full-width) whenever horizontal space is available, even in short-height windows — the user explicitly said the stretched button is too large.
226. [STYLE] Always remove the `DUE` badge from the dashboard `Today` hero card when the user asks to remove it and keep the card focused on the main due count only.
227. [STYLE] Always render selected dashboard language chips in a clearly visible orange active state (including `All` when all are selected) so selection is obvious at a glance.
228. [STYLE] Never show a decorative settings icon/button inside the Settings modal header itself — the user explicitly called it redundant and confusing.
229. [STYLE] Always style the dashboard streak module with a gamified Duolingo-like vibe (prominent flame cue, clearer streak emphasis, and more expressive recent-days tracker) when the user asks for that direction.
230. [UX] Always keep a real `system` theme mode reachable from the macOS theme toggle so app appearance follows device theme changes when the user requests it — manual `light/dark` must never lock out auto-follow.
231. [UX] Always make each `Vocabulary Growth` bar reveal that exact day's stats on hover using a polished in-chart presentation (date + strong/learning/total), not a generic static summary — the user explicitly requested per-day hover details.
232. [UX] Always make active state in macOS top navigation tabs and Words selection unmistakable with explicit contrast fill/stroke (not subtle shadows) — the user explicitly said current tab/word selection is barely visible and looks bad.
233. [PROCESS] Never take any new screenshots after the user says `Stop taking screenshots` until they explicitly re-enable screenshot capture — continue parity work via code/behavior fixes only.
233. [UX] Always keep the dashboard top area compact in desktop by structuring one row as: `Today` hero, stacked `Reviewed/New` mini cards, and a tighter `Languages` panel with reduced internal whitespace.
234. [UX] Always render Reviews Due x-axis as numeric day offsets (`1d`, `2d`, ...), not weekday names, and show sparse ticks (every 3rd plus first/last) for readability.
235. [UX] Always edge-safe the first and last Reviews Due value labels with horizontal insets so 3-digit counts (like `129`) never clip at chart boundaries.
236. [UX] Always keep `Corpus` stats in one compact horizontal row (not tall stacked cards) so the dashboard preserves vertical density without losing data.
237. [UX] Always start Study immediately on `Start Study` click and never block phase transition on settings persistence requests — save preferences in the background to avoid a delayed session start.
238. [UX] Always keep the dashboard top strip in a single row (Today + stacked Reviewed/New + Languages) at desktop/tablet widths, and never let Languages drop to a second line unless in narrow mobile layout.
239. [UX] Always keep the dashboard top strip vertically compact (Today + Reviewed/New + Languages) with tight paddings and reduced card heights; avoid tall hero/minicard blocks that waste space.
240. [STYLE] Never make the main floating top bar overly transparent; keep it visually solid/readable with stronger glass opacity so underlying content does not bleed through.
241. [UX] Always keep the streak module compact and dense (summary + weekly grid) and avoid tall stacked streak slabs that waste dashboard space.
242. [UX] Always keep the dashboard top strip compact on narrow/mobile widths by avoiding full-width stacked `Today`, `Reviewed`, `New words`, and `Languages` blocks with large empty areas — use tighter heights and denser responsive grouping.
243. [STYLE] Always keep the homepage marketing surface box-free when asked (no outer glass shell and no nested stat/pitch cards), so the background impact remains visible and not muted by containers.
244. [UX] Always keep the dashboard top strip on one horizontal row at desktop widths with `Today` + stacked `Reviewed/New` + `Languages`, and reduce card heights/padding to avoid obvious wasted space.
245. [PROCESS] Always make the macOS v1 sync script merge `sync/macos-v1` into `main` by default, with opt-out only via explicit flag, so the repo update flow matches the user’s expected one-command behavior.
246. [PROCESS] Always verify iOS startup with an actual simulator console launch (not just `simctl launch` success) after project/resource changes, because the app can still `quit unexpectedly` from missing bundled assets like `learnly-seed.db`.
247. [UX] Always render the iPhone iOS shell edge-to-edge (no outer card-like frame, no extra root-side padding, no inset app canvas) unless the user explicitly asks for a framed/windowed layout.
248. [UX] Always use a mobile-native navigation pattern on iPhone (bottom liquid-glass tab bar) and remove the desktop-style top header shell there — the user explicitly said top bar is wrong for phone.
249. [UX] Always disable keyboard-shortcut UX affordances on phone (shortcut labels/hints/bridges) and keep touch-first controls only — the user explicitly said shortcuts should not be part of the mobile experience.
250. [UX] Always keep mobile theme control only inside Settings (not top/bottom bars) and default to `System` auto-follow behavior so changing device theme updates the app appearance automatically.
247. [UX] Always place the dashboard `Streak` section immediately after the top `Today` / mini-stats / `Languages` row when the user asks for that ordering — the user explicitly corrected its placement.
248. [UX] Always place the dashboard `Streak` section immediately after `Reviews Due` when the user asks for that ordering — the user explicitly corrected its placement again.
249. [STYLE] Never redesign the dashboard streak tracker into a multi-card weekly-block treatment when the user rejects it — keep the dashboard streak presentation simpler and less overworked.
250. [STYLE] Always make selected segmented toggles use the light blue filled state instead of black when the user asks for that treatment on setup/dashboard controls.
251. [STYLE] Always make requested palette-sheet images feel polished and designed, not like raw utilitarian swatch dumps — the user explicitly rejected the plain first pass.
252. [STYLE] Always make palette explorations clearly sorted, genuinely varied in hue/value, and chosen relative to the existing anchor colors — the user explicitly rejected same-ish unsorted greens that did not harmonize with the orange and blue.
253. [STYLE] Always use the user’s supplied experimental bright green for study buttons labeled `Yes` and `I think I know` when they ask for that experiment — do not automatically apply it to other positive buttons like `I know`.
254. [STYLE] Always use the same experimental bright green `#48C53F` for `strong` in Vocabulary Growth when the user asks to make strong words green — keep the change scoped to that module unless they ask for broader rollout.
255. [STYLE] Always revert the experimental green `strong` color in Vocabulary Growth immediately when the user asks to revert it — restore the prior chart color instead of keeping the experiment around.
256. [STYLE] Always revert the experimental green from `I think I know` immediately when the user asks, while leaving `Yes` unchanged unless they explicitly ask for that too.
257. [PROCESS] Always free port `3000` and run the main Next dev server there when the user says to use `3000` — the user explicitly corrected a fallback run on another port.
258. [STYLE] Always make the study `Yes` button orange when the user asks for it instead of leaving the old experimental green — the user explicitly corrected the button color.
259. [STYLE] Always match the study completion statistics shell background to the top bar surface when the user flags a mismatch — the completion panel backdrop should use the same base color treatment as the study header.
260. [STYLE] Always render chosen `Languages` chips as clearly orange filled pills when the user asks for that state — selected language filters should not stay pale or ambiguous.
261. [STYLE] Always render chosen language chips orange on the Study setup screen too when the user asks for parity — active setup languages should match the visible orange selection state used elsewhere.
262. [UX] Always show all seven x-axis day labels in `Reviews Due` when `7 days` mode is active — sparse labeling is only acceptable for the longer range, not the 7-day view.
263. [UX] Always center-align the edge x-axis labels in `Vocabulary Growth` the same as interior labels when the user flags misalignment in `7-day view` — `Today` and the far-left day should sit under their bars, not cling to the chart edges.
264. [UX] Always persist the dashboard `7 days` / `30 days` range selection across refresh as an internal preference, but never surface that preference in Settings when the user says it should stay dashboard-local.
265. [UX] Always center normal-sized first/last value labels in `Reviews Due` like the interior labels when the user flags off-center narrow-width layout, and reserve edge insets only for genuinely wide 3-digit values that would clip.
266. [PROCESS] Always kill old hanging processes on port `3000` before starting Learnly again — the user explicitly corrected the run order and wants stale server processes cleaned up first.
267. [DATA] Always order new HSK study words by increasing HSK level first and then by each word's numeric corpus order/rank, so earlier and more frequent numbered words always appear before later ones as additional HSK lists are added.
268. [STYLE] Always warm the dark study-page backdrop toward a neutral brown-black when the user flags cold lower blacks, so the lower field matches the warmer header tone instead of drifting blue-grey.
269. [PROCESS] Always fully kill every stale Learnly dev process (`next dev`, `next-router-worker`, launch-shell wrappers, and repo-scoped Node children) before restarting the site when the user asks to run it again — partial cleanup can leave the app appearing broken even though startup used to work.
270. [PROCESS] Always treat a Learnly web startup as failed if it does not begin answering HTTP within about 5 seconds after bind/start checks, and immediately restart or change approach instead of waiting a long time — the user explicitly said long waits are wasted here.
271. [UX] Always present iOS Settings as a true fullscreen flow on iPhone (no inset/form-sheet card appearance) when the user flags non-fullscreen behavior.
272. [UX] Always apply iOS `System/Light/Dark` theme overrides at the app-root scene level so the selected mode updates every page and overlay immediately.
273. [PROCESS] Always fall back to `next dev --turbo` after `seed-db.ts` when plain Learnly `next dev` binds but stalls without usable responses on Node 22 — this repo can reach `Ready` reliably through Turbopack when the standard dev path hangs.
274. [PROCESS] Always keep the root web `tsconfig.json` narrowly scoped to web app files instead of broad `**/*.ts(x)` globs — letting Next inspect the whole repository can trigger dev-bundler timeouts and `failed to receive message` errors here.
