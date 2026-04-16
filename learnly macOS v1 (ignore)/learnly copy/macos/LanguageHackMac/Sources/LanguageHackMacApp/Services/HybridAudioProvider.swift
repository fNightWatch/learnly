import AppKit
import AVFoundation
import Foundation

@MainActor
final class HybridAudioProvider: NSObject, AudioProvider {
  private let synthesizer = NSSpeechSynthesizer()
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
    synthesizer.rate = 180
  }

  func speakTerm(card: SessionCardPayload) {
    speak(text: card.displayForm, card: card, mode: "term")
  }

  func speakSentence(card: SessionCardPayload) {
    speak(text: card.example, card: card, mode: "example")
  }

  func stop() {
    synthesizer.stopSpeaking()
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
    if let voice = preferredVoice(for: languageCode) {
      synthesizer.setVoice(voice)
    }
    synthesizer.startSpeaking(text)
  }

  private func preferredVoice(for languageCode: LanguageCode) -> NSSpeechSynthesizer.VoiceName? {
    if languageCode.hasPrefix("zh") {
      return NSSpeechSynthesizer.VoiceName(rawValue: "com.apple.voice.compact.zh-CN.Tingting")
    }
    if languageCode == "es" {
      return NSSpeechSynthesizer.VoiceName(rawValue: "com.apple.voice.compact.es-ES.Monica")
    }
    if languageCode == "fr" {
      return NSSpeechSynthesizer.VoiceName(rawValue: "com.apple.voice.compact.fr-FR.Thomas")
    }
    if languageCode == "de" {
      return NSSpeechSynthesizer.VoiceName(rawValue: "com.apple.voice.compact.de-DE.Anna")
    }
    return nil
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
      // graceful fallback: ignore and keep UI responsive
    }
  }
}
