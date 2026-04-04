#!/usr/bin/env python3

import argparse
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ORCHESTRATOR = ROOT / "orchestrator.py"
PYTHON = sys.executable or "python"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, cwd=ROOT, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and ingest every JSONL file under a generated-output tree.")
    parser.add_argument("--db-path", required=True)
    parser.add_argument("--root", required=True, help="Directory to scan for .jsonl files.")
    args = parser.parse_args()

    root = Path(args.root)
    files = sorted(root.rglob("*.jsonl"))
    for file_path in files:
        run([PYTHON, str(ORCHESTRATOR), "--db-path", args.db_path, "validate-jsonl", str(file_path)])
        run([PYTHON, str(ORCHESTRATOR), "--db-path", args.db_path, "ingest-jsonl", str(file_path)])
        print(file_path)


if __name__ == "__main__":
    main()
