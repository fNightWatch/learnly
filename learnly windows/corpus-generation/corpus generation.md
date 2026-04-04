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

44. [DATA] Always keep the New HSK 2 corpus in `corpus-generation/corpus-hsk-2.sqlite` as a separate database from the completed New HSK 1 corpus — the user explicitly asked for a separate HSK 2 SQLite DB.
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

54. [DATA] Always keep the New HSK 3 corpus in `corpus-generation/corpus-hsk-3.sqlite` as a separate database from the completed HSK 1 and HSK 2 corpora — the user explicitly asked to do the same separate-database workflow for HSK 3.
55. [DATA] Always import the New HSK 1, New HSK 2, and New HSK 3 source seed lexicons into the HSK 3 database before generation so HSK 3 sentence validation allows only New HSK 1 plus New HSK 2 plus New HSK 3 vocabulary — the HSK 3 validator depends on all three levels being present.
56. [DATA] Always keep New HSK 3 sentences slightly harder than New HSK 2, still concrete and learner-safe, and restricted to New HSK 1 plus New HSK 2 plus New HSK 3 vocabulary only — the user explicitly defined the HSK 3 lexicon ceiling and wants a controlled difficulty increase.
57. [PROCESS] Always drive the HSK 3 run to full seed coverage once it starts, rather than stopping at setup or partial progress — the user explicitly said to go to full coverage and not stop.
58. [PROCESS] Always use exactly 3 separate generation subagents with disjoint word assignments plus 1 strict `gpt-5.4` `xhigh` critique subagent for the HSK 3 run when the user explicitly asks for that workflow — the user explicitly requested 3 generators and a fourth strict reviewer.
59. [DATA] Always keep New HSK 3 sentences only slightly harder than HSK 2, not much harder — the user explicitly clarified that the HSK 3 difficulty increase should stay small.
