#!/usr/bin/env python3

import json
import os
import sqlite3
import sys


ROOT = os.getcwd()
if os.path.basename(ROOT) != "corpus-generation":
    ROOT = "/Users/moi/Desktop/business/learnly/corpus-generation"

GENERATOR_FILE = os.path.join(
    ROOT,
    "runs",
    "new-hsk-4",
    "generated",
    "generator-2",
    "generate_hsk4_batch_clean.py",
)

FLOORS = {
    "new-hsk-3-words": {"avg_chars": 9.4, "avg_difficulty": 2.0, "max_share_len_le_8": 0.45},
    "new-hsk-4-words": {"avg_chars": 10.0, "avg_difficulty": 2.1, "max_share_len_le_8": 0.30},
}


def load_generator():
    ns = {"__name__": "__not_main__", "__file__": GENERATOR_FILE}
    with open(GENERATOR_FILE, encoding="utf-8") as handle:
        code = handle.read()
    exec(compile(code, GENERATOR_FILE, "exec"), ns)
    return ns


def dataset_prefix(dataset_id):
    return dataset_id[:-len("-words")] if dataset_id.endswith("-words") else dataset_id


def fetch_rows(db_path, dataset_id, min_rank=None, max_rank=None):
    prefix = dataset_prefix(dataset_id) + "-%"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    sql = """
        SELECT id AS word_id, rank, display_form, pronunciation, pos, primary_gloss, secondary_glosses_json
        FROM words
        WHERE id LIKE ?
    """
    params = [prefix]
    if min_rank is not None:
        sql += " AND rank >= ?"
        params.append(min_rank)
    if max_rank is not None:
        sql += " AND rank <= ?"
        params.append(max_rank)
    sql += " ORDER BY rank"
    rows = []
    for row in conn.execute(sql, params):
        item = dict(row)
        item["dataset_id"] = dataset_id
        item["secondary_glosses"] = json.loads(item.pop("secondary_glosses_json") or "[]")
        rows.append(item)
    conn.close()
    return rows


def chunked(items, size):
    for index in range(0, len(items), size):
        yield items[index:index + size]


def metric_summary(payloads, generator_ns):
    sentences = []
    difficulties = []
    for payload in payloads:
        for example in payload["examples"]:
            sentences.append(example["sentence"])
            difficulties.append(example["difficulty"])
    if not sentences:
        return {"count": 0, "avg_chars": 0.0, "avg_difficulty": 0.0, "share_len_le_8": 0.0}
    cleaned_lengths = [len(generator_ns["clean_sentence_for_segmentation"](sentence)) for sentence in sentences]
    share = sum(1 for length in cleaned_lengths if length <= 8) / len(cleaned_lengths)
    return {
        "count": len(sentences),
        "avg_chars": sum(cleaned_lengths) / len(cleaned_lengths),
        "avg_difficulty": sum(difficulties) / len(difficulties),
        "share_len_le_8": share,
    }


def check_floors(payloads, dataset_id, generator_ns):
    summary = metric_summary(payloads, generator_ns)
    floors = FLOORS[dataset_id]
    if summary["avg_chars"] < floors["avg_chars"]:
        raise RuntimeError(
            f"{dataset_id}: batch average chars {summary['avg_chars']:.2f} below floor {floors['avg_chars']:.2f}"
        )
    if summary["avg_difficulty"] < floors["avg_difficulty"]:
        raise RuntimeError(
            f"{dataset_id}: batch average difficulty {summary['avg_difficulty']:.2f} below floor {floors['avg_difficulty']:.2f}"
        )
    if summary["share_len_le_8"] > floors["max_share_len_le_8"]:
        raise RuntimeError(
            f"{dataset_id}: batch short-sentence share {summary['share_len_le_8']:.3f} above cap {floors['max_share_len_le_8']:.3f}"
        )
    return summary


def build_payloads(rows, db_path, source_name, generator_ns):
    if not rows:
        return []
    lexicon = generator_ns["load_lexicon"](db_path, rows[0]["dataset_id"])
    payloads = []
    for row in rows:
        payloads.append(generator_ns["build_payload"](row, lexicon, source_name))
    return payloads


def upsert_payloads(db_path, payloads):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("BEGIN")
        for payload in payloads:
            word = payload["word"]
            glosses = payload["glosses"]
            translation_map = {item["example_id"]: item["translation"] for item in payload["example_translations"]}
            conn.execute(
                """
                INSERT INTO words (
                  id, lang, lemma, display_form, pos, rank, pronunciation,
                  primary_gloss, secondary_glosses_json, notes, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'complete')
                ON CONFLICT(id) DO UPDATE SET
                  lang = excluded.lang,
                  lemma = excluded.lemma,
                  display_form = excluded.display_form,
                  pos = excluded.pos,
                  rank = excluded.rank,
                  pronunciation = excluded.pronunciation,
                  primary_gloss = excluded.primary_gloss,
                  secondary_glosses_json = excluded.secondary_glosses_json,
                  notes = excluded.notes,
                  status = 'complete',
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    word["id"],
                    word["lang"],
                    word["lemma"],
                    word["display_form"],
                    word["pos"],
                    word["rank"],
                    word["pronunciation"],
                    glosses["primary_gloss"],
                    json.dumps(glosses["secondary_glosses"], ensure_ascii=False),
                    glosses["notes"],
                ),
            )
            conn.execute("DELETE FROM examples WHERE word_id = ?", (word["id"],))
            for example in payload["examples"]:
                conn.execute(
                    """
                    INSERT INTO examples (id, word_id, sentence, translation, meaning_en, difficulty, source, is_primary)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        example["id"],
                        word["id"],
                        example["sentence"],
                        translation_map[example["id"]],
                        example["meaning_en"],
                        example["difficulty"],
                        example["source"],
                        1 if example["is_primary"] else 0,
                    ),
                )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def preview(dataset_id, db_path, min_rank=None, max_rank=None, batch_size=25):
    generator_ns = load_generator()
    rows = fetch_rows(db_path, dataset_id, min_rank=min_rank, max_rank=max_rank)[:batch_size]
    payloads = build_payloads(rows, db_path, f"preview-{dataset_prefix(dataset_id)}", generator_ns)
    summary = check_floors(payloads, dataset_id, generator_ns)
    print(json.dumps({"dataset_id": dataset_id, "rows": len(rows), "metrics": summary}, ensure_ascii=False, indent=2))
    for payload in payloads[:3]:
        print(json.dumps(payload, ensure_ascii=False, indent=2))


def apply(dataset_id, db_path, source_name, min_rank=None, max_rank=None, batch_size=25):
    generator_ns = load_generator()
    rows = fetch_rows(db_path, dataset_id, min_rank=min_rank, max_rank=max_rank)
    if not rows:
        raise RuntimeError(f"No rows found for {dataset_id}")

    applied = 0
    batch_summaries = []
    for batch in chunked(rows, batch_size):
        payloads = build_payloads(batch, db_path, source_name, generator_ns)
        summary = check_floors(payloads, dataset_id, generator_ns)
        upsert_payloads(db_path, payloads)
        applied += len(batch)
        batch_summaries.append(summary)
        print(
            json.dumps(
                {
                    "dataset_id": dataset_id,
                    "batch_start_rank": batch[0]["rank"],
                    "batch_end_rank": batch[-1]["rank"],
                    "word_count": len(batch),
                    "metrics": summary,
                },
                ensure_ascii=False,
            )
        )
    print(
        json.dumps(
            {
                "dataset_id": dataset_id,
                "applied_words": applied,
                "db_path": db_path,
                "batch_count": len(batch_summaries),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


def main():
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: repair_hsk_progression.py "
            "preview-hsk3|apply-hsk3|preview-hsk4|apply-hsk4"
        )

    command = sys.argv[1]
    if command == "preview-hsk3":
        preview("new-hsk-3-words", os.path.join(ROOT, "corpus-hsk-3.sqlite"))
    elif command == "apply-hsk3":
        apply(
            "new-hsk-3-words",
            os.path.join(ROOT, "corpus-hsk-3.sqlite"),
            "progression-repair-hsk3",
        )
    elif command == "preview-hsk4":
        preview("new-hsk-4-words", os.path.join(ROOT, "corpus-hsk-4.sqlite"), min_rank=201)
    elif command == "apply-hsk4":
        apply(
            "new-hsk-4-words",
            os.path.join(ROOT, "corpus-hsk-4.sqlite"),
            "progression-repair-hsk4",
            min_rank=201,
        )
    else:
        raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
