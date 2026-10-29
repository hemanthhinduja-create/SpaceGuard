import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, ApiError } from '../src/services/apiClient.js';

test('apiRequest sends JSON with credentials and returns parsed data', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: 1 })));
  const data = await apiRequest('/auth/login', { method: 'POST', body: { a: 1 } });
  assert.deepEqual(data, { ok: 1 });
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, '/api/auth/login');
  assert.equal(options.credentials, 'include');
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.body, '{"a":1}');
});

test('HTTP errors keep the server message, status and code', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } }), {
        status: 401,
      }),
  );
  await assert.rejects(apiRequest('/auth/login'), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.code, 'INVALID_CREDENTIALS');
    assert.equal(error.message, 'Incorrect email or password.');
    return true;
  });
});

test('network failures become a clear ApiError; caller aborts pass through', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(apiRequest('/satellites'), (error) => error.code === 'NETWORK_ERROR' && /backend/.test(error.message));

  const controller = new AbortController();
  fetch.mock.mockImplementation(async (_url, { signal }) => {
    controller.abort();
    if (signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  });
  await assert.rejects(apiRequest('/satellites', { signal: controller.signal }), (error) => error.name === 'AbortError');
});
