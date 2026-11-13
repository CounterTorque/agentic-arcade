export type Level = 1 | 2 | 3;
export type Verdict = 'under' | 'perfect' | 'over' | 'spill';

export interface LevelParams {
  rate: number;
  band: number;
  width: number;
  surge: number;
}

const LEVELS: Record<Level, LevelParams> = {
  1: { rate: 0.25, band: 0.06, width: 220, surge: 0 },
  2: { rate: 0.35, band: 0.04, width: 170, surge: 0 },
  3: { rate: 0.5, band: 0.03, width: 140, surge: 0.15 },
};

export const FILL_LINE = 0.7;

export function levelParams(level: Level): LevelParams {
  return LEVELS[level];
}

export function flowRate(params: LevelParams, speed: number, pourMs: number): number {
  return params.rate * speed * (1 + params.surge * Math.sin((2 * Math.PI * pourMs * speed) / 600));
}

export function judge(level: number, band: number): Verdict {
  if (level < FILL_LINE - band) return 'under';
  return level > FILL_LINE + band ? 'over' : 'perfect';
}

export interface State {
  level: number;
  pourMs: number;
  started: boolean;
  verdict: Verdict | null;
}

export function createState(): State {
  return { level: 0, pourMs: 0, started: false, verdict: null };
}

export function step(state: State, dt: number, holding: boolean, params: LevelParams, speed: number): void {
  if (state.verdict !== null || !holding) return;
  state.started = true;
  state.level += (flowRate(params, speed, state.pourMs + dt / 2) * dt) / 1000;
  state.pourMs += dt;
  if (state.level > 1) state.verdict = 'spill';
}
