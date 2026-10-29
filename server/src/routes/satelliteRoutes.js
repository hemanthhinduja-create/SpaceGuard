import { Router } from 'express';
import { getRelated, getSatellite, listSatellites } from '../controllers/satelliteController.js';
import * as telemetry from '../controllers/telemetryController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import dbReady from '../middleware/dbReady.js';

// Express 4 does not catch rejected promises from async handlers, so wrap them.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export default function satelliteRoutes(config) {
  const router = Router();
  const auth = requireAuth(config);
  router.use(dbReady);
  // Catalogue: public reference data.
  router.get('/', wrap(listSatellites));
  router.get('/:id', wrap(getSatellite));
  router.get('/:id/related', wrap(getRelated));
  // Telemetry & health: authenticated.
  router.get('/:id/telemetry', auth, wrap(telemetry.getLatest));
  router.get('/:id/telemetry/history', auth, wrap(telemetry.getHistory));
  router.post('/:id/telemetry/simulate', auth, wrap(telemetry.simulate));
  router.get('/:id/health', auth, wrap(telemetry.getHealth));
  return router;
}
