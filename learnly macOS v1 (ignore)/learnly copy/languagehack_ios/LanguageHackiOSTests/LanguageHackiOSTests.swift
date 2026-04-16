import XCTest
@testable import LanguageHackiOS

final class LanguageHackiOSTests: XCTestCase {
  func testSchedulerAdvancesReview() {
    let scheduler = AdaptiveSchedulerEngine()
    let now = Date()
    let state = UserItemState(
      userID: "u",
      itemID: "i",
      status: .review,
      dueAt: now,
      stability: 1.5,
      difficulty: 4,
      scheduledDays: 3,
      learningSteps: 0,
      lapses: 0,
      reps: 2,
      lastRating: 3,
      introducedAt: now,
      lastReviewedAt: now
    )

    let next = scheduler.schedule(current: state, rating: 3, now: now)
    XCTAssertEqual(next.status, .review)
    XCTAssertGreaterThanOrEqual(next.scheduledDays, 1)
  }
}
