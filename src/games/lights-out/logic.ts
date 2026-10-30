import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;

const LEVELS = {
  1: { cols: 4, rows: 4, lit: 6, relights: 0 },
  2: { cols: 4, rows: 5, lit: 10, relights: 1 },
  3: { cols: 5, rows: 7, lit: 15, relights: 3 },
} satisfies Record<Level, { cols: number; rows: number; lit: number; relights: number }>;

interface Relight {
  at: number;
  target: number | null;
  warned: boolean;
}

export interface State {
  level: Level;
  elapsed: number;
  warningMs: number;
  lit: boolean[];
  pendingRelights: Relight[];
  verdict: Outcome | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function windowRect(level: Level, index: number) {
  const { cols, rows } = levelParams(level);
  return {
    x: 480 - (cols - 1) * 60 - 40 + (index % cols) * 120,
    y: 625 - rows * 76 + Math.floor(index / cols) * 76,
    width: 80,
    height: 60,
  };
}

export function hitTest(level: Level, point: { x: number; y: number }): number {
  const { cols, rows } = levelParams(level);
  for (let i = 0; i < cols * rows; i++) {
    const rect = windowRect(level, i);
    if (point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height) return i;
  }
  return -1;
}

export function litCount(state: State): number {
  return state.lit.filter(Boolean).length;
}

export function createState(level: Level, rng: Rng, timeLimitMs: number): State {
  const { cols, rows, lit, relights } = levelParams(level);
  const windows = Array.from({ length: cols * rows }, (_, i) => i);
  const lights = windows.map(() => false);
  for (let i = 0; i < lit; i++) {
    const chosen = rng.int(i, windows.length - 1);
    [windows[i], windows[chosen]] = [windows[chosen], windows[i]];
    lights[windows[i]] = true;
  }
  const pendingRelights = Array.from({ length: relights }, (_, i) => ({
    at: timeLimitMs * (0.3 + 0.4 * (i + rng.next()) / relights),
    target: null,
    warned: false,
  }));
  return { level, elapsed: 0, warningMs: timeLimitMs * 0.04, lit: lights, pendingRelights, verdict: null };
}

export function step(state: State, dt: number, rng: Rng, click: { x: number; y: number } | null): void {
  if (state.verdict) return;
  if (click) {
    const index = hitTest(state.level, click);
    if (index !== -1) state.lit[index] = false;
  }
  state.elapsed += dt;
  for (const relight of state.pendingRelights) {
    if (!relight.warned && state.elapsed >= relight.at - state.warningMs) {
      const reserved = state.pendingRelights.flatMap((pending) => pending.target === null ? [] : [pending.target]);
      const dark = state.lit.flatMap((lit, i) => lit || reserved.includes(i) ? [] : [i]);
      relight.target = dark.length ? rng.pick(dark) : null;
      relight.warned = true;
    }
    if (state.elapsed >= relight.at) {
      const dark = state.lit.flatMap((lit, i) => lit ? [] : [i]);
      const target = relight.target !== null && !state.lit[relight.target] ? relight.target : dark.length ? rng.pick(dark) : null;
      if (target !== null) state.lit[target] = true;
    }
  }
  state.pendingRelights = state.pendingRelights.filter((relight) => state.elapsed < relight.at);
}

export function evaluate(state: State): Outcome {
  return litCount(state) === 0 ? 'win' : 'lose';
}
