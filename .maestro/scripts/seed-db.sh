#!/bin/bash
# Seeds the app's SQLite database on the iOS simulator with test data.
# Usage: ./seed-db.sh [--clear]
# Set SIMULATOR_UDID to choose the simulator when several are booted.
#
# --clear: Remove all data (for empty-state tests)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_SQL="$SCRIPT_DIR/../fixtures/seed.sql"
SCHEMA_SQL="$SCRIPT_DIR/../../src/database/schema.ts"
APP_ID="com.leopicado.chronicles"
DB_NAME="setlistfm.db"

# The simulator: $SIMULATOR_UDID, or the one booted simulator with the app.
DEVICE_ID=$("$SCRIPT_DIR/pick-simulator.sh")

# Find the app's SQLite database
DB_PATH=$(find ~/Library/Developer/CoreSimulator/Devices/"$DEVICE_ID" \
  -path "*/SQLite/$DB_NAME" -not -path "*/ExponentExperienceData/*" 2>/dev/null | head -1)

if [ -z "$DB_PATH" ]; then
  echo "Error: Database not found. Is the app installed and has been launched at least once?" >&2
  exit 1
fi

echo "Found database: $DB_PATH"

if [ "${1:-}" = "--clear" ]; then
  echo "Clearing all data..."
  sqlite3 "$DB_PATH" <<'CLEAR'
DELETE FROM songs;
DELETE FROM sets;
DELETE FROM setlists;
DELETE FROM tours;
DELETE FROM venues;
DELETE FROM cities;
DELETE FROM countries;
DELETE FROM artists;
DELETE FROM metadata;
CLEAR
  echo "Database cleared."
else
  echo "Seeding database..."
  # Clear existing data first to ensure clean state
  sqlite3 "$DB_PATH" <<'CLEAR'
DELETE FROM songs;
DELETE FROM sets;
DELETE FROM setlists;
DELETE FROM tours;
DELETE FROM venues;
DELETE FROM cities;
DELETE FROM countries;
DELETE FROM artists;
DELETE FROM metadata;
CLEAR
  # Load seed data
  sqlite3 "$DB_PATH" < "$SEED_SQL"
  echo "Database seeded with test data."
fi

# Force-quit the app so it picks up the new data on next launch
xcrun simctl terminate "$DEVICE_ID" "$APP_ID" 2>/dev/null || true
echo "App terminated. Ready for tests."
