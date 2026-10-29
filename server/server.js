import mongoose from 'mongoose';
import { loadConfig } from './src/config/env.js';
import { connectDB } from './src/config/db.js';
import { createApp } from './src/app.js';
import Telemetry from './src/models/Telemetry.js';
import Satellite from './src/models/Satellite.js';
import User from './src/models/User.js';

let config;
try {
  config = loadConfig();
} catch (error) {
  console.error(error.message);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

try {
  await connectDB(config.mongodbUri);
  await Promise.all([Satellite.init(), Telemetry.init(), User.init()]); // build indexes
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const count = await Satellite.estimatedDocumentCount();
if (count === 0) console.warn('[warn] No satellites in the database. Run: npm run seed');

const server = createApp(config).listen(config.port, () =>
  console.log(`SpaceGuard API listening on http://localhost:${config.port} (${config.nodeEnv})`),
);

const shutdown = () => server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
