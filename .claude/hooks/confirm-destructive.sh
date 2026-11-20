#!/usr/bin/env bash
# PreToolUse (Bash): ask before commands that destroy database data or rewrite git history.
input=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")

reason=""
case "$cmd" in
  *"db:reset"* | *"db:migrate:undo"*)
    reason="This drops or rolls back database tables and loses all application data (and any stored Companies House results)." ;;
  *"docker compose down -v"* | *"docker compose down --volumes"* | *"docker volume rm"*)
    reason="This deletes the MySQL data volume." ;;
  *"git reset --hard"* | *"git push --force"* | *"git push -f "* | *"git clean -f"*)
    reason="This discards work or rewrites history; commits are reviewed step by step in this repo." ;;
esac

if [ -n "$reason" ]; then
  jq -n --arg r "$reason" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:$r}}'
fi
exit 0
