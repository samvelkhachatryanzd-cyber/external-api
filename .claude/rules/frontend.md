---
paths:
  - "frontend/src/**"
  - "frontend/index.html"
---

# Frontend rules

- Plain JS + JSX, ESM, React 19 function components with hooks. No TypeScript, state library, UI kit or CSS framework. Routing is React Router.
- One default-exported component per `.jsx` file, named like the file. Import with explicit extensions (`./api.js`).
- All HTTP goes through `apiJson` in `src/api.js` (paths relative to `/api`). Errors surface as `Error.message` and are shown in `<p className="error">`.
- Fetching effects use the `let active = true` cleanup pattern and reset dependent state when their inputs change.
- Per-action flags (`saving`, `comparing`) disable buttons and change the label while pending.
- Styles go in `src/styles.css` using the existing class vocabulary (`card`, `row`, `columns`, `tabs`, `badge <status>`, `warnings`, `plain`, `pager`, `danger`, `error`, `status`). Add new classes there. No inline style objects.
- Routes are declared only in `App.jsx`. Import router APIs from `'react-router'`. Pages read the URL with `useParams` / `useSearchParams` instead of taking navigation props, and use `Link` / `useNavigate` to move. List filters (tab, page) belong in the query string, not in component state.
- Pass the list's query string to child pages in `location.state.from` so their back link restores the tab and page.
- Keep field limits (`maxLength`, `required`) in step with `backend/src/validators/applications.validator.js`.
- Verify with `npm run build` in `frontend/`. For UI changes, also run the dev server against the API and exercise the page.
