import Foundation

@MainActor
final class WordsViewModel: ObservableObject {
  @Published var settings: LearnerSettings = .default
  @Published var languages: [DemoLanguage] = []
  @Published var rows: [WordRow] = []
  @Published var selectedWordID: String?
  @Published var detail: WordDetail?
  @Published var searchText = ""
  @Published var loadError: String?

  private let repository: LearningRepository

  init(repository: LearningRepository) {
    self.repository = repository
  }

  func configure(settings: LearnerSettings, languages: [DemoLanguage]) {
    self.settings = settings
    self.languages = languages
  }

  func reload() {
    do {
      loadError = nil
      let words = try repository.loadWords(
        userID: demoUserID,
        languageCodes: settings.selectedLanguageCodes,
        search: searchText
      )
      rows = words

      if selectedWordID == nil {
        selectedWordID = rows.first?.itemId
      }

      try reloadDetail()
    } catch {
      loadError = error.localizedDescription
    }
  }

  func reloadDetail() throws {
    guard let selectedWordID else {
      detail = nil
      return
    }
    detail = try repository.loadWordDetail(userID: demoUserID, itemID: selectedWordID)
  }

  func onSearchChanged() {
    reload()
  }

  func selectWord(_ id: String) {
    selectedWordID = id
    do {
      loadError = nil
      try reloadDetail()
    } catch {
      loadError = error.localizedDescription
    }
  }

  func clearError() {
    loadError = nil
  }
}
