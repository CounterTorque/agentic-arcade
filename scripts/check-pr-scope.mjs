import { execFileSync } from 'node:child_process';
import { evaluateScope } from './lib/pr-scope.mjs';

const [base, head] = process.argv.slice(2);
if (!base || !head) {
  console.error('usage: node scripts/check-pr-scope.mjs <base-ref> <head-branch>');
  process.exit(2);
}
const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' });
const files = out.split('\n').filter(Boolean);
const { games, error } = evaluateScope(head, files);
if (error) {
  console.error(`error: ${error}`);
  process.exit(1);
}
console.log(`games=${games}`);
