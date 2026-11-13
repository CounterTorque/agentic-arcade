import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { cellRect, createState, levelParams } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

describe(manifest.id, () => {
  it('wins by picking the odd face across levels, speeds and seeds', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const state = createState(level, createRng(seed));
          const rect = cellRect(level, state.odd);
          const result = await runEntry(entry, {
            level, speed, seed,
            script: (frame, input) => {
              if (frame === 0) input.setPointer(rect.x + rect.width / 2, rect.y + rect.height / 2, true);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses on a wrong pick or when idle', async () => {
    for (const level of [1, 2, 3] as const) {
      const state = createState(level, createRng(1));
      const index = (state.odd + 1) % (levelParams(level).size ** 2);
      const rect = cellRect(level, index);
      expect(await runEntry(entry, { level, script: (frame, input) => {
        if (frame === 0) input.setPointer(rect.x + rect.width / 2, rect.y + rect.height / 2, true);
      } })).toMatchObject({ kind: 'lose', via: 'game' });
      expect(await runEntry(entry, { level })).toMatchObject({ kind: 'lose', via: 'game' });
    }
  });

  it('accepts a correct pick on the final tick', async () => {
    const state = createState(1, createRng(1));
    const rect = cellRect(1, state.odd);
    const host = createFakeHost({ frameMs: 50 });
    try {
      expect(await runEntry(entry, { host, script: (frame, input) => {
        if (frame === 79) input.setPointer(rect.x + rect.width / 2, rect.y + rect.height / 2, true);
      } })).toMatchObject({ kind: 'win', via: 'game', elapsedMs: 4000 });
    } finally {
      host.dispose();
    }
  });
});
