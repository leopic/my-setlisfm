#!/bin/bash
# Runs Maestro E2E tests with empty database.
# Usage: ./run-empty.sh [flow-file]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MAESTRO_DIR="$SCRIPT_DIR/.."

# Clear the database
"$SCRIPT_DIR/seed-db.sh" --clear

# Run empty-state flows
if [ $# -gt 0 ]; then
  maestro test "$@"
else
  maestro test "$MAESTRO_DIR/00-dashboard-empty.yaml"
fi
