import { describe, expect, it } from 'vitest';
import { CENTER, createState, hookX, isOnStack, levelParams, step } from './logic';

describe('crane stack logic', () => {
  it('uses the specified periods and widths', () => {
    expect([1, 2, 3].map((level) => levelParams(level as 1 | 2 | 3))).toEqual([
      { period: 2000, width: 120, quicken: 0.9 },
      { period: 1500, width: 100, quicken: 0.9 },
      { period: 1100, width: 80, quicken: 0.8 },
    ]);
  });

  it('accepts centres on the edge but not beyond it', () => {
    expect(isOnStack(540, 480, 120)).toBe(true);
    expect(isOnStack(540.01, 480, 120)).toBe(false);
  });

  it('quickens the swing after a crate', () => {
    const s = createState(0);
    const p = levelParams(3);
    step(s, 100, false, p, 1);
    const first = s.phase;
    s.stack.push(CENTER);
    step(s, 100, false, p, 1);
    expect(s.phase - first).toBeCloseTo(first / p.quicken);
  });

  it('stacks three centred drops and wins', () => {
    const s = createState(0);
    const p = levelParams(1);
    for (let i = 0; i < 3; i++) {
      s.phase = -16 / p.period / p.quicken ** i;
      step(s, 16, true, p, 1);
      for (let n = 0; n < 60 && s.crate !== 'hanging' && !s.result; n++) step(s, 16, false, p, 1);
      expect(s.stack.length).toBe(i + 1);
    }
    expect(s.result).toBe('win');
    expect(s.stack.every((x) => Math.abs(x - CENTER) < 0.01)).toBe(true);
  });

  it('topples when a crate lands past the edge', () => {
    const s = createState(0.25);
    const p = levelParams(1);
    expect(hookX(s)).toBeGreaterThan(CENTER + p.width / 2);
    step(s, 16, true, p, 1);
    for (let n = 0; n < 60 && !s.result; n++) step(s, 16, false, p, 1);
    expect(s.result).toBe('topple');
    expect(s.stack).toHaveLength(0);
  });
});
