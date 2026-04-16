import AVFoundation
import Foundation

@MainActor
final class HybridAudioProvider: NSObject, AudioProvider {
  private let synthesizer = AVSpeechSynthesizer()
  private var audioPlayer: AVAudioPlayer?
  private let cacheDirectory: URL
  private let elevenLabsKey: String?

  override init() {
    let appSupport = (try? FileManager.default.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )) ?? URL(fileURLWithPath: NSTemporaryDirectory())

    let languageHackSupport = appSupport.appendingPathComponent("LanguageHack", isDirectory: true)
    let cache = languageHackSupport.appendingPathComponent("audio-cache", isDirectory: true)
    try? FileManager.default.createDirectory(at: cache, withIntermediateDirectories: true)

    self.cacheDirectory = cache
    self.elevenLabsKey = ProcessInfo.processInfo.environment["ELEVENLABS_API_KEY"]

    super.init()
  }

  func speakTerm(card: SessionCardPayload) {
    speak(text: card.displayForm, card: card, mode: "term")
  }

  func speakSentence(card: SessionCardPayload) {
    speak(text: card.example, card: card, mode: "example")
  }

  func stop() {
    synthesizer.stopSpeaking(at: .immediate)
    audioPlayer?.stop()
  }

  private func speak(text: String, card: SessionCardPayload, mode: String) {
    stop()

    if let key = elevenLabsKey {
      Task {
        if let url = try? await fetchElevenLabsAudio(text: text, key: key, card: card, mode: mode) {
          await MainActor.run {
            playAudioFile(url)
          }
          return
        }

        await MainActor.run {
          speakWithSystemVoice(text: text, languageCode: card.languageCode)
        }
      }
      return
    }

    speakWithSystemVoice(text: text, languageCode: card.languageCode)
  }

  private func speakWithSystemVoice(text: String, languageCode: LanguageCode) {
    let utterance = AVSpeechUtterance(string: text)
    utterance.prefersAssistiveTechnologySettings = true
    utterance.voice = preferredVoice(for: languageCode)
    utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.88
    synthesizer.speak(utterance)
  }

  private func preferredVoice(for languageCode: LanguageCode) -> AVSpeechSynthesisVoice? {
    if languageCode.hasPrefix("zh") {
      return AVSpeechSynthesisVoice(language: "zh-CN")
        ?? AVSpeechSynthesisVoice(language: "zh-Hans")
    }

    switch languageCode {
    case "es":
      return AVSpeechSynthesisVoice(language: "es-ES")
    case "fr":
      return AVSpeechSynthesisVoice(language: "fr-FR")
    case "de":
      return AVSpeechSynthesisVoice(language: "de-DE")
    default:
      return AVSpeechSynthesisVoice(language: "en-US")
    }
  }

  private func cacheURL(card: SessionCardPayload, mode: String) -> URL {
    let fileName = "\(card.itemId)-\(mode)-ei\(card.exampleIndex).mp3"
      .replacingOccurrences(of: "/", with: "-")
      .replacingOccurrences(of: " ", with: "-")
    return cacheDirectory.appendingPathComponent(fileName)
  }

  private func fetchElevenLabsAudio(text: String, key: String, card: SessionCardPayload, mode: String) async throws -> URL {
    let cached = cacheURL(card: card, mode: mode)
    if FileManager.default.fileExists(atPath: cached.path) {
      return cached
    }

    guard let url = URL(string: "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb") else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(key, forHTTPHeaderField: "xi-api-key")

    let body: [String: Any] = [
      "text": text,
      "model_id": "eleven_multilingual_v2",
      "voice_settings": [
        "stability": 0.4,
        "similarity_boost": 0.8
      ]
    ]

    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let http = response as? HTTPURLResponse, (200 ... 299).contains(http.statusCode) else {
      throw URLError(.badServerResponse)
    }

    try data.write(to: cached, options: .atomic)
    return cached
  }

  private func playAudioFile(_ url: URL) {
    do {
      audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer?.prepareToPlay()
      audioPlayer?.play()
    } catch {
      // Graceful fallback: ignore and keep the UI responsive.
    }
  }
}
