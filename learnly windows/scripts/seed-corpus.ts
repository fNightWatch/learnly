/**
 * Seed the SQLite corpus tables from the JSON seed file.
 *
 * Run with:  npx tsx scripts/seed-corpus.ts [--force]
 *
 * --force  Drop and re-insert all rows (useful after regenerating corpus data).
 * Without --force, skips seeding if corpus_languages already has rows.
 *
 * The seed file (data/corpus-seed.json) is created by scripts/export-corpus-json.ts.
 */
import Database from "better-sqlite3";
import path from "path";
import { mkdirSync, readFileSync } from "fs";

const DB_DIRECTORY = path.join(process.cwd(), ".learnly");
const DB_PATH = path.join(DB_DIRECTORY, "learnly.db");
const SEED_PATH = path.join(process.cwd(), "data", "corpus-seed.json");

const force = process.argv.includes("--force");

mkdirSync(DB_DIRECTORY, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

// Create corpus tables if they don't exist
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
`);

const langCount = sqlite.prepare("SELECT COUNT(*) as count FROM corpus_languages").get() as { count: number };

if (langCount.count > 0 && !force) {
  console.log(`Corpus already seeded (${langCount.count} languages). Use --force to re-seed.`);
  process.exit(0);
}

if (force) {
  console.log("Force mode: clearing existing corpus data…");
  sqlite.exec("DELETE FROM corpus_items; DELETE FROM corpus_languages;");
}

// Read from JSON seed file
const raw = readFileSync(SEED_PATH, "utf-8");
const { languages, items } = JSON.parse(raw) as {
  languages: Array<{
    code: string; name: string; nativeName: string; descriptor: string;
    speakerLabel: string; audioVoice: string; beta?: boolean;
  }>;
  items: Array<{
    id: string; languageCode: string; type: string; lemma: string;
    displayForm: string; primaryGloss: string; pos: string; rank: number;
    example: string; translation: string; pronunciation?: string;
    secondaryGlosses?: string[]; notes?: string;
  }>;
};

const insertLang = sqlite.prepare(
  `INSERT OR IGNORE INTO corpus_languages (code, name, native_name, descriptor, speaker_label, audio_voice, beta)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const insertItem = sqlite.prepare(
  `INSERT OR IGNORE INTO corpus_items (id, language_code, type, lemma, display_form, primary_gloss, pos, rank, example, translation, pronunciation, secondary_glosses, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const seedAll = sqlite.transaction(() => {
  for (const lang of languages) {
    insertLang.run(
      lang.code, lang.name, lang.nativeName, lang.descriptor,
      lang.speakerLabel, lang.audioVoice, lang.beta ? 1 : 0
    );
  }
  for (const item of items) {
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

console.log(`Seeded ${languages.length} languages and ${items.length} corpus items into SQLite.`);
sqlite.close();
