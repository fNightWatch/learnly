import AppKit
import SwiftUI

struct WebParityPalette {
  static let accent = Color(red: 1.0, green: 0.6, blue: 0.11)      // #FF991C
  static let blue = Color(red: 0.21, green: 0.40, blue: 0.57)      // #366792
  static let blueDark = Color(red: 0.32, green: 0.66, blue: 0.93)  // #51A9EC
  static let coral = Color(red: 0.77, green: 0.36, blue: 0.29)     // #C45B4A
  static let danger = Color(red: 0.961, green: 0.404, blue: 0.384) // #F56762
  static let warmShadow = Color(red: 0.118, green: 0.078, blue: 0.047) // 30 20 12

  // Mirrors src/app/globals.css tokens for classic palette.
  static let paperLight = Color(red: 0.965, green: 0.953, blue: 0.929) // 246 243 237
  static let panelLight = Color(red: 0.988, green: 0.976, blue: 0.953) // 252 249 243
  static let lineLight = Color(red: 0.894, green: 0.863, blue: 0.812)  // 228 220 207

  static let paperDark = Color(red: 0.031, green: 0.039, blue: 0.055) // 8 10 14
  static let panelDark = Color(red: 0.059, green: 0.071, blue: 0.094) // 15 18 24
  static let lineDark = Color(red: 0.188, green: 0.212, blue: 0.267)  // 48 54 68

  static let pageTopLight = Color(red: 0.980, green: 0.980, blue: 0.961)    // #fafaf5
  static let pageMidLight = Color(red: 0.980, green: 0.980, blue: 0.961)    // #fafaf5
  static let pageBottomLight = Color(red: 0.980, green: 0.980, blue: 0.961) // #fafaf5

  static let pageTopDark = Color(red: 0.024, green: 0.027, blue: 0.035)    // #060709
  static let pageMidDark = Color(red: 0.035, green: 0.043, blue: 0.063)    // #090b10
  static let pageBottomDark = Color(red: 0.016, green: 0.020, blue: 0.024) // #040506
}

struct TypographyTokens {
  static let heroTitle = Font.system(size: 54, weight: .semibold, design: .rounded)
  static let sectionTitle = Font.system(size: 30, weight: .semibold, design: .rounded)
  static let cardValue = Font.system(size: 34, weight: .semibold, design: .rounded)
  static let body = Font.system(size: 18, weight: .medium, design: .rounded)
  static let caption = Font.system(size: 12, weight: .medium, design: .rounded)
}

struct LayoutTokens {
  static let maxPageWidth: CGFloat = 1180
  static let maxReadingWidth: CGFloat = 980
  static let pageHorizontal: CGFloat = 20
  static let headerTop: CGFloat = 14
  static let sectionTop: CGFloat = 10
  static let sectionBottom: CGFloat = 16
  static let sectionSpacing: CGFloat = 16
}

struct GradientBackdrop: View {
  @Environment(\.colorScheme) private var colorScheme
  var section: AppSection? = nil

  var body: some View {
    Group {
      if colorScheme == .dark {
        LinearGradient(
          stops: [
            .init(color: WebParityPalette.pageTopDark, location: 0),
            .init(color: WebParityPalette.pageMidDark, location: darkMidStop),
            .init(color: WebParityPalette.pageBottomDark, location: 1)
          ],
          startPoint: .top,
          endPoint: .bottom
        )
      } else {
        // The site's light mode background is intentionally almost flat (#fafaf5).
        Color(WebParityPalette.pageTopLight)
      }
    }
    .ignoresSafeArea()
  }

  private var darkMidStop: CGFloat {
    switch section {
    case .study, .words:
      // Mirrors `.study-page` / `.words-page` dark gradient in globals.css.
      return 0.52
    default:
      // Mirrors default dark `body` gradient in globals.css.
      return 0.44
    }
  }
}

extension Color {
  static var glassTextPrimary: Color { Color(nsColor: .labelColor) }
  static var glassTextSecondary: Color { Color(nsColor: .secondaryLabelColor) }
  static var glassTextTertiary: Color { Color(nsColor: .tertiaryLabelColor) }
}

enum GlassTier {
  case none
  case subtle
  case interactive
}

enum SurfaceRole {
  case text
  case panel
  case control
}

struct SurfaceTokens {
  let lightFillOpacity: CGFloat
  let darkFillOpacity: CGFloat
  let lightStrokeOpacity: CGFloat
  let darkStrokeOpacity: CGFloat
  let tintOpacity: CGFloat
  let shadowOpacity: CGFloat
  let shadowRadius: CGFloat
  let shadowYOffset: CGFloat
  let allowsGlass: Bool

  static func tokens(for role: SurfaceRole) -> SurfaceTokens {
    switch role {
    case .text:
      return SurfaceTokens(
        lightFillOpacity: 0.94,
        darkFillOpacity: 0.94,
        lightStrokeOpacity: 0.68,
        darkStrokeOpacity: 0.52,
        tintOpacity: 0.018,
        shadowOpacity: 0.03,
        shadowRadius: 12,
        shadowYOffset: 4,
        allowsGlass: false
      )
    case .panel:
      return SurfaceTokens(
        lightFillOpacity: 0.92,
        darkFillOpacity: 0.90,
        lightStrokeOpacity: 0.66,
        darkStrokeOpacity: 0.50,
        tintOpacity: 0.02,
        shadowOpacity: 0.028,
        shadowRadius: 10,
        shadowYOffset: 3,
        allowsGlass: true
      )
    case .control:
      return SurfaceTokens(
        lightFillOpacity: 0.90,
        darkFillOpacity: 0.88,
        lightStrokeOpacity: 0.70,
        darkStrokeOpacity: 0.54,
        tintOpacity: 0.024,
        shadowOpacity: 0.024,
        shadowRadius: 8,
        shadowYOffset: 2,
        allowsGlass: true
      )
    }
  }

  func fillOpacity(for colorScheme: ColorScheme, reduceTransparency: Bool) -> CGFloat {
    let base = colorScheme == .dark ? darkFillOpacity : lightFillOpacity
    if reduceTransparency {
      return min(0.99, base + 0.06)
    }
    return base
  }
}

@available(macOS 26.0, *)
private struct WebAccentCapsuleButtonStyle: ButtonStyle {
  @Environment(\.colorScheme) private var colorScheme
  let tint: Color

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 17, weight: .semibold, design: .rounded))
      .padding(.horizontal, 28)
      .padding(.vertical, 15)
      .frame(minHeight: 58)
      .foregroundStyle(colorScheme == .dark ? Color.black : Color.white)
      .background(
        Capsule(style: .continuous)
          .fill(tint)
          .overlay(
            Capsule(style: .continuous)
              .strokeBorder(tint.opacity(colorScheme == .dark ? 0.58 : 0.96), lineWidth: 1)
          )
          .overlay(
            Capsule(style: .continuous)
              .strokeBorder(
                LinearGradient(
                  colors: [
                    Color.white.opacity(colorScheme == .dark ? 0.18 : 0.22),
                    Color.black.opacity(colorScheme == .dark ? 0.28 : 0.16)
                  ],
                  startPoint: .top,
                  endPoint: .bottom
                ),
                lineWidth: 1
              )
          )
          .shadow(
            color: (colorScheme == .dark ? Color.black : tint).opacity(colorScheme == .dark ? 0.24 : 0.06),
            radius: colorScheme == .dark ? 16 : 5,
            x: 0,
            y: colorScheme == .dark ? 8 : 2
          )
      )
      .scaleEffect(configuration.isPressed ? 0.985 : 1)
      .animation(.easeOut(duration: 0.14), value: configuration.isPressed)
  }
}

@available(macOS 26.0, *)
private struct ReadableSurfaceModifier: ViewModifier {
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.accessibilityReduceTransparency) private var reduceTransparency

  var tier: GlassTier
  var role: SurfaceRole
  var tint: Color?
  var cornerRadius: CGFloat
  var contentPadding: CGFloat

  func body(content: Content) -> some View {
    let tokens = SurfaceTokens.tokens(for: role)
    let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    let baseFillColor = colorScheme == .dark ? WebParityPalette.panelDark : WebParityPalette.panelLight
    let baseOpacity = tokens.fillOpacity(for: colorScheme, reduceTransparency: reduceTransparency)
    let topOpacity = min(0.99, baseOpacity + (colorScheme == .dark ? 0.06 : 0.05))
    let bottomOpacity = max(0.01, baseOpacity - (colorScheme == .dark ? 0.02 : 0.12))
    let baseFill = LinearGradient(
      colors: [
        baseFillColor.opacity(topOpacity),
        baseFillColor.opacity(bottomOpacity)
      ],
      startPoint: .top,
      endPoint: .bottom
    )
    let borderBase = colorScheme == .dark ? WebParityPalette.lineDark : WebParityPalette.lineLight
    let border = borderBase.opacity(colorScheme == .dark ? tokens.darkStrokeOpacity : tokens.lightStrokeOpacity)
    let tintFill = (tint ?? .clear).opacity(tokens.tintOpacity)
    let shadowBase = colorScheme == .dark ? Color.black : WebParityPalette.warmShadow
    let shadow = colorScheme == .dark ? shadowBase.opacity(tokens.shadowOpacity) : Color.clear
    let shouldApplyGlass = tier == .interactive && tokens.allowsGlass && !reduceTransparency

    content
      .padding(contentPadding)
      .background(
        Group {
          if shouldApplyGlass {
            shape
              .fill(baseFill)
              .overlay(shape.fill(tintFill))
              .overlay(shape.strokeBorder(border, lineWidth: 0.85))
              .overlay(
                shape.strokeBorder(
                  LinearGradient(
                    colors: [
                      Color.white.opacity(colorScheme == .dark ? 0.06 : 0.32),
                      Color.clear
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                  ),
                  lineWidth: 0.8
                )
              )
              .shadow(color: shadow, radius: tokens.shadowRadius, x: 0, y: tokens.shadowYOffset)
              .glassEffect(glassStyle, in: shape)
          } else {
            shape
              .fill(baseFill)
              .overlay(shape.fill(tintFill))
              .overlay(shape.strokeBorder(border, lineWidth: 0.85))
              .overlay(
                shape.strokeBorder(
                  LinearGradient(
                    colors: [
                      Color.white.opacity(colorScheme == .dark ? 0.06 : 0.28),
                      Color.clear
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                  ),
                  lineWidth: 0.8
                )
              )
              .shadow(color: shadow, radius: tokens.shadowRadius, x: 0, y: tokens.shadowYOffset)
          }
        }
      )
  }

  private var glassStyle: Glass {
    switch tier {
    case .none:
      return Glass.regular
    case .subtle:
      if let tint {
        return Glass.regular.tint(tint).interactive(false)
      }
      return Glass.regular.interactive(false)
    case .interactive:
      if let tint {
        return Glass.regular.tint(tint).interactive()
      }
      return Glass.regular.interactive()
    }
  }
}

@available(macOS 26.0, *)
extension View {
  func readableSurface(
    tier: GlassTier = .subtle,
    role: SurfaceRole = .panel,
    cornerRadius: CGFloat = 26,
    tint: Color? = nil,
    padding: CGFloat = 16
  ) -> some View {
    modifier(
      ReadableSurfaceModifier(
        tier: tier,
        role: role,
        tint: tint,
        cornerRadius: cornerRadius,
        contentPadding: padding
      )
    )
  }

  func glassCard(tint: Color? = nil, cornerRadius: CGFloat = 26, interactive: Bool = false) -> some View {
    readableSurface(
      tier: interactive ? .interactive : .subtle,
      role: .panel,
      cornerRadius: cornerRadius,
      tint: tint,
      padding: 16
    )
  }

  func studyActionProminent(tint: Color) -> some View {
    self
      .buttonStyle(WebAccentCapsuleButtonStyle(tint: tint))
      .controlSize(.large)
  }

  func studyActionSecondary(tint: Color) -> some View {
    self
      .buttonStyle(.glass(.regular.tint(tint).interactive()))
      .foregroundStyle(Color.glassTextPrimary)
      .controlSize(.large)
  }

  func glassTextPrimary() -> some View {
    foregroundStyle(Color.glassTextPrimary)
  }

  func glassTextSecondary() -> some View {
    foregroundStyle(Color.glassTextSecondary)
  }

  func glassTextTertiary() -> some View {
    foregroundStyle(Color.glassTextTertiary)
  }
}
