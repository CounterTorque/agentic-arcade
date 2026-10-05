import { describe, expect, it } from 'vitest';
import { buildRegistry } from '../../src/framework/registry';
import { fixtureRegistry } from '../helpers/fixtures';

describe('buildRegistry', () => {
  it('registers valid fixtures sorted by title', () => {
    const titles = fixtureRegistry.entries.map((e) => e.manifest.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    expect(fixtureRegistry.entries.map((e) => e.id)).toContain('always-win');
  });

  it('reports id mismatches', () => {
    const p = fixtureRegistry.problems.find((x) => x.dir === 'bad-manifest');
    expect(p?.errors.join(' ')).toContain('must equal directory name');
  });

  it('reports a missing index.ts and missing manifest.ts', () => {
    const { manifest } = fixtureRegistry.entries[0]!;
    const load = async () => ({ contractVersion: 1 as const, create: () => ({ tick() {} }) });
    const r = buildRegistry({ '/src/games/a-game/manifest.ts': { ...manifest, id: 'a-game' } }, { '/src/games/b-game/index.ts': load });
    expect(r.entries).toEqual([]);
    expect(r.problems).toEqual(
      expect.arrayContaining([
        { dir: 'a-game', errors: ['missing index.ts'] },
        { dir: 'b-game', errors: ['missing manifest.ts'] },
      ]),
    );
  });

  it('works with zero games', () => {
    expect(buildRegistry({}, {})).toEqual({ entries: [], problems: [] });
  });
});
