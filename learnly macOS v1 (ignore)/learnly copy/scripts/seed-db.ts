/**
 * seed-db.ts — Ensures the local SQLite DB has all corpus data before the dev server starts.
 *
 * Runs via `tsx scripts/seed-db.ts` (tsx handles TS + @/ path aliases).
 * Uses INSERT OR IGNORE everywhere — safe to re-run, never deletes data.
 */

import Database from "better-sqlite3";
import path from "path";
import { mkdirSync, existsSync, readFileSync } from "fs";
import type { DemoLanguage, DemoLexicalItem } from "@/lib/demo/types";

const DB_DIRECTORY = path.join(process.cwd(), ".learnly");
const DB_PATH = path.join(DB_DIRECTORY, "learnly.db");
const CORPUS_SEED_PATH = path.join(process.cwd(), "data", "corpus-seed.json");
const CORPUS_SQLITE_PATH = path.join(process.cwd(), "corpus-generation", "corpus.sqlite");
const CORPUS_HSK2_SQLITE_PATH = path.join(process.cwd(), "corpus-generation", "corpus-hsk-2.sqlite");
const CORPUS_HSK3_SQLITE_PATH = path.join(process.cwd(), "corpus-generation", "corpus-hsk-3.sqlite");

mkdirSync(DB_DIRECTORY, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create tables if they don't exist (same DDL as local-client.ts)
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
  sqlite.exec("ALTER TABLE user_settings ADD COLUMN chinese_review_flow TEXT NOT NULL DEFAULT 'four-click';");
}

const corpusSeed = JSON.parse(readFileSync(CORPUS_SEED_PATH, "utf8")) as {
  languages: DemoLanguage[];
  items: DemoLexicalItem[];
};
const demoLanguages = corpusSeed.languages;
const demoCorpus = corpusSeed.items;

// ---------------------------------------------------------------------------
// Seed languages + corpus items (incremental)
// ---------------------------------------------------------------------------

const existingLangs = new Set(
  (sqlite.prepare("SELECT code FROM corpus_languages").all() as { code: string }[]).map(r => r.code)
);
const existingItemCount = (sqlite.prepare("SELECT COUNT(*) as count FROM corpus_items").get() as { count: number }).count;

const missingLangs = demoLanguages.filter(l => !existingLangs.has(l.code));
const missingItems = demoCorpus.filter(item => {
  // Only check items for missing languages, or if DB has fewer items than expected
  return !existingLangs.has(item.languageCode) || existingItemCount < demoCorpus.length;
});

let seededLangs = 0;
let seededItems = 0;
let seededExamples = 0;

if (missingLangs.length > 0 || existingItemCount < demoCorpus.length) {
  const insertLang = sqlite.prepare(
    `INSERT OR IGNORE INTO corpus_languages (code, name, native_name, descriptor, speaker_label, audio_voice, beta)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = sqlite.prepare(
    `INSERT OR REPLACE INTO corpus_items (id, language_code, type, lemma, display_form, primary_gloss, pos, rank, example, translation, pronunciation, secondary_glosses, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const seedCorpus = sqlite.transaction(() => {
    for (const lang of demoLanguages) {
      const result = insertLang.run(
        lang.code, lang.name, lang.nativeName, lang.descriptor,
        lang.speakerLabel, lang.audioVoice, lang.beta ? 1 : 0
      );
      if (result.changes > 0) seededLangs++;
    }
    for (const item of demoCorpus) {
      const result = insertItem.run(
        item.id, item.languageCode, item.type, item.lemma, item.displayForm,
        item.primaryGloss, item.pos, item.rank, item.example, item.translation,
        item.pronunciation ?? null,
        item.secondaryGlosses ? JSON.stringify(item.secondaryGlosses) : null,
        item.notes ?? null
      );
      if (result.changes > 0) seededItems++;
    }
  });

  seedCorpus();
}

// ---------------------------------------------------------------------------
// Seed corpus_item_examples from corpus-generation/corpus.sqlite (HSK 1)
// ---------------------------------------------------------------------------

const existingExampleCount = (sqlite.prepare("SELECT COUNT(*) as count FROM corpus_item_examples").get() as { count: number }).count;

if (existingExampleCount === 0 && existsSync(CORPUS_SQLITE_PATH)) {
  const srcDb = new Database(CORPUS_SQLITE_PATH, { readonly: true });

  const rows = srcDb.prepare(`
    SELECT id, word_id, sentence, translation, is_primary,
      ROW_NUMBER() OVER (PARTITION BY word_id ORDER BY is_primary DESC, id) - 1 as sort_order
    FROM examples
    ORDER BY word_id, sort_order
  `).all() as { id: string; word_id: string; sentence: string; translation: string; sort_order: number }[];

  const insertExample = sqlite.prepare(
    `INSERT OR IGNORE INTO corpus_item_examples (id, item_id, sentence, translation, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  );

  const seedExamples = sqlite.transaction(() => {
    for (const r of rows) {
      const result = insertExample.run(r.id, r.word_id, r.sentence, r.translation, r.sort_order);
      if (result.changes > 0) seededExamples++;
    }
  });

  seedExamples();
  srcDb.close();
}

// ---------------------------------------------------------------------------
// Seed corpus_item_examples from corpus-generation/corpus-hsk-2.sqlite (HSK 2)
// ---------------------------------------------------------------------------

const existingHsk2ExampleCount = (sqlite.prepare(
  "SELECT COUNT(*) as count FROM corpus_item_examples WHERE item_id LIKE 'new-hsk-2-%'"
).get() as { count: number }).count;

if (existingHsk2ExampleCount === 0 && existsSync(CORPUS_HSK2_SQLITE_PATH)) {
  const srcDb2 = new Database(CORPUS_HSK2_SQLITE_PATH, { readonly: true });

  const rows2 = srcDb2.prepare(`
    SELECT id, word_id, sentence, translation, is_primary,
      ROW_NUMBER() OVER (PARTITION BY word_id ORDER BY is_primary DESC, id) - 1 as sort_order
    FROM examples
    ORDER BY word_id, sort_order
  `).all() as { id: string; word_id: string; sentence: string; translation: string; sort_order: number }[];

  const insertExample2 = sqlite.prepare(
    `INSERT OR IGNORE INTO corpus_item_examples (id, item_id, sentence, translation, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  );

  let seededHsk2Examples = 0;
  const seedHsk2Examples = sqlite.transaction(() => {
    for (const r of rows2) {
      const result = insertExample2.run(r.id, r.word_id, r.sentence, r.translation, r.sort_order);
      if (result.changes > 0) seededHsk2Examples++;
    }
  });

  seedHsk2Examples();
  srcDb2.close();
  seededExamples += seededHsk2Examples;
}

// ---------------------------------------------------------------------------
// Seed corpus_item_examples from corpus-generation/corpus-hsk-3.sqlite (HSK 3)
// ---------------------------------------------------------------------------

const existingHsk3ExampleCount = (sqlite.prepare(
  "SELECT COUNT(*) as count FROM corpus_item_examples WHERE item_id LIKE 'new-hsk-3-%'"
).get() as { count: number }).count;

if (existingHsk3ExampleCount === 0 && existsSync(CORPUS_HSK3_SQLITE_PATH)) {
  const srcDb3 = new Database(CORPUS_HSK3_SQLITE_PATH, { readonly: true });

  const rows3 = srcDb3.prepare(`
    SELECT id, word_id, sentence, translation, is_primary,
      ROW_NUMBER() OVER (PARTITION BY word_id ORDER BY is_primary DESC, id) - 1 as sort_order
    FROM examples
    ORDER BY word_id, sort_order
  `).all() as { id: string; word_id: string; sentence: string; translation: string; sort_order: number }[];

  const insertExample3 = sqlite.prepare(
    `INSERT OR IGNORE INTO corpus_item_examples (id, item_id, sentence, translation, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  );

  let seededHsk3Examples = 0;
  const seedHsk3Examples = sqlite.transaction(() => {
    for (const r of rows3) {
      const result = insertExample3.run(r.id, r.word_id, r.sentence, r.translation, r.sort_order);
      if (result.changes > 0) seededHsk3Examples++;
    }
  });

  seedHsk3Examples();
  srcDb3.close();
  seededExamples += seededHsk3Examples;
}

sqlite.close();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (seededLangs === 0 && seededItems === 0 && seededExamples === 0) {
  console.log("seed-db: DB already up to date.");
} else {
  const parts: string[] = [];
  if (seededLangs > 0) parts.push(`${seededLangs} languages`);
  if (seededItems > 0) parts.push(`${seededItems} items`);
  if (seededExamples > 0) parts.push(`${seededExamples} examples`);
  console.log(`seed-db: Seeded ${parts.join(", ")}.`);
}
