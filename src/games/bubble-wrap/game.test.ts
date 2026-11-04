import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { bubblePos, createState, step } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const dt = 1000 / 60;

describe(manifest.id, () => {
  it('can win across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const state = createState(level, createRng(seed), Math.max(2000, Math.round(5000 / speed)), speed);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              const target = frame % 2 === 0
                ? state.bubbles.filter((bubble) => !bubble.popped).sort((a, b) => b.x - a.x)[0]
                : undefined;
              const click = target ? bubblePos(state, target) : null;
              if (click) input.setPointer(click.x, click.y, true);
              else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
              step(state, dt, click);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when idle at every level and speed', async () => {
    for (const level of [1, 2, 3] as const) for (const speed of [1, 2.5]) {
      expect(await runEntry(entry, { level, speed })).toMatchObject({ kind: 'lose', via: 'game' });
    }
  });

  it('counts a winning click on the final tick', async () => {
    const state = createState(1, createRng(1), 5000, 1);
    const host = createFakeHost({ frameMs: 50 });
    try {
      const result = await runEntry(entry, { host, script: (frame, input) => {
        const remaining = state.bubbles.filter((bubble) => !bubble.popped).sort((a, b) => b.x - a.x);
        const target = frame === 99 || (remaining.length > 1 && frame % 2 === 0) ? remaining[0] : undefined;
        const click = target ? bubblePos(state, target) : null;
        if (click) input.setPointer(click.x, click.y, true);
        else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
        step(state, 50, click);
      } });
      expect(result).toMatchObject({ kind: 'win', via: 'game', elapsedMs: 5000 });
    } finally {
      host.dispose();
    }
  });
});
