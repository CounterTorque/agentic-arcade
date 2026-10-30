import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, step, windowRect } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('clears all lights including relights across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const rng = createRng(seed);
          const timeLimit = Math.max(2000, Math.round(5000 / speed));
          const state = createState(level, rng, timeLimit);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              let click = null;
              if (frame % 2 === 0) {
                const index = state.lit.indexOf(true);
                if (index !== -1) {
                  const rect = windowRect(level, index);
                  click = { x: rect.x + 40, y: rect.y + 30 };
                  input.setPointer(click.x, click.y, true);
                }
              } else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
              step(state, dt, rng, click);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
          if (result.kind !== 'error') expect(result.elapsedMs).toBeGreaterThanOrEqual(timeLimit);
        }
      }
    }
  });

  it('loses when idle or when one window is left lit', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
    const state = createState(1, createRng(1), 5000);
    const targets = state.lit.flatMap((lit, i) => lit ? [i] : []).slice(1);
    expect(await runEntry(entry, { script: (frame, input) => {
      if (frame % 2 === 0 && frame / 2 < targets.length) {
        const rect = windowRect(1, targets[frame / 2]);
        input.setPointer(rect.x + 40, rect.y + 30, true);
      } else if (frame % 2 === 1) input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
    } })).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('counts a click on the final tick', async () => {
    const state = createState(1, createRng(1), 5000);
    const targets = state.lit.flatMap((lit, i) => lit ? [i] : []);
    const host = createFakeHost({ frameMs: 50 });
    try {
      expect(await runEntry(entry, { host, script: (frame, input) => {
        const target = frame < 10 && frame % 2 === 0 ? targets[frame / 2] : frame === 99 ? targets[5] : undefined;
        if (target !== undefined) {
          const rect = windowRect(1, target);
          input.setPointer(rect.x + 40, rect.y + 30, true);
        } else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
      } })).toMatchObject({ kind: 'win', via: 'game', elapsedMs: 5000 });
    } finally {
      host.dispose();
    }
  });
});
