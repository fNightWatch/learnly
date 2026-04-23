#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="${ROOT_DIR}/.learnly"
DB_PATH="${DB_DIR}/learnly.db"
BACKUP_DIR="${DB_DIR}/progress-backups"
APPLY_RESTORE="${1:-}"

if [[ ! -d "$BACKUP_DIR" ]]; then
  echo "[restore] Missing backup directory: $BACKUP_DIR"
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "[restore] Missing DB file: $DB_PATH"
  exit 1
fi

REPORT_JSON="$(
node - "$DB_PATH" "$BACKUP_DIR" "${DB_DIR}/progress-protection/manifest.json" <<'NODE'
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.argv[2];
const backupDir = process.argv[3];
const manifestPath = process.argv[4];
const userId = 'demo-user';

function readCounts(filePath) {
  const db = new Database(filePath, {
    readonly: true,
    fileMustExist: true,
    timeout: 50
  });
  const counts = {
    itemStates: db.prepare('select count(*) c from user_item_states where user_id=?').get(userId).c,
    reviewEvents: db.prepare('select count(*) c from review_events where user_id=?').get(userId).c,
    sessions: db.prepare('select count(*) c from sessions where user_id=?').get(userId).c
  };
  db.close();
  return counts;
}

function score(c) {
  return [c.reviewEvents, c.itemStates, c.sessions];
}

function isBetter(a, b) {
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] > sb[i]) return true;
    if (sa[i] < sb[i]) return false;
  }
  return false;
}

const current = readCounts(dbPath);
let best = { path: dbPath, counts: current };

const candidatePaths = new Set();

if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const manifestBackup = manifest?.users?.[userId]?.backupPath;
    if (manifestBackup && fs.existsSync(manifestBackup)) {
      candidatePaths.add(manifestBackup);
    }
  } catch {
    // ignore malformed manifest
  }
}

const recentBackups = fs.readdirSync(backupDir)
  .filter((fileName) => fileName.endsWith('.db'))
  .map((fileName) => {
    const fullPath = path.join(backupDir, fileName);
    const mtime = fs.statSync(fullPath).mtimeMs;
    return { fullPath, mtime };
  })
  .sort((a, b) => b.mtime - a.mtime)
  .slice(0, 20);

for (const entry of recentBackups) {
  candidatePaths.add(entry.fullPath);
}

for (const fullPath of candidatePaths) {
  try {
    const counts = readCounts(fullPath);
    if (isBetter(counts, best.counts)) {
      best = { path: fullPath, counts };
    }
  } catch {
    // ignore unreadable backups
  }
}

process.stdout.write(JSON.stringify({ current: { path: dbPath, counts: current }, best }, null, 2));
NODE
)"

echo "$REPORT_JSON"

BEST_PATH="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(j.best.path);});')"
CURRENT_PATH="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(j.current.path);});')"
BEST_REVIEW_EVENTS="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(String(j.best.counts.reviewEvents));});')"
CURR_REVIEW_EVENTS="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(String(j.current.counts.reviewEvents));});')"
BEST_ITEM_STATES="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(String(j.best.counts.itemStates));});')"
CURR_ITEM_STATES="$(echo "$REPORT_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const j=JSON.parse(d);process.stdout.write(String(j.current.counts.itemStates));});')"

if [[ "$APPLY_RESTORE" != "--apply" ]]; then
  echo "[restore] Dry run only. To restore best backup, run:"
  echo "  bash scripts/restore-best-progress.sh --apply"
  exit 0
fi

if [[ "$BEST_PATH" == "$CURRENT_PATH" ]]; then
  echo "[restore] Current DB already has the highest progress. Nothing to restore."
  exit 0
fi

if [[ "$BEST_REVIEW_EVENTS" -lt "$CURR_REVIEW_EVENTS" ]]; then
  echo "[restore] Refusing restore: best backup has fewer review events than current DB."
  exit 1
fi

if [[ "$BEST_REVIEW_EVENTS" -eq "$CURR_REVIEW_EVENTS" && "$BEST_ITEM_STATES" -lt "$CURR_ITEM_STATES" ]]; then
  echo "[restore] Refusing restore: best backup has fewer item states at equal review events."
  exit 1
fi

ts="$(date +%Y%m%d-%H%M%S)"
current_backup="${DB_DIR}/learnly.db.before-restore-${ts}"
cp -p "$DB_PATH" "$current_backup"
cp -p "$BEST_PATH" "$DB_PATH"
rm -f "${DB_PATH}-wal" "${DB_PATH}-shm"

echo "[restore] Restored best backup:"
echo "  source: $BEST_PATH"
echo "  previous-current-snapshot: $current_backup"
