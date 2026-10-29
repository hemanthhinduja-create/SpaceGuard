import { readStorage, writeStorage } from '../utils/storage.js';
import { apiRequest } from './apiClient.js';

const CACHE_VERSION = 3;

let memoryCache = null;


// Validate satellite catalogue
export function isValidCatalogue(data) {
  const fields = [
    'id',
    'name',
    'agency',
    'mission',
    'category',
    'status',
    'statusBasis',
    'orbit',
    'description',
    'image',
    'sourceUrl',
  ];

  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.length <= 1000 &&

    data.every(
      (item) =>
        item &&

        fields.every(
          (key) =>
            typeof item[key] === 'string' &&
            item[key].length > 0
        ) &&

        /^[a-z0-9-]{1,80}$/.test(item.id) &&

        Number.isInteger(item.launchYear) &&

        ['Active', 'Archive'].includes(item.status) &&

        item.image.startsWith('/visuals/') &&

        /^https:\/\//.test(item.sourceUrl) &&

        Array.isArray(item.relatedSatelliteIds) &&

        item.relatedSatelliteIds.every(
          (id) => typeof id === 'string'
        )
    ) &&

    new Set(
      data.map((item) => item.id)
    ).size === data.length
  );
}


// Get the satellite catalogue from the Express/MongoDB API
export async function getSatellites({ force = false, signal } = {}) {
  // Use memory cache unless force refresh is requested
  if (memoryCache && !force) return memoryCache;

  try {
    const data = await apiRequest('/satellites', {
      signal,
      cache: force ? 'no-store' : undefined,
    });
    const satellites = data?.satellites;

    if (!isValidCatalogue(satellites)) {
      throw new Error('Satellite catalogue format is invalid.');
    }

    // Keep a copy of the last good API response for an explicit, visible "saved catalogue" fallback.
    writeStorage('catalogue', { version: CACHE_VERSION, satellites });
    memoryCache = { satellites, source: 'api' };
    return memoryCache;
  } catch (error) {
    // Request was intentionally cancelled (e.g. React StrictMode unmount).
    if (error?.name === 'AbortError' || signal?.aborted) return;

    const saved = readStorage(
      'catalogue',
      null,
      (value) => value?.version === CACHE_VERSION && isValidCatalogue(value.satellites),
    );
    if (saved) {
      // The UI shows a banner whenever source === 'saved'; this is never silent.
      memoryCache = { satellites: saved.satellites, source: 'saved' };
      return memoryCache;
    }

    throw new Error(
      error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT' || error?.status >= 500
        ? `Unable to load mission data. ${error.message}`
        : 'Unable to load mission data from the SpaceGuard server.',
    );
  }
}

// Telemetry (simulated on the server and stored in MongoDB)
export async function getTelemetryHistory(id, { limit = 24, signal } = {}) {
  const data = await apiRequest(`/satellites/${encodeURIComponent(id)}/telemetry/history?limit=${limit}`, { signal });
  return data.readings;
}

export async function simulateTelemetry(id, { signal } = {}) {
  const data = await apiRequest(`/satellites/${encodeURIComponent(id)}/telemetry/simulate`, {
    method: 'POST',
    body: {},
    signal,
  });
  return data.reading;
}


// Find a satellite by ID
export function getSatelliteById(
  id,
  satellites
) {

  return (
    satellites.find(
      (satellite) =>
        satellite.id === id
    ) ?? null
  );

}