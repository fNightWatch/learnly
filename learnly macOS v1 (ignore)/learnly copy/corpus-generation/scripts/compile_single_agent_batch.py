#!/usr/bin/env python3

import argparse
import json
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import orchestrator


def build_payload(agent_source: str, row: dict, seed: dict) -> dict:
    meanings = []
    for item in row.get("meanings", []):
        meaning = item.get("meaning_en", "").strip() if isinstance(item, dict) else str(item).strip()
        if meaning and meaning not in meanings:
            meanings.append(meaning)
    for example in row["examples"]:
        meaning = example["meaning_en"].strip()
        if meaning and meaning not in meanings:
            meanings.append(meaning)
    if not meanings:
        meanings = [seed["primary_gloss"]]

    ordered_examples = sorted(row["examples"], key=lambda item: item["slot"])
    if len(ordered_examples) != 3:
        raise ValueError(f"{row['word_id']}: expected exactly 3 examples")

    examples = []
    translations = []
    for example in ordered_examples:
        slot = example["slot"]
        example_id = f"{row['word_id']}-ex{slot}"
        examples.append(
            {
                "id": example_id,
                "meaning_en": example["meaning_en"].strip(),
                "sentence": example["sentence"].strip(),
                "difficulty": int(example.get("difficulty", 2)),
                "source": agent_source,
                "is_primary": slot == 1,
            }
        )
        translations.append(
            {
                "example_id": example_id,
                "translation": example["translation"].strip(),
            }
        )

    return {
        "word": {
            "id": row["word_id"],
            "lang": "zh",
            "lemma": orchestrator.normalize_display_form(seed["display_form"]),
            "display_form": orchestrator.normalize_display_form(seed["display_form"]),
            "pos": seed["pos"],
            "rank": row["rank"],
            "pronunciation": orchestrator.normalize_pronunciation(seed["pronunciation"]),
        },
        "glosses": {
            "primary_gloss": meanings[0],
            "secondary_glosses": meanings[1:4],
            "notes": (row.get("notes") or seed["notes"]).strip(),
        },
        "examples": examples,
        "example_translations": translations,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Compile a one-agent raw batch JSON file into final payload JSONL and optionally ingest it.")
    parser.add_argument("--db-path", default=str(orchestrator.DEFAULT_DB_PATH))
    parser.add_argument("--dataset-id", required=True)
    parser.add_argument("--agent-source", required=True)
    parser.add_argument("--input-file", required=True)
    parser.add_argument("--output-jsonl", required=True)
    parser.add_argument("--ingest", action="store_true")
    args = parser.parse_args()

    orchestrator.set_db_path(args.db_path)
    raw = json.loads(Path(args.input_file).read_text())
    rows = raw["results"]

    output_path = Path(args.output_jsonl)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payloads = []
    with orchestrator.connect() as conn:
        for row in rows:
            seed = conn.execute(
                """
                SELECT display_form, pronunciation, pos, primary_gloss, notes
                FROM source_translation_seeds
                WHERE dataset_id = ? AND rank = ?
                """,
                (args.dataset_id, row["rank"]),
            ).fetchone()
            if not seed:
                raise ValueError(f"Missing seed row for {row['word_id']}")
            payloads.append(build_payload(args.agent_source, row, dict(seed)))

    output_path.write_text("\n".join(json.dumps(payload, ensure_ascii=False) for payload in payloads) + "\n")
    orchestrator.validate_jsonl(str(output_path))
    if args.ingest:
        orchestrator.ingest_jsonl(str(output_path))

    print(
        json.dumps(
            {
                "db_path": args.db_path,
                "dataset_id": args.dataset_id,
                "input_file": args.input_file,
                "output_jsonl": str(output_path),
                "word_count": len(payloads),
                "ingested": args.ingest,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
