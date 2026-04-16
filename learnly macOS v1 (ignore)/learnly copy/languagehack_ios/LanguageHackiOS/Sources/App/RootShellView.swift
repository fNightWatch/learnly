import SwiftUI

@available(iOS 26.0, *)
struct RootShellView: View {
  @StateObject var model: AppViewModel
  @State private var showsSettings = false
  @AppStorage("languagehack.ios.theme") private var themePreference = "system"
  @Environment(\.colorScheme) private var colorScheme

  private var shouldShowHeaderStudyCTA: Bool {
    model.selectedSection != .study
  }

  var body: some View {
    GeometryReader { proxy in
      let metrics = ShellAdaptiveMetrics(size: proxy.size)

      ZStack {
        GradientBackdrop(section: model.selectedSection)

        VStack(spacing: metrics.stackSpacing) {
          webParityHeader(metrics)
            .padding(.top, metrics.headerTopPadding)

          pageContent(metrics)
        }
        .frame(maxWidth: metrics.contentMaxWidth)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.horizontal, metrics.horizontalPadding)
        .padding(.bottom, metrics.bottomPadding)

        if let error = model.loadError {
          VStack {
            ErrorBanner(message: error) {
              model.retryLoad()
            } onDismiss: {
              model.clearLoadError()
            }
            .padding(.top, 14)
            .padding(.horizontal, 20)

            Spacer()
          }
        }
      }
    }
    .preferredColorScheme(preferredColorScheme)
    .sheet(isPresented: $showsSettings) {
      SettingsSheet(model: model)
    }
    .task {
      model.bootstrap()
    }
    .onChange(of: model.studyVM.reviewedInSession) { _, _ in
      model.handleSessionProgress()
    }
  }

  private func webParityHeader(_ metrics: ShellAdaptiveMetrics) -> some View {
    Group {
      if metrics.useWideHeader {
        HStack(spacing: metrics.wideClusterSpacing) {
          Button {
            model.selectSection(.home)
          } label: {
            Text("LanguageHack")
              .font(.system(size: metrics.brandFontSize, weight: .medium, design: .rounded))
              .kerning(-0.7)
              .glassTextPrimary()
          }
          .buttonStyle(.plain)

          Spacer(minLength: 8)

          wideCenterNav(metrics)

          Spacer(minLength: 8)

          HStack(spacing: 12) {
            headerIconButtons(metrics)
            if shouldShowHeaderStudyCTA {
              startStudyHeaderButton(compact: false, metrics: metrics)
            }
          }
        }
      } else {
        VStack(alignment: .leading, spacing: metrics.headerInnerSpacing) {
          ViewThatFits(in: .horizontal) {
            HStack {
              Text("LanguageHack")
                .font(.system(size: metrics.brandFontSize, weight: .medium, design: .rounded))
                .kerning(-0.7)
                .glassTextPrimary()

              Spacer()

              headerIconButtons(metrics)
            }

            VStack(alignment: .leading, spacing: 8) {
              Text("LanguageHack")
                .font(.system(size: metrics.brandFontSize, weight: .medium, design: .rounded))
                .kerning(-0.7)
                .glassTextPrimary()

              HStack {
                Spacer()
                headerIconButtons(metrics)
              }
            }
          }

          ViewThatFits(in: .horizontal) {
            HStack(alignment: .center, spacing: metrics.navSpacing) {
              compactNavRow(metrics)
              if shouldShowHeaderStudyCTA {
                startStudyHeaderButton(compact: true, metrics: metrics)
              }
            }

            VStack(alignment: .leading, spacing: metrics.navSpacing) {
              compactNavRow(metrics)
              if shouldShowHeaderStudyCTA {
                HStack {
                  Spacer(minLength: 0)
                  startStudyHeaderButton(compact: true, metrics: metrics)
                }
              }
            }
          }
        }
      }
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: metrics.headerCornerRadius,
      tint: .white.opacity(0.03),
      padding: metrics.headerPadding
    )
  }

  private func compactNavRow(_ metrics: ShellAdaptiveMetrics) -> some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack(spacing: metrics.navSpacing) {
        navPill(for: .home, title: "Home", metrics: metrics)
        navPill(for: .dashboard, title: "Dashboard", metrics: metrics)
        navPill(for: .words, title: "Words", metrics: metrics)
      }
      .padding(.horizontal, 1)
    }
    .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
  }

  private func wideCenterNav(_ metrics: ShellAdaptiveMetrics) -> some View {
    HStack(spacing: 6) {
      wideNavLabel(for: .dashboard, title: "Dashboard", metrics: metrics)
      wideNavLabel(for: .words, title: "Words", metrics: metrics)
    }
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .readableSurface(
      tier: .none,
      role: .control,
      cornerRadius: 999,
      tint: .clear,
      padding: 0
    )
    .frame(minWidth: metrics.wideNavMinWidth)
  }

  private func wideNavLabel(for section: AppSection, title: String, metrics: ShellAdaptiveMetrics) -> some View {
    let selected = model.selectedSection == section
    let baseFill = colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.68) : Color.white.opacity(0.62)
    let baseStroke = (colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(colorScheme == .dark ? 0.52 : 0.72)
    let selectedText = colorScheme == .dark ? Color.black : Color.white

    return Button {
      model.selectSection(section)
    } label: {
      Text(title)
        .font(.system(size: metrics.navFontSize, weight: selected ? .semibold : .medium, design: .rounded))
        .foregroundStyle(selected ? selectedText : Color.glassTextPrimary)
        .frame(minWidth: metrics.navMinWidth)
        .padding(.vertical, 8)
        .padding(.horizontal, 16)
        .background(
          Capsule(style: .continuous)
            .fill(selected ? WebParityPalette.accent : baseFill)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(selected ? WebParityPalette.accent.opacity(0.98) : baseStroke, lineWidth: selected ? 1.2 : 1)
            )
        )
    }
    .contentShape(Capsule(style: .continuous))
    .buttonStyle(.plain)
  }

  private func startStudyHeaderButton(compact: Bool, metrics: ShellAdaptiveMetrics) -> some View {
    Button {
      if model.selectedSection == .study, model.studyVM.isShowingCompletionStats {
        model.studyVM.endSession()
      }
      model.startStudyFromAnywhere()
    } label: {
      Text(model.selectedSection == .study && model.studyVM.isShowingCompletionStats ? "New session" : "Start Study")
    }
    .studyActionProminent(tint: WebParityPalette.accent)
    .contentShape(Capsule(style: .continuous))
    .frame(minWidth: compact ? metrics.compactStudyButtonMinWidth : 206)
  }

  @ViewBuilder
  private func headerIconButtons(_ metrics: ShellAdaptiveMetrics) -> some View {
    Button {
      showsSettings = true
    } label: {
      Image(systemName: "gearshape")
        .font(.system(size: metrics.settingsIconFont, weight: .semibold))
    }
    .buttonStyle(.plain)
    .frame(width: metrics.headerIconSize, height: metrics.headerIconSize)
    .contentShape(Circle())
    .readableSurface(
      tier: .interactive,
      role: .control,
      cornerRadius: 999,
      tint: .clear,
      padding: 0
    )

    Button {
      toggleTheme()
    } label: {
      Image(systemName: themeIcon)
        .font(.system(size: metrics.themeIconFont, weight: .semibold))
    }
    .buttonStyle(.plain)
    .frame(width: metrics.headerIconSize, height: metrics.headerIconSize)
    .contentShape(Circle())
    .readableSurface(
      tier: .interactive,
      role: .control,
      cornerRadius: 999,
      tint: .clear,
      padding: 0
    )
  }

  private func navPill(for section: AppSection, title: String, metrics: ShellAdaptiveMetrics) -> some View {
    let selected = model.selectedSection == section
    let baseFill = colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.72) : Color.white.opacity(0.64)
    let baseStroke = (colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(colorScheme == .dark ? 0.54 : 0.74)
    let selectedText = colorScheme == .dark ? Color.black : Color.white

    return Button {
      model.selectSection(section)
    } label: {
      Text(title)
        .font(.system(size: metrics.navFontSize, weight: selected ? .semibold : .medium, design: .rounded))
        .foregroundStyle(selected ? selectedText : Color.glassTextPrimary)
        .frame(minWidth: metrics.navMinWidth)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .background(
          Capsule(style: .continuous)
            .fill(selected ? WebParityPalette.accent : baseFill)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(selected ? WebParityPalette.accent.opacity(0.98) : baseStroke, lineWidth: selected ? 1.2 : 1)
            )
        )
    }
    .buttonStyle(.plain)
    .contentShape(Capsule(style: .continuous))
  }

  @ViewBuilder
  private func pageContent(_ metrics: ShellAdaptiveMetrics) -> some View {
    switch model.selectedSection {
    case .home:
      HomeView(dashboard: model.dashboard) {
        model.startStudyFromAnywhere()
      }

    case .dashboard:
      DashboardView(
        snapshot: model.dashboard,
        onRefresh: { model.refreshDashboard() },
        onToggleLanguage: { code in
          model.toggleDashboardLanguage(code)
        },
        onToggleAllLanguages: {
          model.toggleAllDashboardLanguages()
        }
      )

    case .words:
      WordsView(model: model.wordsVM)

    case .study:
      StudyView(model: model.studyVM, onProgress: {
        model.handleSessionProgress()
      }, onOpenSettings: {
        showsSettings = true
      })
      .frame(maxWidth: metrics.isNarrow ? .infinity : LayoutTokens.maxReadingWidth)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(.horizontal, metrics.isNarrow ? 0 : 2)
    }
  }

  private var preferredColorScheme: ColorScheme? {
    switch themePreference {
    case "light":
      return .light
    case "dark":
      return .dark
    default:
      return nil
    }
  }

  private var themeIcon: String {
    switch themePreference {
    case "dark":
      return "sun.max"
    case "light":
      return "moon"
    default:
      return "circle.lefthalf.filled"
    }
  }

  private func toggleTheme() {
    switch themePreference {
    case "system":
      themePreference = "dark"
    case "dark":
      themePreference = "light"
    case "light":
      themePreference = "system"
    default:
      themePreference = "system"
    }
  }
}

@available(iOS 26.0, *)
private struct ShellAdaptiveMetrics {
  let size: CGSize

  var useWideHeader: Bool { size.width >= 1120 }
  var isNarrow: Bool { size.width < 980 }
  var isVeryNarrow: Bool { size.width < 760 }
  var isShort: Bool { size.height < 760 }

  var horizontalPadding: CGFloat { isVeryNarrow ? 12 : LayoutTokens.pageHorizontal }
  var bottomPadding: CGFloat { isShort ? 10 : 16 }
  var headerTopPadding: CGFloat { isShort ? 8 : LayoutTokens.headerTop }
  var stackSpacing: CGFloat { isShort ? 10 : 12 }
  var contentMaxWidth: CGFloat { min(LayoutTokens.maxPageWidth, max(680, size.width - horizontalPadding * 2)) }

  var headerPadding: CGFloat { isVeryNarrow ? 12 : 16 }
  var headerCornerRadius: CGFloat { isVeryNarrow ? 26 : 34 }
  var headerInnerSpacing: CGFloat { isVeryNarrow ? 7 : 9 }

  var brandFontSize: CGFloat { isVeryNarrow ? 26 : (isNarrow ? 30 : 56 * 0.58) }
  var headerIconSize: CGFloat { isVeryNarrow ? 50 : 62 }
  var settingsIconFont: CGFloat { isVeryNarrow ? 16 : 18 }
  var themeIconFont: CGFloat { isVeryNarrow ? 18 : 20 }

  var navSpacing: CGFloat { isVeryNarrow ? 8 : 10 }
  var navFontSize: CGFloat { isVeryNarrow ? 14 : 16 }
  var navMinWidth: CGFloat { isVeryNarrow ? 84 : 96 }
  var navPillPadding: CGFloat { isVeryNarrow ? 8 : 10 }
  var wideNavMinWidth: CGFloat { size.width >= 1560 ? 380 : 340 }
  var wideClusterSpacing: CGFloat { size.width >= 1560 ? 28 : 18 }
  var compactStudyButtonMinWidth: CGFloat { isVeryNarrow ? 178 : 236 }
}

@available(iOS 26.0, *)
struct SettingsSheet: View {
  @ObservedObject var model: AppViewModel
  @Environment(\.dismiss) private var dismiss
  @Environment(\.colorScheme) private var colorScheme

  private let languageColumns = [
    GridItem(.adaptive(minimum: 190), spacing: 10, alignment: .leading)
  ]

  var body: some View {
    NavigationStack {
      ZStack {
        GradientBackdrop(section: model.selectedSection)

        ScrollView {
          VStack(alignment: .leading, spacing: 14) {
            headerSection
            dailyGoalSection
            preferredModeSection
            chineseFlowSection
            studyLanguagesSection
            footerActions
          }
          .frame(maxWidth: 720, alignment: .leading)
          .padding(.horizontal, 24)
          .padding(.vertical, 20)
        }
      }
    }
    .frame(minWidth: 660, minHeight: 560)
  }

  private var headerSection: some View {
    VStack(alignment: .leading, spacing: 5) {
      Text("Settings")
        .font(.system(size: 38, weight: .semibold, design: .rounded))
        .kerning(-0.4)
        .glassTextPrimary()
      Text("Tune study behavior and language scope.")
        .font(.system(size: 15, weight: .medium, design: .rounded))
        .glassTextSecondary()
    }
    .padding(.bottom, 2)
  }

  private var dailyGoalSection: some View {
    sectionShell(
      title: "Daily new words",
      subtitle: "How many new cards to introduce each day."
    ) {
      HStack(spacing: 12) {
        stepButton(systemName: "minus", disabled: model.settings.dailyGoal <= 1) {
          adjustDailyGoal(by: -1)
        }

        Text("\(model.settings.dailyGoal)")
          .font(.system(size: 22, weight: .semibold, design: .rounded))
          .frame(minWidth: 56)
          .glassTextPrimary()

        stepButton(systemName: "plus", disabled: model.settings.dailyGoal >= 60) {
          adjustDailyGoal(by: 1)
        }
      }
      .padding(6)
      .readableSurface(
        tier: .none,
        role: .control,
        cornerRadius: 14,
        tint: .white.opacity(0.03),
        padding: 6
      )
    }
  }

  private var preferredModeSection: some View {
    sectionShell(
      title: "Preferred mode",
      subtitle: "Default queue behavior when starting sessions."
    ) {
      HStack(spacing: 8) {
        ForEach(StudyMode.allCases, id: \.self) { mode in
          segmentedPill(
            title: mode.label,
            selected: model.settings.preferredStudyMode == mode
          ) {
            model.settings.preferredStudyMode = mode
          }
        }
      }
    }
  }

  private var chineseFlowSection: some View {
    sectionShell(
      title: "Chinese review flow",
      subtitle: "Pick the number of clicks for Chinese cards."
    ) {
      HStack(spacing: 8) {
        ForEach(ChineseReviewFlow.allCases, id: \.self) { flow in
          segmentedPill(
            title: flow.label,
            selected: model.settings.chineseReviewFlow == flow
          ) {
            model.settings.chineseReviewFlow = flow
          }
        }
      }
    }
  }

  private var studyLanguagesSection: some View {
    sectionShell(
      title: "Study languages",
      subtitle: "Choose the languages available for study."
    ) {
      LazyVGrid(columns: languageColumns, alignment: .leading, spacing: 10) {
        ForEach(model.languages) { language in
          languageChip(language)
        }
      }
    }
  }

  private var footerActions: some View {
    HStack(spacing: 10) {
      Button("Cancel") {
        dismiss()
      }
      .buttonStyle(.plain)
      .font(.system(size: 15, weight: .semibold, design: .rounded))
      .glassTextPrimary()
      .padding(.horizontal, 18)
      .padding(.vertical, 10)
      .readableSurface(
        tier: .none,
        role: .control,
        cornerRadius: 999,
        tint: .clear,
        padding: 0
      )
      .contentShape(Capsule(style: .continuous))

      Spacer()

      Button("Done") {
        model.persistSettings()
        dismiss()
      }
      .studyActionProminent(tint: WebParityPalette.accent)
      .contentShape(Capsule(style: .continuous))
    }
    .padding(.top, 2)
  }

  private func sectionShell<Content: View>(
    title: String,
    subtitle: String,
    @ViewBuilder content: () -> Content
  ) -> some View {
    VStack(alignment: .leading, spacing: 10) {
      VStack(alignment: .leading, spacing: 3) {
        Text(title)
          .font(.system(size: 16, weight: .semibold, design: .rounded))
          .glassTextPrimary()
        Text(subtitle)
          .font(.system(size: 13, weight: .medium, design: .rounded))
          .glassTextSecondary()
      }

      content()
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 20,
      tint: .white.opacity(0.03),
      padding: 14
    )
  }

  private func segmentedPill(
    title: String,
    selected: Bool,
    action: @escaping () -> Void
  ) -> some View {
    Button(action: action) {
      Text(title)
        .font(.system(size: 15, weight: .semibold, design: .rounded))
        .foregroundStyle(selected ? (colorScheme == .dark ? Color.black : Color.white) : Color.glassTextPrimary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 9)
        .padding(.horizontal, 12)
        .background(
          Capsule(style: .continuous)
            .fill(selected ? WebParityPalette.blueDark : (colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.78) : Color.white.opacity(0.66)))
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(
                  (selected ? WebParityPalette.blueDark : WebParityPalette.lineLight).opacity(colorScheme == .dark ? 0.44 : 0.72),
                  lineWidth: 0.9
                )
            )
        )
    }
    .contentShape(Capsule(style: .continuous))
    .buttonStyle(.plain)
  }

  private func languageChip(_ language: DemoLanguage) -> some View {
    let isSelected = model.settings.selectedLanguageCodes.contains(language.code)

    return Button {
      toggleLanguageSelection(language.code)
    } label: {
      HStack(spacing: 8) {
        Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
          .font(.system(size: 14, weight: .semibold))
          .foregroundStyle(isSelected ? WebParityPalette.blueDark : Color.glassTextSecondary)
        Text("\(language.name) · \(language.nativeName)")
          .font(.system(size: 15, weight: .semibold, design: .rounded))
          .glassTextPrimary()
          .lineLimit(1)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.vertical, 9)
      .padding(.horizontal, 12)
      .readableSurface(
        tier: isSelected ? .interactive : .none,
        role: .control,
        cornerRadius: 14,
        tint: isSelected ? WebParityPalette.blueDark.opacity(0.16) : .clear,
        padding: 0
      )
    }
    .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    .buttonStyle(.plain)
  }

  private func stepButton(systemName: String, disabled: Bool, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Image(systemName: systemName)
        .font(.system(size: 14, weight: .bold))
        .frame(width: 30, height: 30)
        .glassTextPrimary()
        .background(
          Circle()
            .fill(colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.82) : Color.white.opacity(0.76))
            .overlay(
              Circle()
                .strokeBorder(WebParityPalette.lineLight.opacity(colorScheme == .dark ? 0.42 : 0.72), lineWidth: 0.8)
            )
        )
    }
    .buttonStyle(.plain)
    .contentShape(Circle())
    .disabled(disabled)
    .opacity(disabled ? 0.45 : 1)
  }

  private func adjustDailyGoal(by delta: Int) {
    model.settings.dailyGoal = min(60, max(1, model.settings.dailyGoal + delta))
  }

  private func toggleLanguageSelection(_ code: LanguageCode) {
    if model.settings.selectedLanguageCodes.contains(code) {
      model.settings.selectedLanguageCodes.removeAll { $0 == code }
      if model.settings.selectedLanguageCodes.isEmpty {
        model.settings.selectedLanguageCodes = ["es"]
      }
    } else {
      model.settings.selectedLanguageCodes.append(code)
    }

    if model.settings.dashboardLanguageCodes.isEmpty {
      model.settings.dashboardLanguageCodes = model.settings.selectedLanguageCodes
    }
  }
}
