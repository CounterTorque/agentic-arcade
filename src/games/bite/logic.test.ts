import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { bobberDepth, buildSchedule, gameTime, isMissed, judge, levelParams, type Level } from './logic';

describe('bite timing', () => {
  it('uses the specified fake counts and bite windows', () => {
    expect(levelParams(1)).toEqual({ minFakes: 1, maxFakes: 2, windowMs: 600, fakeDepth: 0.25 });
    expect(levelParams(2)).toEqual({ minFakes: 2, maxFakes: 3, windowMs: 450, fakeDepth: 0.5 });
    expect(levelParams(3)).toEqual({ minFakes: 3, maxFakes: 4, windowMs: 300, fakeDepth: 0.85 });
  });

  it('generates nonoverlapping seeded cues that fit in the round', () => {
    for (const level of [1, 2, 3] as const) {
      const params = levelParams(level);
      for (let seed = 1; seed <= 100; seed++) {
        const schedule = buildSchedule(createRng(seed), level);
        expect(schedule).toEqual(buildSchedule(createRng(seed), level));
        expect(schedule.twitches.length).toBeGreaterThanOrEqual(params.minFakes);
        expect(schedule.twitches.length).toBeLessThanOrEqual(params.maxFakes);
        expect(schedule.twitches[0]!.startMs).toBeGreaterThanOrEqual(350);
        expect(schedule.twitches[0]!.startMs).toBeLessThanOrEqual(650);
        for (let i = 0; i < schedule.twitches.length; i++) {
          const twitch = schedule.twitches[i]!;
          const next = schedule.twitches[i + 1]?.startMs ?? schedule.biteStartMs;
          expect(next - twitch.startMs - twitch.durMs).toBeGreaterThanOrEqual(300);
          expect(next - twitch.startMs - twitch.durMs).toBeLessThanOrEqual(600);
        }
        expect(schedule.biteStartMs + schedule.windowMs).toBeLessThanOrEqual(4500);
      }
    }
  });

  it('shows shallow fake dips and a full real plunge', () => {
    for (const level of [1, 2, 3] as Level[]) {
      const schedule = buildSchedule(createRng(1), level);
      const twitch = schedule.twitches[0]!;
      expect(bobberDepth(0, schedule)).toBe(0);
      expect(bobberDepth(twitch.startMs + twitch.durMs / 2, schedule)).toBeCloseTo(levelParams(level).fakeDepth);
      expect(bobberDepth(schedule.biteStartMs + 80, schedule)).toBe(1);
    }
    expect(gameTime(500, 2.5)).toBe(1250);
  });

  it('judges the half-open bite window and detects a miss', () => {
    const schedule = buildSchedule(createRng(1), 1);
    const start = schedule.biteStartMs;
    const end = start + schedule.windowMs;
    expect(judge(start - 1, schedule)).toBe('early');
    expect(judge(start, schedule)).toBe('hooked');
    expect(judge(end - 1, schedule)).toBe('hooked');
    expect(judge(end, schedule)).toBe('missed');
    expect(isMissed(end - 1, schedule)).toBe(false);
    expect(isMissed(end, schedule)).toBe(true);
  });
});
