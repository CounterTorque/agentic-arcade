import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { bobberDip, bobberState, createSchedule, judgePress, levelParams, windowRealMs } from './logic';

describe('bite timing', () => {
  it('uses the level parameters', () => {
    expect(levelParams(1)).toEqual({ fakesMin: 1, fakesMax: 2, fakeDepth: 0.25, windowMs: 600 });
    expect(levelParams(2)).toEqual({ fakesMin: 2, fakesMax: 3, fakeDepth: 0.45, windowMs: 450 });
    expect(levelParams(3)).toEqual({ fakesMin: 3, fakesMax: 4, fakeDepth: 0.8, windowMs: 300 });
  });

  it('creates deterministic schedules that fit the round at every speed', () => {
    for (const level of [1, 2, 3] as const) {
      const params = levelParams(level);
      for (let seed = 1; seed <= 100; seed++) {
        const schedule = createSchedule(level, createRng(seed));
        expect(schedule).toEqual(createSchedule(level, createRng(seed)));
        expect(schedule.twitches.length).toBeGreaterThanOrEqual(params.fakesMin);
        expect(schedule.twitches.length).toBeLessThanOrEqual(params.fakesMax);
        expect(schedule.twitches[0]!.at).toBeGreaterThanOrEqual(400);
        for (const [i, twitch] of schedule.twitches.entries()) {
          expect(twitch.depth).toBe(params.fakeDepth);
          expect(twitch.dur).toBe(220);
          const next = schedule.twitches[i + 1]?.at ?? schedule.biteAt;
          expect(next - twitch.at - twitch.dur).toBeGreaterThanOrEqual(350);
          expect(next - twitch.at - twitch.dur).toBeLessThanOrEqual(650);
        }
        for (const speed of [1, 2, 2.5]) {
          expect(schedule.biteAt / speed + windowRealMs(params.windowMs, speed)).toBeLessThan(5000 / speed);
        }
      }
    }
  });

  it('distinguishes calm, a fake dip and the real plunge', () => {
    const schedule = createSchedule(3, createRng(1));
    const twitch = schedule.twitches[0]!;
    expect(bobberState(twitch.at - 1, schedule)).toBe('calm');
    expect(bobberState(twitch.at, schedule)).toBe('twitch');
    expect(bobberDip(twitch.at + twitch.dur / 2, schedule)).toBeCloseTo(0.8);
    expect(bobberState(twitch.at + twitch.dur, schedule)).toBe('calm');
    expect(bobberDip(twitch.at + twitch.dur, schedule)).toBe(0);
    expect(bobberState(schedule.biteAt, schedule)).toBe('bite');
    expect(bobberDip(schedule.biteAt, schedule)).toBe(1);
    expect(judgePress('calm')).toBe('early');
    expect(judgePress('twitch')).toBe('fake');
    expect(judgePress('bite')).toBe('hooked');
  });

  it('scales the bite window with a minimum reaction time', () => {
    expect(windowRealMs(600, 1)).toBe(600);
    expect(windowRealMs(600, 2)).toBe(300);
    expect(windowRealMs(300, 2.5)).toBe(220);
  });
});