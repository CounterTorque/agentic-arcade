export type Level = 1 | 2 | 3;
export type Verdict = 'win' | 'pale' | 'burnt' | 'floor' | 'timeout';

const LEVELS = {
  1: { browningMs: 2500, maxDrift: 40 },
  2: { browningMs: 1800, maxDrift: 90 },
  3: { browningMs: 1200, maxDrift: 150 },
} satisfies Record<Level, { browningMs: number; maxDrift: number }>;

export const FLIGHT_MS = 900;
export const CATCH_RADIUS = 60;
export const PAN_SPEED = 500;

export interface State {
  level: Level;
  drift: number;
  panX: number;
  pancakeX: number;
  doneness: number;
  flight: number;
  tossed: boolean;
  verdict: Verdict | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createState(level: Level, drift: number): State {
  return { level, drift, panX: 480, pancakeX: 480, doneness: 0, flight: 0, tossed: false, verdict: null };
}

export function step(state: State, dt: number, pressed: boolean, direction: number, speed: number): Verdict | null {
  if (state.verdict) return state.verdict;
  const scaledDt = dt * speed;
  state.panX = Math.max(140, Math.min(820, state.panX + direction * PAN_SPEED * scaledDt / 1000));
  if (!state.tossed) {
    state.pancakeX = state.panX;
    state.doneness += scaledDt / levelParams(state.level).browningMs;
    if (state.doneness >= 1.4) state.verdict = 'burnt';
    else if (pressed) {
      if (state.doneness < 1) state.verdict = 'pale';
      else state.tossed = true;
    }
  } else {
    const previous = state.flight;
    state.flight = Math.min(FLIGHT_MS, state.flight + scaledDt);
    state.pancakeX += state.drift * (state.flight - previous) / FLIGHT_MS;
    if (state.flight === FLIGHT_MS) {
      state.verdict = Math.abs(state.pancakeX - state.panX) <= CATCH_RADIUS ? 'win' : 'floor';
    }
  }
  return state.verdict;
}
