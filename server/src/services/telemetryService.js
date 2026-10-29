// Simulated telemetry. Reuses the frontend's generator and health algorithm so there is ONE implementation.
import Telemetry from '../models/Telemetry.js';
import { initialTelemetry, nextTelemetry } from '../../../src/utils/telemetry.js';
import { calculateHealth } from '../../../src/utils/healthScore.js';

// Storage strategy: the dashboard asks for a new sample every ~2 s, but a sample is only
// persisted when at least STORE_INTERVAL_MS has passed since the last persisted one.
// Between writes the simulator state advances in memory, so the stream stays smooth
// while MongoDB receives at most 1 write / 10 s / satellite (plus the 24 h TTL cleanup).
export const STORE_INTERVAL_MS = 10_000;

const liveState = new Map(); // satelliteId -> { sample, persistedAt }

export function serialize(doc) {
  const o = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    satelliteId: o.satelliteId,
    timestamp: new Date(o.timestamp).toISOString(),
    temperature: o.temperature,
    battery: o.battery,
    solarPower: o.solarPower,
    voltage: o.voltage,
    signal: o.signal,
    propellant: o.propellant,
    fuel: o.propellant, // alias: the existing frontend metric key is `fuel`
    dataRate: o.dataRate,
    simulated: true,
  };
}

const toSample = (doc) => ({
  temperature: doc.temperature,
  battery: doc.battery,
  solarPower: doc.solarPower,
  voltage: doc.voltage,
  signal: doc.signal,
  fuel: doc.propellant,
  dataRate: doc.dataRate,
});

export const latestReading = (satelliteId) => Telemetry.findOne({ satelliteId }).sort({ timestamp: -1 }).lean();

export async function history(satelliteId, limit) {
  const rows = await Telemetry.find({ satelliteId }).sort({ timestamp: -1 }).limit(limit).lean();
  return rows.reverse().map(serialize); // chronological order
}

export async function simulate(satelliteId, now = Date.now(), random = Math.random) {
  let state = liveState.get(satelliteId);
  if (!state) {
    const last = await latestReading(satelliteId);
    state = last
      ? { sample: toSample(last), persistedAt: new Date(last.timestamp).getTime() }
      : { sample: null, persistedAt: 0 };
  }
  const sample = state.sample ? nextTelemetry(state.sample, random) : initialTelemetry(satelliteId);
  const reading = { satelliteId, timestamp: new Date(now), ...sample, propellant: sample.fuel };
  delete reading.fuel;
  let persisted = false;
  if (!state.persistedAt || now - state.persistedAt >= STORE_INTERVAL_MS) {
    await Telemetry.create(reading);
    persisted = true;
  }
  liveState.set(satelliteId, { sample, persistedAt: persisted ? now : state.persistedAt });
  return { reading: serialize(reading), persisted };
}

export function healthFor(reading) {
  return calculateHealth(reading); // null when any scored metric is missing / non-finite
}

export const resetLiveState = () => liveState.clear();
