// swift-tools-version: 6.2
import PackageDescription

let package = Package(
  name: "LanguageHackMac",
  platforms: [
    .macOS(.v26)
  ],
  products: [
    .executable(name: "LanguageHack", targets: ["LanguageHackMacApp"])
  ],
  targets: [
    .executableTarget(
      name: "LanguageHackMacApp",
      path: "Sources/LanguageHackMacApp",
      resources: [
        .copy("../../Resources/Seed/learnly-seed.db")
      ]
    )
  ]
)
