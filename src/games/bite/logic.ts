import type { Rng } from '@arcade/sdk';

type Level = 1 | 2 | 3;
export type BobberState = 'calm' | 'twitch' | 'bite';
export type Verdict = 'early' | 'fake' | 'hooked' | 'missed';

export interface Schedule {
  twitches: { at: number; dur: number; depth: number }[];
  biteAt: number;
}

const LEVELS = {
  1: { fakesMin: 1, fakesMax: 2, fakeDepth: 0.25, windowMs: 600 },
  2: { fakesMin: 2, fakesMax: 3, fakeDepth: 0.45, windowMs: 450 },
  3: { fakesMin: 3, fakesMax: 4, fakeDepth: 0.8, windowMs: 300 },
} as const;

export const MIN_WINDOW_MS = 220;

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createSchedule(level: Level, rng: Rng): Schedule {
  const { fakesMin, fakesMax, fakeDepth } = levelParams(level);
  const count = rng.int(fakesMin, fakesMax);
  const twitches: Schedule['twitches'] = [];
  let time = rng.range(400, 700);
  for (let i = 0; i < count; i++) {
    twitches.push({ at: time, dur: 220, depth: fakeDepth });
    time += 220 + rng.range(350, 650);
  }
  return { twitches, biteAt: time };
}

export function windowRealMs(windowMs: number, speed: number): number {
  return Math.max(MIN_WINDOW_MS, windowMs / speed);
}

export function bobberState(gameT: number, schedule: Schedule): BobberState {
  if (gameT >= schedule.biteAt) return 'bite';
  return schedule.twitches.some((t) => gameT >= t.at && gameT < t.at + t.dur) ? 'twitch' : 'calm';
}

export function bobberDip(gameT: number, schedule: Schedule): number {
  if (gameT >= schedule.biteAt) return 1;
  const twitch = schedule.twitches.find((t) => gameT >= t.at && gameT < t.at + t.dur);
  return twitch ? twitch.depth * Math.sin((Math.PI * (gameT - twitch.at)) / twitch.dur) : 0;
}

export function judgePress(state: BobberState): Verdict {
  return state === 'bite' ? 'hooked' : state === 'twitch' ? 'fake' : 'early';
}
