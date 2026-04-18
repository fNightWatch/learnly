import SwiftUI
import UIKit

@available(iOS 26.0, *)
struct WordsView: View {
  @ObservedObject var model: WordsViewModel
  @Environment(\.colorScheme) private var colorScheme
  @State private var showsPhoneDetail = false
  private let isPhoneDevice = UIDevice.current.userInterfaceIdiom == .phone

  var body: some View {
    GeometryReader { proxy in
      let metrics = WordsAdaptiveMetrics(size: proxy.size)

      ZStack {
        if isPhoneDevice {
          sidebar
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if metrics.useVerticalFallback {
          VStack(spacing: 10) {
            sidebar
              .frame(maxWidth: .infinity)
              .frame(height: metrics.sidebarHeight)

            detail
              .frame(maxWidth: .infinity, maxHeight: .infinity)
          }
        } else {
          HStack(spacing: 12) {
            sidebar
              .frame(minWidth: 260, idealWidth: 340, maxWidth: 390)

            Divider()
              .opacity(0.35)

            detail
              .frame(maxWidth: .infinity, maxHeight: .infinity)
          }
        }

        if let error = model.loadError {
          VStack {
            ErrorBanner(message: error) {
              model.reload()
            } onDismiss: {
              model.clearError()
            }
            .padding(.top, 14)

            Spacer()
          }
        }
      }
    }
    .onChange(of: model.searchText) { _, _ in
      model.onSearchChanged()
    }
    .onAppear {
      model.reload()
    }
    .fullScreenCover(isPresented: $showsPhoneDetail) {
      ZStack {
        GradientBackdrop(section: .words)
        VStack(spacing: 0) {
          HStack {
            Spacer()
            Button("Done") {
              showsPhoneDetail = false
            }
            .studyActionProminent(tint: WebParityPalette.accent)
            .contentShape(Capsule(style: .continuous))
          }
          .padding(.horizontal, 12)
          .padding(.top, 8)

          detail
            .padding(.top, 8)
        }
      }
    }
  }

  @ViewBuilder
  private var sidebar: some View {
    let content = VStack(alignment: .leading, spacing: 10) {
      Text("Studied words")
        .font(.system(size: 22, weight: .semibold, design: .rounded))
        .glassTextPrimary()

      TextField("Search words", text: $model.searchText)
        .textFieldStyle(.plain)
        .font(.system(size: 14, weight: .medium, design: .rounded))
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .readableSurface(
          tier: .interactive,
          role: .control,
          cornerRadius: 14,
          tint: WebParityPalette.blue.opacity(0.10),
          padding: 0
        )

      ScrollView {
        LazyVStack(alignment: .leading, spacing: 8) {
          ForEach(model.rows) { row in
            let isSelected = model.selectedWordID == row.itemId
            let rowFill = isSelected
              ? WebParityPalette.accent
              : (colorScheme == .dark ? WebParityPalette.panelDark.opacity(0.74) : Color.white.opacity(0.82))
            let rowStroke = isSelected
              ? WebParityPalette.accent.opacity(0.98)
              : (colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight).opacity(colorScheme == .dark ? 0.56 : 0.78)
            let selectedText = colorScheme == .dark ? Color.black : Color.white

            Button {
              model.selectWord(row.itemId)
              if isPhoneDevice {
                showsPhoneDetail = true
              }
            } label: {
              VStack(alignment: .leading, spacing: 4) {
                Text(row.displayForm)
                  .font(.system(size: 17, weight: .semibold, design: .rounded))
                  .foregroundStyle(isSelected ? selectedText : Color.glassTextPrimary)
                Text(row.primaryGloss)
                  .font(.system(size: 13, weight: .medium, design: .rounded))
                  .foregroundStyle(isSelected ? selectedText.opacity(0.92) : Color.glassTextSecondary)
                  .lineLimit(1)
              }
              .frame(maxWidth: .infinity, alignment: .leading)
              .padding(10)
              .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                  .fill(rowFill)
                  .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                      .strokeBorder(rowStroke, lineWidth: isSelected ? 1.2 : 1)
                  )
              )
            }
            .buttonStyle(.plain)
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
          }
        }
        .padding(.vertical, 2)
      }
      .scrollEdgeEffectStyle(.soft, for: .all)
    }

    if isPhoneDevice {
      content
        .padding(.horizontal, 12)
        .padding(.top, 8)
    } else {
      content
        .readableSurface(
          tier: .subtle,
          role: .text,
          cornerRadius: 24,
          tint: WebParityPalette.blue.opacity(0.10),
          padding: 14
        )
    }
  }

  @ViewBuilder
  private var detail: some View {
    if let detail = model.detail {
      ScrollView {
        VStack(alignment: .leading, spacing: 12) {
          HStack {
            VStack(alignment: .leading, spacing: 6) {
              Text(detail.row.displayForm)
                .font(.system(size: 46, weight: .semibold, design: .rounded))
                .kerning(-0.8)
                .glassTextPrimary()
              Text(detail.row.primaryGloss)
                .font(.system(size: 24, weight: .medium, design: .rounded))
                .glassTextSecondary()
            }

            Spacer()

            Text(detail.row.languageCode.uppercased())
              .font(.system(size: 13, weight: .semibold, design: .rounded))
              .glassTextPrimary()
              .readableSurface(
                tier: .interactive,
                role: .control,
                cornerRadius: 999,
                tint: WebParityPalette.accent.opacity(0.18),
                padding: 9
              )
          }

          if let pronunciation = detail.pronunciation, !pronunciation.isEmpty {
            Text(pronunciation)
              .font(.system(size: 24, weight: .medium, design: .rounded))
              .foregroundStyle(WebParityPalette.blue)
          }

          if let notes = detail.notes, !notes.isEmpty {
            Text(notes)
              .font(.system(size: 16, weight: .medium, design: .rounded))
              .glassTextSecondary()
          }

          Divider()

          Text("Examples")
            .font(.system(size: 22, weight: .semibold, design: .rounded))
            .glassTextPrimary()

          ForEach(detail.examples) { example in
            VStack(alignment: .leading, spacing: 6) {
              Text(example.sentence)
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .glassTextPrimary()
              Text(example.translation)
                .font(.system(size: 15, weight: .medium, design: .rounded))
                .glassTextSecondary()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .readableSurface(
              tier: .none,
              role: .text,
              cornerRadius: 18,
              tint: WebParityPalette.blue.opacity(0.08),
              padding: 12
            )
          }
        }
        .readableSurface(
          tier: .subtle,
          role: .text,
          cornerRadius: 30,
          tint: WebParityPalette.accent.opacity(0.08),
          padding: 18
        )
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
      }
      .scrollEdgeEffectStyle(.soft, for: .all)
    } else {
      VStack {
        Spacer()

        Text("Select a word")
          .font(.system(size: 22, weight: .medium, design: .rounded))
          .glassTextSecondary()
          .readableSurface(
            tier: .subtle,
            role: .text,
            cornerRadius: 24,
            tint: WebParityPalette.blue.opacity(0.10),
            padding: 16
          )

        Spacer()
      }
    }
  }
}

@available(iOS 26.0, *)
private struct WordsAdaptiveMetrics {
  let size: CGSize

  var useVerticalFallback: Bool { size.width < 980 }

  var sidebarHeight: CGFloat {
    min(max(250, size.height * 0.42), 360)
  }
}
