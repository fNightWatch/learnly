import SwiftUI

@main
struct LanguageHackMacApp: App {
  @StateObject private var viewModel: AppViewModel

  init() {
    let scheduler = AdaptiveSchedulerEngine()
    let repository: LearningRepository

    do {
      repository = try SQLiteLearningRepository(scheduler: scheduler)
    } catch {
      fatalError("Failed to initialize repository: \(error.localizedDescription)")
    }

    let audioProvider = HybridAudioProvider()
    let syncTransport = NoopSyncTransport()

    _viewModel = StateObject(
      wrappedValue: AppViewModel(
        repository: repository,
        audioProvider: audioProvider,
        syncTransport: syncTransport
      )
    )
  }

  var body: some Scene {
    WindowGroup("LanguageHack") {
      RootShellView(model: viewModel)
        .frame(minWidth: 1100, minHeight: 760)
    }
    .windowResizability(.contentSize)

    Settings {
      SettingsSheet(model: viewModel)
    }
  }
}
