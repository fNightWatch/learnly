import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import { mkdirSync } from "fs";
import * as schema from "./sqlite-schema";

const DB_DIRECTORY = path.join(process.cwd(), ".learnly");
const DB_PATH = path.join(DB_DIRECTORY, "learnly.db");

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteClient: Database.Database | null = null;

export function getDb() {
  if (db) return db;

  mkdirSync(DB_DIRECTORY, { recursive: true });

  const sqlite = new Database(DB_PATH);
  sqliteClient = sqlite;
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  db = drizzle(sqlite, { schema });

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS corpus_languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      descriptor TEXT NOT NULL,
      speaker_label TEXT NOT NULL,
      audio_voice TEXT NOT NULL,
      beta INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS corpus_items (
      id TEXT PRIMARY KEY,
      language_code TEXT NOT NULL,
      type TEXT NOT NULL,
      lemma TEXT NOT NULL,
      display_form TEXT NOT NULL,
      primary_gloss TEXT NOT NULL,
      pos TEXT NOT NULL,
      rank INTEGER NOT NULL,
      example TEXT NOT NULL,
      translation TEXT NOT NULL,
      pronunciation TEXT,
      secondary_glosses TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS corpus_items_language_rank_idx ON corpus_items(language_code, rank);

    CREATE TABLE IF NOT EXISTS corpus_item_examples (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      sentence TEXT NOT NULL,
      translation TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS corpus_item_examples_item_idx ON corpus_item_examples(item_id, sort_order);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      daily_goal INTEGER NOT NULL DEFAULT 10,
      selected_language_codes TEXT NOT NULL DEFAULT '["es"]',
      dashboard_language_codes TEXT NOT NULL DEFAULT '["es"]',
      dashboard_range_days INTEGER NOT NULL DEFAULT 30,
      preferred_study_mode TEXT NOT NULL DEFAULT 'everyday',
      chinese_review_flow TEXT NOT NULL DEFAULT 'four-click',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_item_states (
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      due_at TEXT NOT NULL,
      stability REAL NOT NULL DEFAULT 0.4,
      difficulty REAL NOT NULL DEFAULT 5,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      learning_steps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      last_rating INTEGER,
      introduced_at TEXT NOT NULL,
      last_reviewed_at TEXT,
      PRIMARY KEY (user_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS user_item_states_due_idx ON user_item_states(user_id, due_at);
    CREATE INDEX IF NOT EXISTS user_item_states_status_idx ON user_item_states(user_id, status);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      language_codes TEXT NOT NULL,
      queue TEXT NOT NULL,
      due_count INTEGER NOT NULL,
      new_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'recall',
      state_before TEXT NOT NULL,
      state_after TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS review_events_user_reviewed_idx ON review_events(user_id, reviewed_at);
  `);

  const userSettingsColumns = sqlite
    .prepare("PRAGMA table_info(user_settings)")
    .all() as { name: string }[];
  const hasChineseReviewFlow = userSettingsColumns.some((column) => column.name === "chinese_review_flow");
  if (!hasChineseReviewFlow) {
    sqlite.exec(
      "ALTER TABLE user_settings ADD COLUMN chinese_review_flow TEXT NOT NULL DEFAULT 'four-click';"
    );
  }
  const hasDashboardRangeDays = userSettingsColumns.some((column) => column.name === "dashboard_range_days");
  if (!hasDashboardRangeDays) {
    sqlite.exec(
      "ALTER TABLE user_settings ADD COLUMN dashboard_range_days INTEGER NOT NULL DEFAULT 30;"
    );
  }

  // Auto-seed corpus tables on first run
  const langCount = sqlite.prepare("SELECT COUNT(*) as count FROM corpus_languages").get() as { count: number };
  if (langCount.count === 0) {
    try {
      // Use eval("require") so webpack skips this entirely — the 110k-line corpus files won't be bundled
      // eslint-disable-next-line @typescript-eslint/no-require-imports, no-eval
      const loadModule = eval("require");
      const { demoLanguages, demoCorpus } = loadModule("@/lib/demo/content");

      const insertLang = sqlite.prepare(
        `INSERT OR IGNORE INTO corpus_languages (code, name, native_name, descriptor, speaker_label, audio_voice, beta)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );
      const insertItem = sqlite.prepare(
        `INSERT OR IGNORE INTO corpus_items (id, language_code, type, lemma, display_form, primary_gloss, pos, rank, example, translation, pronunciation, secondary_glosses, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const seedAll = sqlite.transaction(() => {
        for (const lang of demoLanguages) {
          insertLang.run(lang.code, lang.name, lang.nativeName, lang.descriptor, lang.speakerLabel, lang.audioVoice, lang.beta ? 1 : 0);
        }
        for (const item of demoCorpus) {
          insertItem.run(
            item.id, item.languageCode, item.type, item.lemma, item.displayForm,
            item.primaryGloss, item.pos, item.rank, item.example, item.translation,
            item.pronunciation ?? null,
            item.secondaryGlosses ? JSON.stringify(item.secondaryGlosses) : null,
            item.notes ?? null
          );
        }
      });

      seedAll();
      console.log(`Seeded ${demoLanguages.length} languages and ${demoCorpus.length} corpus items into SQLite.`);
    } catch (err) {
      console.warn("Auto-seed skipped (expected if seed-db.ts already ran):", String(err));
    }
  }

  return db;
}

export function getSqlite() {
  if (!sqliteClient) {
    getDb();
  }

  return sqliteClient!;
}
