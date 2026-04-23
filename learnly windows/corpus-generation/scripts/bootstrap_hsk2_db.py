#!/usr/bin/env python3

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR = ROOT / "orchestrator.py"
EXTRACTOR = ROOT / "scripts" / "extract_new_hsk_word_list.py"
TARGET_DB = ROOT / "corpus-hsk-2.sqlite"
TARGET_RAW_PDF = ROOT / "data" / "raw" / "New-HSK-2-Word-List.pdf"
TARGET_SEEDS = ROOT / "data" / "processed" / "new-hsk-2-words-seeds.json"
HSK1_SEEDS = ROOT / "data" / "processed" / "new-hsk-1-words-seeds.json"
RUN_ROOT = ROOT / "runs" / "new-hsk-2"
PYTHON = sys.executable or "python"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def ensure_run_tree() -> None:
    for path in [
        RUN_ROOT / "batches",
        RUN_ROOT / "generated" / "generator-1",
        RUN_ROOT / "generated" / "generator-2",
        RUN_ROOT / "jobs",
        RUN_ROOT / "logs",
        RUN_ROOT / "meaning-reviews",
        RUN_ROOT / "raw",
    ]:
        path.mkdir(parents=True, exist_ok=True)


def create_batch_manifests(db_path: Path, dataset_id: str, seed_count: int, batch_size: int) -> None:
    for start_rank in range(1, seed_count + 1, batch_size):
        end_rank = min(start_rank + batch_size - 1, seed_count)
        output_file = RUN_ROOT / "batches" / f"batch-{start_rank:04d}-{end_rank:04d}.json"
        run(
            [
                PYTHON,
                str(ORCHESTRATOR),
                "--db-path",
                str(db_path),
                "export-generation-jobs",
                "--dataset-id",
                dataset_id,
                "--output-file",
                str(output_file),
                "--start-rank",
                str(start_rank),
                "--end-rank",
                str(end_rank),
                "--include-existing",
            ]
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap the separate New HSK 2 corpus database and run tree.")
    parser.add_argument("--source-pdf", default=str(TARGET_RAW_PDF))
    parser.add_argument("--db-path", default=str(TARGET_DB))
    parser.add_argument("--dataset-id", default="new-hsk-2-words")
    parser.add_argument("--batch-size", type=int, default=25)
    args = parser.parse_args()

    source_pdf = Path(args.source_pdf)
    db_path = Path(args.db_path)

    if not source_pdf.exists():
        raise FileNotFoundError(
            f"Source PDF not found: {source_pdf}. Pass --source-pdf with a local PDF path."
        )

    TARGET_RAW_PDF.parent.mkdir(parents=True, exist_ok=True)
    TARGET_SEEDS.parent.mkdir(parents=True, exist_ok=True)
    ensure_run_tree()

    shutil.copyfile(source_pdf, TARGET_RAW_PDF)
    run(
        [
            PYTHON,
            str(EXTRACTOR),
            "--pdf",
            str(TARGET_RAW_PDF),
            "--output",
            str(TARGET_SEEDS),
        ]
    )

    extracted_rows = json.loads(TARGET_SEEDS.read_text())
    seed_count = len(extracted_rows)

    run([PYTHON, str(ORCHESTRATOR), "--db-path", str(db_path), "init-db"])

    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(db_path),
            "register-source-dataset",
            "--dataset-id",
            "new-hsk-1-words",
            "--name",
            "New HSK 1 Words",
            "--lang",
            "zh",
            "--kind",
            "word-list",
            "--source-file",
            str(ROOT / "data" / "raw" / "New-HSK-1-Words.pdf"),
            "--source-label",
            "New HSK 1 PDF",
            "--metadata-json",
            json.dumps({"level": 1, "role": "support_lexicon"}, ensure_ascii=False),
        ]
    )
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(db_path),
            "register-source-dataset",
            "--dataset-id",
            args.dataset_id,
            "--name",
            "New HSK 2 Words",
            "--lang",
            "zh",
            "--kind",
            "word-list",
            "--source-file",
            str(TARGET_RAW_PDF),
            "--source-label",
            "New HSK 2 PDF",
            "--metadata-json",
            json.dumps({"level": 2, "role": "target_corpus"}, ensure_ascii=False),
        ]
    )

    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(db_path),
            "seed-source-translations",
            str(HSK1_SEEDS),
            "--dataset-id",
            "new-hsk-1-words",
        ]
    )
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(db_path),
            "seed-source-translations",
            str(TARGET_SEEDS),
            "--dataset-id",
            args.dataset_id,
        ]
    )

    create_batch_manifests(db_path, args.dataset_id, seed_count, args.batch_size)
    run(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(db_path),
            "coverage",
            "--dataset-id",
            args.dataset_id,
        ]
    )

    print(
        json.dumps(
            {
                "db_path": str(db_path),
                "dataset_id": args.dataset_id,
                "seed_count": seed_count,
                "run_root": str(RUN_ROOT),
                "seeds_file": str(TARGET_SEEDS),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
