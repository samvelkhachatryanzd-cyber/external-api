# backend

Express 5 API, Node (CommonJS — `require`/`module.exports`, no ESM, no TypeScript), Sequelize 6 on MySQL 8.4. Product context and endpoint list: `../README.md`.

## Commands (run from `backend/`)

| Command | Purpose |
|---|---|
| `npm run dev` / `npm start` | API on `PORT` (default 4000); `dev` uses nodemon |
| `docker compose up -d --wait` | MySQL on `DB_PORT` (default 3311) |
| `npm run db:migrate` | Apply migrations (sequelize-cli, config in `.sequelizerc`) |
| `npm run db:seed` | Load 300 apps from `scripts/applications.json`; refuses on a non-empty table |
| `npm run db:reset` | Undo all, migrate, seed — destroys data |
| `node --check <file>` | Only static check available (no tests, no linter) |

Config comes from `backend/.env` (copy `.env.example`). `SQL_LOG=1` prints SQL. `config/config.js` defines development/test/production blocks.

## Architecture

Strict layering, one direction: `router → controller → validator + service → model / external client`.

```
src/index.js                    app wiring: json body, /health, /api router, notFound, errorHandler; DB authenticate then listen
src/router/index.js             one line per route, handlers from controllers
src/controllers/*.controller.js thin: validate input, call a service, res.json / res.status(201).json
src/validators/*.validator.js   pure functions that throw ValidationError(message, details[]); return cleaned data
src/services/*.service.js       business logic, throws HttpError subclasses; the only layer that touches models
src/services/companiesHouse.client.js  HTTP client for Companies House (fetch + AbortSignal.timeout)
src/services/companyComparison.js      pure mapping/diff functions (register payload -> internal shape, mismatches)
src/models/*.js                 `module.exports = (sequelize, DataTypes) => ...`; auto-loaded by models/index.js
src/middleware/errorHandler.js  notFound + errorHandler (HttpError -> {error, details?}, bad JSON -> 400, else 500)
src/utils/errors.js             HttpError, ValidationError(400), NotFoundError(404), ConflictError(409), ExternalServiceError(status)
migrations/                     sequelize-cli migrations, timestamp-prefixed
scripts/                        seed.js + applications.json (deterministic seed data)
```

## Conventions

- **Controllers are async functions with no try/catch.** Express 5 forwards rejected promises to `errorHandler`. Never add `next(err)` boilerplate or `express-async-errors`.
- **Errors**: throw the `utils/errors` classes (`new NotFoundError('Application not found')`). Don't call `res.status(4xx)` for errors in controllers or services. Anything else becomes a logged 500.
- **Validation lives in validators**, not controllers or services. Collect all field errors into an array and throw one `ValidationError('Invalid body', errors)`. Trim strings, enforce max lengths that match the column sizes, return the cleaned object. Route ids go through `validate.id`.
- **Models**: camelCase attributes, `underscored: true`, `tableName` explicit, explicit `field:` for `address_line_1`-style columns. Responses return model instances directly (Sequelize serialises via `toJSON`), so every model attribute is public API — don't add attributes casually, and never put secrets in a model.
- **List endpoints are paginated**: `listQuery` returns `{ filter, page, limit }` (defaults 1 and 30, `limit` capped at 100) and the service returns `{ items, total, page, limit }` via `findAndCountAll`. Keep the `id` tie-breaker in `order` so pages are stable. Don't add an unbounded list endpoint.
- **Services re-read after write** (`createApplication` and `decide` return `getApplication(id)`), so responses reflect DB defaults. Follow that.
- **Status transitions are final**: approving/rejecting a non-`new` application throws `ConflictError('Application is already <status>')`.
- **Adding a route** = router line + controller function + validator (if input) + service function. Use the `/add-endpoint` skill.
- **Adding a column/table** = new migration + model update + (if seeded) `scripts/seed.js`. Use `/add-migration`. Migrations use raw snake_case column names; models map them.
- `process.env` is read where needed (`companiesHouse.client.js` reads key/URL per call, not at import). `dotenv` is loaded with `{ quiet: true }` in `index.js` and `config/config.js`.
- Logging: `console.error(err)` in the error handler only; don't log request bodies or the API key.
- Modules are required with relative paths, grouped: third-party first, then local. Exports are a single `module.exports = { ... }` object at the bottom of the file.

## Companies House integration

`companiesHouse.client.js` (HTTP) → `companyCheck.service.js` (orchestration) → `companyComparison.js` (pure mapping). Currently exposed as `GET /api/applications/:id/compare`, which fetches live and persists nothing. Details, failure semantics and field mapping: `../.claude/rules/companies-house.md`. Key points:

- Basic auth, API key as username, empty password. Base URL from `COMPANIES_HOUSE_URL`.
- 10 s timeout; maps 404/401/429/other to `ExternalServiceError` with a status. Officers are paginated (100/page, capped at 20 pages).
- Company numbers are normalised (`stripped, uppercased, numeric ones left-padded to 8`) before calling the register — applicants type "445790" for "00445790" or "ni 615045".
- Rate limit is 600 requests / 5 min per key; bulk work (e.g. checking the 300 existing applications) must throttle and be resumable.

## Gotchas

- `node_modules/` and `.env` are gitignored; `.env.example` is the template and must stay in sync with any new variable.
- There is a `test` config block but no tests and no `DB_TEST_NAME` setup; don't claim tests pass.
- `seed.js` inserts with explicit ids 1..300 and raw snake_case columns via `bulkInsert`; new NOT NULL columns need defaults or the seed breaks.
- `sequelize-cli` reads `seeders-path: seeders/`, which doesn't exist — seeding is `scripts/seed.js`, not `db:seed:all`.
