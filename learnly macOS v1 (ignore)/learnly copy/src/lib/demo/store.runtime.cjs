"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/lib/demo/store-source.ts
var store_source_exports = {};
__export(store_source_exports, {
  completeSession: () => completeSession,
  getAvailableAssumedWordLists: () => getAvailableAssumedWordLists2,
  getDashboardSnapshot: () => getDashboardSnapshot,
  getItemById: () => getItemById,
  getLanguageCatalog: () => getLanguageCatalog,
  getLearnerSettings: () => getLearnerSettings,
  getLibrarySnapshot: () => getLibrarySnapshot,
  getListsSnapshot: () => getListsSnapshot,
  getNextCard: () => getNextCard,
  getRecentStudiedWords: () => getRecentStudiedWords,
  getSiteSnapshot: () => getSiteSnapshot,
  getStudyPlan: () => getStudyPlan,
  getWordSnapshot: () => getWordSnapshot,
  getWordsSnapshot: () => getWordsSnapshot,
  learnPreviewItem: () => learnPreviewItem,
  resumeSession: () => resumeSession,
  startSession: () => startSession,
  submitReview: () => submitReview,
  updateLearnerSettings: () => updateLearnerSettings
});
module.exports = __toCommonJS(store_source_exports);
var import_fs3 = require("fs");
var import_path3 = __toESM(require("path"));
var import_drizzle_orm3 = require("drizzle-orm");
var import_date_fns2 = require("date-fns");

// src/lib/db/local-client.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"));
var import_better_sqlite32 = require("drizzle-orm/better-sqlite3");
var import_path = __toESM(require("path"));
var import_fs = require("fs");

// src/lib/db/sqlite-schema.ts
var sqlite_schema_exports = {};
__export(sqlite_schema_exports, {
  corpusItemExamples: () => corpusItemExamples,
  corpusItems: () => corpusItems,
  corpusLanguages: () => corpusLanguages,
  reviewEvents: () => reviewEvents,
  reviewIdempotency: () => reviewIdempotency,
  sessions: () => sessions,
  userItemStates: () => userItemStates,
  userSettings: () => userSettings
});
var import_sqlite_core = require("drizzle-orm/sqlite-core");
var corpusLanguages = (0, import_sqlite_core.sqliteTable)("corpus_languages", {
  code: (0, import_sqlite_core.text)("code").primaryKey(),
  name: (0, import_sqlite_core.text)("name").notNull(),
  nativeName: (0, import_sqlite_core.text)("native_name").notNull(),
  descriptor: (0, import_sqlite_core.text)("descriptor").notNull(),
  speakerLabel: (0, import_sqlite_core.text)("speaker_label").notNull(),
  audioVoice: (0, import_sqlite_core.text)("audio_voice").notNull(),
  beta: (0, import_sqlite_core.integer)("beta").notNull().default(0)
});
var corpusItems = (0, import_sqlite_core.sqliteTable)("corpus_items", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  languageCode: (0, import_sqlite_core.text)("language_code").notNull(),
  type: (0, import_sqlite_core.text)("type").notNull(),
  lemma: (0, import_sqlite_core.text)("lemma").notNull(),
  displayForm: (0, import_sqlite_core.text)("display_form").notNull(),
  primaryGloss: (0, import_sqlite_core.text)("primary_gloss").notNull(),
  pos: (0, import_sqlite_core.text)("pos").notNull(),
  rank: (0, import_sqlite_core.integer)("rank").notNull(),
  example: (0, import_sqlite_core.text)("example").notNull(),
  translation: (0, import_sqlite_core.text)("translation").notNull(),
  pronunciation: (0, import_sqlite_core.text)("pronunciation"),
  secondaryGlosses: (0, import_sqlite_core.text)("secondary_glosses"),
  // JSON array
  notes: (0, import_sqlite_core.text)("notes")
}, (table) => ({
  languageRankIdx: (0, import_sqlite_core.index)("corpus_items_language_rank_idx").on(table.languageCode, table.rank)
}));
var corpusItemExamples = (0, import_sqlite_core.sqliteTable)("corpus_item_examples", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  itemId: (0, import_sqlite_core.text)("item_id").notNull(),
  sentence: (0, import_sqlite_core.text)("sentence").notNull(),
  translation: (0, import_sqlite_core.text)("translation").notNull(),
  sortOrder: (0, import_sqlite_core.integer)("sort_order").notNull()
}, (table) => ({
  itemIdx: (0, import_sqlite_core.index)("corpus_item_examples_item_idx").on(table.itemId, table.sortOrder)
}));
var userSettings = (0, import_sqlite_core.sqliteTable)("user_settings", {
  userId: (0, import_sqlite_core.text)("user_id").primaryKey(),
  dailyGoal: (0, import_sqlite_core.integer)("daily_goal").notNull().default(10),
  selectedLanguageCodes: (0, import_sqlite_core.text)("selected_language_codes").notNull().default('["es"]'),
  // JSON array
  dashboardLanguageCodes: (0, import_sqlite_core.text)("dashboard_language_codes").notNull().default('["es"]'),
  // JSON array
  dashboardRangeDays: (0, import_sqlite_core.integer)("dashboard_range_days").notNull().default(30),
  preferredStudyMode: (0, import_sqlite_core.text)("preferred_study_mode").notNull().default("everyday"),
  chineseReviewFlow: (0, import_sqlite_core.text)("chinese_review_flow").notNull().default("four-click"),
  assumedWordListIds: (0, import_sqlite_core.text)("assumed_word_list_ids").notNull().default("[]"),
  updatedAt: (0, import_sqlite_core.text)("updated_at").notNull()
});
var userItemStates = (0, import_sqlite_core.sqliteTable)("user_item_states", {
  userId: (0, import_sqlite_core.text)("user_id").notNull(),
  itemId: (0, import_sqlite_core.text)("item_id").notNull(),
  status: (0, import_sqlite_core.text)("status").notNull().default("new"),
  dueAt: (0, import_sqlite_core.text)("due_at").notNull(),
  stability: (0, import_sqlite_core.real)("stability").notNull().default(0.4),
  difficulty: (0, import_sqlite_core.real)("difficulty").notNull().default(5),
  scheduledDays: (0, import_sqlite_core.integer)("scheduled_days").notNull().default(0),
  learningSteps: (0, import_sqlite_core.integer)("learning_steps").notNull().default(0),
  lapses: (0, import_sqlite_core.integer)("lapses").notNull().default(0),
  reps: (0, import_sqlite_core.integer)("reps").notNull().default(0),
  lastRating: (0, import_sqlite_core.integer)("last_rating"),
  introducedAt: (0, import_sqlite_core.text)("introduced_at").notNull(),
  lastReviewedAt: (0, import_sqlite_core.text)("last_reviewed_at")
}, (table) => ({
  pk: (0, import_sqlite_core.primaryKey)({ columns: [table.userId, table.itemId] }),
  dueIdx: (0, import_sqlite_core.index)("user_item_states_due_idx").on(table.userId, table.dueAt),
  statusIdx: (0, import_sqlite_core.index)("user_item_states_status_idx").on(table.userId, table.status)
}));
var sessions = (0, import_sqlite_core.sqliteTable)("sessions", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("user_id").notNull(),
  mode: (0, import_sqlite_core.text)("mode").notNull(),
  languageCodes: (0, import_sqlite_core.text)("language_codes").notNull(),
  // JSON array
  queue: (0, import_sqlite_core.text)("queue").notNull(),
  // JSON array
  dueCount: (0, import_sqlite_core.integer)("due_count").notNull(),
  newCount: (0, import_sqlite_core.integer)("new_count").notNull(),
  createdAt: (0, import_sqlite_core.text)("created_at").notNull(),
  elapsedMs: (0, import_sqlite_core.integer)("elapsed_ms").notNull().default(0),
  completedAt: (0, import_sqlite_core.text)("completed_at")
});
var reviewEvents = (0, import_sqlite_core.sqliteTable)("review_events", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("user_id").notNull(),
  itemId: (0, import_sqlite_core.text)("item_id").notNull(),
  rating: (0, import_sqlite_core.integer)("rating").notNull(),
  elapsedMs: (0, import_sqlite_core.integer)("elapsed_ms").notNull(),
  reviewedAt: (0, import_sqlite_core.text)("reviewed_at").notNull(),
  mode: (0, import_sqlite_core.text)("mode").notNull().default("recall"),
  stateBefore: (0, import_sqlite_core.text)("state_before").notNull(),
  stateAfter: (0, import_sqlite_core.text)("state_after").notNull()
}, (table) => ({
  userReviewedIdx: (0, import_sqlite_core.index)("review_events_user_reviewed_idx").on(table.userId, table.reviewedAt)
}));
var reviewIdempotency = (0, import_sqlite_core.sqliteTable)("review_idempotency", {
  id: (0, import_sqlite_core.text)("id").primaryKey(),
  userId: (0, import_sqlite_core.text)("user_id").notNull(),
  sessionId: (0, import_sqlite_core.text)("session_id").notNull(),
  itemId: (0, import_sqlite_core.text)("item_id").notNull(),
  idempotencyKey: (0, import_sqlite_core.text)("idempotency_key").notNull(),
  responseJson: (0, import_sqlite_core.text)("response_json").notNull(),
  createdAt: (0, import_sqlite_core.text)("created_at").notNull()
}, (table) => ({
  userCreatedIdx: (0, import_sqlite_core.index)("review_idempotency_user_created_idx").on(table.userId, table.createdAt),
  lookupIdx: (0, import_sqlite_core.index)("review_idempotency_lookup_idx").on(
    table.userId,
    table.sessionId,
    table.itemId,
    table.idempotencyKey
  )
}));

// src/lib/db/local-client.ts
var DB_DIRECTORY = import_path.default.join(process.cwd(), ".learnly");
var DB_PATH = import_path.default.join(DB_DIRECTORY, "learnly.db");
var CORPUS_SEED_PATH = import_path.default.join(process.cwd(), "data", "corpus-seed.json");
var db = null;
var sqliteClient = null;
function getDb() {
  if (db) return db;
  (0, import_fs.mkdirSync)(DB_DIRECTORY, { recursive: true });
  const sqlite = new import_better_sqlite3.default(DB_PATH);
  sqliteClient = sqlite;
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  db = (0, import_better_sqlite32.drizzle)(sqlite, { schema: sqlite_schema_exports });
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
      assumed_word_list_ids TEXT NOT NULL DEFAULT '[]',
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
      created_at TEXT NOT NULL,
      elapsed_ms INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
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

    CREATE TABLE IF NOT EXISTS review_idempotency (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      response_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS review_idempotency_user_created_idx ON review_idempotency(user_id, created_at);
    CREATE INDEX IF NOT EXISTS review_idempotency_lookup_idx ON review_idempotency(user_id, session_id, item_id, idempotency_key);
  `);
  const userSettingsColumns = sqlite.prepare("PRAGMA table_info(user_settings)").all();
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
  const hasAssumedWordListIds = userSettingsColumns.some(
    (column) => column.name === "assumed_word_list_ids"
  );
  if (!hasAssumedWordListIds) {
    sqlite.exec(
      "ALTER TABLE user_settings ADD COLUMN assumed_word_list_ids TEXT NOT NULL DEFAULT '[]';"
    );
  }
  const sessionColumns = sqlite.prepare("PRAGMA table_info(sessions)").all();
  const hasSessionElapsedMs = sessionColumns.some((column) => column.name === "elapsed_ms");
  if (!hasSessionElapsedMs) {
    sqlite.exec(
      "ALTER TABLE sessions ADD COLUMN elapsed_ms INTEGER NOT NULL DEFAULT 0;"
    );
  }
  const hasSessionCompletedAt = sessionColumns.some((column) => column.name === "completed_at");
  if (!hasSessionCompletedAt) {
    sqlite.exec(
      "ALTER TABLE sessions ADD COLUMN completed_at TEXT;"
    );
  }
  const langCount = sqlite.prepare("SELECT COUNT(*) as count FROM corpus_languages").get();
  if (langCount.count === 0 && (0, import_fs.existsSync)(CORPUS_SEED_PATH)) {
    try {
      const corpusSeed = JSON.parse((0, import_fs.readFileSync)(CORPUS_SEED_PATH, "utf8"));
      const demoLanguages = corpusSeed.languages;
      const demoCorpus = corpusSeed.items;
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
            item.id,
            item.languageCode,
            item.type,
            item.lemma,
            item.displayForm,
            item.primaryGloss,
            item.pos,
            item.rank,
            item.example,
            item.translation,
            item.pronunciation ?? null,
            item.secondaryGlosses ? JSON.stringify(item.secondaryGlosses) : null,
            item.notes ?? null
          );
        }
      });
      seedAll();
      console.log(`Seeded ${demoLanguages.length} languages and ${demoCorpus.length} corpus items into SQLite.`);
    } catch (err) {
      console.warn("Auto-seed from JSON skipped (expected if seed-db.ts already ran):", String(err));
    }
  }
  return db;
}
function getSqlite() {
  if (!sqliteClient) {
    getDb();
  }
  return sqliteClient;
}

// src/lib/demo/lists.ts
var import_drizzle_orm = require("drizzle-orm");
var HSK_LEVELS = [
  { level: 1, description: "Foundational high-frequency Mandarin for the first HSK band." },
  { level: 2, description: "Essential daily Mandarin for the second HSK band." },
  { level: 3, description: "Intermediate Mandarin expanding everyday fluency for HSK 3." },
  { level: 4, description: "Upper-intermediate Mandarin for HSK 4 proficiency." },
  { level: 5, description: "Advanced Mandarin vocabulary for HSK 5." },
  { level: 6, description: "Near-native Mandarin vocabulary for HSK 6." }
];
function buildHskLists() {
  const db2 = getDb();
  return HSK_LEVELS.map(({ level, description }) => {
    const rows = db2.select({ id: corpusItems.id }).from(corpusItems).where((0, import_drizzle_orm.like)(corpusItems.id, `zh-hsk-${level}-%`)).orderBy((0, import_drizzle_orm.asc)(corpusItems.rank)).all();
    return {
      id: `hsk-${level}`,
      title: `HSK ${level}`,
      description,
      itemIds: rows.map((r) => r.id)
    };
  });
}
var cached = null;
function getCuratedLists() {
  if (cached) return cached;
  cached = [
    {
      id: "launch-core",
      title: "Launch Core",
      description: "The first words that define the spine of the product.",
      itemIds: ["ser", "estar", "tener", "hacer", "poder", "ir"]
    },
    {
      id: "foundation-verbs",
      title: "Foundation Verbs",
      description: "High-frequency verbs that unlock early comprehension fast.",
      itemIds: ["ser", "estar", "tener", "hacer", "poder", "ir", "decir", "ver", "querer", "dar"]
    },
    {
      id: "conversation-starters",
      title: "Conversation Starters",
      description: "Polite and useful words for basic daily exchanges.",
      itemIds: ["decir", "querer", "dar", "por_favor", "de_nada"]
    },
    {
      id: "phrase-pairings",
      title: "Useful Phrases",
      description: "Short phrases that earn their place through constant reuse.",
      itemIds: ["por_favor", "de_nada"]
    },
    ...buildHskLists()
  ];
  return cached;
}
function getAvailableAssumedWordLists() {
  return getCuratedLists().map((list) => ({
    id: list.id,
    title: list.title,
    description: list.description,
    itemCount: list.itemIds.length
  }));
}

// src/lib/demo/chinese-sentence-preview.ts
var import_drizzle_orm2 = require("drizzle-orm");
var HSK_PREVIEW_LANGUAGES = ["zh-hsk1", "zh-hsk2", "zh-hsk3"];
var HSK_PREVIEW_LANGUAGE_SET = new Set(HSK_PREVIEW_LANGUAGES);
var HSK_SCOPE = {
  "zh-hsk1": ["zh-hsk1"],
  "zh-hsk2": ["zh-hsk1", "zh-hsk2"],
  "zh-hsk3": ["zh-hsk1", "zh-hsk2", "zh-hsk3"]
};
var lexiconCache = /* @__PURE__ */ new Map();
function dedupeGlosses(primaryGloss, secondaryGlosses) {
  const seen = /* @__PURE__ */ new Set();
  const orderedGlosses = [primaryGloss, ...secondaryGlosses ?? []].map((gloss) => gloss.trim()).filter((gloss) => gloss.length > 0).filter((gloss) => {
    if (seen.has(gloss)) {
      return false;
    }
    seen.add(gloss);
    return true;
  });
  return orderedGlosses;
}
function sortEntriesForLanguage(sentenceLanguageCode, left, right) {
  const leftExact = left.languageCode === sentenceLanguageCode ? 0 : 1;
  const rightExact = right.languageCode === sentenceLanguageCode ? 0 : 1;
  if (leftExact !== rightExact) {
    return leftExact - rightExact;
  }
  if (left.rank !== right.rank) {
    return left.rank - right.rank;
  }
  if (left.languageCode !== right.languageCode) {
    return left.languageCode.localeCompare(right.languageCode);
  }
  return left.itemId.localeCompare(right.itemId);
}
function buildPreviewLexicon(languageCode) {
  const scope = HSK_SCOPE[languageCode];
  const rows = getDb().select({
    id: corpusItems.id,
    languageCode: corpusItems.languageCode,
    displayForm: corpusItems.displayForm,
    rank: corpusItems.rank,
    pronunciation: corpusItems.pronunciation,
    primaryGloss: corpusItems.primaryGloss,
    secondaryGlosses: corpusItems.secondaryGlosses,
    notes: corpusItems.notes
  }).from(corpusItems).where((0, import_drizzle_orm2.inArray)(corpusItems.languageCode, scope)).all();
  const groupsBySurface = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const entry = {
      itemId: row.id,
      languageCode: row.languageCode,
      displayForm: row.displayForm,
      rank: row.rank,
      pronunciation: row.pronunciation ?? void 0,
      primaryGloss: row.primaryGloss,
      secondaryGlosses: row.secondaryGlosses ? JSON.parse(row.secondaryGlosses) : void 0,
      notes: row.notes ?? void 0,
      length: [...row.displayForm].length
    };
    const existing = groupsBySurface.get(entry.displayForm) ?? [];
    existing.push(entry);
    groupsBySurface.set(entry.displayForm, existing);
  }
  const byFirstCharacter = /* @__PURE__ */ new Map();
  for (const [displayForm, groupedEntries] of groupsBySurface.entries()) {
    const sortedEntries = groupedEntries.slice().sort((left, right) => sortEntriesForLanguage(languageCode, left, right));
    const firstCharacter = [...displayForm][0];
    const surfaces = byFirstCharacter.get(firstCharacter) ?? [];
    surfaces.push({
      displayForm,
      length: [...displayForm].length,
      entries: sortedEntries
    });
    byFirstCharacter.set(firstCharacter, surfaces);
  }
  for (const [firstCharacter, surfaces] of byFirstCharacter.entries()) {
    byFirstCharacter.set(
      firstCharacter,
      surfaces.slice().sort((left, right) => right.length - left.length || left.displayForm.localeCompare(right.displayForm))
    );
  }
  return { byFirstCharacter };
}
function getPreviewLexicon(languageCode) {
  const cached2 = lexiconCache.get(languageCode);
  if (cached2) {
    return cached2;
  }
  const lexicon = buildPreviewLexicon(languageCode);
  lexiconCache.set(languageCode, lexicon);
  return lexicon;
}
function buildTokenSenses(entries) {
  return entries.map((entry) => ({
    itemId: entry.itemId,
    languageCode: entry.languageCode,
    pronunciation: entry.pronunciation,
    primaryGloss: entry.primaryGloss,
    glosses: dedupeGlosses(entry.primaryGloss, entry.secondaryGlosses),
    notes: entry.notes
  }));
}
function buildMatchedTokenPreview(entries, text2, stateMap) {
  const senses = buildTokenSenses(entries);
  const alreadyLearning = entries.some((entry) => Boolean(stateMap[entry.itemId]));
  return {
    text: text2,
    matched: true,
    pronunciation: entries[0]?.pronunciation,
    senses,
    learnItemId: alreadyLearning ? void 0 : entries[0]?.itemId,
    alreadyLearning
  };
}
function isHskSentencePreviewLanguage(languageCode) {
  return HSK_PREVIEW_LANGUAGE_SET.has(languageCode);
}
function buildChineseSentenceTokenPreviews(params) {
  const { sentence, languageCode, stateMap } = params;
  if (!isHskSentencePreviewLanguage(languageCode) || sentence.trim().length === 0) {
    return void 0;
  }
  const lexicon = getPreviewLexicon(languageCode);
  const characters = [...sentence];
  const previews = [];
  let plainTextBuffer = "";
  let index2 = 0;
  while (index2 < characters.length) {
    const currentCharacter = characters[index2];
    const candidates = lexicon.byFirstCharacter.get(currentCharacter);
    let matchedGroup = null;
    if (candidates) {
      for (const candidate of candidates) {
        const nextText = characters.slice(index2, index2 + candidate.length).join("");
        if (nextText === candidate.displayForm) {
          matchedGroup = candidate;
          break;
        }
      }
    }
    if (!matchedGroup) {
      plainTextBuffer += currentCharacter;
      index2 += 1;
      continue;
    }
    if (plainTextBuffer.length > 0) {
      previews.push({
        text: plainTextBuffer,
        matched: false
      });
      plainTextBuffer = "";
    }
    previews.push(buildMatchedTokenPreview(matchedGroup.entries, matchedGroup.displayForm, stateMap));
    index2 += matchedGroup.length;
  }
  if (plainTextBuffer.length > 0) {
    previews.push({
      text: plainTextBuffer,
      matched: false
    });
  }
  return previews.length > 0 ? previews : void 0;
}

// src/lib/demo/user.ts
var DEMO_USER_ID = "demo-user";

// src/lib/srs/scheduler.ts
var import_date_fns = require("date-fns");
var import_ts_fsrs = require("ts-fsrs");
var ratingLabels = {
  1: "Forgot",
  2: "Hard",
  3: "Good",
  4: "Easy"
};
var scheduler = (0, import_ts_fsrs.fsrs)(
  (0, import_ts_fsrs.generatorParameters)({
    enable_fuzz: false,
    enable_short_term: true,
    request_retention: 0.9,
    maximum_interval: 365,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"]
  })
);
var statusToState = {
  new: import_ts_fsrs.State.New,
  learning: import_ts_fsrs.State.Learning,
  review: import_ts_fsrs.State.Review,
  relearning: import_ts_fsrs.State.Relearning
};
var stateToStatus = {
  [import_ts_fsrs.State.New]: "new",
  [import_ts_fsrs.State.Learning]: "learning",
  [import_ts_fsrs.State.Review]: "review",
  [import_ts_fsrs.State.Relearning]: "relearning"
};
function formatIntervalLabel(now, dueAt) {
  const minutes = (0, import_date_fns.differenceInMinutes)(dueAt, now);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} min`;
  }
  const hours = (0, import_date_fns.differenceInHours)(dueAt, now);
  if (hours < 48) {
    return `${Math.max(1, hours)} hr`;
  }
  const days = (0, import_date_fns.differenceInCalendarDays)(dueAt, now);
  return `${Math.max(1, days)} day${days === 1 ? "" : "s"}`;
}
function toFsrsCard(current, now) {
  const seed = (0, import_ts_fsrs.createEmptyCard)(new Date(current.introducedAt));
  const lastReview = current.lastReviewedAt ? new Date(current.lastReviewedAt) : void 0;
  return {
    ...seed,
    due: new Date(current.dueAt),
    stability: current.stability,
    difficulty: current.difficulty,
    elapsed_days: lastReview ? Math.max(0, (0, import_date_fns.differenceInCalendarDays)(now, lastReview)) : 0,
    scheduled_days: current.scheduledDays,
    learning_steps: current.learningSteps,
    reps: current.reps,
    lapses: current.lapses,
    state: statusToState[current.status],
    last_review: lastReview
  };
}
function toUserState(userId, itemId, card, now, current, rating) {
  return {
    userId,
    itemId,
    status: stateToStatus[card.state],
    dueAt: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    lapses: card.lapses,
    reps: card.reps,
    lastRating: rating ?? current?.lastRating ?? null,
    introducedAt: current?.introducedAt ?? now.toISOString(),
    lastReviewedAt: card.last_review ? card.last_review.toISOString() : current?.lastReviewedAt ?? null
  };
}
function createInitialState(userId, itemId, now) {
  const card = (0, import_ts_fsrs.createEmptyCard)(now);
  return toUserState(userId, itemId, card, now);
}
function scheduleReview(current, rating, now) {
  const next = scheduler.next(toFsrsCard(current, now), now, rating);
  return toUserState(current.userId, current.itemId, next.card, now, current, rating);
}
function getRatingPreviews(current, now) {
  const preview = scheduler.repeat(toFsrsCard(current, now), now);
  return [1, 2, 3, 4].map((rating) => {
    const next = preview[rating];
    return {
      rating,
      label: ratingLabels[rating],
      status: stateToStatus[next.card.state],
      intervalLabel: formatIntervalLabel(now, next.card.due),
      dueAt: next.card.due.toISOString()
    };
  });
}
function getRetrievability(current, now) {
  if (!current.lastReviewedAt || current.status === "new") {
    return null;
  }
  try {
    return scheduler.get_retrievability(toFsrsCard(current, now), now, false);
  } catch {
    return null;
  }
}

// src/lib/db/progress-protection.ts
var import_fs2 = require("fs");
var import_path2 = __toESM(require("path"));
var PROTECTION_DIRECTORY = import_path2.default.join(process.cwd(), ".learnly", "progress-protection");
var BACKUP_DIRECTORY = import_path2.default.join(process.cwd(), ".learnly", "progress-backups");
var MANIFEST_PATH = import_path2.default.join(PROTECTION_DIRECTORY, "manifest.json");
var DB_PATH2 = import_path2.default.join(process.cwd(), ".learnly", "learnly.db");
function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
function safeReason(reason) {
  return reason.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "progress";
}
function timestampForPath(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}
function readManifest() {
  if (!(0, import_fs2.existsSync)(MANIFEST_PATH)) {
    return { users: {} };
  }
  try {
    return JSON.parse((0, import_fs2.readFileSync)(MANIFEST_PATH, "utf8"));
  } catch {
    return { users: {} };
  }
}
function writeManifest(manifest) {
  (0, import_fs2.mkdirSync)(PROTECTION_DIRECTORY, { recursive: true });
  (0, import_fs2.writeFileSync)(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}
`, "utf8");
}
function isLowerProgress(current, baseline) {
  return current.itemStates < baseline.itemStates || current.reviewEvents < baseline.reviewEvents;
}
function shouldRefreshBackup(current, baseline) {
  if (!baseline) return true;
  return current.itemStates > baseline.itemStates || current.reviewEvents > baseline.reviewEvents;
}
function getDbIdentity() {
  if (!(0, import_fs2.existsSync)(DB_PATH2)) {
    return null;
  }
  try {
    const stats = (0, import_fs2.statSync)(DB_PATH2);
    return {
      device: Number(stats.dev),
      inode: Number(stats.ino),
      birthtimeMs: stats.birthtimeMs
    };
  } catch {
    return null;
  }
}
function isSameDbIdentity(current, baseline) {
  if (!current || !baseline) return false;
  return current.device === baseline.device && current.inode === baseline.inode && current.birthtimeMs === baseline.birthtimeMs;
}
function isDbReplacementAfterBaseline(currentIdentity, baseline) {
  if (!baseline || !currentIdentity) return false;
  if (baseline.dbIdentity) {
    return !isSameDbIdentity(currentIdentity, baseline.dbIdentity);
  }
  const baselineCreatedAtMs = Date.parse(baseline.createdAt);
  if (!Number.isFinite(baselineCreatedAtMs)) return false;
  return currentIdentity.birthtimeMs > baselineCreatedAtMs + 1e3;
}
function installProgressProtectionTriggers(sqlite) {
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
function getProgressCounts(userId) {
  const sqlite = getSqlite();
  installProgressProtectionTriggers(sqlite);
  const itemStates = sqlite.prepare("SELECT COUNT(*) AS count FROM user_item_states WHERE user_id = ?").get(userId);
  const reviewEvents2 = sqlite.prepare("SELECT COUNT(*) AS count FROM review_events WHERE user_id = ?").get(userId);
  const sessions2 = sqlite.prepare("SELECT COUNT(*) AS count FROM sessions WHERE user_id = ?").get(userId);
  return {
    itemStates: itemStates.count,
    reviewEvents: reviewEvents2.count,
    sessions: sessions2.count
  };
}
function ensureProgressBackup(userId, reason) {
  const sqlite = getSqlite();
  installProgressProtectionTriggers(sqlite);
  const counts = getProgressCounts(userId);
  const dbIdentity = getDbIdentity();
  if (counts.itemStates === 0 && counts.reviewEvents === 0 && counts.sessions === 0) {
    return null;
  }
  const manifest = readManifest();
  const protectedBaseline = manifest.users[userId];
  const dbReplacementDetected = isDbReplacementAfterBaseline(dbIdentity, protectedBaseline);
  if (protectedBaseline && isLowerProgress(counts, protectedBaseline.counts) && !dbReplacementDetected) {
    throw new Error(
      [
        "progress protection: current learner progress is lower than the last protected snapshot",
        `current=${JSON.stringify(counts)}`,
        `protected=${JSON.stringify(protectedBaseline.counts)}`,
        `backup=${protectedBaseline.backupPath}`
      ].join(" | ")
    );
  }
  if (!dbReplacementDetected && !shouldRefreshBackup(counts, protectedBaseline?.counts)) {
    return protectedBaseline;
  }
  (0, import_fs2.mkdirSync)(BACKUP_DIRECTORY, { recursive: true });
  const createdAt = /* @__PURE__ */ new Date();
  const backupPath = import_path2.default.join(
    BACKUP_DIRECTORY,
    `${timestampForPath(createdAt)}-${safeReason(reason)}-${userId}.db`
  );
  sqlite.exec(`VACUUM INTO ${sqlString(backupPath)}`);
  const snapshot = {
    backupPath,
    counts,
    createdAt: createdAt.toISOString(),
    reason: dbReplacementDetected ? `${reason}-db-replaced` : reason,
    dbIdentity: dbIdentity ?? void 0
  };
  manifest.users[userId] = snapshot;
  writeManifest(manifest);
  return snapshot;
}

// src/lib/demo/store-source.ts
var DEFAULT_DAILY_GOAL = 10;
var DEFAULT_LANGUAGE_CODES = ["es"];
var DEFAULT_DASHBOARD_RANGE_DAYS = 30;
var DEFAULT_STUDY_MODE = "everyday";
var DEFAULT_CHINESE_REVIEW_FLOW = "four-click";
var DEFAULT_ASSUMED_WORD_LIST_IDS = [];
var SESSION_FRESH_POOL = 100;
var STORE_DIRECTORY = import_path3.default.join(process.cwd(), ".learnly");
var LEGACY_STORE_PATH = import_path3.default.join(STORE_DIRECTORY, "learner-store.json");
var LEGACY_STORE_PATH_OLD = import_path3.default.join(STORE_DIRECTORY, "demo-store.json");
var DASHBOARD_CACHE_TTL_MS = 1500;
var EMPTY_STATE_MAP = {};
var dashboardSnapshotCache = /* @__PURE__ */ new Map();
var userMutationVersion = /* @__PURE__ */ new Map();
var cycledExamplesCache = /* @__PURE__ */ new Map();
function rowToLexicalItem(row) {
  return {
    id: row.id,
    languageCode: row.languageCode,
    type: row.type,
    lemma: row.lemma,
    displayForm: row.displayForm,
    primaryGloss: row.primaryGloss,
    pos: row.pos,
    rank: row.rank,
    example: row.example,
    translation: row.translation,
    pronunciation: row.pronunciation ?? void 0,
    secondaryGlosses: row.secondaryGlosses ? JSON.parse(row.secondaryGlosses) : void 0,
    notes: row.notes ?? void 0
  };
}
var cachedLanguages = null;
function getAllLanguages() {
  if (cachedLanguages) return cachedLanguages;
  const db2 = getDb();
  cachedLanguages = db2.select().from(corpusLanguages).all().map((row) => ({
    code: row.code,
    name: row.name,
    nativeName: row.nativeName,
    descriptor: row.descriptor,
    speakerLabel: row.speakerLabel,
    audioVoice: row.audioVoice,
    beta: row.beta === 1 ? true : void 0
  }));
  return cachedLanguages;
}
function getAllCorpusItems() {
  const db2 = getDb();
  return db2.select().from(corpusItems).all().map(rowToLexicalItem);
}
function getCorpusItemsByLanguages(languageCodes) {
  if (languageCodes.length === 0) {
    return [];
  }
  const db2 = getDb();
  return db2.select().from(corpusItems).where((0, import_drizzle_orm3.inArray)(corpusItems.languageCode, languageCodes)).orderBy((0, import_drizzle_orm3.asc)(corpusItems.rank)).all().map(rowToLexicalItem);
}
function corpusItemExists(itemId) {
  const db2 = getDb();
  const row = db2.select({ id: corpusItems.id }).from(corpusItems).where((0, import_drizzle_orm3.eq)(corpusItems.id, itemId)).limit(1).get();
  return !!row;
}
function getUserMutationCounter(userId) {
  return userMutationVersion.get(userId) ?? 0;
}
function invalidateDashboardCacheForUser(userId) {
  for (const key of dashboardSnapshotCache.keys()) {
    if (key.startsWith(`${userId}|`)) {
      dashboardSnapshotCache.delete(key);
    }
  }
}
function markUserMutation(userId) {
  userMutationVersion.set(userId, getUserMutationCounter(userId) + 1);
  invalidateDashboardCacheForUser(userId);
}
function getItemLanguageMapForIds(itemIds) {
  if (itemIds.length === 0) {
    return /* @__PURE__ */ new Map();
  }
  const uniqueIds = [...new Set(itemIds)];
  const db2 = getDb();
  const rows = [];
  const chunkSize = 500;
  for (let index2 = 0; index2 < uniqueIds.length; index2 += chunkSize) {
    const slice = uniqueIds.slice(index2, index2 + chunkSize);
    rows.push(
      ...db2.select({
        id: corpusItems.id,
        languageCode: corpusItems.languageCode
      }).from(corpusItems).where((0, import_drizzle_orm3.inArray)(corpusItems.id, slice)).all()
    );
  }
  return new Map(rows.map((row) => [row.id, row.languageCode]));
}
function getExistingCorpusItemIdSet(itemIds) {
  if (itemIds.length === 0) {
    return /* @__PURE__ */ new Set();
  }
  const uniqueIds = [...new Set(itemIds)];
  const db2 = getDb();
  const existing = /* @__PURE__ */ new Set();
  const chunkSize = 500;
  for (let index2 = 0; index2 < uniqueIds.length; index2 += chunkSize) {
    const slice = uniqueIds.slice(index2, index2 + chunkSize);
    const rows = db2.select({ id: corpusItems.id }).from(corpusItems).where((0, import_drizzle_orm3.inArray)(corpusItems.id, slice)).all();
    for (const row of rows) {
      existing.add(row.id);
    }
  }
  return existing;
}
function getUserState(userId, itemId) {
  const db2 = getDb();
  const row = db2.select().from(userItemStates).where(
    (0, import_drizzle_orm3.and)(
      (0, import_drizzle_orm3.eq)(userItemStates.userId, userId),
      (0, import_drizzle_orm3.eq)(userItemStates.itemId, itemId)
    )
  ).get();
  if (!row) {
    return null;
  }
  return {
    userId: row.userId,
    itemId: row.itemId,
    status: row.status,
    dueAt: row.dueAt,
    stability: row.stability,
    difficulty: row.difficulty,
    scheduledDays: row.scheduledDays,
    learningSteps: row.learningSteps,
    lapses: row.lapses,
    reps: row.reps,
    lastRating: row.lastRating,
    introducedAt: row.introducedAt,
    lastReviewedAt: row.lastReviewedAt
  };
}
function getCycledExamplesForItem(itemId) {
  const cached2 = cycledExamplesCache.get(itemId);
  if (cached2) {
    return cached2;
  }
  const db2 = getDb();
  const rows = db2.select().from(corpusItemExamples).where((0, import_drizzle_orm3.eq)(corpusItemExamples.itemId, itemId)).orderBy((0, import_drizzle_orm3.asc)(corpusItemExamples.sortOrder)).all();
  const normalized = rows.map((row, index2) => ({
    sentence: row.sentence,
    translation: row.translation,
    index: index2
  }));
  cycledExamplesCache.set(itemId, normalized);
  return normalized;
}
var seeded = false;
function getDefaultSettings(now) {
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    selectedLanguageCodes: DEFAULT_LANGUAGE_CODES,
    dashboardLanguageCodes: DEFAULT_LANGUAGE_CODES,
    dashboardRangeDays: DEFAULT_DASHBOARD_RANGE_DAYS,
    preferredStudyMode: DEFAULT_STUDY_MODE,
    chineseReviewFlow: DEFAULT_CHINESE_REVIEW_FLOW,
    assumedWordListIds: DEFAULT_ASSUMED_WORD_LIST_IDS,
    updatedAt: now.toISOString()
  };
}
function buildSeededState(userId, itemId, now, overrides) {
  return {
    ...createInitialState(userId, itemId, now),
    ...overrides
  };
}
function normalizeLanguageCodes(codes, options) {
  const supported = new Set(getAllLanguages().map((language) => language.code));
  const normalized = [...new Set((codes ?? DEFAULT_LANGUAGE_CODES).filter((code) => supported.has(code)))];
  if (normalized.length > 0) {
    return normalized;
  }
  if (options?.allowEmpty && Array.isArray(codes)) {
    return [];
  }
  return DEFAULT_LANGUAGE_CODES;
}
function getLanguagesByCodes(languageCodes) {
  const byCode = new Map(getAllLanguages().map((language) => [language.code, language]));
  return languageCodes.map((code) => byCode.get(code)).filter((language) => Boolean(language));
}
function normalizeStudyLanguageCodes(codes, selectedLanguageCodes) {
  const normalized = normalizeLanguageCodes(codes ?? selectedLanguageCodes);
  const selectedSet = new Set(selectedLanguageCodes);
  const filtered = normalized.filter((code) => selectedSet.has(code));
  return filtered.length > 0 ? filtered : selectedLanguageCodes;
}
function normalizeDashboardLanguageCodes(codes, selectedLanguageCodes) {
  const normalized = normalizeLanguageCodes(codes, { allowEmpty: true });
  if (normalized.length === 0) {
    return [];
  }
  const selectedSet = new Set(selectedLanguageCodes);
  const filtered = normalized.filter((code) => selectedSet.has(code));
  return filtered.length > 0 ? filtered : selectedLanguageCodes;
}
function normalizeChineseReviewFlow(value) {
  return value === "two-click" || value === "four-click" ? value : DEFAULT_CHINESE_REVIEW_FLOW;
}
function normalizeAssumedWordListIds(listIds) {
  const availableListIds = new Set(getAvailableAssumedWordLists().map((list) => list.id));
  return [...new Set((listIds ?? []).filter((listId) => availableListIds.has(listId)))];
}
function normalizeDashboardRangeDays(value) {
  return value === 7 ? 7 : DEFAULT_DASHBOARD_RANGE_DAYS;
}
function buildSeededUserStates(userId, items, now) {
  const priorityIds = ["ser", "tener", "hacer", "poder", "ir", "decir", "ver", "querer", "dar", "palabra"];
  const prioritizedItems = priorityIds.map((itemId) => items.find((item) => item.id === itemId)).filter((item) => Boolean(item));
  const spanishItems = sortItemsByLanguageOrder(
    items.filter((item) => item.languageCode === "es"),
    ["es"]
  );
  const introductoryWave = spanishItems.slice(0, 36);
  const contentHeavyWave = spanishItems.filter(
    (item) => item.rank > 36 && !["article", "preposition", "conjunction", "determiner"].includes(item.pos)
  );
  const betaLanguageWave = getAllLanguages().filter((language) => language.code !== "es").flatMap(
    (language) => sortItemsByLanguageOrder(
      items.filter((item) => item.languageCode === language.code),
      [language.code]
    ).slice(0, 8)
  );
  const seedItems = [...prioritizedItems, ...contentHeavyWave, ...introductoryWave, ...betaLanguageWave].filter((item, index2, array) => array.findIndex((candidate) => candidate.id === item.id) === index2).slice(0, 112);
  return seedItems.reduce((states, item, index2) => {
    const isBetaLanguage = item.languageCode !== "es";
    const isDueNowSeed = index2 < 12 || isBetaLanguage && index2 % 7 === 0;
    const isNearFutureSeed = index2 >= 12 && index2 < 34;
    const isLongReviewSeed = index2 >= 34 && index2 < 82;
    const learningSeed = index2 >= 82;
    const introducedDaysAgo = 3 + index2 % 28;
    const lastReviewedDaysAgo = index2 % 8;
    const status = isDueNowSeed ? index2 % 3 === 0 ? "learning" : "review" : learningSeed ? index2 % 2 === 0 ? "learning" : "relearning" : "review";
    const dueAt = isDueNowSeed ? (0, import_date_fns2.subDays)(now, index2 % 3).toISOString() : isNearFutureSeed ? (0, import_date_fns2.addDays)(now, 1 + index2 % 7).toISOString() : isLongReviewSeed ? (0, import_date_fns2.addDays)(now, 6 + index2 % 20).toISOString() : (0, import_date_fns2.addDays)(now, 1 + index2 % 4).toISOString();
    states[item.id] = buildSeededState(userId, item.id, now, {
      status,
      dueAt,
      stability: Number((1.4 + index2 % 9 * 0.68).toFixed(2)),
      difficulty: Number((4.2 + index2 % 7 * 0.24).toFixed(2)),
      scheduledDays: isLongReviewSeed ? 5 + index2 % 12 : 1 + index2 % 4,
      learningSteps: status === "learning" || status === "relearning" ? 1 + index2 % 2 : 0,
      reps: 2 + index2 % 8,
      lapses: index2 % 11 === 0 ? 1 : 0,
      lastRating: status === "review" ? 3 : 2,
      introducedAt: (0, import_date_fns2.subDays)(now, introducedDaysAgo).toISOString(),
      lastReviewedAt: (0, import_date_fns2.subDays)(now, lastReviewedDaysAgo).toISOString()
    });
    return states;
  }, {});
}
function migrateFromJson(jsonPath) {
  let raw;
  try {
    raw = JSON.parse((0, import_fs3.readFileSync)(jsonPath, "utf8"));
  } catch {
    return;
  }
  const db2 = getDb();
  const now = /* @__PURE__ */ new Date();
  if (raw.userSettings) {
    for (const [userId, settings] of Object.entries(raw.userSettings)) {
      db2.insert(userSettings).values({
        userId,
        dailyGoal: settings.dailyGoal ?? DEFAULT_DAILY_GOAL,
        selectedLanguageCodes: JSON.stringify(
          normalizeLanguageCodes(settings.selectedLanguageCodes)
        ),
        dashboardLanguageCodes: JSON.stringify(
          normalizeLanguageCodes(settings.dashboardLanguageCodes ?? settings.selectedLanguageCodes)
        ),
        dashboardRangeDays: normalizeDashboardRangeDays(
          settings.dashboardRangeDays
        ),
        preferredStudyMode: settings.preferredStudyMode ?? DEFAULT_STUDY_MODE,
        chineseReviewFlow: normalizeChineseReviewFlow(settings.chineseReviewFlow),
        assumedWordListIds: JSON.stringify(
          normalizeAssumedWordListIds(
            settings.assumedWordListIds
          )
        ),
        updatedAt: settings.updatedAt ?? now.toISOString()
      }).onConflictDoNothing().run();
    }
  }
  if (raw.userStates) {
    for (const [userId, stateMap] of Object.entries(raw.userStates)) {
      for (const [itemId, state] of Object.entries(stateMap ?? {})) {
        if (!corpusItemExists(itemId)) continue;
        db2.insert(userItemStates).values({
          userId,
          itemId,
          status: state.status,
          dueAt: state.dueAt,
          stability: state.stability,
          difficulty: state.difficulty,
          scheduledDays: state.scheduledDays ?? 0,
          learningSteps: state.learningSteps ?? 0,
          lapses: state.lapses ?? 0,
          reps: state.reps ?? 0,
          lastRating: state.lastRating ?? null,
          introducedAt: state.introducedAt,
          lastReviewedAt: state.lastReviewedAt ?? null
        }).onConflictDoNothing().run();
      }
    }
  }
  if (raw.sessions) {
    for (const [, session] of Object.entries(raw.sessions)) {
      db2.insert(sessions).values({
        id: session.id,
        userId: session.userId,
        mode: session.mode,
        languageCodes: JSON.stringify(session.languageCodes),
        queue: JSON.stringify(session.queue),
        dueCount: session.dueCount,
        newCount: session.newCount,
        createdAt: session.createdAt,
        elapsedMs: session.elapsedMs ?? 0,
        completedAt: session.completedAt ?? null
      }).onConflictDoNothing().run();
    }
  }
  if (Array.isArray(raw.reviewEvents)) {
    for (const event of raw.reviewEvents) {
      if (!corpusItemExists(event.itemId)) continue;
      db2.insert(reviewEvents).values({
        id: event.id,
        userId: event.userId,
        itemId: event.itemId,
        rating: event.rating,
        elapsedMs: event.elapsedMs,
        reviewedAt: event.reviewedAt,
        mode: event.mode,
        stateBefore: event.stateBefore,
        stateAfter: event.stateAfter
      }).onConflictDoNothing().run();
    }
  }
}
function seedIfEmpty() {
  if (seeded) return;
  seeded = true;
  const db2 = getDb();
  const existing = db2.select().from(userSettings).get();
  if (existing) return;
  if ((0, import_fs3.existsSync)(LEGACY_STORE_PATH)) {
    migrateFromJson(LEGACY_STORE_PATH);
    const afterMigration = db2.select().from(userSettings).get();
    if (afterMigration) return;
  } else if ((0, import_fs3.existsSync)(LEGACY_STORE_PATH_OLD)) {
    migrateFromJson(LEGACY_STORE_PATH_OLD);
    const afterMigration = db2.select().from(userSettings).get();
    if (afterMigration) return;
  }
  const now = /* @__PURE__ */ new Date();
  const defaults = getDefaultSettings(now);
  db2.insert(userSettings).values({
    userId: DEMO_USER_ID,
    dailyGoal: defaults.dailyGoal,
    selectedLanguageCodes: JSON.stringify(defaults.selectedLanguageCodes),
    dashboardLanguageCodes: JSON.stringify(defaults.dashboardLanguageCodes),
    dashboardRangeDays: defaults.dashboardRangeDays,
    preferredStudyMode: defaults.preferredStudyMode,
    chineseReviewFlow: defaults.chineseReviewFlow,
    assumedWordListIds: JSON.stringify(defaults.assumedWordListIds),
    updatedAt: defaults.updatedAt
  }).run();
  const seededStates = buildSeededUserStates(DEMO_USER_ID, getAllCorpusItems(), now);
  for (const [itemId, state] of Object.entries(seededStates)) {
    db2.insert(userItemStates).values({
      userId: state.userId,
      itemId,
      status: state.status,
      dueAt: state.dueAt,
      stability: state.stability,
      difficulty: state.difficulty,
      scheduledDays: state.scheduledDays,
      learningSteps: state.learningSteps,
      lapses: state.lapses,
      reps: state.reps,
      lastRating: state.lastRating,
      introducedAt: state.introducedAt,
      lastReviewedAt: state.lastReviewedAt
    }).run();
  }
}
function getUserSettings(userId) {
  seedIfEmpty();
  const db2 = getDb();
  const row = db2.select().from(userSettings).where((0, import_drizzle_orm3.eq)(userSettings.userId, userId)).get();
  if (!row) {
    const defaults = getDefaultSettings(/* @__PURE__ */ new Date());
    db2.insert(userSettings).values({
      userId,
      dailyGoal: defaults.dailyGoal,
      selectedLanguageCodes: JSON.stringify(defaults.selectedLanguageCodes),
      dashboardLanguageCodes: JSON.stringify(defaults.dashboardLanguageCodes),
      dashboardRangeDays: defaults.dashboardRangeDays,
      preferredStudyMode: defaults.preferredStudyMode,
      chineseReviewFlow: defaults.chineseReviewFlow,
      assumedWordListIds: JSON.stringify(defaults.assumedWordListIds),
      updatedAt: defaults.updatedAt
    }).run();
    ensureProgressBackup(userId, "settings-created");
    return defaults;
  }
  const selectedLanguageCodes = normalizeLanguageCodes(JSON.parse(row.selectedLanguageCodes));
  const dashboardLanguageCodes = normalizeDashboardLanguageCodes(
    JSON.parse(row.dashboardLanguageCodes),
    selectedLanguageCodes
  );
  return {
    dailyGoal: row.dailyGoal,
    selectedLanguageCodes,
    dashboardLanguageCodes,
    dashboardRangeDays: normalizeDashboardRangeDays(row.dashboardRangeDays),
    preferredStudyMode: row.preferredStudyMode === "review-only" || row.preferredStudyMode === "new-only" ? row.preferredStudyMode : "everyday",
    chineseReviewFlow: normalizeChineseReviewFlow(row.chineseReviewFlow),
    assumedWordListIds: normalizeAssumedWordListIds(JSON.parse(row.assumedWordListIds)),
    updatedAt: row.updatedAt
  };
}
function getUserStates(userId) {
  seedIfEmpty();
  const db2 = getDb();
  const rows = db2.select().from(userItemStates).where((0, import_drizzle_orm3.eq)(userItemStates.userId, userId)).all();
  if (rows.length === 0) {
    return {};
  }
  const itemIdSet = getExistingCorpusItemIdSet(rows.map((row) => row.itemId));
  return Object.fromEntries(
    rows.filter((row) => itemIdSet.has(row.itemId)).map((row) => [row.itemId, {
      userId: row.userId,
      itemId: row.itemId,
      status: row.status,
      dueAt: row.dueAt,
      stability: row.stability,
      difficulty: row.difficulty,
      scheduledDays: row.scheduledDays,
      learningSteps: row.learningSteps,
      lapses: row.lapses,
      reps: row.reps,
      lastRating: row.lastRating,
      introducedAt: row.introducedAt,
      lastReviewedAt: row.lastReviewedAt
    }])
  );
}
function getUserEvents(userId) {
  seedIfEmpty();
  const db2 = getDb();
  const rows = db2.select().from(reviewEvents).where((0, import_drizzle_orm3.eq)(reviewEvents.userId, userId)).all();
  if (rows.length === 0) {
    return [];
  }
  const itemIdSet = getExistingCorpusItemIdSet(rows.map((row) => row.itemId));
  return rows.filter((row) => itemIdSet.has(row.itemId)).map((row) => ({
    id: row.id,
    userId: row.userId,
    itemId: row.itemId,
    rating: row.rating,
    elapsedMs: row.elapsedMs,
    reviewedAt: row.reviewedAt,
    mode: row.mode,
    stateBefore: row.stateBefore,
    stateAfter: row.stateAfter
  }));
}
function getReviewIdempotentResponse(params) {
  const db2 = getDb();
  const row = db2.select({
    responseJson: reviewIdempotency.responseJson
  }).from(reviewIdempotency).where(
    (0, import_drizzle_orm3.and)(
      (0, import_drizzle_orm3.eq)(reviewIdempotency.userId, params.userId),
      (0, import_drizzle_orm3.eq)(reviewIdempotency.sessionId, params.sessionId),
      (0, import_drizzle_orm3.eq)(reviewIdempotency.itemId, params.itemId),
      (0, import_drizzle_orm3.eq)(reviewIdempotency.idempotencyKey, params.idempotencyKey)
    )
  ).get();
  if (!row) {
    return null;
  }
  try {
    return JSON.parse(row.responseJson);
  } catch {
    return null;
  }
}
function persistReviewIdempotentResponse(params) {
  const id = `${params.userId}::${params.sessionId}::${params.itemId}::${params.idempotencyKey}`;
  const db2 = getDb();
  db2.insert(reviewIdempotency).values({
    id,
    userId: params.userId,
    sessionId: params.sessionId,
    itemId: params.itemId,
    idempotencyKey: params.idempotencyKey,
    responseJson: JSON.stringify(params.response),
    createdAt: params.createdAt
  }).onConflictDoUpdate({
    target: reviewIdempotency.id,
    set: {
      responseJson: JSON.stringify(params.response),
      createdAt: params.createdAt
    }
  }).run();
}
function getItem(itemId) {
  const db2 = getDb();
  const row = db2.select().from(corpusItems).where((0, import_drizzle_orm3.eq)(corpusItems.id, itemId)).get();
  return row ? rowToLexicalItem(row) : null;
}
function getSession(sessionId) {
  const db2 = getDb();
  const row = db2.select().from(sessions).where((0, import_drizzle_orm3.eq)(sessions.id, sessionId)).get();
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    mode: row.mode,
    languageCodes: JSON.parse(row.languageCodes),
    queue: JSON.parse(row.queue),
    dueCount: row.dueCount,
    newCount: row.newCount,
    createdAt: row.createdAt,
    elapsedMs: row.elapsedMs ?? 0,
    completedAt: row.completedAt ?? null
  };
}
function getUserSessions(userId) {
  const db2 = getDb();
  const rows = db2.select().from(sessions).where((0, import_drizzle_orm3.eq)(sessions.userId, userId)).all();
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    mode: row.mode,
    languageCodes: JSON.parse(row.languageCodes),
    queue: JSON.parse(row.queue),
    dueCount: row.dueCount,
    newCount: row.newCount,
    createdAt: row.createdAt,
    elapsedMs: row.elapsedMs ?? 0,
    completedAt: row.completedAt ?? null
  }));
}
function writeUserItemState(state) {
  const db2 = getDb();
  db2.insert(userItemStates).values({
    userId: state.userId,
    itemId: state.itemId,
    status: state.status,
    dueAt: state.dueAt,
    stability: state.stability,
    difficulty: state.difficulty,
    scheduledDays: state.scheduledDays,
    learningSteps: state.learningSteps,
    lapses: state.lapses,
    reps: state.reps,
    lastRating: state.lastRating,
    introducedAt: state.introducedAt,
    lastReviewedAt: state.lastReviewedAt
  }).onConflictDoUpdate({
    target: [userItemStates.userId, userItemStates.itemId],
    set: {
      status: state.status,
      dueAt: state.dueAt,
      stability: state.stability,
      difficulty: state.difficulty,
      scheduledDays: state.scheduledDays,
      learningSteps: state.learningSteps,
      lapses: state.lapses,
      reps: state.reps,
      lastRating: state.lastRating,
      introducedAt: state.introducedAt,
      lastReviewedAt: state.lastReviewedAt
    }
  }).run();
  markUserMutation(state.userId);
}
function writeSessionQueue(params) {
  const { sessionId, queue, dueCount, newCount } = params;
  const db2 = getDb();
  db2.update(sessions).set({
    queue: JSON.stringify(queue),
    ...typeof dueCount === "number" ? { dueCount } : {},
    ...typeof newCount === "number" ? { newCount } : {}
  }).where((0, import_drizzle_orm3.eq)(sessions.id, sessionId)).run();
}
function buildExampleTokens(sentence, languageCode, stateMap) {
  return buildChineseSentenceTokenPreviews({
    sentence,
    languageCode,
    stateMap
  });
}
function buildLanguageOrder(languageCodes) {
  return new Map(languageCodes.map((code, index2) => [code, index2]));
}
var HSK_LEVEL_CODE_PATTERN = /^zh-hsk(\d+)$/;
var HSK_ITEM_ID_PATTERN = /^new-hsk-(\d+)-(\d+)$/;
function getHskLevel(code) {
  const match = code.match(HSK_LEVEL_CODE_PATTERN);
  if (!match) {
    return null;
  }
  const level = Number.parseInt(match[1], 10);
  return Number.isFinite(level) ? level : null;
}
function getItemIntroductionOrder(item) {
  const hskMatch = item.id.match(HSK_ITEM_ID_PATTERN);
  if (hskMatch) {
    const numericId = Number.parseInt(hskMatch[2], 10);
    if (Number.isFinite(numericId)) {
      return numericId;
    }
  }
  return item.rank;
}
function shouldUseSequentialHskFreshOrder(languageCodes) {
  return languageCodes.length > 1 && languageCodes.every((code) => getHskLevel(code) !== null);
}
function compareSequentialFreshItems(left, right, languageCodes) {
  const order = buildLanguageOrder(languageCodes);
  const leftHskLevel = getHskLevel(left.languageCode);
  const rightHskLevel = getHskLevel(right.languageCode);
  if (leftHskLevel !== null && rightHskLevel !== null && leftHskLevel !== rightHskLevel) {
    return leftHskLevel - rightHskLevel;
  }
  if (left.languageCode !== right.languageCode) {
    return (order.get(left.languageCode) ?? 999) - (order.get(right.languageCode) ?? 999);
  }
  const introductionDelta = getItemIntroductionOrder(left) - getItemIntroductionOrder(right);
  if (introductionDelta !== 0) {
    return introductionDelta;
  }
  return left.rank - right.rank;
}
function sortItemsByLanguageOrder(items, languageCodes) {
  const order = buildLanguageOrder(languageCodes);
  return items.slice().sort((left, right) => {
    const languageDelta = (order.get(left.languageCode) ?? 999) - (order.get(right.languageCode) ?? 999);
    if (languageDelta !== 0) {
      return languageDelta;
    }
    return left.rank - right.rank;
  });
}
function pickFreshItemsByLanguage(items, limit, languageCodes) {
  if (limit <= 0) {
    return [];
  }
  if (shouldUseSequentialHskFreshOrder(languageCodes)) {
    return items.slice().sort((left, right) => compareSequentialFreshItems(left, right, languageCodes)).slice(0, limit);
  }
  const buckets = languageCodes.map(
    (code) => sortItemsByLanguageOrder(
      items.filter((item) => item.languageCode === code),
      languageCodes
    )
  );
  const selected = [];
  let progress = true;
  while (selected.length < limit && progress) {
    progress = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (!next) {
        continue;
      }
      selected.push(next);
      progress = true;
      if (selected.length >= limit) {
        break;
      }
    }
  }
  return selected;
}
function getItemsForLanguages(languageCodes) {
  return sortItemsByLanguageOrder(
    getCorpusItemsByLanguages(languageCodes),
    languageCodes
  );
}
function filterStateMapByLanguages(states, languageCodes) {
  const activeCodes = new Set(languageCodes);
  const languageByItemId = getItemLanguageMapForIds(Object.keys(states));
  return Object.fromEntries(
    Object.entries(states).filter(([itemId]) => {
      const itemLanguage = languageByItemId.get(itemId);
      return itemLanguage ? activeCodes.has(itemLanguage) : false;
    })
  );
}
function filterEventsByLanguages(events, languageCodes) {
  const activeCodes = new Set(languageCodes);
  const languageByItemId = getItemLanguageMapForIds(events.map((event) => event.itemId));
  return events.filter((event) => {
    const itemLanguage = languageByItemId.get(event.itemId);
    return itemLanguage ? activeCodes.has(itemLanguage) : false;
  });
}
function isDueNow(state, now) {
  return !(0, import_date_fns2.isBefore)(now, new Date(state.dueAt));
}
function formatNextDueLabel(dueAt, now) {
  if (!dueAt) {
    return "No reviews queued";
  }
  const dueDate = new Date(dueAt);
  const hoursAway = Math.round((dueDate.getTime() - now.getTime()) / (1e3 * 60 * 60));
  if (hoursAway <= 0) {
    return "Ready now";
  }
  if (hoursAway < 24) {
    return `In ${hoursAway} hr`;
  }
  const daysAway = Math.round(hoursAway / 24);
  return `In ${daysAway} day${daysAway === 1 ? "" : "s"}`;
}
function getListTitles(itemId) {
  return getCuratedLists().filter((list) => list.itemIds.some((candidate) => candidate === itemId)).map((list) => list.title);
}
function toRankedEntry(item, state, focusItemId, now) {
  const retrievability = state ? getRetrievability(state, now) : null;
  return {
    itemId: item.id,
    languageCode: item.languageCode,
    displayForm: item.displayForm,
    primaryGloss: item.primaryGloss,
    pos: item.pos,
    rank: item.rank,
    example: item.example,
    translation: item.translation,
    status: state?.status ?? "not-introduced",
    nextDueLabel: state ? formatNextDueLabel(state.dueAt, now) : "Available for introduction",
    reps: state?.reps ?? 0,
    lapses: state?.lapses ?? 0,
    retrievabilityPercent: typeof retrievability === "number" ? Math.round(retrievability * 100) : null,
    isFocus: focusItemId === item.id,
    listTitles: getListTitles(item.id)
  };
}
function getRankedEntries(stateMap, focusItemId, now, languageCodes) {
  return getItemsForLanguages(languageCodes).map((item) => toRankedEntry(item, stateMap[item.id], focusItemId, now));
}
function getCycledExample(itemId, reps) {
  const examples = getCycledExamplesForItem(itemId);
  if (examples.length === 0) return null;
  const idx = reps % examples.length;
  return examples[idx];
}
function toCard(item, userId, current, now, stateMap) {
  const state = current ?? createInitialState(userId, item.id, now);
  const cycled = getCycledExample(item.id, state.reps);
  const example = cycled?.sentence ?? item.example;
  const needsPreviewStateMap = isHskSentencePreviewLanguage(item.languageCode);
  const previewStateMap = needsPreviewStateMap ? stateMap ?? getUserStates(userId) : EMPTY_STATE_MAP;
  return {
    itemId: item.id,
    languageCode: item.languageCode,
    isNew: !current || current.reps === 0 || current.status === "new",
    displayForm: item.displayForm,
    lemma: item.lemma,
    primaryGloss: item.primaryGloss,
    pos: item.pos,
    rank: item.rank,
    example,
    translation: cycled?.translation ?? item.translation,
    pronunciation: item.pronunciation,
    exampleIndex: cycled?.index,
    secondaryGlosses: item.secondaryGlosses,
    notes: item.notes,
    ratingPreviews: getRatingPreviews(state, now),
    exampleTokens: needsPreviewStateMap ? buildExampleTokens(example, item.languageCode, previewStateMap) : void 0
  };
}
function getShortWeekdayLabel(date) {
  return ["Su", "M", "Tu", "W", "Th", "F", "Sa"][date.getDay()] ?? "";
}
function buildQueueSnapshot(userId, dailyGoal, languageCodes, mode, now, options) {
  const allStates = getUserStates(userId);
  const states = filterStateMapByLanguages(allStates, languageCodes);
  const itemsForLanguages = getItemsForLanguages(languageCodes);
  const itemsById = new Map(itemsForLanguages.map((item) => [item.id, item]));
  const languageOrder = buildLanguageOrder(languageCodes);
  const dueSoftCap = Math.max(1, options?.dueSoftCap ?? Number.MAX_SAFE_INTEGER);
  const dueCandidates = Object.values(states).filter((state) => isDueNow(state, now)).sort((left, right) => {
    const retrievabilityDelta = (getRetrievability(left, now) ?? -1) - (getRetrievability(right, now) ?? -1);
    if (retrievabilityDelta !== 0) {
      return retrievabilityDelta;
    }
    const dueDelta = new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    if (dueDelta !== 0) {
      return dueDelta;
    }
    const leftItem = itemsById.get(left.itemId);
    const rightItem = itemsById.get(right.itemId);
    const languageDelta = (languageOrder.get(leftItem?.languageCode ?? "es") ?? 999) - (languageOrder.get(rightItem?.languageCode ?? "es") ?? 999);
    if (languageDelta !== 0) {
      return languageDelta;
    }
    return (leftItem?.rank ?? 9999) - (rightItem?.rank ?? 9999);
  }).map((state) => state.itemId).slice(0, dueSoftCap);
  const freshCandidates = pickFreshItemsByLanguage(
    itemsForLanguages.filter((item) => !states[item.id]),
    dailyGoal,
    languageCodes
  ).map((item) => item.id);
  const due = mode === "new-only" ? [] : dueCandidates;
  const fresh = mode === "review-only" ? [] : freshCandidates;
  const queue = mode === "review-only" ? due : mode === "new-only" ? fresh : [...due, ...fresh];
  return {
    due,
    fresh,
    queue
  };
}
function buildReviewsDueSeries(userId, dailyGoal, languageCodes, mode, now) {
  const states = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const { queue } = buildQueueSnapshot(userId, dailyGoal, languageCodes, mode, now, {
    dueSoftCap: Number.MAX_SAFE_INTEGER
  });
  const today = (0, import_date_fns2.startOfDay)(now);
  const dueNowCount = Object.values(states).filter((state) => isDueNow(state, now)).length;
  const series = Array.from({ length: 30 }, (_, index2) => {
    const day = (0, import_date_fns2.addDays)(today, index2);
    const label = index2 === 0 ? "Today" : getShortWeekdayLabel(day);
    return {
      label,
      shortLabel: label,
      value: 0
    };
  });
  series[0].value = dueNowCount;
  Object.values(states).forEach((state) => {
    const offset = (0, import_date_fns2.differenceInCalendarDays)((0, import_date_fns2.startOfDay)(new Date(state.dueAt)), today);
    if (offset > 0 && offset < series.length) {
      series[offset].value += 1;
    }
  });
  queue.forEach((itemId) => {
    const current = states[itemId] ?? createInitialState(userId, itemId, now);
    const scheduled = scheduleReview(current, 3, now);
    const offset = (0, import_date_fns2.differenceInCalendarDays)((0, import_date_fns2.startOfDay)(new Date(scheduled.dueAt)), today);
    if (offset > 0 && offset < series.length) {
      series[offset].value += 1;
    }
  });
  return series;
}
function buildVocabularyGrowthSeries(userId, languageCodes, now) {
  const states = Object.values(filterStateMapByLanguages(getUserStates(userId), languageCodes));
  const items = getItemsForLanguages(languageCodes);
  const today = (0, import_date_fns2.startOfDay)(now);
  return Array.from({ length: 30 }, (_, index2) => {
    const day = (0, import_date_fns2.addDays)(today, index2 - 29);
    const dayEnd = (0, import_date_fns2.endOfDay)(day);
    let introduced = 0;
    let learning = 0;
    let solid = 0;
    states.forEach((state) => {
      const introducedAt = new Date(state.introducedAt);
      if (introducedAt > dayEnd) {
        return;
      }
      introduced += 1;
      const age = (0, import_date_fns2.differenceInCalendarDays)(dayEnd, introducedAt);
      let isSolid = false;
      if (state.status === "review" && age >= 4) {
        const lastReviewed = state.lastReviewedAt ? new Date(state.lastReviewedAt) : null;
        if (lastReviewed && state.scheduledDays > 0) {
          const estimatedReviewEntry = (0, import_date_fns2.addDays)(lastReviewed, -state.scheduledDays);
          isSolid = dayEnd >= estimatedReviewEntry;
        } else {
          isSolid = true;
        }
      }
      if (isSolid) {
        solid += 1;
      } else {
        learning += 1;
      }
    });
    return {
      label: index2 === 0 ? "30 days ago" : index2 === 29 ? "Today" : "",
      shortLabel: index2 === 0 ? "30 days ago" : index2 === 29 ? "Today" : "",
      learning,
      solid,
      notIntroduced: Math.max(0, items.length - introduced)
    };
  });
}
function getStudyActivityDays(states, events) {
  const reviewedDays = /* @__PURE__ */ new Set();
  states.forEach((state) => {
    if (state.lastReviewedAt) {
      reviewedDays.add(new Date(state.lastReviewedAt).toDateString());
    }
  });
  events.forEach((event) => {
    reviewedDays.add(new Date(event.reviewedAt).toDateString());
  });
  return reviewedDays;
}
function buildConsistencySeries(states, events, now) {
  const today = (0, import_date_fns2.startOfDay)(now);
  const activeDays = getStudyActivityDays(states, events);
  return Array.from({ length: 35 }, (_, index2) => {
    const day = (0, import_date_fns2.addDays)(today, index2 - 34);
    return {
      label: day.toDateString(),
      shortLabel: index2 === 34 ? "Today" : getShortWeekdayLabel(day),
      active: activeDays.has(day.toDateString()),
      isToday: index2 === 34
    };
  });
}
function getStreakDays(states, events, now) {
  const reviewedDays = getStudyActivityDays(states, events);
  if (reviewedDays.size === 0) {
    return 0;
  }
  let streak = 0;
  let cursor = new Date(now);
  if (!reviewedDays.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (reviewedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function getReviewsTodayCount(states, events, now) {
  const eventCount = events.filter((event) => (0, import_date_fns2.isSameDay)(new Date(event.reviewedAt), now)).length;
  if (eventCount > 0) {
    return eventCount;
  }
  return states.filter((state) => state.lastReviewedAt && (0, import_date_fns2.isSameDay)(new Date(state.lastReviewedAt), now)).length;
}
function sessionOverlapsLanguageFilter(session, languageCodes) {
  if (languageCodes.length === 0) {
    return false;
  }
  return session.languageCodes.some((languageCode) => languageCodes.includes(languageCode));
}
function estimateLegacySessionElapsedMs(session, nextSession, events) {
  const sessionStartMs = new Date(session.createdAt).getTime();
  const nextSessionStartMs = nextSession ? new Date(nextSession.createdAt).getTime() : Number.POSITIVE_INFINITY;
  const relevantEvents = events.filter((event) => {
    const reviewedAtMs = new Date(event.reviewedAt).getTime();
    return reviewedAtMs >= sessionStartMs && reviewedAtMs < nextSessionStartMs;
  }).sort((left, right) => new Date(left.reviewedAt).getTime() - new Date(right.reviewedAt).getTime());
  if (relevantEvents.length === 0) {
    return 0;
  }
  const ACTIVE_GAP_CAP_MS = 9e4;
  let previousTimestampMs = sessionStartMs;
  return relevantEvents.reduce((sum, event) => {
    const reviewedAtMs = new Date(event.reviewedAt).getTime();
    const gapMs = Math.max(0, reviewedAtMs - previousTimestampMs);
    previousTimestampMs = reviewedAtMs;
    return sum + Math.min(gapMs, ACTIVE_GAP_CAP_MS);
  }, 0);
}
function getTimeStudiedTodayMs(userId, languageCodes, events, now) {
  const sessionsToday = getUserSessions(userId).filter((session) => (0, import_date_fns2.isSameDay)(new Date(session.createdAt), now)).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  return sessionsToday.reduce((sum, session, index2) => {
    if (!sessionOverlapsLanguageFilter(session, languageCodes)) {
      return sum;
    }
    const exactElapsedMs = Math.max(session.elapsedMs ?? 0, 0);
    if (exactElapsedMs > 0) {
      return sum + exactElapsedMs;
    }
    const nextSession = sessionsToday[index2 + 1] ?? null;
    return sum + estimateLegacySessionElapsedMs(session, nextSession, events);
  }, 0);
}
function getLifetimeReviewsCount(states, events) {
  if (events.length > 0) {
    return events.length;
  }
  return states.reduce((sum, state) => sum + state.reps, 0);
}
function getRetentionScore(states, now) {
  const retrievabilities = states.filter((state) => state.reps > 0).map((state) => getRetrievability(state, now)).filter((value) => typeof value === "number");
  if (retrievabilities.length === 0) {
    return 0;
  }
  const average = retrievabilities.reduce((sum, value) => sum + value, 0) / retrievabilities.length;
  return Math.round(average * 100);
}
function getIntroducedTodayCount(states, now) {
  return states.filter((state) => (0, import_date_fns2.isSameDay)(new Date(state.introducedAt), now)).length;
}
function getAverageNewWordsPerDay(states, now) {
  if (states.length === 0) return 0;
  const earliest = states.reduce((min, s) => {
    const d = new Date(s.introducedAt);
    return d < min ? d : min;
  }, new Date(states[0].introducedAt));
  const days = Math.max(1, (0, import_date_fns2.differenceInCalendarDays)(now, earliest) + 1);
  return Math.round(states.length / days * 10) / 10;
}
function buildStudyPlan(userId, dailyGoal, languageCodes, mode, now) {
  const states = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const { due, fresh, queue } = buildQueueSnapshot(userId, dailyGoal, languageCodes, mode, now);
  const tomorrowCutoff = (0, import_date_fns2.endOfTomorrow)();
  let earliestPlannedDue = null;
  const tomorrowDueEstimate = queue.reduce((count, itemId) => {
    const current = states[itemId] ?? createInitialState(userId, itemId, now);
    const scheduled = scheduleReview(current, 3, now);
    const dueAt = new Date(scheduled.dueAt);
    if (!earliestPlannedDue || dueAt.getTime() < new Date(earliestPlannedDue).getTime()) {
      earliestPlannedDue = scheduled.dueAt;
    }
    return dueAt <= tomorrowCutoff ? count + 1 : count;
  }, 0);
  return {
    dueNow: due.length,
    newCards: fresh.length,
    totalCards: queue.length,
    estimatedMinutes: queue.length === 0 ? 0 : Math.max(4, Math.round(queue.length * 0.9)),
    tomorrowDueEstimate,
    nextReviewWindowLabel: formatNextDueLabel(earliestPlannedDue, now)
  };
}
function getSessionInsights(userId, languageCodes, now) {
  const allStates = getUserStates(userId);
  const stateMap = filterStateMapByLanguages(allStates, languageCodes);
  const states = Object.values(stateMap);
  const events = filterEventsByLanguages(getUserEvents(userId), languageCodes);
  const languageByItemId = getItemLanguageMapForIds(Object.keys(stateMap));
  const languageSet = new Set(languageCodes);
  const dueByLanguage = {};
  for (const code of languageCodes) {
    dueByLanguage[code] = 0;
  }
  for (const state of Object.values(allStates)) {
    const languageCode = languageByItemId.get(state.itemId);
    if (!languageCode || !languageSet.has(languageCode)) {
      continue;
    }
    if (isDueNow(state, now)) {
      dueByLanguage[languageCode] += 1;
    }
  }
  return {
    reviewsToday: getReviewsTodayCount(states, events, now),
    newWordsToday: getIntroducedTodayCount(states, now),
    streakDays: getStreakDays(states, events, now),
    retentionScore: getRetentionScore(states, now),
    dueByLanguage
  };
}
function getLearnerSettings(userId) {
  return getUserSettings(userId);
}
function getLanguageCatalog() {
  return getAllLanguages();
}
function getAvailableAssumedWordLists2() {
  return getAvailableAssumedWordLists();
}
function updateLearnerSettings(userId, updates) {
  ensureProgressBackup(userId, "before-settings-update");
  const settings = getUserSettings(userId);
  const db2 = getDb();
  const selectedLanguageCodes = normalizeLanguageCodes(
    updates.selectedLanguageCodes ?? settings.selectedLanguageCodes
  );
  const dashboardLanguageCodes = normalizeDashboardLanguageCodes(
    updates.dashboardLanguageCodes ?? settings.dashboardLanguageCodes,
    selectedLanguageCodes
  );
  const updated = {
    ...settings,
    dailyGoal: updates.dailyGoal ?? settings.dailyGoal,
    selectedLanguageCodes,
    dashboardLanguageCodes,
    dashboardRangeDays: normalizeDashboardRangeDays(updates.dashboardRangeDays ?? settings.dashboardRangeDays),
    preferredStudyMode: updates.preferredStudyMode ?? settings.preferredStudyMode,
    chineseReviewFlow: normalizeChineseReviewFlow(updates.chineseReviewFlow ?? settings.chineseReviewFlow),
    assumedWordListIds: normalizeAssumedWordListIds(updates.assumedWordListIds ?? settings.assumedWordListIds),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db2.update(userSettings).set({
    dailyGoal: updated.dailyGoal,
    selectedLanguageCodes: JSON.stringify(updated.selectedLanguageCodes),
    dashboardLanguageCodes: JSON.stringify(updated.dashboardLanguageCodes),
    dashboardRangeDays: updated.dashboardRangeDays,
    preferredStudyMode: updated.preferredStudyMode,
    chineseReviewFlow: updated.chineseReviewFlow,
    assumedWordListIds: JSON.stringify(updated.assumedWordListIds),
    updatedAt: updated.updatedAt
  }).where((0, import_drizzle_orm3.eq)(userSettings.userId, userId)).run();
  markUserMutation(userId);
  ensureProgressBackup(userId, "after-settings-update");
  return {
    settings: updated,
    dashboard: buildDashboardSnapshot(userId)
  };
}
function getStudyPlan(userId, options) {
  const settings = getUserSettings(userId);
  const now = /* @__PURE__ */ new Date();
  const dailyGoal = options?.dailyGoal ?? settings.dailyGoal;
  const languageCodes = normalizeStudyLanguageCodes(
    options?.languageCodes,
    settings.selectedLanguageCodes
  );
  const mode = options?.mode ?? settings.preferredStudyMode;
  return buildStudyPlan(userId, dailyGoal, languageCodes, mode, now);
}
function startSession(userId, options) {
  const states = getUserStates(userId);
  const settings = getUserSettings(userId);
  const now = /* @__PURE__ */ new Date();
  const languageCodes = normalizeStudyLanguageCodes(
    options?.languageCodes,
    settings.selectedLanguageCodes
  );
  const mode = options?.mode ?? settings.preferredStudyMode;
  const insights = getSessionInsights(userId, languageCodes, now);
  const studyPlan = buildStudyPlan(userId, settings.dailyGoal, languageCodes, mode, now);
  const { due, fresh, queue } = buildQueueSnapshot(userId, SESSION_FRESH_POOL, languageCodes, mode, now);
  const sessionId = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const session = {
    id: sessionId,
    userId,
    mode,
    languageCodes,
    queue,
    dueCount: due.length,
    newCount: fresh.length,
    createdAt: now.toISOString(),
    elapsedMs: 0,
    completedAt: null
  };
  const db2 = getDb();
  db2.insert(sessions).values({
    id: session.id,
    userId: session.userId,
    mode: session.mode,
    languageCodes: JSON.stringify(session.languageCodes),
    queue: JSON.stringify(session.queue),
    dueCount: session.dueCount,
    newCount: session.newCount,
    createdAt: session.createdAt,
    elapsedMs: session.elapsedMs,
    completedAt: session.completedAt
  }).run();
  return {
    sessionId: session.id,
    dueCount: session.dueCount,
    newCount: session.newCount,
    remainingCount: session.queue.length,
    languageCodes,
    mode,
    dailyGoal: settings.dailyGoal,
    insights,
    studyPlan,
    firstCard: session.queue[0] ? toCard(getItem(session.queue[0]), userId, states[session.queue[0]] ?? null, now, states) : null
  };
}
function resumeSession(sessionId) {
  const session = getSession(sessionId);
  if (!session) return null;
  const now = /* @__PURE__ */ new Date();
  const firstItemId = session.queue[0] ?? null;
  const states = getUserStates(session.userId);
  const firstItem = firstItemId ? getItem(firstItemId) : null;
  const firstCard = firstItem ? toCard(firstItem, session.userId, states[firstItemId] ?? null, now, states) : null;
  const insights = getSessionInsights(session.userId, session.languageCodes, now);
  return {
    sessionId: session.id,
    dueCount: session.dueCount,
    newCount: session.newCount,
    remainingCount: session.queue.length,
    languageCodes: session.languageCodes,
    mode: session.mode,
    insights,
    firstCard
  };
}
function getNextCard(sessionId) {
  const session = getSession(sessionId);
  if (!session) {
    return null;
  }
  const itemId = session.queue[0];
  if (!itemId) {
    return null;
  }
  const item = getItem(itemId);
  const states = getUserStates(session.userId);
  return item ? toCard(item, session.userId, states[itemId] ?? null, /* @__PURE__ */ new Date(), states) : null;
}
function buildDashboardSnapshot(userId, languageCodeOverrides) {
  const settings = getUserSettings(userId);
  const selectedLanguageCodes = settings.selectedLanguageCodes;
  const languageCodes = normalizeDashboardLanguageCodes(
    languageCodeOverrides ?? settings.dashboardLanguageCodes,
    selectedLanguageCodes
  );
  const cacheKey = [
    userId,
    `mut:${getUserMutationCounter(userId)}`,
    `settings:${settings.updatedAt}`,
    `goal:${settings.dailyGoal}`,
    `range:${settings.dashboardRangeDays}`,
    `mode:${settings.preferredStudyMode}`,
    `langs:${languageCodes.join(",")}`
  ].join("|");
  const cached2 = dashboardSnapshotCache.get(cacheKey);
  const nowMs = Date.now();
  if (cached2 && cached2.expiresAt > nowMs) {
    return cached2.snapshot;
  }
  const stateMap = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const states = Object.values(stateMap);
  const events = filterEventsByLanguages(getUserEvents(userId), languageCodes);
  const activeItems = getItemsForLanguages(languageCodes);
  const now = new Date(nowMs);
  const reviewsToday = getReviewsTodayCount(states, events, now);
  const introducedToday = getIntroducedTodayCount(states, now);
  const timeStudiedTodayMs = getTimeStudiedTodayMs(userId, languageCodes, events, now);
  const totalReviews = getLifetimeReviewsCount(states, events);
  const dueCount = states.filter((state) => !(0, import_date_fns2.isBefore)(now, new Date(state.dueAt))).length;
  const newAvailableCount = activeItems.filter((item) => !stateMap[item.id]).length;
  const activeWords = Object.keys(stateMap).length;
  const coveragePercent = activeItems.length === 0 ? 0 : Math.round(activeWords / activeItems.length * 100);
  const exampleCoveragePercent = activeItems.length === 0 ? 0 : Math.round(
    activeItems.filter((item) => item.example.trim() && item.translation.trim()).length / activeItems.length * 100
  );
  const upcomingState = [...states].filter((state) => (0, import_date_fns2.isBefore)(now, new Date(state.dueAt))).sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())[0];
  const snapshot = {
    availableLanguages: getLanguagesByCodes(selectedLanguageCodes),
    activeLanguageCodes: languageCodes,
    dashboardRangeDays: settings.dashboardRangeDays,
    preferredStudyMode: settings.preferredStudyMode,
    corpusSize: activeItems.length,
    exampleCoveragePercent,
    audioCoveragePercent: 100,
    dueCount,
    newAvailableCount,
    activeWords,
    coveragePercent,
    dailyGoal: settings.dailyGoal,
    reviewsToday,
    introducedToday,
    timeStudiedTodayMs,
    averageNewPerDay: getAverageNewWordsPerDay(states, now),
    totalReviews,
    streakDays: getStreakDays(states, events, now),
    retentionScore: getRetentionScore(states, now),
    nextDueLabel: formatNextDueLabel(upcomingState?.dueAt ?? null, now),
    focusItem: null,
    studyPlan: buildStudyPlan(userId, settings.dailyGoal, languageCodes, settings.preferredStudyMode, now),
    reviewsDueSeries: buildReviewsDueSeries(
      userId,
      settings.dailyGoal,
      languageCodes,
      settings.preferredStudyMode,
      now
    ),
    vocabularyGrowthSeries: buildVocabularyGrowthSeries(userId, languageCodes, now),
    consistencySeries: buildConsistencySeries(states, events, now)
  };
  dashboardSnapshotCache.set(cacheKey, {
    snapshot,
    expiresAt: nowMs + DASHBOARD_CACHE_TTL_MS
  });
  return snapshot;
}
function getDashboardSnapshot(userId, options) {
  return buildDashboardSnapshot(userId, options?.languageCodes);
}
function getSiteSnapshot(userId) {
  const now = /* @__PURE__ */ new Date();
  const dashboard = buildDashboardSnapshot(userId);
  const settings = getUserSettings(userId);
  const stateMap = getUserStates(userId);
  const queue = buildQueueSnapshot(
    userId,
    settings.dailyGoal,
    dashboard.activeLanguageCodes,
    settings.preferredStudyMode,
    now
  ).queue;
  const featuredItemId = queue[0] ?? null;
  const item = featuredItemId ? getItem(featuredItemId) : null;
  const state = featuredItemId ? stateMap[featuredItemId] ?? createInitialState(userId, featuredItemId, now) : null;
  return {
    dashboard,
    featuredCard: item && state ? toCard(item, userId, state, now, stateMap) : null
  };
}
function getRecentStudiedWords(userId, languageCodes, limit = 4) {
  const now = /* @__PURE__ */ new Date();
  const stateMap = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const stateEntries = Object.entries(stateMap).sort(([, a], [, b]) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, limit);
  return stateEntries.map(([itemId, state]) => {
    const item = getItem(itemId);
    if (!item) return null;
    const retrievability = getRetrievability(state, now);
    return {
      itemId: item.id,
      languageCode: item.languageCode,
      displayForm: item.displayForm,
      primaryGloss: item.primaryGloss,
      pos: item.pos,
      rank: item.rank,
      example: item.example,
      translation: item.translation,
      status: state.status,
      nextDueLabel: formatNextDueLabel(state.dueAt, now),
      reps: state.reps,
      lapses: state.lapses,
      retrievabilityPercent: retrievability === null ? null : Math.round(retrievability * 100),
      isFocus: false,
      listTitles: []
    };
  }).filter((entry) => entry !== null);
}
function getLibrarySnapshot(userId) {
  const now = /* @__PURE__ */ new Date();
  const settings = getUserSettings(userId);
  const selectedLanguageCodes = settings.selectedLanguageCodes;
  const activeItems = getItemsForLanguages(selectedLanguageCodes);
  const stateMap = filterStateMapByLanguages(
    getUserStates(userId),
    selectedLanguageCodes
  );
  const items = getRankedEntries(
    stateMap,
    null,
    now,
    selectedLanguageCodes
  );
  return {
    coveragePercent: activeItems.length === 0 ? 0 : Math.round(Object.keys(stateMap).length / activeItems.length * 100),
    dailyGoal: settings.dailyGoal,
    focusItem: null,
    items
  };
}
function getListsSnapshot(userId) {
  const now = /* @__PURE__ */ new Date();
  const stateMap = getUserStates(userId);
  const settings = getUserSettings(userId);
  const dashboard = buildDashboardSnapshot(userId);
  const lists = getCuratedLists().map((list) => {
    const items = list.itemIds.map((itemId) => getItem(itemId)).filter((item) => Boolean(item)).sort((left, right) => left.rank - right.rank).map((item) => toRankedEntry(item, stateMap[item.id], null, now));
    const introducedItems = items.filter((item) => item.status !== "not-introduced").length;
    const dueNow = items.filter((item) => {
      const state = stateMap[item.itemId];
      return state ? isDueNow(state, now) : false;
    }).length;
    return {
      id: list.id,
      title: list.title,
      description: list.description,
      totalItems: items.length,
      introducedItems,
      dueNow,
      completionPercent: items.length === 0 ? 0 : Math.round(introducedItems / items.length * 100),
      items
    };
  }).sort((left, right) => {
    if (right.dueNow !== left.dueNow) {
      return right.dueNow - left.dueNow;
    }
    if (right.introducedItems !== left.introducedItems) {
      return right.introducedItems - left.introducedItems;
    }
    return left.title.localeCompare(right.title);
  });
  return {
    dailyGoal: settings.dailyGoal,
    reviewDueCount: dashboard.dueCount,
    trackedWordCount: Object.keys(stateMap).length,
    focusItem: null,
    lists
  };
}
function getWordsSnapshot(userId) {
  const now = /* @__PURE__ */ new Date();
  const settings = getUserSettings(userId);
  const selectedLanguageCodes = settings.selectedLanguageCodes;
  const stateMap = filterStateMapByLanguages(
    getUserStates(userId),
    selectedLanguageCodes
  );
  const rankedEntries = getRankedEntries(
    stateMap,
    null,
    now,
    selectedLanguageCodes
  );
  const buildSection = (section) => section;
  const sections = [
    buildSection({
      id: "review-now",
      title: "Review Now",
      description: "Words currently at risk of being forgotten. This is the first thing Everyday-style study should protect.",
      items: rankedEntries.filter((item) => {
        const state = stateMap[item.itemId];
        return state ? isDueNow(state, now) : false;
      })
    }),
    buildSection({
      id: "learning",
      title: "Learning",
      description: "Fresh or fragile memories still in short-term steps before they become durable review items.",
      items: rankedEntries.filter((item) => {
        const state = stateMap[item.itemId];
        return state ? !isDueNow(state, now) && (state.status === "learning" || state.status === "relearning" || state.status === "new") : false;
      })
    }),
    buildSection({
      id: "review-later",
      title: "Review Later",
      description: "Words already in long-term rotation with a future due date. These are stable, but still scheduled.",
      items: rankedEntries.filter((item) => {
        const state = stateMap[item.itemId];
        return state ? !isDueNow(state, now) && state.status === "review" : false;
      })
    }),
    buildSection({
      id: "not-introduced",
      title: "Ready To Introduce",
      description: "Top-ranked words not yet in the learner state because today already has enough load.",
      items: rankedEntries.filter((item) => item.status === "not-introduced")
    })
  ];
  return {
    dailyGoal: settings.dailyGoal,
    availableLanguages: getLanguagesByCodes(selectedLanguageCodes),
    activeLanguageCodes: selectedLanguageCodes,
    preferredStudyMode: settings.preferredStudyMode,
    focusItem: null,
    studyPlan: buildStudyPlan(
      userId,
      settings.dailyGoal,
      selectedLanguageCodes,
      settings.preferredStudyMode,
      now
    ),
    sections
  };
}
function getWordSnapshot(userId, itemId) {
  const now = /* @__PURE__ */ new Date();
  const stateMap = getUserStates(userId);
  const item = getItem(itemId);
  if (!item) {
    return null;
  }
  const state = stateMap[itemId];
  const rankedItem = toRankedEntry(item, state, null, now);
  const neighborRows = getDb().select().from(corpusItems).where((0, import_drizzle_orm3.and)(
    (0, import_drizzle_orm3.ne)(corpusItems.id, itemId),
    (0, import_drizzle_orm3.eq)(corpusItems.languageCode, item.languageCode),
    (0, import_drizzle_orm3.between)(corpusItems.rank, item.rank - 2, item.rank + 2)
  )).orderBy((0, import_drizzle_orm3.asc)(corpusItems.rank)).all();
  const neighbors = neighborRows.map(rowToLexicalItem).map((candidate) => toRankedEntry(candidate, stateMap[candidate.id], null, now));
  const detailState = state ?? createInitialState(userId, itemId, now);
  const retrievability = state ? getRetrievability(state, now) : null;
  let studyReason = "Top-ranked word waiting to be introduced.";
  if (state) {
    if (isDueNow(state, now)) {
      studyReason = "Due now inside the active study queue.";
    } else if (state.status === "learning" || state.status === "relearning") {
      studyReason = "Still in short-term learning steps before it stabilizes.";
    } else {
      studyReason = "Already scheduled in long-term review and visible here for inspection.";
    }
  }
  const examples = getDb().select().from(corpusItemExamples).where((0, import_drizzle_orm3.eq)(corpusItemExamples.itemId, itemId)).orderBy((0, import_drizzle_orm3.asc)(corpusItemExamples.sortOrder)).all().map((r) => ({
    sentence: r.sentence,
    translation: r.translation,
    tokens: buildExampleTokens(r.sentence, item.languageCode, stateMap)
  }));
  return {
    item: rankedItem,
    lemma: item.lemma,
    notes: item.notes,
    studyReason,
    introducedAt: state?.introducedAt ?? null,
    lastReviewedAt: state?.lastReviewedAt ?? null,
    reps: state?.reps ?? 0,
    lapses: state?.lapses ?? 0,
    scheduledDays: state?.scheduledDays ?? 0,
    learningSteps: state?.learningSteps ?? 0,
    retrievabilityPercent: typeof retrievability === "number" ? Math.round(retrievability * 100) : null,
    ratingPreviews: getRatingPreviews(detailState, now),
    relatedWords: neighbors,
    examples
  };
}
function getItemById(itemId) {
  const item = getItem(itemId);
  const stateMap = getUserStates(DEMO_USER_ID);
  return item ? toCard(item, DEMO_USER_ID, stateMap[itemId] ?? null, /* @__PURE__ */ new Date(), stateMap) : null;
}
function learnPreviewItem(params) {
  const { userId, itemId, sessionId } = params;
  const item = getItem(itemId);
  if (!item) {
    throw new Error("Item not found");
  }
  if (!isHskSentencePreviewLanguage(item.languageCode)) {
    throw new Error("Item is not eligible for Chinese sentence preview learning");
  }
  const now = /* @__PURE__ */ new Date();
  const stateMap = getUserStates(userId);
  const existingState = stateMap[itemId];
  const beforeProgressCounts = getProgressCounts(userId);
  let currentState = existingState ?? null;
  let introduced = false;
  if (!currentState) {
    currentState = createInitialState(userId, itemId, now);
    writeUserItemState(currentState);
    introduced = true;
  }
  if (!currentState) {
    throw new Error("Could not initialize learner state");
  }
  const ensuredState = currentState;
  let sessionInjected = false;
  if (sessionId) {
    const session = getSession(sessionId);
    if (session && session.userId === userId) {
      const alreadyQueued = session.queue.includes(itemId);
      if (!alreadyQueued) {
        const injectedQueue = session.queue.length === 0 ? [itemId] : [session.queue[0], itemId, ...session.queue.slice(1)];
        writeSessionQueue({
          sessionId: session.id,
          queue: injectedQueue,
          dueCount: session.dueCount,
          newCount: session.newCount + (introduced ? 1 : 0)
        });
        sessionInjected = true;
      }
    }
  }
  const afterProgressCounts = getProgressCounts(userId);
  if (afterProgressCounts.itemStates < beforeProgressCounts.itemStates) {
    throw new Error(
      [
        "progress protection: learning preview item reduced learner progress counts",
        `before=${JSON.stringify(beforeProgressCounts)}`,
        `after=${JSON.stringify(afterProgressCounts)}`
      ].join(" | ")
    );
  }
  return {
    itemId,
    introduced,
    sessionInjected,
    status: ensuredState.status
  };
}
function submitReview(params) {
  const {
    userId,
    sessionId,
    itemId,
    rating,
    elapsedMs,
    sessionElapsedMs = 0,
    includeStudyPlan = false,
    idempotencyKey
  } = params;
  if (idempotencyKey) {
    const cached2 = getReviewIdempotentResponse({
      userId,
      sessionId,
      itemId,
      idempotencyKey
    });
    if (cached2) {
      return cached2;
    }
  }
  const session = getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }
  const item = getItem(itemId);
  if (!item) {
    throw new Error("Item not found");
  }
  const newQueue = session.queue.filter((queuedItemId) => queuedItemId !== itemId);
  const states = getUserStates(userId);
  const now = /* @__PURE__ */ new Date();
  const current = states[itemId] ?? createInitialState(userId, itemId, now);
  const next = scheduleReview(current, rating, now);
  const db2 = getDb();
  const beforeProgressCounts = getProgressCounts(userId);
  const nextSessionElapsedMs = Math.max(session.elapsedMs, sessionElapsedMs);
  db2.update(sessions).set({
    queue: JSON.stringify(newQueue),
    elapsedMs: nextSessionElapsedMs,
    ...newQueue.length === 0 ? { completedAt: now.toISOString() } : {}
  }).where((0, import_drizzle_orm3.eq)(sessions.id, sessionId)).run();
  db2.insert(userItemStates).values({
    userId,
    itemId,
    status: next.status,
    dueAt: next.dueAt,
    stability: next.stability,
    difficulty: next.difficulty,
    scheduledDays: next.scheduledDays,
    learningSteps: next.learningSteps,
    lapses: next.lapses,
    reps: next.reps,
    lastRating: next.lastRating,
    introducedAt: next.introducedAt,
    lastReviewedAt: next.lastReviewedAt
  }).onConflictDoUpdate({
    target: [userItemStates.userId, userItemStates.itemId],
    set: {
      status: next.status,
      dueAt: next.dueAt,
      stability: next.stability,
      difficulty: next.difficulty,
      scheduledDays: next.scheduledDays,
      learningSteps: next.learningSteps,
      lapses: next.lapses,
      reps: next.reps,
      lastRating: next.lastRating,
      introducedAt: next.introducedAt,
      lastReviewedAt: next.lastReviewedAt
    }
  }).run();
  const reviewEventId = `review-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  db2.insert(reviewEvents).values({
    id: reviewEventId,
    userId,
    itemId,
    rating,
    elapsedMs,
    reviewedAt: now.toISOString(),
    mode: "recall",
    stateBefore: current.status,
    stateAfter: next.status
  }).run();
  markUserMutation(userId);
  const afterProgressCounts = getProgressCounts(userId);
  if (afterProgressCounts.itemStates < beforeProgressCounts.itemStates || afterProgressCounts.reviewEvents < beforeProgressCounts.reviewEvents) {
    throw new Error(
      [
        "progress protection: review submission reduced learner progress counts",
        `before=${JSON.stringify(beforeProgressCounts)}`,
        `after=${JSON.stringify(afterProgressCounts)}`
      ].join(" | ")
    );
  }
  const updatedSession = getSession(sessionId);
  const nextItemId = updatedSession.queue[0] ?? null;
  const nextItem = nextItemId ? getItem(nextItemId) : null;
  const nextItemState = nextItemId ? getUserState(userId, nextItemId) : null;
  const nextCard = nextItem ? toCard(nextItem, userId, nextItemState, now) : null;
  const result = {
    nextDueAt: next.dueAt,
    remainingCount: updatedSession.queue.length,
    insights: getSessionInsights(userId, updatedSession.languageCodes, now),
    nextCard
  };
  if (includeStudyPlan) {
    result.studyPlan = buildStudyPlan(
      userId,
      getUserSettings(userId).dailyGoal,
      updatedSession.languageCodes,
      updatedSession.mode,
      now
    );
  }
  if (idempotencyKey) {
    persistReviewIdempotentResponse({
      userId,
      sessionId,
      itemId,
      idempotencyKey,
      response: result,
      createdAt: now.toISOString()
    });
  }
  return result;
}
function completeSession(params) {
  const { userId, sessionId, elapsedMs } = params;
  const session = getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }
  const db2 = getDb();
  db2.update(sessions).set({
    elapsedMs: Math.max(session.elapsedMs, elapsedMs),
    completedAt: (/* @__PURE__ */ new Date()).toISOString()
  }).where((0, import_drizzle_orm3.eq)(sessions.id, sessionId)).run();
  return { ok: true };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  completeSession,
  getAvailableAssumedWordLists,
  getDashboardSnapshot,
  getItemById,
  getLanguageCatalog,
  getLearnerSettings,
  getLibrarySnapshot,
  getListsSnapshot,
  getNextCard,
  getRecentStudiedWords,
  getSiteSnapshot,
  getStudyPlan,
  getWordSnapshot,
  getWordsSnapshot,
  learnPreviewItem,
  resumeSession,
  startSession,
  submitReview,
  updateLearnerSettings
});
