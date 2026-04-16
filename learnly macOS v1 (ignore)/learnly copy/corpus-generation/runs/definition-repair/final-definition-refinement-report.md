# Definition Refinement Report (HSK1 / HSK2 / HSK4)

Date: 2026-04-14

## Scope
- HSK1 (`/Users/moi/Desktop/business/learnly/corpus-generation/corpus.sqlite`)
- HSK2 (`/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-2.sqlite`)
- HSK4 (`/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-4.sqlite`)

## Passes Applied
- HSK1:
  - `hsk1-definition-updates.jsonl` (52)
  - `hsk1-definition-updates-pass2.jsonl` (415)
  - `hsk1-definition-updates-pass3.jsonl` (12)
  - `hsk1-definition-updates-pass4.jsonl` (18)
- HSK2:
  - `hsk2-definition-updates.jsonl` (719)
  - `hsk2-definition-updates-pass2.jsonl` (689)
  - `hsk2-definition-updates-pass3.jsonl` (9)
- HSK4:
  - `hsk4-definition-updates.jsonl` (330)
  - `hsk4-definition-updates-pass2.jsonl` (817)
  - `hsk4-definition-updates-pass3.jsonl` (247)

## Final Quality Snapshot

### HSK1
- total words: 500
- unknown POS: 0
- imported-template notes: 0
- generic shell notes (`Common ...`, `Refers to ...`, `Used when someone is ...`, `Used for ...ing.`, `Says that something is ...`): 0
- known typo tokens in notes: 0

### HSK2
- total words: 772
- unknown POS: 0
- imported-template notes: 0
- generic shell notes (`Common ...`, `Refers to ...`, `Used when someone is ...`, `Used for ...ing.`, `Says that something is ...`): 0
- known typo tokens in notes: 0

### HSK4
- total words: 1000
- unknown POS: 0
- imported-template notes: 0
- generic shell notes (`Common ...`, `Refers to ...`, `Used when someone is ...`, `Used for ...ing.`, `Says that something is ...`): 0
- known typo tokens in notes: 0

## Residual Heuristic Flags (manual review candidates)
- HSK2:
  - `new-hsk-2-0182` (`刚才`) flagged by heuristic as `noun + just now` (likely acceptable as time noun).
- HSK4:
  - `new-hsk-4-0339` (`加上`) conjunction/gloss heuristic mismatch.
  - `new-hsk-4-0387` (`今后`) noun/time-expression heuristic mismatch.
  - `new-hsk-4-0408` (`就是`) conjunction/gloss heuristic mismatch.
  - `new-hsk-4-0804` (`相反`) conjunction/gloss heuristic mismatch.

These 5 are low-confidence heuristic flags, not confirmed errors.
