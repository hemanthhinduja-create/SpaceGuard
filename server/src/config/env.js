import dotenv from 'dotenv';

dotenv.config();

const PLACEHOLDER = 'replace_with_a_long_random_secret';

export function loadConfig(source = process.env) {
  const nodeEnv = source.NODE_ENV || 'development';
  const port = Number(source.PORT || 4000);
  const errors = [];
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('PORT must be 1-65535.');
  if (!source.MONGODB_URI) errors.push('MONGODB_URI is required (see server/.env.example).');
  if (!source.JWT_SECRET || source.JWT_SECRET === PLACEHOLDER || source.JWT_SECRET.length < 32)
    errors.push('JWT_SECRET must be set to a random value of at least 32 characters.');
  const clientUrls = (source.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  if (source.VERCEL_URL) {
    const vercelOrigin = `https://${source.VERCEL_URL.replace(/\/$/, '')}`;
    if (!clientUrls.includes(vercelOrigin)) clientUrls.push(vercelOrigin);
  }
  if (source.VERCEL_PROJECT_PRODUCTION_URL) {
    const prodOrigin = `https://${source.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
    if (!clientUrls.includes(prodOrigin)) clientUrls.push(prodOrigin);
  }
  if (errors.length) {
    const error = new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
    error.code = 'ENV_INVALID';
    throw error;
  }
  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isVercel: Boolean(source.VERCEL),
    port,
    mongodbUri: source.MONGODB_URI,
    jwtSecret: source.JWT_SECRET,
    clientUrls,
  };
}
