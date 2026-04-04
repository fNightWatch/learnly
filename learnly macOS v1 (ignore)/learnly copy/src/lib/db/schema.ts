import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const contentSources = pgTable("content_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  sourceUrl: text("source_url"),
  licenseLabel: varchar("license_label", { length: 120 }),
  versionTag: varchar("version_tag", { length: 60 }),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  metaJson: jsonb("meta_json")
}, (table) => ({
  slugIndex: uniqueIndex("content_sources_slug_idx").on(table.slug)
}));

export const languages = pgTable("languages", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 10 }).notNull(),
  name: varchar("name", { length: 80 }).notNull()
}, (table) => ({
  codeIndex: uniqueIndex("languages_code_idx").on(table.code)
}));

export const learningLists = pgTable("learning_lists", {
  id: uuid("id").defaultRandom().primaryKey(),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  sourceId: uuid("source_id").references(() => contentSources.id),
  slug: varchar("slug", { length: 80 }).notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  kind: varchar("kind", { length: 40 }).notNull().default("curriculum"),
  levelCode: varchar("level_code", { length: 40 }),
  versionTag: varchar("version_tag", { length: 60 }),
  description: text("description"),
  itemCount: integer("item_count").notNull().default(0),
  metaJson: jsonb("meta_json")
}, (table) => ({
  slugIndex: uniqueIndex("learning_lists_language_slug_idx").on(table.languageId, table.slug),
  kindIndex: index("learning_lists_kind_idx").on(table.languageId, table.kind, table.levelCode)
}));

export const lexicalItems = pgTable("lexical_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  sourceId: uuid("source_id").references(() => contentSources.id),
  type: varchar("type", { length: 20 }).notNull(),
  lemma: varchar("lemma", { length: 120 }).notNull(),
  displayForm: varchar("display_form", { length: 120 }).notNull(),
  primaryGloss: text("primary_gloss").notNull(),
  pos: varchar("pos", { length: 40 }).notNull(),
  sourceKey: varchar("source_key", { length: 120 }),
  searchText: text("search_text"),
  importanceScore: real("importance_score").notNull().default(0),
  rank: integer("rank").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  metaJson: jsonb("meta_json")
}, (table) => ({
  rankIndex: index("lexical_items_rank_idx").on(table.rank),
  languageRankIndex: uniqueIndex("lexical_items_language_rank_idx").on(table.languageId, table.rank),
  languageLemmaIndex: index("lexical_items_language_lemma_idx").on(table.languageId, table.lemma),
  sourceKeyIndex: uniqueIndex("lexical_items_language_source_key_idx").on(table.languageId, table.sourceKey)
}));

export const listItems = pgTable("list_items", {
  listId: uuid("list_id").notNull().references(() => learningLists.id),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  rank: integer("rank").notNull()
}, (table) => ({
  pk: primaryKey({ columns: [table.listId, table.itemId] }),
  rankIndex: index("list_items_list_rank_idx").on(table.listId, table.rank),
  itemIndex: index("list_items_item_idx").on(table.itemId)
}));

export const surfaceForms = pgTable("surface_forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  form: varchar("form", { length: 120 }).notNull(),
  transliteration: varchar("transliteration", { length: 160 }),
  morphologyJson: jsonb("morphology_json")
}, (table) => ({
  itemFormIndex: uniqueIndex("surface_forms_item_form_idx").on(table.itemId, table.form)
}));

export const itemPronunciations = pgTable("item_pronunciations", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  notation: varchar("notation", { length: 32 }).notNull(),
  value: varchar("value", { length: 240 }).notNull(),
  transliterationSystem: varchar("transliteration_system", { length: 40 }),
  isPrimary: boolean("is_primary").notNull().default(false)
}, (table) => ({
  itemNotationIndex: uniqueIndex("item_pronunciations_item_notation_idx").on(table.itemId, table.notation)
}));

export const itemSenses = pgTable("item_senses", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  gloss: text("gloss").notNull(),
  rank: integer("rank").notNull().default(1),
  note: text("note"),
  isPrimary: boolean("is_primary").notNull().default(false)
}, (table) => ({
  itemRankIndex: uniqueIndex("item_senses_item_rank_idx").on(table.itemId, table.rank)
}));

export const examples = pgTable("examples", {
  id: uuid("id").defaultRandom().primaryKey(),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  text: text("text").notNull(),
  simplifiedText: text("simplified_text"),
  traditionalText: text("traditional_text"),
  transliteration: text("transliteration"),
  searchText: text("search_text"),
  translation: text("translation").notNull(),
  audioUrl: text("audio_url"),
  qualityScore: real("quality_score").notNull().default(0),
  metaJson: jsonb("meta_json")
}, (table) => ({
  languageQualityIndex: index("examples_language_quality_idx").on(table.languageId, table.qualityScore),
  languageTextIndex: index("examples_language_text_idx").on(table.languageId)
}));

export const itemExamples = pgTable("item_examples", {
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  exampleId: uuid("example_id").notNull().references(() => examples.id),
  senseLabel: varchar("sense_label", { length: 120 }),
  rank: integer("rank").notNull().default(1)
}, (table) => ({
  pk: primaryKey({ columns: [table.itemId, table.exampleId] })
}));

export const exampleTranslations = pgTable("example_translations", {
  id: uuid("id").defaultRandom().primaryKey(),
  exampleId: uuid("example_id").notNull().references(() => examples.id),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  text: text("text").notNull(),
  qualityScore: real("quality_score").notNull().default(0)
}, (table) => ({
  exampleLanguageIndex: uniqueIndex("example_translations_example_language_idx").on(
    table.exampleId,
    table.languageId
  )
}));

export const audioAssets = pgTable("audio_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  ownerType: varchar("owner_type", { length: 24 }).notNull(),
  ownerId: uuid("owner_id").notNull(),
  localeCode: varchar("locale_code", { length: 16 }),
  voiceLabel: varchar("voice_label", { length: 120 }),
  provider: varchar("provider", { length: 80 }),
  format: varchar("format", { length: 32 }).notNull().default("mp4"),
  durationMs: integer("duration_ms"),
  isPrimary: boolean("is_primary").notNull().default(false),
  checksumSha256: varchar("checksum_sha256", { length: 64 }),
  audioUrl: text("audio_url").notNull(),
  metaJson: jsonb("meta_json")
}, (table) => ({
  ownerIndex: uniqueIndex("audio_assets_owner_variant_idx").on(
    table.ownerType,
    table.ownerId,
    table.provider,
    table.voiceLabel,
    table.format
  ),
  languageOwnerIndex: index("audio_assets_language_owner_idx").on(table.languageId, table.ownerType, table.ownerId)
}));

export const userLanguages = pgTable("user_languages", {
  userId: uuid("user_id").notNull(),
  languageId: uuid("language_id").notNull().references(() => languages.id),
  sourceLanguageCode: varchar("source_language_code", { length: 10 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.languageId] }),
  activeIndex: index("user_languages_active_idx").on(table.userId, table.active)
}));

export const userStudyPreferences = pgTable("user_study_preferences", {
  userId: uuid("user_id").primaryKey(),
  dailyGoal: integer("daily_goal").notNull().default(10),
  sourceLanguageCode: varchar("source_language_code", { length: 10 }).notNull().default("en"),
  preferredStudyMode: varchar("preferred_study_mode", { length: 24 }).notNull().default("everyday"),
  preferredDirection: varchar("preferred_direction", { length: 24 }),
  activeListIds: jsonb("active_list_ids"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const studySessions = pgTable("study_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  mode: varchar("mode", { length: 24 }).notNull(),
  direction: varchar("direction", { length: 24 }),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dailyGoal: integer("daily_goal").notNull().default(0),
  queueSize: integer("queue_size").notNull().default(0),
  metaJson: jsonb("meta_json")
}, (table) => ({
  userStartedIndex: index("study_sessions_user_started_idx").on(table.userId, table.startedAt)
}));

export const studySessionLanguages = pgTable("study_session_languages", {
  sessionId: uuid("session_id").notNull().references(() => studySessions.id),
  languageId: uuid("language_id").notNull().references(() => languages.id)
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.languageId] })
}));

export const studySessionItems = pgTable("study_session_items", {
  sessionId: uuid("session_id").notNull().references(() => studySessions.id),
  ordinal: integer("ordinal").notNull(),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  stage: varchar("stage", { length: 32 }).notNull().default("queued"),
  introduced: boolean("introduced").notNull().default(false),
  revealedAt: timestamp("revealed_at", { withTimezone: true }),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  metaJson: jsonb("meta_json")
}, (table) => ({
  pk: primaryKey({ columns: [table.sessionId, table.ordinal] }),
  sessionItemIndex: uniqueIndex("study_session_items_session_item_idx").on(table.sessionId, table.itemId)
}));

export const userItemStates = pgTable("user_item_states", {
  userId: uuid("user_id").notNull(),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  status: varchar("status", { length: 20 }).notNull(),
  stability: real("stability").notNull().default(0.4),
  difficulty: real("difficulty").notNull().default(5),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  scheduledDays: integer("scheduled_days").notNull().default(0),
  learningSteps: integer("learning_steps").notNull().default(0),
  lapses: integer("lapses").notNull().default(0),
  reps: integer("reps").notNull().default(0),
  lastRating: integer("last_rating"),
  introducedAt: timestamp("introduced_at", { withTimezone: true }).notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true })
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.itemId] }),
  dueIndex: index("user_item_states_user_due_idx").on(table.userId, table.dueAt),
  statusIndex: index("user_item_states_user_status_idx").on(table.userId, table.status)
}));

export const reviewEvents = pgTable("review_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  sessionId: uuid("session_id").references(() => studySessions.id),
  itemId: uuid("item_id").notNull().references(() => lexicalItems.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
  rating: integer("rating").notNull(),
  elapsedMs: integer("elapsed_ms").notNull(),
  mode: varchar("mode", { length: 20 }).notNull(),
  stage: varchar("stage", { length: 32 }),
  promptDirection: varchar("prompt_direction", { length: 24 }),
  stateBefore: varchar("state_before", { length: 20 }).notNull(),
  stateAfter: varchar("state_after", { length: 20 }).notNull()
}, (table) => ({
  userReviewedIndex: index("review_events_user_reviewed_idx").on(table.userId, table.reviewedAt),
  itemReviewedIndex: index("review_events_item_reviewed_idx").on(table.itemId, table.reviewedAt)
}));
