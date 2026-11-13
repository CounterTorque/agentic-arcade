import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, hookX, levelParams, step, topX } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('wins across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const state = createState(createRng(seed).next());
          const params = levelParams(level);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (_frame, input) => {
              const next = { ...state, phase: state.phase + dt * speed / (params.period * params.quicken ** state.stack.length) };
              const pressed = state.crate === 'hanging' && Math.abs(hookX(next) - topX(state)) < params.width * 0.3;
              if (pressed) input.tap('action');
              step(state, dt, pressed, params, speed);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
          expect(result.elapsedMs).toBeLessThanOrEqual(8000 / speed);
        }
      }
    }
  });

  it('loses when idle', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when dropped at the swing extreme', async () => {
    const seed = 1;
    const state = createState(createRng(seed).next());
    const params = levelParams(1);
    const result = await runEntry(entry, {
      seed,
      script: (_frame, input) => {
        const pressed = state.crate === 'hanging' && Math.abs(hookX(state) - 480) > 200;
        if (pressed) input.tap('action');
        step(state, dt, pressed, params, 1);
      },
    });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeLessThan(4000);
  });
});
