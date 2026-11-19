#!/usr/bin/env bash
# Runs the checks CI runs on a PR, so a push fails here in under a minute instead of on CI.
# The pre-push hook calls it (`yarn verify`). Like CI, every check runs even after one fails,
# then a summary lists the failures. workflowPolicy.test.ts keeps this list in step with
# ci.yml and expo-doctor.yml. Not here: Maestro (simulator; see CLAUDE.md) and the
# GitHub-side checks (CodeQL, native fingerprint).
set -u

# CI uses the Node version in .nvmrc. Git hooks start without nvm, so load it here.
nvm_sh="${NVM_DIR:-$HOME/.nvm}/nvm.sh"
if [ -s "$nvm_sh" ]; then
  # shellcheck source=/dev/null
  . "$nvm_sh" && nvm use --silent >/dev/null || echo "verify: nvm could not switch to the .nvmrc Node version" >&2
elif [ "$(node -p 'process.versions.node.split(".")[0]')" != "$(cat .nvmrc)" ]; then
  echo "verify: Node $(node -v) is not the .nvmrc version ($(cat .nvmrc)) that CI uses" >&2
fi

# The checks read the working tree; uncommitted edits are checked but not pushed.
git diff --quiet HEAD || echo "verify: uncommitted changes are checked too, but they are not in the push" >&2

# React Doctor and the Expo Doctor rule diff against origin/main; a stale copy would scan too
# much or too little. Offline, the local copy still works.
git fetch --quiet origin main || echo "verify: could not fetch origin/main, using the local copy" >&2

failed=()
check() {
  local name=$1
  shift
  echo "▶ $name"
  if "$@"; then echo "✔ $name"; else echo "✘ $name"; failed+=("$name"); fi
}

bundle_dir=$(mktemp -d)
trap 'rm -rf "$bundle_dir"' EXIT

check Install yarn install --immutable
check Lint yarn lint
check Test yarn test
check Typecheck npx tsc --noEmit
check "React Doctor" yarn react-doctor --scope changed --base origin/main --blocking warning --no-score --no-supply-chain
check Bundle npx expo export --platform ios --output-dir "$bundle_dir"

# Same paths as expo-doctor.yml: it calls the Expo API, so it runs only for dependency changes.
if ! git diff --quiet origin/main... -- package.json yarn.lock app.config.js; then
  check "Expo Doctor" npx expo-doctor
fi

if [ ${#failed[@]} -gt 0 ]; then
  echo "verify: failed: ${failed[*]}" >&2
  exit 1
fi
echo "verify: all checks passed"
