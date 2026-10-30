import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng } from '../../../tests/helpers/fake-host';
import { createState, levelParams, reticle, shoot, step, TARGET } from './logic';

describe('Bullseye logic', () => {
  it('keeps wind drift within each specified radius at all speeds', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3).radius)).toEqual([30, 55, 80]);
    for (const level of [1, 2, 3] as const) {
      for (const speed of depth([1, 2.5], [1, 1.25, 1.5, 2, 2.5])) {
        for (let seed = 1; seed <= depth(2, 10); seed++) {
          const rng = createRng(seed);
          const state = createState(level, rng);
          for (let i = 0; i < 240; i++) {
            step(state, 1000 / 60, speed, rng);
            expect(Math.hypot(state.dx, state.dy)).toBeLessThanOrEqual(levelParams(level).radius + 1e-9);
          }
        }
      }
    }
  });

  it('scores the reticle position, including the center ring boundary', () => {
    const state = createState(2, createRng(1));
    state.dx = 20;
    state.dy = -10;
    const centerAim = { x: TARGET.x - state.dx, y: TARGET.y - state.dy };
    expect(reticle(state, centerAim)).toEqual({ x: TARGET.x, y: TARGET.y });
    expect(shoot(state, centerAim)).toBe('win');
    expect(state.landing).toEqual({ x: TARGET.x, y: TARGET.y });
    expect(shoot(state, { x: centerAim.x + TARGET.centerRadius, y: centerAim.y })).toBe('win');
    expect(shoot(state, { x: centerAim.x + TARGET.centerRadius + 1, y: centerAim.y })).toBe('lose');
    expect(shoot(state, { x: centerAim.x + TARGET.radius + 1, y: centerAim.y })).toBe('lose');
  });

  it('scales wind with speed and adds level 3 jerks', () => {
    const rngA = createRng(5);
    const rngB = createRng(5);
    const a = createState(3, rngA);
    const b = createState(3, rngB);
    step(a, 200, 2, rngA);
    step(b, 400, 1, rngB);
    expect(a.dx).toBeCloseTo(b.dx);
    expect(a.dy).toBeCloseTo(b.dy);
    expect(a.vx).toBeCloseTo(b.vx);
    expect(a.vy).toBeCloseTo(b.vy);
  });

  it('applies a sudden velocity impulse when a level 3 jerk comes due', () => {
    const rng = createRng(12);
    const state = createState(3, rng);
    state.gustX = 0;
    state.gustY = 0;
    state.jerkIn = 10;
    step(state, 10, 1, rng);
    expect(Math.hypot(state.vx, state.vy)).toBeCloseTo(180);
    expect(state.jerkIn).toBeGreaterThanOrEqual(350);
  });
});
