const { ExternalServiceError } = require('../utils/errors');

const TIMEOUT_MS = 10000;
const OFFICERS_PAGE_SIZE = 100;
const MAX_OFFICER_PAGES = 20;

function normalizeNumber(raw) {
  const value = String(raw).replace(/\s+/g, '').toUpperCase();
  return /^\d+$/.test(value) ? value.padStart(8, '0') : value;
}

function config() {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (!apiKey) throw new ExternalServiceError(502, 'Companies House API key is not configured');
  const baseUrl = (process.env.COMPANIES_HOUSE_URL || 'https://api.company-information.service.gov.uk').replace(/\/+$/, '');
  return { apiKey, baseUrl };
}

async function get(path) {
  const { apiKey, baseUrl } = config();

  let response;
  try {
    response = await fetch(baseUrl + path, {
      headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    throw new ExternalServiceError(503, 'Companies House is unavailable or did not respond in time');
  }

  if (response.status === 404) throw new ExternalServiceError(404, 'Company not found on Companies House');
  if (response.status === 401) throw new ExternalServiceError(502, 'Could not connect to the Companies House');
  if (response.status === 429) throw new ExternalServiceError(429, 'Companies House rate limit reached, try again in a few minutes');
  if (!response.ok) throw new ExternalServiceError(503, 'Companies House is unavailable or returned an unexpected response');

  try {
    return await response.json();
  } catch (err) {
    throw new ExternalServiceError(503, 'Companies House is unavailable or returned an unexpected response');
  }
}

function getCompanyProfile(companyNumber) {
  return get(`/company/${encodeURIComponent(normalizeNumber(companyNumber))}`);
}

async function getOfficers(companyNumber) {
  const number = encodeURIComponent(normalizeNumber(companyNumber));
  const officers = [];

  for (let page = 0; page < MAX_OFFICER_PAGES; page += 1) {
    const startIndex = page * OFFICERS_PAGE_SIZE;
    const body = await get(`/company/${number}/officers?items_per_page=${OFFICERS_PAGE_SIZE}&start_index=${startIndex}`);
    const items = Array.isArray(body.items) ? body.items : [];
    officers.push(...items);
    if (!items.length || officers.length >= (body.total_results || 0)) return officers;
  }

  throw new ExternalServiceError(503, 'Companies House returned too many officers to read');
}

module.exports = { getCompanyProfile, getOfficers };
