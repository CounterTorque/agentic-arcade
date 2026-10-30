import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createFakeHost, createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { active, createState, holeRect, popOffset, step } from './logic';
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
              const pop = frame % 2 === 0 ? state.pops.find((p) => p.kind === 'gopher' && active(p, state.elapsed)) : undefined;
              let click = null;
              if (pop) {
                const { x, y } = holeRect(level, pop.hole);
                click = { x, y: y - 35 + popOffset(pop, state.elapsed) };
                input.setPointer(click.x, click.y, true);
              } else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
              step(state, dt, click);
            },
          });
          expect(result, `level ${level}, speed ${speed}, seed ${seed}`).toMatchObject({ kind: 'win', via: 'game' });
        }
      }
    }
  });

  it('loses when idle', async () => {
    expect(await runEntry(entry)).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses on a rabbit click', async () => {
    const state = createState(2, createRng(1), 5000, 1);
    const rabbit = state.pops.find((p) => p.kind === 'rabbit')!;
    const { x, y } = holeRect(2, rabbit.hole);
    expect(await runEntry(entry, { level: 2, script: (frame, input) => {
      const click = frame * dt >= rabbit.start + 50 && frame * dt < rabbit.start + 50 + dt;
      input.setPointer(x, y - 35, click);
    } })).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('counts a winning click on the final tick', async () => {
    const state = createState(1, createRng(1), 5000, 1);
    const host = createFakeHost({ frameMs: 50 });
    try {
      const result = await runEntry(entry, { host, script: (frame, input) => {
        const pop = frame === 99
          ? state.pops.filter((p) => p.kind === 'gopher').at(-1)
          : state.hits < 4 && frame % 2 === 0
            ? state.pops.find((p) => p.kind === 'gopher' && active(p, state.elapsed))
            : undefined;
        let click = null;
        if (pop && active(pop, state.elapsed)) {
          const { x, y } = holeRect(1, pop.hole);
          click = { x, y: y - 35 + popOffset(pop, state.elapsed) };
          input.setPointer(click.x, click.y, true);
        } else input.setPointer(input.api.pointer.x, input.api.pointer.y, false);
        step(state, 50, click);
      } });
      expect(result).toMatchObject({ kind: 'win', via: 'game', elapsedMs: 5000 });
    } finally {
      host.dispose();
    }
  });
});
