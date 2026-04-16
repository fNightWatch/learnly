import Foundation

enum Support {
  static func parseDate(_ raw: String) -> Date {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

    if let parsed = formatter.date(from: raw) {
      return parsed
    }

    let fallback = ISO8601DateFormatter()
    fallback.formatOptions = [.withInternetDateTime]
    if let parsed = fallback.date(from: raw) {
      return parsed
    }

    return Date()
  }

  static func iso(_ date: Date) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter.string(from: date)
  }

  static func dayStart(_ date: Date) -> Date {
    Calendar.current.startOfDay(for: date)
  }

  static func toJSONArray(_ values: [String]) -> String {
    let clean = values
      .map { $0.replacingOccurrences(of: "\"", with: "") }
      .map { "\"\($0)\"" }
      .joined(separator: ",")
    return "[\(clean)]"
  }

  static func parseJSONArray(_ raw: String) -> [String] {
    guard let data = raw.data(using: .utf8) else { return [] }
    if let parsed = try? JSONDecoder().decode([String].self, from: data) {
      return parsed
    }
    return []
  }

  static func makeSQLitePlaceholders(count: Int) -> String {
    guard count > 0 else { return "NULL" }
    return Array(repeating: "?", count: count).joined(separator: ",")
  }
}
