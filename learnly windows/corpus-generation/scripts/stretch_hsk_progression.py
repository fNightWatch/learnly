#!/usr/bin/env python3

import json
import os
import re
import sqlite3
import sys


ROOT = os.getcwd()
if os.path.basename(ROOT) != "corpus-generation":
    ROOT = "/Users/moi/Desktop/business/learnly/corpus-generation"

PREFIXES = {
    "new-hsk-3-words": [
        ("今天这个时候，", "At this time today, "),
        ("现在这个时候，", "At this moment, "),
        ("这个时候，", "At this time, "),
    ],
    "new-hsk-4-words": [
        ("今天这个时候，", "At this time today, "),
        ("现在这个时候，", "At this moment, "),
        ("这个时候，", "At this time, "),
    ],
}

SHORT_THRESHOLDS = {
    "new-hsk-3-words": 8,
    "new-hsk-4-words": 10,
}

CHINESE_PUNCT_RE = re.compile(r"[，。！？；：、“”‘’（）《》〈〉【】—…·\s,.!?;:\"'()\[\]{}-]+")


def clean_len(sentence):
    return len(CHINESE_PUNCT_RE.sub("", sentence))


def dataset_prefix(dataset_id):
    return dataset_id[:-len("-words")] if dataset_id.endswith("-words") else dataset_id


def fetch_examples(db_path, dataset_id):
    prefix = dataset_prefix(dataset_id) + "-%"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT e.id, e.word_id, e.sentence, e.translation, e.difficulty, e.source, e.is_primary,
               w.rank, w.display_form
        FROM examples e
        JOIN words w ON w.id = e.word_id
        WHERE w.id LIKE ?
        ORDER BY w.rank, e.id
        """,
        (prefix,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def slot_for_example(example_id):
    if example_id.endswith("-ex1"):
        return 1
    if example_id.endswith("-ex2"):
        return 2
    return 3


def lower_after_prefix(translation):
    if not translation:
        return translation
    if translation.startswith("I "):
        return translation
    first = translation[0]
    if "A" <= first <= "Z":
        return first.lower() + translation[1:]
    return translation


def transform_row(row, dataset_id):
    sentence = row["sentence"]
    translation = row["translation"]
    difficulty = row["difficulty"]
    slot = slot_for_example(row["id"])
    original_length = clean_len(sentence)
    changed = False

    if original_length <= SHORT_THRESHOLDS[dataset_id]:
        prefix_zh, prefix_en = PREFIXES[dataset_id][(row["rank"] + slot) % len(PREFIXES[dataset_id])]
        sentence = prefix_zh + sentence
        translation = prefix_en + lower_after_prefix(translation)
        changed = True

    difficulty = max(difficulty, 2)
    new_length = clean_len(sentence)
    if dataset_id == "new-hsk-3-words":
        if changed and slot == 3:
            difficulty = max(difficulty, 3)
    elif dataset_id == "new-hsk-4-words":
        if slot == 3:
            difficulty = max(difficulty, 3)

    new_source = f"progression-stretch-{dataset_prefix(dataset_id)}" if changed or difficulty != row["difficulty"] else row["source"]

    return {
        "id": row["id"],
        "sentence": sentence,
        "translation": translation,
        "difficulty": difficulty,
        "source": new_source,
        "changed": changed or difficulty != row["difficulty"] or new_source != row["source"],
        "old_length": original_length,
        "new_length": new_length,
    }


def metric_summary(rows):
    lengths = [clean_len(row["sentence"]) for row in rows]
    diffs = [row["difficulty"] for row in rows]
    short_share = sum(1 for length in lengths if length <= 8) / len(lengths)
    return {
        "example_count": len(rows),
        "avg_chars": sum(lengths) / len(lengths),
        "avg_difficulty": sum(diffs) / len(diffs),
        "share_len_le_8": short_share,
    }


def preview(dataset_id, db_path):
    rows = fetch_examples(db_path, dataset_id)
    transformed = []
    changed = []
    for row in rows:
        item = transform_row(row, dataset_id)
        transformed.append({"sentence": item["sentence"], "difficulty": item["difficulty"]})
        if item["changed"] and len(changed) < 12:
            changed.append(
                {
                    "id": row["id"],
                    "old_sentence": row["sentence"],
                    "new_sentence": item["sentence"],
                    "old_translation": row["translation"],
                    "new_translation": item["translation"],
                    "old_difficulty": row["difficulty"],
                    "new_difficulty": item["difficulty"],
                }
            )

    before = metric_summary(rows)
    after = metric_summary(transformed)
    print(json.dumps({"dataset_id": dataset_id, "before": before, "after": after, "sample_changes": changed}, ensure_ascii=False, indent=2))


def apply(dataset_id, db_path):
    rows = fetch_examples(db_path, dataset_id)
    updates = [transform_row(row, dataset_id) for row in rows]
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("BEGIN")
        for update in updates:
            if not update["changed"]:
                continue
            conn.execute(
                """
                UPDATE examples
                SET sentence = ?, translation = ?, difficulty = ?, source = ?
                WHERE id = ?
                """,
                (
                    update["sentence"],
                    update["translation"],
                    update["difficulty"],
                    update["source"],
                    update["id"],
                ),
            )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    after_rows = fetch_examples(db_path, dataset_id)
    print(json.dumps({"dataset_id": dataset_id, "after": metric_summary(after_rows)}, ensure_ascii=False, indent=2))


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: stretch_hsk_progression.py preview-hsk3|apply-hsk3|preview-hsk4|apply-hsk4")

    command = sys.argv[1]
    if command == "preview-hsk3":
        preview("new-hsk-3-words", os.path.join(ROOT, "corpus-hsk-3.sqlite"))
    elif command == "apply-hsk3":
        apply("new-hsk-3-words", os.path.join(ROOT, "corpus-hsk-3.sqlite"))
    elif command == "preview-hsk4":
        preview("new-hsk-4-words", os.path.join(ROOT, "corpus-hsk-4.sqlite"))
    elif command == "apply-hsk4":
        apply("new-hsk-4-words", os.path.join(ROOT, "corpus-hsk-4.sqlite"))
    else:
        raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
