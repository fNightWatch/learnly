Read these files first:
- `/Users/moi/Desktop/business/learnly/corpus-generation/AGENTS.md`
- `/Users/moi/Desktop/business/learnly/corpus-generation/corpus generation.md`
- `/Users/moi/Desktop/business/learnly/corpus-generation/ORCHESTRATOR_PROMPT.md`

You are an orchestrator.

You are the orchestrator for the New HSK 4 corpus run in `/Users/moi/Desktop/business/learnly/corpus-generation`.

Your job is to build the full New HSK 4 corpus in a separate SQLite database with very high-quality word meanings, example sentences, and English translations.

Core instructions:

1. Use a separate HSK4 SQLite database:
- DB path: `/Users/moi/Desktop/business/learnly/corpus-generation/corpus-hsk-4.sqlite`
- Target dataset id: `new-hsk-4-words`
- Do not mix the final HSK4 corpus into the HSK1, HSK2, or HSK3 DBs.

2. Import support lexicons before generation:
- Import New HSK 1 source seeds
- Import New HSK 2 source seeds
- Import New HSK 3 source seeds
- Import New HSK 4 source seeds
- HSK4 example sentences may use only New HSK 1 + 2 + 3 + 4 vocabulary
- No vocabulary above New HSK 4 is allowed in any HSK4 sentence

3. Use SQL as the main workflow:
- SQLite is the authoritative store
- Persist results into SQLite
- Keep audit state in SQLite
- Do not treat JSON as the final product
- JSON/JSONL may exist only as helper files for generation and ingestion

4. Use this generation architecture:
- 3 reusable generation subagents
- 1 strict critique subagent
- The 3 generation subagents must always receive disjoint word ranges
- Never let different generation subagents work on the same HSK4 words
- Reuse the same generators across the run instead of spawning a new one per word
- The critique subagent should be `gpt-5.4` with `xhigh` reasoning

5. Go to full coverage:
- Process the entire HSK4 list
- Do not skip words
- Do not stop at partial coverage
- Continue until all HSK4 seed rows are complete
- Keep rank order and rank metadata intact

6. Translation quality is a top priority:
- Every word-level English gloss must be easy to understand
- Every word-level English gloss must also be complete enough to include the important common meanings
- Do not leave out important common meanings
- Do not use weak or misleading dictionary glosses
- Review every HSK4 word meaning carefully before sending words to generation
- If the source PDF English is weak, improve it
- Prefer common, teachable meanings over obscure dictionary senses

7. Example quality is a top priority:
- Every word must have exactly 3 example sentences
- The most important meaning must definitely appear in the examples
- Use different common meanings when the word really has multiple important senses
- If the word has only 1 or 2 strong meanings, reuse the strongest one instead of forcing a rare sense
- Keep the target word visually obvious in the sentence
- Avoid hiding the headword inside an unclear compound unless that compound is the intended sense

8. HSK4 sentence difficulty:
- HSK4 sentences should be only slightly harder than HSK3, not much harder
- Keep them concrete, natural, and learner-safe
- They can be a little richer than HSK3 in detail or clause structure, but only a little
- Avoid abstract, overly literary, or advanced constructions
- Keep them easy to picture

9. Chinese sentence rules:
- Simplified Chinese only
- Natural native-sounding Chinese only
- No broken grammar
- No awkward or placeholder-like beginner sentences
- No unsafe, political, graphic, or otherwise unsuitable material

10. English translation rules:
- Every English example translation must match the exact Chinese sentence
- No copied translation drift
- No stiff or unnatural English when a clearer learner-facing translation exists
- Keep translations clear, precise, and natural

11. Final per-word structure:
- Exactly 3 examples
- Exactly 1 primary example
- `meaning_en` stored for each example
- `primary_gloss`, `secondary_glosses`, and `notes` stored for each word
- Example ids must follow `{word_id}-ex1`, `{word_id}-ex2`, `{word_id}-ex3`

12. Validation rules:
- Validate every generated batch before ingestion
- Reject any sentence that uses vocabulary outside New HSK 1 + 2 + 3 + 4
- Reject any example that does not visibly contain the target word or an accepted variant
- Reject malformed or weak translations
- Reject duplicate examples within the same word

13. Audit rules during the run:
- Periodically run SQL audits while coverage is still in progress
- Do not wait until the end to discover structural problems
- Repair weak rows while the run is still moving

14. Final critique workflow:
- After HSK4 reaches full coverage, export the full corpus to a TSV review file
- Send the full HSK4 corpus to the strict critique agent
- The critique agent must check:
  - definition completeness
  - definition correctness
  - example quality
  - translation quality
  - sentence logic
  - sentence naturalness
  - sentence difficulty control
  - duplicate reuse
- Fix every issue it finds
- Rerun the SQL audit after fixes
- Repeat until the HSK4 corpus is clean

15. Final completion bar:
- Full HSK4 coverage
- 3 examples per word
- 1 primary example per word
- 0 lexicon failures
- 0 missing-lemma cases
- 0 same-word duplicate sentences
- 0 same-word duplicate translations
- 0 cross-word duplicate sentence groups
- 0 cross-word duplicate translation groups
- Definitions complete and learner-friendly
- Sentences only slightly harder than HSK3

16. Responsibility:
- You are responsible for the final quality
- Do not trust agent output without review
- Fix weak definitions, weak examples, and weak translations yourself when needed
- Do not call the HSK4 corpus finished until quality is actually clean
