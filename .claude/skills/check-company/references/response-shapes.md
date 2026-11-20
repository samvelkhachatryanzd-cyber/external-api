# Companies House response shapes

Trimmed to the fields this app reads. The profile below matches what the live API returned for company 00445790 when this file was written, so values change over time. The official reference is the source of truth:
https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference

Failure semantics (what each HTTP status means for the company) are in `.claude/rules/companies-house.md`. They are not repeated here.

## `GET /company/{number}`

```json
{
  "company_number": "00445790",
  "company_name": "TESCO PLC",
  "company_status": "active",
  "type": "plc",
  "date_of_creation": "1947-11-27",
  "registered_office_address": {
    "address_line_1": "Tesco House, Shire Park",
    "address_line_2": "Kestrel Way",
    "locality": "Welwyn Garden City",
    "postal_code": "AL7 1GA",
    "country": "United Kingdom"
  }
}
```

Mapping used by `toCompany()` in `backend/src/services/companyComparison.js`:

| Register field | Internal field | Notes |
|---|---|---|
| `company_number` | `number` | 8 characters, so it differs from what the applicant typed |
| `company_name` | `name` | Register style: uppercase, `LIMITED` rather than `Ltd` |
| `company_status` | `status` | Examples: `active`, `dissolved`, `liquidation`, `administration`, `receivership`, `voluntary-arrangement`, `converted-closed`, `insolvency-proceedings`. The full list is in the API reference |
| `type` | `type` | Examples: `ltd`, `plc`, `llp`, `limited-partnership`. See the API reference for the rest |
| `date_of_creation` | `dateOfCreation` | `YYYY-MM-DD` string, kept as is |
| `registered_office_address.premises` + `address_line_1` | `registeredOffice.addressLine1` | Joined with `, `. `premises` is present only for some companies (Tesco has none; its building is already inside `address_line_1`) |
| `address_line_2` / `locality` / `region` / `postal_code` / `country` | `addressLine2` / `city` / `region` / `postcode` / `country` | Any of these can be absent, so map absent to `null` |

Any field can be missing (Tesco has no `region`). A company with no registered office address returns no `registered_office_address` key at all.

## `GET /company/{number}/officers?items_per_page=100&start_index=0`

```json
{
  "total_results": 12,
  "items_per_page": 100,
  "start_index": 0,
  "active_count": 9,
  "resigned_count": 3,
  "items": [
    {
      "name": "SMITH, Olivia Jane",
      "officer_role": "director",
      "appointed_on": "2019-04-01"
    },
    {
      "name": "JONES, Rob",
      "officer_role": "secretary",
      "appointed_on": "2015-01-12",
      "resigned_on": "2022-06-30"
    }
  ]
}
```

- Current directors: `officer_role` ends in `director` (`director`, `corporate-director`, `nominee-director`, `corporate-nominee-director`) and there is no `resigned_on`.
- Page size is at most 100. Page with `start_index` until `items` is empty or the running count reaches `total_results`. The client caps this at 20 pages.
- Officer names come in register format (`SURNAME, Forenames`).

## Company number formats

| Typed by applicant | Normalised | Why |
|---|---|---|
| `445790` | `00445790` | Numeric numbers are left-padded to 8 digits |
| `7565403` | `07565403` | Same |
| `ni 615045` | `NI615045` | Whitespace is stripped and the number is uppercased. Northern Ireland uses an `NI` prefix |
| `sc123456` | `SC123456` | Scotland uses an `SC` prefix |
| `OC301234` | `OC301234` | Prefixes such as `OC` (LLP), `LP`, `FC` are kept as they are |

A number with a typo can still point at a different real company (200 with the wrong name), so a 200 does not prove the applicant meant that company. The name and address comparison is what catches that.

## Rate limit

600 requests per 5 minutes per API key; going over returns `429`. A check costs one profile call plus one officers call per page, so 2 or more requests. The 300 seeded applications need at least 600 requests, which exceeds one window.
