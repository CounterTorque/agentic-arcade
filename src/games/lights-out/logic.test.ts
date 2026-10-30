import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { createState, evaluate, hitTest, levelParams, litCount, step, windowRect } from './logic';

describe('Lights Out logic', () => {
  it('creates the specified windows, lights and scheduled relights', () => {
    for (const level of [1, 2, 3] as const) {
      const state = createState(level, createRng(13), 5000);
      const params = levelParams(level);
      expect(state.lit).toHaveLength(params.cols * params.rows);
      expect(litCount(state)).toBe([6, 10, 15][level - 1]);
      expect(state.pendingRelights).toHaveLength([0, 1, 3][level - 1]);
      for (const relight of state.pendingRelights) {
        expect(relight.at).toBeGreaterThanOrEqual(1500);
        expect(relight.at).toBeLessThan(3500);
      }
      for (let i = 0; i < state.lit.length; i++) {
        const rect = windowRect(level, i);
        expect(rect.width).toBeGreaterThanOrEqual(60);
        expect(rect.height).toBeGreaterThanOrEqual(60);
        expect(hitTest(level, { x: rect.x + 40, y: rect.y + 30 })).toBe(i);
      }
    }
  });

  it('switches off lit windows and ignores dark windows and misses', () => {
    const rng = createRng(1);
    const state = createState(1, rng, 5000);
    const lit = state.lit.indexOf(true);
    const dark = state.lit.indexOf(false);
    const point = (i: number) => {
      const rect = windowRect(1, i);
      return { x: rect.x + 40, y: rect.y + 30 };
    };
    step(state, 0, rng, point(dark));
    step(state, 0, rng, { x: 0, y: 0 });
    expect(litCount(state)).toBe(6);
    step(state, 0, rng, point(lit));
    expect(state.lit[lit]).toBe(false);
    expect(litCount(state)).toBe(5);
    expect(evaluate(state)).toBe('lose');
    state.lit.fill(false);
    expect(evaluate(state)).toBe('win');
  });

  it('warns before relighting a dark window and never relights after the schedule', () => {
    const rng = createRng(2);
    const state = createState(3, rng, 5000);
    state.lit.fill(false);
    const times = state.pendingRelights.map((relight) => relight.at);
    for (const at of times) {
      step(state, at - state.elapsed - state.warningMs / 2, rng, null);
      const relight = state.pendingRelights[0];
      expect(relight.warned).toBe(true);
      expect(relight.target).not.toBeNull();
      expect(state.lit[relight.target!]).toBe(false);
      const before = litCount(state);
      step(state, at - state.elapsed + 0.001, rng, null);
      expect(litCount(state)).toBe(before + 1);
    }
    expect(state.pendingRelights).toHaveLength(0);
    step(state, 5000, rng, null);
    expect(litCount(state)).toBe(3);
  });

  it('skips a relight if every window is lit', () => {
    const rng = createRng(3);
    const state = createState(2, rng, 5000);
    state.lit.fill(true);
    step(state, 4000, rng, null);
    expect(litCount(state)).toBe(state.lit.length);
    expect(state.pendingRelights).toHaveLength(0);
  });
});
