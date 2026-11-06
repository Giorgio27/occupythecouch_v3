#!/usr/bin/env bash
# Stop hook: before Claude finishes a turn, type-check the project if any
# .ts/.tsx file has uncommitted changes. Exit 2 sends the errors back to
# Claude so it fixes them instead of stopping.

input=$(cat)

# Claude is already continuing because of this hook: don't block again, to
# avoid an endless loop when an error can't be fixed.
if printf '%s' "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

changed=$( { git diff --name-only HEAD; git ls-files --others --exclude-standard; } 2>/dev/null | grep -E '\.tsx?$')
[ -z "$changed" ] && exit 0

if ! output=$(npx --no-install tsc --noEmit --pretty false 2>&1); then
  echo "npx tsc --noEmit failed. Fix these errors before finishing:" >&2
  printf '%s\n' "$output" | head -n 40 >&2
  exit 2
fi

exit 0
