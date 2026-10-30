import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, levelParams, step } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('wins complete rounds across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const { maxDrift } = levelParams(level);
          const state = createState(level, createRng(seed).range(-maxDrift, maxDrift));
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (_frame, input) => {
              const pressed = !state.tossed && state.doneness >= 1.05;
              const delta = state.pancakeX - state.panX;
              const direction = state.tossed && Math.abs(delta) > 10 ? Math.sign(delta) : 0;
              if (pressed) input.tap('action');
              if (direction < 0) input.press('left'); else input.release('left');
              if (direction > 0) input.press('right'); else input.release('right');
              step(state, dt, pressed, direction, speed);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when the pan moves away from a golden pancake', async () => {
    const state = createState(1, createRng(1).range(-40, 40));
    const result = await runEntry(entry, {
      script: (_frame, input) => {
        const pressed = !state.tossed && state.doneness >= 1.05;
        const direction = state.tossed ? 1 : 0;
        if (pressed) input.tap('action');
        if (direction) input.press('right');
        step(state, dt, pressed, direction, 1);
      },
    });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(state.verdict).toBe('floor');
  });

  it('loses when idle or flipped immediately', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
    expect(await runEntry(entry, { script: (frame, input) => { if (frame === 0) input.tap('action'); } }))
      .toMatchObject({ kind: 'lose', via: 'game' });
  });
});
