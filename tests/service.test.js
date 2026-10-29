import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getSatellites,
  getSatelliteById,
  isValidCatalogue,
} from '../src/services/satelliteService.js';
import { readStorage, writeStorage } from '../src/utils/storage.js';

const satellites = JSON.parse(
  readFileSync(new URL('../src/data/satellites.json', import.meta.url)),
);
const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

test('data service and storage failure paths', async (context) => {
  const apiResponse = () =>
    new Response(JSON.stringify({ count: satellites.length, satellites }));
  context.mock.method(globalThis, 'fetch', async () => apiResponse());
  globalThis.localStorage = storage;
  globalThis.window = { dispatchEvent() {} };

  await context.test(
    'API response loads and is cached; IDs resolve without another request',
    async () => {
      const result = await getSatellites({ force: true });
      assert.equal(result.satellites.length, 32);
      assert.equal(result.source, 'api');
      assert.match(String(fetch.mock.calls[0].arguments[0]), /\/api\/satellites$/);
      assert.equal(fetch.mock.calls[0].arguments[1].credentials, 'include');
      assert.ok(values.has('spaceguard:catalogue'));
      assert.equal(getSatelliteById('aditya-l1', result.satellites).name, 'Aditya-L1');
      assert.equal(getSatelliteById('missing-id', result.satellites), null);
      assert.strictEqual(await getSatellites(), result);
    },
  );

  await context.test('network failure uses a validated saved catalogue', async () => {
    fetch.mock.mockImplementation(async () => {
      throw new TypeError('Offline');
    });
    const result = await getSatellites({ force: true });
    assert.equal(result.source, 'saved');
    assert.equal(result.satellites.length, 32);
  });

  await context.test('failure without a cache rejects with an actionable error', async () => {
    values.clear();
    await assert.rejects(getSatellites({ force: true }), /Unable to load mission data/);
  });

  await context.test('non-OK responses, malformed JSON and invalid data are rejected', async () => {
    for (const response of [
      new Response('Failed', { status: 503 }),
      new Response('{'),
      new Response('[null]'),
      new Response('[]'),
    ]) {
      fetch.mock.mockImplementation(async () => response);
      await assert.rejects(getSatellites({ force: true }), /Unable to load mission data/);
    }
  });

  await context.test('corrupt saved JSON is ignored', async () => {
    values.set('spaceguard:catalogue', '{broken');
    fetch.mock.mockImplementation(async () => {
      throw new Error('Offline');
    });
    await assert.rejects(getSatellites({ force: true }), /Unable to load mission data/);
    assert.equal(readStorage('catalogue', 'fallback'), 'fallback');
  });

  await context.test('request timeout aborts instead of spinning indefinitely', async () => {
    values.clear();
    context.mock.timers.enable({ apis: ['setTimeout'] });
    fetch.mock.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
        }),
    );
    const request = getSatellites({ force: true });
    context.mock.timers.tick(8000);
    await assert.rejects(request, /Unable to load mission data/);
    context.mock.timers.reset();
  });

  await context.test(
    'blocked localStorage does not prevent loading or reading defaults',
    async () => {
      let warningSent = false;
      globalThis.window.dispatchEvent = () => {
        warningSent = true;
      };
      globalThis.localStorage = {
        getItem() {
          throw new Error('Blocked');
        },
        setItem() {
          throw new Error('Blocked');
        },
      };
      fetch.mock.mockImplementation(async () => apiResponse());
      assert.equal((await getSatellites({ force: true })).satellites.length, 32);
      assert.equal(readStorage('theme', 'dark'), 'dark');
      assert.equal(writeStorage('theme', 'light'), false);
      assert.equal(warningSent, true);
    },
  );

  await context.test('a bare array (the old catalogue shape) is not accepted from the API', async () => {
    values.clear();
    fetch.mock.mockImplementation(async () => new Response(JSON.stringify(satellites)));
    await assert.rejects(getSatellites({ force: true }), /Unable to load mission data/);
  });

  await context.test('server errors without a cache surface an actionable message', async () => {
    values.clear();
    fetch.mock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ error: { code: 'DB_UNAVAILABLE', message: 'Database is unavailable.' } }), {
          status: 503,
        }),
    );
    await assert.rejects(getSatellites({ force: true }), /Unable to load mission data/);
  });

  await context.test('schema validation rejects duplicate IDs and broken records', () => {
    assert.equal(isValidCatalogue(satellites), true);
    assert.equal(isValidCatalogue([satellites[0], satellites[0]]), false);
    assert.equal(isValidCatalogue([{ ...satellites[0], relatedSatelliteIds: null }]), false);
    assert.equal(isValidCatalogue([{ ...satellites[0], name: null }]), false);
    assert.equal(isValidCatalogue([{ ...satellites[0], id: '../../bad' }]), false);
  });

  delete globalThis.localStorage;
  delete globalThis.window;
});
