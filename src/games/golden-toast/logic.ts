// Pure helpers for Golden Toast. No DOM, no randomness.

/** Centre of the gold band, as a fraction of the strip (0 = white, 1 = black). */
export const GOLD_CENTRE = 0.5;

export type Level = 1 | 2 | 3;
export type Verdict = 'pale' | 'gold' | 'burnt';

export interface LevelParams {
  /** Time to brown from white to black at speed 1.0, ms. */
  readonly browningMs: number;
  /** Width of the gold zone, as a fraction of the strip. */
  readonly goldWidth: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { browningMs: 3000, goldWidth: 0.2 },
  2: { browningMs: 2200, goldWidth: 0.15 },
  3: { browningMs: 1500, goldWidth: 0.1 },
};

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

/** How browned the toast is after `elapsedMs` of play time: 0 (white) to 1 (black). */
export function browningProgress(elapsedMs: number, browningMs: number, speed: number): number {
  return Math.min(1, Math.max(0, (elapsedMs * speed) / browningMs));
}

export function judge(progress: number, goldWidth: number): Verdict {
  if (progress < GOLD_CENTRE - goldWidth / 2) return 'pale';
  return progress > GOLD_CENTRE + goldWidth / 2 ? 'burnt' : 'gold';
}

type Rgb = readonly [number, number, number];

const WHITE: Rgb = [255, 247, 237];
const GOLD: Rgb = [217, 119, 6];
const BLACK: Rgb = [17, 24, 39];

function mix(from: Rgb, to: Rgb, u: number): string {
  const [r, g, b] = from.map((v, i) => Math.round(v + (to[i]! - v) * u));
  return `rgb(${r}, ${g}, ${b})`;
}

/** CSS colour of the strip (and the toast) at `t`: white, through gold at GOLD_CENTRE, to black. */
export function stripColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped < GOLD_CENTRE
    ? mix(WHITE, GOLD, clamped / GOLD_CENTRE)
    : mix(GOLD, BLACK, (clamped - GOLD_CENTRE) / (1 - GOLD_CENTRE));
}
