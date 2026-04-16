import Foundation
import SQLite3

private enum SQLiteBind {
  case text(String)
  case int(Int)
  case double(Double)
  case null
}

private struct SQLiteRow {
  fileprivate let storage: [String: SQLiteBind]

  func text(_ key: String) -> String {
    if case let .text(value)? = storage[key] {
      return value
    }
    if case let .int(value)? = storage[key] {
      return String(value)
    }
    if case let .double(value)? = storage[key] {
      return String(value)
    }
    return ""
  }

  func int(_ key: String) -> Int {
    if case let .int(value)? = storage[key] {
      return value
    }
    if case let .text(value)? = storage[key] {
      return Int(value) ?? 0
    }
    if case let .double(value)? = storage[key] {
      return Int(value)
    }
    return 0
  }

  func double(_ key: String) -> Double {
    if case let .double(value)? = storage[key] {
      return value
    }
    if case let .int(value)? = storage[key] {
      return Double(value)
    }
    if case let .text(value)? = storage[key] {
      return Double(value) ?? 0
    }
    return 0
  }

  func optionalText(_ key: String) -> String? {
    if case let .text(value)? = storage[key] {
      return value
    }
    return nil
  }
}

enum SQLiteStoreError: Error, LocalizedError {
  case openFailed(String)
  case executionFailed(String)
  case missingSeedDatabase

  var errorDescription: String? {
    switch self {
    case let .openFailed(message):
      return "Failed to open SQLite database: \(message)"
    case let .executionFailed(message):
      return "SQLite execution failed: \(message)"
    case .missingSeedDatabase:
      return "Bundled seed database learnly-seed.db is missing."
    }
  }
}

private final class SQLiteStore {
  private var db: OpaquePointer?

  let dbPath: String
  let supportDirectory: URL

  init() throws {
    let support = try Self.resolveSupportDirectory()
    self.supportDirectory = support
    self.dbPath = support.appendingPathComponent("learnly.db").path

    try Self.ensureSeededDatabase(targetPath: dbPath)
    try openDatabase()
    try bootstrapSchemaIfNeeded()
  }

  deinit {
    sqlite3_close(db)
  }

  private static func resolveSupportDirectory() throws -> URL {
    let fm = FileManager.default
    let base = try fm.url(
      for: .applicationSupportDirectory,
      in: .userDomainMask,
      appropriateFor: nil,
      create: true
    )
    let appDirectory = base.appendingPathComponent("LanguageHack", isDirectory: true)
    try fm.createDirectory(at: appDirectory, withIntermediateDirectories: true)
    return appDirectory
  }

  private static func ensureSeededDatabase(targetPath: String) throws {
    let fm = FileManager.default
    guard !fm.fileExists(atPath: targetPath) else { return }

    guard let seeded = Bundle.module.url(forResource: "learnly-seed", withExtension: "db") else {
      throw SQLiteStoreError.missingSeedDatabase
    }

    try fm.copyItem(at: seeded, to: URL(fileURLWithPath: targetPath))
  }

  private func openDatabase() throws {
    if sqlite3_open(dbPath, &db) != SQLITE_OK {
      let message = String(cString: sqlite3_errmsg(db))
      throw SQLiteStoreError.openFailed(message)
    }

    try execute(
      sql: "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;"
    )
  }

  private func bootstrapSchemaIfNeeded() throws {
    let sql = """
    CREATE TABLE IF NOT EXISTS corpus_languages (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      native_name TEXT NOT NULL,
      descriptor TEXT NOT NULL,
      speaker_label TEXT NOT NULL,
      audio_voice TEXT NOT NULL,
      beta INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS corpus_items (
      id TEXT PRIMARY KEY,
      language_code TEXT NOT NULL,
      type TEXT NOT NULL,
      lemma TEXT NOT NULL,
      display_form TEXT NOT NULL,
      primary_gloss TEXT NOT NULL,
      pos TEXT NOT NULL,
      rank INTEGER NOT NULL,
      example TEXT NOT NULL,
      translation TEXT NOT NULL,
      pronunciation TEXT,
      secondary_glosses TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS corpus_items_language_rank_idx ON corpus_items(language_code, rank);

    CREATE TABLE IF NOT EXISTS corpus_item_examples (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      sentence TEXT NOT NULL,
      translation TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS corpus_item_examples_item_idx ON corpus_item_examples(item_id, sort_order);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      daily_goal INTEGER NOT NULL DEFAULT 10,
      selected_language_codes TEXT NOT NULL DEFAULT '["es"]',
      dashboard_language_codes TEXT NOT NULL DEFAULT '["es"]',
      preferred_study_mode TEXT NOT NULL DEFAULT 'everyday',
      chinese_review_flow TEXT NOT NULL DEFAULT 'four-click',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_item_states (
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      due_at TEXT NOT NULL,
      stability REAL NOT NULL DEFAULT 0.4,
      difficulty REAL NOT NULL DEFAULT 5,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      learning_steps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      last_rating INTEGER,
      introduced_at TEXT NOT NULL,
      last_reviewed_at TEXT,
      PRIMARY KEY (user_id, item_id)
    );

    CREATE INDEX IF NOT EXISTS user_item_states_due_idx ON user_item_states(user_id, due_at);
    CREATE INDEX IF NOT EXISTS user_item_states_status_idx ON user_item_states(user_id, status);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      language_codes TEXT NOT NULL,
      queue TEXT NOT NULL,
      due_count INTEGER NOT NULL,
      new_count INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      reviewed_at TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'recall',
      state_before TEXT NOT NULL,
      state_after TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS review_events_user_reviewed_idx ON review_events(user_id, reviewed_at);
    """

    try execute(sql: sql)
  }

  func execute(sql: String, bindings: [SQLiteBind] = []) throws {
    var statement: OpaquePointer?
    guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
      throw SQLiteStoreError.executionFailed(String(cString: sqlite3_errmsg(db)))
    }
    defer { sqlite3_finalize(statement) }

    try bind(bindings, to: statement)

    var result = sqlite3_step(statement)
    while result == SQLITE_ROW {
      result = sqlite3_step(statement)
    }

    if result != SQLITE_DONE {
      throw SQLiteStoreError.executionFailed(String(cString: sqlite3_errmsg(db)))
    }
  }

  func query(sql: String, bindings: [SQLiteBind] = []) throws -> [SQLiteRow] {
    var statement: OpaquePointer?
    guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK else {
      throw SQLiteStoreError.executionFailed(String(cString: sqlite3_errmsg(db)))
    }
    defer { sqlite3_finalize(statement) }

    try bind(bindings, to: statement)

    var rows: [SQLiteRow] = []
    while sqlite3_step(statement) == SQLITE_ROW {
      var storage: [String: SQLiteBind] = [:]
      let columnCount = sqlite3_column_count(statement)

      for index in 0 ..< columnCount {
        guard let cName = sqlite3_column_name(statement, index) else { continue }
        let name = String(cString: cName)
        let type = sqlite3_column_type(statement, index)

        switch type {
        case SQLITE_INTEGER:
          storage[name] = .int(Int(sqlite3_column_int64(statement, index)))
        case SQLITE_FLOAT:
          storage[name] = .double(sqlite3_column_double(statement, index))
        case SQLITE_TEXT:
          if let cText = sqlite3_column_text(statement, index) {
            storage[name] = .text(String(cString: cText))
          } else {
            storage[name] = .null
          }
        default:
          storage[name] = .null
        }
      }

      rows.append(SQLiteRow(storage: storage))
    }

    if sqlite3_errcode(db) != SQLITE_OK && sqlite3_errcode(db) != SQLITE_DONE {
      throw SQLiteStoreError.executionFailed(String(cString: sqlite3_errmsg(db)))
    }

    return rows
  }

  private func bind(_ bindings: [SQLiteBind], to statement: OpaquePointer?) throws {
    for (idx, value) in bindings.enumerated() {
      let position = Int32(idx + 1)
      let code: Int32

      switch value {
      case let .text(text):
        code = sqlite3_bind_text(statement, position, text, -1, SQLITE_TRANSIENT)
      case let .int(int):
        code = sqlite3_bind_int64(statement, position, sqlite3_int64(int))
      case let .double(double):
        code = sqlite3_bind_double(statement, position, double)
      case .null:
        code = sqlite3_bind_null(statement, position)
      }

      guard code == SQLITE_OK else {
        throw SQLiteStoreError.executionFailed(String(cString: sqlite3_errmsg(db)))
      }
    }
  }
}

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

final class SQLiteLearningRepository: LearningRepository {
  private let scheduler: SchedulerEngine
  private let queue = DispatchQueue(label: "languagehack.sqlite.repo")
  private let store: SQLiteStore

  init(scheduler: SchedulerEngine) throws {
    self.scheduler = scheduler
    self.store = try SQLiteStore()
  }

  func loadLanguages() throws -> [DemoLanguage] {
    try queue.sync {
      let rows = try store.query(
        sql: """
        SELECT code, name, native_name, descriptor, speaker_label, audio_voice
        FROM corpus_languages
        ORDER BY code
        """
      )

      return rows.map {
        DemoLanguage(
          code: $0.text("code"),
          name: $0.text("name"),
          nativeName: $0.text("native_name"),
          descriptor: $0.text("descriptor"),
          speakerLabel: $0.text("speaker_label"),
          audioVoice: $0.text("audio_voice")
        )
      }
    }
  }

  func loadSettings(userID: String) throws -> LearnerSettings {
    try queue.sync {
      try loadSettingsInternal(userID: userID)
    }
  }

  func updateSettings(userID: String, settings: LearnerSettings) throws {
    try queue.sync {
      try upsertSettings(userID: userID, settings: settings)
    }
  }

  func loadDashboard(userID: String, languageCodes: [LanguageCode]?) throws -> DashboardSnapshot {
    try queue.sync {
      let availableLanguages = try loadLanguagesInternal()
      let settings = try loadSettingsInternal(userID: userID)
      let activeCodes: [LanguageCode]

      if let languageCodes, !languageCodes.isEmpty {
        activeCodes = languageCodes
      } else if !settings.dashboardLanguageCodes.isEmpty {
        activeCodes = settings.dashboardLanguageCodes
      } else {
        activeCodes = settings.selectedLanguageCodes
      }

      let scopedCodes = activeCodes.isEmpty ? ["es"] : activeCodes

      let now = Date()
      let nowISO = Support.iso(now)
      let corpusSize = try scalarInt(
        sql: "SELECT COUNT(*) as count FROM corpus_items WHERE language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))",
        bindings: scopedCodes.map(SQLiteBind.text)
      )

      let dueCount = try scalarInt(
        sql: """
        SELECT COUNT(*) as count
        FROM user_item_states s
        JOIN corpus_items c ON c.id = s.item_id
        WHERE s.user_id = ?
          AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
          AND datetime(s.due_at) <= datetime(?)
        """,
        bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text) + [.text(nowISO)]
      )

      let newAvailableCount = try scalarInt(
        sql: """
        SELECT COUNT(*) as count
        FROM corpus_items c
        LEFT JOIN user_item_states s ON s.item_id = c.id AND s.user_id = ?
        WHERE s.item_id IS NULL
          AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
        """,
        bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text)
      )

      let activeWords = try scalarInt(
        sql: """
        SELECT COUNT(*) as count
        FROM user_item_states s
        JOIN corpus_items c ON c.id = s.item_id
        WHERE s.user_id = ?
          AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
        """,
        bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text)
      )
      let earliestIntroducedAt = try store.query(
        sql: """
        SELECT MIN(s.introduced_at) as earliest_introduced
        FROM user_item_states s
        JOIN corpus_items c ON c.id = s.item_id
        WHERE s.user_id = ?
          AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
        """,
        bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text)
      ).first?.optionalText("earliest_introduced")
      let averageNewPerDay = computeAverageNewWordsPerDay(
        activeWords: activeWords,
        earliestIntroducedAt: earliestIntroducedAt,
        now: now
      )

      let dayStart = Support.iso(Support.dayStart(now))
      let reviewsToday = try scalarInt(
        sql: "SELECT COUNT(*) as count FROM review_events WHERE user_id = ? AND datetime(reviewed_at) >= datetime(?)",
        bindings: [.text(userID), .text(dayStart)]
      )
      let introducedToday = try scalarInt(
        sql: "SELECT COUNT(*) as count FROM review_events WHERE user_id = ? AND state_before = 'none' AND datetime(reviewed_at) >= datetime(?)",
        bindings: [.text(userID), .text(dayStart)]
      )
      let totalReviews = try scalarInt(
        sql: "SELECT COUNT(*) as count FROM review_events WHERE user_id = ?",
        bindings: [.text(userID)]
      )

      let repsAndLapses = try store.query(
        sql: "SELECT COALESCE(SUM(reps),0) as reps, COALESCE(SUM(lapses),0) as lapses FROM user_item_states WHERE user_id = ?",
        bindings: [.text(userID)]
      ).first
      let totalReps = repsAndLapses?.int("reps") ?? 0
      let totalLapses = repsAndLapses?.int("lapses") ?? 0
      let retention = totalReps == 0 ? 0 : Int(round((1.0 - Double(totalLapses) / Double(max(1, totalReps))) * 100))

      let streak = try computeStreakDays(userID: userID, now: now)
      let dayLabelFormatter = DateFormatter()
      dayLabelFormatter.dateFormat = "EEE"

      var dueSeries: [ReviewsDueDatum] = []
      for offset in 0 ..< 30 {
        let day = Calendar.current.date(byAdding: .day, value: offset, to: Support.dayStart(now)) ?? now
        let nextDay = Calendar.current.date(byAdding: .day, value: 1, to: day) ?? day
        let dayISO = Support.iso(day)
        let nextDayISO = Support.iso(nextDay)
        let count = try scalarInt(
          sql: """
          SELECT COUNT(*) as count
          FROM user_item_states s
          JOIN corpus_items c ON c.id = s.item_id
          WHERE s.user_id = ?
            AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
            AND datetime(s.due_at) >= datetime(?)
            AND datetime(s.due_at) < datetime(?)
          """,
          bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text) + [.text(dayISO), .text(nextDayISO)]
        )
        let label = offset == 0 ? "Today" : dayLabelFormatter.string(from: day)
        dueSeries.append(ReviewsDueDatum(label: label, value: count))
      }

      var growthSeries: [VocabularyGrowthDatum] = []
      let corpusSizeSafe = max(0, corpusSize)
      for offset in stride(from: 29, through: 0, by: -1) {
        let day = Calendar.current.date(byAdding: .day, value: -offset, to: Support.dayStart(now)) ?? now
        let dayEnd = Calendar.current.date(byAdding: .day, value: 1, to: day) ?? day

        let learning = try scalarInt(
          sql: """
          SELECT COUNT(*) as count
          FROM user_item_states s
          JOIN corpus_items c ON c.id = s.item_id
          WHERE s.user_id = ?
            AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
            AND datetime(s.introduced_at) <= datetime(?)
            AND s.status IN ('new','learning','relearning')
          """,
          bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text) + [.text(Support.iso(dayEnd))]
        )

        let solid = try scalarInt(
          sql: """
          SELECT COUNT(*) as count
          FROM user_item_states s
          JOIN corpus_items c ON c.id = s.item_id
          WHERE s.user_id = ?
            AND c.language_code IN (\(Support.makeSQLitePlaceholders(count: scopedCodes.count)))
            AND datetime(s.introduced_at) <= datetime(?)
            AND s.status = 'review'
          """,
          bindings: [.text(userID)] + scopedCodes.map(SQLiteBind.text) + [.text(Support.iso(dayEnd))]
        )

        let notIntroduced = max(0, corpusSizeSafe - learning - solid)

        growthSeries.append(
          VocabularyGrowthDatum(label: dayLabelFormatter.string(from: day), learning: learning, solid: solid, notIntroduced: notIntroduced)
        )
      }

      return DashboardSnapshot(
        availableLanguages: availableLanguages,
        activeLanguageCodes: scopedCodes,
        preferredStudyMode: settings.preferredStudyMode,
        corpusSize: corpusSize,
        dueCount: dueCount,
        newAvailableCount: newAvailableCount,
        activeWords: activeWords,
        averageNewPerDay: averageNewPerDay,
        reviewsToday: reviewsToday,
        introducedToday: introducedToday,
        totalReviews: totalReviews,
        streakDays: streak,
        retentionScore: max(0, min(100, retention)),
        reviewsDueSeries: dueSeries,
        vocabularyGrowthSeries: growthSeries
      )
    }
  }

  func startSession(userID: String, languageCodes: [LanguageCode], mode: StudyMode) throws -> StudySession {
    try queue.sync {
      let scopedCodes = languageCodes.isEmpty ? ["es"] : languageCodes
      let now = Date()
      let nowISO = Support.iso(now)

      let dueIDs = try fetchDueItemIDs(userID: userID, languageCodes: scopedCodes, nowISO: nowISO)
      let newIDs = try fetchNewItemIDs(userID: userID, languageCodes: scopedCodes)

      let queueIDs = buildQueue(dueIDs: dueIDs, newIDs: newIDs, mode: mode)
      let sessionID = UUID().uuidString

      try store.execute(
        sql: """
        INSERT OR REPLACE INTO sessions (id, user_id, mode, language_codes, queue, due_count, new_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        bindings: [
          .text(sessionID),
          .text(userID),
          .text(mode.rawValue),
          .text(Support.toJSONArray(languageCodes)),
          .text(Support.toJSONArray(queueIDs)),
          .int(dueIDs.count),
          .int(newIDs.count),
          .text(nowISO)
        ]
      )

      return StudySession(
        id: sessionID,
        dueCount: dueIDs.count,
        newCount: newIDs.count,
        queueCount: queueIDs.count,
        createdAt: now
      )
    }
  }

  func resumeLatestSession(userID: String) throws -> StudySession? {
    try queue.sync {
      guard let row = try store.query(
        sql: """
        SELECT id, due_count, new_count, queue, created_at
        FROM sessions
        WHERE user_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT 1
        """,
        bindings: [.text(userID)]
      ).first else {
        return nil
      }

      let queueCount = Support.parseJSONArray(row.text("queue")).count
      guard queueCount > 0 else { return nil }

      return StudySession(
        id: row.text("id"),
        dueCount: row.int("due_count"),
        newCount: row.int("new_count"),
        queueCount: queueCount,
        createdAt: Support.parseDate(row.text("created_at"))
      )
    }
  }

  func loadNextCard(sessionID: String, userID: String) throws -> SessionCardPayload? {
    try queue.sync {
      guard let queueIDs = try loadSessionQueue(sessionID: sessionID), let itemID = queueIDs.first else {
        return nil
      }
      return try buildSessionCard(userID: userID, itemID: itemID)
    }
  }

  func submitReview(
    sessionID: String,
    userID: String,
    itemID: String,
    rating: Int,
    elapsedMs: Int
  ) throws -> SubmitReviewOutcome {
    try queue.sync {
      let now = Date()
      let nowISO = Support.iso(now)

      let existingState = try loadItemState(userID: userID, itemID: itemID)
      let stateBefore = existingState?.status.rawValue ?? "none"
      let initialState = existingState ?? UserItemState(
        userID: userID,
        itemID: itemID,
        status: .new,
        dueAt: now,
        stability: 0.4,
        difficulty: 5,
        scheduledDays: 0,
        learningSteps: 0,
        lapses: 0,
        reps: 0,
        lastRating: nil,
        introducedAt: now,
        lastReviewedAt: nil
      )

      let nextState = scheduler.schedule(current: initialState, rating: rating, now: now)

      try store.execute(
        sql: """
        INSERT OR REPLACE INTO user_item_states
        (user_id, item_id, status, due_at, stability, difficulty, scheduled_days, learning_steps, lapses, reps, last_rating, introduced_at, last_reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        bindings: [
          .text(userID),
          .text(itemID),
          .text(nextState.status.rawValue),
          .text(Support.iso(nextState.dueAt)),
          .double(nextState.stability),
          .double(nextState.difficulty),
          .int(nextState.scheduledDays),
          .int(nextState.learningSteps),
          .int(nextState.lapses),
          .int(nextState.reps),
          .int(nextState.lastRating),
          .text(Support.iso(nextState.introducedAt)),
          .text(Support.iso(nextState.lastReviewedAt))
        ]
      )

      try store.execute(
        sql: """
        INSERT INTO review_events (id, user_id, item_id, rating, elapsed_ms, reviewed_at, mode, state_before, state_after)
        VALUES (?, ?, ?, ?, ?, ?, 'recall', ?, ?)
        """,
        bindings: [
          .text(UUID().uuidString),
          .text(userID),
          .text(itemID),
          .int(rating),
          .int(elapsedMs),
          .text(nowISO),
          .text(stateBefore),
          .text(nextState.status.rawValue)
        ]
      )

      var queueIDs = try loadSessionQueue(sessionID: sessionID) ?? []
      if !queueIDs.isEmpty { queueIDs.removeFirst() }

      try store.execute(
        sql: "UPDATE sessions SET queue = ? WHERE id = ?",
        bindings: [.text(Support.toJSONArray(queueIDs)), .text(sessionID)]
      )

      let nextCard: SessionCardPayload?
      if let nextID = queueIDs.first {
        nextCard = try buildSessionCard(userID: userID, itemID: nextID)
      } else {
        nextCard = nil
      }

      let insights: SessionInsights
      if queueIDs.isEmpty {
        insights = try loadSessionInsights(userID: userID, now: now)
      } else {
        // Skip expensive per-card insights recalculation while a session is still active.
        insights = SessionInsights(reviewsToday: 0, newWordsToday: 0, streakDays: 0, retentionScore: 0, dueByLanguage: [:])
      }
      return SubmitReviewOutcome(nextCard: nextCard, insights: insights)
    }
  }

  func loadSessionInsights(userID: String) throws -> SessionInsights {
    try queue.sync {
      try loadSessionInsights(userID: userID, now: Date())
    }
  }

  func loadWords(userID: String, languageCodes: [LanguageCode], search: String) throws -> [WordRow] {
    try queue.sync {
      let placeholders = Support.makeSQLitePlaceholders(count: languageCodes.count)
      let wildcard = "%\(search.trimmingCharacters(in: .whitespacesAndNewlines))%"

      let rows = try store.query(
        sql: """
        SELECT c.id, c.language_code, c.display_form, c.primary_gloss, c.example, c.translation,
               s.status, s.due_at, s.reps, s.lapses
        FROM user_item_states s
        JOIN corpus_items c ON c.id = s.item_id
        WHERE s.user_id = ?
          AND c.language_code IN (\(placeholders))
          AND (s.reps > 0 OR s.status IN ('learning','review','relearning'))
          AND (c.display_form LIKE ? OR c.primary_gloss LIKE ? OR c.lemma LIKE ?)
        ORDER BY datetime(COALESCE(s.last_reviewed_at, s.introduced_at)) DESC
        LIMIT 800
        """,
        bindings: [.text(userID)] + languageCodes.map(SQLiteBind.text) + [.text(wildcard), .text(wildcard), .text(wildcard)]
      )

      return rows.map { row in
        WordRow(
          itemId: row.text("id"),
          languageCode: row.text("language_code"),
          displayForm: row.text("display_form"),
          primaryGloss: row.text("primary_gloss"),
          example: row.text("example"),
          translation: row.text("translation"),
          status: ReviewStatus(rawValue: row.text("status")) ?? .new,
          dueAt: Support.parseDate(row.text("due_at")),
          reps: row.int("reps"),
          lapses: row.int("lapses")
        )
      }
    }
  }

  func loadWordDetail(userID: String, itemID: String) throws -> WordDetail? {
    try queue.sync {
      guard let row = try store.query(
        sql: """
        SELECT c.id, c.language_code, c.display_form, c.primary_gloss, c.example, c.translation,
               c.lemma, c.notes, c.pronunciation,
               s.status, s.due_at, s.reps, s.lapses
        FROM user_item_states s
        JOIN corpus_items c ON c.id = s.item_id
        WHERE s.user_id = ? AND c.id = ?
        LIMIT 1
        """,
        bindings: [.text(userID), .text(itemID)]
      ).first else {
        return nil
      }

      let word = WordRow(
        itemId: row.text("id"),
        languageCode: row.text("language_code"),
        displayForm: row.text("display_form"),
        primaryGloss: row.text("primary_gloss"),
        example: row.text("example"),
        translation: row.text("translation"),
        status: ReviewStatus(rawValue: row.text("status")) ?? .new,
        dueAt: Support.parseDate(row.text("due_at")),
        reps: row.int("reps"),
        lapses: row.int("lapses")
      )

      let exampleRows = try store.query(
        sql: "SELECT sentence, translation, sort_order FROM corpus_item_examples WHERE item_id = ? ORDER BY sort_order",
        bindings: [.text(itemID)]
      )

      let examples: [WordExample]
      if exampleRows.isEmpty {
        examples = [WordExample(sentence: word.example, translation: word.translation, sortOrder: 0)]
      } else {
        examples = exampleRows.map {
          WordExample(sentence: $0.text("sentence"), translation: $0.text("translation"), sortOrder: $0.int("sort_order"))
        }
      }

      return WordDetail(
        row: word,
        lemma: row.text("lemma"),
        notes: row.optionalText("notes"),
        pronunciation: row.optionalText("pronunciation"),
        examples: examples
      )
    }
  }

  // MARK: - Private internals

  private func loadLanguagesInternal() throws -> [DemoLanguage] {
    let rows = try store.query(
      sql: """
      SELECT code, name, native_name, descriptor, speaker_label, audio_voice
      FROM corpus_languages
      ORDER BY code
      """
    )

    return rows.map {
      DemoLanguage(
        code: $0.text("code"),
        name: $0.text("name"),
        nativeName: $0.text("native_name"),
        descriptor: $0.text("descriptor"),
        speakerLabel: $0.text("speaker_label"),
        audioVoice: $0.text("audio_voice")
      )
    }
  }

  private func loadSettingsInternal(userID: String) throws -> LearnerSettings {
    if let row = try store.query(
      sql: """
      SELECT daily_goal, selected_language_codes, dashboard_language_codes,
             preferred_study_mode, chinese_review_flow, updated_at
      FROM user_settings
      WHERE user_id = ?
      """,
      bindings: [.text(userID)]
    ).first {
      return LearnerSettings(
        dailyGoal: row.int("daily_goal"),
        selectedLanguageCodes: Support.parseJSONArray(row.text("selected_language_codes")),
        dashboardLanguageCodes: Support.parseJSONArray(row.text("dashboard_language_codes")),
        preferredStudyMode: StudyMode(rawValue: row.text("preferred_study_mode")) ?? .everyday,
        chineseReviewFlow: ChineseReviewFlow(rawValue: row.text("chinese_review_flow")) ?? .fourClick,
        updatedAt: Support.parseDate(row.text("updated_at"))
      )
    }

    let defaults = LearnerSettings.default
    try upsertSettings(userID: userID, settings: defaults)
    return defaults
  }

  private func upsertSettings(userID: String, settings: LearnerSettings) throws {
    let selected = settings.selectedLanguageCodes.isEmpty ? ["es"] : settings.selectedLanguageCodes
    let dashboard = settings.dashboardLanguageCodes.isEmpty ? selected : settings.dashboardLanguageCodes

    try store.execute(
      sql: """
      INSERT INTO user_settings
      (user_id, daily_goal, selected_language_codes, dashboard_language_codes, preferred_study_mode, chinese_review_flow, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        daily_goal = excluded.daily_goal,
        selected_language_codes = excluded.selected_language_codes,
        dashboard_language_codes = excluded.dashboard_language_codes,
        preferred_study_mode = excluded.preferred_study_mode,
        chinese_review_flow = excluded.chinese_review_flow,
        updated_at = excluded.updated_at
      """,
      bindings: [
        .text(userID),
        .int(max(1, settings.dailyGoal)),
        .text(Support.toJSONArray(selected)),
        .text(Support.toJSONArray(dashboard)),
        .text(settings.preferredStudyMode.rawValue),
        .text(settings.chineseReviewFlow.rawValue),
        .text(Support.iso(Date()))
      ]
    )
  }

  private func scalarInt(sql: String, bindings: [SQLiteBind]) throws -> Int {
    try store.query(sql: sql, bindings: bindings).first?.int("count") ?? 0
  }

  private func computeAverageNewWordsPerDay(
    activeWords: Int,
    earliestIntroducedAt: String?,
    now: Date
  ) -> Double {
    guard activeWords > 0, let earliestIntroducedAt else { return 0 }

    let calendar = Calendar.current
    let earliestDay = calendar.startOfDay(for: Support.parseDate(earliestIntroducedAt))
    let today = calendar.startOfDay(for: now)
    let elapsedDays = (calendar.dateComponents([.day], from: earliestDay, to: today).day ?? 0) + 1
    let safeDays = max(1, elapsedDays)
    let rate = Double(activeWords) / Double(safeDays)
    return (rate * 10).rounded() / 10
  }

  private func computeStreakDays(userID: String, now: Date) throws -> Int {
    let rows = try store.query(
      sql: """
      SELECT DISTINCT substr(reviewed_at, 1, 10) as day
      FROM review_events
      WHERE user_id = ?
      ORDER BY day DESC
      """,
      bindings: [.text(userID)]
    )

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"

    let days = rows.compactMap { formatter.date(from: $0.text("day")) }
    guard !days.isEmpty else { return 0 }

    var streak = 0
    var cursor = Support.dayStart(now)
    let calendar = Calendar.current

    if !days.contains(where: { calendar.isDate($0, inSameDayAs: cursor) }) {
      guard let yesterday = calendar.date(byAdding: .day, value: -1, to: cursor),
            days.contains(where: { calendar.isDate($0, inSameDayAs: yesterday) }) else {
        return 0
      }
      cursor = yesterday
    }

    while days.contains(where: { calendar.isDate($0, inSameDayAs: cursor) }) {
      streak += 1
      guard let previous = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
      cursor = previous
    }

    return streak
  }

  private func fetchDueItemIDs(userID: String, languageCodes: [LanguageCode], nowISO: String) throws -> [String] {
    let placeholders = Support.makeSQLitePlaceholders(count: languageCodes.count)
    let rows = try store.query(
      sql: """
      SELECT c.id
      FROM user_item_states s
      JOIN corpus_items c ON c.id = s.item_id
      WHERE s.user_id = ?
        AND c.language_code IN (\(placeholders))
        AND datetime(s.due_at) <= datetime(?)
      ORDER BY datetime(s.due_at) ASC
      LIMIT 500
      """,
      bindings: [.text(userID)] + languageCodes.map(SQLiteBind.text) + [.text(nowISO)]
    )

    return rows.map { $0.text("id") }
  }

  private func fetchNewItemIDs(userID: String, languageCodes: [LanguageCode]) throws -> [String] {
    let placeholders = Support.makeSQLitePlaceholders(count: languageCodes.count)
    let rows = try store.query(
      sql: """
      SELECT c.id
      FROM corpus_items c
      LEFT JOIN user_item_states s ON s.item_id = c.id AND s.user_id = ?
      WHERE s.item_id IS NULL
        AND c.language_code IN (\(placeholders))
      ORDER BY c.rank ASC
      LIMIT 500
      """,
      bindings: [.text(userID)] + languageCodes.map(SQLiteBind.text)
    )

    return rows.map { $0.text("id") }
  }

  private func buildQueue(dueIDs: [String], newIDs: [String], mode: StudyMode) -> [String] {
    switch mode {
    case .reviewOnly:
      return dueIDs
    case .newOnly:
      return Array(newIDs.prefix(100))
    case .everyday:
      var queue: [String] = []
      var dueIndex = 0
      var newIndex = 0

      while dueIndex < dueIDs.count || newIndex < min(newIDs.count, 100) {
        for _ in 0 ..< 4 {
          guard dueIndex < dueIDs.count else { break }
          queue.append(dueIDs[dueIndex])
          dueIndex += 1
        }

        if newIndex < min(newIDs.count, 100) {
          queue.append(newIDs[newIndex])
          newIndex += 1
        }
      }

      return queue
    }
  }

  private func loadSessionQueue(sessionID: String) throws -> [String]? {
    guard let row = try store.query(
      sql: "SELECT queue FROM sessions WHERE id = ? LIMIT 1",
      bindings: [.text(sessionID)]
    ).first else {
      return nil
    }

    return Support.parseJSONArray(row.text("queue"))
  }

  private func buildSessionCard(userID: String, itemID: String) throws -> SessionCardPayload? {
    guard let item = try store.query(
      sql: """
      SELECT id, language_code, lemma, display_form, primary_gloss, pos, rank,
             example, translation, pronunciation, secondary_glosses, notes
      FROM corpus_items
      WHERE id = ?
      LIMIT 1
      """,
      bindings: [.text(itemID)]
    ).first else {
      return nil
    }

    let state = try loadItemState(userID: userID, itemID: itemID)
    let reps = state?.reps ?? 0

    let examples = try store.query(
      sql: "SELECT sentence, translation, sort_order FROM corpus_item_examples WHERE item_id = ? ORDER BY sort_order ASC",
      bindings: [.text(itemID)]
    )

    var sentence = item.text("example")
    var translation = item.text("translation")
    var exampleIndex = 0

    if !examples.isEmpty {
      let index = reps % examples.count
      let selected = examples[index]
      sentence = selected.text("sentence")
      translation = selected.text("translation")
      exampleIndex = selected.int("sort_order")
    }

    let secondary = Support.parseJSONArray(item.optionalText("secondary_glosses") ?? "[]")

    return SessionCardPayload(
      itemId: item.text("id"),
      languageCode: item.text("language_code"),
      isNew: state == nil,
      displayForm: item.text("display_form"),
      lemma: item.text("lemma"),
      primaryGloss: item.text("primary_gloss"),
      pos: item.text("pos"),
      rank: item.int("rank"),
      example: sentence,
      translation: translation,
      pronunciation: item.optionalText("pronunciation"),
      secondaryGlosses: secondary,
      notes: item.optionalText("notes"),
      exampleIndex: exampleIndex
    )
  }

  private func loadItemState(userID: String, itemID: String) throws -> UserItemState? {
    guard let row = try store.query(
      sql: """
      SELECT status, due_at, stability, difficulty, scheduled_days, learning_steps,
             lapses, reps, last_rating, introduced_at, last_reviewed_at
      FROM user_item_states
      WHERE user_id = ? AND item_id = ?
      LIMIT 1
      """,
      bindings: [.text(userID), .text(itemID)]
    ).first else {
      return nil
    }

    return UserItemState(
      userID: userID,
      itemID: itemID,
      status: ReviewStatus(rawValue: row.text("status")) ?? .new,
      dueAt: Support.parseDate(row.text("due_at")),
      stability: row.double("stability"),
      difficulty: row.double("difficulty"),
      scheduledDays: row.int("scheduled_days"),
      learningSteps: row.int("learning_steps"),
      lapses: row.int("lapses"),
      reps: row.int("reps"),
      lastRating: row.storage["last_rating"].flatMap {
        if case let .int(value) = $0 { return value }
        return nil
      },
      introducedAt: Support.parseDate(row.text("introduced_at")),
      lastReviewedAt: row.optionalText("last_reviewed_at").map(Support.parseDate)
    )
  }

  private func loadSessionInsights(userID: String, now: Date) throws -> SessionInsights {
    let dayStart = Support.iso(Support.dayStart(now))
    let reviewsToday = try scalarInt(
      sql: "SELECT COUNT(*) as count FROM review_events WHERE user_id = ? AND datetime(reviewed_at) >= datetime(?)",
      bindings: [.text(userID), .text(dayStart)]
    )
    let newWordsToday = try scalarInt(
      sql: "SELECT COUNT(*) as count FROM review_events WHERE user_id = ? AND state_before = 'none' AND datetime(reviewed_at) >= datetime(?)",
      bindings: [.text(userID), .text(dayStart)]
    )

    let repsAndLapses = try store.query(
      sql: "SELECT COALESCE(SUM(reps),0) as reps, COALESCE(SUM(lapses),0) as lapses FROM user_item_states WHERE user_id = ?",
      bindings: [.text(userID)]
    ).first
    let totalReps = repsAndLapses?.int("reps") ?? 0
    let totalLapses = repsAndLapses?.int("lapses") ?? 0
    let retention = totalReps == 0 ? 0 : Int(round((1.0 - Double(totalLapses) / Double(max(1, totalReps))) * 100))
    let streak = try computeStreakDays(userID: userID, now: now)

    let dueRows = try store.query(
      sql: """
      SELECT c.language_code as language_code, COUNT(*) as count
      FROM user_item_states s
      JOIN corpus_items c ON c.id = s.item_id
      WHERE s.user_id = ?
        AND datetime(s.due_at) <= datetime(?)
      GROUP BY c.language_code
      """,
      bindings: [.text(userID), .text(Support.iso(now))]
    )

    var dueByLanguage: [LanguageCode: Int] = [:]
    for row in dueRows {
      dueByLanguage[row.text("language_code")] = row.int("count")
    }

    return SessionInsights(
      reviewsToday: reviewsToday,
      newWordsToday: newWordsToday,
      streakDays: streak,
      retentionScore: max(0, min(100, retention)),
      dueByLanguage: dueByLanguage
    )
  }
}
