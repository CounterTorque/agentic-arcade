import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { CUT_X, REACH, createPosts, judge, levelParams, type Level } from './logic';

const FRAME_MS = 1000 / 60;

function trace(level: Level, speed: number, seed: number, ms: number): number[] {
  const posts = createPosts(level, speed, createRng(seed));
  const xs: number[] = [];
  for (let t = 0; t < ms; t += FRAME_MS) {
    posts.step(FRAME_MS);
    xs.push(posts.centre());
  }
  return xs;
}

describe('levelParams', () => {
  it('lists the spec mark widths per level', () => {
    expect(levelParams(1).markWidth).toBe(30);
    expect(levelParams(2).markWidth).toBe(22);
    expect(levelParams(3).markWidth).toBe(14);
  });
});

describe('judge', () => {
  it('cuts inside the mark, edges included, and misses outside it', () => {
    expect(judge(CUT_X, 30)).toBe('cut');
    expect(judge(CUT_X + 15, 30)).toBe('cut');
    expect(judge(CUT_X - 15, 30)).toBe('cut');
    expect(judge(CUT_X + 15.5, 30)).toBe('miss');
    expect(judge(CUT_X - 100, 30)).toBe('miss');
  });

  it('narrows with the mark width', () => {
    expect(judge(CUT_X + 10, 30)).toBe('cut');
    expect(judge(CUT_X + 10, 14)).toBe('miss');
  });
});

describe('createPosts', () => {
  it('starts left of the scissors and slides at a constant pace on level 1', () => {
    const [a, b, c] = trace(1, 1, 1, 100);
    expect(a!).toBeGreaterThan(CUT_X - REACH);
    expect(b! - a!).toBeCloseTo(c! - b!);
    expect(b! - a!).toBeCloseTo((240 * FRAME_MS) / 1000);
  });

  it('moves faster at higher speed', () => {
    const slow = trace(1, 1, 1, 100);
    const fast = trace(1, 2.5, 1, 100);
    expect(fast[3]! - fast[0]!).toBeCloseTo((slow[3]! - slow[0]!) * 2.5);
  });

  it('changes pace within a leg on level 2', () => {
    const xs = trace(2, 1, 1, 600);
    const steps = xs.slice(1).map((x, i) => x - xs[i]!);
    expect(Math.max(...steps)).toBeGreaterThan(Math.min(...steps) * 1.5);
  });

  it.each([1, 2, 3] as const)('stays within its reach and crosses the scissors on level %i', (level) => {
    const xs = trace(level, 2.5, 7, 4000);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(CUT_X - REACH);
      expect(x).toBeLessThanOrEqual(CUT_X + REACH);
    }
    expect(xs.some((x) => x < CUT_X)).toBe(true);
    expect(xs.some((x) => x > CUT_X)).toBe(true);
  });

  it('turns at random points on level 3, the same way for the same seed', () => {
    const peaks = (seed: number) => {
      const xs = trace(3, 1, seed, 8000);
      return xs.filter((x, i) => i > 0 && i < xs.length - 1 && (x - xs[i - 1]!) * (xs[i + 1]! - x) < 0).map(Math.round);
    };
    expect(peaks(3)).toEqual(peaks(3));
    expect(peaks(3)).not.toEqual(peaks(4));
    expect(new Set(peaks(3)).size).toBeGreaterThan(2);
  });
});
