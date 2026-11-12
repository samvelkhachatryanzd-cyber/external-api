# business-onboarding

The business onboarding app of a payments company. UK companies apply for a business account, and the compliance team approves or rejects each application. Before approving, compliance checks the company in the UK company register, which is run by Companies House. Today that check is done by hand on the Companies House website.

## Stack

| Part | Technology | Address |
|---|---|---|
| Frontend | React 19, Vite 8 | http://localhost:5173 |
| API | Node.js 22, Express 5 | http://localhost:4000 |
| Database | MySQL 8.4, Sequelize 6 with sequelize-cli migrations | `localhost:3311` |
| Company register | Companies House Public Data API | https://api.company-information.service.gov.uk |

Docker Compose runs MySQL. The API and the frontend run on your machine. In development, Vite forwards every `/api` request to the API.

## Companies House API

The free public REST API of the UK company register. The application does not use it today; connecting it is your task. Every request needs your own API key: register on the Developer Hub, create an application and a key, and put the key in `COMPANIES_HOUSE_API_KEY` in `backend/.env`.

| Documentation | Link |
|---|---|
| Developer Hub: account, applications and API keys | https://developer.company-information.service.gov.uk |
| Getting started | https://developer.company-information.service.gov.uk/get-started |
| Guides: authentication, rate limiting and more | https://developer-specs.company-information.service.gov.uk/guides/index |
| API reference: every endpoint with its parameters and responses | https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference |
| Developer forum | https://forum.companieshouse.gov.uk |

## Run it

API, from `backend/`:

```bash
cd backend
cp .env.example .env
docker compose up -d --wait
npm install
npm run db:migrate
npm run db:seed
npm start
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. There is no login.

In `backend/`, `npm run dev` restarts the API on file changes and `npm run db:reset` drops, migrates and reseeds. In `frontend/`, `npm run build` followed by `npm run preview` serves the production build on http://localhost:4173. If port 3311 is taken on your machine, change `DB_PORT` in `backend/.env` before `docker compose up`.

## How the app works

- Applicants fill in a form on the public website: company number, company name, registered office address and a contact person. The form sends it to `POST /api/applications`. In this repository the "New application" page plays the part of that form.
- Compliance staff see the waiting applications, open one and decide: approve it, or reject it with a reason.
- Before deciding, they click "Look up on Companies House". It opens the company's page on the Companies House website for the number the applicant typed, and they compare the name, the registered office, the status and the directors by eye.
- A decision is final. An approved or rejected application cannot be decided again.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Database connectivity check |
| GET | `/api/applications` | All applications, newest first. `?status=new`, `approved` or `rejected` keeps only those |
| POST | `/api/applications` | Submit an application. JSON body with `companyNumber`, `companyName`, `addressLine1`, `addressLine2` (optional), `city`, `postcode`, `contactName` and `contactEmail` |
| GET | `/api/applications/:id` | One application |
| POST | `/api/applications/:id/approve` | Approve a waiting application |
| POST | `/api/applications/:id/reject` | Reject a waiting application. JSON body with `note`, the reason |

```bash
curl http://localhost:4000/api/applications/300
```
```json
{
  "id": 300,
  "companyNumber": "05994776",
  "companyName": "MUFG Fund Services (UK) Ltd",
  "addressLine1": "24 Lombard Street",
  "addressLine2": "4th Floor",
  "city": "London",
  "postcode": "EC3V 9AJ",
  "contactName": "Ciara Evans",
  "contactEmail": "ciara.evans@mufg-fund.example.com",
  "status": "new",
  "decisionNote": null,
  "decidedAt": null,
  "createdAt": "2026-11-12T08:10:00.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/applications -H 'Content-Type: application/json' \
     -d '{"companyNumber": "445790", "companyName": "Tesco", "addressLine1": "Tesco House, Shire Park",
          "addressLine2": "Kestrel Way", "city": "Welwyn Garden City", "postcode": "AL7 1GA",
          "contactName": "Olivia Smith", "contactEmail": "olivia.smith@example.com"}'
```
```json
{
  "id": 301,
  "companyNumber": "445790",
  "companyName": "Tesco",
  "addressLine1": "Tesco House, Shire Park",
  "addressLine2": "Kestrel Way",
  "city": "Welwyn Garden City",
  "postcode": "AL7 1GA",
  "contactName": "Olivia Smith",
  "contactEmail": "olivia.smith@example.com",
  "status": "new",
  "decisionNote": null,
  "decidedAt": null,
  "createdAt": "2026-11-12T10:02:42.000Z"
}
```

```bash
curl -X POST http://localhost:4000/api/applications/301/approve
curl -X POST http://localhost:4000/api/applications/300/reject -H 'Content-Type: application/json' \
     -d '{"note": "Could not confirm the company details"}'
```

Both return the application with its new `status`, `decidedAt` and, for a rejection, `decisionNote`.

Errors come back as JSON, `{"error": "...", "details": [...]}`, with status 400, 404 or 409. For example `{"error": "Application not found"}`, `{"error": "Application is already approved"}` or `{"error": "Invalid body", "details": ["note is required"]}`.

## Scripts

Run them from `backend/`.

| Command | What it does |
|---|---|
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert 300 applications: 46 waiting, 235 approved and 19 rejected. They belong to real UK companies, taken from the free company data snapshot that Companies House published on 1 November 2026, and are typed the way applicants type them. The data is the same on every run. Refuses on a non-empty table |
| `npm run db:reset` | Drop all tables, migrate and seed again |

## Environment variables

In `backend/.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port of the API |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | see `.env.example` | MySQL connection. Docker Compose reads the same values |
| `COMPANIES_HOUSE_URL` | `https://api.company-information.service.gov.uk` | Base address of the Companies House API. The application does not read it yet |
| `COMPANIES_HOUSE_API_KEY` | empty | Your own key for the Companies House API, from the Companies House Developer Hub. The application does not read it yet |
| `SQL_LOG` | `0` | `1` prints every SQL query |

## Known issues

In production:

- About 2,400 business clients have been approved over four years, and 40 to 60 new applications arrive every working day.
- The compliance team is three people. Checking one application on the Companies House website takes about six minutes: finding the company, then comparing the name, the registered office, the status and the directors by eye.
- Applicants type what they remember: "Tesco" for "TESCO PLC", "Ltd" for "Limited", a trading address instead of the registered office, the company's old name, a company number without its leading zeros ("445790" for "00445790") or with a space ("ni 615045"). Now and then a number has a typo and points to another company, or to none.
- Last year two companies were approved while in liquidation, and one application was approved against the wrong company because of a typo in its number.
- Nothing records what the register said when an application was decided. The auditors have asked for it twice this year.
- A client's company can change after approval: it goes into liquidation or administration, is struck off, or moves its registered office. Nobody notices until payments to it fail.

## Your task

Connect the app to the Companies House API, so that compliance sees the register's data for every application instead of looking it up by hand. New applications are checked when they arrive, and the 300 applications that exist today are checked too. You may change the API, the frontend and the database.

Requirements:

1. Research the API documentation and understand its capabilities.
2. Configure the required authentication and credentials.
3. Implement the necessary API requests and response handling.
4. Map external data into the application's internal data model.
5. Handle errors, timeouts, and unsuccessful responses.
6. Account for pagination or rate limits where relevant.
7. Document configuration, setup, and important integration decisions.

Expected outcome:

- An application page shows the company as the register has it: name, number, status, type, date of creation, registered office and current directors, next to what the applicant typed, with the differences easy to see.
- New applications are checked when they arrive, and the 300 applications that exist today are checked too.
- What the register returned is stored with the application, together with the time it was fetched, so that a decision can be explained later.
- When Companies House is slow, refuses requests or is down, the app keeps working and records nothing wrong: a failed call never makes a company look unknown or inactive.

How we work:

- Research freely: official documentation first, anything else that helps. Keep a note of what you relied on.
- When blocked, ask a focused question and include what you already tried.
- Commit in small steps so the path you took is visible.
- At the end we review the implementation together. Be ready to walk through the code, explain the trade-offs you made, and name what you would do differently with more time.
