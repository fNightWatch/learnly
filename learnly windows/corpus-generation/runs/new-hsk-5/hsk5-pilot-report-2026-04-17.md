# HSK5 Pilot Report — 2026-04-17

## Scope

- Database: `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-5.sqlite`
- Dataset: `new-hsk-5-words`
- Ingested slices:
  - ranks `101-150`
  - ranks `151-160`
  - ranks `161-170`
- Source files:
  - `runs/new-hsk-5/generated/generator-3/batch-0101-0150.jsonl`
  - `runs/new-hsk-5/generated/orchestrator/batch-0151-0160.jsonl`
  - `runs/new-hsk-5/generated/orchestrator/batch-0161-0170.jsonl`

## What happened

- The first completed HSK5 worker batch was generated for ranks `101-150`.
- Initial validation caught `21` lexicon failures.
- The failures were repaired in `runs/new-hsk-5/repair_batch_0101_0150.py`.
- The repaired JSONL then validated cleanly and was ingested into SQLite.
- Two more HSK5 slices were then authored directly by the orchestrator for ranks `151-160` and `161-170`.
- Both orchestrator-authored slices validated cleanly and were ingested into SQLite.

## Current live state

- Coverage: `70 / 1600` words complete
- Examples: `210`
- Pending: `1530`

## Metrics for the ingested slice

- Average sentence length: `15.033` Hanzi
- Average stored difficulty: `2.543`
- Share of sentences with length `<= 8`: `0.01`

## Audit evidence

- Audit name: `hsk5-after-0170-refresh-2`
- Issue count: `0`
- Lexicon failures: `0`
- Missing lemma: `0`
- Same-word duplicate sentences: `0`
- Same-word duplicate translations: `0`
- Cross-word duplicate sentence groups: `0`
- Cross-word duplicate translation groups: `0`

## Notes

- The HSK5 bootstrap, batch runner, and validator support are now in place.
- The current bottleneck is worker throughput: the Codex batch workers tend to over-explore the workspace before writing JSONL.
- The runner prompt was tightened, but direct orchestrator-authored slices are currently the fastest reliable path for continued HSK5 coverage.
