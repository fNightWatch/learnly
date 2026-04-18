# Corpus Generation Rules

Read this entire file before every new corpus-generation run, regeneration pass, repair pass, or audit pass in this workspace.

Update this file immediately when the user corrects the corpus workflow, quality bar, translation choices, storage format, or dataset rules. If two rules conflict, the newer rule wins. Remove obsolete rules once a newer rule fully replaces them.

## Standing Rules

1. [PROCESS] Always read this file before each new corpus-generation task — it is the standing source of truth for corpus-generation work in this repo.
2. [PROCESS] Always update this file immediately when the user corrects corpus-generation behavior — the rules must stay current across future runs.
3. [PROCESS] Always orchestrate this corpus-generation workspace with exactly 2 reusable permanent generation agents when the user requests that split — do not create new agents for every word.
4. [PROCESS] Always prompt the permanent generation agents once, then feed them words one by one and collect the final accepted results into one database — the user explicitly rejected respawning or file-first batching as the main workflow.
5. [DATA] Always keep SQLite as the primary and authoritative store for corpus results, audits, and reporting state — the user explicitly wants SQL, not JSON, as the real workflow output.
6. [DATA] Never treat JSON artifacts as the authoritative corpus deliverable or audit record when the user has asked for SQL-only workflow — JSON may exist only as transient helper material if absolutely necessary.
7. [DATA] Always process requested source words in strict rank order and preserve their rank-linked metadata during generation and ingestion — rank is part of the dataset contract.
8. [DATA] Always use the correct dataset-specific word-id scheme already established in the database — for New HSK 1 this is `new-hsk-1-####`.
9. [DATA] Always treat the corpus as a real vocabulary dataset with large coverage, example sentences, and pronunciation support — not as a demo dataset.
10. [DATA] Always support Chinese as a first-class corpus language with separate New HSK 1-6 level structure — the HSK pipeline is level-based by design.
11. [DATA] Always fully remove unwanted source datasets and their dataset-specific scaffolding when the user says to scrap them — do not leave dead corpus data hanging around.
12. [DATA] Always treat word-level translations and gloss quality as first-class output and verify or refine them carefully before ingestion — weak glosses are a real data bug.
13. [DATA] Always do a careful high-quality English meaning review for every word before sending it to the generation agents, or explicitly delegate that meaning review first — translation quality must be upstream, not an afterthought.
14. [DATA] Always collect the important English meanings for each word in priority order — the corpus should teach the meanings learners are most likely to need first.
15. [DATA] Always choose the most common, high-frequency, teachable meanings and avoid obscure dictionary senses unless the user explicitly asks for them — common usage beats exhaustive coverage.
16. [DATA] Always make sure the most popular meaning definitely appears in the example set — the main meaning cannot be missing from the teaching examples.
17. [DATA] Always reuse the main meaning when no strong additional common meaning fits the level or lexicon constraints — do not force a weak or marginal third sense just to create variety.
18. [DATA] Always generate exactly 3 example sentences per word — this is the standing example-count requirement.
19. [DATA] Always make the 3 examples cover different common meanings when the word really has multiple strong senses — repeated senses should be a fallback, not the default.
20. [DATA] Always keep the target Chinese word visually and semantically obvious in each example — do not hide the headword inside a confusing compound unless that compound is the intended sense.
21. [DATA] Always prefer standalone target-word usage over a compound form when the compound makes the headword feel hidden or indirect — learners should clearly see the word being taught.
22. [DATA] Always keep every Chinese example sentence restricted to words from the same New HSK level or below, using the current level file and earlier New HSK files as the allowed vocabulary source — this is a core pipeline rule for HSK 3.0.
23. [DATA] Always interpret the lexicon rule literally: every token in every sentence must come from the allowed New HSK file set — approximate compliance is not acceptable.
24. [DATA] Always apply the stronger dataset-specific limit when one exists — for the HSK 1 run, every token in every sentence must come from the New HSK 1 source list.
25. [DATA] Always keep simplified Chinese in examples and preserve the intended pronunciation data for the word record — script and pronunciation consistency matter.
26. [DATA] Always keep example quality and translation quality as the core top priority — this quality bar outranks convenience or speed.
27. [DATA] Always personally own the final quality of glosses, example sentences, and example translations — agent output is only candidate material until reviewed.
28. [DATA] Always quality-check both the Chinese sentence and its English translation before merge — a strong sentence with a weak translation is still bad data.
29. [PROCESS] Always keep the standing role and output contract for each permanent generator aligned with the latest user correction — do not silently drift back to older schemas or behaviors.
30. [DATA] Always keep the broader-senses generator focused on common teachable meanings and reuse the main meaning when needed instead of forcing a rare third sense — beginner datasets should not be warped by dictionary edge cases.
31. [PROCESS] Always audit already-generated rows for quality and accuracy while a run is still in progress — do not assume earlier merged rows are automatically good enough.
32. [PROCESS] Always perform periodic quality checks during long corpus runs instead of waiting until the very end — problems should be caught while the run is still moving.
33. [DATA] Always finish a corpus pass with zero duplicate examples and clear high-quality English glosses and sentence translations before treating the dataset as done — completion requires a clean audit, not just filled rows.
34. [DATA] Always keep corpus audit and reporting state in SQLite — final audit truth must live in SQL alongside the corpus.

## New HSK Standing Rules

35. [DATA] Always preserve the New HSK level structure when generating Chinese corpora — level boundaries are part of the product design.
36. [DATA] Always keep HSK example vocabulary within the allowed level range even when a richer sentence would sound nicer — level control wins over stylistic flourish.

## New HSK 1 Standing Rules

37. [DATA] Always process the first 500 requested New HSK 1 source words in strict rank order and preserve their stored metadata — this dataset was explicitly requested as the first corpus block.
38. [DATA] Always ensure each New HSK 1 word ends with exactly 3 examples total and that the examples satisfy the HSK 1-only lexicon rule — both structure and vocabulary level are mandatory.
39. [DATA] Always treat `爱好` as the strong common noun meaning `hobby` in the HSK 1 corpus unless the user explicitly changes that instruction — do not force the formal verb sense there.
40. [DATA] Always verify that each English example translation matches its exact Chinese sentence and has not been accidentally reused from another example row — copied or drifted translations are real corpus errors.
41. [DATA] Always avoid unidiomatic beginner examples for grammar-heavy or pattern-bound words like `第` and `中`, and prefer natural common constructions over literal but awkward forms — beginner teaching examples must still sound like real Chinese.
42. [DATA] Always prefer natural context-appropriate English for transport and location words like `车`, `车上`, `上车`, and `下车`, and never default to stiff literal translations like `vehicle` when a clearer learner-facing English choice exists — literal transport English weakens the corpus even when the Chinese is fine.
43. [DATA] Always audit word-level definitions for missing important common meanings separately from sentence quality, and include the major common senses even when the examples focus on only one of them — the glossary layer must not collapse polysemous words too aggressively.

## New HSK 2 Standing Rules

44. [DATA] Always keep the New HSK 2 corpus in `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-2.sqlite` as a separate database from the completed New HSK 1 corpus — the user explicitly asked for a separate HSK 2 SQLite DB.
45. [DATA] Always import both the New HSK 1 and New HSK 2 source seed lexicons into the HSK 2 database before generation so HSK 2 sentence validation can allow only New HSK 1 plus New HSK 2 vocabulary — the HSK 2 validator depends on both level seed sets being present in the target DB.
46. [DATA] Always keep New HSK 2 sentences slightly harder than New HSK 1, usually around 6-14 Chinese words with modestly richer time, place, and clause detail, while staying concrete and beginner-safe — the user explicitly defined the HSK 2 difficulty target.
47. [DATA] Always review every New HSK 2 word definition beyond the PDF English baseline and add the important common meanings before generation — HSK 2 glosses must be full, correct, and not miss major senses.
48. [PROCESS] Always run the corpus-generation loop with only one reusable sentence-generation subagent plus the orchestrator, not two separate generation subagents — the user explicitly corrected that the orchestrator counts as the second agent.
49. [DATA] Always make every word-level English gloss easy to understand as well as complete — the user explicitly corrected that the translations should be learner-friendly and still cover the important meanings.
50. [PROCESS] Always switch to multiple reusable sentence-generation subagents with strictly disjoint word assignments when the user explicitly asks to speed up coverage — the user explicitly asked for Volta plus 2 more generator agents that never receive the same words.
51. [PROCESS] Always use the user-provided full-corpus TSV export as the primary scan surface for corpus audits when one is supplied — strict review should run against the full exported corpus, not drift into spot checks.
52. [PROCESS] Always complete the requested live repair pass and rerun local validation before launching a brand-new review subagent — fix-first, fresh-reviewer-second is now part of the standing workflow.
53. [PROCESS] Always add the workspace root to `sys.path` when a repair helper inside `runs/` imports `orchestrator` — run-local batch scripts in this repo do not automatically see the repo-root module path.

## New HSK 3 Standing Rules

54. [DATA] Always keep the New HSK 3 corpus in `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-3.sqlite` as a separate database from the completed HSK 1 and HSK 2 corpora — the user explicitly asked to do the same separate-database workflow for HSK 3.
55. [DATA] Always import the New HSK 1, New HSK 2, and New HSK 3 source seed lexicons into the HSK 3 database before generation so HSK 3 sentence validation allows only New HSK 1 plus New HSK 2 plus New HSK 3 vocabulary — the HSK 3 validator depends on all three levels being present.
56. [DATA] Always keep New HSK 3 sentences slightly harder than New HSK 2, still concrete and learner-safe, and restricted to New HSK 1 plus New HSK 2 plus New HSK 3 vocabulary only — the user explicitly defined the HSK 3 lexicon ceiling and wants a controlled difficulty increase.
57. [PROCESS] Always drive the HSK 3 run to full seed coverage once it starts, rather than stopping at setup or partial progress — the user explicitly said to go to full coverage and not stop.
58. [PROCESS] Always use exactly 3 separate generation subagents with disjoint word assignments plus 1 strict `gpt-5.4` `xhigh` critique subagent for the HSK 3 run when the user explicitly asks for that workflow — the user explicitly requested 3 generators and a fourth strict reviewer.
59. [DATA] Always keep New HSK 3 sentences only slightly harder than HSK 2, not much harder — the user explicitly clarified that the HSK 3 difficulty increase should stay small.
60. [PROCESS] Always make reusable HSK corpus prompt files explicitly say `You are an orchestrator` at the top when the user asks for that framing — the user explicitly corrected the HSK 4 prompt wording.

## New HSK 4 Standing Rules

61. [DATA] Always keep the New HSK 4 corpus in `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-4.sqlite` as a separate database from the completed HSK 1, HSK 2, and HSK 3 corpora — the user explicitly asked to do the same separate-database workflow for HSK 4.
62. [DATA] Always import the New HSK 1, New HSK 2, New HSK 3, and New HSK 4 source seed lexicons into the HSK 4 database before generation so HSK 4 sentence validation allows only New HSK 1 plus New HSK 2 plus New HSK 3 plus New HSK 4 vocabulary — the HSK 4 validator depends on all four levels being present.
63. [DATA] Always keep New HSK 4 sentences only slightly harder than HSK 3, still concrete and learner-safe, and restricted to New HSK 1 plus New HSK 2 plus New HSK 3 plus New HSK 4 vocabulary only — the user explicitly defined the HSK 4 lexicon ceiling and wants only a small difficulty increase.
64. [PROCESS] Always drive the HSK 4 run to full seed coverage once it starts, rather than stopping at setup or partial progress — the user explicitly said to go to full coverage and not stop.
65. [PROCESS] Always use exactly 3 separate generation subagents with disjoint word assignments plus 1 strict `gpt-5.4` `xhigh` critique subagent for the HSK 4 run — the user explicitly requested the same parallel-generation and strict-review workflow for HSK 4.
66. [PROCESS] Always run lexicon validation, not just shape validation, on generated HSK JSONL before accepting a batch — `validate-jsonl` once passed empty structure checks without catching out-of-level words, and ingestion then failed.
67. [PROCESS] Always keep HSK batch ingestion honest by validating the full JSONL before any rows are written — a failed HSK 4 batch partially inserted one row and inflated coverage.
68. [PROCESS] Always validate visible target-word presence and same-word duplicate examples before ingesting generated HSK JSONL — a mid-run HSK 4 audit found missing-lemma rows and duplicate-style drift that should have been blocked earlier.
69. [PROCESS] Always use the updated HSK 4 `validate-jsonl` to reject examples that do not visibly contain the target display form or that duplicate Chinese or English examples within the same word before reporting a batch complete — the validator now enforces these extra corpus-quality checks.
70. [PROCESS] Always rerun the live SQLite audit after any partial HSK repair ingest before acting on an older critique report or old `audit_issues` rows — the HSK 4 reviewer report lagged behind already-ingested fixes, and the stale audit snapshot overstated what was still broken.
71. [DATA] Always verify HSK sentence-length and difficulty progression with real corpus metrics instead of assuming it from the prompt, and do not accept HSK 3 or HSK 4 corpora where most sentences are still too short for their level — the user explicitly corrected that the current HSK 3 sentences are not long enough overall.
72. [DATA] Always make the average sentence length and average stored difficulty increase from one HSK level to the next during corpus generation and repair — the user explicitly corrected that the progression itself must rise instead of flattening or dropping.
73. [PROCESS] Never rely on Python `pathlib` path resolution helpers like `Path.resolve()`, `Path.absolute()`, or `Path.cwd()` inside this corpus-generation workspace scripts when a plain string or `os.path` will do — they can hang in this environment and freeze corpus repair runs.
74. [DATA] Always target roughly natural HSK average sentence length around 17 characters for higher-level repair work, and never inflate that metric with artificial filler prefixes or disproportionate lengthening — the user explicitly corrected that the increase must feel natural rather than mechanically padded.
75. [DATA] Always achieve higher-level HSK length targets with broadly varied, natural sentence structures across the corpus, and never let one repair wrapper pattern dominate a level — repeated shells like `后来大家才...` make the corpus feel artificial even when the average length looks right.
76. [DATA] Always audit and repair the word-definition layer across the full generated HSK corpus, especially grammar particles and function words, until each gloss is clear enough for a learner to understand on its own and includes the important common meanings — the user explicitly corrected that many HSK 1-4 definitions are still weak, incomplete, or unclear.
77. [PROCESS] Always switch the unfinished HSK 3 run to 10 separate generation subagents with disjoint word lists plus 2 dedicated quality-check subagents after each batch when the user explicitly asks for that setup — the user explicitly replaced the earlier smaller-agent HSK 3 workflow and wants the remaining HSK 3 coverage finished under the new split.
78. [DATA] Always translate `特色` in learner-natural English as `distinctive feature` or `distinctive style`, and never use awkward phrasing like `special character` in the HSK corpus — the user explicitly corrected that wording.
79. [DATA] Always keep `台` internally consistent within a single HSK corpus row — either teach only the classifier sense across all glosses and examples or deliberately teach both senses with explicit glossing, never mix them by accident.
80. [DATA] Always keep `生产` teachable with natural verb-centered English unless a noun sense is being taught on purpose, and never use awkward lines like `公司的生产更多了` or stiff English like `more production` in the HSK corpus — the user explicitly corrected that row.
81. [DATA] Always teach bound morpheme entries like `性` with examples that explicitly show the suffix sense as quality/property/category, not just opaque lexicalized compounds — the user explicitly corrected that the current `性` row was not teaching the suffix meaning clearly enough.
82. [DATA] Always keep `烟` example meanings and English translations aligned to the actual Chinese sense in each sentence, and make sure the row naturally covers both `smoke` and `cigarette(s)` — the user explicitly corrected the current `烟` sense mismatch.
83. [DATA] Always normalize malformed imported HSK suffix display forms and pronunciations before validation when the source row leaves pinyin attached outside parentheses — rows like `员（服务员）yuán` and `者（志愿者）zhě` otherwise fail target-form matching and lexicon segmentation.
84. [DATA] Always teach suffix rows like `员` and `者` through natural common compound-word sentences instead of meta character-explanation lines — the user explicitly rejected explanation-style examples for those HSK 3 blocker rows.
85. [DATA] Always rewrite English for grammar words and abstract entries into learner-natural phrasing instead of literal passive or awkward dictionary wording — the user explicitly corrected rows like `由`, `有的是`, and `整体`.
86. [DATA] Always test even seemingly common school/life words against the literal HSK 1-3 seed lexicon before relying on them in HSK 3 examples — words like `毕业`, `迟到`, `了解`, `绳子`, and `产品` can still be outside this validator’s allowed set.
83. [DATA] Always fully translate compounds used in bound-morpheme teaching rows into natural English and never leave Chinese compound placeholders in example translations — the user explicitly corrected that `性` translations must teach the suffix sense without untranslated compounds.
84. [DATA] Always strip POS annotations from generated HSK JSONL `word.display_form` values and keep the visible headword plain, preserving the sense distinction in `pos` and notes instead — the user explicitly corrected rows like `痛（形）` and `为（动）`.
85. [DATA] Always teach `为（动）` with natural written verbal uses such as `化为` or similarly idiomatic verbal patterns, never with stiff copular shortcut sentences — the user explicitly rejected those earlier examples.
86. [DATA] Always remove extra English additions that are not present in the Chinese, such as stray `for everyone`, when smoothing corpus translations into natural learner English — the user explicitly corrected the `下去` translation.
87. [DATA] Always rewrite HSK function-word and state-word rows into natural learner English, and when the Chinese sentence is fine but the referential wording is awkward, rewrite the Chinese too while keeping the target visible and lexicon-safe — the user explicitly corrected awkward `指`, `至今`, and `状态` lines in generator-10.
88. [DATA] Always prefer the simplest natural learner phrasing for English state/continuation translations, avoiding overworked expressions like `in really good form for studying` or `see each other again` when plain alternatives fit the Chinese better — the user explicitly corrected those generator-10 lines.
89. [DATA] Always keep a generated HSK row on the intended part of speech and sense only, and never mix in another sense like a noun example when the user wants a verb row — the user explicitly corrected `指` in generator-10 to stay verb-only.
90. [DATA] Always avoid stiff literal English for sufficiency lines and awkward map-label phrasing for verb `指`; prefer plain learner wording like `This is enough money already` and idiomatic verb sentences such as `图上的线指北京` — the user explicitly corrected those final generator-10 blockers.
91. [PROCESS] Always run definition-layer remediation with exactly 3 disjoint subagents when the user requests that setup, and require orchestrator quality checks for every returned batch plus one final end-to-end quality check after all merges.
92. [DATA] Always treat a requested HSK definition-layer `major POS + gloss refinement` pass as broad cleanup across the remaining weak rows, not a narrow spot-fix sample — the user explicitly corrected that the first HSK1 pass was too limited.
93. [DATA] Always use the live HSK SQLite `words` table as the source of truth for corrective definition-layer passes, re-review every row, and emit only correction rows in the follow-up patch — the user explicitly corrected that the HSK2 broad patch must be fixed against current DB state without touching already-good rows.

## New HSK 5 Standing Rules

94. [DATA] Always keep the New HSK 5 corpus in `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite` as a separate database from the completed HSK 1, HSK 2, HSK 3, and HSK 4 corpora — the user explicitly asked HSK 5 to follow the same per-level SQLite workflow.
95. [DATA] Always import the New HSK 1, New HSK 2, New HSK 3, New HSK 4, and New HSK 5 source seed lexicons into the HSK 5 database before generation so HSK 5 sentence validation allows only New HSK 1 plus New HSK 2 plus New HSK 3 plus New HSK 4 plus New HSK 5 vocabulary — the HSK 5 validator depends on all five levels being present.
96. [DATA] Always keep New HSK 5 sentences only slightly harder than HSK 4, still concrete and learner-safe, and restricted to New HSK 1 plus New HSK 2 plus New HSK 3 plus New HSK 4 plus New HSK 5 vocabulary only — the user explicitly wants natural progression without artificial padding.
97. [DATA] Always treat the HSK 5 definition layer as first-class during generation and QA, with especially careful POS, gloss, and note treatment for function words and grammar particles — the user explicitly said the definition layer is a core deliverable.
98. [PROCESS] Always drive the HSK 5 run to full seed coverage once it starts, rather than stopping at setup or partial progress — the user explicitly asked to generate HSK 5 under the same end-to-end workflow.
99. [PROCESS] Always require final orchestrator QA before treating HSK 5 output as complete, because worker output is only candidate material until reviewed — the user explicitly said final orchestrator QA is mandatory.
100. [PROCESS] Always keep HSK generation-worker prompts tightly batch-focused and forbid broad workspace or cross-corpus exploration unless validation reveals a specific blocker — the HSK 5 workers drifted into long inspection loops and stalled output instead of writing JSONL.
101. [PROCESS] Always use sub-agents for ongoing HSK 5 generation when the user requires them, and every such sub-agent must run on `gpt-5.4` with `xhigh` reasoning — the user explicitly corrected the workflow and model requirement.
102. [PROCESS] Always treat HSK 5 as unfinished until the entire level is complete in SQLite, and keep working generation, validation, ingest, and audit passes until full HSK 5 coverage is reached — the user explicitly corrected the definition of done.
103. [PROCESS] Always keep generated example `difficulty` values inside the supported `1-3` scale and reject any batch with `difficulty: 4` or other out-of-band values before ingest — an HSK 5 worker batch slipped invalid difficulty values past review because the validator did not enforce the range yet.
104. [PROCESS] Always treat the user’s current HSK 5 completion bar as `1650 / 1650`, and if the local source PDF or seed rows still top out at `1600`, keep generating while explicitly treating the denominator mismatch as an active source-data blocker rather than silently redefining done — the user explicitly corrected the HSK 5 finish line to `1650 / 1650`.
105. [PROCESS] Never stop an in-progress HSK 5 run at an intermediate clean checkpoint just because validation and audit are green there; keep advancing coverage until the run reaches the user’s stated `1650 / 1650` bar or a clearly reported source-data blocker prevents further progress — the user explicitly restated that the definition of done is full coverage, not partial clean slices.
