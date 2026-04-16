# LanguageHack iOS v1

Native iOS 26+ app (iPhone + iPad) built from the macOS LanguageHack architecture with iOS runtime substitutions.

## Structure

- `LanguageHackiOS.xcodeproj`: iOS app project.
- `LanguageHackiOS/Sources`: app code (`App`, `Views`, `Data`, `Services`, `Models`).
- `LanguageHackiOS/Resources/Seed/learnly-seed.db`: bundled seed SQLite database.
- `LanguageHackiOSTests`, `LanguageHackiOSUITests`: baseline unit/UI tests.

## Requirements

- Xcode 26+
- iOS 26 simulator runtime installed
- `xcodegen` (installed via Homebrew)

## Generate Project

```bash
cd /Users/moi/Desktop/business/learnly/languagehack_ios
xcodegen generate
```

## Build and Run

```bash
cd /Users/moi/Desktop/business/learnly
./script/build_and_run_ios.sh
```

Optional modes:

```bash
./script/build_and_run_ios.sh --verify
./script/build_and_run_ios.sh --logs
./script/build_and_run_ios.sh --debug
```

Set a specific simulator name:

```bash
IOS_SIM_NAME="iPhone 17" ./script/build_and_run_ios.sh
```

## Parity Checklist (v1)

- Home, Dashboard, Study, Words and Settings render with web-parity hierarchy.
- Study loop works end-to-end:
  - setup -> active review -> recovery -> completion stats -> new session.
- Chinese review flow supports 2-click and 4-click behavior.
- Timer mode counts down, pauses/resumes correctly, and finalizes after card completion.
- Hardware keyboard (iPad):
  - `Up` word audio, `Down` sentence audio, `Left` don't know, `Right` primary/know.
  - `P` pause/resume.
  - `Shift` reveal sentence translation.
- Local SQLite + local audio cache in iOS Application Support.
