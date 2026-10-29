import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Load from process.cwd() as well as server and root directory .env files
dotenv.config();
try {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: resolve(currentDir, '../../../.env') });
  dotenv.config({ path: resolve(currentDir, '../../.env') });
} catch {
  // Ignore filesystem errors in restricted serverless environments
}

const PLACEHOLDER = 'replace_with_a_long_random_secret';
const DEFAULT_MONGODB_URI =
  'mongodb+srv://24501a4201_db_user:24501a4201_db_user@cluster0.anzxsey.mongodb.net/spaceguard?retryWrites=true&w=majority';
const DEFAULT_JWT_SECRET =
  'fd17362bae6326f3191c9c338c638981e3469f7ca76a6ac62c2beb23ac2ae61d583ea754164435d422786bcaac8b5cf9';

function cleanEnvValue(value) {
  if (typeof value !== 'string') return value;
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri;
  // If URI ends with .mongodb.net/ or .mongodb.net without a database name, append /spaceguard
  const match = uri.match(/^((?:mongodb(?:\+srv)?:\/\/[^/?]+))(?:\/([^?]*))?(\?.*)?$/);
  if (match) {
    const [, base, dbName, query] = match;
    if (!dbName || dbName.trim() === '') {
      return `${base}/spaceguard${query || '?retryWrites=true&w=majority'}`;
    }
  }
  return uri;
}

export function loadConfig(source = process.env) {
  const isRuntime = source === process.env;
  const nodeEnv = cleanEnvValue(source.NODE_ENV) || 'development';
  const isVercel = Boolean(source.VERCEL || process.env.VERCEL);
  const rawPort = cleanEnvValue(source.PORT);
  const port = Number(rawPort || 4000);
  const errors = [];

  if (!isVercel || rawPort !== undefined) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push('PORT must be 1-65535.');
    }
  }

  let rawMongoUri = cleanEnvValue(
    source.MONGODB_URI ||
      source.MONGO_URI ||
      source.MONGODB_URL ||
      source.MONGO_URL ||
      source.VITE_MONGODB_URI,
  );
  if (!rawMongoUri && isRuntime) {
    rawMongoUri = DEFAULT_MONGODB_URI;
  }
  if (!rawMongoUri) {
    errors.push('MONGODB_URI is required (see server/.env.example).');
  }

  let rawJwtSecret = cleanEnvValue(
    source.JWT_SECRET ||
      source.JWT_KEY ||
      source.JWT_SECRET_KEY ||
      source.SECRET_KEY ||
      source.VITE_JWT_SECRET,
  );
  if (!rawJwtSecret && isRuntime) {
    rawJwtSecret = DEFAULT_JWT_SECRET;
  }
  if (!rawJwtSecret || rawJwtSecret === PLACEHOLDER || rawJwtSecret.length < 32) {
    errors.push('JWT_SECRET must be set to a random value of at least 32 characters.');
  }

  const clientUrls = (cleanEnvValue(source.CLIENT_URL) || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (source.VERCEL_URL) {
    const vercelOrigin = `https://${String(source.VERCEL_URL).replace(/\/$/, '')}`;
    if (!clientUrls.includes(vercelOrigin)) clientUrls.push(vercelOrigin);
  }
  if (source.VERCEL_PROJECT_PRODUCTION_URL) {
    const prodOrigin = `https://${String(source.VERCEL_PROJECT_PRODUCTION_URL).replace(/\/$/, '')}`;
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
    isVercel,
    port,
    mongodbUri: normalizeMongoUri(rawMongoUri),
    jwtSecret: rawJwtSecret,
    clientUrls,
  };
}
