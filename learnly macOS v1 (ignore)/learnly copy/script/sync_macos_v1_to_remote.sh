#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  sync_macos_v1_to_remote.sh [options]

Options:
  --source <path>         Source repo path (default: parent of this script)
  --remote-clone <path>   Local clone of remote repo (default: ../learnly-remote)
  --target-subdir <path>  Target subdir inside remote clone
                          (default: learnly macOS v1 (ignore)/learnly copy)
  --branch <name>         Sync branch name (default: sync/macos-v1)
  --main-branch <name>    Main branch name (default: main)
  --merge-main            Fast-forward merge sync branch into main and push main
                          (default behavior)
  --no-merge-main         Skip merge into main; update only sync branch
  --dry-run               Show rsync changes without committing/pushing
  -h, --help              Show this help

Examples:
  ./script/sync_macos_v1_to_remote.sh
  ./script/sync_macos_v1_to_remote.sh --dry-run
  ./script/sync_macos_v1_to_remote.sh --no-merge-main
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SOURCE="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEFAULT_REMOTE_CLONE="$(cd "${DEFAULT_SOURCE}/.." && pwd)/learnly-remote"

SOURCE_REPO="${DEFAULT_SOURCE}"
REMOTE_CLONE="${DEFAULT_REMOTE_CLONE}"
TARGET_SUBDIR="learnly macOS v1 (ignore)/learnly copy"
SYNC_BRANCH="sync/macos-v1"
MAIN_BRANCH="main"
MERGE_MAIN=1
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE_REPO="$2"
      shift 2
      ;;
    --remote-clone)
      REMOTE_CLONE="$2"
      shift 2
      ;;
    --target-subdir)
      TARGET_SUBDIR="$2"
      shift 2
      ;;
    --branch)
      SYNC_BRANCH="$2"
      shift 2
      ;;
    --main-branch)
      MAIN_BRANCH="$2"
      shift 2
      ;;
    --merge-main)
      MERGE_MAIN=1
      shift
      ;;
    --no-merge-main)
      MERGE_MAIN=0
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "${SOURCE_REPO}" ]]; then
  echo "Source repo not found: ${SOURCE_REPO}" >&2
  exit 1
fi

if [[ ! -d "${REMOTE_CLONE}/.git" ]]; then
  echo "Remote clone is missing or not a git repo: ${REMOTE_CLONE}" >&2
  echo "Run once: git clone https://github.com/fNightWatch/learnly.git ${REMOTE_CLONE}" >&2
  exit 1
fi

echo "== Sync config =="
echo "Source repo   : ${SOURCE_REPO}"
echo "Remote clone  : ${REMOTE_CLONE}"
echo "Target subdir : ${TARGET_SUBDIR}"
echo "Sync branch   : ${SYNC_BRANCH}"
echo "Main branch   : ${MAIN_BRANCH}"
echo "Merge to main : ${MERGE_MAIN}"
echo "Dry run       : ${DRY_RUN}"
echo

cd "${REMOTE_CLONE}"

git fetch origin
git checkout "${MAIN_BRANCH}"
git pull --ff-only origin "${MAIN_BRANCH}"
git checkout -B "${SYNC_BRANCH}"

mkdir -p "${TARGET_SUBDIR}"

RSYNC_ARGS=(
  -av
  --delete
  --exclude ".git"
  --exclude ".DS_Store"
  --exclude "node_modules"
  --exclude ".next"
  --exclude "dist"
  --exclude "test-results"
  --exclude "playwright-report"
  --exclude ".learnly"
  --exclude "tmp"
  --exclude ".tmp"
  --exclude "artifacts"
  --exclude "languagehack_ios/build"
)

if [[ ${DRY_RUN} -eq 1 ]]; then
  RSYNC_ARGS+=(--dry-run --itemize-changes)
fi

rsync "${RSYNC_ARGS[@]}" "${SOURCE_REPO%/}/" "${TARGET_SUBDIR%/}/"

if [[ ${DRY_RUN} -eq 1 ]]; then
  echo
  echo "Dry run complete. No git changes were committed."
  exit 0
fi

git add --all "${TARGET_SUBDIR}"

if git diff --cached --quiet; then
  echo "No changes to commit."
else
  stamp="$(date '+%Y-%m-%d %H:%M:%S %z')"
  git commit -m "Sync macOS v1 snapshot (${stamp})"
fi

git push -u origin "${SYNC_BRANCH}"

if [[ ${MERGE_MAIN} -eq 1 ]]; then
  git checkout "${MAIN_BRANCH}"
  git pull --ff-only origin "${MAIN_BRANCH}"
  git merge --ff-only "${SYNC_BRANCH}"
  git push origin "${MAIN_BRANCH}"
fi

echo
echo "Sync complete."
echo "Branch updated: ${SYNC_BRANCH}"
if [[ ${MERGE_MAIN} -eq 1 ]]; then
  echo "Main branch also updated: ${MAIN_BRANCH}"
else
  echo "To merge into main later:"
  echo "  cd \"${REMOTE_CLONE}\""
  echo "  git checkout ${MAIN_BRANCH}"
  echo "  git merge --ff-only ${SYNC_BRANCH}"
  echo "  git push origin ${MAIN_BRANCH}"
fi
