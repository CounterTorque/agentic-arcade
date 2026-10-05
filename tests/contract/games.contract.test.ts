import { describe, expect, it } from 'vitest';
import { findDuplicateTitles } from '../../src/framework/manifest-schema';
import { registry } from '../../src/framework/registry';
import { checkGame } from '../helpers/contract';

const only = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.GAME;
const entries = registry.entries.filter((e) => !only || e.id === only);

describe('registry', () => {
  it('has no invalid games', () => {
    expect(registry.problems).toEqual([]);
  });

  it('has unique titles', () => {
    expect(findDuplicateTitles(registry.entries.map((e) => e.manifest))).toEqual([]);
  });
});

describe.each(entries.map((e) => [e.id, e] as const))('game %s', (_id, entry) => {
  it('satisfies the runtime contract', async () => {
    const report = await checkGame(entry);
    expect(report.failures).toEqual([]);
  }, 60_000);
});
