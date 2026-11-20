#!/usr/bin/env bash
# Stop: if frontend sources changed in the working tree, make sure the production build still passes.
root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
cd "$root" || exit 0

# Avoid loops: if a stop hook already blocked this turn, let it finish.
[ "$(jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0

git status --porcelain -- frontend/src frontend/index.html frontend/vite.config.js frontend/package.json | grep -q . || exit 0
[ -d frontend/node_modules ] || exit 0

if ! out=$(cd frontend && npx vite build --logLevel error 2>&1); then
  echo "Frontend build failed:" >&2
  echo "$out" | tail -30 >&2
  exit 2
fi
exit 0
