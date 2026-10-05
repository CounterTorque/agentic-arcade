import { describe, expect, it } from 'vitest';
import type { Difficulty } from '@arcade/sdk';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { AIRTIME_MS, PLAYER, createState, step, type JumpState } from './logic';
import { manifest } from './manifest';

const DT = 1000 / 60;
const SPEEDS = [1, 1.5, 2, 2.5];
const LEVELS = [1, 2, 3] as const;
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);

const bot = (s: JumpState) =>
  s.cars.some((c) => {
    const tCenter = ((c.x + c.w / 2) - (PLAYER.x + PLAYER.w / 2)) / c.speed * 1000;
    return tCenter > 0 && tCenter <= AIRTIME_MS / 2;
  });

const limitFor = (speed: number) => Math.max(2000, Math.round(manifest.baseDurationMs / speed));
const difficulty = (speed: number, level: 1 | 2 | 3): Difficulty => ({ speed, level, round: 0 });

function simulate(speed: number, level: 1 | 2 | 3, seed: number, player: (s: JumpState) => boolean) {
  const limit = limitFor(speed);
  const s = createState(difficulty(speed, level), limit, createRng(seed));
  for (let t = 0; t < limit; t += DT) step(s, DT, player(s));
  return s;
}

describe('jump', () => {
  for (const speed of SPEEDS)
    for (const level of LEVELS) {
      it(`bot always survives (speed ${speed}, level ${level})`, () => {
        for (const seed of SEEDS) expect(simulate(speed, level, seed, bot).status, `seed ${seed}`).toBe('running');
      });

      it(`idle player is always hit before timeout (speed ${speed}, level ${level})`, () => {
        for (const seed of SEEDS) expect(simulate(speed, level, seed, () => false).status, `seed ${seed}`).toBe('hit');
      });
    }

  it('level 2 and 3 can add a second car, level 1 never does', () => {
    const count = (level: 1 | 2 | 3) => SEEDS.map((seed) => createState(difficulty(1, level), 5000, createRng(seed)).cars.length);
    expect(Math.max(...count(1))).toBe(1);
    expect(Math.max(...count(2))).toBe(2);
    expect(Math.max(...count(3))).toBe(2);
  });

  it('cars start off-screen', () => {
    for (const speed of SPEEDS)
      for (const level of LEVELS)
        for (const seed of SEEDS)
          for (const c of createState(difficulty(speed, level), limitFor(speed), createRng(seed)).cars)
            expect(c.x).toBeGreaterThanOrEqual(960);
  });

  it('jump apex and airtime are identical at every speed', () => {
    const measure = (speed: number) => {
      const s = createState(difficulty(speed, 1), limitFor(speed), createRng(1));
      s.cars = [];
      let apex = 0;
      step(s, DT, true);
      let frames = 1;
      for (; !s.grounded; frames++) {
        apex = Math.max(apex, s.y);
        step(s, DT, false);
      }
      return { apex, airtime: frames * DT };
    };
    const slow = measure(1);
    const fast = measure(2.5);
    expect(fast).toEqual(slow);
    expect(slow.apex).toBeGreaterThan(190);
    expect(slow.apex).toBeLessThan(215);
    expect(Math.abs(slow.airtime - AIRTIME_MS)).toBeLessThan(2 * DT);
  });

  it('ignores jump presses while airborne', () => {
    const s = createState(difficulty(1, 1), 5000, createRng(1));
    s.cars = [];
    step(s, DT, true);
    for (let i = 0; i < 20; i++) step(s, DT, false);
    const { vy } = s;
    step(s, DT, true);
    expect(s.vy).toBeLessThan(vy);
  });

  it('same seed gives an identical car list, different seeds differ', () => {
    const make = (seed: number) => createState(difficulty(2, 3), 2500, createRng(seed));
    expect(make(7)).toEqual(make(7));
    expect(make(7)).not.toEqual(make(8));
  });

  describe('full round', () => {
    const entry = makeGameEntry(manifest, game);

    it('idle loses via the game', async () => {
      expect(await runEntry(entry, { seed: 3 })).toMatchObject({ kind: 'lose', via: 'game' });
    });

    it.each([
      [1, 1],
      [2.5, 3],
    ] as const)('a bot wins via timeout (speed %s, level %s)', async (speed, level) => {
      for (const seed of [1, 2, 3, 4, 5]) {
        const mirror = createState(difficulty(speed, level), limitFor(speed), createRng(seed));
        const result = await runEntry(entry, {
          seed,
          speed,
          level,
          script: (_frame, input) => {
            const jump = bot(mirror);
            if (jump) input.tap('action');
            step(mirror, DT, jump);
          },
        });
        expect(result, `seed ${seed}`).toMatchObject({ kind: 'win', via: 'timeout' });
      }
    });
  });
});
