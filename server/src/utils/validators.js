export const SATELLITE_ID_PATTERN = /^[a-z0-9-]{1,80}$/;
export const CATEGORIES = [
  'Solar Observation',
  'Earth Observation',
  'Space Telescope',
  'Lunar',
  'Planetary',
  'Communication',
  'Scientific Research',
];
export const MAX_QUERY_LENGTH = 400; // matches src/utils/search.js
export const MAX_HISTORY_LIMIT = 100;
export const DEFAULT_HISTORY_LIMIT = 24;

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const isValidSatelliteId = (id) => typeof id === 'string' && SATELLITE_ID_PATTERN.test(id);

export function requireSatelliteId(id) {
  if (!isValidSatelliteId(id)) throw new HttpError(400, 'Invalid satellite ID.', 'INVALID_ID');
  return id;
}

// Query values must be plain strings: this blocks ?category[$ne]=x style operator injection.
export function stringQuery(value, name, maxLength = MAX_QUERY_LENGTH) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string')
    throw new HttpError(400, `Query parameter "${name}" must be a single string.`, 'INVALID_QUERY');
  if (value.length > maxLength)
    throw new HttpError(400, `Query parameter "${name}" is too long.`, 'INVALID_QUERY');
  return value;
}

export function parseCatalogueQuery(query) {
  const category = stringQuery(query.category, 'category');
  const q = stringQuery(query.q, 'q');
  if (category !== undefined && category !== 'All missions' && !CATEGORIES.includes(category))
    throw new HttpError(400, 'Unknown category.', 'INVALID_QUERY');
  return { category, q };
}

export function parseLimit(value, fallback = DEFAULT_HISTORY_LIMIT, max = MAX_HISTORY_LIMIT) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value))
    throw new HttpError(400, 'limit must be a positive integer.', 'INVALID_QUERY');
  const limit = Number(value);
  if (limit < 1 || limit > max)
    throw new HttpError(400, `limit must be between 1 and ${max}.`, 'INVALID_QUERY');
  return limit;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function validateRegistration(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid request body.', 'INVALID_BODY');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!name || name.length > 80) throw new HttpError(400, 'Enter your name (up to 80 characters).', 'INVALID_BODY');
  if (!EMAIL_PATTERN.test(email) || email.length > 254)
    throw new HttpError(400, 'Enter a valid email address.', 'INVALID_BODY');
  if (typeof password !== 'string' || password.length < 8 || password.length > 128)
    throw new HttpError(400, 'Password must be 8-128 characters.', 'INVALID_BODY');
  return { name, email, password };
}

export function validateLogin(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid request body.', 'INVALID_BODY');
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!EMAIL_PATTERN.test(email) || typeof password !== 'string' || !password || password.length > 128)
    throw new HttpError(400, 'Enter your email and password.', 'INVALID_BODY');
  return { email, password };
}

const REQUIRED_STRINGS = [
  'id', 'name', 'agency', 'mission', 'category', 'status', 'statusBasis',
  'orbit', 'description', 'image', 'sourceUrl',
];

// Same rules as the frontend's isValidCatalogue, returning readable problems for the seed script.
export function validateSatelliteRecords(records) {
  const problems = [];
  if (!Array.isArray(records) || !records.length) return ['Catalogue must be a non-empty array.'];
  const ids = new Set();
  for (const item of records) {
    const label = item?.id ?? '(no id)';
    for (const key of REQUIRED_STRINGS)
      if (typeof item?.[key] !== 'string' || !item[key].length) problems.push(`${label}: missing ${key}`);
    if (!SATELLITE_ID_PATTERN.test(item?.id ?? '')) problems.push(`${label}: invalid id`);
    if (!Number.isInteger(item?.launchYear)) problems.push(`${label}: launchYear must be an integer`);
    if (!['Active', 'Archive'].includes(item?.status)) problems.push(`${label}: invalid status`);
    if (!String(item?.image).startsWith('/visuals/')) problems.push(`${label}: invalid image`);
    if (!/^https:\/\//.test(item?.sourceUrl ?? '')) problems.push(`${label}: sourceUrl must be https`);
    if (!Array.isArray(item?.relatedSatelliteIds) || !item.relatedSatelliteIds.every((x) => typeof x === 'string'))
      problems.push(`${label}: relatedSatelliteIds must be a string array`);
    if (ids.has(item?.id)) problems.push(`${label}: duplicate id`);
    ids.add(item?.id);
  }
  for (const item of records)
    for (const rel of item?.relatedSatelliteIds ?? [])
      if (!ids.has(rel)) problems.push(`${item.id}: related id "${rel}" does not exist`);
  return problems;
}
