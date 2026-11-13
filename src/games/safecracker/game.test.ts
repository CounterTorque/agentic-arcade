import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, levelParams, step, sweptWindow } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('wins across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const rng = createRng(seed);
          const state = createState(rng.next());
          const params = levelParams(level);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (_frame, input) => {
              const next = state.angle + state.direction * params.revolutionsPerSecond * speed * dt / 1000;
              const pressed = state.canLock && sweptWindow(state.angle, next, params);
              if (pressed) input.tap('action');
              step(state, dt, pressed, params, speed, () => rng.next());
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
          expect(result.elapsedMs).toBeLessThanOrEqual(6000 / speed);
        }
      }
    }
  });

  it('loses when idle', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses on a mistimed press', async () => {
    const result = await runEntry(entry, { script: (frame, input) => { if (frame === 0) input.tap('action'); } });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeLessThan(1000);
  });
});
