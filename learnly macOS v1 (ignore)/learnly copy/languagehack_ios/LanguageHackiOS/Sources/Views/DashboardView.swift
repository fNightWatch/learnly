import SwiftUI

@available(iOS 26.0, *)
struct DashboardView: View {
  let snapshot: DashboardSnapshot?
  let onRefresh: () -> Void
  let onToggleLanguage: (LanguageCode) -> Void
  let onToggleAllLanguages: () -> Void

  @State private var range = 30
  @State private var hoveredVocabularyIndex: Int?
  @Environment(\.colorScheme) private var colorScheme

  private static let vocabularyDateFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateFormat = "MMM d"
    return formatter
  }()

  var body: some View {
    if let snapshot {
      ScrollView {
        VStack(spacing: LayoutTokens.sectionSpacing) {
          topPanels(snapshot)

          reviewsDueCard(snapshot)
          vocabularyCard(snapshot)
          streakCard(snapshot)
          corpusCard(snapshot)
        }
        .padding(.top, 8)
        .padding(.bottom, 8)
      }
      .scrollEdgeEffectStyle(.soft, for: .all)
      .onChange(of: range) { _, _ in
        hoveredVocabularyIndex = nil
      }
    } else {
      ProgressView("Loading dashboard")
        .glassTextPrimary()
        .readableSurface(
          tier: .subtle,
          role: .text,
          cornerRadius: 24,
          tint: WebParityPalette.accent.opacity(0.12),
          padding: 16
        )
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }

  private func topPanels(_ snapshot: DashboardSnapshot) -> some View {
    let leftColumnWidth: CGFloat = 430

    return ViewThatFits(in: .horizontal) {
      HStack(alignment: .top, spacing: 12) {
        VStack(spacing: 10) {
          todayHeroCard(snapshot)
          HStack(spacing: 10) {
            miniTodayStat(title: "Reviewed", value: "\(snapshot.reviewsToday)")
            miniTodayStat(title: "New words", value: "\(snapshot.introducedToday)")
          }
        }
        .frame(width: leftColumnWidth)

        languagesCard(snapshot)
          .frame(maxWidth: .infinity)
      }

      VStack(spacing: 12) {
        todayHeroCard(snapshot)
        HStack(spacing: 10) {
          miniTodayStat(title: "Reviewed", value: "\(snapshot.reviewsToday)")
          miniTodayStat(title: "New words", value: "\(snapshot.introducedToday)")
        }
        languagesCard(snapshot)
      }
    }
  }

  private func todayHeroCard(_ snapshot: DashboardSnapshot) -> some View {
    VStack(alignment: .leading, spacing: 10) {
      VStack(alignment: .leading, spacing: 6) {
        Text("Today")
          .font(TypographyTokens.caption)
          .textCase(.uppercase)
          .tracking(2)
          .foregroundStyle(Color.white.opacity(0.78))
        Text("\(snapshot.dueCount)")
          .font(.system(size: 50, weight: .semibold, design: .rounded))
          .kerning(-1)
          .foregroundStyle(Color.white)
        Text("cards due today")
          .font(.system(size: 17, weight: .medium, design: .rounded))
          .foregroundStyle(Color.white.opacity(0.9))
      }
    }
    .padding(18)
    .background(
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .fill(WebParityPalette.blueDark)
        .overlay(
          RoundedRectangle(cornerRadius: 24, style: .continuous)
            .strokeBorder(Color.white.opacity(colorScheme == .dark ? 0.18 : 0.22), lineWidth: 0.9)
        )
        .shadow(
          color: (colorScheme == .dark ? Color.black : WebParityPalette.blueDark).opacity(colorScheme == .dark ? 0.22 : 0),
          radius: colorScheme == .dark ? 14 : 0,
          x: 0,
          y: colorScheme == .dark ? 8 : 0
        )
    )
    .frame(maxWidth: .infinity, alignment: .leading)
  }

  private func miniTodayStat(title: String, value: String) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(title)
        .font(.system(size: 10, weight: .semibold, design: .rounded))
        .textCase(.uppercase)
        .tracking(1.8)
        .foregroundStyle(Color.glassTextSecondary)
      HStack(alignment: .bottom, spacing: 6) {
        Text(value)
          .font(.system(size: 34, weight: .semibold, design: .rounded))
          .kerning(-0.6)
          .glassTextPrimary()
        Text("today")
          .font(.system(size: 10, weight: .semibold, design: .rounded))
          .textCase(.uppercase)
          .tracking(1.6)
          .glassTextSecondary()
          .padding(.bottom, 5)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .readableSurface(
      tier: .none,
      role: .text,
      cornerRadius: 18,
      tint: .white.opacity(0.06),
      padding: 12
    )
  }

  private func languagesCard(_ snapshot: DashboardSnapshot) -> some View {
    let allActive = snapshot.activeLanguageCodes.count == snapshot.availableLanguages.count

    return VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 6) {
          Text("Languages")
            .font(TypographyTokens.caption)
            .textCase(.uppercase)
            .tracking(1.8)
            .glassTextSecondary()
          Text("Choose what to show today")
            .font(.system(size: 20, weight: .semibold, design: .rounded))
            .glassTextPrimary()
        }

        Spacer()

        Button("All") {
          onToggleAllLanguages()
        }
        .buttonStyle(.plain)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
        .tracking(2)
        .textCase(.uppercase)
        .foregroundStyle(allActive ? (colorScheme == .dark ? Color.black : Color.white) : Color.glassTextPrimary)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
          Capsule(style: .continuous)
            .fill(allActive ? WebParityPalette.accent : Color.clear)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(
                  allActive
                    ? WebParityPalette.accent.opacity(0.98)
                    : (colorScheme == .dark ? WebParityPalette.lineDark.opacity(0.55) : WebParityPalette.lineLight.opacity(0.7)),
                  lineWidth: 1
                )
            )
        )
        .contentShape(Capsule(style: .continuous))
      }

      FlowLayout(items: snapshot.availableLanguages) { language in
        languagePill(
          language: language,
          active: snapshot.activeLanguageCodes.contains(language.code),
          onTap: { onToggleLanguage(language.code) }
        )
      }
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: .white.opacity(0.05),
      padding: 16
    )
  }

  private func languagePill(language: DemoLanguage, active: Bool, onTap: @escaping () -> Void) -> some View {
    Button(action: onTap) {
      Text(language.name)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
        .foregroundStyle(active ? (colorScheme == .dark ? Color.black : Color.white) : Color.glassTextPrimary)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
          Capsule(style: .continuous)
            .fill(active ? WebParityPalette.accent : Color.clear)
            .overlay(
              Capsule(style: .continuous)
                .strokeBorder(
                  active
                    ? WebParityPalette.accent.opacity(0.98)
                    : (colorScheme == .dark ? WebParityPalette.lineDark.opacity(0.55) : WebParityPalette.lineLight.opacity(0.7)),
                  lineWidth: 1
                )
            )
        )
    }
    .contentShape(Capsule(style: .continuous))
    .buttonStyle(.plain)
  }

  private func reviewsDueCard(_ snapshot: DashboardSnapshot) -> some View {
    let visible = Array(snapshot.reviewsDueSeries.prefix(range))
    let maxValue = max(1, visible.map(\.value).max() ?? 1)

    return VStack(alignment: .leading, spacing: 12) {
      HStack {
        VStack(alignment: .leading, spacing: 6) {
          Text("Reviews Due")
            .font(TypographyTokens.sectionTitle)
            .glassTextPrimary()
          Text("Projected workload across \(languageSummary(snapshot)).")
            .font(.system(size: 14, weight: .medium, design: .rounded))
            .glassTextSecondary()
        }

        Spacer()

        HStack(spacing: 6) {
          rangeButton(7)
          rangeButton(30)
        }
        .readableSurface(
          tier: .subtle,
          role: .control,
          cornerRadius: 999,
          tint: .clear,
          padding: 4
        )
      }

      VStack(spacing: 0) {
        ForEach(0 ..< 3, id: \.self) { _ in
          Divider()
            .overlay(Color.gray.opacity(0.12))
        }
      }
      .padding(.top, 8)

      HStack(alignment: .bottom, spacing: 8) {
        ForEach(Array(visible.enumerated()), id: \.offset) { index, datum in
          VStack(spacing: 5) {
            Text("\(datum.value)")
              .font(.system(size: 11, weight: .semibold, design: .rounded))
              .glassTextSecondary()

            RoundedRectangle(cornerRadius: 8, style: .continuous)
              .fill(index == 0 ? WebParityPalette.blueDark : WebParityPalette.accent.opacity(0.78))
              .frame(width: 18, height: max(8, 128 * CGFloat(datum.value) / CGFloat(maxValue)))

            Text(shortLabel(datum.label))
              .font(.system(size: 11, weight: .medium, design: .rounded))
              .glassTextSecondary()
          }
          .frame(maxWidth: .infinity)
        }
      }
      .frame(minHeight: 182, alignment: .bottom)
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: WebParityPalette.accent.opacity(0.07),
      padding: 16
    )
  }

  private func vocabularyCard(_ snapshot: DashboardSnapshot) -> some View {
    let visible = Array(snapshot.vocabularyGrowthSeries.suffix(range))
    let chartData = visible.isEmpty
      ? [VocabularyGrowthDatum(label: "Today", learning: 0, solid: 0, notIntroduced: 0)]
      : visible
    let defaultIndex = chartData.count - 1
    let selectedIndex = max(0, min(hoveredVocabularyIndex ?? defaultIndex, defaultIndex))
    let selectedDatum = chartData[selectedIndex]
    let daysAgo = chartData.count - 1 - selectedIndex
    let dayTitle = vocabularyDayTitle(daysAgo: daysAgo)
    let daySubtitle = vocabularyDaySubtitle(daysAgo: daysAgo, fallbackWeekday: selectedDatum.label)
    let barWidth: CGFloat = 20
    let barSpacing: CGFloat = 6
    let tooltipWidth: CGFloat = 220
    let chartMaxTotal = max(1, chartData.map { $0.learning + $0.solid }.max() ?? 1)

    return VStack(alignment: .leading, spacing: 12) {
      Text("Vocabulary Growth")
        .font(TypographyTokens.sectionTitle)
        .glassTextPrimary()
      Text("How introductions are becoming durable active vocabulary.")
        .font(.system(size: 14, weight: .medium, design: .rounded))
        .glassTextSecondary()

      HStack(spacing: 12) {
        Text("\(range)-day view")
          .font(.system(size: 12, weight: .semibold, design: .rounded))
          .tracking(2)
          .textCase(.uppercase)
          .glassTextSecondary()
          .readableSurface(
            tier: .subtle,
            role: .control,
            cornerRadius: 999,
            tint: .clear,
            padding: 9
          )

        legendDot(color: WebParityPalette.blue.opacity(0.85), title: "strong")
        legendDot(color: WebParityPalette.blueDark.opacity(0.9), title: "learning")
      }

      VStack(alignment: .leading, spacing: 10) {
        HStack {
          VStack(alignment: .leading, spacing: 5) {
            Text(daysAgo == 0 ? "Today" : "Selected day")
              .font(.system(size: 12, weight: .semibold, design: .rounded))
              .textCase(.uppercase)
              .tracking(2)
              .glassTextSecondary()
            Text(dayTitle)
              .font(.system(size: 42 * 0.58, weight: .medium, design: .rounded))
              .glassTextPrimary()
            Text(daySubtitle)
              .font(.system(size: 12, weight: .medium, design: .rounded))
              .glassTextSecondary()
          }
          Spacer()

          metricChip(title: "Strong", value: "\(selectedDatum.solid)")
          metricChip(title: "Learning", value: "\(selectedDatum.learning)")
        }

        Divider().overlay(Color.gray.opacity(0.12))

        HStack(alignment: .bottom, spacing: barSpacing) {
          ForEach(Array(chartData.enumerated()), id: \.offset) { index, datum in
            let total = max(1, datum.learning + datum.solid)
            let totalHeight = max(10, 220 * CGFloat(total) / CGFloat(chartMaxTotal))
            let strongHeight = totalHeight * CGFloat(datum.solid) / CGFloat(total)
            let learningHeight = totalHeight * CGFloat(datum.learning) / CGFloat(total)
            let isActive = index == selectedIndex

            VStack(spacing: 0) {
              RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(WebParityPalette.blueDark.opacity(0.95))
                .frame(height: max(4, learningHeight))
              RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(WebParityPalette.blue.opacity(0.9))
                .frame(height: max(4, strongHeight))
            }
            .frame(width: barWidth)
            .frame(maxHeight: .infinity, alignment: .bottom)
            .opacity(hoveredVocabularyIndex == nil || isActive ? 1 : 0.72)
            .scaleEffect(isActive ? 1.06 : 1.0, anchor: .bottom)
            .overlay(alignment: .bottom) {
              if isActive {
                RoundedRectangle(cornerRadius: 7, style: .continuous)
                  .strokeBorder(
                    (colorScheme == .dark ? Color.white : WebParityPalette.blueDark).opacity(colorScheme == .dark ? 0.36 : 0.28),
                    lineWidth: 1
                  )
                  .padding(.vertical, -2)
              }
            }
            .contentShape(Rectangle())
            .onHover { hovering in
              if hovering {
                hoveredVocabularyIndex = index
              } else if hoveredVocabularyIndex == index {
                hoveredVocabularyIndex = nil
              }
            }
            .onTapGesture {
              hoveredVocabularyIndex = hoveredVocabularyIndex == index ? nil : index
            }
            .animation(.easeOut(duration: 0.16), value: selectedIndex)
            .animation(.easeOut(duration: 0.16), value: hoveredVocabularyIndex)
          }
        }
        .frame(height: 240, alignment: .bottom)
        .onHover { hovering in
          if !hovering {
            hoveredVocabularyIndex = nil
          }
        }
        .onTapGesture {
          if hoveredVocabularyIndex != nil {
            hoveredVocabularyIndex = nil
          }
        }
        .overlay(alignment: .topLeading) {
          if hoveredVocabularyIndex != nil {
            vocabularyHoverPopover(
              datum: selectedDatum,
              dayTitle: dayTitle,
              daySubtitle: daySubtitle,
              width: tooltipWidth
            )
            .offset(
              x: vocabularyTooltipOffsetX(
                index: selectedIndex,
                count: chartData.count,
                barWidth: barWidth,
                spacing: barSpacing,
                tooltipWidth: tooltipWidth
              ),
              y: -58
            )
            .transition(.opacity.combined(with: .scale(scale: 0.96, anchor: .bottomLeading)))
            .animation(.spring(response: 0.24, dampingFraction: 0.84), value: selectedIndex)
          }
        }

        HStack {
          Text("30d")
          Spacer()
          Text("23d")
          Spacer()
          Text("17d")
          Spacer()
          Text("11d")
          Spacer()
          Text("5d")
          Spacer()
          Text("Today")
        }
        .font(.system(size: 12, weight: .medium, design: .rounded))
        .glassTextSecondary()
      }
      .readableSurface(
        tier: .subtle,
        role: .text,
        cornerRadius: 30,
        tint: .white.opacity(0.03),
        padding: 14
      )

      VStack(spacing: 8) {
        simpleMetricRow(label: "Active words", value: "\(snapshot.activeWords)")
        simpleMetricRow(label: "Learning rate", value: String(format: "%.1f words per day", snapshot.averageNewPerDay))
        simpleMetricRow(label: "Lifetime reviews", value: "\(snapshot.totalReviews)")
      }
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: WebParityPalette.blue.opacity(0.06),
      padding: 16
    )
  }

  private func vocabularyDayTitle(daysAgo: Int) -> String {
    if daysAgo == 0 {
      return "Today"
    }
    if daysAgo == 1 {
      return "Yesterday"
    }
    return "\(daysAgo) days ago"
  }

  private func vocabularyDaySubtitle(daysAgo: Int, fallbackWeekday: String) -> String {
    let calendar = Calendar.current
    let dayStart = calendar.startOfDay(for: Date())
    let day = calendar.date(byAdding: .day, value: -daysAgo, to: dayStart) ?? dayStart
    return "\(Self.vocabularyDateFormatter.string(from: day)) • \(fallbackWeekday.uppercased())"
  }

  private func vocabularyTooltipOffsetX(
    index: Int,
    count: Int,
    barWidth: CGFloat,
    spacing: CGFloat,
    tooltipWidth: CGFloat
  ) -> CGFloat {
    let chartWidth = CGFloat(count) * barWidth + CGFloat(max(0, count - 1)) * spacing
    let centerX = CGFloat(index) * (barWidth + spacing) + barWidth / 2
    let rawX = centerX - tooltipWidth / 2
    let maxX = max(0, chartWidth - tooltipWidth)
    return min(max(0, rawX), maxX)
  }

  private func vocabularyHoverPopover(
    datum: VocabularyGrowthDatum,
    dayTitle: String,
    daySubtitle: String,
    width: CGFloat
  ) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(dayTitle)
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .textCase(.uppercase)
        .tracking(1.8)
        .glassTextSecondary()

      Text(daySubtitle)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
        .glassTextPrimary()

      HStack(spacing: 8) {
        hoverMetricPill(title: "Strong", value: datum.solid, tint: WebParityPalette.blue.opacity(0.82))
        hoverMetricPill(title: "Learning", value: datum.learning, tint: WebParityPalette.blueDark.opacity(0.9))
        hoverMetricPill(title: "Total", value: datum.learning + datum.solid, tint: WebParityPalette.accent.opacity(0.9))
      }
    }
    .frame(width: width, alignment: .leading)
    .padding(.horizontal, 12)
    .padding(.vertical, 10)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill((colorScheme == .dark ? WebParityPalette.panelDark : Color.white).opacity(0.94))
        .overlay(
          RoundedRectangle(cornerRadius: 14, style: .continuous)
            .strokeBorder((colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(0.64), lineWidth: 1)
        )
        .shadow(
          color: Color.black.opacity(colorScheme == .dark ? 0.24 : 0.09),
          radius: colorScheme == .dark ? 14 : 8,
          x: 0,
          y: colorScheme == .dark ? 10 : 4
        )
    )
  }

  private func hoverMetricPill(title: String, value: Int, tint: Color) -> some View {
    HStack(spacing: 5) {
      Text(title)
        .font(.system(size: 10, weight: .semibold, design: .rounded))
      Text("\(value)")
        .font(.system(size: 12, weight: .bold, design: .rounded))
    }
    .foregroundStyle(colorScheme == .dark ? Color.black : Color.white)
    .padding(.horizontal, 8)
    .padding(.vertical, 5)
    .background(
      Capsule(style: .continuous)
        .fill(tint)
    )
    .contentShape(Capsule(style: .continuous))
  }

  private func streakCard(_ snapshot: DashboardSnapshot) -> some View {
    let totalDays = 28
    let visibleDots = max(0, min(snapshot.streakDays, totalDays))
    let activeStartIndex = totalDays - visibleDots
    let dayLabels = ["M", "T", "W", "T", "F", "S", "S"]

    return HStack(alignment: .top, spacing: 16) {
      VStack(alignment: .leading, spacing: 12) {
        Text("Streak")
          .font(TypographyTokens.caption)
          .textCase(.uppercase)
          .tracking(2)
          .glassTextSecondary()

        HStack(alignment: .center, spacing: 12) {
          ZStack {
            Circle()
              .fill(
                LinearGradient(
                  colors: [
                    WebParityPalette.accent.opacity(0.96),
                    WebParityPalette.coral.opacity(0.92)
                  ],
                  startPoint: .topLeading,
                  endPoint: .bottomTrailing
                )
              )
              .overlay(
                Circle()
                  .strokeBorder(Color.white.opacity(colorScheme == .dark ? 0.12 : 0.28), lineWidth: 1)
              )
              .frame(width: 54, height: 54)
            Image(systemName: "flame.fill")
              .font(.system(size: 24, weight: .bold))
              .foregroundStyle(colorScheme == .dark ? Color.black : Color.white)
          }

          VStack(alignment: .leading, spacing: 2) {
            Text("\(snapshot.streakDays)")
              .font(.system(size: 58 * 0.58, weight: .semibold, design: .rounded))
              .glassTextPrimary()
            Text(snapshot.streakDays == 1 ? "day in a row" : "days in a row")
              .font(.system(size: 14, weight: .medium, design: .rounded))
              .glassTextSecondary()
          }
        }

        Text(snapshot.streakDays >= 7 ? "Great momentum" : "Keep it alive today")
          .font(.system(size: 12, weight: .medium, design: .rounded))
          .glassTextSecondary()
      }
      .frame(minWidth: 210, maxWidth: 250, alignment: .leading)

      VStack(alignment: .leading, spacing: 10) {
        HStack {
          Text("Last 4 weeks")
            .font(TypographyTokens.caption)
            .textCase(.uppercase)
            .tracking(2)
            .glassTextSecondary()

          Spacer()

          Text("\(visibleDots)/\(totalDays)")
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .glassTextSecondary()
        }

        HStack(spacing: 8) {
          ForEach(dayLabels.indices, id: \.self) { index in
            Text(dayLabels[index])
              .font(.system(size: 10, weight: .semibold, design: .rounded))
              .tracking(0.8)
              .glassTextTertiary()
              .frame(width: 22)
          }
        }

        LazyVGrid(columns: Array(repeating: GridItem(.fixed(22), spacing: 8), count: 7), spacing: 8) {
          ForEach(0 ..< totalDays, id: \.self) { index in
            let isActive = index >= activeStartIndex
            let isToday = index == totalDays - 1 && visibleDots > 0

            Circle()
              .fill(
                isActive
                  ? (isToday ? WebParityPalette.accent : WebParityPalette.accent.opacity(0.88))
                  : (colorScheme == .dark ? Color.white.opacity(0.12) : Color.black.opacity(0.09))
              )
              .overlay(
                Circle()
                  .strokeBorder(
                    isActive ? Color.white.opacity(colorScheme == .dark ? 0.08 : 0.24) : Color.clear,
                    lineWidth: 1
                  )
              )
              .overlay {
                if isToday {
                  Image(systemName: "flame.fill")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(colorScheme == .dark ? Color.black : Color.white)
                }
              }
              .frame(width: 22, height: 22)
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .readableSurface(
        tier: .none,
        role: .text,
        cornerRadius: 22,
        tint: WebParityPalette.accent.opacity(0.06),
        padding: 14
      )
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: WebParityPalette.accent.opacity(0.05),
      padding: 16
    )
  }

  private func corpusCard(_ snapshot: DashboardSnapshot) -> some View {
    VStack(alignment: .leading, spacing: 12) {
      Text("Corpus")
        .font(TypographyTokens.sectionTitle)
        .glassTextPrimary()

      VStack(spacing: 8) {
        simpleMetricRow(label: "Ranked words", value: "\(snapshot.corpusSize)")
        simpleMetricRow(label: "Active words", value: "\(snapshot.activeWords)")
        simpleMetricRow(label: "Lifetime reviews", value: "\(snapshot.totalReviews)")
      }
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: WebParityPalette.coral.opacity(0.05),
      padding: 16
    )
  }

  private func simpleMetricRow(label: String, value: String) -> some View {
    HStack {
      Text(label)
        .font(.system(size: 13, weight: .semibold, design: .rounded))
        .textCase(.uppercase)
        .tracking(1.6)
        .glassTextSecondary()
      Spacer()
      Text(value)
        .font(.system(size: 34 * 0.58, weight: .medium, design: .rounded))
        .glassTextPrimary()
    }
    .readableSurface(
      tier: .none,
      role: .text,
      cornerRadius: 16,
      tint: .white.opacity(0.04),
      padding: 12
    )
  }

  private func metricChip(title: String, value: String) -> some View {
    VStack(alignment: .leading, spacing: 3) {
      Text(title)
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .textCase(.uppercase)
        .tracking(2)
        .glassTextSecondary()
      Text(value)
        .font(.system(size: 24 * 0.58, weight: .semibold, design: .rounded))
        .glassTextPrimary()
    }
    .readableSurface(
      tier: .subtle,
      role: .control,
      cornerRadius: 999,
      tint: .clear,
      padding: 10
    )
  }

  private func legendDot(color: Color, title: String) -> some View {
    HStack(spacing: 6) {
      Circle().fill(color).frame(width: 14, height: 14)
      Text(title)
        .font(.system(size: 16 * 0.58, weight: .medium, design: .rounded))
        .glassTextPrimary()
    }
  }

  private func languageSummary(_ snapshot: DashboardSnapshot) -> String {
    let labels = snapshot.availableLanguages
      .filter { snapshot.activeLanguageCodes.contains($0.code) }
      .map(\.name)

    if labels.isEmpty {
      return "no active languages"
    }

    return labels.joined(separator: " + ")
  }

  private func shortLabel(_ raw: String) -> String {
    if raw == "Today" {
      return "Today"
    }
    if raw.count <= 2 {
      return raw
    }
    return String(raw.prefix(2))
  }

  private func rangeButton(_ value: Int) -> some View {
    let selected = range == value

    return Button {
      range = value
    } label: {
      Text("\(value) days")
        .font(.system(size: 12, weight: .semibold, design: .rounded))
        .foregroundStyle(selected ? (colorScheme == .dark ? Color.black : Color.white) : Color.glassTextSecondary)
        .padding(.horizontal, 18)
        .padding(.vertical, 9)
        .background(
          Capsule()
            .fill(selected ? (colorScheme == .dark ? WebParityPalette.blueDark : Color.black.opacity(0.9)) : Color.clear)
        )
    }
    .contentShape(Capsule(style: .continuous))
    .buttonStyle(.plain)
  }
}

@available(iOS 26.0, *)
private struct FlowLayout<Item: Hashable, Content: View>: View {
  let items: [Item]
  let content: (Item) -> Content

  var body: some View {
    LazyVGrid(columns: [GridItem(.adaptive(minimum: 84), spacing: 8)], spacing: 8) {
      ForEach(items, id: \.self) { item in
        content(item)
      }
    }
  }
}
