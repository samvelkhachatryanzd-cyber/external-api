---
paths:
  - "backend/src/**/*.js"
  - "backend/scripts/**/*.js"
---

# Backend code rules

- CommonJS only (`require` / `module.exports`). Export one object at the bottom of the file.
- Layer boundaries: controllers don't import models; only services do. Services don't touch `req`/`res`. Validators are pure and throw `ValidationError`.
- Controllers stay as thin as `applications.controller.js`: validate, call a service, `res.json(...)` (`res.status(201).json(...)` for creates). No try/catch: Express 5 routes rejected promises to `errorHandler`.
- Throw `HttpError` subclasses from `utils/errors.js`. Add a new subclass there rather than building ad-hoc `{status}` objects. The response shape is always `{ error, details? }`.
- Validators collect every problem into one `details` array and throw once (`'Invalid body'`). Max lengths mirror the DB column sizes.
- New routes are registered in `src/router/index.js`, one line each, REST-style under `/api`.
- Read env vars at call time in the module that needs them. Every new variable goes in `backend/.env.example` (never in `README.md`, which is read-only).
- Don't log secrets, request bodies or the `Authorization` header.
- Keep dependencies minimal. Global `fetch` and `AbortSignal.timeout` are used instead of axios/node-fetch. Don't add HTTP, validation (joi/zod) or logging libraries without being asked.
- Verify with `node --check` and by exercising the endpoint with curl against a running API. There is no test suite.
