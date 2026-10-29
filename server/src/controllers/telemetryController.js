import { findSatellite } from './satelliteController.js';
import * as service from '../services/telemetryService.js';
import { HttpError, parseLimit } from '../utils/validators.js';

export async function getLatest(req, res) {
  const satellite = await findSatellite(req.params.id);
  const doc = await service.latestReading(satellite.id);
  if (!doc) throw new HttpError(404, 'No telemetry has been generated yet. POST /telemetry/simulate first.', 'NO_TELEMETRY');
  res.json({ simulated: true, reading: service.serialize(doc) });
}

export async function getHistory(req, res) {
  const satellite = await findSatellite(req.params.id);
  const limit = parseLimit(req.query.limit);
  const readings = await service.history(satellite.id, limit);
  res.json({ simulated: true, count: readings.length, readings });
}

export async function simulate(req, res) {
  const satellite = await findSatellite(req.params.id);
  const { reading, persisted } = await service.simulate(satellite.id);
  res.status(persisted ? 201 : 200).json({ simulated: true, persisted, reading });
}

export async function getHealth(req, res) {
  const satellite = await findSatellite(req.params.id);
  const doc = await service.latestReading(satellite.id);
  if (!doc)
    throw new HttpError(404, 'Mission health is unavailable: no telemetry has been recorded for this satellite.', 'NO_TELEMETRY');
  const health = service.healthFor(doc);
  if (!health) throw new HttpError(422, 'Latest telemetry is incomplete; health cannot be calculated.', 'INVALID_TELEMETRY');
  res.json({ simulated: true, satelliteId: satellite.id, basedOn: new Date(doc.timestamp).toISOString(), health });
}
