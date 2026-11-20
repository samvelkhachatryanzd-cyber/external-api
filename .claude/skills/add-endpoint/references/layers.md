# Where to copy from

Each layer already has a good example in the repo. Open the file and match it rather than working from a pasted snippet, because the code is the source of truth. Function names are given instead of line numbers so this stays correct as files change.

| Layer | Example file | Copy this pattern |
|---|---|---|
| Router | `backend/src/router/index.js` | One line per route: `router.post('/applications/:id/approve', applications.approve);` |
| Controller, read | `controllers/applications.controller.js` → `get` | `res.json(await service.getApplication(validate.id(req.params.id)));` |
| Controller, create | same file → `create` | `res.status(201).json(await service.createApplication(validate.createBody(req.body)));` |
| Controller, id plus body | same file → `reject` | Validate the body first (`const { note } = validate.rejectBody(req.body)`), then pass the id and the cleaned data to the service |
| Validator, id | `validators/applications.validator.js` → `id` | Throw `ValidationError('id must be a positive integer')` |
| Validator, query | same file → `listQuery`, `positiveInteger` | Whitelist allowed values, apply defaults and caps (`page`, `limit`), return a cleaned object |
| Service, paginated list | same file → `listApplications` | `findAndCountAll` with `limit` and `offset`, a stable `order` that ends in `id`, and return `{ items, total, page, limit }` |
| Validator, body | same file → `createBody`, `rejectBody`, and the `text()` helper | Collect every error into an array and throw once with `'Invalid body'`. Trim strings and apply max lengths that match the column sizes |
| Service, lookup | `services/applications.service.js` → `getApplication` | `findByPk`, then throw `NotFoundError('Application not found')` |
| Service, write | same file → `createApplication`, `decide` | Write, then return `getApplication(id)` so the response includes DB defaults |
| Service, state rule | same file → `decide` | Throw `ConflictError` when a final state would be changed |
| Service, external call | `services/companyCheck.service.js` → `compareApplication` | Load the application with `getApplication`, call the client, map with the pure functions in `companyComparison.js` |
| Errors | `utils/errors.js` | `ValidationError` 400, `NotFoundError` 404, `ConflictError` 409, `ExternalServiceError(status, message)`. Add a subclass here if none fits |

## Error response contract

`middleware/errorHandler.js` turns every `HttpError` into `{ "error": message, "details": [...] }` (`details` only when present). Malformed JSON becomes a 400 `Invalid JSON body`, and anything else is logged and returned as a 500. Controllers and services never build error responses themselves.

## Check list before you finish

- The route is in `router/index.js`, and a more specific path does not sit after a generic one that would swallow it.
- The new service function is in the `module.exports` object at the bottom of its file, and so is the controller function.
- `README.md` is read-only, so don't add the endpoint to its table. Describe the new route (method, path, request, response) in your reply instead.
- If the UI uses it, the frontend calls it through `apiJson` (see `frontend/CLAUDE.md`).
- Curl checks: success, bad input (400), unknown id (404), and a state conflict (409) if there is one.
