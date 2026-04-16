#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IOS_DIR="$ROOT_DIR/languagehack_ios"
PROJECT_PATH="$IOS_DIR/LanguageHackiOS.xcodeproj"
BUNDLE_TARGET="LanguageHackiOS"
BUNDLE_ID="com.languagehack.learnly.ios"
DERIVED_DATA="$ROOT_DIR/dist/ios/DerivedData"

find_simulator_line() {
  local preferred_name="${IOS_SIM_NAME:-}"

  if [[ -n "$preferred_name" ]]; then
    local preferred_26
    preferred_26="$(xcrun simctl list devices available | awk -v name="$preferred_name" '
      /-- iOS 26/ { ios26 = 1; next }
      /-- iOS / { ios26 = 0; next }
      /^--/ { ios26 = 0; next }
      ios26 && index($0, name) > 0 { print; exit }
    ')"
    if [[ -n "$preferred_26" ]]; then
      echo "$preferred_26"
      return 0
    fi

    local preferred_any
    preferred_any="$(xcrun simctl list devices available | awk -v name="$preferred_name" '
      /-- iOS / { ios = 1; next }
      /^--/ { ios = 0; next }
      ios && index($0, name) > 0 { print; exit }
    ')"
    if [[ -n "$preferred_any" ]]; then
      echo "$preferred_any"
      return 0
    fi
  fi

  local first_26
  first_26="$(xcrun simctl list devices available | awk '
    /-- iOS 26/ { ios26 = 1; next }
    /-- iOS / { ios26 = 0; next }
    /^--/ { ios26 = 0; next }
    ios26 && /iPhone/ { print; exit }
  ')"
  if [[ -n "$first_26" ]]; then
    echo "$first_26"
    return 0
  fi

  xcrun simctl list devices available | awk '
    /-- iOS / { ios = 1; next }
    /^--/ { ios = 0; next }
    ios && /iPhone/ { print; exit }
  '
}

SIM_LINE="$(find_simulator_line)"
if [[ -z "$SIM_LINE" ]]; then
  echo "No available iOS simulator found. Install an iOS simulator runtime in Xcode." >&2
  exit 1
fi

SIM_UDID="$(echo "$SIM_LINE" | sed -n 's/.*(\([0-9A-F-][0-9A-F-]*\)).*/\1/p')"
SIM_NAME="$(echo "$SIM_LINE" | sed -E 's/^[[:space:]]*([^\(]+) \(.*/\1/' | xargs)"

if [[ -z "$SIM_UDID" ]]; then
  echo "Unable to parse simulator UDID from: $SIM_LINE" >&2
  exit 1
fi

if [[ ! -d "$PROJECT_PATH" ]]; then
  echo "Missing project at $PROJECT_PATH" >&2
  echo "Run: (cd $IOS_DIR && xcodegen generate)" >&2
  exit 1
fi

mkdir -p "$DERIVED_DATA"
RUN_BUILD_ROOT="$DERIVED_DATA/run-$(date +%s)-$RANDOM"
mkdir -p "$RUN_BUILD_ROOT"

xcrun simctl boot "$SIM_UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$SIM_UDID" -b

xcodebuild \
  -project "$PROJECT_PATH" \
  -target "$BUNDLE_TARGET" \
  -configuration Debug \
  -sdk iphonesimulator \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  SYMROOT="$RUN_BUILD_ROOT" \
  OBJROOT="$RUN_BUILD_ROOT/obj" \
  build >/tmp/languagehack_ios_build.log

APP_PATH="$(find "$RUN_BUILD_ROOT/Debug-iphonesimulator" -maxdepth 1 -type d -name '*.app' | head -n 1)"
if [[ -z "$APP_PATH" ]]; then
  echo "Build finished but no .app was produced. See /tmp/languagehack_ios_build.log" >&2
  exit 1
fi

xcrun simctl terminate "$SIM_UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl install "$SIM_UDID" "$APP_PATH"
xcrun simctl launch "$SIM_UDID" "$BUNDLE_ID" >/tmp/languagehack_ios_launch.log
open -a Simulator

echo "Launched $BUNDLE_ID on $SIM_NAME ($SIM_UDID)"

case "$MODE" in
  run)
    ;;
  --verify|verify)
    xcrun simctl get_app_container "$SIM_UDID" "$BUNDLE_ID" app >/dev/null
    ;;
  --logs|logs)
    xcrun simctl spawn "$SIM_UDID" log stream --style compact --level info --predicate 'process == "LanguageHack"'
    ;;
  --debug|debug)
    echo "Attach LLDB from Xcode: Debug > Attach to Process by PID or Name... > LanguageHack"
    ;;
  *)
    echo "usage: $0 [run|--verify|--logs|--debug]" >&2
    exit 2
    ;;
esac
