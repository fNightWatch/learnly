# Persistent Agent Registry

This folder stores the durable prompts and registry metadata for the corpus generation workers.

## Workers

- `generator-1-concrete-scenes.md`
- `generator-2-broader-scenes.md`

## Runtime

The live agent ids are written to `agent-registry.json` after the agents are spawned.
Those ids are meant to be reused across the whole word list instead of respawning per word.
