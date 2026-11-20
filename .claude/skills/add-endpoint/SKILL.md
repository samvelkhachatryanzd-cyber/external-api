---
name: add-endpoint
description: Add a new REST endpoint to the backend following the router → controller → validator → service layering. Use when asked to add, expose or extend an API route.
argument-hint: "<METHOD> <path> - <what it does>"
---

# Add a backend endpoint

Follow the layering used by `applications` (see `backend/CLAUDE.md`). Work in `backend/src/`. Read the existing file in each layer first and match its style (CommonJS, 2-space, single quotes, semicolons).

Request: $ARGUMENTS

`references/layers.md` maps each layer to the existing file and function to copy from, and lists what to check before finishing. Read it first.

## Steps

1. **Validator** (`validators/<resource>.validator.js`): if the route takes params, query or body, add a pure function that returns cleaned data or throws `ValidationError`. Reuse `id()` for `:id`. Collect all field errors into one `details` array and throw `new ValidationError('Invalid body', errors)` once. Add the function to the `module.exports` object.
2. **Service** (`services/<resource>.service.js`, or a new `<name>.service.js`): put the logic here, using models from `require('../models')`. Throw `NotFoundError` / `ConflictError` / `ValidationError` / `ExternalServiceError` from `utils/errors`. Re-read the record after writes (`return getApplication(id)`), like `decide()` does. Reuse `getApplication` rather than re-querying.
3. **Controller** (`controllers/<resource>.controller.js`): a thin async function: `res.json(await service.fn(validate.x(req.params.id)))`, or `res.status(201).json(...)` for creates. No try/catch; Express 5 forwards rejections to `errorHandler`.
4. **Router** (`router/index.js`): one line, `router.<method>('/path', controller.fn);`. Put more specific paths (`/applications/:id/compare`) next to their resource, keep the existing ordering style.
5. **Docs**: never edit `README.md`. Describe the new route (method, path, request, response) in your reply to the user.
6. **Frontend** (only if the UI needs it): call it through `apiJson` in `frontend/src/api.js`, never raw `fetch`.

## Verify

- `node --check` on each edited file (the PostToolUse hook does this automatically).
- Start the API (`/run-app` skill) and exercise the route with curl: success, 400 (bad input), 404 (unknown id), and 409 where state matters. Confirm the error body is `{"error": "...", "details": [...]}`.
- Report which curl calls you ran and their results. Do not claim tests passed; there is no test suite.
