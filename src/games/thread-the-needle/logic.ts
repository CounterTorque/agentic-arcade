// Pure helpers for Thread the Needle. No DOM, no randomness.

export const CENTER_X = 480;
/** Horizontal sway of the needle, in stage px, either side of CENTER_X. */
export const SWAY_AMPLITUDE = 220;
/** Y of the thread's tip before it is dropped. */
export const THREAD_START_Y = 120;
/** Y of the needle's eye. The thread is judged when its tip reaches this line. */
export const EYE_Y = 430;
export const THREAD_WIDTH = 4;
/** Fall speed of the dropped thread at speed 1.0, px/s. */
export const FALL_PX_PER_S = 900;

export type Level = 1 | 2 | 3;
export type Verdict = 'through' | 'hit';

export interface LevelParams {
  /** Sway period at speed 1.0, seconds. */
  readonly periodS: number;
  /** Width of the needle's eye, px. */
  readonly eyeWidth: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { periodS: 1.6, eyeWidth: 24 },
  2: { periodS: 1.2, eyeWidth: 18 },
  3: { periodS: 0.8, eyeWidth: 12 },
};

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

/** Needle centre x after `tMs` of play time. Starts at CENTER_X and moves faster with speed. */
export function needleX(tMs: number, periodS: number, speed: number): number {
  return CENTER_X + SWAY_AMPLITUDE * Math.sin((2 * Math.PI * tMs * speed) / (periodS * 1000));
}

/** Tip y of the thread `dropMs` after it was dropped, clamped at the eye line. */
export function threadY(dropMs: number, speed: number): number {
  return Math.min(EYE_Y, THREAD_START_Y + (dropMs / 1000) * FALL_PX_PER_S * speed);
}

/** Time from drop until the thread tip reaches the eye line, ms. */
export function fallTimeMs(speed: number): number {
  return ((EYE_Y - THREAD_START_Y) / (FALL_PX_PER_S * speed)) * 1000;
}

/** True once the thread tip has reached the eye line. */
export function hasArrived(dropMs: number, speed: number): boolean {
  return dropMs >= fallTimeMs(speed);
}

/** The thread passes through when its centre is inside the eye, allowing for its own width. */
export function judge(threadX: number, needleCentreX: number, eyeWidth: number): Verdict {
  return Math.abs(threadX - needleCentreX) <= (eyeWidth - THREAD_WIDTH) / 2 ? 'through' : 'hit';
}
