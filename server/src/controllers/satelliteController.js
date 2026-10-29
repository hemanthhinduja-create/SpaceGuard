import Satellite from '../models/Satellite.js';
import { searchSatellites, relatedSatellites } from '../../../src/utils/search.js';
import { HttpError, parseCatalogueQuery, requireSatelliteId } from '../utils/validators.js';

const clean = (doc) => {
  const { _id, createdAt, updatedAt, ...rest } = doc;
  return rest;
};

export const loadAll = async () => (await Satellite.find().sort({ name: 1 }).lean()).map(clean);

export async function findSatellite(rawId) {
  const id = requireSatelliteId(rawId);
  const doc = await Satellite.findOne({ id }).lean();
  if (!doc) throw new HttpError(404, 'Satellite not found.', 'SATELLITE_NOT_FOUND');
  return clean(doc);
}

export async function listSatellites(req, res) {
  const { category, q } = parseCatalogueQuery(req.query);
  let satellites = await loadAll();
  // Reuse the frontend's search/ranking logic (single implementation).
  if (q !== undefined || (category && category !== 'All missions'))
    satellites = searchSatellites(q ?? '', satellites, category ?? 'All missions');
  res.json({ count: satellites.length, satellites });
}

export async function getSatellite(req, res) {
  res.json({ satellite: await findSatellite(req.params.id) });
}

export async function getRelated(req, res) {
  const selected = await findSatellite(req.params.id);
  const related = relatedSatellites(selected, await loadAll()); // excludes self + archives, max 3
  res.json({ count: related.length, satellites: related });
}
