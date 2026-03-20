#!/bin/bash
# Runs Maestro E2E tests with seeded database.
# Usage: ./run-seeded.sh [flow-file]
#
# If no flow file given, runs all flows EXCEPT 00-* (empty state flows).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.."

# Seed the database
"$SCRIPT_DIR/seed-db.sh"

# Run flows
if [ $# -gt 0 ]; then
  maestro test "$@"
else
  maestro test "$MAESTRO_DIR" --exclude-tags=empty-state
fi
