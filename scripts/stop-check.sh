#!/usr/bin/env bash
# Stop hook: block finishing if typecheck or lint fail. Exit 2 feeds the output back to Claude.
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/.." || exit 0
[ -d node_modules ] || exit 0
out=$( { npm run --silent typecheck && npm run --silent lint; } 2>&1 )
status=$?
if [ $status -ne 0 ]; then
  printf 'Typecheck or lint failed. Fix these before finishing:\n%s\n' "$out" >&2
  exit 2
fi
exit 0
