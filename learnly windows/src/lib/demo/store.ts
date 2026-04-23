import { existsSync, readFileSync } from "fs";
import path from "path";
import { eq, inArray, and, between, ne, asc } from "drizzle-orm";
import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfTomorrow,
  isBefore,
  isSameDay,
  startOfDay,
  subDays
} from "date-fns";
import { getCuratedLists } from "@/lib/demo/lists";
import {
  DashboardSnapshot,
  DemoLexicalItem,
  DemoSession,
  LearnerSettings,
  LibrarySnapshot,
  ListsSnapshot,
  RankedListEntry,
  ReviewsDueDatum,
  ReviewEvent,
  ReviewRating,
  SessionCardPayload,
  SessionInsights,
  StudyMode,
  StudyConsistencyDatum,
  StudyPlan,
  SupportedLanguageCode,
  UserItemState,
  VocabularyGrowthDatum,
  WordDetailSnapshot,
  WordsSection,
  WordsSnapshot
} from "@/lib/demo/types";
import { DEMO_USER_ID } from "@/lib/demo/user";
import {
  createInitialState,
  getRatingPreviews,
  getRetrievability,
  scheduleReview
} from "@/lib/srs/scheduler";
import { getDb } from "@/lib/db/local-client";
import * as tables from "@/lib/db/sqlite-schema";

// ---------------------------------------------------------------------------
// Legacy JSON store type (used only for migration)
// ---------------------------------------------------------------------------
type LegacyDemoStore = {
  version: number;
  userSettings: Record<string, LearnerSettings>;
  userStates: Record<string, Record<string, UserItemState>>;
  sessions: Record<string, DemoSession>;
  reviewEvents: ReviewEvent[];
  items?: DemoLexicalItem[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_DAILY_GOAL = 10;
const DEFAULT_LANGUAGE_CODES: SupportedLanguageCode[] = ["es"];
const DEFAULT_STUDY_MODE: StudyMode = "everyday";
const REVIEW_SOFT_CAP = 100;
const SESSION_FRESH_POOL = 100;
const STORE_DIRECTORY = path.join(process.cwd(), ".learnly");
const LEGACY_STORE_PATH = path.join(STORE_DIRECTORY, "learner-store.json");
const LEGACY_STORE_PATH_OLD = path.join(STORE_DIRECTORY, "demo-store.json");
// ---------------------------------------------------------------------------
// DB-backed corpus accessors (replace former in-memory Maps)
// ---------------------------------------------------------------------------

function rowToLexicalItem(row: typeof tables.corpusItems.$inferSelect): DemoLexicalItem {
  return {
    id: row.id,
    languageCode: row.languageCode as SupportedLanguageCode,
    type: row.type as DemoLexicalItem["type"],
    lemma: row.lemma,
    displayForm: row.displayForm,
    primaryGloss: row.primaryGloss,
    pos: row.pos,
    rank: row.rank,
    example: row.example,
    translation: row.translation,
    pronunciation: row.pronunciation ?? undefined,
    secondaryGlosses: row.secondaryGlosses ? JSON.parse(row.secondaryGlosses) : undefined,
    notes: row.notes ?? undefined,
  };
}

import type { DemoLanguage } from "@/lib/demo/types";

let cachedLanguages: DemoLanguage[] | null = null;

function getAllLanguages(): DemoLanguage[] {
  if (cachedLanguages) return cachedLanguages;
  const db = getDb();
  cachedLanguages = db.select().from(tables.corpusLanguages).all().map(row => ({
    code: row.code as SupportedLanguageCode,
    name: row.name,
    nativeName: row.nativeName,
    descriptor: row.descriptor,
    speakerLabel: row.speakerLabel,
    audioVoice: row.audioVoice,
    beta: row.beta === 1 ? true : undefined,
  }));
  return cachedLanguages;
}

function getAllCorpusItems(): DemoLexicalItem[] {
  const db = getDb();
  return db.select().from(tables.corpusItems).all().map(rowToLexicalItem);
}

function getCorpusItemsByLanguages(languageCodes: SupportedLanguageCode[]): DemoLexicalItem[] {
  const db = getDb();
  return db.select().from(tables.corpusItems)
    .where(inArray(tables.corpusItems.languageCode, languageCodes))
    .orderBy(asc(tables.corpusItems.rank))
    .all()
    .map(rowToLexicalItem);
}

function corpusItemExists(itemId: string): boolean {
  const db = getDb();
  const row = db.select({ id: tables.corpusItems.id })
    .from(tables.corpusItems)
    .where(eq(tables.corpusItems.id, itemId))
    .limit(1)
    .get();
  return !!row;
}

// ---------------------------------------------------------------------------
// Seed / migration
// ---------------------------------------------------------------------------
let seeded = false;

function getDefaultSettings(now: Date): LearnerSettings {
  return {
    dailyGoal: DEFAULT_DAILY_GOAL,
    selectedLanguageCodes: DEFAULT_LANGUAGE_CODES,
    dashboardLanguageCodes: DEFAULT_LANGUAGE_CODES,
    preferredStudyMode: DEFAULT_STUDY_MODE,
    updatedAt: now.toISOString()
  };
}

function buildSeededState(
  userId: string,
  itemId: string,
  now: Date,
  overrides: Partial<UserItemState>
) {
  return {
    ...createInitialState(userId, itemId, now),
    ...overrides
  };
}

function normalizeLanguageCodes(codes?: SupportedLanguageCode[]) {
  const supported = new Set(getAllLanguages().map((language) => language.code));
  const normalized = [...new Set((codes ?? DEFAULT_LANGUAGE_CODES).filter((code) => supported.has(code)))];

  return (normalized.length > 0 ? normalized : DEFAULT_LANGUAGE_CODES) as SupportedLanguageCode[];
}

function buildSeededUserStates(userId: string, items: DemoLexicalItem[], now: Date) {
  const priorityIds = ["ser", "tener", "hacer", "poder", "ir", "decir", "ver", "querer", "dar", "palabra"];
  const prioritizedItems = priorityIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is DemoLexicalItem => Boolean(item));
  const spanishItems = sortItemsByLanguageOrder(
    items.filter((item) => item.languageCode === "es"),
    ["es"]
  );
  const introductoryWave = spanishItems.slice(0, 36);
  const contentHeavyWave = spanishItems.filter(
    (item) => item.rank > 36 && !["article", "preposition", "conjunction", "determiner"].includes(item.pos)
  );
  const betaLanguageWave = getAllLanguages()
    .filter((language) => language.code !== "es")
    .flatMap((language) =>
      sortItemsByLanguageOrder(
        items.filter((item) => item.languageCode === language.code),
        [language.code]
      ).slice(0, 8)
    );
  const seedItems = [...prioritizedItems, ...contentHeavyWave, ...introductoryWave, ...betaLanguageWave]
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 112);

  return seedItems.reduce<Record<string, UserItemState>>((states, item, index) => {
    const isBetaLanguage = item.languageCode !== "es";
    const isDueNowSeed = index < 12 || (isBetaLanguage && index % 7 === 0);
    const isNearFutureSeed = index >= 12 && index < 34;
    const isLongReviewSeed = index >= 34 && index < 82;
    const learningSeed = index >= 82;
    const introducedDaysAgo = 3 + (index % 28);
    const lastReviewedDaysAgo = index % 8;

    const status = isDueNowSeed
      ? index % 3 === 0
        ? "learning"
        : "review"
      : learningSeed
        ? index % 2 === 0
          ? "learning"
          : "relearning"
        : "review";

    const dueAt = isDueNowSeed
      ? subDays(now, index % 3).toISOString()
      : isNearFutureSeed
        ? addDays(now, 1 + (index % 7)).toISOString()
        : isLongReviewSeed
          ? addDays(now, 6 + (index % 20)).toISOString()
          : addDays(now, 1 + (index % 4)).toISOString();

    states[item.id] = buildSeededState(userId, item.id, now, {
      status,
      dueAt,
      stability: Number((1.4 + (index % 9) * 0.68).toFixed(2)),
      difficulty: Number((4.2 + (index % 7) * 0.24).toFixed(2)),
      scheduledDays: isLongReviewSeed ? 5 + (index % 12) : 1 + (index % 4),
      learningSteps: status === "learning" || status === "relearning" ? 1 + (index % 2) : 0,
      reps: 2 + (index % 8),
      lapses: index % 11 === 0 ? 1 : 0,
      lastRating: status === "review" ? 3 : 2,
      introducedAt: subDays(now, introducedDaysAgo).toISOString(),
      lastReviewedAt: subDays(now, lastReviewedDaysAgo).toISOString()
    });

    return states;
  }, {});
}

/**
 * Migrate a legacy JSON store file into the SQLite database.
 */
function migrateFromJson(jsonPath: string) {
  let raw: Partial<LegacyDemoStore>;
  try {
    raw = JSON.parse(readFileSync(jsonPath, "utf8")) as Partial<LegacyDemoStore>;
  } catch {
    return;
  }

  const db = getDb();
  const now = new Date();

  // Settings
  if (raw.userSettings) {
    for (const [userId, settings] of Object.entries(raw.userSettings)) {
      db.insert(tables.userSettings).values({
        userId,
        dailyGoal: settings.dailyGoal ?? DEFAULT_DAILY_GOAL,
        selectedLanguageCodes: JSON.stringify(
          normalizeLanguageCodes(settings.selectedLanguageCodes)
        ),
        dashboardLanguageCodes: JSON.stringify(
          normalizeLanguageCodes(settings.dashboardLanguageCodes ?? settings.selectedLanguageCodes)
        ),
        preferredStudyMode: settings.preferredStudyMode ?? DEFAULT_STUDY_MODE,
        updatedAt: settings.updatedAt ?? now.toISOString(),
      }).onConflictDoNothing().run();
    }
  }

  // User item states
  if (raw.userStates) {
    for (const [userId, stateMap] of Object.entries(raw.userStates)) {
      for (const [itemId, state] of Object.entries(stateMap ?? {})) {
        if (!corpusItemExists(itemId)) continue;
        db.insert(tables.userItemStates).values({
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
          lastReviewedAt: state.lastReviewedAt ?? null,
        }).onConflictDoNothing().run();
      }
    }
  }

  // Sessions
  if (raw.sessions) {
    for (const [, session] of Object.entries(raw.sessions)) {
      db.insert(tables.sessions).values({
        id: session.id,
        userId: session.userId,
        mode: session.mode,
        languageCodes: JSON.stringify(session.languageCodes),
        queue: JSON.stringify(session.queue),
        dueCount: session.dueCount,
        newCount: session.newCount,
        createdAt: session.createdAt,
      }).onConflictDoNothing().run();
    }
  }

  // Review events
  if (Array.isArray(raw.reviewEvents)) {
    for (const event of raw.reviewEvents) {
      if (!corpusItemExists(event.itemId)) continue;
      db.insert(tables.reviewEvents).values({
        id: event.id,
        userId: event.userId,
        itemId: event.itemId,
        rating: event.rating,
        elapsedMs: event.elapsedMs,
        reviewedAt: event.reviewedAt,
        mode: event.mode,
        stateBefore: event.stateBefore,
        stateAfter: event.stateAfter,
      }).onConflictDoNothing().run();
    }
  }
}

function seedIfEmpty() {
  if (seeded) return;
  seeded = true;

  const db = getDb();
  const existing = db.select().from(tables.userSettings).get();
  if (existing) return;

  // Attempt migration from legacy JSON first
  if (existsSync(LEGACY_STORE_PATH)) {
    migrateFromJson(LEGACY_STORE_PATH);
    const afterMigration = db.select().from(tables.userSettings).get();
    if (afterMigration) return;
  } else if (existsSync(LEGACY_STORE_PATH_OLD)) {
    migrateFromJson(LEGACY_STORE_PATH_OLD);
    const afterMigration = db.select().from(tables.userSettings).get();
    if (afterMigration) return;
  }

  // Fresh seed
  const now = new Date();
  const defaults = getDefaultSettings(now);

  db.insert(tables.userSettings).values({
    userId: DEMO_USER_ID,
    dailyGoal: defaults.dailyGoal,
    selectedLanguageCodes: JSON.stringify(defaults.selectedLanguageCodes),
    dashboardLanguageCodes: JSON.stringify(defaults.dashboardLanguageCodes),
    preferredStudyMode: defaults.preferredStudyMode,
    updatedAt: defaults.updatedAt,
  }).run();

  const seededStates = buildSeededUserStates(DEMO_USER_ID, getAllCorpusItems(), now);
  for (const [itemId, state] of Object.entries(seededStates)) {
    db.insert(tables.userItemStates).values({
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
      lastReviewedAt: state.lastReviewedAt,
    }).run();
  }
}

// ---------------------------------------------------------------------------
// DB accessor helpers
// ---------------------------------------------------------------------------

function getUserSettings(userId: string): LearnerSettings {
  seedIfEmpty();
  const db = getDb();
  const row = db.select().from(tables.userSettings).where(eq(tables.userSettings.userId, userId)).get();

  if (!row) {
    const defaults = getDefaultSettings(new Date());
    db.insert(tables.userSettings).values({
      userId,
      dailyGoal: defaults.dailyGoal,
      selectedLanguageCodes: JSON.stringify(defaults.selectedLanguageCodes),
      dashboardLanguageCodes: JSON.stringify(defaults.dashboardLanguageCodes),
      preferredStudyMode: defaults.preferredStudyMode,
      updatedAt: defaults.updatedAt,
    }).run();
    return defaults;
  }

  return {
    dailyGoal: row.dailyGoal,
    selectedLanguageCodes: normalizeLanguageCodes(JSON.parse(row.selectedLanguageCodes)),
    dashboardLanguageCodes: normalizeLanguageCodes(JSON.parse(row.dashboardLanguageCodes)),
    preferredStudyMode:
      row.preferredStudyMode === "review-only" || row.preferredStudyMode === "new-only"
        ? row.preferredStudyMode as StudyMode
        : "everyday",
    updatedAt: row.updatedAt,
  };
}

function getUserStates(userId: string): Record<string, UserItemState> {
  seedIfEmpty();
  const db = getDb();
  const rows = db.select().from(tables.userItemStates).where(eq(tables.userItemStates.userId, userId)).all();

  return Object.fromEntries(
    rows
      .filter(row => corpusItemExists(row.itemId))
      .map(row => [row.itemId, {
        userId: row.userId,
        itemId: row.itemId,
        status: row.status as UserItemState["status"],
        dueAt: row.dueAt,
        stability: row.stability,
        difficulty: row.difficulty,
        scheduledDays: row.scheduledDays,
        learningSteps: row.learningSteps,
        lapses: row.lapses,
        reps: row.reps,
        lastRating: row.lastRating,
        introducedAt: row.introducedAt,
        lastReviewedAt: row.lastReviewedAt,
      } satisfies UserItemState])
  );
}

function getUserEvents(userId: string): ReviewEvent[] {
  seedIfEmpty();
  const db = getDb();
  return db.select().from(tables.reviewEvents)
    .where(eq(tables.reviewEvents.userId, userId))
    .all()
    .filter(row => corpusItemExists(row.itemId))
    .map(row => ({
      id: row.id,
      userId: row.userId,
      itemId: row.itemId,
      rating: row.rating,
      elapsedMs: row.elapsedMs,
      reviewedAt: row.reviewedAt,
      mode: row.mode as "recall",
      stateBefore: row.stateBefore as ReviewEvent["stateBefore"],
      stateAfter: row.stateAfter as ReviewEvent["stateAfter"],
    }));
}

function getItem(itemId: string): DemoLexicalItem | null {
  const db = getDb();
  const row = db.select().from(tables.corpusItems).where(eq(tables.corpusItems.id, itemId)).get();
  return row ? rowToLexicalItem(row) : null;
}

function getSession(sessionId: string): DemoSession | null {
  const db = getDb();
  const row = db.select().from(tables.sessions).where(eq(tables.sessions.id, sessionId)).get();
  if (!row) return null;

  return {
    id: row.id,
    userId: row.userId,
    mode: row.mode as StudyMode,
    languageCodes: JSON.parse(row.languageCodes) as SupportedLanguageCode[],
    queue: JSON.parse(row.queue) as string[],
    dueCount: row.dueCount,
    newCount: row.newCount,
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Pure helpers (unchanged business logic)
// ---------------------------------------------------------------------------

function buildLanguageOrder(languageCodes: SupportedLanguageCode[]) {
  return new Map(languageCodes.map((code, index) => [code, index]));
}

function sortItemsByLanguageOrder(items: DemoLexicalItem[], languageCodes: SupportedLanguageCode[]) {
  const order = buildLanguageOrder(languageCodes);

  return items.slice().sort((left, right) => {
    const languageDelta = (order.get(left.languageCode) ?? 999) - (order.get(right.languageCode) ?? 999);
    if (languageDelta !== 0) {
      return languageDelta;
    }

    return left.rank - right.rank;
  });
}

function filterItemsByLanguageCodes(items: DemoLexicalItem[], languageCodes: SupportedLanguageCode[]) {
  const activeCodes = new Set(languageCodes);
  return items.filter((item) => activeCodes.has(item.languageCode));
}

function pickFreshItemsByLanguage(items: DemoLexicalItem[], limit: number, languageCodes: SupportedLanguageCode[]) {
  if (limit <= 0) {
    return [];
  }

  const buckets = languageCodes.map((code) =>
    sortItemsByLanguageOrder(
      items.filter((item) => item.languageCode === code),
      languageCodes
    )
  );
  const selected: DemoLexicalItem[] = [];
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

function getItemsForLanguages(languageCodes: SupportedLanguageCode[]) {
  return sortItemsByLanguageOrder(
    getCorpusItemsByLanguages(languageCodes),
    languageCodes
  );
}

function filterStateMapByLanguages(
  states: Record<string, UserItemState>,
  languageCodes: SupportedLanguageCode[]
) {
  const activeCodes = new Set(languageCodes);

  return Object.fromEntries(
    Object.entries(states).filter(([itemId]) => {
      const item = getItem(itemId);
      return item ? activeCodes.has(item.languageCode) : false;
    })
  );
}

function filterEventsByLanguages(
  events: ReviewEvent[],
  languageCodes: SupportedLanguageCode[]
) {
  const activeCodes = new Set(languageCodes);
  return events.filter((event) => {
    const item = getItem(event.itemId);
    return item ? activeCodes.has(item.languageCode) : false;
  });
}

function isDueNow(state: UserItemState, now: Date) {
  return !isBefore(now, new Date(state.dueAt));
}

function formatNextDueLabel(dueAt: string | null, now: Date) {
  if (!dueAt) {
    return "No reviews queued";
  }

  const dueDate = new Date(dueAt);
  const hoursAway = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  if (hoursAway <= 0) {
    return "Ready now";
  }

  if (hoursAway < 24) {
    return `In ${hoursAway} hr`;
  }

  const daysAway = Math.round(hoursAway / 24);
  return `In ${daysAway} day${daysAway === 1 ? "" : "s"}`;
}

function getListTitles(itemId: string) {
  return getCuratedLists()
    .filter((list) => list.itemIds.some((candidate) => candidate === itemId))
    .map((list) => list.title);
}

function toRankedEntry(
  item: DemoLexicalItem,
  state: UserItemState | undefined,
  focusItemId: string | null,
  now: Date
): RankedListEntry {
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

function getRankedEntries(
  stateMap: Record<string, UserItemState>,
  focusItemId: string | null,
  now: Date,
  languageCodes: SupportedLanguageCode[]
) {
  return getItemsForLanguages(languageCodes)
    .map((item) => toRankedEntry(item, stateMap[item.id], focusItemId, now));
}

function getCycledExample(itemId: string, reps: number): { sentence: string; translation: string; index: number } | null {
  const db = getDb();
  const examples = db.select().from(tables.corpusItemExamples)
    .where(eq(tables.corpusItemExamples.itemId, itemId))
    .orderBy(asc(tables.corpusItemExamples.sortOrder))
    .all();
  if (examples.length === 0) return null;
  const idx = reps % examples.length;
  return { sentence: examples[idx].sentence, translation: examples[idx].translation, index: idx };
}

function toCard(
  item: DemoLexicalItem,
  userId: string,
  current: UserItemState | null,
  now: Date
): SessionCardPayload {
  const state = current ?? createInitialState(userId, item.id, now);
  const cycled = getCycledExample(item.id, state.reps);

  return {
    itemId: item.id,
    languageCode: item.languageCode,
    isNew: !current || current.reps === 0 || current.status === "new",
    displayForm: item.displayForm,
    lemma: item.lemma,
    primaryGloss: item.primaryGloss,
    pos: item.pos,
    rank: item.rank,
    example: cycled?.sentence ?? item.example,
    translation: cycled?.translation ?? item.translation,
    pronunciation: item.pronunciation,
    exampleIndex: cycled?.index,
    secondaryGlosses: item.secondaryGlosses,
    notes: item.notes,
    ratingPreviews: getRatingPreviews(state, now)
  };
}

function interleave<T>(due: T[], fresh: T[]) {
  const merged: T[] = [];
  let dueIndex = 0;
  let freshIndex = 0;

  while (dueIndex < due.length || freshIndex < fresh.length) {
    for (let step = 0; step < 4 && dueIndex < due.length; step += 1) {
      merged.push(due[dueIndex]);
      dueIndex += 1;
    }

    if (freshIndex < fresh.length) {
      merged.push(fresh[freshIndex]);
      freshIndex += 1;
    }
  }

  return merged;
}

function getShortWeekdayLabel(date: Date) {
  return ["Su", "M", "Tu", "W", "Th", "F", "Sa"][date.getDay()] ?? "";
}

function buildQueueSnapshot(
  userId: string,
  dailyGoal: number,
  languageCodes: SupportedLanguageCode[],
  mode: StudyMode,
  now: Date
) {
  const allStates = getUserStates(userId);
  const states = filterStateMapByLanguages(allStates, languageCodes);
  const languageOrder = buildLanguageOrder(languageCodes);
  const dueCandidates = Object.values(states)
    .filter((state) => isDueNow(state, now))
    .sort((left, right) => {
      const retrievabilityDelta =
        (getRetrievability(left, now) ?? -1) - (getRetrievability(right, now) ?? -1);
      if (retrievabilityDelta !== 0) {
        return retrievabilityDelta;
      }

      const dueDelta = new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
      if (dueDelta !== 0) {
        return dueDelta;
      }

      const leftItem = getItem(left.itemId);
      const rightItem = getItem(right.itemId);
      const languageDelta =
        (languageOrder.get(leftItem?.languageCode ?? "es") ?? 999) -
        (languageOrder.get(rightItem?.languageCode ?? "es") ?? 999);
      if (languageDelta !== 0) {
        return languageDelta;
      }

      return (leftItem?.rank ?? 9999) - (rightItem?.rank ?? 9999);
    })
    .map((state) => state.itemId)
    .slice(0, REVIEW_SOFT_CAP);

  const freshCandidates = pickFreshItemsByLanguage(
    getItemsForLanguages(languageCodes).filter((item) => !states[item.id]),
    dailyGoal,
    languageCodes
  ).map((item) => item.id);

  const due = mode === "new-only" ? [] : dueCandidates;
  const fresh = mode === "review-only" ? [] : freshCandidates;
  const queue =
    mode === "review-only" ? due : mode === "new-only" ? fresh : interleave(due, fresh);

  return {
    due,
    fresh,
    queue
  };
}

function buildReviewsDueSeries(
  userId: string,
  dailyGoal: number,
  languageCodes: SupportedLanguageCode[],
  mode: StudyMode,
  now: Date
): ReviewsDueDatum[] {
  const states = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const { due, queue } = buildQueueSnapshot(userId, dailyGoal, languageCodes, mode, now);
  const today = startOfDay(now);
  const series = Array.from({ length: 30 }, (_, index) => {
    const day = addDays(today, index);
    const label = index === 0 ? "Today" : getShortWeekdayLabel(day);

    return {
      label,
      shortLabel: label,
      value: 0
    };
  });

  series[0].value = due.length;

  Object.values(states).forEach((state) => {
    const offset = differenceInCalendarDays(startOfDay(new Date(state.dueAt)), today);
    if (offset > 0 && offset < series.length) {
      series[offset].value += 1;
    }
  });

  queue.forEach((itemId) => {
    const current = states[itemId] ?? createInitialState(userId, itemId, now);
    const scheduled = scheduleReview(current, 3, now);
    const offset = differenceInCalendarDays(startOfDay(new Date(scheduled.dueAt)), today);

    if (offset > 0 && offset < series.length) {
      series[offset].value += 1;
    }
  });

  return series;
}

function buildVocabularyGrowthSeries(
  userId: string,
  languageCodes: SupportedLanguageCode[],
  now: Date
): VocabularyGrowthDatum[] {
  const states = Object.values(filterStateMapByLanguages(getUserStates(userId), languageCodes));
  const items = getItemsForLanguages(languageCodes);
  const today = startOfDay(now);

  return Array.from({ length: 30 }, (_, index) => {
    const day = addDays(today, index - 29);
    const dayEnd = endOfDay(day);
    let introduced = 0;
    let learning = 0;
    let solid = 0;

    states.forEach((state) => {
      const introducedAt = new Date(state.introducedAt);
      if (introducedAt > dayEnd) {
        return;
      }

      introduced += 1;
      const age = differenceInCalendarDays(dayEnd, introducedAt);

      // Estimate whether the word was likely in "solid review" status as of this day.
      // If currently in review: estimate when it entered review using lastReviewedAt - scheduledDays.
      // Only classify as solid for days after that estimated entry date.
      let isSolid = false;
      if (state.status === "review" && age >= 4) {
        const lastReviewed = state.lastReviewedAt ? new Date(state.lastReviewedAt) : null;
        if (lastReviewed && state.scheduledDays > 0) {
          const estimatedReviewEntry = addDays(lastReviewed, -state.scheduledDays);
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
      label: index === 0 ? "30 days ago" : index === 29 ? "Today" : "",
      shortLabel: index === 0 ? "30 days ago" : index === 29 ? "Today" : "",
      learning,
      solid,
      notIntroduced: Math.max(0, items.length - introduced)
    };
  });
}

function getStudyActivityDays(states: UserItemState[], events: ReviewEvent[]) {
  const reviewedDays = new Set<string>();

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

function buildConsistencySeries(
  states: UserItemState[],
  events: ReviewEvent[],
  now: Date
): StudyConsistencyDatum[] {
  const today = startOfDay(now);
  const activeDays = getStudyActivityDays(states, events);

  return Array.from({ length: 35 }, (_, index) => {
    const day = addDays(today, index - 34);

    return {
      label: day.toDateString(),
      shortLabel: index === 34 ? "Today" : getShortWeekdayLabel(day),
      active: activeDays.has(day.toDateString()),
      isToday: index === 34
    };
  });
}

function getStreakDays(states: UserItemState[], events: ReviewEvent[], now: Date) {
  const reviewedDays = getStudyActivityDays(states, events);
  if (reviewedDays.size === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(now);

  // If the user hasn't studied today yet, start counting from yesterday
  if (!reviewedDays.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (reviewedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getReviewsTodayCount(states: UserItemState[], events: ReviewEvent[], now: Date) {
  const eventCount = events.filter((event) => isSameDay(new Date(event.reviewedAt), now)).length;
  if (eventCount > 0) {
    return eventCount;
  }

  return states.filter((state) => state.lastReviewedAt && isSameDay(new Date(state.lastReviewedAt), now)).length;
}

function getLifetimeReviewsCount(states: UserItemState[], events: ReviewEvent[]) {
  if (events.length > 0) {
    return events.length;
  }

  return states.reduce((sum, state) => sum + state.reps, 0);
}

function getRetentionScore(states: UserItemState[], now: Date) {
  const retrievabilities = states
    .filter((state) => state.reps > 0)
    .map((state) => getRetrievability(state, now))
    .filter((value): value is number => typeof value === "number");

  if (retrievabilities.length === 0) {
    return 0;
  }

  const average = retrievabilities.reduce((sum, value) => sum + value, 0) / retrievabilities.length;
  return Math.round(average * 100);
}

function getIntroducedTodayCount(states: UserItemState[], now: Date) {
  return states.filter((state) => isSameDay(new Date(state.introducedAt), now)).length;
}

function buildStudyPlan(
  userId: string,
  dailyGoal: number,
  languageCodes: SupportedLanguageCode[],
  mode: StudyMode,
  now: Date
): StudyPlan {
  const states = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const { due, fresh, queue } = buildQueueSnapshot(userId, dailyGoal, languageCodes, mode, now);
  const tomorrowCutoff = endOfTomorrow();
  let earliestPlannedDue: string | null = null;

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

function getSessionInsights(
  userId: string,
  languageCodes: SupportedLanguageCode[],
  now: Date
): SessionInsights {
  const allStates = getUserStates(userId);
  const states = Object.values(filterStateMapByLanguages(allStates, languageCodes));
  const events = filterEventsByLanguages(getUserEvents(userId), languageCodes);

  // Compute per-language due counts
  const dueByLanguage: Record<string, number> = {};
  for (const code of languageCodes) {
    const langStates = Object.values(filterStateMapByLanguages(allStates, [code]));
    dueByLanguage[code] = langStates.filter((s) => isDueNow(s, now)).length;
  }

  return {
    reviewsToday: getReviewsTodayCount(states, events, now),
    newWordsToday: getIntroducedTodayCount(states, now),
    streakDays: getStreakDays(states, events, now),
    retentionScore: getRetentionScore(states, now),
    dueByLanguage
  };
}

// ---------------------------------------------------------------------------
// Exported API (identical signatures and return types)
// ---------------------------------------------------------------------------

export function getLearnerSettings(userId: string) {
  return getUserSettings(userId);
}

export function updateLearnerSettings(
  userId: string,
  updates: Partial<Pick<LearnerSettings, "dailyGoal" | "selectedLanguageCodes" | "dashboardLanguageCodes" | "preferredStudyMode">>
) {
  const settings = getUserSettings(userId);
  const db = getDb();

  const updated: LearnerSettings = {
    ...settings,
    dailyGoal: updates.dailyGoal ?? settings.dailyGoal,
    selectedLanguageCodes: normalizeLanguageCodes(updates.selectedLanguageCodes ?? settings.selectedLanguageCodes),
    dashboardLanguageCodes: normalizeLanguageCodes(updates.dashboardLanguageCodes ?? settings.dashboardLanguageCodes),
    preferredStudyMode: updates.preferredStudyMode ?? settings.preferredStudyMode,
    updatedAt: new Date().toISOString()
  };

  db.update(tables.userSettings)
    .set({
      dailyGoal: updated.dailyGoal,
      selectedLanguageCodes: JSON.stringify(updated.selectedLanguageCodes),
      dashboardLanguageCodes: JSON.stringify(updated.dashboardLanguageCodes),
      preferredStudyMode: updated.preferredStudyMode,
      updatedAt: updated.updatedAt,
    })
    .where(eq(tables.userSettings.userId, userId))
    .run();

  return {
    settings: updated,
    dashboard: buildDashboardSnapshot(userId)
  };
}

export function getStudyPlan(
  userId: string,
  options?: {
    dailyGoal?: number;
    languageCodes?: SupportedLanguageCode[];
    mode?: StudyMode;
  }
) {
  const settings = getUserSettings(userId);
  const now = new Date();
  const dailyGoal = options?.dailyGoal ?? settings.dailyGoal;
  const languageCodes = normalizeLanguageCodes(options?.languageCodes ?? settings.selectedLanguageCodes);
  const mode = options?.mode ?? settings.preferredStudyMode;

  return buildStudyPlan(userId, dailyGoal, languageCodes, mode, now);
}

export function startSession(
  userId: string,
  options?: {
    languageCodes?: SupportedLanguageCode[];
    mode?: StudyMode;
  }
) {
  const states = getUserStates(userId);
  const settings = getUserSettings(userId);
  const now = new Date();
  const languageCodes = normalizeLanguageCodes(options?.languageCodes ?? settings.selectedLanguageCodes);
  const mode = options?.mode ?? settings.preferredStudyMode;
  const insights = getSessionInsights(userId, languageCodes, now);
  const studyPlan = buildStudyPlan(userId, settings.dailyGoal, languageCodes, mode, now);
  const { due, fresh, queue } = buildQueueSnapshot(userId, SESSION_FRESH_POOL, languageCodes, mode, now);
  const sessionId = `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const session: DemoSession = {
    id: sessionId,
    userId,
    mode,
    languageCodes,
    queue,
    dueCount: due.length,
    newCount: fresh.length,
    createdAt: now.toISOString()
  };

  const db = getDb();
  db.insert(tables.sessions).values({
    id: session.id,
    userId: session.userId,
    mode: session.mode,
    languageCodes: JSON.stringify(session.languageCodes),
    queue: JSON.stringify(session.queue),
    dueCount: session.dueCount,
    newCount: session.newCount,
    createdAt: session.createdAt,
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
    firstCard: session.queue[0]
      ? toCard(getItem(session.queue[0])!, userId, states[session.queue[0]] ?? null, now)
      : null
  };
}

/** Resume an existing session — returns the same shape as startSession so the client can restore. */
export function resumeSession(sessionId: string) {
  const session = getSession(sessionId);
  if (!session) return null;

  const now = new Date();
  const firstItemId = session.queue[0] ?? null;
  const states = getUserStates(session.userId);
  const firstItem = firstItemId ? getItem(firstItemId) : null;
  const firstCard = firstItem ? toCard(firstItem, session.userId, states[firstItemId!] ?? null, now) : null;
  const insights = getSessionInsights(session.userId, session.languageCodes, now);

  return {
    sessionId: session.id,
    dueCount: session.dueCount,
    newCount: session.newCount,
    remainingCount: session.queue.length,
    languageCodes: session.languageCodes,
    mode: session.mode,
    insights,
    firstCard,
  };
}

export function getNextCard(sessionId: string) {
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
  return item ? toCard(item, session.userId, states[itemId] ?? null, new Date()) : null;
}

function buildDashboardSnapshot(
  userId: string,
  languageCodeOverrides?: SupportedLanguageCode[]
): DashboardSnapshot {
  const settings = getUserSettings(userId);
  const languageCodes = normalizeLanguageCodes(languageCodeOverrides ?? settings.dashboardLanguageCodes);
  const stateMap = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const states = Object.values(stateMap);
  const events = filterEventsByLanguages(getUserEvents(userId), languageCodes);
  const activeItems = getItemsForLanguages(languageCodes);
  const now = new Date();
  const reviewsToday = getReviewsTodayCount(states, events, now);
  const introducedToday = getIntroducedTodayCount(states, now);
  const totalReviews = getLifetimeReviewsCount(states, events);

  const dueCount = states.filter((state) => !isBefore(now, new Date(state.dueAt))).length;
  const newAvailableCount = activeItems.filter((item) => !stateMap[item.id]).length;
  const activeWords = Object.keys(stateMap).length;
  const coveragePercent = activeItems.length === 0 ? 0 : Math.round((activeWords / activeItems.length) * 100);
  const exampleCoveragePercent =
    activeItems.length === 0
      ? 0
      : Math.round(
          (activeItems.filter((item) => item.example.trim() && item.translation.trim()).length / activeItems.length) *
            100
        );
  const upcomingState = [...states]
    .filter((state) => isBefore(now, new Date(state.dueAt)))
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())[0];

  return {
    availableLanguages: getAllLanguages(),
    activeLanguageCodes: languageCodes,
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
}

export function getDashboardSnapshot(
  userId: string,
  options?: {
    languageCodes?: SupportedLanguageCode[];
  }
) {
  return buildDashboardSnapshot(userId, options?.languageCodes);
}

export function getSiteSnapshot(userId: string) {
  const now = new Date();
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
    featuredCard: item && state ? toCard(item, userId, state, now) : null
  };
}

/** Lightweight query: returns up to `limit` studied words without rebuilding the full dashboard. */
export function getRecentStudiedWords(
  userId: string,
  languageCodes: SupportedLanguageCode[],
  limit = 4
): RankedListEntry[] {
  const now = new Date();
  const stateMap = filterStateMapByLanguages(getUserStates(userId), languageCodes);
  const stateEntries = Object.entries(stateMap)
    .sort(([, a], [, b]) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, limit);
  return stateEntries
    .map(([itemId, state]) => {
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
        retrievabilityPercent:
          typeof retrievability === "number" ? Math.round(retrievability * 100) : null,
        isFocus: false,
        listTitles: []
      } as RankedListEntry;
    })
    .filter((entry): entry is RankedListEntry => entry !== null);
}

export function getLibrarySnapshot(userId: string): LibrarySnapshot {
  const now = new Date();
  const dashboard = buildDashboardSnapshot(userId);
  const stateMap = filterStateMapByLanguages(
    getUserStates(userId),
    dashboard.activeLanguageCodes
  );
  const items = getRankedEntries(
    stateMap,
    null,
    now,
    dashboard.activeLanguageCodes
  );

  return {
    coveragePercent: dashboard.coveragePercent,
    dailyGoal: dashboard.dailyGoal,
    focusItem: null,
    items
  };
}

export function getListsSnapshot(userId: string): ListsSnapshot {
  const now = new Date();
  const stateMap = getUserStates(userId);
  const settings = getUserSettings(userId);
  const dashboard = buildDashboardSnapshot(userId);

  const lists = getCuratedLists()
    .map((list) => {
      const items = list.itemIds
        .map((itemId) => getItem(itemId))
        .filter((item): item is DemoLexicalItem => Boolean(item))
        .sort((left, right) => left.rank - right.rank)
        .map((item) => toRankedEntry(item, stateMap[item.id], null, now));

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
        completionPercent: items.length === 0 ? 0 : Math.round((introducedItems / items.length) * 100),
        items
      };
    })
    .sort((left, right) => {
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

export function getWordsSnapshot(userId: string): WordsSnapshot {
  const now = new Date();
  const settings = getUserSettings(userId);
  const dashboard = buildDashboardSnapshot(userId);
  const stateMap = filterStateMapByLanguages(
    getUserStates(userId),
    dashboard.activeLanguageCodes
  );
  const rankedEntries = getRankedEntries(
    stateMap,
    null,
    now,
    dashboard.activeLanguageCodes
  );

  const buildSection = (section: WordsSection) => section;

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
        return state
          ? !isDueNow(state, now) &&
              (state.status === "learning" || state.status === "relearning" || state.status === "new")
          : false;
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
    availableLanguages: getAllLanguages(),
    activeLanguageCodes: dashboard.activeLanguageCodes,
    preferredStudyMode: dashboard.preferredStudyMode,
    focusItem: null,
    studyPlan: buildStudyPlan(
      userId,
      settings.dailyGoal,
      dashboard.activeLanguageCodes,
      settings.preferredStudyMode,
      now
    ),
    sections
  };
}

export function getWordSnapshot(userId: string, itemId: string): WordDetailSnapshot | null {
  const now = new Date();
  const stateMap = getUserStates(userId);
  const item = getItem(itemId);

  if (!item) {
    return null;
  }

  const state = stateMap[itemId];
  const rankedItem = toRankedEntry(item, state, null, now);
  const neighborRows = getDb().select().from(tables.corpusItems)
    .where(and(
      ne(tables.corpusItems.id, itemId),
      eq(tables.corpusItems.languageCode, item.languageCode),
      between(tables.corpusItems.rank, item.rank - 2, item.rank + 2)
    ))
    .orderBy(asc(tables.corpusItems.rank))
    .all();
  const neighbors = neighborRows
    .map(rowToLexicalItem)
    .map((candidate) => toRankedEntry(candidate, stateMap[candidate.id], null, now));
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

  const examples = getDb().select().from(tables.corpusItemExamples)
    .where(eq(tables.corpusItemExamples.itemId, itemId))
    .orderBy(asc(tables.corpusItemExamples.sortOrder))
    .all()
    .map(r => ({ sentence: r.sentence, translation: r.translation }));

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

export function getItemById(itemId: string) {
  const item = getItem(itemId);
  return item ? toCard(item, DEMO_USER_ID, null, new Date()) : null;
}

export function submitReview(params: {
  userId: string;
  sessionId: string;
  itemId: string;
  rating: ReviewRating;
  elapsedMs: number;
}) {
  const { userId, sessionId, itemId, rating, elapsedMs } = params;
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
  const now = new Date();
  const current = states[itemId] ?? createInitialState(userId, itemId, now);
  const next = scheduleReview(current, rating, now);

  const db = getDb();

  // Update session queue
  db.update(tables.sessions)
    .set({ queue: JSON.stringify(newQueue) })
    .where(eq(tables.sessions.id, sessionId))
    .run();

  // Upsert user item state
  db.insert(tables.userItemStates).values({
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
    lastReviewedAt: next.lastReviewedAt,
  }).onConflictDoUpdate({
    target: [tables.userItemStates.userId, tables.userItemStates.itemId],
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
      lastReviewedAt: next.lastReviewedAt,
    }
  }).run();

  // Insert review event
  const reviewEventId = `review-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  db.insert(tables.reviewEvents).values({
    id: reviewEventId,
    userId,
    itemId,
    rating,
    elapsedMs,
    reviewedAt: now.toISOString(),
    mode: "recall",
    stateBefore: current.status,
    stateAfter: next.status,
  }).run();

  // Re-read states after the write so downstream reads are fresh
  const updatedStates = getUserStates(userId);
  const updatedSession = getSession(sessionId)!;

  return {
    nextDueAt: next.dueAt,
    remainingCount: updatedSession.queue.length,
    insights: getSessionInsights(userId, updatedSession.languageCodes, now),
    studyPlan: buildStudyPlan(
      userId,
      getUserSettings(userId).dailyGoal,
      updatedSession.languageCodes,
      updatedSession.mode,
      now
    ),
    nextCard: updatedSession.queue[0]
      ? toCard(
          getItem(updatedSession.queue[0])!,
          userId,
          updatedStates[updatedSession.queue[0]] ?? null,
          now
        )
      : null
  };
}
