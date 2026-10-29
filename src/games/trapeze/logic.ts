export type Level = 1 | 2 | 3;
export interface Point { x: number; y: number }
export interface LevelParams {
  leftPeriod: number;
  rightPeriod: number;
  offset: number;
  tolerance: number;
}
export interface Flight {
  path: Point[];
  duration: number;
  caught: boolean;
  closest: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { leftPeriod: 1400, rightPeriod: 1400, offset: 0, tolerance: 40 },
  2: { leftPeriod: 1400, rightPeriod: 1400, offset: -0.15, tolerance: 30 },
  3: { leftPeriod: 1100, rightPeriod: 900, offset: 0.5, tolerance: 20 },
};

export const FLIGHT_STEP = 10;
const LENGTH = 250;
const AMPLITUDE = 0.6;
const GRAVITY = 2400;
const BOOST = 1.4;

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function swingAngle(time: number, period: number, phase: number): number {
  return AMPLITUDE * Math.sin((time / period + phase) * Math.PI * 2);
}

export function barPosition(time: number, params: LevelParams, phase: number, side: 'left' | 'right'): Point {
  const angle = side === 'left'
    ? swingAngle(time, params.leftPeriod, phase)
    : -swingAngle(time, params.rightPeriod, phase + params.offset);
  return { x: (side === 'left' ? 250 : 710) + LENGTH * Math.sin(angle), y: 90 + LENGTH * Math.cos(angle) };
}

export function partnerHands(time: number, params: LevelParams, phase: number): Point {
  const bar = barPosition(time, params, phase, 'right');
  return { x: bar.x, y: bar.y + 90 };
}

export function simulateFlight(releaseTime: number, params: LevelParams, speed: number, phase: number, allowCatch = true): Flight {
  const time = releaseTime * speed;
  const start = barPosition(time, params, phase, 'left');
  const angle = swingAngle(time, params.leftPeriod, phase);
  const angularVelocity = AMPLITUDE * Math.cos((time / params.leftPeriod + phase) * Math.PI * 2) * Math.PI * 2 / (params.leftPeriod / 1000);
  const vx = LENGTH * Math.cos(angle) * angularVelocity * BOOST;
  const vy = -LENGTH * Math.sin(angle) * angularVelocity * BOOST;
  const path: Point[] = [start];
  let closest = Infinity;
  for (let ms = FLIGHT_STEP; ms <= 600; ms += FLIGHT_STEP) {
    const t = ms / 1000;
    const point = { x: start.x + vx * t, y: start.y + vy * t + GRAVITY * t * t / 2 };
    path.push(point);
    const hands = partnerHands(time + ms, params, phase);
    const distance = Math.hypot(point.x - hands.x, point.y - hands.y);
    closest = Math.min(closest, distance);
    if (allowCatch && distance <= params.tolerance) return { path, duration: ms / speed, caught: true, closest };
    if (point.y >= 590) return { path, duration: ms / speed, caught: false, closest };
  }
  return { path, duration: 600 / speed, caught: false, closest };
}

export function flightPosition(flight: Flight, elapsed: number, speed: number): Point {
  const index = Math.min(flight.path.length - 1, Math.max(0, elapsed * speed / FLIGHT_STEP));
  const a = flight.path[Math.floor(index)]!;
  const b = flight.path[Math.min(flight.path.length - 1, Math.ceil(index))]!;
  const fraction = index - Math.floor(index);
  return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
}
