import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGames } from './lib/games.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const i = process.argv.indexOf('--only');
const only = i > -1 ? process.argv[i + 1] : undefined;
const { errors, warnings, checked } = checkGames({ root, only });
for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
if (errors.length) {
  console.error(`check:games failed (${errors.length} problem(s))`);
  process.exit(1);
}
console.log(`check:games ok (${checked.length} game(s))`);
