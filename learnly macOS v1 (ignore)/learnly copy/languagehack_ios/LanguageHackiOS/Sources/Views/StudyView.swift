import SwiftUI
import UIKit

@available(iOS 26.0, *)
struct StudyView: View {
  @ObservedObject var model: StudyViewModel
  let onProgress: () -> Void
  let onOpenSettings: () -> Void

  @Environment(\.colorScheme) private var colorScheme
  @State private var direction = "Auto"
  @State private var speed = "1×"
  private let isPhoneDevice = UIDevice.current.userInterfaceIdiom == .phone

  var body: some View {
    GeometryReader { proxy in
      let metrics = StudyAdaptiveMetrics(size: proxy.size)

      ZStack {
        studyPageBackdrop

        if isPhoneDevice {
          mobileStudyLayout(metrics)
        } else {
          desktopStudyLayout(metrics)
        }

        if model.showPauseOverlay {
          pauseOverlay
        }

        if let error = model.errorText {
          VStack {
            ErrorBanner(message: error) {
              model.retryLastAction()
            } onDismiss: {
              model.clearError()
            }
            .padding(.top, 14)

            Spacer()
          }
        }
      }
    }
    .overlay(alignment: .topLeading) {
      if !isPhoneDevice {
        HardwareKeyboardBridge { command in
          handleHardwareKeyboardCommand(command)
        }
        .frame(width: 1, height: 1)
        .opacity(0.001)
      }
    }
    .onAppear {
      if !isPhoneDevice {
        model.installKeyboardMonitor()
      }
    }
    .onDisappear {
      if !isPhoneDevice {
        model.uninstallKeyboardMonitor()
      }
    }
  }

  private func desktopStudyLayout(_ metrics: StudyAdaptiveMetrics) -> some View {
    VStack(spacing: metrics.verticalGap) {
      if model.activeSession == nil {
        setupCard(metrics)
          .padding(.top, metrics.setupTopPadding)
      } else {
        studyTopCluster(metrics)

        Spacer(minLength: metrics.contentTopSpacer)

        if let card = model.card {
          stageContent(card, metrics: metrics)
        } else {
          completionView(metrics)
        }

        Spacer(minLength: metrics.contentBottomSpacer)

        if let card = model.card {
          actionDock(for: card, metrics: metrics, showKeyboardGlyphs: true)
        }
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }

  private func mobileStudyLayout(_ metrics: StudyAdaptiveMetrics) -> some View {
    Group {
      if model.activeSession == nil {
        ScrollView {
          setupCard(metrics)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .scrollIndicators(.hidden)
      } else if let card = model.card {
        VStack(spacing: 8) {
          studyTopCluster(metrics)
            .padding(.horizontal, 12)
            .padding(.top, 4)

          ScrollView {
            stageContent(card, metrics: metrics)
              .frame(maxWidth: .infinity)
              .padding(.horizontal, 12)
              .padding(.top, 6)
              .padding(.bottom, 220)
          }
          .scrollIndicators(.hidden)
        }
        .safeAreaInset(edge: .bottom) {
          actionDock(for: card, metrics: metrics, showKeyboardGlyphs: false)
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .background(
              Group {
                if colorScheme == .dark {
                  WebParityPalette.panelDark.opacity(0.94)
                } else {
                  WebParityPalette.paperLight.opacity(0.98)
                }
              }
              .ignoresSafeArea(edges: .bottom)
            )
        }
      } else {
        ScrollView {
          completionView(metrics)
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .padding(.bottom, 28)
        }
        .scrollIndicators(.hidden)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }

  private var studyPageBackdrop: some View {
    Group {
      if colorScheme == .dark {
        LinearGradient(
          stops: [
            .init(color: WebParityPalette.pageTopDark, location: 0),
            .init(color: WebParityPalette.pageMidDark, location: 0.52),
            .init(color: WebParityPalette.pageBottomDark, location: 1)
          ],
          startPoint: .top,
          endPoint: .bottom
        )
      } else {
        Color(WebParityPalette.pageTopLight)
      }
    }
    .ignoresSafeArea()
  }

  private func setupCard(_ metrics: StudyAdaptiveMetrics) -> some View {
    VStack(alignment: .leading, spacing: 20) {
      VStack(spacing: 8) {
        Text("Study session")
          .font(.system(size: 13, weight: .medium, design: .rounded))
          .textCase(.uppercase)
          .tracking(4)
          .glassTextSecondary()
        Text("Ready to study?")
          .font(.system(size: metrics.setupHeroFont, weight: .semibold, design: .rounded))
          .glassTextPrimary()
      }
      .frame(maxWidth: .infinity)
      .padding(.bottom, 4)

      VStack(alignment: .leading, spacing: 10) {
        setupSectionTitle("Languages")
        ScrollView(.horizontal, showsIndicators: false) {
          HStack(spacing: 10) {
            ForEach(model.languages) { language in
              languageChip(language, metrics: metrics)
            }
          }
          .padding(.horizontal, 1)
          .padding(.vertical, 1)
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      }

      VStack(alignment: .leading, spacing: 10) {
        setupSectionTitle("Session mode")
        setupSegmentTrack {
          ForEach(StudyMode.allCases, id: \.self) { mode in
            setupSegmentButton(
              title: mode.label,
              selected: model.studyMode == mode
            ) {
              model.studyMode = mode
            }
          }
        }
      }

      VStack(alignment: .leading, spacing: 10) {
        setupSectionTitle("Time mode")
        setupSegmentTrack {
          ForEach(StudyTimeMode.allCases, id: \.self) { mode in
            setupSegmentButton(
              title: mode.label,
              selected: model.timeMode == mode
            ) {
              model.timeMode = mode
            }
          }
        }
      }

      if model.timeMode == .timer {
        timerDurationCard
      }

      Button {
        model.startSession()
        onProgress()
      } label: {
        Text("Start Study")
          .frame(maxWidth: .infinity)
      }
      .disabled(model.isBusy)
      .studyActionProminent(tint: WebParityPalette.accent)
      .contentShape(Capsule(style: .continuous))
      .padding(.top, 8)
    }
    .frame(maxWidth: 920)
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 34,
      tint: WebParityPalette.accent.opacity(0.06),
      padding: metrics.setupCardPadding
    )
  }

  private func setupSectionTitle(_ text: String) -> some View {
    Text(text)
      .font(.system(size: 13, weight: .medium, design: .rounded))
      .textCase(.uppercase)
      .tracking(4)
      .glassTextSecondary()
  }

  private func setupSegmentTrack<Content: View>(@ViewBuilder content: () -> Content) -> some View {
    HStack(spacing: 7, content: content)
      .padding(6)
      .background(
        Capsule(style: .continuous)
          .fill(colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.86) : Color.white.opacity(0.74))
          .overlay(
            Capsule(style: .continuous)
              .strokeBorder((colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(0.62), lineWidth: 1)
          )
      )
  }

  private func setupSegmentButton(
    title: String,
    selected: Bool,
    action: @escaping () -> Void
  ) -> some View {
    let selectedFill = WebParityPalette.blueDark
    let selectedText = colorScheme == .dark ? Color.black : Color.white
    let unselectedText = Color.glassTextSecondary

    return Button(action: action) {
      Text(title)
        .font(.system(size: 15, weight: .semibold, design: .rounded))
        .foregroundStyle(selected ? selectedText : unselectedText)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 11)
        .padding(.horizontal, 16)
        .background(
          Capsule(style: .continuous)
            .fill(selected ? selectedFill : Color.clear)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(
                  selected
                    ? WebParityPalette.blueDark.opacity(0.98)
                    : Color.clear,
                  lineWidth: 0.8
                )
            )
        )
    }
    .contentShape(Capsule(style: .continuous))
    .buttonStyle(.plain)
  }

  private var timerDurationCard: some View {
    VStack(spacing: 10) {
      Text("\(Int(model.timerMinutes.rounded())) min")
        .font(.system(size: 60 * 0.58, weight: .medium, design: .monospaced))
        .kerning(-0.7)
        .glassTextPrimary()

      Slider(value: $model.timerMinutes, in: 1 ... 60, step: 1)
        .tint(WebParityPalette.blueDark)
        .controlSize(.large)

      HStack {
        Text("1 min")
        Spacer()
        Text("60 min")
      }
      .font(.system(size: 13, weight: .medium, design: .rounded))
      .textCase(.uppercase)
      .tracking(2.4)
      .glassTextSecondary()
    }
    .readableSurface(
      tier: .none,
      role: .text,
      cornerRadius: 24,
      tint: WebParityPalette.blue.opacity(0.03),
      padding: 16
    )
  }

  private func studyTopCluster(_ metrics: StudyAdaptiveMetrics) -> some View {
    VStack(spacing: metrics.topClusterSpacing) {
      ViewThatFits(in: .horizontal) {
        HStack(alignment: .center, spacing: metrics.controlGap) {
          runningTimeLabel(metrics)

          Spacer()

          HStack(spacing: metrics.controlGap) {
            remainingChip(metrics)
            studyControlButtons(metrics)
          }
        }

        VStack(alignment: .leading, spacing: metrics.compactHeaderSpacing) {
          HStack {
            runningTimeLabel(metrics)
            Spacer()
            remainingChip(metrics)
          }

          HStack {
            Spacer()
            studyControlButtons(metrics)
          }
        }
      }

      HStack(spacing: 10) {
        Spacer()

        Menu {
          Button("Auto") { direction = "Auto" }
          Button("Target → En") { direction = "Target → En" }
          Button("En → Target") { direction = "En → Target" }
        } label: {
          Text(direction)
            .font(.system(size: metrics.menuFont, weight: .medium, design: .rounded))
            .glassTextPrimary()
            .readableSurface(
              tier: .subtle,
              role: .control,
              cornerRadius: 999,
              tint: .clear,
              padding: metrics.menuPadding
            )
            .contentShape(Capsule(style: .continuous))
        }
        .menuStyle(.borderlessButton)
        .fixedSize()

        Menu {
          Button("0.75×") { speed = "0.75×" }
          Button("1×") { speed = "1×" }
          Button("1.25×") { speed = "1.25×" }
          Button("1.5×") { speed = "1.5×" }
        } label: {
          Text(speed)
            .font(.system(size: metrics.menuFont, weight: .medium, design: .rounded))
            .foregroundStyle(WebParityPalette.blueDark)
            .readableSurface(
              tier: .subtle,
              role: .control,
              cornerRadius: 999,
              tint: .clear,
              padding: metrics.menuPadding
            )
            .contentShape(Capsule(style: .continuous))
        }
        .menuStyle(.borderlessButton)
        .fixedSize()
      }
    }
  }

  private func studyControlButtons(_ metrics: StudyAdaptiveMetrics) -> some View {
    HStack(spacing: metrics.controlGap) {
      Button {
        onOpenSettings()
      } label: {
        Image(systemName: "gearshape")
          .font(.system(size: metrics.topControlIconFont, weight: .semibold))
      }
      .buttonStyle(.plain)
      .frame(width: metrics.topControlCircleSize, height: metrics.topControlCircleSize)
      .background(
        Circle()
          .fill(studyBlueFill)
      )
      .foregroundStyle(filledButtonTextColor)
      .contentShape(Circle())

      Button {
        model.togglePause()
      } label: {
        Text(model.showPauseOverlay ? "Resume" : "Pause")
          .font(.system(size: metrics.topControlTextFont, weight: .semibold, design: .rounded))
          .padding(.horizontal, metrics.topControlHorizontalPadding)
          .padding(.vertical, metrics.topControlVerticalPadding)
          .background(
            Capsule()
              .fill(studyBlueFill)
          )
          .foregroundStyle(filledButtonTextColor)
      }
      .buttonStyle(.plain)
      .contentShape(Capsule())

      Button {
        model.endSession()
        onProgress()
      } label: {
        Text("End")
          .font(.system(size: metrics.topControlTextFont, weight: .semibold, design: .rounded))
          .padding(.horizontal, metrics.topControlHorizontalPadding)
          .padding(.vertical, metrics.topControlVerticalPadding)
          .background(
            Capsule()
              .fill(WebParityPalette.danger)
          )
          .foregroundStyle(filledButtonTextColor)
      }
      .buttonStyle(.plain)
      .contentShape(Capsule())
    }
  }

  private func remainingChip(_ metrics: StudyAdaptiveMetrics) -> some View {
    let remaining: Int
    if let session = model.activeSession {
      remaining = max(0, session.totalCards - model.reviewedInSession)
    } else {
      remaining = 0
    }

    return Text("\(remaining) cards left")
      .font(.system(size: metrics.remainingFont, weight: .semibold, design: .rounded))
      .padding(.horizontal, metrics.remainingHorizontalPadding)
      .padding(.vertical, metrics.remainingVerticalPadding)
      .background(Capsule().fill(studyBlueFill))
      .foregroundStyle(filledButtonTextColor)
  }

  private func stageContent(_ card: SessionCardPayload, metrics: StudyAdaptiveMetrics) -> some View {
    VStack(spacing: 12) {
      let isPromptOnly = !model.showingTranslation && !model.showingPronunciation

      if isPromptOnly {
        Text(card.displayForm)
          .font(.system(size: metrics.promptWordFont, weight: .regular, design: .rounded))
          .kerning(-2)
          .lineLimit(2)
          .minimumScaleFactor(0.45)
          .glassTextPrimary()
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
      } else {
        VStack(spacing: 10) {
          Text(card.displayForm)
            .font(.system(size: metrics.revealedWordFont, weight: .regular, design: .rounded))
            .kerning(-1.1)
            .lineLimit(2)
            .minimumScaleFactor(0.5)
            .glassTextPrimary()

          if model.showingPronunciation, let pronunciation = card.pronunciation {
            Text(pronunciation)
              .font(.system(size: metrics.pronunciationFont, weight: .medium, design: .rounded))
              .foregroundStyle(WebParityPalette.blue)
              .transition(.opacity.combined(with: .scale))
          }

          if model.showingTranslation {
            VStack(spacing: 8) {
              Text(card.primaryGloss)
                .font(.system(size: metrics.glossFont, weight: .semibold, design: .rounded))
                .glassTextPrimary()
              Text(card.example)
                .font(.system(size: metrics.exampleFont, weight: .medium, design: .rounded))
                .glassTextPrimary()
                .multilineTextAlignment(.center)
              translationTape(for: card, metrics: metrics)
            }
          }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, metrics.stageInnerVerticalPadding)
        .readableSurface(
          tier: .subtle,
          role: .text,
          cornerRadius: metrics.stageCornerRadius,
          tint: model.stage == .recovery ? WebParityPalette.blue.opacity(0.12) : WebParityPalette.accent.opacity(0.09),
          padding: metrics.stagePadding
        )
      }
    }
  }

  private func translationTape(for card: SessionCardPayload, metrics: StudyAdaptiveMetrics) -> some View {
    let cornerRadius = metrics.audioCornerRadius
    let tapeFill = colorScheme == .dark ? WebParityPalette.panelDark : WebParityPalette.panelLight
    let tapeStroke = colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight

    return Button {
      model.revealSentenceTranslation()
    } label: {
      ZStack {
        Text(card.translation)
          .font(.system(size: metrics.translationFont, weight: .medium, design: .rounded))
          .glassTextSecondary()
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.85)
          .frame(maxWidth: .infinity)
          .opacity(model.isSentenceTranslationRevealed ? 1 : 0)
          .animation(.easeOut(duration: 0.28), value: model.isSentenceTranslationRevealed)

        translationTapeOverlay(revealed: model.isSentenceTranslationRevealed, metrics: metrics)
      }
      .frame(maxWidth: .infinity)
      .padding(.horizontal, 12)
      .padding(.vertical, 10)
      .background(
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
          .fill(tapeFill.opacity(colorScheme == .dark ? 0.94 : 0.76))
      )
      .overlay(
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
          .stroke(tapeStroke.opacity(0.52), lineWidth: 1)
      )
      .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    }
    .buttonStyle(.plain)
    .contentShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
    .disabled(model.isSentenceTranslationRevealed)
    .accessibilityLabel(model.isSentenceTranslationRevealed ? "Sentence translation revealed" : "Reveal sentence translation")
    .accessibilityHint(isPhoneDevice ? "Tap to reveal" : "Tap or press Shift to reveal")
  }

  private func translationTapeOverlay(revealed: Bool, metrics: StudyAdaptiveMetrics) -> some View {
    GeometryReader { proxy in
      let stripeCount = max(1, Int((proxy.size.width / 8).rounded(.up)))

      ZStack {
        HStack(spacing: 0) {
          ForEach(0..<stripeCount, id: \.self) { index in
            Rectangle()
              .fill(index.isMultiple(of: 2)
                ? Color(red: 0.89, green: 0.86, blue: 0.80, opacity: 0.84)
                : Color(red: 0.93, green: 0.90, blue: 0.85, opacity: 0.76))
              .frame(width: index.isMultiple(of: 2) ? 2 : 6)
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .blur(radius: 0.9)

        Text(isPhoneDevice ? "tap to reveal" : "tap or press shift")
          .font(.system(size: max(11, metrics.audioFont - 1), weight: .medium, design: .rounded))
          .tracking(0.25)
          .padding(.horizontal, 10)
          .padding(.vertical, 5)
          .background(
            Capsule()
              .fill((colorScheme == .dark ? WebParityPalette.panelDark : WebParityPalette.panelLight).opacity(0.92))
          )
          .overlay(
            Capsule()
              .stroke((colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(0.52), lineWidth: 1)
          )
          .glassTextSecondary()
      }
      .opacity(revealed ? 0 : 1)
      .offset(x: revealed ? proxy.size.width : 0)
      .animation(.easeOut(duration: 0.35), value: revealed)
    }
    .allowsHitTesting(false)
  }

  private func actionDock(
    for card: SessionCardPayload,
    metrics: StudyAdaptiveMetrics,
    showKeyboardGlyphs: Bool
  ) -> some View {
    VStack(spacing: metrics.actionDockSpacing) {
      Text(stagePrompt(for: card))
        .font(.system(size: metrics.promptQuestionFont, weight: .medium, design: .rounded))
        .multilineTextAlignment(.center)
        .glassTextPrimary()

      ViewThatFits(in: .horizontal) {
        HStack(spacing: 10) {
          decisionButton(title: secondaryActionTitle, fill: studyBlueFill, metrics: metrics) {
            model.handleSecondaryAction()
            onProgress()
          }

          decisionButton(title: primaryActionTitle, fill: WebParityPalette.accent, metrics: metrics) {
            model.handlePrimaryAction()
            onProgress()
          }
        }

        VStack(spacing: 8) {
          decisionButton(title: secondaryActionTitle, fill: studyBlueFill, metrics: metrics) {
            model.handleSecondaryAction()
            onProgress()
          }

          decisionButton(title: primaryActionTitle, fill: WebParityPalette.accent, metrics: metrics) {
            model.handlePrimaryAction()
            onProgress()
          }
        }
      }

      ViewThatFits(in: .horizontal) {
        HStack(spacing: 10) {
          audioButton(title: showKeyboardGlyphs ? "↑ Word" : "Word", metrics: metrics) {
            model.playTermAudio()
          }

          audioButton(title: showKeyboardGlyphs ? "↓ Sentence" : "Sentence", metrics: metrics) {
            model.playSentenceAudio()
          }
        }

        VStack(spacing: 8) {
          audioButton(title: showKeyboardGlyphs ? "↑ Word" : "Word", metrics: metrics) {
            model.playTermAudio()
          }

          audioButton(title: showKeyboardGlyphs ? "↓ Sentence" : "Sentence", metrics: metrics) {
            model.playSentenceAudio()
          }
        }
      }
    }
    .padding(.bottom, metrics.actionDockBottomPadding)
  }

  private func decisionButton(title: String, fill: Color, metrics: StudyAdaptiveMetrics, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(title)
        .font(.system(size: metrics.decisionFont, weight: .semibold, design: .rounded))
        .frame(maxWidth: .infinity)
        .padding(.vertical, metrics.decisionVerticalPadding)
        .background(
          RoundedRectangle(cornerRadius: metrics.decisionCornerRadius, style: .continuous)
            .fill(fill)
        )
        .foregroundStyle(filledButtonTextColor)
    }
    .buttonStyle(.plain)
    .contentShape(RoundedRectangle(cornerRadius: metrics.decisionCornerRadius, style: .continuous))
    .opacity(model.isBusy ? 0.6 : 1)
    .disabled(model.isBusy)
  }

  private func audioButton(title: String, metrics: StudyAdaptiveMetrics, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Text(title)
        .font(.system(size: metrics.audioFont, weight: .medium, design: .rounded))
        .glassTextSecondary()
        .frame(maxWidth: .infinity)
        .padding(.vertical, metrics.audioVerticalPadding)
        .readableSurface(
          tier: .subtle,
          role: .control,
          cornerRadius: metrics.audioCornerRadius,
          tint: .clear,
          padding: 0
        )
    }
    .buttonStyle(.plain)
    .contentShape(RoundedRectangle(cornerRadius: metrics.audioCornerRadius, style: .continuous))
  }

  private func completionView(_ metrics: StudyAdaptiveMetrics) -> some View {
    let insights = model.insights
      ?? SessionInsights(reviewsToday: 0, newWordsToday: 0, streakDays: 0, retentionScore: 0, dueByLanguage: [:])
    let dueCombined = insights.dueByLanguage.values.reduce(0, +)

    return VStack(alignment: .leading, spacing: 12) {
      LazyVGrid(columns: metrics.completionColumns, spacing: 10) {
        completionBlueMetricCard(
          title: "Cards reviewed this session",
          value: "\(model.reviewedInSession)",
          suffix: nil,
          metrics: metrics
        )
        completionBlueMetricCard(
          title: "Time studied",
          value: sessionDurationLabel,
          suffix: nil,
          metrics: metrics
        )
        completionBlueMetricCard(
          title: "Reviewed today",
          value: "\(insights.reviewsToday)",
          suffix: "today",
          metrics: metrics
        )
        completionBlueMetricCard(
          title: "New words today",
          value: "\(insights.newWordsToday)",
          suffix: "today",
          metrics: metrics
        )
        completionBlueMetricCard(
          title: "Current streak",
          value: "\(insights.streakDays)",
          suffix: insights.streakDays == 1 ? "day" : "days",
          metrics: metrics
        )
        completionBlueMetricCard(
          title: "Retention",
          value: "\(insights.retentionScore)",
          suffix: "%",
          metrics: metrics
        )
      }

      dueByLanguageCard(combined: dueCombined, dueByLanguage: insights.dueByLanguage, metrics: metrics)
    }
    .readableSurface(
      tier: .none,
      role: .text,
      cornerRadius: 30,
      tint: .clear,
      padding: 14
    )
  }

  private func completionBlueMetricCard(
    title: String,
    value: String,
    suffix: String?,
    metrics: StudyAdaptiveMetrics
  ) -> some View {
    let primary = colorScheme == .dark ? Color.black : Color.white
    let secondary = primary.opacity(colorScheme == .dark ? 0.78 : 0.9)

    return VStack(alignment: .leading, spacing: 8) {
      Text(title)
        .font(.system(size: 12, weight: .medium, design: .rounded))
        .textCase(.uppercase)
        .tracking(4)
        .foregroundStyle(secondary)

      HStack(alignment: .lastTextBaseline, spacing: 6) {
        Text(value)
          .font(.system(size: metrics.completionValueFont, weight: .medium, design: .monospaced))
          .kerning(-0.6)
          .foregroundStyle(primary)
        if let suffix {
          Text(suffix)
            .font(.system(size: 16, weight: .medium, design: .rounded))
            .textCase(.uppercase)
            .tracking(2)
            .foregroundStyle(secondary)
        }
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .frame(minHeight: metrics.completionMetricHeight, alignment: .topLeading)
    .padding(14)
    .background(
      RoundedRectangle(cornerRadius: 22, style: .continuous)
        .fill(WebParityPalette.blueDark)
    )
  }

  private func dueByLanguageCard(
    combined: Int,
    dueByLanguage: [LanguageCode: Int],
    metrics: StudyAdaptiveMetrics
  ) -> some View {
    let primary = colorScheme == .dark ? Color.black : Color.white
    let secondary = primary.opacity(colorScheme == .dark ? 0.78 : 0.9)

    return VStack(alignment: .leading, spacing: 10) {
      Text("Still due by language")
        .font(.system(size: 12, weight: .medium, design: .rounded))
        .textCase(.uppercase)
        .tracking(4)
        .foregroundStyle(secondary)

      FlowLayout(
        items: dueLanguageChips(combined: combined, dueByLanguage: dueByLanguage),
        minimum: metrics.dueChipMinWidth
      ) { item in
        HStack(spacing: 10) {
          Text(item.title)
            .font(.system(size: 16, weight: .medium, design: .rounded))
            .foregroundStyle(primary)

          Text("\(item.count)")
            .font(.system(size: 15, weight: .semibold, design: .rounded))
            .foregroundStyle(primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 5)
            .background(
              Capsule(style: .continuous)
                .fill(colorScheme == .dark ? Color.white.opacity(0.24) : WebParityPalette.blue.opacity(0.78))
            )
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
          Capsule(style: .continuous)
            .fill(colorScheme == .dark ? Color.white.opacity(0.16) : Color.white.opacity(0.08))
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(colorScheme == .dark ? Color.white.opacity(0.24) : Color.white.opacity(0.26), lineWidth: 1)
            )
        )
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(14)
    .background(
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .fill(WebParityPalette.blueDark)
    )
  }

  private func dueLanguageChips(
    combined: Int,
    dueByLanguage: [LanguageCode: Int]
  ) -> [DueLanguageChip] {
    var chips: [DueLanguageChip] = [.init(title: "Combined", count: combined)]

    let rows: [DueLanguageChip] = dueByLanguage
      .map { code, count in
        DueLanguageChip(title: languageDisplayName(for: code), count: count)
      }
      .sorted { lhs, rhs in
        if lhs.count == rhs.count { return lhs.title < rhs.title }
        return lhs.count > rhs.count
      }

    chips.append(contentsOf: rows)
    return chips
  }

  private func languageDisplayName(for code: LanguageCode) -> String {
    if let language = model.languages.first(where: { $0.code == code }) {
      return language.name
    }
    return code.uppercased()
  }

  private var pauseOverlay: some View {
    ZStack(alignment: .top) {
      (colorScheme == .dark ? Color.black.opacity(0.24) : Color.black.opacity(0.08))
        .ignoresSafeArea()

      HStack(spacing: 10) {
        HStack(spacing: 8) {
          Image(systemName: "pause.fill")
            .font(.system(size: 12, weight: .bold))
          Text("Session paused")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(
          Capsule(style: .continuous)
            .fill(studyBlueFill)
        )
        .foregroundStyle(filledButtonTextColor)

        if !isPhoneDevice {
          Text("Press P or use Resume")
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .glassTextSecondary()

          Spacer(minLength: 8)

          Text("P")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .glassTextPrimary()
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .readableSurface(
              tier: .none,
              role: .control,
              cornerRadius: 999,
              tint: .clear,
              padding: 0
            )
        }
      }
      .readableSurface(
        tier: .subtle,
        role: .text,
        cornerRadius: 18,
        tint: WebParityPalette.blue.opacity(0.05),
        padding: 12
      )
      .frame(maxWidth: isPhoneDevice ? .infinity : 540)
      .padding(.top, 26)
      .padding(.horizontal, isPhoneDevice ? 12 : 20)
    }
    .transition(.opacity)
  }

  private func runningTimeLabel(_ metrics: StudyAdaptiveMetrics) -> some View {
    TimelineView(.periodic(from: .now, by: 1)) { _ in
      Text(timeLabel)
        .font(.system(size: metrics.timerFont, weight: .medium, design: .monospaced))
        .kerning(-0.8)
        .foregroundStyle(timerTextColor)
    }
  }

  private var timeLabel: String {
    let total = model.displayedClockSeconds()
    let minutes = total / 60
    let seconds = total % 60
    return String(format: "%02d:%02d", minutes, seconds)
  }

  private var sessionDurationLabel: String {
    let total = model.elapsedSeconds()
    let minutes = total / 60
    let seconds = total % 60
    return String(format: "%02d:%02d", minutes, seconds)
  }

  private var studyBlueFill: Color {
    WebParityPalette.blueDark
  }

  private var filledButtonTextColor: Color {
    colorScheme == .dark ? Color.black : Color.white
  }

  private var timerTextColor: Color {
    if model.isTimerInFinalMinute() {
      return WebParityPalette.danger
    }
    return Color.glassTextPrimary
  }

  private var primaryActionTitle: String {
    switch model.stage {
    case .simpleGuess:
      return "I think I know →"
    case .simpleConfirm:
      return "Yes →"
    case .pronunciationGuess:
      return "I think I know →"
    case .pronunciationConfirm:
      return "Yes →"
    case .definitionGuess:
      return "I think I know →"
    case .definitionConfirm:
      return "Yes →"
    case .recovery:
      return "I'm done studying it"
    }
  }

  private var secondaryActionTitle: String {
    switch model.stage {
    case .simpleGuess, .simpleConfirm, .pronunciationGuess, .pronunciationConfirm, .definitionGuess, .definitionConfirm:
      return "← I don't know"
    case .recovery:
      return "Need more time"
    }
  }

  private func stagePrompt(for _: SessionCardPayload) -> String {
    switch model.stage {
    case .simpleGuess:
      return "Do you think you know it?"
    case .simpleConfirm:
      return "Did you know it?"
    case .pronunciationGuess:
      return "Do you think you know the pronunciation?"
    case .pronunciationConfirm:
      return "Did you know the pronunciation?"
    case .definitionGuess:
      return "What is the definition of this word?"
    case .definitionConfirm:
      return "Did you know the definition?"
    case .recovery:
      return "Take a moment to study it"
    }
  }

  private func handleHardwareKeyboardCommand(_ command: StudyKeyboardCommand) {
    if model.handleKeyboardCommand(command), command == .left || command == .right {
      onProgress()
    }
  }

  private func languageChip(_ language: DemoLanguage, metrics: StudyAdaptiveMetrics) -> some View {
    let selected = model.selectedLanguageCodes.contains(language.code)
    let baseFill = colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.86) : Color.white.opacity(0.72)
    let baseStroke = (colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(colorScheme == .dark ? 0.62 : 0.78)
    let selectedFill = WebParityPalette.accent
    let selectedStroke = WebParityPalette.accent.opacity(0.94)
    let selectedText = colorScheme == .dark ? Color.black : Color.white

    return Button {
      if selected {
        if model.selectedLanguageCodes.count > 1 {
          model.selectedLanguageCodes.remove(language.code)
        }
      } else {
        model.selectedLanguageCodes.insert(language.code)
      }
    } label: {
      Text(language.name)
        .font(.system(size: 15, weight: .semibold, design: .rounded))
        .foregroundStyle(selected ? selectedText : Color.glassTextPrimary)
        .lineLimit(1)
        .frame(minWidth: metrics.languageChipMinWidth)
        .fixedSize(horizontal: true, vertical: false)
        .padding(.horizontal, 18)
        .padding(.vertical, 10)
        .background(
          Capsule(style: .continuous)
            .fill(selected ? selectedFill : baseFill)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(
                  selected ? selectedStroke : baseStroke,
                  lineWidth: 1
                )
            )
        )
    }
    .buttonStyle(.plain)
    .contentShape(Capsule(style: .continuous))
  }
}

@available(iOS 26.0, *)
private struct StudyAdaptiveMetrics {
  let size: CGSize

  var isCompactWidth: Bool { size.width < 1080 }
  var isNarrowWidth: Bool { size.width < 860 }
  var isShortHeight: Bool { size.height < 760 }
  var isVeryShortHeight: Bool { size.height < 670 }

  var verticalGap: CGFloat { isShortHeight ? 8 : 12 }
  var setupTopPadding: CGFloat { isShortHeight ? 2 : 6 }
  var contentTopSpacer: CGFloat { isVeryShortHeight ? 0 : 2 }
  var contentBottomSpacer: CGFloat { isShortHeight ? 4 : 8 }

  var setupTitleFont: CGFloat { isCompactWidth ? 30 : 34 }
  var setupHeroFont: CGFloat { isCompactWidth ? 44 * 0.58 : 56 * 0.58 }
  var setupCardPadding: CGFloat { isCompactWidth ? 16 : 24 }
  var languageChipMinWidth: CGFloat { isCompactWidth ? 94 : 106 }

  var topClusterSpacing: CGFloat { isShortHeight ? 6 : 8 }
  var compactHeaderSpacing: CGFloat { isShortHeight ? 6 : 8 }
  var controlGap: CGFloat { isCompactWidth ? 8 : 10 }

  var timerFont: CGFloat { isVeryShortHeight ? 40 : (isShortHeight ? 46 : 54) }
  var remainingFont: CGFloat { isShortHeight ? 16 : 18 }
  var remainingHorizontalPadding: CGFloat { isCompactWidth ? 18 : 26 }
  var remainingVerticalPadding: CGFloat { isShortHeight ? 10 : 14 }

  var topControlCircleSize: CGFloat { isShortHeight ? 48 : 56 }
  var topControlIconFont: CGFloat { isShortHeight ? 16 : 18 }
  var topControlTextFont: CGFloat { isShortHeight ? 16 : 18 }
  var topControlHorizontalPadding: CGFloat { isCompactWidth ? 16 : 22 }
  var topControlVerticalPadding: CGFloat { isShortHeight ? 10 : 14 }

  var menuFont: CGFloat { isShortHeight ? 14 : 15 }
  var menuPadding: CGFloat { isShortHeight ? 8 : 10 }

  var promptWordFont: CGFloat { min(96, max(58, min(size.width * 0.13, size.height * 0.18))) }
  var revealedWordFont: CGFloat { min(70, max(44, size.width * 0.095)) }
  var pronunciationFont: CGFloat { min(28, max(20, size.width * 0.04)) }
  var glossFont: CGFloat { min(30, max(22, size.width * 0.042)) }
  var exampleFont: CGFloat { min(24, max(18, size.width * 0.034)) }
  var translationFont: CGFloat { min(18, max(14, size.width * 0.026)) }
  var stageInnerVerticalPadding: CGFloat { isShortHeight ? 14 : 22 }
  var stageCornerRadius: CGFloat { isCompactWidth ? 28 : 34 }
  var stagePadding: CGFloat { isCompactWidth ? 14 : 18 }

  var promptQuestionFont: CGFloat { isCompactWidth ? 24 : 48 * 0.58 }
  var decisionFont: CGFloat { isCompactWidth ? 24 : 50 * 0.58 }
  var decisionVerticalPadding: CGFloat { isShortHeight ? 14 : 18 }
  var decisionCornerRadius: CGFloat { isCompactWidth ? 18 : 22 }
  var audioFont: CGFloat { isCompactWidth ? 20 : 44 * 0.58 }
  var audioVerticalPadding: CGFloat { isShortHeight ? 12 : 16 }
  var audioCornerRadius: CGFloat { isCompactWidth ? 18 : 20 }
  var actionDockSpacing: CGFloat { isShortHeight ? 8 : 10 }
  var actionDockBottomPadding: CGFloat { isShortHeight ? 0 : 2 }

  var completionTitleFont: CGFloat { isCompactWidth ? 30 : 34 }
  var completionValueFont: CGFloat { isCompactWidth ? 48 : 58 }
  var completionMetricHeight: CGFloat { isCompactWidth ? 138 : 160 }
  var completionColumns: [GridItem] {
    if isNarrowWidth {
      return [GridItem(.flexible())]
    }
    return [GridItem(.flexible()), GridItem(.flexible())]
  }
  var dueChipMinWidth: CGFloat { isCompactWidth ? 130 : 160 }
}

private struct DueLanguageChip: Hashable {
  let title: String
  let count: Int
}

@available(iOS 26.0, *)
private struct FlowLayout<Item: Hashable, Content: View>: View {
  let items: [Item]
  let minimum: CGFloat
  let content: (Item) -> Content

  var body: some View {
    LazyVGrid(columns: [GridItem(.adaptive(minimum: minimum), spacing: 8)], spacing: 8) {
      ForEach(items, id: \.self) { item in
        content(item)
      }
    }
  }
}
