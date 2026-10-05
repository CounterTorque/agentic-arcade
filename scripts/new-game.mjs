import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { scaffoldGame } from './lib/scaffold.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { title: { type: 'string' }, verb: { type: 'string' }, author: { type: 'string' } },
});
const id = positionals[0];
if (!id) {
  console.error('usage: npm run new:game -- <id> [--title "Title"] [--verb "VERB!"] [--author name]');
  process.exit(2);
}
try {
  const dir = scaffoldGame({ root, id, ...values });
  console.log(`created ${path.relative(root, dir)}/\nnext: npm run dev, then open http://localhost:5173/agentic-arcade/#/play/${id}?seed=1`);
} catch (e) {
  console.error(`error: ${e.message}`);
  process.exit(1);
}
