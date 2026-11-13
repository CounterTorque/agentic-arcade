import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { BOUNDS, createState, HIT_RADIUS, levelParams, step } from './logic';

describe('Swat logic', () => {
  it('uses the specified fly speeds and direction intervals', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3))).toEqual([
      { speed: 200, changeMs: 800, hoverChance: 0 },
      { speed: 300, changeMs: 500, hoverChance: 0 },
      { speed: 420, changeMs: 300, hoverChance: 0.3 },
    ]);
  });

  it('hits on the radius and permits another try after a miss', () => {
    const rng = createRng(1);
    const state = createState(1, rng);
    expect(step(state, 0, 1, rng, { x: state.x + HIT_RADIUS + 1, y: state.y })).toBeNull();
    expect(step(state, 0, 1, rng, { x: state.x + HIT_RADIUS, y: state.y })).toBe('win');
  });

  it('changes direction on schedule and scales movement with speed', () => {
    const rng = createRng(2);
    const state = createState(1, rng);
    state.x = 480;
    state.y = 200;
    state.heading = 0;
    step(state, 100, 2, rng, null);
    expect(state.x).toBeCloseTo(520);
    expect(state.changeIn).toBe(600);
    const heading = state.heading;
    step(state, 299, 2, rng, null);
    expect(state.heading).toBe(heading);
    step(state, 1, 2, rng, null);
    expect(state.heading).not.toBe(heading);
    expect(state.changeIn).toBe(800);
  });

  it('stays in bounds and follows the same path for the same seed', () => {
    for (const level of [1, 2, 3] as const) {
      const a = createRng(45);
      const b = createRng(45);
      const first = createState(level, a);
      const second = createState(level, b);
      let hovered = false;
      for (let i = 0; i < 600; i++) {
        step(first, 50, 2.5, a, null);
        step(second, 50, 2.5, b, null);
        expect(first).toEqual(second);
        expect(first.x).toBeGreaterThanOrEqual(BOUNDS.left);
        expect(first.x).toBeLessThanOrEqual(BOUNDS.right);
        expect(first.y).toBeGreaterThanOrEqual(BOUNDS.top);
        expect(first.y).toBeLessThanOrEqual(BOUNDS.bottom);
        hovered ||= first.hover > 0;
      }
      if (level === 3) expect(hovered).toBe(true);
    }
  });
});
