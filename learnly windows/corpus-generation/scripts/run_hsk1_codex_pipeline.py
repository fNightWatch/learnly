#!/usr/bin/env python3

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
JOBS_DIR = ROOT / "runs" / "new-hsk-1" / "jobs"
GEN1_DIR = ROOT / "runs" / "new-hsk-1" / "generated" / "generator-1"
GEN2_DIR = ROOT / "runs" / "new-hsk-1" / "generated" / "generator-2"
LOG_DIR = ROOT / "runs" / "new-hsk-1" / "logs"
PYTHON = sys.executable or "python"


BATCHES = [
    (
        JOBS_DIR / "generator-1-batch-0004-0050.json",
        GEN1_DIR / "generator-1-batch-0004-0050.jsonl",
        "generator-1",
    ),
    (
        JOBS_DIR / "generator-1-batch-0051-0100.json",
        GEN1_DIR / "generator-1-batch-0051-0100.jsonl",
        "generator-1",
    ),
    (
        JOBS_DIR / "generator-1-batch-0101-0150.json",
        GEN1_DIR / "generator-1-batch-0101-0150.jsonl",
        "generator-1",
    ),
    (
        JOBS_DIR / "generator-1-batch-0151-0200.json",
        GEN1_DIR / "generator-1-batch-0151-0200.jsonl",
        "generator-1",
    ),
    (
        JOBS_DIR / "generator-1-batch-0201-0250.json",
        GEN1_DIR / "generator-1-batch-0201-0250.jsonl",
        "generator-1",
    ),
    (
        JOBS_DIR / "generator-2-batch-0251-0300.json",
        GEN2_DIR / "generator-2-batch-0251-0300.jsonl",
        "generator-2",
    ),
    (
        JOBS_DIR / "generator-2-batch-0301-0350.json",
        GEN2_DIR / "generator-2-batch-0301-0350.jsonl",
        "generator-2",
    ),
    (
        JOBS_DIR / "generator-2-batch-0351-0400.json",
        GEN2_DIR / "generator-2-batch-0351-0400.jsonl",
        "generator-2",
    ),
    (
        JOBS_DIR / "generator-2-batch-0401-0450.json",
        GEN2_DIR / "generator-2-batch-0401-0450.jsonl",
        "generator-2",
    ),
    (
        JOBS_DIR / "generator-2-batch-0451-0500.json",
        GEN2_DIR / "generator-2-batch-0451-0500.jsonl",
        "generator-2",
    ),
]


PAIR_ORDER = [
    (BATCHES[0], BATCHES[5]),
    (BATCHES[1], BATCHES[6]),
    (BATCHES[2], BATCHES[7]),
    (BATCHES[3], BATCHES[8]),
    (BATCHES[4], BATCHES[9]),
]


PROMPT_TEMPLATE = """You are a corpus-generation worker in the workspace {root}.

Read this manifest:
- {job_path}

Write this JSONL file:
- {output_path}

Requirements:
- Read every job row and write one final payload JSON object per line.
- Use the final payload shape already present in tmp_new_hsk_1_0001.json and tmp_new_hsk_1_0002.json.
- Keep word ids, ranks, and pronunciations aligned with the manifest.
- `word.lang` must be `zh`.
- `word.lemma` and `word.display_form` should use the manifest's normalized `generation_form`.
- Refine `pos` only when obvious; otherwise keep the seed value.
- Keep the seed primary gloss unless clearly wrong.
- Secondary glosses may be empty if uncertain.
- Notes should be brief and learner-friendly.
- Produce exactly 3 examples and 3 matching translations per word.
- Each Chinese sentence must be simplified Chinese, natural, 5-12 words, concrete, and use the target word in its primary meaning.
- Use distinct scenarios.
- Example ids must be `{{word_id}}-ex1`, `-ex2`, and `-ex3`.
- Set `source` to `{source}` on every example.
- Exactly one example must have `is_primary: true`.
- Use conservative difficulty values 1, 2, or 3.
- Overwrite the output file with only valid JSONL content for this batch.
- Validate the JSONL before finishing.

When done, reply with a short summary only.
"""


def run_cmd(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=True)


def validate_and_ingest(output_path: Path) -> None:
    run_cmd([PYTHON, "orchestrator.py", "validate-jsonl", str(output_path)])
    run_cmd([PYTHON, "orchestrator.py", "ingest-jsonl", str(output_path)])


def batch_is_ready(output_path: Path) -> bool:
    if not output_path.exists():
        return False
    try:
        run_cmd([PYTHON, "orchestrator.py", "validate-jsonl", str(output_path)])
    except subprocess.CalledProcessError:
        return False
    return True


def launch_batch(job_path: Path, output_path: Path, source: str) -> subprocess.Popen[str]:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    prompt = PROMPT_TEMPLATE.format(
        root=ROOT,
        job_path=job_path,
        output_path=output_path,
        source=source,
    )
    stem = output_path.stem
    log_path = LOG_DIR / f"{stem}.log"
    summary_path = LOG_DIR / f"{stem}.summary.txt"
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the HSK-1 corpus pipeline with two parallel Codex workers.")
    parser.add_argument("--pair-limit", type=int, default=len(PAIR_ORDER))
    args = parser.parse_args()

    for pair_index, pair in enumerate(PAIR_ORDER[: args.pair_limit], start=1):
        print(f"Starting pair {pair_index}/{len(PAIR_ORDER)}", flush=True)
        running = []
        for job_path, output_path, source in pair:
            if batch_is_ready(output_path):
                print(f"Skipping existing valid batch {output_path.name}", flush=True)
                validate_and_ingest(output_path)
                continue
            running.append((output_path, launch_batch(job_path, output_path, source)))

        for output_path, proc in running:
            return_code = proc.wait()
            if return_code != 0:
                raise SystemExit(f"Codex batch failed for {output_path} with exit code {return_code}")
            validate_and_ingest(output_path)
            print(f"Validated and ingested {output_path.name}", flush=True)

        coverage = run_cmd([PYTHON, "orchestrator.py", "coverage", "--dataset-id", "new-hsk-1-words"])
        print(coverage.stdout.strip(), flush=True)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(exc.stdout or "")
        sys.stderr.write(exc.stderr or "")
        raise
