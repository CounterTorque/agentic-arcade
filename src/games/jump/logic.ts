import { STAGE_WIDTH, type Difficulty, type Rng } from '@arcade/sdk';

export const GROUND_Y = 600;
export const PLAYER = { x: 120, w: 48, h: 80, jumpVelocity: 1000, gravity: 2400 } as const;
export const AIRTIME_MS = ((2 * PLAYER.jumpVelocity) / PLAYER.gravity) * 1000;
export const BASE_CAR_SPEED = 520;
export const MAX_SPEED_VARIANCE = 1.2;
const HIT_INSET = 4;
const OFFSCREEN_MARGIN_MS = 150;
const FRONT_EDGE_X = PLAYER.x + PLAYER.w;

export type CarShape = 'mini' | 'sedan' | 'van' | 'truck';
const SHAPES: Record<CarShape, { w: [number, number]; h: [number, number] }> = {
  mini: { w: [80, 100], h: [40, 55] },
  sedan: { w: [120, 150], h: [45, 60] },
  van: { w: [110, 140], h: [70, 90] },
  truck: { w: [150, 180], h: [60, 90] },
};
const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#8338ec', '#ffbe0b'];

export interface Car {
  x: number;
  w: number;
  h: number;
  speed: number;
  shape: CarShape;
  color: string;
}

export interface JumpState {
  /** Height of the player's feet above the ground (0 = grounded). */
  y: number;
  vy: number;
  grounded: boolean;
  cars: Car[];
  status: 'running' | 'hit';
}

function makeCar(rng: Rng, difficulty: Difficulty, targetArrivalMs: number): { car: Car; arrivalMs: number } {
  const shape = rng.pick(Object.keys(SHAPES) as CarShape[]);
  const s = SHAPES[shape];
  const variance = difficulty.level >= 3 ? rng.range(1, MAX_SPEED_VARIANCE) : 1;
  const speed = BASE_CAR_SPEED * difficulty.speed * variance;
  const earliestMs = ((STAGE_WIDTH - FRONT_EDGE_X) / speed) * 1000 + OFFSCREEN_MARGIN_MS;
  const arrivalMs = Math.max(targetArrivalMs, earliestMs);
  const car: Car = {
    x: FRONT_EDGE_X + (speed * arrivalMs) / 1000,
    w: rng.int(s.w[0], s.w[1]),
    h: rng.int(s.h[0], s.h[1]),
    speed,
    shape,
    color: rng.pick(COLORS),
  };
  return { car, arrivalMs };
}

export function createState(difficulty: Difficulty, timeLimitMs: number, rng: Rng): JumpState {
  const first = makeCar(rng, difficulty, rng.range(0.4, 0.6) * timeLimitMs);
  const cars = [first.car];
  if (difficulty.level >= 2) {
    const second = makeCar(rng, difficulty, first.arrivalMs + AIRTIME_MS + rng.range(250, 450));
    if (second.arrivalMs <= timeLimitMs - 300) cars.push(second.car);
  }
  return { y: 0, vy: 0, grounded: true, cars, status: 'running' };
}

export function hits(s: JumpState, c: Car): boolean {
  const px0 = PLAYER.x + HIT_INSET;
  const px1 = PLAYER.x + PLAYER.w - HIT_INSET;
  return px1 > c.x && px0 < c.x + c.w && s.y < c.h - HIT_INSET;
}

/** Advance the simulation. Frozen once hit. */
export function step(s: JumpState, dtMs: number, jumpPressed: boolean): void {
  if (s.status === 'hit') return;
  const dt = dtMs / 1000;
  if (jumpPressed && s.grounded) {
    s.vy = PLAYER.jumpVelocity;
    s.grounded = false;
  }
  if (!s.grounded) {
    s.vy -= PLAYER.gravity * dt;
    s.y += s.vy * dt;
    if (s.y <= 0) {
      s.y = 0;
      s.vy = 0;
      s.grounded = true;
    }
  }
  for (const c of s.cars) c.x -= c.speed * dt;
  s.cars = s.cars.filter((c) => c.x + c.w > -40);
  if (s.cars.some((c) => hits(s, c))) s.status = 'hit';
}
