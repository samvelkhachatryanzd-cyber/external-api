#!/usr/bin/env bash
# PostToolUse (Edit|Write): syntax-check edited backend JS (there is no linter or test suite).
input=$(cat)
file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
case "$file" in
  */backend/*.js)
    case "$file" in */node_modules/*) exit 0 ;; esac
    [ -f "$file" ] || exit 0
    if ! out=$(node --check "$file" 2>&1); then
      echo "Syntax error in $file:" >&2
      echo "$out" >&2
      exit 2
    fi ;;
esac
exit 0
