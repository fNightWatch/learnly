# Quality + Hardness Rerun (2026-04-14)

## Coverage
- HSK1: seed 500, complete 500, pending 0
- HSK2: seed 772, complete 772, pending 0
- HSK3: seed 973, complete 973, pending 0
- HSK4: seed 1000, complete 1000, pending 0

## Latest Audit Result
- HSK1 (`rerun_quality_2026_04_14_hsk1`): issue_count 0
- HSK2 (`rerun_quality_2026_04_14_hsk2`): issue_count 0
- HSK3 (`rerun_quality_2026_04_14_hsk3`): issue_count 0
- HSK4 (`rerun_quality_2026_04_14_hsk4`): issue_count 15
  - lexicon_failures 3
  - missing_lemma 12
  - duplicate-sentence/translation issue counts 0

HSK4 failing word IDs from audit:
- `new-hsk-4-0378` (1 missing_lemma example)
- `new-hsk-4-0405` (2 missing_lemma examples)
- `new-hsk-4-0440` (3 lexicon failures)
- `new-hsk-4-0492` (3 missing_lemma examples)
- `new-hsk-4-0660` (3 missing_lemma examples)
- `new-hsk-4-0678` (3 missing_lemma examples)

### HSK4 post-fix rerun
- HSK4 (`rerun_quality_2026_04_14_hsk4_post_fix2`): issue_count 0
  - lexicon_failures 0
  - missing_lemma 0

Notes:
- Fixed the six failing word groups above.
- Corrected an OCR lexicon error at rank 440 (`又语` -> `口语`) in both `words` and `source_translation_seeds`, which removed the remaining HSK4 lexicon failures.

## Sentence Hardness + Average Length

Average sentence length uses Hanzi count (punctuation removed). Difficulty uses stored `examples.difficulty`.

- HSK1: avg_len 7.93, median_len 8, p90_len 9, avg_difficulty 1.338
- HSK2: avg_len 8.252, median_len 8, p90_len 11, avg_difficulty 1.576
- HSK3: avg_len 11.758, median_len 10, p90_len 18, avg_difficulty 2.115
- HSK4: avg_len 17.092, median_len 17, p90_len 19, avg_difficulty 2.985

Length progression is monotonic from HSK1 to HSK4.
Difficulty progression is also monotonic from HSK1 to HSK4.

## Definition-Layer Sanity Counts
- HSK1: unknown_pos 0, empty_gloss 0, empty_notes 0
- HSK2: unknown_pos 0, empty_gloss 0, empty_notes 0
- HSK3: unknown_pos 600, empty_gloss 0, empty_notes 0
- HSK4: unknown_pos 0, empty_gloss 0, empty_notes 0

Note-shell checks (`Common...`, `Refers to...`, `Used when someone is...`, `Used for ...ing.`, `Says that something is...`) are 0 for HSK1/2/4.
