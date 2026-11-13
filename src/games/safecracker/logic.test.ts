import { describe, expect, it } from 'vitest';
import { createState, inWindow, levelParams, step, sweptWindow } from './logic';

const random = () => 0;

describe('safecracker logic', () => {
  it('uses the specified rotation rates and windows', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3))).toEqual([
      { level: 1, revolutionsPerSecond: 1, windowMs: 120 },
      { level: 2, revolutionsPerSecond: 1.4, windowMs: 90 },
      { level: 3, revolutionsPerSecond: 1.8, windowMs: 70 },
    ]);
  });

  it('locks inside the window and misses outside it', () => {
    const params = levelParams(1);
    const hit = createState(0);
    hit.angle = 0.98;
    step(hit, 16, true, params, 1, random);
    expect(hit.locked).toBe(1);
    expect(hit.result).toBeNull();
    const miss = createState(0);
    step(miss, 16, true, params, 1, random);
    expect(miss.result).toBe('miss');
  });

  it('recognizes a window crossed during a 50ms tick', () => {
    const params = levelParams(3);
    const state = createState(0);
    state.angle = 0.9;
    expect(inWindow(state.angle, params)).toBe(false);
    expect(inWindow(1.125, params)).toBe(false);
    expect(sweptWindow(0.9, 1.125, params)).toBe(true);
    step(state, 50, true, params, 2.5, () => 1);
    expect(state.locked).toBe(1);
  });

  it('cannot lock twice during the same pass', () => {
    const state = createState(0);
    const params = levelParams(1);
    state.angle = 0.99;
    step(state, 5, true, params, 1, random);
    step(state, 5, true, params, 1, random);
    expect(state.locked).toBe(1);
    step(state, 100, false, params, 1, random);
    expect(state.canLock).toBe(true);
  });

  it('reverses after a level 2 lock', () => {
    const state = createState(0);
    state.angle = 0.99;
    step(state, 5, true, levelParams(2), 1, random);
    expect(state.locked).toBe(1);
    expect(state.direction).toBe(-1);
  });

  it('reverses at the far side and then reaches the marker', () => {
    const state = createState(0);
    const params = levelParams(3);
    state.angle = 0.49;
    step(state, 10, false, params, 1, random);
    expect(state.direction).toBe(-1);
    expect(state.angle).toBeLessThan(0.5);
    for (let i = 0; i < 28; i++) step(state, 10, false, params, 1, random);
    expect(state.angle).toBeLessThan(0);
  });
});
