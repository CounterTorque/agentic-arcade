import { describe, expect, it } from 'vitest';
import { checkGame } from '../helpers/contract';
import { fixture } from '../helpers/fixtures';

const checksFor = async (name: string) => (await checkGame(fixture(name))).failures.map((f) => f.check);

describe('checkGame against fixtures', () => {
  it('passes always-win', async () => {
    expect((await checkGame(fixture('always-win'))).failures).toEqual([]);
  });

  it('passes timeout-lose', async () => {
    expect((await checkGame(fixture('timeout-lose'))).failures).toEqual([]);
  });

  it('fails throws-in-create at idle and fuzz', async () => {
    expect(await checksFor('throws-in-create')).toEqual(expect.arrayContaining(['idle', 'fuzz']));
  });

  it('fails throws-on-tick at idle and fuzz', async () => {
    expect(await checksFor('throws-on-tick')).toEqual(expect.arrayContaining(['idle', 'fuzz']));
  });

  it('fails leaky at hygiene only', async () => {
    const report = await checkGame(fixture('leaky'));
    expect([...new Set(report.failures.map((f) => f.check))]).toEqual(['hygiene']);
    const msgs = report.failures.map((f) => f.message).join(' ');
    expect(msgs).toContain('window.addEventListener');
    expect(msgs).toContain('setTimeout');
  });

  it('fails nondeterministic at determinism and hygiene', async () => {
    expect(await checksFor('nondeterministic')).toEqual(expect.arrayContaining(['determinism', 'hygiene']));
  });
});
