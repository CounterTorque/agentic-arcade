import type { Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export type Verdict = 'early' | 'hooked' | 'missed';

interface LevelParams {
  readonly minFakes: number;
  readonly maxFakes: number;
  readonly windowMs: number;
  readonly fakeDepth: number;
}

export interface Schedule {
  readonly twitches: readonly { startMs: number; durMs: number; depth: number }[];
  readonly biteStartMs: number;
  readonly windowMs: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { minFakes: 1, maxFakes: 2, windowMs: 600, fakeDepth: 0.25 },
  2: { minFakes: 2, maxFakes: 3, windowMs: 450, fakeDepth: 0.5 },
  3: { minFakes: 3, maxFakes: 4, windowMs: 300, fakeDepth: 0.85 },
};

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function buildSchedule(rng: Rng, level: Level): Schedule {
  const { minFakes, maxFakes, windowMs, fakeDepth } = levelParams(level);
  const count = rng.int(minFakes, maxFakes);
  const twitches: { startMs: number; durMs: number; depth: number }[] = [];
  let next = rng.int(350, 650);
  for (let i = 0; i < count; i++) {
    twitches.push({ startMs: next, durMs: 260, depth: fakeDepth });
    next += 260 + rng.int(300, 600);
  }
  return { twitches, biteStartMs: next, windowMs };
}

export function gameTime(elapsed: number, speed: number): number {
  return elapsed * speed;
}

export function bobberDepth(t: number, schedule: Schedule): number {
  if (t >= schedule.biteStartMs) return Math.min(1, (t - schedule.biteStartMs) / 80);
  for (const twitch of schedule.twitches) {
    const progress = (t - twitch.startMs) / twitch.durMs;
    if (progress >= 0 && progress <= 1) return twitch.depth * Math.sin(Math.PI * progress);
  }
  return 0;
}

export function judge(t: number, schedule: Schedule): Verdict {
  if (t < schedule.biteStartMs) return 'early';
  return t < schedule.biteStartMs + schedule.windowMs ? 'hooked' : 'missed';
}

export function isMissed(t: number, schedule: Schedule): boolean {
  return t >= schedule.biteStartMs + schedule.windowMs;
}
