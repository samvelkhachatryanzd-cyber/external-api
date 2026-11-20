#!/usr/bin/env bash
# PreToolUse (Edit|Write): block edits to secrets, README.md, lockfiles and already-committed migrations.
input=$(cat)
file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
[ -z "$file" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
rel="${file#"$root"/}"

deny() {
  echo "$1" >&2
  exit 2
}

case "$rel" in
  backend/.env | .env | */.env)
    deny "Blocked: $rel holds secrets (COMPANIES_HOUSE_API_KEY, DB credentials). Edit backend/.env.example instead and tell the user what to put in .env." ;;
  README.md)
    deny "Blocked: README.md is read-only for Claude. Don't edit it; put the information in your reply to the user instead." ;;
  */package-lock.json | package-lock.json)
    deny "Blocked: don't hand-edit $rel. Change package.json and run npm install in the package folder." ;;
  backend/migrations/*.js)
    if git -C "$root" ls-files --error-unmatch "$rel" >/dev/null 2>&1; then
      deny "Blocked: $rel is already committed. Never edit an applied migration; add a new one (see the add-migration skill)."
    fi ;;
esac
exit 0
