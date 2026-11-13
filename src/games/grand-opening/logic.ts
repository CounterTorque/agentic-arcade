// Pure helpers for Grand Opening. No DOM; all randomness comes from the rng passed in.
import type { Rng } from '@arcade/sdk';

/** Stage x of the scissors, which is where the cut lands. */
export const CUT_X = 480;
/** How far the mark travels either side of CUT_X at most. */
export const REACH = 140;

const MIN_REACH = 40;
/** Mark speed at difficulty speed 1.0, px per second. */
const SLIDE_PX_PER_S = 240;
const EASE_PERIOD_MS = 1200;

export type Level = 1 | 2 | 3;
export type Verdict = 'cut' | 'miss';

export interface LevelParams {
  /** Width of the red mark, px. */
  readonly markWidth: number;
  /** How much the posts speed up and slow down, as a fraction of their pace (0 = constant). */
  readonly easing: number;
  /** Whether the posts turn round at random points instead of at fixed ones. */
  readonly randomTurns: boolean;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { markWidth: 30, easing: 0, randomTurns: false },
  2: { markWidth: 22, easing: 0.6, randomTurns: false },
  3: { markWidth: 14, easing: 0, randomTurns: true },
};

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export interface Posts {
  /** Advance the posts by `dtMs` of play time. */
  step(dtMs: number): void;
  /** Stage x of the ribbon's centre, where the red mark sits. */
  centre(): number;
}

/**
 * Posts sliding to and fro across CUT_X. Every turning point lies beyond CUT_X, so the mark
 * passes under the scissors on every leg.
 */
export function createPosts(level: Level, speed: number, rng: Rng): Posts {
  const { easing, randomTurns } = levelParams(level);
  const reach = () => (randomTurns ? rng.range(MIN_REACH, REACH) : REACH);

  let x = CUT_X - REACH;
  let dir = 1;
  let target = CUT_X + reach();
  let clock = 0;

  return {
    step(dtMs) {
      clock += dtMs;
      const pace = 1 + easing * Math.sin((clock * speed * 2 * Math.PI) / EASE_PERIOD_MS);
      x += dir * ((SLIDE_PX_PER_S * speed * pace * dtMs) / 1000);
      if ((x - target) * dir >= 0) {
        x = target;
        dir = -dir;
        target = CUT_X + dir * reach();
      }
    },
    centre: () => x,
  };
}

export function judge(centre: number, markWidth: number): Verdict {
  return Math.abs(centre - CUT_X) <= markWidth / 2 ? 'cut' : 'miss';
}
