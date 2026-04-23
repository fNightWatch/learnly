#!/usr/bin/env python3

import json
import os
import sqlite3
from typing import Any


ROOT = "/Users/moi/Desktop/business/learnly/corpus-generation"
DB_PATH = os.path.join(ROOT, "corpus-hsk-3.sqlite")
DATASET_ID = "new-hsk-3-words"
OUT_ROOT = os.path.join(ROOT, "runs", "new-hsk-3", "parallel")
OUT_BATCH_DIR = os.path.join(OUT_ROOT, "batches")
OUT_MANIFEST = os.path.join(OUT_ROOT, "batch-plan.json")
AGENT_COUNT = 10


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def dataset_word_prefix(dataset_id: str) -> str:
    if dataset_id.endswith("-words"):
        return dataset_id[: -len("-words")]
    return dataset_id.replace("_", "-")


def build_word_id(dataset_id: str, rank: int) -> str:
    return f"{dataset_word_prefix(dataset_id)}-{rank:04d}"


def load_missing_jobs() -> list[dict[str, Any]]:
    with connect() as conn:
        seed_rows = conn.execute(
            """
            SELECT dataset_id, rank, display_form, pronunciation, pos,
                   primary_gloss, secondary_glosses_json, notes
            FROM source_translation_seeds
            WHERE dataset_id = ?
            ORDER BY rank
            """,
            (DATASET_ID,),
        ).fetchall()
        existing = {
            row["id"]
            for row in conn.execute(
                "SELECT id FROM words WHERE id LIKE ?",
                (f"{dataset_word_prefix(DATASET_ID)}-%",),
            ).fetchall()
        }

    jobs: list[dict[str, Any]] = []
    for row in seed_rows:
        word_id = build_word_id(row["dataset_id"], row["rank"])
        if word_id in existing:
            continue
        jobs.append(
            {
                "dataset_id": row["dataset_id"],
                "word_id": word_id,
                "rank": row["rank"],
                "display_form": row["display_form"],
                "lemma": row["display_form"],
                "generation_form": row["display_form"],
                "pronunciation": row["pronunciation"],
                "pos": row["pos"],
                "primary_gloss": row["primary_gloss"],
                "secondary_glosses": json.loads(row["secondary_glosses_json"]),
                "notes": row["notes"],
            }
        )
    return jobs


def split_jobs_evenly(jobs: list[dict[str, Any]], groups: int) -> list[list[dict[str, Any]]]:
    total = len(jobs)
    base = total // groups
    extra = total % groups
    chunks: list[list[dict[str, Any]]] = []
    index = 0
    for group_index in range(groups):
        size = base + (1 if group_index < extra else 0)
        chunks.append(jobs[index : index + size])
        index += size
    return chunks


def summarize_ranks(jobs: list[dict[str, Any]]) -> list[list[int]]:
    if not jobs:
        return []
    ranks = [job["rank"] for job in jobs]
    ranges: list[list[int]] = []
    start = end = ranks[0]
    for rank in ranks[1:]:
        if rank == end + 1:
            end = rank
        else:
            ranges.append([start, end])
            start = end = rank
    ranges.append([start, end])
    return ranges


def main() -> None:
    os.makedirs(OUT_BATCH_DIR, exist_ok=True)
    jobs = load_missing_jobs()
    chunks = split_jobs_evenly(jobs, AGENT_COUNT)

    plan: dict[str, Any] = {
        "dataset_id": DATASET_ID,
        "db_path": DB_PATH,
        "job_count": len(jobs),
        "agent_count": AGENT_COUNT,
        "batches": [],
    }

    for i, chunk in enumerate(chunks, start=1):
        label = f"generator-{i:02d}"
        batch_path = os.path.join(OUT_BATCH_DIR, f"{label}.json")
        with open(batch_path, "w", encoding="utf-8") as handle:
            json.dump(chunk, handle, ensure_ascii=False, indent=2)
            handle.write("\n")

        if chunk:
            plan["batches"].append(
                {
                    "label": label,
                    "job_file": batch_path,
                    "job_count": len(chunk),
                    "first_rank": chunk[0]["rank"],
                    "last_rank": chunk[-1]["rank"],
                    "rank_ranges": summarize_ranks(chunk),
                }
            )
        else:
            plan["batches"].append(
                {
                    "label": label,
                    "job_file": batch_path,
                    "job_count": 0,
                    "first_rank": None,
                    "last_rank": None,
                    "rank_ranges": [],
                }
            )

    with open(OUT_MANIFEST, "w", encoding="utf-8") as handle:
        json.dump(plan, handle, ensure_ascii=False, indent=2)
        handle.write("\n")

    print(json.dumps(plan, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
