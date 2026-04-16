import Foundation

typealias LanguageCode = String

let demoUserID = "demo-user"

enum StudyMode: String, CaseIterable, Codable {
  case everyday = "everyday"
  case reviewOnly = "review-only"
  case newOnly = "new-only"

  var label: String {
    switch self {
    case .everyday:
      return "Everyday"
    case .reviewOnly:
      return "Review only"
    case .newOnly:
      return "New only"
    }
  }
}

enum ChineseReviewFlow: String, CaseIterable, Codable {
  case twoClick = "two-click"
  case fourClick = "four-click"

  var label: String {
    switch self {
    case .twoClick:
      return "2 click"
    case .fourClick:
      return "4 click"
    }
  }
}

enum ReviewStatus: String, Codable {
  case new
  case learning
  case review
  case relearning
}

struct DemoLanguage: Identifiable, Hashable {
  let code: LanguageCode
  let name: String
  let nativeName: String
  let descriptor: String
  let speakerLabel: String
  let audioVoice: String

  var id: String { code }
  var isChineseFamily: Bool { code.hasPrefix("zh") }
}

struct LearnerSettings: Codable {
  var dailyGoal: Int
  var selectedLanguageCodes: [LanguageCode]
  var dashboardLanguageCodes: [LanguageCode]
  var preferredStudyMode: StudyMode
  var chineseReviewFlow: ChineseReviewFlow
  var updatedAt: Date

  static let `default` = LearnerSettings(
    dailyGoal: 10,
    selectedLanguageCodes: ["es"],
    dashboardLanguageCodes: ["es"],
    preferredStudyMode: .everyday,
    chineseReviewFlow: .fourClick,
    updatedAt: Date()
  )
}

struct SessionCardPayload: Identifiable {
  let itemId: String
  let languageCode: LanguageCode
  let isNew: Bool
  let displayForm: String
  let lemma: String
  let primaryGloss: String
  let pos: String
  let rank: Int
  let example: String
  let translation: String
  let pronunciation: String?
  let secondaryGlosses: [String]
  let notes: String?
  let exampleIndex: Int

  var id: String { itemId }
  var isChineseFamily: Bool { languageCode.hasPrefix("zh") }
}

struct SessionInsights {
  let reviewsToday: Int
  let newWordsToday: Int
  let streakDays: Int
  let retentionScore: Int
  let dueByLanguage: [LanguageCode: Int]
}

struct StudySession {
  let id: String
  let dueCount: Int
  let newCount: Int
  let queueCount: Int
  let createdAt: Date

  var totalCards: Int { queueCount }
}

struct DashboardSnapshot {
  let availableLanguages: [DemoLanguage]
  let activeLanguageCodes: [LanguageCode]
  let preferredStudyMode: StudyMode
  let corpusSize: Int
  let dueCount: Int
  let newAvailableCount: Int
  let activeWords: Int
  let averageNewPerDay: Double
  let reviewsToday: Int
  let introducedToday: Int
  let totalReviews: Int
  let streakDays: Int
  let retentionScore: Int
  let reviewsDueSeries: [ReviewsDueDatum]
  let vocabularyGrowthSeries: [VocabularyGrowthDatum]
}

struct ReviewsDueDatum: Identifiable {
  let label: String
  let value: Int
  var id: String { label }
}

struct VocabularyGrowthDatum: Identifiable {
  let label: String
  let learning: Int
  let solid: Int
  let notIntroduced: Int
  var id: String { label }
}

struct WordRow: Identifiable {
  let itemId: String
  let languageCode: LanguageCode
  let displayForm: String
  let primaryGloss: String
  let example: String
  let translation: String
  let status: ReviewStatus
  let dueAt: Date
  let reps: Int
  let lapses: Int

  var id: String { itemId }
}

struct WordExample: Identifiable {
  let sentence: String
  let translation: String
  let sortOrder: Int

  var id: String { "\(sortOrder)-\(sentence)" }
}

struct WordDetail {
  let row: WordRow
  let lemma: String
  let notes: String?
  let pronunciation: String?
  let examples: [WordExample]
}

struct UserItemState {
  let userID: String
  let itemID: String
  let status: ReviewStatus
  let dueAt: Date
  let stability: Double
  let difficulty: Double
  let scheduledDays: Int
  let learningSteps: Int
  let lapses: Int
  let reps: Int
  let lastRating: Int?
  let introducedAt: Date
  let lastReviewedAt: Date?
}

struct ScheduledState {
  let status: ReviewStatus
  let dueAt: Date
  let stability: Double
  let difficulty: Double
  let scheduledDays: Int
  let learningSteps: Int
  let lapses: Int
  let reps: Int
  let lastRating: Int
  let introducedAt: Date
  let lastReviewedAt: Date
}

struct SubmitReviewOutcome {
  let nextCard: SessionCardPayload?
  let insights: SessionInsights
}
