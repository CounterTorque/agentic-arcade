import { describe, expect, it } from 'vitest';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import { depth } from '../../../tests/helpers/depth';
import game from './index';
import { CUT_X, createPosts, type Level } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

const FRAME_MS = 1000 / 60;
const SPEEDS = depth([1, 2.5], [1, 1.5, 2, 2.5]);
const LEVELS = depth([1, 3] as const, [1, 2, 3] as const);
const SEEDS = Array.from({ length: depth(3, 20) }, (_, i) => i + 1);

// The fake host ticks every 1000 / 60 ms, so a tap on frame f lands after f + 1 steps of the posts.
function bestFrame(level: Level, speed: number, seed: number, from = 0): number {
  const posts = createPosts(level, speed, createRng(seed));
  const frames = Math.floor(Math.max(2000, Math.round(manifest.baseDurationMs / speed)) / FRAME_MS) - 2;
  let best = from;
  let bestDistance = Infinity;
  for (let f = 0; f < frames; f++) {
    posts.step(FRAME_MS);
    const distance = Math.abs(posts.centre() - CUT_X);
    if (f >= from && distance < bestDistance) {
      best = f;
      bestDistance = distance;
    }
  }
  return best;
}

describe(manifest.id, () => {
  it('wins when snipped as the mark passes the scissors', async () => {
    // Level 1, speed 1: the mark starts 140 px left of the scissors and moves 240 px/s, so it arrives at 583 ms.
    const frame = bestFrame(1, 1, 1);
    expect(frame).toBeGreaterThan(30);
    const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it.each(LEVELS)('wins with perfect timing on level %i at every speed and seed', async (level) => {
    for (const speed of SPEEDS) {
      for (const seed of SEEDS) {
        const frame = bestFrame(level, speed, seed);
        const result = await runEntry(entry, {
          level,
          speed,
          seed,
          script: (f, input) => f === frame && input.tap('action'),
        });
        expect(result, `level ${level} speed ${speed} seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
      }
    }
  });

  it('wins on a later pass of the scissors too', async () => {
    const frame = bestFrame(1, 1, 1, 90);
    expect(frame).toBeGreaterThan(90);
    const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it('loses when snipped too early', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 5 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when snipped well after the mark has passed', async () => {
    const frame = bestFrame(1, 1, 1) + 25;
    const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when never snipped', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('plays out the same for the same seed and input', async () => {
    const play = () => runEntry(entry, { level: 3, speed: 2.5, seed: 4, script: (f, input) => f === 20 && input.tap('action') });
    expect(await play()).toEqual(await play());
  });
});
