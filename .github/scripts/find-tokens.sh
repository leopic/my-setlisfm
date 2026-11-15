#!/usr/bin/env bash
# Usage: find-tokens.sh FILE...
# Exits 1 if a file holds something that looks like a token, 2 if a scan fails, else 0.
# For each hit it prints up to 5 lines of the text before the match, with the match cut off
# and any run of 8+ token characters hidden. The text can be untrusted (issue text, agent
# output): stop-commands keeps any "::" line in it inert in a GitHub Actions log.
# It catches accidental leaks, not an agent that encodes a token on purpose.
set -u

found=0
marker=$(openssl rand -hex 16)
for file in "$@"; do
  while IFS='=' read -r name pattern; do
    grep -qE "$pattern" "$file"; status=$?
    if [ "$status" -ge 2 ]; then
      echo "::warning::The scan of $(basename "$file") for a $name failed."
      [ "$found" -eq 1 ] || found=2
    elif [ "$status" -eq 0 ]; then
      found=1
      echo "::warning::$(basename "$file") contains a $name."
      echo "::stop-commands::$marker"
      grep -oE ".{0,60}($pattern)" "$file" | head -5 \
        | sed -E -e "s#($pattern).*#@@#" -e 's#[A-Za-z0-9_+/=-]{8,}#[HIDDEN]#g' \
          -e 's#^[A-Za-z0-9_+/=-]+#…#' -e 's#@@$#[REDACTED]#' -e 's#^#  #'
      echo "::$marker::"
    fi
  done <<'PATTERNS'
Claude token=sk-ant-[A-Za-z0-9_-]{10,}
GitHub token=gh[pousr]_[A-Za-z0-9]{20,}
GitHub fine-grained token=github_pat_[A-Za-z0-9_]{11,}
JWT=eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}
git URL with a token=x-access-token:
PATTERNS
done
exit "$found"
