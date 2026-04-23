#!/usr/bin/env python3

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR = ROOT / "orchestrator.py"
DB_PATH = ROOT / "corpus-hsk-2.sqlite"
DATASET_ID = "new-hsk-2-words"
RUN_ROOT = ROOT / "runs" / "new-hsk-2"
BATCH_DIR = RUN_ROOT / "batches"
RAW_DIR = RUN_ROOT / "raw"
PYTHON = sys.executable or "python"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def batch_stem(start_rank: int, end_rank: int) -> str:
    return f"batch-{start_rank:04d}-{end_rank:04d}"


def prepare_batches(batch_size: int) -> None:
    coverage = subprocess.run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "coverage",
            "--dataset-id",
            DATASET_ID,
        ],
        cwd=ROOT,
        check=True,
        text=True,
        capture_output=True,
    )
    import json

    seed_count = json.loads(coverage.stdout)["seed_count"]
    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for start_rank in range(1, seed_count + 1, batch_size):
        end_rank = min(start_rank + batch_size - 1, seed_count)
        output_file = BATCH_DIR / f"{batch_stem(start_rank, end_rank)}.json"
        run(
            [
                PYTHON,
                str(ORCHESTRATOR),
                "--db-path",
                str(DB_PATH),
                "export-generation-jobs",
                "--dataset-id",
                DATASET_ID,
                "--output-file",
                str(output_file),
                "--start-rank",
                str(start_rank),
                "--end-rank",
                str(end_rank),
                "--include-existing",
            ]
        )


def merge_batch(start_rank: int, end_rank: int) -> None:
    stem = batch_stem(start_rank, end_rank)
    g1_file = RAW_DIR / f"g1-{stem}.json"
    g2_file = RAW_DIR / f"g2-{stem}.json"
    if not g1_file.exists() or not g2_file.exists():
        raise SystemExit(f"Missing raw batch files: {g1_file} and/or {g2_file}")
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "merge-agent-batch",
            "--dataset-id",
            DATASET_ID,
            "--generator1-file",
            str(g1_file),
            "--generator2-file",
            str(g2_file),
        ]
    )
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "coverage",
            "--dataset-id",
            DATASET_ID,
        ]
    )


def audit_dataset(audit_name: str, notes: str) -> None:
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "audit-dataset",
            "--dataset-id",
            DATASET_ID,
            "--audit-name",
            audit_name,
            "--notes",
            notes,
        ]
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Permanent-agent helper script for the separate New HSK 2 corpus pipeline.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare-batches")
    prepare.add_argument("--batch-size", type=int, default=25)

    merge = subparsers.add_parser("merge-batch")
    merge.add_argument("--start-rank", type=int, required=True)
    merge.add_argument("--end-rank", type=int, required=True)

    audit = subparsers.add_parser("audit")
    audit.add_argument("--audit-name", default="manual-hsk2-audit")
    audit.add_argument("--notes", default="")

    subparsers.add_parser("coverage")

    args = parser.parse_args()

    if args.command == "prepare-batches":
        prepare_batches(args.batch_size)
    elif args.command == "merge-batch":
        merge_batch(args.start_rank, args.end_rank)
    elif args.command == "audit":
        audit_dataset(args.audit_name, args.notes)
    elif args.command == "coverage":
        run(
            [
                PYTHON,
                str(ORCHESTRATOR),
                "--db-path",
                str(DB_PATH),
                "coverage",
                "--dataset-id",
                DATASET_ID,
            ]
        )


if __name__ == "__main__":
    main()
