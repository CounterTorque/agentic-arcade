export const NEEDLE_X = 560;
export const CENTER_Y = 360;
export const BOB_AMPLITUDE = 180;
export const BOB_PERIOD_S = 1.4;
export const NEEDLE_WIDTH = 34;
export const HEAD_TOP = -54;
export const POINT_BOTTOM = 165;
export const THREAD_START_X = NEEDLE_X - NEEDLE_WIDTH / 2 - 110;
export const THREAD_WIDTH = 6;
export const TRAVEL_PX_PER_S = 700;

export type Level = 1 | 2 | 3;
export type Verdict = 'through' | 'hit' | 'miss';

export interface LevelParams {
  readonly eyeHeight: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { eyeHeight: 56 },
  2: { eyeHeight: 38 },
  3: { eyeHeight: 24 },
};

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function needleY(tMs: number, speed: number): number {
  return CENTER_Y + BOB_AMPLITUDE * Math.sin((2 * Math.PI * tMs * speed) / (BOB_PERIOD_S * 1000));
}

export function threadTipX(shotMs: number, speed: number): number {
  return Math.min(NEEDLE_X - NEEDLE_WIDTH / 2, THREAD_START_X + (shotMs / 1000) * TRAVEL_PX_PER_S * speed);
}

export function travelTimeMs(speed: number): number {
  return ((NEEDLE_X - NEEDLE_WIDTH / 2 - THREAD_START_X) / (TRAVEL_PX_PER_S * speed)) * 1000;
}

export function judge(threadY: number, needleCentreY: number, eyeHeight: number): Verdict {
  if (Math.abs(threadY - needleCentreY) <= (eyeHeight - THREAD_WIDTH) / 2) return 'through';
  return threadY >= needleCentreY + HEAD_TOP && threadY <= needleCentreY + POINT_BOTTOM ? 'hit' : 'miss';
}
