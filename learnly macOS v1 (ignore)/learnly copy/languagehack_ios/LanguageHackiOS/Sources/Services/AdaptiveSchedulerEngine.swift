import Foundation

final class AdaptiveSchedulerEngine: SchedulerEngine {
  private let retention: Double = 0.9
  private let maxIntervalDays: Int = 365

  func schedule(current: UserItemState, rating: Int, now: Date) -> ScheduledState {
    let normalizedRating = rating <= 1 ? 1 : 3
    let previousInterval = max(1, current.scheduledDays)

    var status = current.status
    var learningSteps = current.learningSteps
    var lapses = current.lapses
    let reps = current.reps + 1
    var stability = current.stability
    var difficulty = current.difficulty
    var scheduledDays = current.scheduledDays

    if normalizedRating == 1 {
      lapses += 1
      status = current.status == .new ? .learning : .relearning
      learningSteps = current.status == .new ? 1 : max(1, current.learningSteps + 1)
      scheduledDays = 0
      stability = max(0.2, current.stability * 0.82)
      difficulty = min(10, current.difficulty + 0.35)
      let due = Calendar.current.date(byAdding: .minute, value: 1, to: now) ?? now

      return ScheduledState(
        status: status,
        dueAt: due,
        stability: stability,
        difficulty: difficulty,
        scheduledDays: scheduledDays,
        learningSteps: learningSteps,
        lapses: lapses,
        reps: reps,
        lastRating: 1,
        introducedAt: current.introducedAt,
        lastReviewedAt: now
      )
    }

    switch current.status {
    case .new:
      status = .learning
      learningSteps = max(1, current.learningSteps + 1)
      scheduledDays = 0
      stability = max(0.55, current.stability + 0.22)
      difficulty = max(1.0, current.difficulty - 0.2)
      let due = Calendar.current.date(byAdding: .minute, value: 10, to: now) ?? now

      return ScheduledState(
        status: status,
        dueAt: due,
        stability: stability,
        difficulty: difficulty,
        scheduledDays: scheduledDays,
        learningSteps: learningSteps,
        lapses: lapses,
        reps: reps,
        lastRating: 3,
        introducedAt: current.introducedAt,
        lastReviewedAt: now
      )

    case .learning, .relearning:
      if current.learningSteps >= 1 {
        status = .review
        learningSteps = 0
        scheduledDays = 1
        stability = max(0.9, current.stability + 0.35)
        difficulty = max(1.0, current.difficulty - 0.25)

        let due = Calendar.current.date(byAdding: .day, value: 1, to: now) ?? now
        return ScheduledState(
          status: status,
          dueAt: due,
          stability: stability,
          difficulty: difficulty,
          scheduledDays: scheduledDays,
          learningSteps: learningSteps,
          lapses: lapses,
          reps: reps,
          lastRating: 3,
          introducedAt: current.introducedAt,
          lastReviewedAt: now
        )
      }

      status = .learning
      learningSteps += 1
      scheduledDays = 0
      stability = max(0.65, current.stability + 0.16)
      difficulty = max(1.0, current.difficulty - 0.1)
      let due = Calendar.current.date(byAdding: .minute, value: 10, to: now) ?? now

      return ScheduledState(
        status: status,
        dueAt: due,
        stability: stability,
        difficulty: difficulty,
        scheduledDays: scheduledDays,
        learningSteps: learningSteps,
        lapses: lapses,
        reps: reps,
        lastRating: 3,
        introducedAt: current.introducedAt,
        lastReviewedAt: now
      )

    case .review:
      status = .review
      learningSteps = 0
      let growth = max(1.25, 1.0 + (retention * 0.85) + (current.stability * 0.08) - (current.difficulty * 0.03))
      let nextInterval = min(maxIntervalDays, max(1, Int(round(Double(previousInterval) * growth))))
      scheduledDays = nextInterval
      stability = min(30, current.stability * 1.13 + 0.12)
      difficulty = max(1.0, current.difficulty - 0.18)
      let due = Calendar.current.date(byAdding: .day, value: nextInterval, to: now) ?? now

      return ScheduledState(
        status: status,
        dueAt: due,
        stability: stability,
        difficulty: difficulty,
        scheduledDays: scheduledDays,
        learningSteps: learningSteps,
        lapses: lapses,
        reps: reps,
        lastRating: 3,
        introducedAt: current.introducedAt,
        lastReviewedAt: now
      )
    }
  }
}
