#!/bin/bash
# Runs Maestro E2E tests with empty database.
# Usage: ./run-empty.sh [flow-file]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.."

# Seed and test the same simulator ($SIMULATOR_UDID, or the one booted simulator with the app).
SIMULATOR_UDID=$("$SCRIPT_DIR/pick-simulator.sh")
export SIMULATOR_UDID

# Clear the database
"$SCRIPT_DIR/seed-db.sh" --clear

# Run empty-state flows
if [ $# -gt 0 ]; then
  maestro --device "$SIMULATOR_UDID" test "$@"
else
  maestro --device "$SIMULATOR_UDID" test "$MAESTRO_DIR" --include-tags=empty-state
fi
