const { ValidationError } = require('../utils/errors');

const STATUSES = ['new', 'approved', 'rejected'];

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

function positiveInteger(raw, name) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) throw new ValidationError(`${name} must be a positive integer`);
  return value;
}

function id(raw) {
  return positiveInteger(raw, 'id');
}

function listQuery(query) {
  const filter = {};
  if (query.status !== undefined) {
    if (!STATUSES.includes(query.status)) throw new ValidationError(`status must be one of: ${STATUSES.join(', ')}`);
    filter.status = query.status;
  }

  const page = query.page === undefined ? 1 : positiveInteger(query.page, 'page');
  const limit = query.limit === undefined ? DEFAULT_LIMIT : positiveInteger(query.limit, 'limit');
  if (limit > MAX_LIMIT) throw new ValidationError(`limit must be at most ${MAX_LIMIT}`);

  return { filter, page, limit };
}

function text(body, field, max, errors, { required = true } = {}) {
  const value = typeof body[field] === 'string' ? body[field].trim() : '';
  if (!value) {
    if (required) errors.push(`${field} is required`);
    return null;
  }
  if (value.length > max) errors.push(`${field} must be at most ${max} characters`);
  return value;
}

function createBody(body) {
  if (!body || typeof body !== 'object') throw new ValidationError('JSON body required');
  const errors = [];

  const data = {
    companyNumber: text(body, 'companyNumber', 20, errors),
    companyName: text(body, 'companyName', 200, errors),
    addressLine1: text(body, 'addressLine1', 200, errors),
    addressLine2: text(body, 'addressLine2', 200, errors, { required: false }),
    city: text(body, 'city', 100, errors),
    postcode: text(body, 'postcode', 20, errors),
    contactName: text(body, 'contactName', 100, errors),
    contactEmail: text(body, 'contactEmail', 255, errors),
  };

  if (data.companyNumber && !/^[A-Za-z0-9 ]+$/.test(data.companyNumber)) {
    errors.push('companyNumber may only contain letters, digits and spaces');
  }
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.push('contactEmail must be an email address');
  }

  if (errors.length) throw new ValidationError('Invalid body', errors);
  return data;
}

function rejectBody(body) {
  const errors = [];
  const note = text(body || {}, 'note', 500, errors);
  if (errors.length) throw new ValidationError('Invalid body', errors);
  return { note };
}

module.exports = { id, listQuery, createBody, rejectBody };
