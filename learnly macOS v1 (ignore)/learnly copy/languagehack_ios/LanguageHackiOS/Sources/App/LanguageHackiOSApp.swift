import SwiftUI

@main
@available(iOS 26.0, *)
struct LanguageHackiOSApp: App {
  @StateObject private var viewModel: AppViewModel
  @AppStorage("languagehack.ios.theme") private var themePreference = "system"

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
    WindowGroup {
      RootShellView(model: viewModel)
        .preferredColorScheme(preferredColorScheme)
    }
  }

  private var preferredColorScheme: ColorScheme? {
    switch themePreference.lowercased() {
    case "light":
      return .light
    case "dark":
      return .dark
    default:
      return nil
    }
  }
}
