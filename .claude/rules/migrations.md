---
paths:
  - "backend/migrations/**"
  - "backend/src/models/**"
  - "backend/scripts/seed.js"
---

# Database rules

- Migrations are named `YYYYMMDDHHMMSS-verb-noun.js` (existing: `20261112100000-create-applications.js`) and are later than every existing one.
- Never edit a committed migration (a hook blocks it). A schema change is a new migration with a working `down`.
- Use `'use strict';` and `async up(queryInterface, Sequelize)` / `async down(queryInterface)`.
- Columns are snake_case in migrations. `created_at` has `defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')`. The `applications` model has `updatedAt: false`; keep timestamps consistent with it unless you have a reason.
- New columns on `applications` must be nullable or have a default, because `scripts/seed.js` inserts raw rows and existing rows must survive the migration.
- Register-derived data (what Companies House returned, when it was fetched, whether the check succeeded) is audit evidence. Store the raw payload (MySQL `JSON`) plus a `fetched_at` timestamp, and never overwrite a snapshot that a decision was based on. Add a new row or version instead. A failed fetch is stored as a failed check with its reason, never as "company missing".
- The model mirrors the migration exactly: types, lengths, nullability, enum values, `field:` for non-trivial snake_case names, `tableName`, `underscored: true`.
- After schema changes run `npm run db:migrate` in `backend/`, then check `npm run db:seed` on an empty DB. `db:reset` destroys data, so ask first (a hook prompts).
