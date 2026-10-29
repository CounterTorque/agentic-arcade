import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { levelParams, type Level } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

describe(manifest.id, () => {
  it('wins by dashing after the first snap and returning with the cheese', async () => {
    for (const level of [1, 2, 3] as Level[]) {
      for (const speed of [1, 2.5]) {
        for (let seed = 1; seed <= depth(3, 20); seed++) {
          const params = levelParams(level);
          const dash = Math.ceil(((100 + params.warningMs) / speed) / (1000 / 60)) + 1;
          const back = dash + Math.ceil((300 / params.mouseSpeed * 1000 / speed) / (1000 / 60)) + 1;
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              if (frame === dash || frame === back) input.tap('action');
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when idle', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when caught outside', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 0 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeLessThan(1000);
  });
});
