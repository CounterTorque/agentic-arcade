import { describe, expect, it } from 'vitest';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { levelParams, simulateFlight, type Level } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

function findFrame(level: Level, speed: number, caught: boolean): number {
  const phase = createRng(1).range(0, 1);
  for (let frame = 0; frame < Math.floor(5000 / speed / (1000 / 60)); frame++) {
    if (simulateFlight((frame + 1) * 1000 / 60, levelParams(level), speed, phase).caught === caught) return frame;
  }
  throw new Error('No release frame found');
}

describe(manifest.id, () => {
  for (const [level, speed] of [[1, 1], [3, 2.5]] as const) {
    it(`catches at level ${level} and speed ${speed}`, async () => {
      const target = findFrame(level, speed, true);
      const result = await runEntry(entry, { level, speed, script: (frame, input) => frame === target && input.tap('action') });
      expect(result).toMatchObject({ kind: 'win', via: 'game' });
    });
  }

  it('misses on a badly timed release', async () => {
    const target = findFrame(1, 1, false);
    const result = await runEntry(entry, { script: (frame, input) => frame === target && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when never released, even when the trajectory would catch', async () => {
    const result = await runEntry(entry, { seed: 1, level: 3, speed: 2.5 });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });
});
