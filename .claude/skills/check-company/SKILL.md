---
name: check-company
description: Probe the live Companies House API for a company number (or an application id) and show how the app would map and compare it. Use when debugging the integration, verifying the API key, or checking how a messy company number resolves.
argument-hint: "<company number | application id>"
disable-model-invocation: true
---

# Check a company against Companies House

Input: $ARGUMENTS

Files in this skill:

- `scripts/probe.sh <number> [--officers]` calls the live register. It reads the key from `backend/.env` itself, passes it to curl on stdin, and prints only status, name, number, type, creation date, registered office and (with `--officers`) current directors. **Use it instead of writing your own curl**, so the key never reaches the transcript.
- `references/response-shapes.md` has the payload shapes, the register-to-internal field mapping and the company-number formats. Read it when interpreting output or checking the mapping.
- `.claude/rules/companies-house.md` has the failure semantics (what each HTTP status means for the company).

## Steps

1. **Resolve the input.** A company number (letters and digits, possibly with spaces, such as `445790` or `ni 615045`) goes straight to step 3. An application id means fetching the application first: `curl -s localhost:4000/api/applications/<id>` (needs the API running; use the `/run-app` skill). Take `companyNumber` from the response.
2. **If the user wants the app's own view** (mapping and mismatches) and the API is running, call `curl -s localhost:4000/api/applications/<id>/compare`. This exercises the real code path of client, mapping and comparison, so compare its output with the raw probe from step 3 if they disagree.
3. **Probe the register:** `.claude/skills/check-company/scripts/probe.sh "<number>"`, adding `--officers` when directors matter. The script prints the normalised number (padded, uppercased, spaces stripped, the same as `normalizeNumber` in `companiesHouse.client.js`), the HTTP status and a one-line verdict.
4. **Interpret the status** using the rule's failure table. Only 404 means the company is not on the register. 401, 429, 5xx and no response are failures of the check and say nothing about the company. Never describe them as "company not found" or "inactive".
5. **Report**: the normalised number, the HTTP status, register values next to what the application has, and the differences. If the script says the key is empty or missing, stop and tell the user. Never print or ask for the key.

Keep to a handful of requests per run. The limit is 600 per 5 minutes per key, and each check costs 2 or more.
