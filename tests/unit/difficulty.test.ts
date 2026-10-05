import { describe, expect, it } from 'vitest';
import { computeTimeLimit, difficultyForRound } from '../../src/framework/runtime/difficulty';

describe('difficulty', () => {
  it('scales speed every 5 rounds and caps at 2.5', () => {
    expect(difficultyForRound(0).speed).toBe(1);
    expect(difficultyForRound(4).speed).toBe(1);
    expect(difficultyForRound(5).speed).toBe(1.25);
    expect(difficultyForRound(30).speed).toBe(2.5);
    expect(difficultyForRound(500).speed).toBe(2.5);
  });

  it('picks level tiers', () => {
    expect([0, 9, 10, 19, 20, 99].map((r) => difficultyForRound(r).level)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(difficultyForRound(7).round).toBe(7);
  });

  it('computes time limits with a 2000 ms floor', () => {
    expect(computeTimeLimit({ baseDurationMs: 5000 }, { speed: 1 })).toBe(5000);
    expect(computeTimeLimit({ baseDurationMs: 5000 }, { speed: 2 })).toBe(2500);
    expect(computeTimeLimit({ baseDurationMs: 3000 }, { speed: 2.5 })).toBe(2000);
  });
});
