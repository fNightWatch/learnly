import Foundation

protocol LearningRepository {
  func loadLanguages() throws -> [DemoLanguage]
  func loadSettings(userID: String) throws -> LearnerSettings
  func updateSettings(userID: String, settings: LearnerSettings) throws

  func loadDashboard(userID: String, languageCodes: [LanguageCode]?) throws -> DashboardSnapshot

  func startSession(
    userID: String,
    languageCodes: [LanguageCode],
    mode: StudyMode
  ) throws -> StudySession
  func resumeLatestSession(userID: String) throws -> StudySession?

  func loadNextCard(sessionID: String, userID: String) throws -> SessionCardPayload?

  func submitReview(
    sessionID: String,
    userID: String,
    itemID: String,
    rating: Int,
    elapsedMs: Int
  ) throws -> SubmitReviewOutcome

  func loadSessionInsights(userID: String) throws -> SessionInsights

  func loadWords(userID: String, languageCodes: [LanguageCode], search: String) throws -> [WordRow]
  func loadWordDetail(userID: String, itemID: String) throws -> WordDetail?
}

protocol SchedulerEngine {
  /// Target parity with current FSRS envelope: retention 0.9, max interval 365,
  /// learning steps [1m, 10m], relearning [10m].
  func schedule(current: UserItemState, rating: Int, now: Date) -> ScheduledState
}

@MainActor protocol AudioProvider {
  func speakTerm(card: SessionCardPayload)
  func speakSentence(card: SessionCardPayload)
  func stop()
}

protocol SyncTransport {
  func pushPendingChanges() async throws
  func pullLatestChanges() async throws
}

struct NoopSyncTransport: SyncTransport {
  func pushPendingChanges() async throws {}
  func pullLatestChanges() async throws {}
}
