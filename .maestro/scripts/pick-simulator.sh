#!/bin/bash
# Prints the UDID of the simulator to seed and test on: $SIMULATOR_UDID when set, else the
# one booted simulator that has the app's database. With none or several it stops and says
# which, so the seed and the flows never land on different simulators.
# Usage: ./pick-simulator.sh

set -euo pipefail

DB_NAME="setlistfm.db"

# True when the simulator's folder holds the app's database (the app ran there once).
has_app() {
  [ -n "$(find ~/Library/Developer/CoreSimulator/Devices/"$1" -path "*/SQLite/$DB_NAME" \
    -not -path "*/ExponentExperienceData/*" -print -quit 2>/dev/null)" ]
}

if [ -n "${SIMULATOR_UDID:-}" ]; then
  if ! has_app "$SIMULATOR_UDID"; then
    echo "Error: SIMULATOR_UDID=$SIMULATOR_UDID has no app database. Is the UDID right, and has the app run there once?" >&2
    exit 1
  fi
  echo "$SIMULATOR_UDID"
  exit 0
fi

# "<udid> <name>" per booted simulator.
BOOTED=$(xcrun simctl list devices booted -j | python3 -c "
import sys, json
for devices in json.load(sys.stdin)['devices'].values():
    for d in devices:
        if d['state'] == 'Booted':
            print(d['udid'], d['name'])
")

WITH_APP=""
while read -r udid name; do
  [ -z "$udid" ] && continue
  if has_app "$udid"; then
    WITH_APP+="$udid $name"$'\n'
  fi
done <<< "$BOOTED"

COUNT=$(printf '%s' "$WITH_APP" | grep -c . || true)

if [ "$COUNT" -eq 1 ]; then
  printf '%s' "$WITH_APP" | cut -d' ' -f1
  exit 0
fi

if [ "$COUNT" -eq 0 ]; then
  echo "Error: no booted simulator has the app's database. Install the app and launch it once." >&2
else
  echo "Error: several booted simulators have the app; pick one with SIMULATOR_UDID:" >&2
  printf '%s' "$WITH_APP" | sed 's/^/  /' >&2
  echo "e.g. SIMULATOR_UDID=$(printf '%s' "$WITH_APP" | head -1 | cut -d' ' -f1) yarn test:e2e" >&2
fi
exit 1
