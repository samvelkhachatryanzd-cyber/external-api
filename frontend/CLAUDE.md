# frontend

React 19 + Vite 8 single-page app for compliance staff. ESM (`"type": "module"`), plain JavaScript with JSX — no TypeScript, no state library, no UI kit, no CSS framework. Routing uses React Router. Product context: `../README.md`.

## Commands (run from `frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173; `/api` is proxied to `http://localhost:4000` (`vite.config.js`) |
| `npm run build` | Production build into `dist/` (gitignored). The only automated check — run it after changes |
| `npm run preview` | Serve the build on http://localhost:4173 (same `/api` proxy) |

There are no tests and no linter. The API must be running for anything to load.

## Structure

```
index.html            mounts #root, loads /src/main.jsx
src/main.jsx          createRoot + StrictMode, imports styles.css
src/App.jsx           header + <Routes> table (the only place routes are declared)
src/ApplicationsList.jsx   status tabs + table + pager; tab and page live in the URL query; fetches /applications
src/ApplicationPage.jsx    one application: details, "Compare" with Companies House, approve / reject
src/NewApplication.jsx     form that stands in for the public applicant form (POST /applications)
src/NotFound.jsx      fallback for unknown URLs
src/api.js            apiJson(path, options): fetch wrapper for `/api`, throws Error(message + details)
src/format.js         display helpers (dateTime)
src/styles.css        all styling, single global stylesheet
```

## Conventions

- **Components**: one default-exported function component per file, filename = component name in PascalCase with `.jsx`; imports include the extension (`'./api.js'`, `'./ApplicationPage.jsx'`). Hooks only (`useState`, `useEffect`); no class components, no context, no Redux.
- **Routing** is React Router (`react-router`, `BrowserRouter` in `main.jsx`, routes in `App.jsx`): `/` redirects to `/applications`, then `/applications` (list), `/applications/new` and `/applications/:id`; anything else renders `NotFound`. Add a page by adding a `<Route>` in `App.jsx`. Page components take no navigation props: they read the URL with `useParams` / `useSearchParams` and navigate with `Link` / `useNavigate`. Import from `'react-router'`, not `react-router-dom`. Vite's dev and preview servers already fall back to `index.html` for deep links; `/api` stays proxied.
- **Data fetching**: always through `apiJson` from `api.js` — never raw `fetch('/api...')` in components. Paths are relative to `/api` (`apiJson('/applications/1')`). Body is passed as `JSON.stringify(...)`; the helper sets `Content-Type`.
- **Effects that fetch** guard against stale responses (`let active = true` … cleanup sets `false`) and reset dependent state when the id/filter changes, as in `ApplicationsList.jsx`.
- **UI state per request**: `loading`-style flag (`saving`, `comparing`) disables the button and swaps the label (`'Comparing...'`); errors are stored as a message string and rendered as `<p className="error">`; loading renders `<p className="status">Loading...</p>`.
- **Lists are paginated** by the API (`{ items, total, page, limit }`, 30 per page). The tab and page live in the URL (`/applications?status=approved&page=2`, `page` omitted for 1), so refresh and shared links work. Invalid values fall back to the defaults. Changing tab resets to page 1. Use the `.pager` class for Previous/Next controls.
- **Returning to the list**: pages that are reached from the list carry the list's query string in `location.state.from`, and their back link goes to `/applications${from}`, so the tab and page are kept. A deep link with no state falls back to `/applications`.
- **Server field names** are used as-is (camelCase: `companyNumber`, `addressLine1`, `decidedAt`). Don't rename or reshape in the client except for display.
- **Forms**: controlled inputs, `onSubmit` with `event.preventDefault()`, field list as a `FIELDS` constant mapped to `<label>`/`<input>`, HTML `required`/`maxLength` mirroring backend validator limits.
- **Styling**: plain classes in `styles.css` (`card`, `row`, `columns`, `tabs`, `badge <status>`, `warnings`, `plain`, `pager`, `danger`, `error`, `status`). Reuse existing classes before adding new ones; no inline style objects, no CSS-in-JS. Status badges use the status string as a class (`badge approved`).
- **Dates**: display with `dateTime()` from `format.js`; add new formatters there.
- Style: 2-space indent, single quotes, semicolons, JSX props double-quoted, `const` + arrow/function declarations, `.filter(Boolean).join(', ')` to compose addresses.
- Don't add dependencies without being asked; the dependency list is deliberately just react, react-dom, react-router, vite and the React plugin.

## Companies House UI

`ApplicationPage.jsx` calls `GET /applications/:id/compare` on a "Compare" click and renders the register's company (name, number, status, type, created date, registered office, current directors) next to the application in a two-column layout, with `mismatches` listed as warnings (`warningText` + `FIELD_LABELS`). Rules to keep when extending it:

- Show register data side by side with what the applicant typed, with differences obvious.
- A failed check (timeout, rate limit, unavailable, no key) is shown as an error message ("check failed, try again"), never rendered as "company not found" or "inactive". Only an explicit 404 from the compare endpoint means the company was not found on the register.
- Show the time the data was fetched once it's persisted by the backend.
- The "Look up on Companies House" link (`REGISTER_URL`) stays as a manual fallback.
