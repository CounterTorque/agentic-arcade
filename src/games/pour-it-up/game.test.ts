import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, FILL_LINE, levelParams, step, type Level } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const FRAME_MS = 1000 / 60;

function releaseFrame(level: Level, speed: number): number {
  const state = createState();
  for (let frame = 0; frame < 240; frame++) {
    step(state, FRAME_MS, true, levelParams(level), speed);
    if (state.level >= FILL_LINE) return frame + 1;
  }
  throw new Error('No release frame found');
}

describe(manifest.id, () => {
  it('wins across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5])) {
        for (const seed of depth([1], [1, 2, 3])) {
          const target = releaseFrame(level, speed);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              if (frame === 0) input.press('action');
              if (frame === target) input.release('action');
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses on an early tap', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 0 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when released above the band', async () => {
    const result = await runEntry(entry, {
      script: (frame, input) => {
        if (frame === 0) input.press('action');
        if (frame === 200) input.release('action');
      },
    });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when the drink spills', async () => {
    const result = await runEntry(entry, { level: 3, script: (frame, input) => frame === 0 && input.press('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('judges a held pour on the final tick', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 72 && input.press('action') });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it('loses on timeout when idle', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'timeout' });
  });
});
