import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export const FRAME_WIDTH = 320;
export const FRAME_HEIGHT = 240;
export const RADIUS = 28;

const LEVELS = {
  1: { speed: 40, spreadX: 40, spreadY: 28 },
  2: { speed: 80, spreadX: 75, spreadY: 45 },
  3: { speed: 130, spreadX: 105, spreadY: 62 },
} satisfies Record<Level, { speed: number; spreadX: number; spreadY: number }>;

export interface Friend {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
}

export interface State {
  level: Level;
  speed: number;
  elapsed: number;
  phase: number;
  friends: Friend[];
  frame: { x: number; y: number };
  gesture: { x: number; y: number; frameX: number; frameY: number; dragged: boolean } | null;
  verdict: Outcome | null;
  shot: boolean;
}

export interface Input {
  x: number;
  y: number;
  down: boolean;
  pressed: boolean;
  released: boolean;
  inside: boolean;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function fullyInside(frame: State['frame'], friend: Pick<Friend, 'x' | 'y'>): boolean {
  return friend.x - RADIUS >= frame.x && friend.x + RADIUS <= frame.x + FRAME_WIDTH
    && friend.y - RADIUS >= frame.y && friend.y + RADIUS <= frame.y + FRAME_HEIGHT;
}

export function createState(level: Level, rng: Rng, speed: number): State {
  const params = LEVELS[level];
  const phase = rng.range(0, Math.PI * 2);
  const friends = Array.from({ length: 3 }, (_, i) => {
    const angle = level === 3 ? i * Math.PI * 2 / 3 + phase : rng.range(0, Math.PI * 2);
    const offsetX = Math.cos(angle) * params.spreadX * 0.65;
    const offsetY = Math.sin(angle) * params.spreadY * 0.65;
    return {
      x: 550 + offsetX, y: 320 + offsetY, offsetX, offsetY,
      vx: Math.cos(angle) * params.speed, vy: Math.sin(angle) * params.speed,
    };
  });
  return { level, speed, elapsed: 0, phase, friends, frame: { x: 80, y: 380 }, gesture: null, verdict: null, shot: false };
}

export function step(state: State, dt: number, input: Input): void {
  if (state.verdict) return;
  const params = LEVELS[state.level];
  state.elapsed += dt * state.speed / 1000;
  const centerX = 550 + 45 * Math.sin(state.elapsed * 0.55 + state.phase);
  const centerY = 320 + 35 * Math.sin(state.elapsed * 0.7 + state.phase);
  for (const friend of state.friends) {
    friend.offsetX += friend.vx * dt * state.speed / 1000;
    friend.offsetY += friend.vy * dt * state.speed / 1000;
    if (Math.abs(friend.offsetX) > params.spreadX) {
      friend.offsetX = clamp(friend.offsetX, -params.spreadX, params.spreadX);
      friend.vx = -friend.vx;
    }
    if (Math.abs(friend.offsetY) > params.spreadY) {
      friend.offsetY = clamp(friend.offsetY, -params.spreadY, params.spreadY);
      friend.vy = -friend.vy;
    }
    friend.x = centerX + friend.offsetX;
    friend.y = centerY + friend.offsetY;
  }
  if (input.pressed && input.inside) {
    state.gesture = { x: input.x, y: input.y, frameX: state.frame.x, frameY: state.frame.y, dragged: false };
  }
  const gesture = state.gesture;
  if (!gesture) return;
  const dx = input.x - gesture.x;
  const dy = input.y - gesture.y;
  if (Math.hypot(dx, dy) > 6) gesture.dragged = true;
  if (gesture.dragged && (input.down || input.released)) {
    state.frame.x = clamp(gesture.frameX + dx, 0, 960 - FRAME_WIDTH);
    state.frame.y = clamp(gesture.frameY + dy, 0, 720 - FRAME_HEIGHT);
  }
  if (input.released) {
    if (!gesture.dragged && input.inside) {
      state.shot = true;
      state.verdict = state.friends.every((friend) => fullyInside(state.frame, friend)) ? 'win' : 'lose';
    }
    state.gesture = null;
  }
}
