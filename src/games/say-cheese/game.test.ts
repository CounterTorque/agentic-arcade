import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, FRAME_HEIGHT, FRAME_WIDTH, step } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

describe(manifest.id, () => {
  it('can drag and win across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const state = createState(level, createRng(seed), speed);
          const idle = { x: 0, y: 0, down: false, pressed: false, released: false, inside: true };
          for (let i = 0; i < 5; i++) step(state, 1000 / 60, idle);
          const xs = state.friends.map((f) => f.x);
          const ys = state.friends.map((f) => f.y);
          const dx = (Math.min(...xs) + Math.max(...xs) - FRAME_WIDTH) / 2 - state.frame.x;
          const dy = (Math.min(...ys) + Math.max(...ys) - FRAME_HEIGHT) / 2 - state.frame.y;
          const result = await runEntry(entry, { level, speed, seed, script: (frame, input) => {
            if (frame === 0) input.setPointer(100, 400, true);
            if (frame === 1) input.setPointer(100 + dx, 400 + dy, true);
            if (frame === 2) input.setPointer(100 + dx, 400 + dy, false);
            if (frame === 3) input.setPointer(100 + dx, 400 + dy, true);
            if (frame === 4) input.setPointer(100 + dx, 400 + dy, false);
          } });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when idle or when a photo cuts friends off', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
    expect(await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) input.setPointer(100, 400, true);
      if (frame === 1) input.setPointer(100, 400, false);
    } })).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('does not take a photo from a keyboard action', async () => {
    const result = await runEntry(entry, { script: (frame, input) => {
      if (frame === 0) {
        input.setPointer(100, 400, false);
        input.tap('action');
      }
    } });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeCloseTo(5000);
  });

  it('counts a winning click on the final tick', async () => {
    const host = createFakeHost({ frameMs: 50 });
    const state = createState(1, createRng(1), 1);
    const idle = { x: 0, y: 0, down: false, pressed: false, released: false, inside: true };
    for (let i = 0; i < 100; i++) step(state, 50, idle);
    const xs = state.friends.map((f) => f.x);
    const ys = state.friends.map((f) => f.y);
    const dx = (Math.min(...xs) + Math.max(...xs) - FRAME_WIDTH) / 2 - 80;
    const dy = (Math.min(...ys) + Math.max(...ys) - FRAME_HEIGHT) / 2 - 380;
    try {
      const result = await runEntry(entry, { host, script: (frame, input) => {
        if (frame === 0) input.setPointer(100, 400, true);
        if (frame === 1) input.setPointer(100 + dx, 400 + dy, true);
        if (frame === 2) input.setPointer(100 + dx, 400 + dy, false);
        if (frame === 98) input.setPointer(100 + dx, 400 + dy, true);
        if (frame === 99) input.setPointer(100 + dx, 400 + dy, false);
      } });
      expect(result).toMatchObject({ kind: 'win', via: 'game', elapsedMs: 5000 });
    } finally {
      host.dispose();
    }
  });
});
