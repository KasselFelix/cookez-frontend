#!/usr/bin/env bash
# Runs inside the emulator (e2e-android.yml): installs Cookez Dev and points localhost:8081 at
# Metro (adb reverse; the flows' launchApp opens the app), then runs the e2e journeys and the
# ui-check captures (five themes each). Each flow gets its own output folder and JUnit report; a
# failed flow does not stop the next ones, the script fails at the end.
#
# Order matters: e2e flows and ui-check/login start from a clean state (common/launch.yaml), the
# other ui-check flows keep the app's data (common/relaunch.yaml). ui-check/login runs first among
# them, so they start logged out; profile signs in when needed and gallery runs after it.
#
# Only e2e-android/ is published: the PNG captures and the JUnit reports. Maestro's commands.json
# and logs record typed text (the test password), so they stay in the runner and are never uploaded.
set -uo pipefail

: "${MAESTRO_USERNAME:?}" "${MAESTRO_PASSWORD:?}"
APP=com.v2.cookez.dev
APK=android/app/build/outputs/apk/debug/app-debug.apk
RAW="$RUNNER_TEMP/maestro"
OUT=e2e-android
E2E_FLOWS="launch login search profile"
UI_FLOWS="login kickoff result recipe profile gallery"

mkdir -p "$RAW" "$OUT/captures" "$OUT/junit"
adb install -r "$APK" || exit 1
adb reverse tcp:8081 tcp:8081 || exit 1
# A slow CI emulator often shows "Pixel Launcher isn't responding" over the app, which hides every
# element from Maestro: no system error dialogs, and a moment for the boot work to settle.
adb shell settings put global hide_error_dialogs 1
sleep 30
maestro --version

failed=()
run_flow() {
  local kind=$1 name=$2 dir="$RAW/$1-$2"
  echo "::group::$kind/$name"
  adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS > /dev/null
  adb logcat -c
  if ! maestro test --format junit --output "$OUT/junit/$kind-$name.xml" \
      --test-output-dir "$dir" --debug-output "$dir/debug" ".maestro/$kind/$name.yaml"; then
    failed+=("$kind/$name")
    # Native side of the failure (crash buffer, then fatal runtime errors), in the job log only.
    echo "--- logcat crash buffer ($kind/$name)"
    adb logcat -d -b crash | tail -n 80
    echo "--- logcat fatal errors ($kind/$name)"
    adb logcat -d '*:E' | grep -E 'AndroidRuntime|FATAL|cookez|ReactNative|libc' | tail -n 60
  fi
  # Captures (takeScreenshot) and failure screenshots; nothing else leaves the runner.
  mkdir -p "$OUT/captures/$kind-$name"
  find "$dir" -name '*.png' -exec cp --backup=numbered {} "$OUT/captures/$kind-$name/" \;
  echo "::endgroup::"
}

for f in $E2E_FLOWS; do run_flow e2e "$f"; done
for f in $UI_FLOWS; do run_flow ui-check "$f"; done

# The JUnit reports are the only text published: prove the password is not in them.
if grep -rqF -- "$MAESTRO_PASSWORD" "$OUT"; then
  echo "::error::test password found in $OUT, artifacts removed"
  rm -rf "$OUT"
  exit 1
fi

echo "foreground: $(adb shell dumpsys activity activities | grep -m1 -oE "$APP|com\.v2\.cookez[^ /]*")"

# Proof that the app talked to this runner's backend (its first request is GET /recipes/all) and
# that the backend lived through the flows. The log itself stays private.
if ! grep -q 'GET /recipes/all' "$RUNNER_TEMP/backend.log"; then
  echo "::error::the app never reached the runner's backend"
  failed+=("backend: no request from the app")
fi
if ! curl -fsS --max-time 5 http://127.0.0.1:3000/health > /dev/null; then
  echo "::error::the runner's backend no longer answers /health"
  failed+=("backend: down")
fi

if [ ${#failed[@]} -gt 0 ]; then
  echo "::error::failed flows: ${failed[*]}"
  exit 1
fi
echo "all flows passed"
