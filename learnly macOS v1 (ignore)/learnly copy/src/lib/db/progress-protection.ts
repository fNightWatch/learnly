import type Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { getSqlite } from "@/lib/db/local-client";

type ProgressCounts = {
  itemStates: number;
  reviewEvents: number;
  sessions: number;
};

type ProgressManifest = {
  users: Record<
    string,
    {
      backupPath: string;
      counts: ProgressCounts;
      createdAt: string;
      reason: string;
    }
  >;
};

const PROTECTION_DIRECTORY = path.join(process.cwd(), ".learnly", "progress-protection");
const BACKUP_DIRECTORY = path.join(process.cwd(), ".learnly", "progress-backups");
const MANIFEST_PATH = path.join(PROTECTION_DIRECTORY, "manifest.json");

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function safeReason(reason: string) {
  return reason.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "progress";
}

function timestampForPath(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function readManifest(): ProgressManifest {
  if (!existsSync(MANIFEST_PATH)) {
    return { users: {} };
  }

  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as ProgressManifest;
  } catch {
    return { users: {} };
  }
}

function writeManifest(manifest: ProgressManifest) {
  mkdirSync(PROTECTION_DIRECTORY, { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function isLowerProgress(current: ProgressCounts, baseline: ProgressCounts) {
  return current.itemStates < baseline.itemStates || current.reviewEvents < baseline.reviewEvents;
}

function shouldRefreshBackup(current: ProgressCounts, baseline?: ProgressCounts) {
  if (!baseline) return true;
  return current.itemStates > baseline.itemStates || current.reviewEvents > baseline.reviewEvents;
}

export function installProgressProtectionTriggers(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS protect_user_item_states_delete
    BEFORE DELETE ON user_item_states
    BEGIN
      SELECT RAISE(ABORT, 'progress protection: deleting user_item_states is blocked');
    END;

    CREATE TRIGGER IF NOT EXISTS protect_user_item_states_identity_update
    BEFORE UPDATE OF user_id, item_id ON user_item_states
    BEGIN
      SELECT RAISE(ABORT, 'progress protection: changing user_item_states identity is blocked');
    END;

    CREATE TRIGGER IF NOT EXISTS protect_review_events_delete
    BEFORE DELETE ON review_events
    BEGIN
      SELECT RAISE(ABORT, 'progress protection: deleting review_events is blocked');
    END;

    CREATE TRIGGER IF NOT EXISTS protect_review_events_update
    BEFORE UPDATE ON review_events
    BEGIN
      SELECT RAISE(ABORT, 'progress protection: review_events are append-only');
    END;
  `);
}

export function getProgressCounts(userId: string): ProgressCounts {
  const sqlite = getSqlite();
  installProgressProtectionTriggers(sqlite);
  const itemStates = sqlite
    .prepare("SELECT COUNT(*) AS count FROM user_item_states WHERE user_id = ?")
    .get(userId) as { count: number };
  const reviewEvents = sqlite
    .prepare("SELECT COUNT(*) AS count FROM review_events WHERE user_id = ?")
    .get(userId) as { count: number };
  const sessions = sqlite
    .prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?")
    .get(userId) as { count: number };

  return {
    itemStates: itemStates.count,
    reviewEvents: reviewEvents.count,
    sessions: sessions.count
  };
}

export function ensureProgressBackup(userId: string, reason: string) {
  const sqlite = getSqlite();
  installProgressProtectionTriggers(sqlite);
  const counts = getProgressCounts(userId);

  if (counts.itemStates === 0 && counts.reviewEvents === 0 && counts.sessions === 0) {
    return null;
  }

  const manifest = readManifest();
  const protectedBaseline = manifest.users[userId];

  if (protectedBaseline && isLowerProgress(counts, protectedBaseline.counts)) {
    throw new Error(
      [
        "progress protection: current learner progress is lower than the last protected snapshot",
        `current=${JSON.stringify(counts)}`,
        `protected=${JSON.stringify(protectedBaseline.counts)}`,
        `backup=${protectedBaseline.backupPath}`
      ].join(" | ")
    );
  }

  if (!shouldRefreshBackup(counts, protectedBaseline?.counts)) {
    return protectedBaseline;
  }

  mkdirSync(BACKUP_DIRECTORY, { recursive: true });
  const createdAt = new Date();
  const backupPath = path.join(
    BACKUP_DIRECTORY,
    `${timestampForPath(createdAt)}-${safeReason(reason)}-${userId}.db`
  );

  sqlite.exec(`VACUUM INTO ${sqlString(backupPath)}`);

  const snapshot = {
    backupPath,
    counts,
    createdAt: createdAt.toISOString(),
    reason
  };

  manifest.users[userId] = snapshot;
  writeManifest(manifest);

  return snapshot;
}
