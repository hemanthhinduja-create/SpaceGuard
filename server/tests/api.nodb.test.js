// These tests need the npm dependencies but NO running MongoDB: mongoose is never connected.
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import { testConfig } from './helpers.js';

test('GET /api/health reports a degraded status when the database is not connected', async () => {
  const response = await request(createApp(testConfig)).get('/api/health');
  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'degraded');
  assert.equal(response.body.database, 'disconnected');
  assert.doesNotMatch(JSON.stringify(response.body), /mongodb:|secret/i);
});

test('database-backed routes answer 503 with a JSON error when the DB is down', async () => {
  const app = createApp(testConfig);
  for (const [method, path] of [['get', '/api/satellites'], ['get', '/api/satellites/aditya-l1'], ['post', '/api/auth/login']]) {
    const response = await request(app)[method](path).send(method === 'post' ? { email: 'a@b.co', password: 'x' } : undefined);
    assert.equal(response.status, 503, path);
    assert.equal(response.body.error.code, 'DB_UNAVAILABLE');
  }
});

test('unknown routes return a JSON 404; malformed JSON returns 400; oversized body 413', async () => {
  const app = createApp(testConfig);
  assert.equal((await request(app).get('/api/nope')).body.error.code, 'NOT_FOUND');
  const bad = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{broken');
  assert.equal(bad.status, 400);
  const big = await request(app).post('/api/auth/login').send({ email: 'a@b.co', password: 'x'.repeat(20000) });
  assert.equal(big.status, 413);
});

test('CSRF guard: a disallowed Origin or a non-JSON content type is rejected on POST', async () => {
  const app = createApp(testConfig);
  const evil = await request(app).post('/api/auth/logout').set('Origin', 'https://evil.example').send({});
  assert.equal(evil.status, 403);
  const form = await request(app).post('/api/auth/logout').type('form').send({ a: 1 });
  assert.equal(form.status, 415);
  const ok = await request(app).post('/api/auth/logout').set('Origin', 'http://localhost:5173').send({});
  assert.equal(ok.status, 200);
});

test('CORS only allows configured origins and enables credentials for them', async () => {
  const app = createApp(testConfig);
  const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(allowed.headers['access-control-allow-credentials'], 'true');
  const denied = await request(app).get('/api/health').set('Origin', 'https://evil.example');
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('security headers are set and x-powered-by is hidden', async () => {
  const response = await request(createApp(testConfig)).get('/api/health');
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.ok(response.headers['x-content-type-options']);
});

test('auth endpoints are rate limited', async () => {
  const app = createApp(testConfig, { authRateLimit: 2 });
  const body = { email: 'a@b.co', password: 'x' };
  await request(app).post('/api/auth/login').send(body);
  await request(app).post('/api/auth/login').send(body);
  const third = await request(app).post('/api/auth/login').send(body);
  assert.equal(third.status, 429);
  assert.equal(third.body.error.code, 'RATE_LIMITED');
});

test('environment validation rejects missing or placeholder secrets and bad ports', () => {
  const good = { MONGODB_URI: 'mongodb://127.0.0.1:27017/x', JWT_SECRET: 'x'.repeat(40) };
  assert.equal(loadConfig(good).port, 4000);
  assert.throws(() => loadConfig({ ...good, JWT_SECRET: 'replace_with_a_long_random_secret' }), /JWT_SECRET/);
  assert.throws(() => loadConfig({ ...good, JWT_SECRET: 'short' }), /JWT_SECRET/);
  assert.throws(() => loadConfig({ JWT_SECRET: good.JWT_SECRET }), /MONGODB_URI/);
  assert.throws(() => loadConfig({ ...good, PORT: '99999' }), /PORT/);
  try { loadConfig({ JWT_SECRET: 'short' }); } catch (e) { assert.doesNotMatch(e.message, /short/); }
});

test('connectDB fails with an actionable message that never contains the connection string', async () => {
  const uri = 'mongodb://user:supersecret@127.0.0.1:1/spaceguard_test';
  await assert.rejects(connectDB(uri), (error) => {
    assert.equal(error.code, 'DB_CONNECT_FAILED');
    assert.match(error.message, /MONGODB_URI/);
    assert.doesNotMatch(error.message, /supersecret/);
    return true;
  });
});
