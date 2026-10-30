import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export type Critter = 'gopher' | 'rabbit';

const LEVELS = {
  1: { cols: 3, rows: 2, hits: 5, upMs: 900 },
  2: { cols: 3, rows: 3, hits: 6, upMs: 650 },
  3: { cols: 4, rows: 3, hits: 7, upMs: 450 },
} satisfies Record<Level, { cols: number; rows: number; hits: number; upMs: number }>;

export interface Pop {
  kind: Critter;
  hole: number;
  start: number;
  end: number;
  bopped: boolean;
}

export interface State {
  level: Level;
  elapsed: number;
  hits: number;
  pops: Pop[];
  verdict: Outcome | null;
  rabbitHit: number | null;
  bonk: { hole: number; until: number } | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function holeRect(level: Level, index: number) {
  const { cols, rows } = levelParams(level);
  return {
    x: 480 + (index % cols - (cols - 1) / 2) * 200,
    y: 350 + (Math.floor(index / cols) - (rows - 1) / 2) * 165,
  };
}

export function active(pop: Pop, elapsed: number): boolean {
  return !pop.bopped && elapsed >= pop.start && elapsed <= pop.end;
}

export function popOffset(pop: Pop, elapsed: number): number {
  const edge = (pop.end - pop.start) * 0.12;
  return 25 * (1 - Math.min(1, (elapsed - pop.start) / edge, (pop.end - elapsed) / edge));
}

export function hitTest(state: State, point: { x: number; y: number }): Pop | undefined {
  return state.pops.find((pop) => {
    if (!active(pop, state.elapsed)) return false;
    const { x, y } = holeRect(state.level, pop.hole);
    return ((point.x - x) / 52) ** 2 + ((point.y - (y - 35 + popOffset(pop, state.elapsed))) / 58) ** 2 <= 1;
  });
}

export function createState(level: Level, rng: Rng, timeLimitMs: number, speed: number): State {
  const { cols, rows, hits, upMs } = levelParams(level);
  const duration = upMs / speed;
  const count = hits + 3;
  const first = 200 / speed;
  const interval = (timeLimitMs - duration - first) / (count - 1);
  const pops: Pop[] = [];
  const add = (kind: Critter, start: number) => {
    const end = start + duration;
    const available = Array.from({ length: cols * rows }, (_, i) => i)
      .filter((hole) => !pops.some((pop) => pop.hole === hole && start < pop.end && end > pop.start));
    pops.push({ kind, hole: rng.pick(available), start, end, bopped: false });
  };
  for (let i = 0; i < count; i++) add('gopher', first + interval * i);
  const rabbits = level === 1 ? 0 : level === 2 ? 1 : rng.int(2, 3);
  for (let i = 0; i < rabbits; i++) {
    add('rabbit', first + (i + 1) * (timeLimitMs - duration - first) / (rabbits + 1));
  }
  return { level, elapsed: 0, hits: 0, pops, verdict: null, rabbitHit: null, bonk: null };
}

export function step(state: State, dt: number, click: { x: number; y: number } | null): void {
  if (state.verdict) return;
  if (click) {
    const pop = hitTest(state, click);
    if (pop?.kind === 'rabbit') {
      state.rabbitHit = pop.hole;
      state.verdict = 'lose';
    } else if (pop) {
      pop.bopped = true;
      state.hits++;
      state.bonk = { hole: pop.hole, until: state.elapsed + 250 };
      if (state.hits >= levelParams(state.level).hits) state.verdict = 'win';
    }
  }
  state.elapsed += dt;
}
