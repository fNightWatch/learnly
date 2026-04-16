import Foundation

enum AppSection: String, CaseIterable, Identifiable {
  case home
  case dashboard
  case study
  case words

  var id: String { rawValue }

  var title: String {
    switch self {
    case .home:
      return "Home"
    case .dashboard:
      return "Dashboard"
    case .study:
      return "Study"
    case .words:
      return "Words"
    }
  }

  var icon: String {
    switch self {
    case .home:
      return "house"
    case .dashboard:
      return "rectangle.3.group"
    case .study:
      return "brain"
    case .words:
      return "text.book.closed"
    }
  }
}

@MainActor
final class AppViewModel: ObservableObject {
  @Published var selectedSection: AppSection = .home
  @Published var languages: [DemoLanguage] = []
  @Published var settings: LearnerSettings = .default
  @Published var dashboard: DashboardSnapshot?
  @Published var loadError: String?

  let repository: LearningRepository
  let audioProvider: AudioProvider
  let syncTransport: SyncTransport
  let studyVM: StudyViewModel
  let wordsVM: WordsViewModel

  init(repository: LearningRepository, audioProvider: AudioProvider, syncTransport: SyncTransport) {
    self.repository = repository
    self.audioProvider = audioProvider
    self.syncTransport = syncTransport

    self.studyVM = StudyViewModel(repository: repository, audioProvider: audioProvider)
    self.wordsVM = WordsViewModel(repository: repository)
  }

  func bootstrap() {
    do {
      loadError = nil
      self.languages = try repository.loadLanguages()
      self.settings = try repository.loadSettings(userID: demoUserID)
      self.dashboard = try repository.loadDashboard(userID: demoUserID, languageCodes: settings.dashboardLanguageCodes)

      studyVM.configure(settings: settings, languages: languages)
      wordsVM.configure(settings: settings, languages: languages)
      wordsVM.reload()

      if let resumed = try repository.resumeLatestSession(userID: demoUserID) {
        selectedSection = .study
        studyVM.restoreSession(resumed)
      }
    } catch {
      loadError = error.localizedDescription
    }
  }

  func refreshDashboard() {
    do {
      loadError = nil
      dashboard = try repository.loadDashboard(userID: demoUserID, languageCodes: settings.dashboardLanguageCodes)
    } catch {
      loadError = error.localizedDescription
    }
  }

  func persistSettings() {
    do {
      loadError = nil
      settings.updatedAt = Date()
      try repository.updateSettings(userID: demoUserID, settings: settings)
      studyVM.configure(settings: settings, languages: languages)
      wordsVM.configure(settings: settings, languages: languages)
      refreshDashboard()
    } catch {
      loadError = error.localizedDescription
    }
  }

  func startStudyFromAnywhere() {
    selectedSection = .study
  }

  func selectSection(_ section: AppSection) {
    selectedSection = section
    switch section {
    case .dashboard:
      refreshDashboard()
    case .words:
      wordsVM.reload()
    case .home, .study:
      break
    }
  }

  func toggleDashboardLanguage(_ code: LanguageCode) {
    var next = settings.dashboardLanguageCodes
    if let index = next.firstIndex(of: code) {
      next.remove(at: index)
    } else {
      next.append(code)
    }
    settings.dashboardLanguageCodes = next
    persistDashboardLanguageSelection()
  }

  func toggleAllDashboardLanguages() {
    let allCodes = languages.map(\.code)
    if settings.dashboardLanguageCodes.count == allCodes.count {
      settings.dashboardLanguageCodes = []
    } else {
      settings.dashboardLanguageCodes = allCodes
    }
    persistDashboardLanguageSelection()
  }

  func handleSessionProgress() {
    guard selectedSection != .study else { return }
    refreshDashboard()
  }

  func retryLoad() {
    if languages.isEmpty || dashboard == nil {
      bootstrap()
      return
    }
    refreshDashboard()
  }

  func clearLoadError() {
    loadError = nil
  }

  private func persistDashboardLanguageSelection() {
    do {
      loadError = nil
      settings.updatedAt = Date()
      try repository.updateSettings(userID: demoUserID, settings: settings)
      refreshDashboard()
    } catch {
      loadError = error.localizedDescription
    }
  }
}
