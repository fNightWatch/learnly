# Feature Memory Docs

This folder is the canonical place for feature-specific implementation notes.

Rule:
- Every time a feature is implemented or changed, create or update one dedicated markdown file here for that feature.

Each feature doc should include:
- What the feature is supposed to do in product terms
- Current implemented scope
- Logic and behavioral rules
- Technical design and persistence model
- API and UI touchpoints
- Files changed
- Known gaps or next implementation steps

Naming convention:
- Use a stable kebab-case feature name, for example `assumed-words.md`
- Reuse the same file for future changes to that feature instead of creating duplicates

Goal:
- Someone should be able to open a single feature doc in this folder and understand how the feature works without reading chat history.
