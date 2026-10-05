import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/framework/runtime/rng';

describe('rng', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const seq = (s: number) => Array.from({ length: 5 }, ((r) => () => r.next())(createRng(s)));
    expect(seq(1)).toEqual(seq(1));
    expect(seq(1)).not.toEqual(seq(2));
  });

  it('respects ranges', () => {
    const r = createRng(42);
    for (let i = 0; i < 500; i++) {
      const n = r.next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
      const k = r.int(3, 6);
      expect(Number.isInteger(k) && k >= 3 && k <= 6).toBe(true);
      const f = r.range(-2, 2);
      expect(f >= -2 && f < 2).toBe(true);
    }
  });

  it('hits both ends of int ranges, picks members and handles chance extremes', () => {
    const r = createRng(7);
    const seen = new Set(Array.from({ length: 200 }, () => r.int(1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    expect(r.chance(0)).toBe(false);
    expect(r.chance(1)).toBe(true);
  });
});
