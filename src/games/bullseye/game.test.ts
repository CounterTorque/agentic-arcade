import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, step, TARGET } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('hits the center across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const rng = createRng(seed);
          const state = createState(level, rng);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              if (frame <= 30) step(state, dt, speed, rng);
              if (frame === 30) input.setPointer(TARGET.x - state.dx, TARGET.y - state.dy, true);
              if (frame === 31) input.setPointer(TARGET.x - state.dx, TARGET.y - state.dy, false);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when idle or after an off-target shot', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
    expect(await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) input.setPointer(0, 0, true);
      if (frame === 1) input.setPointer(0, 0, false);
    } })).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('ignores a keyboard action with the pointer outside the stage', async () => {
    expect(await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) input.tap('action');
    } })).toMatchObject({ kind: 'lose', via: 'game' });
  });
});
