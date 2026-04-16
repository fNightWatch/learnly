import XCTest

final class LanguageHackiOSUITests: XCTestCase {
  func testLaunch() {
    let app = XCUIApplication()
    app.launch()
    XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
  }
}
