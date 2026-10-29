import mongoose from 'mongoose';

// Retention: readings expire automatically after 24 hours (TTL index on `timestamp`).
export const TELEMETRY_RETENTION_SECONDS = 24 * 60 * 60;

const telemetrySchema = new mongoose.Schema(
  {
    satelliteId: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    temperature: { type: Number, required: true },
    battery: { type: Number, required: true },
    solarPower: { type: Number, required: true },
    voltage: { type: Number, required: true },
    signal: { type: Number, required: true },
    propellant: { type: Number, required: true },
    dataRate: { type: Number, required: true },
    simulated: { type: Boolean, default: true, immutable: true },
  },
  { versionKey: false },
);
telemetrySchema.index({ satelliteId: 1, timestamp: -1 });
telemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: TELEMETRY_RETENTION_SECONDS });

export default mongoose.models.Telemetry || mongoose.model('Telemetry', telemetrySchema);
