import AppKit
import Foundation

enum StudyStage: String {
  case simpleGuess
  case simpleConfirm
  case pronunciationGuess
  case pronunciationConfirm
  case definitionGuess
  case definitionConfirm
  case recovery
}

enum StudyTimeMode: String, CaseIterable {
  case timer
  case stopwatch

  var label: String {
    switch self {
    case .timer:
      return "Timer"
    case .stopwatch:
      return "Stopwatch"
    }
  }
}

@MainActor
final class StudyViewModel: ObservableObject {
  @Published var languages: [DemoLanguage] = []
  @Published var selectedLanguageCodes: Set<LanguageCode> = ["es"]
  @Published var studyMode: StudyMode = .everyday
  @Published var chineseReviewFlow: ChineseReviewFlow = .fourClick
  @Published var timeMode: StudyTimeMode = .timer
  @Published var timerMinutes: Double = 1

  @Published var activeSession: StudySession?
  @Published var card: SessionCardPayload?
  @Published var stage: StudyStage = .simpleGuess
  @Published var errorText: String?
  @Published var showPauseOverlay = false
  @Published var isBusy = false

  @Published var reviewedInSession = 0
  @Published var sessionStartAt: Date?
  @Published var insights: SessionInsights?

  @Published var showingTranslation = false
  @Published var showingPronunciation = false
  @Published var isSentenceTranslationRevealed = false

  var isShowingCompletionStats: Bool {
    activeSession != nil && card == nil
  }

  private let repository: LearningRepository
  private let audioProvider: AudioProvider
  private let repositoryQueue = DispatchQueue(label: "languagehack.study.repository", qos: .userInitiated)
  private var keyboardMonitor: Any?

  private var pronunciationConfirmed = false
  private var pauseStartedAt: Date?
  private var accumulatedPausedSeconds: TimeInterval = 0
  private var pausedElapsedSnapshotSeconds: Int?
  private var completedElapsedSnapshotSeconds: Int?

  init(repository: LearningRepository, audioProvider: AudioProvider) {
    self.repository = repository
    self.audioProvider = audioProvider
  }


  func configure(settings: LearnerSettings, languages: [DemoLanguage]) {
    self.languages = languages
    self.selectedLanguageCodes = Set(settings.selectedLanguageCodes)
    if self.selectedLanguageCodes.isEmpty { self.selectedLanguageCodes = ["es"] }
    self.studyMode = settings.preferredStudyMode
    self.chineseReviewFlow = settings.chineseReviewFlow
  }

  func installKeyboardMonitor() {
    guard keyboardMonitor == nil else { return }

    keyboardMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
      guard let self else { return event }

      if self.handleKeyDown(event) {
        return nil
      }
      return event
    }
  }

  func uninstallKeyboardMonitor() {
    guard let keyboardMonitor else { return }
    NSEvent.removeMonitor(keyboardMonitor)
    self.keyboardMonitor = nil
  }

  func startSessionIfNeeded() {
    if !isBusy, (activeSession == nil || card == nil) {
      startSession()
    }
  }

  func startSession() {
    guard !isBusy else { return }
    isBusy = true
    do {
      let selected = Array(selectedLanguageCodes)
      let started = try repository.startSession(
        userID: demoUserID,
        languageCodes: selected,
        mode: studyMode
      )
      activeSession = started
      reviewedInSession = 0
      sessionStartAt = Date()
      insights = nil
      showPauseOverlay = false
      pauseStartedAt = nil
      accumulatedPausedSeconds = 0
      pausedElapsedSnapshotSeconds = nil
      completedElapsedSnapshotSeconds = nil
      isSentenceTranslationRevealed = false
      try loadNextCard()
      isBusy = false
    } catch {
      errorText = error.localizedDescription
      isBusy = false
    }
  }

  func restoreSession(_ session: StudySession) {
    activeSession = session
    reviewedInSession = 0
    sessionStartAt = session.createdAt
    insights = nil
    showPauseOverlay = false
    pauseStartedAt = nil
    accumulatedPausedSeconds = 0
    pausedElapsedSnapshotSeconds = nil
    completedElapsedSnapshotSeconds = nil
    isSentenceTranslationRevealed = false

    do {
      try loadNextCard()
    } catch {
      errorText = error.localizedDescription
    }
  }

  func endSession() {
    guard activeSession != nil else { return }

    if card == nil {
      clearSessionState()
      return
    }

    finishSessionAndShowCompletion()
  }

  func loadNextCard() throws {
    guard let sessionID = activeSession?.id else {
      card = nil
      return
    }

    if let next = try repository.loadNextCard(sessionID: sessionID, userID: demoUserID) {
      card = next
      showingTranslation = false
      showingPronunciation = false
      isSentenceTranslationRevealed = false
      pronunciationConfirmed = false
      stage = resolveInitialStage(for: next)
    } else {
      card = nil
    }
  }

  func handlePrimaryAction() {
    guard let currentCard = card, !showPauseOverlay, !isBusy else { return }

    switch stage {
    case .simpleGuess:
      stage = .simpleConfirm
      showingTranslation = true
      showingPronunciation = true
      isSentenceTranslationRevealed = false
    case .simpleConfirm:
      submitKnown()
    case .pronunciationGuess:
      stage = .pronunciationConfirm
      showingPronunciation = true
      audioProvider.speakTerm(card: currentCard)
    case .pronunciationConfirm:
      pronunciationConfirmed = true
      stage = .definitionGuess
      showingTranslation = false
      isSentenceTranslationRevealed = false
    case .definitionGuess:
      stage = .definitionConfirm
      showingTranslation = true
      isSentenceTranslationRevealed = false
    case .definitionConfirm:
      submitKnown()
    case .recovery:
      submitDontKnow()
    }
  }

  func handleSecondaryAction() {
    guard card != nil, !showPauseOverlay, !isBusy else { return }
    enterRecovery()
  }

  func submitKnown() {
    submitRating(3)
  }

  func submitDontKnow() {
    submitRating(1)
  }

  func enterRecovery() {
    stage = .recovery
    showingTranslation = true
    showingPronunciation = true
    isSentenceTranslationRevealed = false
  }

  func playTermAudio() {
    guard let card else { return }
    audioProvider.speakTerm(card: card)
  }

  func playSentenceAudio() {
    guard let card else { return }
    audioProvider.speakSentence(card: card)
  }

  func revealSentenceTranslation() {
    guard showingTranslation else { return }
    isSentenceTranslationRevealed = true
  }

  func togglePause() {
    guard activeSession != nil else { return }

    if showPauseOverlay {
      if let pauseStartedAt {
        accumulatedPausedSeconds += Date().timeIntervalSince(pauseStartedAt)
      }
      self.pauseStartedAt = nil
      pausedElapsedSnapshotSeconds = nil
      showPauseOverlay = false
      return
    }

    pausedElapsedSnapshotSeconds = elapsedSeconds()
    pauseStartedAt = Date()
    showPauseOverlay = true
  }

  func elapsedSeconds() -> Int {
    if let completedElapsedSnapshotSeconds {
      return completedElapsedSnapshotSeconds
    }

    if showPauseOverlay, let pausedElapsedSnapshotSeconds {
      return pausedElapsedSnapshotSeconds
    }

    guard let start = sessionStartAt else { return 0 }

    let activePauseSeconds: TimeInterval
    if let pauseStartedAt {
      activePauseSeconds = Date().timeIntervalSince(pauseStartedAt)
    } else {
      activePauseSeconds = 0
    }

    let elapsed = Date().timeIntervalSince(start) - accumulatedPausedSeconds - activePauseSeconds
    return max(0, Int(elapsed))
  }

  func displayedClockSeconds() -> Int {
    switch timeMode {
    case .timer:
      return max(0, timerDurationSeconds - elapsedSeconds())
    case .stopwatch:
      return elapsedSeconds()
    }
  }

  func isTimerInFinalMinute() -> Bool {
    timeMode == .timer && displayedClockSeconds() < 60
  }

  func clearError() {
    errorText = nil
  }

  func retryLastAction() {
    errorText = nil

    if activeSession == nil || card == nil {
      startSessionIfNeeded()
      return
    }
  }

  private func submitRating(_ rating: Int) {
    guard let card, let activeSession, !showPauseOverlay, !isBusy else { return }

    let elapsedMs = elapsedSeconds() * 1000
    let shouldAutoCompleteAfterThisReview = shouldCompleteSessionAfterCurrentReview()
    let sessionID = activeSession.id
    let itemID = card.itemId
    let repository = self.repository

    isBusy = true
    errorText = nil

    repositoryQueue.async { [weak self] in
      do {
        let outcome = try repository.submitReview(
          sessionID: sessionID,
          userID: demoUserID,
          itemID: itemID,
          rating: rating,
          elapsedMs: elapsedMs
        )

        DispatchQueue.main.async { [weak self] in
          guard let self else { return }

          self.reviewedInSession += 1
          let elapsedSnapshotSeconds = self.elapsedSeconds()
          if shouldAutoCompleteAfterThisReview {
            self.enterCompletion(insights: outcome.insights, elapsedSnapshotSeconds: elapsedSnapshotSeconds)
          } else {
            self.card = outcome.nextCard

            if let next = outcome.nextCard {
              self.completedElapsedSnapshotSeconds = nil
              self.showingTranslation = false
              self.showingPronunciation = false
              self.isSentenceTranslationRevealed = false
              self.pronunciationConfirmed = false
              self.stage = self.resolveInitialStage(for: next)
            } else {
              self.enterCompletion(insights: outcome.insights, elapsedSnapshotSeconds: elapsedSnapshotSeconds)
            }
          }

          self.isBusy = false
        }
      } catch {
        DispatchQueue.main.async { [weak self] in
          guard let self else { return }
          self.errorText = error.localizedDescription
          self.isBusy = false
        }
      }
    }
  }

  private func resolveInitialStage(for card: SessionCardPayload) -> StudyStage {
    if card.isChineseFamily && chineseReviewFlow == .fourClick {
      return .pronunciationGuess
    }
    return .simpleGuess
  }

  private var timerDurationSeconds: Int {
    max(60, Int(timerMinutes.rounded()) * 60)
  }

  private func shouldCompleteSessionAfterCurrentReview() -> Bool {
    timeMode == .timer && elapsedSeconds() >= timerDurationSeconds
  }

  private func enterCompletion(insights: SessionInsights, elapsedSnapshotSeconds: Int) {
    completedElapsedSnapshotSeconds = elapsedSnapshotSeconds
    card = nil
    stage = .simpleGuess
    showingTranslation = false
    showingPronunciation = false
    isSentenceTranslationRevealed = false
    pronunciationConfirmed = false
    showPauseOverlay = false
    pauseStartedAt = nil
    pausedElapsedSnapshotSeconds = nil
    self.insights = insights
  }

  private func finishSessionAndShowCompletion() {
    guard activeSession != nil, card != nil, !isBusy else { return }

    isBusy = true
    errorText = nil

    let repository = self.repository
    let elapsedSnapshotSeconds = elapsedSeconds()

    repositoryQueue.async { [weak self] in
      do {
        let insights = try repository.loadSessionInsights(userID: demoUserID)
        DispatchQueue.main.async { [weak self] in
          guard let self else { return }
          self.enterCompletion(insights: insights, elapsedSnapshotSeconds: elapsedSnapshotSeconds)
          self.isBusy = false
        }
      } catch {
        DispatchQueue.main.async { [weak self] in
          guard let self else { return }
          self.enterCompletion(
            insights: self.insights ?? SessionInsights(
              reviewsToday: 0,
              newWordsToday: 0,
              streakDays: 0,
              retentionScore: 0,
              dueByLanguage: [:]
            ),
            elapsedSnapshotSeconds: elapsedSnapshotSeconds
          )
          self.errorText = error.localizedDescription
          self.isBusy = false
        }
      }
    }
  }

  private func clearSessionState() {
    activeSession = nil
    card = nil
    stage = .simpleGuess
    sessionStartAt = nil
    reviewedInSession = 0
    showPauseOverlay = false
    pauseStartedAt = nil
    accumulatedPausedSeconds = 0
    pausedElapsedSnapshotSeconds = nil
    completedElapsedSnapshotSeconds = nil
    isSentenceTranslationRevealed = false
    insights = nil
    showingTranslation = false
    showingPronunciation = false
    pronunciationConfirmed = false
  }

  private func handleKeyDown(_ event: NSEvent) -> Bool {
    guard activeSession != nil else { return false }

    if event.keyCode == 35 { // P
      togglePause()
      return true
    }

    guard !showPauseOverlay, card != nil else { return false }

    switch event.keyCode {
    case 126: // Up
      playTermAudio()
      return true
    case 125: // Down
      playSentenceAudio()
      return true
    case 124: // Right
      if stage == .recovery {
        submitDontKnow()
      } else {
        handlePrimaryAction()
      }
      return true
    case 123: // Left
      handleSecondaryAction()
      return true
    case 56, 60: // Shift
      guard showingTranslation else { return false }
      revealSentenceTranslation()
      return true
    default:
      return false
    }
  }
}
