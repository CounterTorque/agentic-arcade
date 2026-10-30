import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng } from '../../../tests/helpers/fake-host';
import { CATCH_RADIUS, createState, FLIGHT_MS, levelParams, step } from './logic';

describe('Pancake Flip logic', () => {
  it('uses the specified browning times and drift ranges', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3))).toEqual([
      { browningMs: 2500, maxDrift: 40 },
      { browningMs: 1800, maxDrift: 90 },
      { browningMs: 1200, maxDrift: 150 },
    ]);
  });

  it('rejects pale and burnt flips and burns when left on the heat', () => {
    for (const level of [1, 2, 3] as const) {
      const { browningMs } = levelParams(level);
      const pale = createState(level, 0);
      step(pale, browningMs * 0.99, true, 0, 1);
      expect(pale.verdict).toBe('pale');
      const burnt = createState(level, 0);
      step(burnt, browningMs * 1.4, true, 0, 1);
      expect(burnt.verdict).toBe('burnt');
      const idle = createState(level, 0);
      step(idle, browningMs * 1.4, false, 0, 1);
      expect(idle.verdict).toBe('burnt');
    }
  });

  it('catches at the edge of the pan but misses outside it', () => {
    for (const drift of [CATCH_RADIUS, -CATCH_RADIUS, CATCH_RADIUS + 1, -CATCH_RADIUS - 1]) {
      const state = createState(1, drift);
      step(state, 2500, true, 0, 1);
      step(state, FLIGHT_MS, false, 0, 1);
      expect(state.verdict).toBe(Math.abs(drift) <= CATCH_RADIUS ? 'win' : 'floor');
    }
  });

  it('can be caught across levels, speeds and seeded drift', () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of [1, 2.5]) {
        for (let seed = 1; seed <= depth(5, 100); seed++) {
          const { maxDrift } = levelParams(level);
          const state = createState(level, createRng(seed).range(-maxDrift, maxDrift));
          for (let frame = 0; frame < 400 && !state.verdict; frame++) {
            const pressed = !state.tossed && state.doneness >= 1.05;
            const delta = state.pancakeX - state.panX;
            const direction = state.tossed && Math.abs(delta) > 10 ? Math.sign(delta) : 0;
            step(state, 1000 / 60, pressed, direction, speed);
          }
          expect(state.verdict, `level ${level}, speed ${speed}, seed ${seed}`).toBe('win');
        }
      }
    }
  });
});
