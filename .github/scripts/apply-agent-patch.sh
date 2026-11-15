#!/usr/bin/env bash
# Usage: apply-agent-patch.sh PATCH
# Stages the agent's patch in the current git checkout, but only if it changes regular files
# under src/ and app/. Anything else (workflow files, .eas/, any package.json, config,
# dotfiles such as .babelrc.js or .gitattributes, symlinks, executables, submodules) can run code in CI
# or on EAS, or hide changes, before a human looks, so it fails.
# Exits 0 when the patch is staged, 1 when it is refused, 3 when it is empty.
set -euo pipefail

patch=$1
max_bytes=1000000

# Prints the paths that are not allowed. No `grep -q` in a pipe: with pipefail, a long list
# makes the writer die of SIGPIPE once grep stops reading, and the check passes.
refused_paths() {
  grep -vE '^(src|app)/' <<<"$1" || true
  grep -E '(^|/)\.' <<<"$1" || true
  # Babel and other tools read config from a package.json in any folder.
  grep -E '(^|/)package\.json$' <<<"$1" || true
}

if [ ! -s "$patch" ]; then
  echo "The patch is empty."
  exit 3
fi
if [ "$(wc -c < "$patch")" -gt "$max_bytes" ]; then
  echo "::error::The patch is larger than $max_bytes bytes."
  exit 1
fi

# Check the paths in the patch before anything is written.
paths=$(git apply --numstat -z "$patch" | tr '\0' '\n' | awk -F'\t' '(NF==3 || NF==1) && $NF!="" {print $NF}')
refused=$(refused_paths "$paths")
if [ -z "$paths" ] || [ -n "$refused" ]; then
  echo "::error::The patch changes files outside src/ and app/, or dotfiles:"
  head -20 <<<"$refused" | sed 's/^/  /'
  exit 1
fi

git apply --index --whitespace=nowarn "$patch"

# Check again what git staged: names (old and new side of every change) and file modes.
staged=$(git diff --cached --name-only --no-renames)
if [ -z "$staged" ] || [ -n "$(refused_paths "$staged")" ]; then
  echo "::error::The staged change touches files outside src/ and app/, or dotfiles."
  exit 1
fi
# :old_mode new_mode ... Only regular, non-executable files (or a deletion) are allowed.
modes=$(git diff --cached --raw --no-renames | awk '{print $2}' | sort -u)
if [ -n "$(grep -vE '^(100644|000000)$' <<<"$modes" || true)" ]; then
  echo "::error::The patch adds a symlink, an executable or a submodule."
  exit 1
fi
