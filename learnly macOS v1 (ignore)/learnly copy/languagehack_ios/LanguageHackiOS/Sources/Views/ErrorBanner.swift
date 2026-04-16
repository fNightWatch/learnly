import SwiftUI

@available(iOS 26.0, *)
struct ErrorBanner: View {
  let message: String
  let onRetry: () -> Void
  let onDismiss: () -> Void

  var body: some View {
    HStack(spacing: 12) {
      Image(systemName: "exclamationmark.triangle.fill")
        .foregroundStyle(.orange)

      Text(message)
        .font(.subheadline.weight(.medium))
        .glassTextPrimary()
        .lineLimit(2)

      Spacer(minLength: 8)

      Button("Retry", action: onRetry)
        .studyActionSecondary(tint: .orange.opacity(0.72))

      Button("Dismiss", action: onDismiss)
        .studyActionSecondary(tint: .blue.opacity(0.45))
    }
    .readableSurface(
      tier: .subtle,
      role: .text,
      cornerRadius: 18,
      tint: .orange.opacity(0.14),
      padding: 12
    )
  }
}
