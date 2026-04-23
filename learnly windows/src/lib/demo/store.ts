import fs from "fs";
import path from "path";
import type {
  AssumedWordListOption,
  DashboardSnapshot,
  DemoLanguage,
  LearnerSettings,
  LibrarySnapshot,
  ListsSnapshot,
  RankedListEntry,
  ReviewStatus,
  SessionCardPayload,
  SessionInsights,
  StudyMode,
  StudyPlan,
  SupportedLanguageCode,
  WordDetailSnapshot,
  WordsSnapshot
} from "@/lib/demo/types";

type SettingsUpdate = Partial<
  Pick<
    LearnerSettings,
    | "dailyGoal"
    | "selectedLanguageCodes"
    | "dashboardLanguageCodes"
    | "dashboardRangeDays"
    | "preferredStudyMode"
    | "chineseReviewFlow"
    | "assumedWordListIds"
  >
>;

type StartSessionResult = {
  sessionId: string;
  dueCount: number;
  newCount: number;
  remainingCount: number;
  languageCodes: SupportedLanguageCode[];
  mode: StudyMode;
  dailyGoal: number;
  insights: SessionInsights;
  studyPlan: StudyPlan;
  firstCard: SessionCardPayload | null;
};

type ResumeSessionResult =
  | {
      sessionId: string;
      dueCount: number;
      newCount: number;
      remainingCount: number;
      languageCodes: SupportedLanguageCode[];
      mode: StudyMode;
      insights: SessionInsights;
      firstCard: SessionCardPayload | null;
    }
  | null;

type SiteSnapshot = {
  dashboard: DashboardSnapshot;
  featuredCard: SessionCardPayload | null;
};

type LearnPreviewItemResult = {
  itemId: string;
  introduced: boolean;
  sessionInjected: boolean;
  status: ReviewStatus;
};

type SubmitReviewResult = {
  nextDueAt: string;
  remainingCount: number;
  insights: SessionInsights;
  nextCard: SessionCardPayload | null;
  studyPlan?: StudyPlan;
};

type StoreRuntime = {
  getLearnerSettings: (userId: string) => LearnerSettings;
  getLanguageCatalog: () => DemoLanguage[];
  getAvailableAssumedWordLists: () => AssumedWordListOption[];
  updateLearnerSettings: (
    userId: string,
    updates: SettingsUpdate
  ) => { settings: LearnerSettings; dashboard: DashboardSnapshot };
  getStudyPlan: (
    userId: string,
    options?: {
      dailyGoal?: number;
      languageCodes?: SupportedLanguageCode[];
      mode?: StudyMode;
    }
  ) => StudyPlan;
  startSession: (
    userId: string,
    options?: {
      languageCodes?: SupportedLanguageCode[];
      mode?: StudyMode;
    }
  ) => StartSessionResult;
  resumeSession: (sessionId: string) => ResumeSessionResult;
  getNextCard: (sessionId: string) => SessionCardPayload | null;
  getDashboardSnapshot: (
    userId: string,
    options?: { languageCodes?: SupportedLanguageCode[] }
  ) => DashboardSnapshot;
  getSiteSnapshot: (userId: string) => SiteSnapshot;
  getRecentStudiedWords: (
    userId: string,
    languageCodes: SupportedLanguageCode[],
    limit?: number
  ) => RankedListEntry[];
  getLibrarySnapshot: (userId: string) => LibrarySnapshot;
  getListsSnapshot: (userId: string) => ListsSnapshot;
  getWordsSnapshot: (userId: string) => WordsSnapshot;
  getWordSnapshot: (userId: string, itemId: string) => WordDetailSnapshot | null;
  getItemById: (itemId: string) => SessionCardPayload | null;
  learnPreviewItem: (params: {
    userId: string;
    itemId: string;
    sessionId?: string | null;
  }) => LearnPreviewItemResult;
  submitReview: (params: {
    userId: string;
    sessionId: string;
    itemId: string;
    rating: 1 | 2 | 3 | 4;
    elapsedMs: number;
    sessionElapsedMs?: number;
    includeStudyPlan?: boolean;
    idempotencyKey?: string | null;
  }) => SubmitReviewResult;
  completeSession: (params: {
    userId: string;
    sessionId: string;
    elapsedMs: number;
  }) => { ok: true };
};

const runtimePath = path.join(process.cwd(), "src", "lib", "demo", "store.runtime.cjs");
const runtimeRequire = eval("require") as NodeRequire;

let cachedRuntime: StoreRuntime | null = null;
let cachedRuntimeMtimeMs = -1;

function loadRuntime(): StoreRuntime {
  if (process.env.NODE_ENV === "production") {
    if (!cachedRuntime) {
      cachedRuntime = runtimeRequire(runtimePath) as StoreRuntime;
    }

    return cachedRuntime;
  }

  const runtimeStat = fs.statSync(runtimePath);

  if (!cachedRuntime || runtimeStat.mtimeMs !== cachedRuntimeMtimeMs) {
    const resolvedRuntimePath = runtimeRequire.resolve(runtimePath);
    delete runtimeRequire.cache[resolvedRuntimePath];
    cachedRuntime = runtimeRequire(runtimePath) as StoreRuntime;
    cachedRuntimeMtimeMs = runtimeStat.mtimeMs;
  }

  return cachedRuntime;
}

export const getLearnerSettings: StoreRuntime["getLearnerSettings"] = (...args) => loadRuntime().getLearnerSettings(...args);
export const getLanguageCatalog: StoreRuntime["getLanguageCatalog"] = (...args) => loadRuntime().getLanguageCatalog(...args);
export const getAvailableAssumedWordLists: StoreRuntime["getAvailableAssumedWordLists"] = (...args) =>
  loadRuntime().getAvailableAssumedWordLists(...args);
export const updateLearnerSettings: StoreRuntime["updateLearnerSettings"] = (...args) =>
  loadRuntime().updateLearnerSettings(...args);
export const getStudyPlan: StoreRuntime["getStudyPlan"] = (...args) => loadRuntime().getStudyPlan(...args);
export const startSession: StoreRuntime["startSession"] = (...args) => loadRuntime().startSession(...args);
export const resumeSession: StoreRuntime["resumeSession"] = (...args) => loadRuntime().resumeSession(...args);
export const getNextCard: StoreRuntime["getNextCard"] = (...args) => loadRuntime().getNextCard(...args);
export const getDashboardSnapshot: StoreRuntime["getDashboardSnapshot"] = (...args) => loadRuntime().getDashboardSnapshot(...args);
export const getSiteSnapshot: StoreRuntime["getSiteSnapshot"] = (...args) => loadRuntime().getSiteSnapshot(...args);
export const getRecentStudiedWords: StoreRuntime["getRecentStudiedWords"] = (...args) =>
  loadRuntime().getRecentStudiedWords(...args);
export const getLibrarySnapshot: StoreRuntime["getLibrarySnapshot"] = (...args) => loadRuntime().getLibrarySnapshot(...args);
export const getListsSnapshot: StoreRuntime["getListsSnapshot"] = (...args) => loadRuntime().getListsSnapshot(...args);
export const getWordsSnapshot: StoreRuntime["getWordsSnapshot"] = (...args) => loadRuntime().getWordsSnapshot(...args);
export const getWordSnapshot: StoreRuntime["getWordSnapshot"] = (...args) => loadRuntime().getWordSnapshot(...args);
export const getItemById: StoreRuntime["getItemById"] = (...args) => loadRuntime().getItemById(...args);
export const learnPreviewItem: StoreRuntime["learnPreviewItem"] = (...args) => loadRuntime().learnPreviewItem(...args);
export const submitReview: StoreRuntime["submitReview"] = (...args) => loadRuntime().submitReview(...args);
export const completeSession: StoreRuntime["completeSession"] = (...args) => loadRuntime().completeSession(...args);
