export type Level = 1 | 2 | 3;
export type Trap = 'armed' | 'warning' | 'sprung';
export type Mouse = 'home' | 'out' | 'back';
export type Verdict = 'win' | 'caught' | 'timeout';

export const DISTANCE = 300;
export const RESET_MS = 400;

const LEVELS = {
  1: { warningMs: 700, mouseSpeed: 600 },
  2: { warningMs: 450, mouseSpeed: 480 },
  3: { warningMs: 250, mouseSpeed: 480 },
} as const;

export function levelParams(level: Level): { warningMs: number; mouseSpeed: number } {
  return LEVELS[level];
}

export interface State {
  level: Level;
  trap: Trap;
  trapTime: number;
  trapDuration: number;
  mouse: Mouse;
  position: number;
  cheese: boolean;
  verdict: Verdict | null;
}

export function createState(level: Level): State {
  return { level, trap: 'armed', trapTime: 0, trapDuration: 100, mouse: 'home', position: 0, cheese: false, verdict: null };
}

export function step(state: State, dt: number, pressed: boolean, speed: number, randomArmed: () => number): Verdict | null {
  if (state.verdict) return state.verdict;
  if (pressed) state.mouse = state.mouse === 'out' ? 'back' : 'out';

  const params = levelParams(state.level);
  let remaining = dt * speed;
  while (remaining > 0 && !state.verdict) {
    const moving = state.mouse !== 'home' && !(state.mouse === 'out' && state.position === DISTANCE);
    const distance = state.mouse === 'out' ? DISTANCE - state.position : state.position;
    const travelTime = moving ? (distance / params.mouseSpeed) * 1000 : Infinity;
    const amount = Math.min(remaining, state.trapDuration - state.trapTime, travelTime);
    state.trapTime += amount;
    if (moving) {
      const movement = (params.mouseSpeed * amount) / 1000;
      state.position = state.mouse === 'out'
        ? Math.min(DISTANCE, state.position + movement)
        : Math.max(0, state.position - movement);
    }
    remaining -= amount;

    if (moving && travelTime <= amount) {
      if (state.mouse === 'out') {
        state.position = DISTANCE;
        state.cheese = true;
      } else {
        state.position = 0;
        state.mouse = 'home';
        if (state.cheese) state.verdict = 'win';
      }
    }
    if (!state.verdict && state.trapTime >= state.trapDuration) {
      state.trapTime = 0;
      if (state.trap === 'armed') {
        state.trap = 'warning';
        state.trapDuration = params.warningMs;
      } else if (state.trap === 'warning') {
        state.trap = 'sprung';
        state.trapDuration = RESET_MS;
        if (state.position > 0) state.verdict = 'caught';
      } else {
        state.trap = 'armed';
        state.trapDuration = state.level === 3 ? randomArmed() : 1000;
      }
    }
  }
  return state.verdict;
}
