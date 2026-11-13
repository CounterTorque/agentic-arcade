import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;
export type Difference = 'missing-eye' | 'contrast' | 'frown' | 'missing-eyebrow' | 'tilted-hat' | 'shade' | 'subtle-shade' | 'rotation';

const LEVELS = {
  1: { size: 3, cell: 150, gap: 20, differences: ['missing-eye', 'contrast', 'frown'] },
  2: { size: 5, cell: 110, gap: 10, differences: ['missing-eyebrow', 'tilted-hat', 'shade'] },
  3: { size: 7, cell: 78, gap: 8, differences: ['subtle-shade', 'rotation'] },
} satisfies Record<Level, { size: number; cell: number; gap: number; differences: Difference[] }>;

export interface State {
  level: Level;
  odd: number;
  difference: Difference;
  palette: number;
  clicked: number | null;
  verdict: Outcome | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createState(level: Level, rng: Rng): State {
  const { size, differences } = levelParams(level);
  return {
    level,
    odd: rng.int(0, size * size - 1),
    difference: rng.pick(differences),
    palette: rng.int(0, 2),
    clicked: null,
    verdict: null,
  };
}

export function cellRect(level: Level, index: number) {
  const { size, cell, gap } = levelParams(level);
  const extent = size * cell + (size - 1) * gap;
  return {
    x: 480 - extent / 2 + (index % size) * (cell + gap),
    y: 390 - extent / 2 + Math.floor(index / size) * (cell + gap),
    width: cell,
    height: cell,
  };
}

export function hitTest(level: Level, point: { x: number; y: number }): number {
  const { size } = levelParams(level);
  for (let i = 0; i < size * size; i++) {
    const rect = cellRect(level, i);
    if (point.x >= rect.x && point.x < rect.x + rect.width && point.y >= rect.y && point.y < rect.y + rect.height) return i;
  }
  return -1;
}

export function step(state: State, click: { x: number; y: number } | null): void {
  if (state.verdict || !click) return;
  const index = hitTest(state.level, click);
  if (index === -1) return;
  state.clicked = index;
  state.verdict = index === state.odd ? 'win' : 'lose';
}
