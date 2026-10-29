export type Level = 1 | 2 | 3;
export interface LevelParams {
  period: number;
  width: number;
  quicken: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { period: 2000, width: 120, quicken: 0.9 },
  2: { period: 1500, width: 100, quicken: 0.9 },
  3: { period: 1100, width: 80, quicken: 0.8 },
};

export const CENTER = 480;
export const AMPLITUDE = 230;
export const CRATE_HEIGHT = 56;
export const BASE_TOP = 558;
export const HANG_Y = 260;
const GRAVITY = 3000;
const RESPAWN_MS = 300;

export interface State {
  phase: number;
  crate: 'hanging' | 'falling' | 'landed-wait';
  x: number;
  y: number;
  velocity: number;
  wait: number;
  stack: number[];
  result: 'win' | 'topple' | 'timeout' | null;
}

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function createState(phase: number): State {
  return { phase, crate: 'hanging', x: CENTER, y: HANG_Y, velocity: 0, wait: 0, stack: [], result: null };
}

export function hookX(state: State): number {
  return CENTER + AMPLITUDE * Math.sin(state.phase * Math.PI * 2);
}

export function topX(state: State): number {
  return state.stack.at(-1) ?? CENTER;
}

export function isOnStack(x: number, target: number, width: number): boolean {
  return Math.abs(x - target) <= width / 2;
}

export function step(state: State, dt: number, pressed: boolean, params: LevelParams, speed: number): void {
  if (state.result) return;
  state.phase += dt * speed / (params.period * params.quicken ** state.stack.length);
  if (state.crate === 'hanging' && pressed) {
    state.crate = 'falling';
    state.x = hookX(state);
    state.y = HANG_Y;
    state.velocity = 0;
  }
  if (state.crate === 'falling') {
    const seconds = dt * speed / 1000;
    state.y += state.velocity * seconds + GRAVITY * seconds * seconds / 2;
    state.velocity += GRAVITY * seconds;
    const landingY = BASE_TOP - state.stack.length * CRATE_HEIGHT - CRATE_HEIGHT;
    if (state.y >= landingY) {
      state.y = landingY;
      if (!isOnStack(state.x, topX(state), params.width)) {
        state.result = 'topple';
      } else {
        state.stack.push(state.x);
        if (state.stack.length === 3) state.result = 'win';
        else {
          state.crate = 'landed-wait';
          state.wait = RESPAWN_MS;
        }
      }
    }
  } else if (state.crate === 'landed-wait') {
    state.wait -= dt * speed;
    if (state.wait <= 0) state.crate = 'hanging';
  }
}
