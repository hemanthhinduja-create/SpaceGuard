import { readFileSync } from 'node:fs';

export const testConfig = {
  nodeEnv: 'test',
  isProduction: false,
  port: 0,
  mongodbUri: 'unused',
  jwtSecret: 'test-secret-test-secret-test-secret-123456',
  clientUrls: ['http://localhost:5173'],
};

export const records = JSON.parse(readFileSync(new URL('../../src/data/satellites.json', import.meta.url)));
