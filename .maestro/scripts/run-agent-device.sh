#!/bin/bash
# Runs the Maestro flows with seeded data through agent-device instead of Maestro.
# Same flows, a little faster; a failure names the YAML line and describes the screen.
# Usage: ./run-agent-device.sh [flow-file ...]
#
# If no flow file given, runs all flows EXCEPT those tagged empty-state. CI runs Maestro.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.."

# Seed and test the same simulator ($SIMULATOR_UDID, or the one booted simulator with the app).
SIMULATOR_UDID=$("$SCRIPT_DIR/pick-simulator.sh")
export SIMULATOR_UDID

"$SCRIPT_DIR/seed-db.sh"

# A development build loads its JavaScript from Metro; without it the app shows its launcher.
if ! curl -s -m 2 http://localhost:8081/status | grep -q running; then
  echo "Warning: Metro isn't running on :8081 (yarn start); a development build won't load." >&2
fi

flows=("$@")
if [ ${#flows[@]} -eq 0 ]; then
  for flow in "$MAESTRO_DIR"/*.yaml; do
    # Tags sit in the header, above the first ---. Match the tag line exactly, as Maestro's
    # --exclude-tags does, not any text that contains it.
    sed '/^---/q' "$flow" | grep -Eq '^[[:space:]]*-[[:space:]]*empty-state[[:space:]]*$' ||
      flows+=("$flow")
  done
fi
if [ ${#flows[@]} -eq 0 ]; then
  echo "Error: no flows to run in $MAESTRO_DIR." >&2
  exit 1
fi

# `test` runs the flows as one suite and closes each flow's session. One `replay` per flow
# leaves its session holding the simulator, and after a failure its Xcode runner too.
# --retries 1: agent-device's Xcode runner sometimes times out on a tap ("Runner command
# deadline exceeded") with the target on screen. A deterministic bug still fails both
# attempts; a flaky one can pass the retry, so read a retried pass in the summary.
agent-device test "${flows[@]}" --maestro --platform ios --udid "$SIMULATOR_UDID" --retries 1 \
  --artifacts-dir "$MAESTRO_DIR/../.agent-device/test-artifacts"
