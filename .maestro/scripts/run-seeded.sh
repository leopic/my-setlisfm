#!/bin/bash
# Runs Maestro E2E tests with seeded database.
# Usage: ./run-seeded.sh [flow-file]
#
# If no flow file given, runs all flows EXCEPT 00-* (empty state flows).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.."

# Seed and test the same simulator ($SIMULATOR_UDID, or the one booted simulator with the app).
SIMULATOR_UDID=$("$SCRIPT_DIR/pick-simulator.sh")
export SIMULATOR_UDID

# Seed the database
"$SCRIPT_DIR/seed-db.sh"

# Run flows
if [ $# -gt 0 ]; then
  maestro --device "$SIMULATOR_UDID" test "$@"
else
  maestro --device "$SIMULATOR_UDID" test "$MAESTRO_DIR" --exclude-tags=empty-state
fi
