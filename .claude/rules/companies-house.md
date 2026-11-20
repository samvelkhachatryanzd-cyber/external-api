---
paths:
  - "backend/src/services/companiesHouse.client.js"
  - "backend/src/services/companyCheck.service.js"
  - "backend/src/services/companyComparison.js"
  - "frontend/src/ApplicationPage.jsx"
---

# Companies House integration rules

Official docs come first: the [API reference](https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference) and the [guides](https://developer-specs.company-information.service.gov.uk/guides/index). Re-check them for field names and limits instead of relying on memory.

## API facts the code relies on

- Base URL `COMPANIES_HOUSE_URL` (default `https://api.company-information.service.gov.uk`), key `COMPANIES_HOUSE_API_KEY`. Auth is HTTP Basic: the API key is the username and the **password is empty** (`base64("<key>:")`).
- `GET /company/{number}` returns the profile: `company_name`, `company_number`, `company_status`, `type`, `date_of_creation`, `registered_office_address{premises,address_line_1,address_line_2,locality,region,postal_code,country}`.
- `GET /company/{number}/officers?items_per_page=&start_index=` returns `{items[], total_results, ...}`. Current directors have an `officer_role` ending in `director` and no `resigned_on`. The page size is at most 100, so paginate.
- Rate limit: 600 requests per 5 minutes per key, and exceeding it returns `429`. Each check costs 2 or more requests, so checking the 300 existing applications needs 600 or more requests. Throttle the batch and make it resumable.
- Company numbers have 8 characters. Numeric ones are zero-padded ("445790" becomes "00445790"). Scottish and NI numbers have letter prefixes ("SC123456", "NI615045"). Applicants type spaces and lowercase ("ni 615045"). Normalise with `normalizeNumber` before calling, and compare on the normalised form.

## Failure semantics (non-negotiable)

| Situation | Meaning | Treat as |
|---|---|---|
| 200 | register data | store payload and `fetched_at` |
| 404 | company does not exist on the register | a real finding: "not found on register" |
| 401 or missing key | our configuration is wrong | failed check (502), don't blame the company |
| 429 | rate limited | failed check, retry later with backoff |
| 5xx, network error, timeout, bad JSON | register unavailable | failed check (503), keep existing data untouched |

A failed call must never make a company look unknown, inactive or mismatching, and must never overwrite a stored good result. Never save partial data (profile fetched but officers failed) as a complete snapshot.

## Code rules

- All HTTP lives in `companiesHouse.client.js`. Mapping and diffing stay pure in `companyComparison.js` (no I/O). Orchestration lives in `companyCheck.service.js`.
- Throw `ExternalServiceError(status, message)`. Never leak the key or the raw upstream body into messages.
- Every request has a timeout (`AbortSignal.timeout`). Retries, if added, are bounded, use backoff, and only retry 429, 5xx and network errors, never 404 or 401.
- A failing check must not break application creation: `POST /api/applications` still succeeds and the check is recorded as failed or pending so it can be retried.
- Keep `null` for absent fields when mapping (the `clean()` helper), so the UI can tell "register has nothing" from "unknown".
- Make the comparison tolerant of how applicants type (case, spacing, "Ltd" vs "Limited", leading zeros, postcode spacing) only as a deliberate decision, and state it in your reply to the user.
- Report configuration, setup and integration decisions to the user in your reply. Never write them into `README.md`, which is read-only.
