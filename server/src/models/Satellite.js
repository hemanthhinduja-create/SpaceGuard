import mongoose from 'mongoose';

const satelliteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, match: /^[a-z0-9-]{1,80}$/ },
    name: { type: String, required: true },
    agency: { type: String, required: true },
    mission: { type: String, required: true },
    category: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ['Active', 'Archive'] },
    statusBasis: { type: String, required: true },
    orbit: { type: String, required: true },
    description: { type: String, required: true },
    launchYear: { type: Number, required: true },
    image: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    relatedSatelliteIds: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export default mongoose.models.Satellite || mongoose.model('Satellite', satelliteSchema);
