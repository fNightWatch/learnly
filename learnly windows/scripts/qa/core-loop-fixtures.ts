import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/local-client";
import * as tables from "@/lib/db/sqlite-schema";
import {
  getDashboardSnapshot,
  getLearnerSettings,
  startSession,
  submitReview,
} from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";
import { createInitialState } from "@/lib/srs/scheduler";
import type {
  ChineseReviewFlow,
  LearnerSettings,
  SessionCardPayload,
  StudyMode,
  SupportedLanguageCode,
} from "@/lib/demo/types";

export type CoreLoopFixtureKind = "fresh" | "in-progress" | "recovery";
export type StudyDirection = "auto" | "es-to-en" | "en-to-es";
export type StudyTimerMode = "timer" | "stopwatch";

type StorageState = {
  local: Record<string, string>;
  session: Record<string, string>;
};

type FixtureCardSummary = Pick<
  SessionCardPayload,
  | "itemId"
  | "languageCode"
  | "displayForm"
  | "primaryGloss"
  | "example"
  | "translation"
  | "exampleIndex"
  | "pronunciation"
  | "isNew"
>;

type FixtureSessionSummary = {
  sessionId: string;
  remainingCount: number;
  cardsReviewed: number;
  currentDirection: "es-to-en" | "en-to-es";
  autoDirectionCounter: number;
  firstCard: FixtureCardSummary | null;
  currentCard: FixtureCardSummary | null;
  lastReviewRating?: 1 | 3;
  interactionHint?: "click-dont-know" | "reload-study";
};

export type CoreLoopFixtureOptions = {
  selectedLanguages?: SupportedLanguageCode[];
  dashboardLanguages?: SupportedLanguageCode[];
  studyMode?: StudyMode;
  chineseReviewFlow?: ChineseReviewFlow;
  direction?: StudyDirection;
  timeMode?: StudyTimerMode;
  timerMinutes?: number;
  reviewedCardRating?: 1 | 3;
  theme?: "light" | "dark";
  elapsedSeconds?: number;
};

export type CoreLoopFixture = {
  kind: CoreLoopFixtureKind;
  generatedAt: string;
  routes: {
    home: "/";
    dashboard: "/dashboard";
    study: "/study";
  };
  settings: LearnerSettings;
  dashboard: {
    activeLanguageCodes: SupportedLanguageCode[];
    dueCount: number;
    newAvailableCount: number;
    activeWords: number;
    reviewsToday: number;
    introducedToday: number;
    retentionScore: number;
    preferredStudyMode: StudyMode;
  };
  storage: StorageState;
  session: FixtureSessionSummary | null;
};

const SESSION_STORAGE_KEY = "learnly-active-session";
const COMPLETE_STORAGE_KEY = "learnly-last-complete-session";
const DEFAULT_DAILY_GOAL = 10;
const DEFAULT_LANGUAGE_CODES: SupportedLanguageCode[] = ["es"];
const DEFAULT_DASHBOARD_LANGUAGE_CODES: SupportedLanguageCode[] = ["es"];
const DEFAULT_STUDY_MODE: StudyMode = "everyday";
const DEFAULT_CHINESE_REVIEW_FLOW: ChineseReviewFlow = "four-click";
const DEFAULT_OPTIONS: Required<
  Pick<
    CoreLoopFixtureOptions,
    "direction" | "timeMode" | "timerMinutes" | "reviewedCardRating" | "theme" | "elapsedSeconds"
  >
> = {
  direction: "auto",
  timeMode: "stopwatch",
  timerMinutes: 15,
  reviewedCardRating: 3,
  theme: "light",
  elapsedSeconds: 72,
};

function resolveAutoDirection(counter: number): "es-to-en" | "en-to-es" {
  return counter % 2 === 0 ? "en-to-es" : "es-to-en";
}

function summarizeCard(card: SessionCardPayload | null): FixtureCardSummary | null {
  if (!card) {
    return null;
  }

  return {
    itemId: card.itemId,
    languageCode: card.languageCode,
    displayForm: card.displayForm,
    primaryGloss: card.primaryGloss,
    example: card.example,
    translation: card.translation,
    exampleIndex: card.exampleIndex,
    pronunciation: card.pronunciation,
    isNew: card.isNew,
  };
}

function normalizeLanguageCodes(
  codes: SupportedLanguageCode[] | undefined,
  availableCodes: SupportedLanguageCode[],
  fallback: SupportedLanguageCode[]
) {
  const supported = new Set(availableCodes);
  const normalized = [...new Set((codes ?? fallback).filter((code) => supported.has(code)))];
  return (normalized.length > 0 ? normalized : fallback) as SupportedLanguageCode[];
}

function sortItemsByLanguageOrder(
  items: Array<{ id: string; languageCode: SupportedLanguageCode; pos: string; rank: number }>,
  languageCodes: SupportedLanguageCode[]
) {
  const order = new Map(languageCodes.map((code, index) => [code, index]));

  return items.slice().sort((left, right) => {
    const languageDelta = (order.get(left.languageCode) ?? 999) - (order.get(right.languageCode) ?? 999);
    if (languageDelta !== 0) {
      return languageDelta;
    }

    return left.rank - right.rank;
  });
}

function buildDeterministicSeededUserStates(
  userId: string,
  items: Array<{ id: string; languageCode: SupportedLanguageCode; pos: string; rank: number }>,
  availableCodes: SupportedLanguageCode[],
  now: Date
) {
  const priorityIds = ["ser", "tener", "hacer", "poder", "ir", "decir", "ver", "querer", "dar", "palabra"];
  const prioritizedItems = priorityIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter((item): item is { id: string; languageCode: SupportedLanguageCode; pos: string; rank: number } => Boolean(item));
  const spanishItems = sortItemsByLanguageOrder(
    items.filter((item) => item.languageCode === "es"),
    ["es"]
  );
  const introductoryWave = spanishItems.slice(0, 36);
  const contentHeavyWave = spanishItems.filter(
    (item) => item.rank > 36 && !["article", "preposition", "conjunction", "determiner"].includes(item.pos)
  );
  const betaLanguageWave = availableCodes
    .filter((code) => code !== "es")
    .flatMap((code) =>
      sortItemsByLanguageOrder(
        items.filter((item) => item.languageCode === code),
        [code]
      ).slice(0, 8)
    );
  const seedItems = [...prioritizedItems, ...contentHeavyWave, ...introductoryWave, ...betaLanguageWave]
    .filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 112);

  return seedItems.map((item, index) => {
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
      ? new Date(now.getTime() - (index % 3) * 24 * 60 * 60 * 1000).toISOString()
      : isNearFutureSeed
        ? new Date(now.getTime() + (1 + (index % 7)) * 24 * 60 * 60 * 1000).toISOString()
        : isLongReviewSeed
          ? new Date(now.getTime() + (6 + (index % 20)) * 24 * 60 * 60 * 1000).toISOString()
          : new Date(now.getTime() + (1 + (index % 4)) * 24 * 60 * 60 * 1000).toISOString();

    const state = {
      ...createInitialState(userId, item.id, now),
      status,
      dueAt,
      stability: Number((1.4 + (index % 9) * 0.68).toFixed(2)),
      difficulty: Number((4.2 + (index % 7) * 0.24).toFixed(2)),
      scheduledDays: isLongReviewSeed ? 5 + (index % 12) : 1 + (index % 4),
      learningSteps: status === "learning" || status === "relearning" ? 1 + (index % 2) : 0,
      reps: 2 + (index % 8),
      lapses: index % 11 === 0 ? 1 : 0,
      lastRating: status === "review" ? 3 : 2,
      introducedAt: new Date(now.getTime() - introducedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      lastReviewedAt: new Date(now.getTime() - lastReviewedDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
    };

    return {
      itemId: item.id,
      state,
    };
  });
}

function resetDemoUser() {
  const db = getDb();

  db.delete(tables.reviewEvents)
    .where(eq(tables.reviewEvents.userId, DEMO_USER_ID))
    .run();
  db.delete(tables.sessions)
    .where(eq(tables.sessions.userId, DEMO_USER_ID))
    .run();
  db.delete(tables.userItemStates)
    .where(eq(tables.userItemStates.userId, DEMO_USER_ID))
    .run();
  db.delete(tables.userSettings)
    .where(eq(tables.userSettings.userId, DEMO_USER_ID))
    .run();
}

function seedDeterministicDemoUser(options: CoreLoopFixtureOptions) {
  const db = getDb();
  const now = new Date();
  const availableCodes = db
    .select({ code: tables.corpusLanguages.code })
    .from(tables.corpusLanguages)
    .all()
    .map((row) => row.code as SupportedLanguageCode);
  const selectedLanguageCodes = normalizeLanguageCodes(
    options.selectedLanguages,
    availableCodes,
    DEFAULT_LANGUAGE_CODES
  );
  const dashboardLanguageCodes = normalizeLanguageCodes(
    options.dashboardLanguages ?? options.selectedLanguages,
    availableCodes,
    DEFAULT_DASHBOARD_LANGUAGE_CODES
  );
  const preferredStudyMode = options.studyMode ?? DEFAULT_STUDY_MODE;
  const chineseReviewFlow = options.chineseReviewFlow ?? DEFAULT_CHINESE_REVIEW_FLOW;
  const items = db
    .select({
      id: tables.corpusItems.id,
      languageCode: tables.corpusItems.languageCode,
      pos: tables.corpusItems.pos,
      rank: tables.corpusItems.rank,
    })
    .from(tables.corpusItems)
    .all()
    .map((row) => ({
      id: row.id,
      languageCode: row.languageCode as SupportedLanguageCode,
      pos: row.pos,
      rank: row.rank,
    }));
  const seededStates = buildDeterministicSeededUserStates(DEMO_USER_ID, items, availableCodes, now);

  db.insert(tables.userSettings)
    .values({
      userId: DEMO_USER_ID,
      dailyGoal: DEFAULT_DAILY_GOAL,
      selectedLanguageCodes: JSON.stringify(selectedLanguageCodes),
      dashboardLanguageCodes: JSON.stringify(dashboardLanguageCodes),
      preferredStudyMode,
      chineseReviewFlow,
      updatedAt: now.toISOString(),
    })
    .run();

  const insertState = db.insert(tables.userItemStates);
  for (const { itemId, state } of seededStates) {
    insertState
      .values({
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
      })
      .run();
  }
}

function buildLocalStorage(options: Required<Pick<CoreLoopFixtureOptions, "direction" | "timeMode" | "timerMinutes" | "theme">>) {
  return {
    "languagehack-direction": options.direction,
    "learnly-study-time-mode": options.timeMode,
    "learnly-study-timer-minutes": String(options.timerMinutes),
    "languagehack-theme": options.theme,
  };
}

function buildActiveSessionStorage(params: {
  sessionId: string;
  cardsReviewed: number;
  direction: StudyDirection;
  timeMode: StudyTimerMode;
  timerMinutes: number;
  elapsedSeconds: number;
  autoDirectionCounter: number;
  currentCardItemId: string | null;
}) {
  const persisted = {
    sessionId: params.sessionId,
    timeMode: params.timeMode,
    timerMinutes: params.timerMinutes,
    studyingStartedAt: Date.now() - params.elapsedSeconds * 1000,
    cardsReviewed: params.cardsReviewed,
    autoDirectionCounter: params.autoDirectionCounter,
    currentDirection:
      params.direction === "auto"
        ? resolveAutoDirection(params.autoDirectionCounter)
        : params.direction,
    currentCardItemId: params.currentCardItemId,
  };

  return {
    [SESSION_STORAGE_KEY]: JSON.stringify(persisted),
  };
}

function buildEmptyStorage(options: Required<Pick<CoreLoopFixtureOptions, "direction" | "timeMode" | "timerMinutes" | "theme">>): StorageState {
  return {
    local: buildLocalStorage(options),
    session: {
      [COMPLETE_STORAGE_KEY]: "",
    },
  };
}

function getMergedOptions(options: CoreLoopFixtureOptions) {
  return {
    direction: options.direction ?? DEFAULT_OPTIONS.direction,
    timeMode: options.timeMode ?? DEFAULT_OPTIONS.timeMode,
    timerMinutes: options.timerMinutes ?? DEFAULT_OPTIONS.timerMinutes,
    reviewedCardRating: options.reviewedCardRating ?? DEFAULT_OPTIONS.reviewedCardRating,
    theme: options.theme ?? DEFAULT_OPTIONS.theme,
    elapsedSeconds: options.elapsedSeconds ?? DEFAULT_OPTIONS.elapsedSeconds,
  };
}

export function prepareCoreLoopFixture(
  kind: CoreLoopFixtureKind,
  options: CoreLoopFixtureOptions = {}
): CoreLoopFixture {
  const merged = getMergedOptions(options);

  resetDemoUser();
  seedDeterministicDemoUser(options);

  const settings = getLearnerSettings(DEMO_USER_ID);
  const freshDashboard = getDashboardSnapshot(DEMO_USER_ID);
  const baseFixture: CoreLoopFixture = {
    kind,
    generatedAt: new Date().toISOString(),
    routes: {
      home: "/",
      dashboard: "/dashboard",
      study: "/study",
    },
    settings,
    dashboard: {
      activeLanguageCodes: freshDashboard.activeLanguageCodes,
      dueCount: freshDashboard.dueCount,
      newAvailableCount: freshDashboard.newAvailableCount,
      activeWords: freshDashboard.activeWords,
      reviewsToday: freshDashboard.reviewsToday,
      introducedToday: freshDashboard.introducedToday,
      retentionScore: freshDashboard.retentionScore,
      preferredStudyMode: freshDashboard.preferredStudyMode,
    },
    storage: buildEmptyStorage(merged),
    session: null,
  };

  if (kind === "fresh") {
    return baseFixture;
  }

  const session = startSession(DEMO_USER_ID, {
    languageCodes: settings.selectedLanguageCodes,
    mode: settings.preferredStudyMode,
  });

  if (!session.firstCard) {
    throw new Error(`Fixture "${kind}" could not start a session with a first card.`);
  }

  if (kind === "recovery") {
    const autoDirectionCounter = merged.direction === "auto" ? 1 : 0;
    return {
      ...baseFixture,
      storage: {
        local: buildLocalStorage(merged),
        session: buildActiveSessionStorage({
          sessionId: session.sessionId,
          cardsReviewed: 0,
          direction: merged.direction,
          timeMode: merged.timeMode,
          timerMinutes: merged.timerMinutes,
          elapsedSeconds: merged.elapsedSeconds,
          autoDirectionCounter,
          currentCardItemId: session.firstCard.itemId,
        }),
      },
      session: {
        sessionId: session.sessionId,
        remainingCount: session.remainingCount,
        cardsReviewed: 0,
        currentDirection:
          merged.direction === "auto" ? resolveAutoDirection(1) : merged.direction,
        autoDirectionCounter,
        firstCard: summarizeCard(session.firstCard),
        currentCard: summarizeCard(session.firstCard),
        interactionHint: "click-dont-know",
      },
    };
  }

  const reviewed = submitReview({
    userId: DEMO_USER_ID,
    sessionId: session.sessionId,
    itemId: session.firstCard.itemId,
    rating: merged.reviewedCardRating,
    elapsedMs: 1200,
  });

  if (!reviewed.nextCard) {
    throw new Error(`Fixture "${kind}" could not advance to an in-progress next card.`);
  }

  const autoDirectionCounter = merged.direction === "auto" ? 2 : 0;
  const updatedDashboard = getDashboardSnapshot(DEMO_USER_ID);

  return {
    ...baseFixture,
    dashboard: {
      activeLanguageCodes: updatedDashboard.activeLanguageCodes,
      dueCount: updatedDashboard.dueCount,
      newAvailableCount: updatedDashboard.newAvailableCount,
      activeWords: updatedDashboard.activeWords,
      reviewsToday: updatedDashboard.reviewsToday,
      introducedToday: updatedDashboard.introducedToday,
      retentionScore: updatedDashboard.retentionScore,
      preferredStudyMode: updatedDashboard.preferredStudyMode,
    },
    storage: {
      local: buildLocalStorage(merged),
      session: buildActiveSessionStorage({
        sessionId: session.sessionId,
        cardsReviewed: 1,
        direction: merged.direction,
        timeMode: merged.timeMode,
        timerMinutes: merged.timerMinutes,
        elapsedSeconds: merged.elapsedSeconds,
        autoDirectionCounter,
        currentCardItemId: reviewed.nextCard.itemId,
      }),
    },
    session: {
      sessionId: session.sessionId,
      remainingCount: reviewed.remainingCount,
      cardsReviewed: 1,
      currentDirection:
        merged.direction === "auto" ? resolveAutoDirection(2) : merged.direction,
      autoDirectionCounter,
      firstCard: summarizeCard(session.firstCard),
      currentCard: summarizeCard(reviewed.nextCard),
      lastReviewRating: merged.reviewedCardRating,
      interactionHint: "reload-study",
    },
  };
}
