import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { loadConfig } from '../server/src/config/env.js';
import { connectDB } from '../server/src/config/db.js';
import { createApp } from '../server/src/app.js';
import Satellite from '../server/src/models/Satellite.js';
import Telemetry from '../server/src/models/Telemetry.js';
import User from '../server/src/models/User.js';
import { seedSatellites } from '../server/src/scripts/seedSatellites.js';

let appInstance = null;
let dbPromise = null;

async function getApp() {
  const config = loadConfig();

  if (mongoose.connection.readyState !== 1) {
    if (!dbPromise) {
      dbPromise = (async () => {
        await connectDB(config.mongodbUri);
        await Promise.all([Satellite.init(), Telemetry.init(), User.init()]);
        const count = await Satellite.estimatedDocumentCount();
        if (count === 0) {
          try {
            const seedPath = fileURLToPath(new URL('../src/data/satellites.json', import.meta.url));
            const records = JSON.parse(readFileSync(seedPath, 'utf8'));
            await seedSatellites(records);
            console.log('[info] Database auto-seeded with 32 satellite profiles.');
          } catch (seedErr) {
            console.warn('[warn] Auto-seeding encountered:', seedErr.message);
          }
        }
      })();
    }
    try {
      await dbPromise;
    } catch (err) {
      dbPromise = null;
      throw err;
    }
  }

  if (!appInstance) {
    appInstance = createApp(config);
  }
  return appInstance;
}

export default async function handler(req, res) {
  // Normalize req.url so Express routes matching /api/* always resolve
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[error] Serverless handler error:', error.message);
    const isEnvError = error.code === 'ENV_INVALID';
    const detailMsg = isEnvError
      ? `${error.message.replace(/^Invalid environment configuration:\s*/, '').replace(/\n/g, ' ')}. (If you just saved variables in Vercel Settings, you must Redeploy under Deployments for them to take effect).`
      : 'SpaceGuard service is temporarily unavailable. Check your MongoDB connection.';
    return res.status(503).json({
      error: {
        code: isEnvError ? 'ENV_CONFIGURATION_MISSING' : 'DATABASE_UNAVAILABLE',
        message: detailMsg,
      },
    });
  }
}
