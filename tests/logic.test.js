import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { searchSatellites, relatedSatellites } from '../src/utils/search.js';
import { calculateHealth, classifyHealth } from '../src/utils/healthScore.js';
import { initialTelemetry, nextTelemetry, METRICS } from '../src/utils/telemetry.js';

const satellites = JSON.parse(
  readFileSync(new URL('../src/data/satellites.json', import.meta.url)),
);

test('catalogue contains 32 distinct, complete profiles and resolves every relationship and asset', () => {
  assert.equal(satellites.length, 32);
  assert.equal(new Set(satellites.map((item) => item.id)).size, 32);
  assert.equal(new Set(satellites.map((item) => item.category)).size, 7);
  for (const item of satellites) {
    assert.ok(item.description.length >= 30);
    assert.ok(Number.isInteger(item.launchYear));
    assert.ok(item.statusBasis);
    assert.ok(existsSync(new URL(`../public${item.image}`, import.meta.url)));
    for (const id of item.relatedSatelliteIds)
      assert.ok(
        satellites.some((related) => related.id === id),
        `${item.id}: invalid related ID ${id}`,
      );
  }
});

test('search covers case, partial names, missions, agencies, categories and multiple words', () => {
  assert.equal(searchSatellites('  aDiTyA-L1  ', satellites)[0].id, 'aditya-l1');
  assert.equal(searchSatellites('aditya–l1', satellites)[0].id, 'aditya-l1');
  assert.ok(
    searchSatellites('parker', satellites).some((item) => item.id === 'parker-solar-probe'),
  );
  assert.ok(searchSatellites('volatile', satellites).some((item) => item.id === 'maven'));
  assert.ok(searchSatellites('NASA solar', satellites).length >= 4);
  assert.equal(searchSatellites('Lunar', satellites).length, 3);
  assert.equal(searchSatellites('ISRO', satellites, 'Communication')[0].id, 'gsat-30');
});

test('no results, 400-character input and whitespace produce deterministic results', () => {
  assert.deepEqual(searchSatellites('xyz-nonexistent-satellite', satellites), []);
  assert.deepEqual(searchSatellites('z'.repeat(400), satellites), []);
  assert.equal(searchSatellites('   ', satellites).length, 32);
  assert.equal(searchSatellites('', satellites, 'Earth Observation').length, 6);
});

test('related missions exclude the selection and archives and prioritize curated connections', () => {
  const selected = satellites.find((item) => item.id === 'aditya-l1');
  const related = relatedSatellites(selected, satellites);
  assert.equal(related.length, 3);
  assert.ok(related.every((item) => item.id !== selected.id && item.status === 'Active'));
  assert.ok(related.every((item) => selected.relatedSatelliteIds.includes(item.id)));
});

test('known health example gives 93 and Excellent', () => {
  const health = calculateHealth({
    temperature: 35,
    battery: 87,
    solarPower: 82,
    voltage: 13.4,
    signal: 94,
  });
  assert.equal(health.score, 93); // (100 + 87 + 82 + 100 + 94) / 5 = 92.6, rounded.
  assert.equal(health.classification, 'EXCELLENT');
  assert.deepEqual(
    health.breakdown.map((item) => item.score),
    [100, 87, 82, 100, 94],
  );
});

test('all classification boundaries are inclusive and correct', () => {
  for (const [score, expected] of [
    [0, 'CRITICAL'],
    [49, 'CRITICAL'],
    [50, 'ATTENTION'],
    [74, 'ATTENTION'],
    [75, 'GOOD'],
    [89, 'GOOD'],
    [90, 'EXCELLENT'],
    [100, 'EXCELLENT'],
  ]) {
    assert.equal(classifyHealth(score), expected);
  }
});

test('health penalties handle lower and upper limits and clamp extreme values', () => {
  const nominal = { temperature: 10, battery: 100, solarPower: 100, voltage: 12, signal: 100 };
  assert.equal(calculateHealth(nominal).score, 100);
  assert.equal(calculateHealth({ ...nominal, temperature: 40, voltage: 14 }).score, 100);
  assert.equal(calculateHealth({ ...nominal, temperature: 0, voltage: 10 }).score, 80);
  assert.equal(calculateHealth({ ...nominal, temperature: 50, voltage: 16 }).score, 80);
  assert.equal(
    calculateHealth({ temperature: 100, battery: -200, solarPower: -1, voltage: 50, signal: -10 })
      .score,
    0,
  );
  assert.equal(calculateHealth({ ...nominal, battery: 500 }).score, 100);
});

test('missing or nonnumeric telemetry cannot produce a misleading health score', () => {
  assert.equal(calculateHealth(null), null);
  assert.equal(calculateHealth({}), null);
  assert.equal(calculateHealth({ ...initialTelemetry('aditya-l1'), battery: NaN }), null);
});

test('telemetry varies by mission and stays within its declared bounds over 10,000 updates', () => {
  assert.notDeepEqual(initialTelemetry('aditya-l1'), initialTelemetry('james-webb'));
  let sample = initialTelemetry('aditya-l1');
  for (let tick = 0; tick < 10000; tick += 1) {
    const previous = sample;
    sample = nextTelemetry(sample, () => (tick % 2 ? 1 : 0));
    assert.ok(sample.fuel <= previous.fuel);
    for (const metric of METRICS) {
      assert.ok(Number.isFinite(sample[metric.key]));
      assert.ok(sample[metric.key] >= metric.min && sample[metric.key] <= metric.max);
    }
  }
});
