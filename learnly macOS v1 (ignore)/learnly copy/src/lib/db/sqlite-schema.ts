import { sqliteTable, text, integer, real, index, primaryKey } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Corpus tables
// ---------------------------------------------------------------------------

export const corpusLanguages = sqliteTable("corpus_languages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  descriptor: text("descriptor").notNull(),
  speakerLabel: text("speaker_label").notNull(),
  audioVoice: text("audio_voice").notNull(),
  beta: integer("beta").notNull().default(0),
});

export const corpusItems = sqliteTable("corpus_items", {
  id: text("id").primaryKey(),
  languageCode: text("language_code").notNull(),
  type: text("type").notNull(),
  lemma: text("lemma").notNull(),
  displayForm: text("display_form").notNull(),
  primaryGloss: text("primary_gloss").notNull(),
  pos: text("pos").notNull(),
  rank: integer("rank").notNull(),
  example: text("example").notNull(),
  translation: text("translation").notNull(),
  pronunciation: text("pronunciation"),
  secondaryGlosses: text("secondary_glosses"), // JSON array
  notes: text("notes"),
}, (table) => ({
  languageRankIdx: index("corpus_items_language_rank_idx").on(table.languageCode, table.rank),
}));

export const corpusItemExamples = sqliteTable("corpus_item_examples", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull(),
  sentence: text("sentence").notNull(),
  translation: text("translation").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => ({
  itemIdx: index("corpus_item_examples_item_idx").on(table.itemId, table.sortOrder),
}));

// ---------------------------------------------------------------------------
// User tables
// ---------------------------------------------------------------------------

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id").primaryKey(),
  dailyGoal: integer("daily_goal").notNull().default(10),
  selectedLanguageCodes: text("selected_language_codes").notNull().default('["es"]'), // JSON array
  dashboardLanguageCodes: text("dashboard_language_codes").notNull().default('["es"]'), // JSON array
  preferredStudyMode: text("preferred_study_mode").notNull().default("everyday"),
  chineseReviewFlow: text("chinese_review_flow").notNull().default("four-click"),
  updatedAt: text("updated_at").notNull(),
});

export const userItemStates = sqliteTable("user_item_states", {
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  status: text("status").notNull().default("new"),
  dueAt: text("due_at").notNull(),
  stability: real("stability").notNull().default(0.4),
  difficulty: real("difficulty").notNull().default(5),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  learningSteps: integer("learning_steps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lastRating: integer("last_rating"),
  introducedAt: text("introduced_at").notNull(),
  lastReviewedAt: text("last_reviewed_at"),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.itemId] }),
  dueIdx: index("user_item_states_due_idx").on(table.userId, table.dueAt),
  statusIdx: index("user_item_states_status_idx").on(table.userId, table.status),
}));

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull(),
  languageCodes: text("language_codes").notNull(), // JSON array
  queue: text("queue").notNull(), // JSON array
  dueCount: integer("due_count").notNull(),
  newCount: integer("new_count").notNull(),
  createdAt: text("created_at").notNull(),
});

export const reviewEvents = sqliteTable("review_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  rating: integer("rating").notNull(),
  elapsedMs: integer("elapsed_ms").notNull(),
  reviewedAt: text("reviewed_at").notNull(),
  mode: text("mode").notNull().default("recall"),
  stateBefore: text("state_before").notNull(),
  stateAfter: text("state_after").notNull(),
}, (table) => ({
  userReviewedIdx: index("review_events_user_reviewed_idx").on(table.userId, table.reviewedAt),
}));
