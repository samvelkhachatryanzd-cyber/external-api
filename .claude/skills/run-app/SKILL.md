---
name: run-app
description: Start MySQL, the API and the frontend dev server and confirm they are healthy. Use when asked to run the app, or to see a change working end to end.
disable-model-invocation: true
---

# Run the app

Ports: MySQL `3311`, API `4000`, frontend `5173`. Never print the contents of `backend/.env`.

## Steps

1. **Env file**: if `backend/.env` is missing, `cp backend/.env.example backend/.env`. Tell the user if `COMPANIES_HOUSE_API_KEY` is empty. Companies House calls will then fail with 502, which is expected, and the user must add their own key.
2. **Database**: `cd backend && docker compose up -d --wait`.
3. **Dependencies**: run `npm install` in `backend/` and `frontend/` only when their `node_modules` is missing.
4. **Schema and data**: `npm run db:migrate`. Run `npm run db:seed` only if `applications` is empty (the seed refuses otherwise). Never run `db:reset` without asking.
5. **API**: start `npm run dev` in `backend/` in the background (`run_in_background`). Check `curl -s http://localhost:4000/health` returns `{"ok":true}`.
6. **Frontend**: start `npm run dev` in `frontend/` in the background. Check `curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/` returns 200 and `curl -s "http://localhost:5173/api/applications?status=new"` returns JSON with an `items` array (proves the Vite proxy works).
7. Report the URLs and anything that failed, with the error output. If port 3311 is taken, tell the user to change `DB_PORT` in `backend/.env` before `docker compose up`.

## Stopping

Stop the background tasks. `docker compose stop` in `backend/` stops MySQL and keeps the data. `docker compose down -v` deletes it, so ask first.
