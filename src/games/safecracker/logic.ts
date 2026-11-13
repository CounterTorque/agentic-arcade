export type Level = 1 | 2 | 3;

export interface LevelParams {
  level: Level;
  revolutionsPerSecond: number;
  windowMs: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { level: 1, revolutionsPerSecond: 1, windowMs: 120 },
  2: { level: 2, revolutionsPerSecond: 1.4, windowMs: 90 },
  3: { level: 3, revolutionsPerSecond: 1.8, windowMs: 70 },
};

export interface State {
  angle: number;
  direction: 1 | -1;
  locked: number;
  canLock: boolean;
  pulseMs: number;
  result: 'win' | 'miss' | 'timeout' | null;
}

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function createState(random: number): State {
  return { angle: 0.3 + random * 0.4, direction: 1, locked: 0, canLock: true, pulseMs: 0, result: null };
}

export function notchAngle(angle: number): number {
  return ((angle % 1) + 1) % 1;
}

export function inWindow(angle: number, params: LevelParams): boolean {
  const halfWidth = params.windowMs / 2000 * params.revolutionsPerSecond;
  return Math.abs(angle - Math.round(angle)) <= halfWidth;
}

export function sweptWindow(from: number, to: number, params: LevelParams): boolean {
  const halfWidth = params.windowMs / 2000 * params.revolutionsPerSecond;
  const low = Math.min(from, to) - halfWidth;
  const high = Math.max(from, to) + halfWidth;
  return Math.ceil(low) <= high;
}

export function step(state: State, dt: number, pressed: boolean, params: LevelParams, speed: number, random: () => number): void {
  if (state.result) return;
  state.pulseMs = Math.max(0, state.pulseMs - dt);
  const previous = state.angle;
  let next = previous + state.direction * params.revolutionsPerSecond * speed * dt / 1000;

  if (params.level === 3) {
    const farSide = state.direction === 1 ? Math.floor(previous + 0.5) + 0.5 : Math.ceil(previous - 0.5) - 0.5;
    if ((state.direction === 1 ? next >= farSide : next <= farSide) && random() < 0.5) {
      next = 2 * farSide - next;
      state.direction = state.direction === 1 ? -1 : 1;
    }
  }

  state.angle = next;
  if (pressed && state.canLock) {
    if (sweptWindow(previous, next, params)) {
      state.locked++;
      state.canLock = false;
      state.pulseMs = 220;
      if (state.locked === 3) state.result = 'win';
      else if (params.level === 2) state.direction = state.direction === 1 ? -1 : 1;
    } else {
      state.result = 'miss';
    }
  } else if (!state.canLock && !inWindow(next, params)) {
    state.canLock = true;
  }
}
