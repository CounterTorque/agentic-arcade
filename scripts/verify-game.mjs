import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const full = args.includes('--full');
const id = args.find((a) => !a.startsWith('--'));
if (!id) {
  console.error('usage: npm run verify:game -- <id> [--full]');
  process.exit(2);
}
const win = process.platform === 'win32';
const bin = (name) => (win ? `${name}.cmd` : name);

async function chromiumInstalled() {
  try {
    const { chromium } = await import('@playwright/test');
    return fs.existsSync(chromium.executablePath());
  } catch {
    return false;
  }
}

const steps = [
  ['eslint', bin('npx'), ['eslint', `src/games/${id}`]],
  ['typecheck', bin('npm'), ['run', 'typecheck']],
  ['check-games', 'node', ['scripts/check-games.mjs', '--only', id]],
  ['contract + unit tests', bin('npx'), ['vitest', 'run', 'tests/contract', `src/games/${id}`], { GAME: id }],
  ['build', bin('npx'), ['vite', 'build']],
  ['check-budget', 'node', ['scripts/check-budget.mjs', '--only', id]],
];

for (const [name, cmd, args, env] of steps) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env, ...(full ? { TEST_DEPTH: 'full' } : {}) } });
  if (r.status !== 0) {
    console.error(`\nverify:game failed at step "${name}"`);
    process.exit(r.status ?? 1);
  }
}

console.log(`\n=== e2e (${full ? 'full' : 'smoke'}) ===`);
const spec = 'tests/e2e/games.spec.ts';
if (!fs.existsSync(path.join(root, spec))) console.log(`skipped: ${spec} does not exist yet`);
else if (!(await chromiumInstalled())) console.log('skipped: chromium not installed (run `npx playwright install chromium`)');
else {
  const files = full ? [spec, `src/games/${id}/`] : [spec];
  const r = spawnSync(bin('npx'), ['playwright', 'test', ...files], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, GAME: id, ...(full ? { TEST_DEPTH: 'full' } : {}) },
  });
  if (r.status !== 0) {
    console.error('\nverify:game failed at step "e2e"');
    process.exit(r.status ?? 1);
  }
}
console.log(`\nverify:game ${id}: all steps passed`);
