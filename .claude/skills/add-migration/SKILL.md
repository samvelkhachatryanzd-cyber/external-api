---
name: add-migration
description: Add a database migration and keep the Sequelize model and seed script in sync. Use when adding or changing tables or columns, for example to store Companies House check results.
argument-hint: "<what changes in the schema>"
---

# Add a migration

Schema change: $ARGUMENTS

Work from `backend/`. Existing migration to copy the style from: `migrations/20261112100000-create-applications.js`.

## Templates

Copy and adapt these, don't write from scratch. They are valid JS with example columns (stored Companies House checks), and were verified with `up` and `down` against MySQL.

- `templates/create-table.js`: new table with a foreign key to `applications`, an `ENUM`, `JSON` payload columns, `fetched_at`, `created_at` and an index.
- `templates/add-column.js`: nullable or defaulted columns added to an existing table, with a `down` that reverses them.
- `templates/model.js`: the Sequelize model matching `create-table.js`, including `associate`.

## Steps

1. **Name**: `migrations/YYYYMMDDHHMMSS-<verb>-<noun>.js` with a timestamp later than every existing file (`ls migrations`). Example: `20261113120000-create-company-checks.js`.
2. **Write the migration** with `'use strict';` and `module.exports = { async up(queryInterface, Sequelize) {...}, async down(queryInterface) {...} };`.
   - Columns are snake_case; ids are `INTEGER.UNSIGNED` with `autoIncrement`/`primaryKey` as in `applications`.
   - `created_at` uses `defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')`.
   - New columns on `applications` must be nullable or have a default so existing rows and `scripts/seed.js` keep working.
   - Use `Sequelize.JSON` for raw register payloads and a `DATE` column (`fetched_at`) for when they were fetched. Add foreign keys with `references` and an index on columns you filter by.
   - `down` must fully reverse `up`.
3. **Model** (`src/models/*.js`): mirror types, lengths, nullability and enum values exactly. Keep `tableName`, `underscored: true`, and use `field:` for names like `address_line_1`. For a new table, create a new model file (auto-loaded by `models/index.js`) and add `associate(db)` if it relates to `Application`.
4. **Seed** (`scripts/seed.js`): update only if a new column needs a value for the seeded rows.
5. **Docs**: if a new env var is involved, update `backend/.env.example`. Never edit `README.md`; describe the change in your reply instead.
6. Never edit a committed migration; a hook blocks it.

## Verify

- `node --check` the new files.
- Ensure Docker MySQL is up (`docker compose ps`), then `npm run db:migrate`.
- Test the rollback too: `npx sequelize-cli db:migrate:undo`, then migrate again. Ask the user before running `npm run db:reset`, because it destroys data (a hook will prompt).
- Report what ran and the outcome.
