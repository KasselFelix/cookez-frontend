#!/usr/bin/env bash
# Runs inside the emulator (e2e-android.yml): installs Cookez Dev, opens it on Metro, then runs the
# e2e journeys and the ui-check captures (five themes each). Each flow gets its own output folder
# and JUnit report; a failed flow does not stop the next ones, the script fails at the end.
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
maestro --version

failed=()
run_flow() {
  local kind=$1 name=$2 dir="$RAW/$1-$2"
  echo "::group::$kind/$name"
  if ! maestro test --format junit --output "$OUT/junit/$kind-$name.xml" \
      --test-output-dir "$dir" --debug-output "$dir/debug" ".maestro/$kind/$name.yaml"; then
    failed+=("$kind/$name")
  fi
  # Captures (takeScreenshot) and failure screenshots; nothing else leaves the runner.
  mkdir -p "$OUT/captures/$kind-$name"
  find "$dir" -name '*.png' -exec cp {} "$OUT/captures/$kind-$name/" \;
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
if [ ${#failed[@]} -gt 0 ]; then
  echo "::error::failed flows: ${failed[*]}"
  exit 1
fi
echo "all flows passed"
