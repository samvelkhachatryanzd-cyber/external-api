# business-onboarding

Business onboarding app of a payments company. UK companies apply for a business account; compliance staff approve or reject each application after checking the company against the UK company register (Companies House). `README.md` is the source of truth for product behaviour, endpoints, env vars and the integration task — read it before changing behaviour.

## Layout

| Path | What | Details |
|---|---|---|
| `backend/` | Express 5 API (Node, CommonJS), Sequelize 6 + MySQL 8.4 | `backend/CLAUDE.md` |
| `frontend/` | React 19 + React Router + Vite 8 SPA (ESM, plain JS/JSX, plain CSS) | `frontend/CLAUDE.md` |
| `.claude/` | Hooks, rules, skills and subagents for this repo | see below |

There is no monorepo tooling: `backend/` and `frontend/` each have their own `package.json` and `node_modules`. There is no root `package.json`. No test runner, linter or formatter is configured — do not assume `npm test` or `npm run lint` exist.

## Running it

```bash
# API (from backend/)
cp .env.example .env && docker compose up -d --wait
npm install && npm run db:migrate && npm run db:seed
npm run dev            # nodemon; `npm start` for plain node. http://localhost:4000

# Frontend (from frontend/)
npm install && npm run dev   # http://localhost:5173, proxies /api -> :4000
npm run build                # the only automated frontend check available
```

`/run-app` skill automates the above. `npm run db:reset` wipes all data (a hook asks for confirmation).

## Cross-cutting conventions

- JSON field names are camelCase on the wire and in Sequelize models; DB columns are snake_case (`underscored: true`, explicit `field:` on digit-suffixed columns like `address_line_1`).
- Errors cross the API as `{"error": "...", "details": [...]}` with 400/404/409 (and 429/502/503 for Companies House). The frontend `apiJson` turns that into `Error(message + details)`; keep that contract when adding endpoints.
- Style (matches existing code, no formatter enforces it): 2-space indent, single quotes, semicolons, trailing commas in multiline literals (ES5 style), ~120-column lines, `const`/arrow functions, early returns over nesting.
- Comments are rare; code is expected to be self-explanatory. Don't add narration comments.
- Secrets live only in `backend/.env` (gitignored). Never commit it, never print `COMPANIES_HOUSE_API_KEY`.

## Working agreements

- Commit in small, focused steps (the history is reviewed). Use the `git-workflow` skill. Commit messages use Conventional Commits (`feat(api): paginate the applications list`): imperative, lowercase summary, 72 characters or fewer, trailing co-author line when Claude wrote it.
- Don't edit an already-committed migration; add a new one (a hook blocks it). Don't hand-edit `package-lock.json`.
- Companies House failures must never be recorded as facts about the company: a timeout, 429, 5xx or missing key is "unknown / check failed", never "not found" or "inactive". Only a real 404 means the company does not exist on the register. See `.claude/rules/companies-house.md`.
- **Never modify `README.md`.** It is read-only for Claude: no edits, no rewrites, no appended sections, whatever the task (new endpoints, env vars, pages, integration decisions). Reading it is fine. Put the information in your reply to the user instead, and keep env vars documented in `backend/.env.example`. A hook blocks edits to it, so don't try to work around it (no `sed -i`, redirects or other shell writes).

## `.claude/` contents

- `settings.json` — permissions and hooks (`hooks/*.sh`): block edits to `.env`, `README.md`, lockfiles and committed migrations; `node --check` on edited backend files; confirm before destructive DB commands.
- `rules/` — path-scoped guidance (backend, migrations, frontend, Companies House) loaded when matching files are touched.
- `skills/` — `/add-endpoint`, `/add-migration`, `/run-app`, `/check-company` (live Companies House probe).
- `agents/` — `convention-reviewer` (diff vs. repo conventions), `ch-integration-reviewer` (failure-handling audit of Companies House code).
