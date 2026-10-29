import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const path = join(dir, name);
    statSync(path).isDirectory() ? walk(path, files) : files.push(path);
  }
  return files;
}
const root = fileURLToPath(new URL('..', import.meta.url));

test('no Firebase code, URL or dependency remains in application sources', () => {
  const files = [...walk(join(root, 'src')), ...walk(join(root, 'server', 'src')), join(root, 'package.json'), join(root, 'server', 'package.json')];
  for (const file of files) assert.doesNotMatch(readFileSync(file, 'utf8'), /firebase/i, file);
});

test('frontend never stores passwords or tokens in localStorage', () => {
  const source = readFileSync(join(root, 'src/hooks/useAuth.jsx'), 'utf8');
  const code = source.replace(/\/\/.*$/gm, ''); // ignore comments, check executable code
  assert.doesNotMatch(code, /localStorage|readStorage|writeStorage|passwordHash/);
});

test('frontend env files contain no backend secrets', () => {
  const env = readFileSync(join(root, '.env.example'), 'utf8');
  assert.doesNotMatch(env, /MONGODB|JWT_SECRET|mongodb\+srv/i);
});
