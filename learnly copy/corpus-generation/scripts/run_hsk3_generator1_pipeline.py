#!/usr/bin/env python3

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR = ROOT / "orchestrator.py"
DB_PATH = ROOT / "corpus-hsk-3.sqlite"
DATASET_ID = "new-hsk-3-words"
RUN_ROOT = ROOT / "runs" / "new-hsk-3"
JOB_DIR = RUN_ROOT / "batches"
OUT_DIR = RUN_ROOT / "generated" / "generator-1"
LOG_DIR = RUN_ROOT / "logs"

BATCHES = [
    ("batch-0001-0025.json", "batch-0001-0025.jsonl"),
    ("batch-0026-0050.json", "batch-0026-0050.jsonl"),
    ("batch-0051-0075.json", "batch-0051-0075.jsonl"),
    ("batch-0076-0100.json", "batch-0076-0100.jsonl"),
    ("batch-0101-0125.json", "batch-0101-0125.jsonl"),
    ("batch-0126-0150.json", "batch-0126-0150.jsonl"),
    ("batch-0151-0175.json", "batch-0151-0175.jsonl"),
    ("batch-0176-0200.json", "batch-0176-0200.jsonl"),
    ("batch-0201-0225.json", "batch-0201-0225.jsonl"),
    ("batch-0226-0250.json", "batch-0226-0250.jsonl"),
    ("batch-0251-0275.json", "batch-0251-0275.jsonl"),
    ("batch-0276-0300.json", "batch-0276-0300.jsonl"),
    ("batch-0301-0325.json", "batch-0301-0325.jsonl"),
]

PROMPT_TEMPLATE = """You are generator-1 for the HSK3 corpus in {root}.
You are not alone in the codebase. Do not revert anyone else’s work, and only write your owned output files.

Ownership:
- Read the standing rules in {corpus_rules}, {agents_rules}, {orchestrator_prompt}, and {agent_prompt}.
- Your batch manifest is:
  - {job_path}
- Write the final payload JSONL file to:
  - {output_path}
- Do not ingest into SQLite yourself. Only generate valid final JSONL files.

Requirements:
- Target dataset: new-hsk-3-words in {db_path}.
- Use only New HSK 1 + 2 + 3 vocabulary in every Chinese sentence.
- HSK3 sentences should be only slightly harder than HSK2, not much harder.
- Glosses must be easy to understand and complete enough to include important common meanings.
- Exactly 3 examples per word.
- Keep the most important meaning definitely represented.
- Each example needs meaning_en, sentence, translation, difficulty, source, and is_primary.
- Match the final payload shape expected by orchestrator.py validate-jsonl / ingest-jsonl.
- Use source value generator-1 on your examples.
- Validate the finished batch with: python3 orchestrator.py --db-path corpus-hsk-3.sqlite validate-jsonl {output_path}
- If validation fails, fix the batch and revalidate before finishing.

Quality bar:
- Natural, concrete, learner-safe, slightly above HSK2 only.
- English translations must be precise and clean.
- No duplicate examples within a word.

Return only valid JSONL content in the output file.
"""


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=True)


def batch_is_ready(output_path: Path) -> bool:
    if not output_path.exists():
        return False
    try:
        run(["python3", "orchestrator.py", "--db-path", str(DB_PATH), "validate-jsonl", str(output_path)])
    except subprocess.CalledProcessError:
        return False
    return True


def launch_batch(job_path: Path, output_path: Path) -> subprocess.Popen[str]:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    stem = output_path.stem
    log_path = LOG_DIR / f"{stem}.log"
    summary_path = LOG_DIR / f"{stem}.summary.txt"
    prompt = PROMPT_TEMPLATE.format(
        root=ROOT,
        corpus_rules=ROOT / "corpus generation.md",
        agents_rules=ROOT / "AGENTS.md",
        orchestrator_prompt=ROOT / "ORCHESTRATOR_PROMPT.md",
        agent_prompt=ROOT / "agents" / "generator-1-concrete-scenes.md",
        job_path=job_path,
        output_path=output_path,
        db_path=DB_PATH,
    )
    log_handle = log_path.open("w")
    cmd = [
        "codex",
        "exec",
        "--model",
        "gpt-5.4",
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


def validate_and_ingest(output_path: Path) -> None:
    run(["python3", "orchestrator.py", "--db-path", str(DB_PATH), "validate-jsonl", str(output_path)])
    run(["python3", "orchestrator.py", "--db-path", str(DB_PATH), "ingest-jsonl", str(output_path)])


def main() -> None:
    parser = argparse.ArgumentParser(description="Run generator-1 for the first HSK3 corpus batches.")
    parser.add_argument("--batch-limit", type=int, default=len(BATCHES))
    args = parser.parse_args()

    for batch_index, (job_name, out_name) in enumerate(BATCHES[: args.batch_limit], start=1):
        job_path = JOB_DIR / job_name
        output_path = OUT_DIR / out_name
        if batch_is_ready(output_path):
            print(f"Skipping existing valid batch {out_name}", flush=True)
            validate_and_ingest(output_path)
            continue

        print(f"Starting batch {batch_index}/{args.batch_limit}: {out_name}", flush=True)
        proc = launch_batch(job_path, output_path)
        return_code = proc.wait()
        if return_code != 0:
            raise SystemExit(f"Codex batch failed for {output_path} with exit code {return_code}")
        validate_and_ingest(output_path)
        print(f"Validated and ingested {out_name}", flush=True)

        coverage = run(["python3", "orchestrator.py", "--db-path", str(DB_PATH), "coverage", "--dataset-id", DATASET_ID])
        print(coverage.stdout.strip(), flush=True)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(exc.stdout or "")
        sys.stderr.write(exc.stderr or "")
        raise
