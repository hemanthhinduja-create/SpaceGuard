import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  HttpError, parseCatalogueQuery, parseLimit, requireSatelliteId, validateLogin,
  validateRegistration, validateSatelliteRecords,
} from '../src/utils/validators.js';

const records = JSON.parse(readFileSync(new URL('../../src/data/satellites.json', import.meta.url)));

test('the shipped satellites.json passes seed validation (32 records, relations resolve)', () => {
  assert.equal(records.length, 32);
  assert.deepEqual(validateSatelliteRecords(records), []);
});

test('seed validation reports duplicates, bad relations and bad fields', () => {
  assert.ok(validateSatelliteRecords([records[0], records[0]]).some((p) => /duplicate/.test(p)));
  assert.ok(validateSatelliteRecords([{ ...records[0], relatedSatelliteIds: ['nope'] }]).some((p) => /does not exist/.test(p)));
  assert.ok(validateSatelliteRecords([{ ...records[0], sourceUrl: 'http://x' }]).length > 0);
  assert.ok(validateSatelliteRecords([]).length > 0);
});

test('satellite ids: only lowercase slug characters are accepted', () => {
  assert.equal(requireSatelliteId('aditya-l1'), 'aditya-l1');
  for (const bad of ['', 'Bad_ID', '../x', 'a'.repeat(81), '$ne', undefined])
    assert.throws(() => requireSatelliteId(bad), (e) => e instanceof HttpError && e.status === 400);
});

test('catalogue query: valid values pass; objects/arrays/unknown categories are rejected', () => {
  assert.deepEqual(parseCatalogueQuery({ category: 'Lunar', q: 'nasa' }), { category: 'Lunar', q: 'nasa' });
  assert.deepEqual(parseCatalogueQuery({}), { category: undefined, q: undefined });
  assert.throws(() => parseCatalogueQuery({ category: { $ne: 'x' } }), /single string/);
  assert.throws(() => parseCatalogueQuery({ q: ['a', 'b'] }), /single string/);
  assert.throws(() => parseCatalogueQuery({ category: 'Nonsense' }), /Unknown category/);
  assert.throws(() => parseCatalogueQuery({ q: 'z'.repeat(401) }), /too long/);
});

test('limit parsing: default, bounds and junk', () => {
  assert.equal(parseLimit(undefined), 24);
  assert.equal(parseLimit('100'), 100);
  for (const bad of ['0', '101', '-1', 'abc', '1.5', ['1'], '99999'])
    assert.throws(() => parseLimit(bad), (e) => e.status === 400);
});

test('registration validation normalises email and enforces rules', () => {
  assert.deepEqual(validateRegistration({ name: ' Ada ', email: ' ADA@Example.COM ', password: 'longenough1' }), {
    name: 'Ada', email: 'ada@example.com', password: 'longenough1',
  });
  for (const body of [null, {}, { name: 'A', email: 'bad', password: 'longenough1' }, { name: 'A', email: 'a@b.co', password: 'short' },
    { name: '', email: 'a@b.co', password: 'longenough1' }, { name: 'A', email: 'a@b.co', password: { $gt: '' } }])
    assert.throws(() => validateRegistration(body), (e) => e.status === 400);
});

test('login validation rejects non-string credentials (NoSQL operator injection)', () => {
  assert.deepEqual(validateLogin({ email: 'A@B.co', password: 'x' }), { email: 'a@b.co', password: 'x' });
  assert.throws(() => validateLogin({ email: { $ne: '' }, password: 'x' }), (e) => e.status === 400);
  assert.throws(() => validateLogin({ email: 'a@b.co', password: { $ne: '' } }), (e) => e.status === 400);
});
