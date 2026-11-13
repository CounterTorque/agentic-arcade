import type { Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export type Verdict = 'win' | 'lose' | 'timeout';
export interface Point { x: number; y: number }

export const TARGET = { x: 650, y: 310, radius: 120, centerRadius: 24 };
const LEVELS = {
  1: { radius: 30, force: 150 },
  2: { radius: 55, force: 275 },
  3: { radius: 80, force: 400 },
} satisfies Record<Level, { radius: number; force: number }>;

export interface State {
  level: Level;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  gustX: number;
  gustY: number;
  gustIn: number;
  jerkIn: number;
  verdict: Verdict | null;
  landing: Point | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createState(level: Level, rng: Rng): State {
  const angle = rng.range(0, Math.PI * 2);
  return {
    level, dx: 0, dy: 0, vx: 0, vy: 0,
    gustX: Math.cos(angle), gustY: Math.sin(angle),
    gustIn: rng.range(500, 1000), jerkIn: rng.range(350, 700),
    verdict: null, landing: null,
  };
}

export function step(state: State, dt: number, speed: number, rng: Rng): void {
  if (state.verdict) return;
  const params = levelParams(state.level);
  let remaining = dt * speed;
  while (remaining > 0) {
    const elapsed = Math.min(remaining, 16, state.gustIn, state.level === 3 ? state.jerkIn : remaining);
    const seconds = elapsed / 1000;
    state.vx += (state.gustX * params.force - state.dx * 4 - state.vx * 2) * seconds;
    state.vy += (state.gustY * params.force - state.dy * 4 - state.vy * 2) * seconds;
    state.dx += state.vx * seconds;
    state.dy += state.vy * seconds;
    const distance = Math.hypot(state.dx, state.dy);
    if (distance > params.radius) {
      state.dx *= params.radius / distance;
      state.dy *= params.radius / distance;
    }
    remaining -= elapsed;
    state.gustIn -= elapsed;
    if (state.level === 3) state.jerkIn -= elapsed;
    if (state.gustIn <= 0) {
      const angle = rng.range(0, Math.PI * 2);
      const strength = rng.range(0.6, 1);
      state.gustX = Math.cos(angle) * strength;
      state.gustY = Math.sin(angle) * strength;
      state.gustIn = rng.range(500, 1000);
    }
    if (state.level === 3 && state.jerkIn <= 0) {
      const angle = rng.range(0, Math.PI * 2);
      state.vx += Math.cos(angle) * 180;
      state.vy += Math.sin(angle) * 180;
      state.jerkIn = rng.range(350, 700);
    }
  }
}

export function reticle(state: State, aim: Point): Point {
  return { x: aim.x + state.dx, y: aim.y + state.dy };
}

export function shoot(state: State, aim: Point): 'win' | 'lose' {
  const landing = reticle(state, aim);
  state.landing = landing;
  const result = Math.hypot(landing.x - TARGET.x, landing.y - TARGET.y) <= TARGET.centerRadius ? 'win' : 'lose';
  state.verdict = result;
  return result;
}
