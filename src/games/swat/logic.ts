import type { Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export type Verdict = 'win' | 'timeout';

const LEVELS = {
  1: { speed: 200, changeMs: 800, hoverChance: 0 },
  2: { speed: 300, changeMs: 500, hoverChance: 0 },
  3: { speed: 420, changeMs: 300, hoverChance: 0.3 },
} satisfies Record<Level, { speed: number; changeMs: number; hoverChance: number }>;

export const HIT_RADIUS = 55;
export const BOUNDS = { left: 120, right: 840, top: 80, bottom: 420 };
const HOVER_MS = 150;

export interface State {
  level: Level;
  x: number;
  y: number;
  heading: number;
  changeIn: number;
  hover: number;
  verdict: Verdict | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createState(level: Level, rng: Rng): State {
  return {
    level,
    x: rng.range(BOUNDS.left, BOUNDS.right),
    y: rng.range(BOUNDS.top, BOUNDS.bottom),
    heading: rng.range(0, Math.PI * 2),
    changeIn: levelParams(level).changeMs,
    hover: 0,
    verdict: null,
  };
}

export function step(state: State, dt: number, speed: number, rng: Rng, click: { x: number; y: number } | null): Verdict | null {
  if (state.verdict) return state.verdict;
  if (click && Math.hypot(click.x - state.x, click.y - state.y) <= HIT_RADIUS) {
    state.verdict = 'win';
    return state.verdict;
  }

  const params = levelParams(state.level);
  let remaining = dt * speed;
  while (remaining > 0) {
    const elapsed = Math.min(remaining, state.changeIn, state.hover > 0 ? state.hover : remaining);
    if (state.hover > 0) state.hover -= elapsed;
    else {
      state.x += Math.cos(state.heading) * params.speed * elapsed / 1000;
      state.y += Math.sin(state.heading) * params.speed * elapsed / 1000;
      if (state.x < BOUNDS.left || state.x > BOUNDS.right) {
        state.x = state.x < BOUNDS.left ? 2 * BOUNDS.left - state.x : 2 * BOUNDS.right - state.x;
        state.heading = Math.PI - state.heading;
      }
      if (state.y < BOUNDS.top || state.y > BOUNDS.bottom) {
        state.y = state.y < BOUNDS.top ? 2 * BOUNDS.top - state.y : 2 * BOUNDS.bottom - state.y;
        state.heading = -state.heading;
      }
    }
    remaining -= elapsed;
    state.changeIn -= elapsed;
    if (state.changeIn <= 0) {
      state.heading = rng.range(0, Math.PI * 2);
      state.hover = params.hoverChance && rng.chance(params.hoverChance) ? HOVER_MS : 0;
      state.changeIn = params.changeMs;
    }
  }
  return null;
}
