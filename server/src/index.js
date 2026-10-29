import { loadConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import Satellite from './models/Satellite.js';
import Telemetry from './models/Telemetry.js';
import User from './models/User.js';

const config = loadConfig();

let connectionPromise;

async function initializeDatabase() {
  if (!connectionPromise) {
    connectionPromise = (async () => {
      await connectDB(config.mongodbUri);
      await Promise.all([
        Satellite.init(),
        Telemetry.init(),
        User.init(),
      ]);
    })().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
}

const app = createApp(config);

// Export the Express app directly for Vercel.
app.use(async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error(
      'SpaceGuard initialization failed:',
      error.code || error.name,
    );

    res.status(503).json({
      error: 'Service temporarily unavailable',
    });
  }
});

export default app;