export type SupportedLanguageCode = "es" | "fr" | "de" | "zh" | "zh-hsk1" | "zh-hsk2" | "zh-hsk3";
export type LexicalItemType = "lemma" | "phrase";
export type StudyMode = "everyday" | "review-only" | "new-only";
export type ChineseReviewFlow = "two-click" | "four-click";
export type DashboardRangeDays = 7 | 30;

export type DemoLanguage = {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  descriptor: string;
  speakerLabel: string;
  audioVoice: string;
  beta?: boolean;
};

export type DemoLexicalItem = {
  id: string;
  languageCode: SupportedLanguageCode;
  type: LexicalItemType;
  lemma: string;
  displayForm: string;
  primaryGloss: string;
  pos: string;
  rank: number;
  example: string;
  translation: string;
  pronunciation?: string;
  secondaryGlosses?: string[];
  notes?: string;
};

export type ReviewStatus = "new" | "learning" | "review" | "relearning";
export type ReviewRating = 1 | 2 | 3 | 4;

export type UserItemState = {
  userId: string;
  itemId: string;
  status: ReviewStatus;
  dueAt: string;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  lapses: number;
  reps: number;
  lastRating: number | null;
  introducedAt: string;
  lastReviewedAt: string | null;
};

export type LearnerSettings = {
  dailyGoal: number;
  selectedLanguageCodes: SupportedLanguageCode[];
  dashboardLanguageCodes: SupportedLanguageCode[];
  dashboardRangeDays: DashboardRangeDays;
  preferredStudyMode: StudyMode;
  chineseReviewFlow: ChineseReviewFlow;
  updatedAt: string;
};

export type RatingPreview = {
  rating: ReviewRating;
  label: string;
  status: ReviewStatus;
  intervalLabel: string;
  dueAt: string;
};

export type FocusItemInsight = {
  itemId: string;
  displayForm: string;
  primaryGloss: string;
  reason: string;
};

export type StudyPlan = {
  dueNow: number;
  newCards: number;
  totalCards: number;
  estimatedMinutes: number;
  tomorrowDueEstimate: number;
  nextReviewWindowLabel: string;
};

export type ReviewsDueDatum = {
  label: string;
  shortLabel: string;
  value: number;
};

export type VocabularyGrowthDatum = {
  label: string;
  shortLabel: string;
  learning: number;
  solid: number;
  notIntroduced: number;
};

export type StudyConsistencyDatum = {
  label: string;
  shortLabel: string;
  active: boolean;
  isToday: boolean;
};

export type RankedListEntry = {
  itemId: string;
  languageCode: SupportedLanguageCode;
  displayForm: string;
  primaryGloss: string;
  pos: string;
  rank: number;
  example: string;
  translation: string;
  status: ReviewStatus | "not-introduced";
  nextDueLabel: string;
  reps: number;
  lapses: number;
  retrievabilityPercent: number | null;
  isFocus: boolean;
  listTitles: string[];
};

export type LibrarySnapshot = {
  coveragePercent: number;
  dailyGoal: number;
  focusItem: FocusItemInsight | null;
  items: RankedListEntry[];
};

export type CuratedListSnapshot = {
  id: string;
  title: string;
  description: string;
  totalItems: number;
  introducedItems: number;
  dueNow: number;
  completionPercent: number;
  items: RankedListEntry[];
};

export type ListsSnapshot = {
  dailyGoal: number;
  reviewDueCount: number;
  trackedWordCount: number;
  focusItem: FocusItemInsight | null;
  lists: CuratedListSnapshot[];
};

export type WordsSection = {
  id: string;
  title: string;
  description: string;
  items: RankedListEntry[];
};

export type WordsSnapshot = {
  dailyGoal: number;
  availableLanguages: DemoLanguage[];
  activeLanguageCodes: SupportedLanguageCode[];
  preferredStudyMode: StudyMode;
  focusItem: FocusItemInsight | null;
  studyPlan: StudyPlan;
  sections: WordsSection[];
};

export type SentenceTokenSense = {
  itemId: string;
  languageCode: SupportedLanguageCode;
  pronunciation?: string;
  primaryGloss: string;
  glosses: string[];
  notes?: string;
};

export type SentenceTokenPreview = {
  text: string;
  matched: boolean;
  pronunciation?: string;
  senses?: SentenceTokenSense[];
  learnItemId?: string;
  alreadyLearning?: boolean;
};

export type WordDetailSnapshot = {
  item: RankedListEntry;
  lemma: string;
  notes?: string;
  studyReason: string;
  introducedAt: string | null;
  lastReviewedAt: string | null;
  reps: number;
  lapses: number;
  scheduledDays: number;
  learningSteps: number;
  retrievabilityPercent: number | null;
  ratingPreviews: RatingPreview[];
  relatedWords: RankedListEntry[];
  examples: { sentence: string; translation: string; tokens?: SentenceTokenPreview[] }[];
};

export type ReviewEvent = {
  id: string;
  userId: string;
  itemId: string;
  rating: number;
  elapsedMs: number;
  reviewedAt: string;
  mode: "recall";
  stateBefore: ReviewStatus | "none";
  stateAfter: ReviewStatus;
};

export type DemoSession = {
  id: string;
  userId: string;
  mode: StudyMode;
  languageCodes: SupportedLanguageCode[];
  queue: string[];
  dueCount: number;
  newCount: number;
  createdAt: string;
};

export type DashboardSnapshot = {
  availableLanguages: DemoLanguage[];
  activeLanguageCodes: SupportedLanguageCode[];
  dashboardRangeDays: DashboardRangeDays;
  preferredStudyMode: StudyMode;
  corpusSize: number;
  exampleCoveragePercent: number;
  audioCoveragePercent: number;
  dueCount: number;
  newAvailableCount: number;
  activeWords: number;
  coveragePercent: number;
  dailyGoal: number;
  reviewsToday: number;
  introducedToday: number;
  averageNewPerDay: number;
  totalReviews: number;
  streakDays: number;
  retentionScore: number;
  nextDueLabel: string;
  focusItem: FocusItemInsight | null;
  studyPlan: StudyPlan;
  reviewsDueSeries: ReviewsDueDatum[];
  vocabularyGrowthSeries: VocabularyGrowthDatum[];
  consistencySeries: StudyConsistencyDatum[];
};

export type SessionInsights = {
  reviewsToday: number;
  newWordsToday: number;
  streakDays: number;
  retentionScore: number;
  dueByLanguage: Record<string, number>;
};

export type SessionCardPayload = {
  itemId: string;
  languageCode: SupportedLanguageCode;
  isNew: boolean;
  displayForm: string;
  lemma: string;
  primaryGloss: string;
  pos: string;
  rank: number;
  example: string;
  translation: string;
  pronunciation?: string;
  secondaryGlosses?: string[];
  notes?: string;
  ratingPreviews: RatingPreview[];
  exampleIndex?: number;
  exampleTokens?: SentenceTokenPreview[];
};
