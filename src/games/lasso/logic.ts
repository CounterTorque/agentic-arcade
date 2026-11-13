import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export const CALF_Y = 330;
export const LOOP_RADIUS = 65;
export const TRAVEL_MS = 400;
export const CALF_SPEED = { 1: 150, 2: 220, 3: 300 } as const;
const LEFT = 90;
const RIGHT = 870;

export interface State {
  level: Level;
  speed: number;
  startX: number;
  startDirection: number;
  turns: number[];
  elapsed: number;
  calfX: number;
  throw: { x: number; y: number; elapsed: number } | null;
  verdict: Outcome | null;
}

export function createState(level: Level, rng: Rng, speed: number): State {
  const startDirection = rng.chance(0.5) ? 1 : -1;
  const turns: number[] = [];
  if (level === 2) turns.push(rng.range(1400, 2000));
  if (level === 3) {
    let time = rng.range(900, 1300);
    while (time < 5000) {
      turns.push(time);
      time += rng.range(900, 1300);
    }
  }
  return {
    level, speed, startX: startDirection === 1 ? LEFT : RIGHT, startDirection,
    turns, elapsed: 0, calfX: startDirection === 1 ? LEFT : RIGHT,
    throw: null, verdict: null,
  };
}

export function predictCalf(state: State, elapsed: number): number {
  let x = state.startX;
  let direction = state.startDirection;
  let previous = 0;
  const times = [...state.turns.filter((time) => time < elapsed), elapsed];
  for (const time of times) {
    let distance = (time - previous) * CALF_SPEED[state.level] / 1000;
    while (distance > 0) {
      const toEdge = direction === 1 ? RIGHT - x : x - LEFT;
      if (distance <= toEdge) {
        x += direction * distance;
        distance = 0;
      } else {
        x += direction * toEdge;
        distance -= toEdge;
        direction *= -1;
      }
    }
    direction *= -1;
    previous = time;
  }
  return x;
}

export function step(state: State, dt: number, input: { x: number; y: number; pressed: boolean; inside: boolean }): void {
  if (state.verdict) return;
  if (!state.throw && input.pressed && input.inside) {
    state.throw = { x: input.x, y: input.y, elapsed: 0 };
  }
  const scaledDt = dt * state.speed;
  const travel = state.throw ? Math.min(scaledDt, TRAVEL_MS - state.throw.elapsed) : scaledDt;
  state.elapsed += travel;
  state.calfX = predictCalf(state, state.elapsed);
  if (state.throw) {
    state.throw.elapsed += travel;
    if (state.throw.elapsed >= TRAVEL_MS - 1e-8) {
      state.verdict = Math.hypot(state.throw.x - state.calfX, state.throw.y - CALF_Y) <= LOOP_RADIUS ? 'win' : 'lose';
    }
  }
}
