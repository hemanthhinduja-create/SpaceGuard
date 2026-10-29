// Integration tests against a REAL MongoDB. By default an in-memory MongoDB (mongodb-memory-server)
// is started; it downloads a mongod binary on first use, so it needs internet once.
// Alternatively set TEST_MONGODB_URI to a database whose name ends in "_test" (it is wiped).
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import Satellite from '../src/models/Satellite.js';
import Telemetry from '../src/models/Telemetry.js';
import User from '../src/models/User.js';
import { seedSatellites, verifyRelations } from '../src/scripts/seedSatellites.js';
import { resetLiveState, STORE_INTERVAL_MS } from '../src/services/telemetryService.js';
import { calculateHealth } from '../../src/utils/healthScore.js';
import { records, testConfig } from './helpers.js';

let memory;
let available = false;
let skipReason = '';
let app;

before(async () => {
  try {
    let uri = process.env.TEST_MONGODB_URI;
    if (uri) {
      const name = new URL(uri).pathname.replace('/', '');
      if (!name.endsWith('_test')) throw new Error('TEST_MONGODB_URI database name must end with "_test" (safety check).');
    } else {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memory = await MongoMemoryServer.create();
      uri = memory.getUri('spaceguard_test');
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    await mongoose.connection.dropDatabase();
    await Promise.all([Satellite.init(), Telemetry.init(), User.init()]);
    await seedSatellites(records);
    app = createApp(testConfig, { authRateLimit: 1000 });
    available = true;
  } catch (error) {
    skipReason = `MongoDB test database unavailable: ${error.message}`;
    console.warn(`[integration tests skipped] ${skipReason}`);
  }
});

after(async () => {
  if (available) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await memory?.stop();
});

const t = (name, fn) => test(name, async (context) => (available ? fn(context) : context.skip(skipReason)));
const credentials = { name: 'Ada Lovelace', email: 'Ada@Example.com', password: 'correct-horse-9' };

t('seeding is idempotent: 32 profiles, no duplicates, relations resolve', async () => {
  const again = await seedSatellites(records);
  assert.equal(again.inserted, 0);
  assert.equal(again.total, 32);
  assert.equal(await Satellite.countDocuments(), 32);
  assert.deepEqual(await verifyRelations(), []);
});

t('GET /api/health is ok with a connected database', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual([response.body.status, response.body.database], ['ok', 'connected']);
});

t('GET /api/satellites returns the full catalogue without internal fields', async () => {
  const response = await request(app).get('/api/satellites');
  assert.equal(response.status, 200);
  assert.equal(response.body.count, 32);
  assert.equal(response.body.satellites[0]._id, undefined);
  const aditya = response.body.satellites.find((s) => s.id === 'aditya-l1');
  assert.deepEqual(aditya, records.find((s) => s.id === 'aditya-l1'));
});

t('catalogue filters: category, search, combined, and results match the frontend search tests', async () => {
  assert.equal((await request(app).get('/api/satellites?category=Earth%20Observation')).body.count, 6);
  assert.equal((await request(app).get('/api/satellites?category=All%20missions')).body.count, 32);
  assert.equal((await request(app).get('/api/satellites?q=Lunar')).body.count, 3);
  assert.equal((await request(app).get('/api/satellites?q=ISRO&category=Communication')).body.satellites[0].id, 'gsat-30');
  assert.equal((await request(app).get('/api/satellites?q=xyz-nonexistent')).body.count, 0);
});

t('invalid or injected query parameters are rejected with 400', async () => {
  for (const url of ['/api/satellites?category=Nonsense', '/api/satellites?category[$ne]=x', '/api/satellites?q[]=a&q[]=b', `/api/satellites?q=${'z'.repeat(401)}`])
    assert.equal((await request(app).get(url)).status, 400, url);
});

t('GET /api/satellites/:id returns by stable id; invalid id 400; missing 404', async () => {
  const ok = await request(app).get('/api/satellites/james-webb');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.satellite.id, 'james-webb');
  assert.equal((await request(app).get('/api/satellites/Bad_ID')).status, 400);
  const missing = await request(app).get('/api/satellites/does-not-exist');
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'SATELLITE_NOT_FOUND');
});

t('related satellites exclude self and archives, return 3, and favour curated links', async () => {
  const response = await request(app).get('/api/satellites/aditya-l1/related');
  assert.equal(response.status, 200);
  assert.equal(response.body.count, 3);
  const aditya = records.find((s) => s.id === 'aditya-l1');
  for (const item of response.body.satellites) {
    assert.notEqual(item.id, 'aditya-l1');
    assert.equal(item.status, 'Active');
    assert.ok(aditya.relatedSatelliteIds.includes(item.id));
  }
  assert.equal((await request(app).get('/api/satellites/nope/related')).status, 404);
});

t('register: 201, HTTP-only cookie, no password hash returned, hashed in DB, email normalised', async () => {
  const response = await request(app).post('/api/auth/register').send(credentials);
  assert.equal(response.status, 201);
  assert.equal(response.body.user.email, 'ada@example.com');
  assert.equal(JSON.stringify(response.body).includes('passwordHash'), false);
  assert.match(response.headers['set-cookie'][0], /HttpOnly/i);
  const stored = await User.findOne({ email: 'ada@example.com' }).select('+passwordHash');
  assert.notEqual(stored.passwordHash, credentials.password);
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
});

t('duplicate registration (any email casing) is rejected with 409', async () => {
  const response = await request(app).post('/api/auth/register').send({ ...credentials, email: 'ADA@example.com' });
  assert.equal(response.status, 409);
  assert.equal(await User.countDocuments(), 1);
});

t('invalid registration bodies are rejected with 400', async () => {
  for (const body of [{}, { ...credentials, email: 'nope' }, { ...credentials, password: 'short' }, { ...credentials, email: { $ne: '' } }, { ...credentials, name: ' ' }])
    assert.equal((await request(app).post('/api/auth/register').send(body)).status, 400);
});

t('login succeeds; wrong password and unknown email give the same generic 401', async () => {
  const ok = await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.headers['set-cookie']);
  const wrong = await request(app).post('/api/auth/login').send({ email: 'ada@example.com', password: 'wrong-password' });
  const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'wrong-password' });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
  assert.equal((await request(app).post('/api/auth/login').send({ email: { $ne: '' }, password: { $ne: '' } })).status, 400);
});

t('session restore (/me), logout clears the cookie, and /me then returns 401', async () => {
  const agent = request.agent(app);
  assert.equal((await agent.get('/api/auth/me')).status, 401);
  await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'ada@example.com');
  assert.equal(JSON.stringify(me.body).includes('passwordHash'), false);
  const out = await agent.post('/api/auth/logout').send({});
  assert.equal(out.status, 200);
  assert.match(out.headers['set-cookie'][0], /spaceguard_token=;/);
  assert.equal((await agent.get('/api/auth/me')).status, 401);
});

t('a tampered or garbage token is rejected', async () => {
  const response = await request(app).get('/api/auth/me').set('Cookie', 'spaceguard_token=not.a.jwt');
  assert.equal(response.status, 401);
});

t('telemetry and health endpoints require authentication', async () => {
  for (const [method, path] of [['get', '/telemetry'], ['get', '/telemetry/history'], ['post', '/telemetry/simulate'], ['get', '/health']]) {
    const response = await request(app)[method](`/api/satellites/aditya-l1${path}`).send(method === 'post' ? {} : undefined);
    assert.equal(response.status, 401, path);
  }
});

t('health and latest telemetry report "unavailable" (404) before any reading exists', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  const health = await agent.get('/api/satellites/hubble/health');
  assert.equal(health.status, 404);
  assert.equal(health.body.error.code, 'NO_TELEMETRY');
  assert.equal((await agent.get('/api/satellites/hubble/telemetry')).status, 404);
  assert.deepEqual((await agent.get('/api/satellites/hubble/telemetry/history')).body.readings, []);
});

t('simulate persists a reading; fast repeat calls advance the stream but are not stored again', async () => {
  resetLiveState();
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  const first = await agent.post('/api/satellites/aditya-l1/telemetry/simulate').send({});
  assert.equal(first.status, 201);
  assert.equal(first.body.simulated, true);
  assert.equal(first.body.persisted, true);
  for (const key of ['temperature', 'battery', 'solarPower', 'voltage', 'signal', 'propellant', 'dataRate'])
    assert.ok(Number.isFinite(first.body.reading[key]), key);
  const second = await agent.post('/api/satellites/aditya-l1/telemetry/simulate').send({});
  assert.equal(second.status, 200);
  assert.equal(second.body.persisted, false);
  assert.notDeepEqual(second.body.reading, first.body.reading);
  assert.equal(await Telemetry.countDocuments({ satelliteId: 'aditya-l1' }), 1);
  assert.ok(STORE_INTERVAL_MS >= 1000);
});

t('latest telemetry and history return stored readings in chronological order; limit validated', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  const base = Date.now() - 60_000;
  await Telemetry.insertMany([0, 1, 2].map((i) => ({
    satelliteId: 'sdo', timestamp: new Date(base + i * 10_000), temperature: 30 + i, battery: 90, solarPower: 80,
    voltage: 13, signal: 90 + i, propellant: 70, dataRate: 4,
  })));
  const latest = await agent.get('/api/satellites/sdo/telemetry');
  assert.equal(latest.body.reading.signal, 92);
  const history = await agent.get('/api/satellites/sdo/telemetry/history?limit=2');
  assert.deepEqual(history.body.readings.map((r) => r.signal), [91, 92]);
  for (const bad of ['0', '101', 'abc', '-3']) assert.equal((await agent.get(`/api/satellites/sdo/telemetry/history?limit=${bad}`)).status, 400);
  assert.equal((await agent.get('/api/satellites/Bad_ID/telemetry/history')).status, 400);
  assert.equal((await agent.get('/api/satellites/missing-sat/telemetry/history')).status, 404);
  assert.equal((await agent.post('/api/satellites/missing-sat/telemetry/simulate').send({})).status, 404);
});

t('health uses the existing algorithm on the latest valid reading', async () => {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: 'ada@example.com', password: credentials.password });
  const response = await agent.get('/api/satellites/sdo/health');
  assert.equal(response.status, 200);
  const expected = calculateHealth({ temperature: 32, battery: 90, solarPower: 80, voltage: 13, signal: 92 });
  assert.deepEqual(response.body.health, expected);
});

t('telemetry has a TTL retention index and the unique satellite id index exists', async () => {
  const telemetryIndexes = await Telemetry.collection.indexes();
  assert.ok(telemetryIndexes.some((i) => i.expireAfterSeconds > 0));
  assert.ok((await Satellite.collection.indexes()).some((i) => i.unique && i.key.id === 1));
});
