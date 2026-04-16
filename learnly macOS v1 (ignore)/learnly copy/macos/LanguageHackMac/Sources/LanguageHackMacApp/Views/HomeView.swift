import SwiftUI

@available(macOS 26.0, *)
struct HomeView: View {
  let dashboard: DashboardSnapshot?
  let onStartStudy: () -> Void

  @Namespace private var homeNamespace

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: LayoutTokens.sectionSpacing) {
        heroPanel

        LazyVGrid(columns: [GridItem(.adaptive(minimum: 190), spacing: 12)], spacing: 12) {
          statCard(title: "Active words", value: dashboard.map { "\($0.activeWords)" } ?? "0")
          statCard(title: "Day streak", value: dashboard.map { "\($0.streakDays)" } ?? "0")
          statCard(title: "Retention", value: dashboard.map { "\($0.retentionScore)%" } ?? "0%")
        }

        Text("Study locally with native macOS performance, strong readability, and reliable session persistence in SQLite.")
          .font(TypographyTokens.body)
          .glassTextSecondary()
          .frame(maxWidth: 760, alignment: .leading)
      }
      .padding(.top, 8)
      .padding(.bottom, 8)
    }
    .scrollEdgeEffectStyle(.soft, for: .all)
  }

  private var heroPanel: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text("Spaced Repetition")
        .font(.system(size: 11, weight: .semibold, design: .rounded))
        .textCase(.uppercase)
        .tracking(2)
        .foregroundStyle(WebParityPalette.accent)

      Text("Build lasting\nvocabulary")
        .font(TypographyTokens.heroTitle)
        .kerning(-1.2)
        .glassTextPrimary()

      Text("Study smarter with adaptive review loops that reinforce what you know and recover what you forget.")
        .font(TypographyTokens.body)
        .glassTextSecondary()
        .frame(maxWidth: 640, alignment: .leading)

      HStack(spacing: 12) {
        Button("Start Studying") {
          onStartStudy()
        }
        .studyActionProminent(tint: WebParityPalette.accent)
        .glassEffectID("home-start", in: homeNamespace)

        if let dashboard {
          Text("\(dashboard.dueCount) due now")
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .glassTextPrimary()
            .readableSurface(
              tier: .interactive,
              role: .control,
              cornerRadius: 999,
              tint: WebParityPalette.blue.opacity(0.16),
              padding: 10
            )
        }
      }
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 32,
      tint: WebParityPalette.accent.opacity(0.08),
      padding: 22
    )
  }

  private func statCard(title: String, value: String) -> some View {
    VStack(alignment: .leading, spacing: 6) {
      Text(title)
        .font(TypographyTokens.caption)
        .textCase(.uppercase)
        .tracking(1.8)
        .glassTextSecondary()

      Text(value)
        .font(TypographyTokens.cardValue)
        .kerning(-0.6)
        .glassTextPrimary()
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 22,
      tint: .white.opacity(0.06),
      padding: 14
    )
  }
}
