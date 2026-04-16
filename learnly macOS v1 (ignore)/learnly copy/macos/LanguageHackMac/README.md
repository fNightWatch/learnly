# LanguageHackMac

Native macOS app for Learnly/LanguageHack, implemented in SwiftUI with heavy Liquid Glass surfaces.

## Run

From repository root:

```bash
./script/build_and_run_macos.sh
```

Extra modes:

```bash
./script/build_and_run_macos.sh --debug
./script/build_and_run_macos.sh --logs
./script/build_and_run_macos.sh --telemetry
./script/build_and_run_macos.sh --verify
```

## Architecture

- `NavigationSplitView` shell with 4 product surfaces: `Home`, `Dashboard`, `Study`, `Words`
- Data path: local SQLite at `~/Library/Application Support/LanguageHack/learnly.db`
- Seed DB copy on first launch from `Resources/Seed/learnly-seed.db`
- Study loop persistence and review history through `SQLiteLearningRepository`
- Scheduler abstraction via `SchedulerEngine`
- Audio via `HybridAudioProvider`: macOS voices by default, ElevenLabs when `ELEVENLABS_API_KEY` is set

## Liquid Glass

- System-wide `glassEffect` and `GlassEffectContainer`
- `glassEffectID` / matched transitions on key interactive elements
- Native toolbar grouping with `ToolbarSpacer`
- `scrollEdgeEffectStyle(.soft)` across the main scroll surfaces
