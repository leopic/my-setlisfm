#!/bin/bash
# Seeds the app's SQLite database on the iOS simulator with test data.
# Usage: ./seed-db.sh [--clear]
#
# --clear: Remove all data (for empty-state tests)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SEED_SQL="$SCRIPT_DIR/../fixtures/seed.sql"
SCHEMA_SQL="$SCRIPT_DIR/../../src/database/schema.ts"
APP_ID="com.setlistfm.tracker"
DB_NAME="setlistfm.db"

# Find the booted simulator
DEVICE_ID=$(xcrun simctl list devices booted -j | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data['devices'].items():
    for d in devices:
        if d['state'] == 'Booted':
            print(d['udid'])
            sys.exit(0)
print('', end='')
")

if [ -z "$DEVICE_ID" ]; then
  echo "Error: No booted simulator found" >&2
  exit 1
fi

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
