#!/usr/bin/env python3

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(os.path.dirname(os.path.dirname(__file__)))
PYTHON = sys.executable
ORCHESTRATOR = ROOT / "orchestrator.py"
EXPORT_REVIEW = ROOT / "scripts" / "export_dataset_review_tsv.py"
DB_PATH = ROOT / "corpus-hsk-5.sqlite"
DATASET_ID = "new-hsk-5-words"
RUN_ROOT = ROOT / "runs" / "new-hsk-5"
BATCH_DIR = RUN_ROOT / "batches"
LOG_DIR = RUN_ROOT / "logs"
DEFAULT_MODEL = "gpt-5.4"

GENERATOR_CONFIGS = [
    {
        "name": "generator-1",
        "prompt_file": ROOT / "agents" / "generator-1-concrete-scenes.md",
        "output_dir": RUN_ROOT / "generated" / "generator-1",
        "source": "generator-1",
    },
    {
        "name": "generator-2",
        "prompt_file": ROOT / "agents" / "generator-2-broader-scenes.md",
        "output_dir": RUN_ROOT / "generated" / "generator-2",
        "source": "generator-2",
    },
    {
        "name": "generator-3",
        "prompt_file": ROOT / "agents" / "generator-3-varied-scenes.md",
        "output_dir": RUN_ROOT / "generated" / "generator-3",
        "source": "generator-3",
    },
]

PROMPT_TEMPLATE = """You are {generator_name} for the HSK5 corpus in {root}.
You are not alone in the codebase. Do not revert anyone else's work, and only write your owned output files.

Ownership:
- Read the standing rules in {corpus_rules}, {agents_rules}, {orchestrator_prompt}, and {agent_prompt}.
- Your batch manifest is:
  - {job_path}
- Write the final payload JSONL file to:
  - {output_path}
- Do not ingest into SQLite yourself. Only generate valid final JSONL files.
- Use the batch manifest as your working source of truth for this batch.
- Do not inspect completed HSK corpora or run broad workspace/database exploration unless a specific source row is ambiguous or the validator flags a concrete problem.
- Start drafting output immediately after reading the required files; do not spend time on unrelated audits or comparison studies.

Requirements:
- Target dataset: new-hsk-5-words in {db_path}.
- Use only New HSK 1 + 2 + 3 + 4 + 5 vocabulary in every Chinese sentence.
- HSK5 sentences should be only slightly harder than HSK4, usually 9-19 Chinese words, concrete, natural, and easy to picture.
- Definitions are first-class: make primary gloss, secondary glosses, and notes learner-clear and complete for the important common meanings.
- Give grammar particles and function words especially careful POS, gloss, and notes.
- Treat the seed glosses and notes as the baseline; refine them when needed for learner clarity and completeness, but do not turn the batch into a dictionary research pass.
- Exactly 3 examples per word.
- Keep the most important meaning definitely represented.
- Use different strong common meanings only when they are real; do not force obscure senses.
- Each example needs meaning_en, sentence, translation, difficulty, source, and is_primary.
- Match the final payload shape expected by orchestrator.py validate-jsonl / ingest-jsonl.
- Use source value {source} on your examples.
- Example ids must be {{word_id}}-ex1, {{word_id}}-ex2, and {{word_id}}-ex3.
- Keep word ids, ranks, and pronunciation aligned with the manifest.
- `word.lemma` and `word.display_form` should use the manifest's normalized `generation_form` unless the raw display form is already the correct visible headword.
- Validate the finished batch with: {validate_cmd}
- If validation fails, fix the batch and revalidate before finishing.

Quality bar:
- Natural, concrete, learner-safe, and only slightly above HSK4.
- English translations must be precise, clean, and fully aligned to the Chinese.
- No duplicate examples within a word.
- Keep the target word visually obvious in the sentence.

Return only by writing valid JSONL content to the output file. When you are done, reply with a short summary only.
"""


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=True)


def run_passthrough(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def batch_stem(path: Path) -> str:
    return path.stem


def sorted_batch_paths() -> list[Path]:
    return sorted(BATCH_DIR.glob("batch-*.json"))


def prepare_batches(batch_size: int) -> None:
    coverage = run(
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
    seed_count = json.loads(coverage.stdout)["seed_count"]
    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for start_rank in range(1, seed_count + 1, batch_size):
        end_rank = min(start_rank + batch_size - 1, seed_count)
        output_file = BATCH_DIR / f"batch-{start_rank:04d}-{end_rank:04d}.json"
        run_passthrough(
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


def batch_is_ready(output_path: Path) -> bool:
    if not output_path.exists():
        return False
    try:
        run(
            [
                PYTHON,
                str(ORCHESTRATOR),
                "--db-path",
                str(DB_PATH),
                "validate-jsonl",
                str(output_path),
            ]
        )
    except subprocess.CalledProcessError:
        return False
    return True


def validate_and_ingest(output_path: Path) -> None:
    run_passthrough(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "validate-jsonl",
            str(output_path),
        ]
    )
    run_passthrough(
        [
            PYTHON,
            str(ORCHESTRATOR),
            "--db-path",
            str(DB_PATH),
            "ingest-jsonl",
            str(output_path),
        ]
    )


def launch_batch(job_path: Path, output_path: Path, config: dict, model: str) -> subprocess.Popen[str]:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / f"{output_path.stem}.log"
    summary_path = LOG_DIR / f"{output_path.stem}.summary.txt"
    validate_cmd = f"{PYTHON} {ORCHESTRATOR} --db-path {DB_PATH} validate-jsonl {output_path}"
    prompt = PROMPT_TEMPLATE.format(
        generator_name=config["name"],
        root=ROOT,
        corpus_rules=ROOT / "corpus generation.md",
        agents_rules=ROOT / "AGENTS.md",
        orchestrator_prompt=ROOT / "ORCHESTRATOR_PROMPT.md",
        agent_prompt=config["prompt_file"],
        job_path=job_path,
        output_path=output_path,
        db_path=DB_PATH,
        source=config["source"],
        validate_cmd=validate_cmd,
    )
    log_handle = log_path.open("w")
    cmd = [
        "codex",
        "exec",
        "--model",
        model,
        "--dangerously-bypass-approvals-and-sandbox",
        "--skip-git-repo-check",
        "-C",
        str(ROOT),
        "-o",
        str(summary_path),
        "-",
    ]
    proc = subprocess.Popen(
        cmd,
        cwd=ROOT,
        stdin=subprocess.PIPE,
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        text=True,
    )
    assert proc.stdin is not None
    proc.stdin.write(prompt)
    proc.stdin.close()
    return proc


def chunked(items: list[tuple[Path, Path, dict]], size: int) -> list[list[tuple[Path, Path, dict]]]:
    return [items[index : index + size] for index in range(0, len(items), size)]


def show_coverage() -> None:
    coverage = run(
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
    print(coverage.stdout.strip(), flush=True)


def audit_dataset(audit_name: str, notes: str) -> None:
    run_passthrough(
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


def generate(batch_limit: int | None, audit_every_rounds: int, model: str) -> None:
    batch_paths = sorted_batch_paths()
    if not batch_paths:
        raise SystemExit("No batch manifests found. Run prepare-batches first.")
    if batch_limit is not None:
        batch_paths = batch_paths[:batch_limit]

    assignments: list[tuple[Path, Path, dict]] = []
    for index, job_path in enumerate(batch_paths):
        config = GENERATOR_CONFIGS[index % len(GENERATOR_CONFIGS)]
        output_path = config["output_dir"] / f"{batch_stem(job_path)}.jsonl"
        assignments.append((job_path, output_path, config))

    rounds = chunked(assignments, len(GENERATOR_CONFIGS))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    for round_index, round_assignments in enumerate(rounds, start=1):
        print(f"Starting HSK5 round {round_index}/{len(rounds)}", flush=True)
        running: list[tuple[Path, subprocess.Popen[str]]] = []
        for job_path, output_path, config in round_assignments:
            if batch_is_ready(output_path):
                print(f"Skipping existing valid batch {output_path.name}", flush=True)
                validate_and_ingest(output_path)
                continue
            running.append((output_path, launch_batch(job_path, output_path, config, model)))

        for output_path, proc in running:
            return_code = proc.wait()
            if return_code != 0:
                raise SystemExit(f"Codex batch failed for {output_path} with exit code {return_code}")
            validate_and_ingest(output_path)
            print(f"Validated and ingested {output_path.name}", flush=True)

        show_coverage()

        if audit_every_rounds > 0 and round_index % audit_every_rounds == 0:
            audit_name = f"hsk5-progress-{timestamp}-r{round_index:02d}"
            audit_dataset(
                audit_name=audit_name,
                notes=f"Periodic HSK5 progress audit after round {round_index}.",
            )


def export_review(output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    run_passthrough(
        [
            PYTHON,
            str(EXPORT_REVIEW),
            "--db-path",
            str(DB_PATH),
            "--dataset-id",
            DATASET_ID,
            "--output",
            str(output),
        ]
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Helper commands for the separate New HSK 5 corpus pipeline.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare-batches")
    prepare.add_argument("--batch-size", type=int, default=25)

    audit = subparsers.add_parser("audit")
    audit.add_argument("--audit-name", default="manual-hsk5-audit")
    audit.add_argument("--notes", default="")

    generate_parser = subparsers.add_parser("generate")
    generate_parser.add_argument("--batch-limit", type=int)
    generate_parser.add_argument("--audit-every-rounds", type=int, default=4)
    generate_parser.add_argument("--model", default=DEFAULT_MODEL)

    export_parser = subparsers.add_parser("export-review")
    export_parser.add_argument(
        "--output",
        default=str(RUN_ROOT / "reviews" / "hsk5-review-input.tsv"),
    )

    subparsers.add_parser("coverage")

    args = parser.parse_args()

    if args.command == "prepare-batches":
        prepare_batches(args.batch_size)
    elif args.command == "audit":
        audit_dataset(args.audit_name, args.notes)
    elif args.command == "generate":
        generate(args.batch_limit, args.audit_every_rounds, args.model)
    elif args.command == "export-review":
        export_review(Path(args.output))
    elif args.command == "coverage":
        show_coverage()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(exc.stdout or "")
        sys.stderr.write(exc.stderr or "")
        raise
