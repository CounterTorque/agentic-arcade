import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { active, createState, holeRect, levelParams, popOffset, step } from './logic';

describe('Gopher Bop logic', () => {
  it('uses the specified level parameters', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3))).toEqual([
      { cols: 3, rows: 2, hits: 5, upMs: 900 },
      { cols: 3, rows: 3, hits: 6, upMs: 650 },
      { cols: 4, rows: 3, hits: 7, upMs: 450 },
    ]);
  });

  it('schedules enough gophers and distinct simultaneous critters across seeds and speeds', () => {
    for (const level of [1, 2, 3] as const) for (const speed of [1, 1.25, 1.5, 2, 2.5]) {
      const limit = Math.max(2000, Math.round(5000 / speed));
      for (let seed = 1; seed <= 20; seed++) {
        const state = createState(level, createRng(seed), limit, speed);
        expect(state).toEqual(createState(level, createRng(seed), limit, speed));
        expect(state.pops.filter((p) => p.kind === 'gopher')).toHaveLength(levelParams(level).hits + 3);
        const rabbits = state.pops.filter((p) => p.kind === 'rabbit').length;
        expect(rabbits).toBeGreaterThanOrEqual(level === 1 ? 0 : level === 2 ? 1 : 2);
        expect(rabbits).toBeLessThanOrEqual(level === 1 ? 0 : level === 2 ? 1 : 3);
        for (const [i, pop] of state.pops.entries()) {
          expect(pop.end).toBeLessThanOrEqual(limit + 0.000001);
          expect(pop.end - pop.start).toBeCloseTo(levelParams(level).upMs / speed);
          for (const other of state.pops.slice(i + 1)) {
            if (pop.hole === other.hole) expect(pop.end <= other.start || other.end <= pop.start).toBe(true);
          }
        }
      }
    }
  });

  it('counts each gopher once, ignores misses, and wins at the target', () => {
    const state = createState(1, createRng(1), 5000, 1);
    step(state, 0, { x: 0, y: 0 });
    expect(state.hits).toBe(0);
    for (const pop of state.pops.slice(0, 5)) {
      state.elapsed = (pop.start + pop.end) / 2;
      const { x, y } = holeRect(1, pop.hole);
      const click = { x, y: y - 35 + popOffset(pop, state.elapsed) };
      expect(active(pop, state.elapsed)).toBe(true);
      step(state, 0, click);
      step(state, 0, click);
    }
    expect(state.hits).toBe(5);
    expect(state.verdict).toBe('win');
  });

  it('loses immediately when a rabbit is clicked', () => {
    const state = createState(2, createRng(1), 5000, 1);
    const rabbit = state.pops.find((p) => p.kind === 'rabbit')!;
    state.elapsed = (rabbit.start + rabbit.end) / 2;
    const { x, y } = holeRect(2, rabbit.hole);
    step(state, 0, { x, y: y - 35 });
    expect(state.verdict).toBe('lose');
    expect(state.rabbitHit).toBe(rabbit.hole);
  });
});
