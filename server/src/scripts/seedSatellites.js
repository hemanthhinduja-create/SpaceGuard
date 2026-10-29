import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { loadConfig } from '../config/env.js';
import { connectDB } from '../config/db.js';
import Satellite from '../models/Satellite.js';
import { validateSatelliteRecords } from '../utils/validators.js';

const DATA_FILE = new URL('../../../src/data/satellites.json', import.meta.url);

export async function seedSatellites(records) {
  const problems = validateSatelliteRecords(records);
  if (problems.length) throw new Error(`Seed data is invalid:\n - ${problems.join('\n - ')}`);
  await Satellite.init();
  // Idempotent bulk upsert keyed on the stable satellite id. Nothing is ever deleted.
  const result = await Satellite.bulkWrite(
    records.map((record) => ({
      updateOne: { filter: { id: record.id }, update: { $set: record }, upsert: true },
    })),
  );
  const total = await Satellite.countDocuments();
  return { inserted: result.upsertedCount, updated: result.matchedCount, total };
}

export async function verifyRelations() {
  const all = await Satellite.find({}, { id: 1, relatedSatelliteIds: 1 }).lean();
  const ids = new Set(all.map((item) => item.id));
  return all.flatMap((item) => item.relatedSatelliteIds.filter((r) => !ids.has(r)).map((r) => `${item.id} -> ${r}`));
}

// Run only when executed directly (`npm run seed`), not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seedSatellites.js')) {
  try {
    const config = loadConfig();
    await connectDB(config.mongodbUri);
    const records = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
    const summary = await seedSatellites(records);
    const broken = await verifyRelations();
    console.log(`Seed complete: ${summary.inserted} inserted, ${summary.updated} already present (updated), ${summary.total} total.`);
    if (broken.length) { console.error(`Broken related IDs:\n - ${broken.join('\n - ')}`); process.exitCode = 1; }
    else console.log('All relatedSatelliteIds resolve to existing satellites.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
