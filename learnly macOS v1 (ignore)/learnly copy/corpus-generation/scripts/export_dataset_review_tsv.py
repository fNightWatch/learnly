#!/usr/bin/env python3

import argparse
import csv
import sqlite3
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Export a dataset from SQLite into a review TSV.")
    parser.add_argument("--db-path", required=True)
    parser.add_argument("--dataset-id", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    dataset_prefix = args.dataset_id[:-6] if args.dataset_id.endswith("-words") else args.dataset_id

    conn = sqlite3.connect(args.db_path)
    conn.row_factory = sqlite3.Row

    rows = conn.execute(
        """
        SELECT
          w.id AS word_id,
          w.rank,
          w.display_form,
          w.pronunciation,
          w.pos,
          w.primary_gloss,
          w.secondary_glosses_json,
          w.notes,
          e.id AS example_id,
          e.is_primary,
          e.meaning_en,
          e.sentence,
          e.translation,
          e.difficulty,
          e.source
        FROM words w
        LEFT JOIN examples e ON e.word_id = w.id
        WHERE w.id LIKE ?
        ORDER BY w.rank, e.id
        """,
        (f"{dataset_prefix}-%",),
    ).fetchall()

    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t")
        writer.writerow(
            [
                "word_id",
                "rank",
                "display_form",
                "pronunciation",
                "pos",
                "primary_gloss",
                "secondary_glosses_json",
                "notes",
                "example_id",
                "is_primary",
                "meaning_en",
                "sentence",
                "translation",
                "difficulty",
                "source",
            ]
        )
        for row in rows:
            writer.writerow([row[key] for key in row.keys()])

    print(output_path)


if __name__ == "__main__":
    main()
