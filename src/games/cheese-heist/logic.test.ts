import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { createState, levelParams, step } from './logic';

const randomArmed = () => 1000;

describe('Cheese Heist logic', () => {
  it('uses the specified warnings and mouse speeds', () => {
    expect(levelParams(1)).toEqual({ warningMs: 700, mouseSpeed: 600 });
    expect(levelParams(2)).toEqual({ warningMs: 450, mouseSpeed: 480 });
    expect(levelParams(3)).toEqual({ warningMs: 250, mouseSpeed: 480 });
  });

  it('scales warning and snap timing with speed and leaves a mouse at home safe', () => {
    const state = createState(1);
    step(state, 50, false, 2, randomArmed);
    expect(state.trap).toBe('warning');
    step(state, 349, false, 2, randomArmed);
    expect(state.trap).toBe('warning');
    step(state, 1, false, 2, randomArmed);
    expect(state.trap).toBe('sprung');
    expect(state.verdict).toBeNull();
  });

  it('toggles direction, grabs cheese and wins on returning', () => {
    const state = createState(1);
    step(state, 800, false, 1, randomArmed);
    step(state, 250, true, 1, randomArmed);
    expect(state.position).toBe(150);
    step(state, 100, true, 1, randomArmed);
    expect(state.position).toBe(90);
    step(state, 350, true, 1, randomArmed);
    expect(state.cheese).toBe(true);
    step(state, 500, true, 1, randomArmed);
    expect(state.verdict).toBe('win');
  });

  it('catches a mouse outside at the snap', () => {
    const state = createState(1);
    step(state, 799, false, 1, randomArmed);
    step(state, 1, true, 1, randomArmed);
    expect(state.verdict).toBe('caught');
  });

  it('chooses repeatable seeded rearm times at level 3', () => {
    const rearm = (seed: number) => {
      const rng = createRng(seed);
      const state = createState(3);
      step(state, 750, false, 1, () => rng.range(900, 1500));
      return state.trapDuration;
    };
    expect(rearm(1)).toBe(rearm(1));
    expect(rearm(1)).not.toBe(rearm(2));
    expect(rearm(1)).toBeGreaterThanOrEqual(900);
    expect(rearm(1)).toBeLessThan(1500);
  });
});
