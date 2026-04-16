#!/usr/bin/env python3

import argparse
import json
import sqlite3
from pathlib import Path


def load_patch_rows(path: Path) -> list[dict]:
    rows: list[dict] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            raw = line.strip()
            if not raw:
                continue
            payload = json.loads(raw)
            required = {"id", "pos", "primary_gloss", "secondary_glosses", "notes"}
            missing = required - set(payload)
            if missing:
                raise ValueError(f"{path}:{line_number}: missing required keys {sorted(missing)}")
            if not isinstance(payload["secondary_glosses"], list):
                raise ValueError(f"{path}:{line_number}: secondary_glosses must be a list")
            rows.append(payload)
    return rows


def normalize_secondary(values: list) -> list[str]:
    out: list[str] = []
    for item in values:
        if not isinstance(item, str):
            continue
        cleaned = item.strip()
        if cleaned and cleaned not in out:
            out.append(cleaned)
    return out


def apply_updates(db_path: Path, patch_rows: list[dict]) -> dict:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")

    updated = 0
    missing = 0
    skipped = 0
    seen_ids: set[str] = set()

    with conn:
        for row in patch_rows:
            word_id = str(row["id"]).strip()
            if not word_id:
                skipped += 1
                continue
            if word_id in seen_ids:
                skipped += 1
                continue
            seen_ids.add(word_id)

            exists = conn.execute("SELECT 1 FROM words WHERE id = ?", (word_id,)).fetchone()
            if not exists:
                missing += 1
                continue

            pos = str(row["pos"]).strip()
            primary_gloss = str(row["primary_gloss"]).strip()
            notes = str(row["notes"]).strip()
            secondary = normalize_secondary(row["secondary_glosses"])

            if not pos or not primary_gloss or not notes:
                skipped += 1
                continue

            conn.execute(
                """
                UPDATE words
                SET pos = ?,
                    primary_gloss = ?,
                    secondary_glosses_json = ?,
                    notes = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (pos, primary_gloss, json.dumps(secondary, ensure_ascii=False), notes, word_id),
            )
            updated += 1

    conn.close()
    return {
        "db_path": str(db_path),
        "patch_rows": len(patch_rows),
        "updated_rows": updated,
        "missing_word_ids": missing,
        "skipped_rows": skipped,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply definition-layer updates from JSONL patch file.")
    parser.add_argument("--db-path", required=True)
    parser.add_argument("--patch-file", required=True)
    args = parser.parse_args()

    db_path = Path(args.db_path)
    patch_file = Path(args.patch_file)
    rows = load_patch_rows(patch_file)
    result = apply_updates(db_path, rows)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
