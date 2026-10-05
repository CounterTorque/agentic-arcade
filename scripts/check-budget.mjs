import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { checkBudget } from './lib/budget.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '.vite', 'manifest.json');
const i = process.argv.indexOf('--only');
const only = i > -1 ? process.argv[i + 1] : undefined;

if (!fs.existsSync(manifestPath)) {
  console.error('error: dist/.vite/manifest.json not found; run `npm run build` first');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const gzip = (file) => zlib.gzipSync(fs.readFileSync(path.join(dist, file))).length;
const { errors, warnings, sizes } = checkBudget(manifest, gzip, only);
for (const [id, size] of Object.entries(sizes)) console.log(`${id}: ${(size / 1024).toFixed(1)} KB gzip`);
for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
if (errors.length) process.exit(1);
console.log(`check:budget ok (${Object.keys(sizes).length} game(s))`);
