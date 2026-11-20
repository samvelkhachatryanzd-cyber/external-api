#!/usr/bin/env bash
# Probe the live Companies House API for one company number without ever printing the API key.
# Usage: probe.sh <company number> [--officers]
# Reads COMPANIES_HOUSE_API_KEY / COMPANIES_HOUSE_URL from backend/.env (override the file with ENV_FILE=...).
set -euo pipefail

raw="${1:-}"
[ -n "$raw" ] || { echo "usage: probe.sh <company number> [--officers]" >&2; exit 64; }
officers=false
[ "${2:-}" = "--officers" ] && officers=true

root=$(git rev-parse --show-toplevel)
envfile="${ENV_FILE:-$root/backend/.env}"
[ -f "$envfile" ] || { echo "No env file at $envfile (copy backend/.env.example)." >&2; exit 1; }

read_var() { grep -E "^$1=" "$envfile" | tail -1 | cut -d= -f2- | tr -d '\r"' || true; }
key=$(read_var COMPANIES_HOUSE_API_KEY)
base=$(read_var COMPANIES_HOUSE_URL)
base="${base:-https://api.company-information.service.gov.uk}"
base="${base%/}"
[ -n "$key" ] || { echo "COMPANIES_HOUSE_API_KEY is empty in $envfile. Companies House calls cannot work." >&2; exit 1; }

# Same normalisation as normalizeNumber() in backend/src/services/companiesHouse.client.js
number=$(printf '%s' "$raw" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
if [[ "$number" =~ ^[0-9]+$ ]]; then
  number=$(printf '%8s' "$number" | tr ' ' 0)
fi
echo "input:      $raw"
echo "normalised: $number"

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

# The key goes to curl on stdin, so it never appears in the process list or in output.
fetch() {
  printf 'user = "%s:"\n' "$key" | curl -sS -K - --max-time 10 -H 'Accept: application/json' \
    -o "$tmp" -w '%{http_code}' "$base$1" 2>/dev/null || true
}

code=$(fetch "/company/$number")
code="${code:-000}"
echo "profile:    HTTP $code"

case "$code" in
  200)
    jq '{name: .company_name, number: .company_number, status: .company_status, type: .type,
         created: .date_of_creation, office: .registered_office_address}' "$tmp"
    ;;
  404) echo "=> company is not on the register (a genuine finding)" ;;
  401) echo "=> key rejected: our configuration problem, not a statement about the company" ;;
  429) echo "=> rate limited (600 requests / 5 min per key): retry later, not a statement about the company" ;;
  000) echo "=> no response (network error or 10 s timeout): register unavailable, not a statement about the company" ;;
  *)   echo "=> unexpected status: treat as register unavailable, not a statement about the company" ;;
esac

if $officers && [ "$code" = "200" ]; then
  code=$(fetch "/company/$number/officers?items_per_page=100&start_index=0")
  code="${code:-000}"
  echo "officers:   HTTP $code"
  if [ "$code" = "200" ]; then
    jq '{total_results, shown: (.items | length),
         current_directors: [.items[] | select((.officer_role | endswith("director")) and (.resigned_on | not))
                              | {name, officer_role, appointed_on}]}' "$tmp"
  fi
fi
