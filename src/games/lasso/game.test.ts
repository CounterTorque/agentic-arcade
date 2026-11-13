import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { CALF_Y, createState, predictCalf, step, TRAVEL_MS } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

describe('lasso rounds', () => {
  it('can lead the calf across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const state = createState(level, createRng(seed), speed);
          const result = await runEntry(entry, { level, speed, seed, script: (frame, input) => {
            if (frame < 60) step(state, 1000 / 60, { x: 0, y: 0, pressed: false, inside: false });
            if (frame === 60) input.setPointer(predictCalf(state, state.elapsed + TRAVEL_MS), CALF_Y, true);
            if (frame === 61) input.setPointer(0, 0, false);
          } });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses if a throw is still in flight at timeout', async () => {
    const host = createFakeHost({ frameMs: 50 });
    try {
      const result = await runEntry(entry, { host, script: (frame, input) => {
        if (frame === 79) input.setPointer(480, CALF_Y, true);
      } });
      expect(result).toMatchObject({ kind: 'lose', via: 'game', elapsedMs: 4000 });
    } finally {
      host.dispose();
    }
  });

  it('loses on idle, a miss, or a keyboard action', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
    expect(await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) input.setPointer(480, 700, true);
    } })).toMatchObject({ kind: 'lose', via: 'game' });
    const result = await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) input.tap('action');
    } });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeGreaterThanOrEqual(4000);
    expect(result.elapsedMs).toBeLessThan(4020);
  });
});
