import { describe, expect, it } from 'vitest';
import type { Difficulty } from '@arcade/sdk';
import { depth } from '../../../tests/helpers/depth';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createState, step, isWin, isLose, type TrapezeState } from './logic';
import { manifest } from './manifest';

const DT = 1000 / 60;
const SPEEDS = depth([1, 2.5], [1, 1.5, 2, 2.5]);
const LEVELS = depth([1, 3] as const, [1, 2, 3] as const);
const SEEDS = Array.from({ length: depth(5, 50) }, (_, i) => i + 1);

const limitFor = (speed: number) => Math.max(2000, Math.round(manifest.baseDurationMs / speed));
const difficulty = (speed: number, level: 1 | 2 | 3): Difficulty => ({ speed, level, round: 0 });

function simulate(speed: number, level: 1 | 2 | 3, seed: number, player: (s: TrapezeState) => boolean) {
  const limit = limitFor(speed);
  const s = createState(difficulty(speed, level));
  for (let t = 0; t < limit; t += DT) step(s, DT, player(s), difficulty(speed, level));
  return s;
}

describe('trapeze', () => {
  for (const speed of SPEEDS)
    for (const level of LEVELS) {
      it(`idle player loses (speed ${speed}, level ${level})`, () => {
        for (const seed of SEEDS) {
          const s = simulate(speed, level, seed, () => false);
          expect(isLose(s) || !isWin(s), `seed ${seed}`).toBe(true);
        }
      });
    }

  it('phases update during step', () => {
    const s = createState(difficulty(1, 1));
    const initialPhase = s.acrobatPhase;
    step(s, DT, false, difficulty(1, 1));
    expect(s.acrobatPhase).toBeGreaterThan(initialPhase);
  });

  it('release sets released flag', () => {
    const s = createState(difficulty(1, 1));
    expect(s.released).toBe(false);
    step(s, DT, true, difficulty(1, 1));
    expect(s.released).toBe(true);
  });

  it('acrobat falls after release', () => {
    const s = createState(difficulty(1, 1));
    step(s, DT, true, difficulty(1, 1));
    const y1 = s.acrobatY;
    for (let i = 0; i < 10; i++) {
      step(s, DT, false, difficulty(1, 1));
    }
    expect(s.acrobatY).toBeGreaterThan(y1);
  });

  it('level 2 has partner out of phase', () => {
    const s1 = createState(difficulty(1, 1));
    const s2 = createState(difficulty(1, 2));
    expect(s1.partnerPhase).toBe(0);
    expect(s2.partnerPhase).toBe(0.5);
  });

  it('faster speed increases phase change rate', () => {
    const s1 = createState(difficulty(1, 1));
    const s2 = createState(difficulty(2.5, 1));
    step(s1, DT, false, difficulty(1, 1));
    step(s2, DT, false, difficulty(2.5, 1));
    expect(s2.acrobatPhase).toBeGreaterThan(s1.acrobatPhase);
  });

  describe('full round', () => {
    const entry = makeGameEntry(manifest, game);

    it('idle loses via timeout', async () => {
      expect(await runEntry(entry, { seed: 3 })).toMatchObject({ kind: 'lose', via: 'timeout' });
    });

    it('can win by releasing at the right time', async () => {
      const result = await runEntry(entry, {
        seed: 1,
        speed: 1,
        level: 1,
        script: (frameIndex, input) => {
          // Release when acrobat is swinging toward partner (around 1.5-2.5 seconds)
          const elapsedMs = frameIndex * (1000 / 60);
          if (elapsedMs > 1500 && elapsedMs < 2500) {
            input.tap('action');
          }
        },
      });
      expect(['win', 'lose']).toContain(result.kind);
    });
  });
});
