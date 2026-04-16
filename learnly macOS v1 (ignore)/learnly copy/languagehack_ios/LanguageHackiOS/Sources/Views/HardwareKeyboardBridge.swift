import SwiftUI
import UIKit

@available(iOS 26.0, *)
struct HardwareKeyboardBridge: UIViewRepresentable {
  let onCommand: (StudyKeyboardCommand) -> Void

  func makeUIView(context: Context) -> KeyboardCaptureView {
    let view = KeyboardCaptureView()
    view.onCommand = onCommand
    return view
  }

  func updateUIView(_ uiView: KeyboardCaptureView, context: Context) {
    uiView.onCommand = onCommand
  }
}

@available(iOS 26.0, *)
final class KeyboardCaptureView: UIView {
  var onCommand: ((StudyKeyboardCommand) -> Void)?

  override var canBecomeFirstResponder: Bool { true }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    DispatchQueue.main.async { [weak self] in
      _ = self?.becomeFirstResponder()
    }
  }

  override var keyCommands: [UIKeyCommand]? {
    [
      makeCommand(input: UIKeyCommand.inputUpArrow, title: "Play word audio", action: #selector(handleUp)),
      makeCommand(input: UIKeyCommand.inputDownArrow, title: "Play sentence audio", action: #selector(handleDown)),
      makeCommand(input: UIKeyCommand.inputLeftArrow, title: "I don't know", action: #selector(handleLeft)),
      makeCommand(input: UIKeyCommand.inputRightArrow, title: "I think I know", action: #selector(handleRight)),
      makeCommand(input: "p", title: "Pause or resume", action: #selector(handlePause)),
      makeCommand(input: "P", title: "Pause or resume", action: #selector(handlePause))
    ]
  }

  override func pressesBegan(_ presses: Set<UIPress>, with event: UIPressesEvent?) {
    if presses.contains(where: { press in
      guard let key = press.key else { return false }
      return key.keyCode == .keyboardLeftShift || key.keyCode == .keyboardRightShift
    }) {
      onCommand?(.revealTranslation)
      return
    }

    super.pressesBegan(presses, with: event)
  }

  private func makeCommand(input: String, title: String, action: Selector) -> UIKeyCommand {
    let command = UIKeyCommand(input: input, modifierFlags: [], action: action)
    command.wantsPriorityOverSystemBehavior = true
    command.discoverabilityTitle = title
    return command
  }

  @objc private func handleUp() { onCommand?(.up) }
  @objc private func handleDown() { onCommand?(.down) }
  @objc private func handleLeft() { onCommand?(.left) }
  @objc private func handleRight() { onCommand?(.right) }
  @objc private func handlePause() { onCommand?(.pause) }
}
