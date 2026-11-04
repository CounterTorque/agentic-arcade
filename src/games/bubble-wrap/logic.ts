import type { Outcome, Rng } from '@arcade/sdk';

export type Level = 1 | 2 | 3;

const LEVELS = {
  1: { count: 12, cols: 4, scroll: 20 },
  2: { count: 20, cols: 5, scroll: 40 },
  3: { count: 30, cols: 6, scroll: 60 },
} satisfies Record<Level, { count: number; cols: number; scroll: number }>;

export const RADIUS = 38;

export interface Bubble {
  x: number;
  y: number;
  popped: boolean;
  poppedAt: number;
}

export interface State {
  bubbles: Bubble[];
  offset: number;
  elapsed: number;
  scroll: number;
  verdict: Outcome | null;
  escaped: Bubble | null;
}

export function levelParams(level: Level) {
  return LEVELS[level];
}

export function createState(level: Level, rng: Rng, timeLimitMs: number, speed: number): State {
  const { count, cols, scroll } = levelParams(level);
  const rows = count / cols;
  const right = 960 - RADIUS - scroll * speed * timeLimitMs / 1000 * 0.65;
  const bubbles = Array.from({ length: count }, (_, i) => ({
    x: right - (cols - 1 - i % cols) * 120 + rng.range(-3, 3),
    y: 360 + (Math.floor(i / cols) - (rows - 1) / 2) * 100 + rng.range(-3, 3),
    popped: false,
    poppedAt: 0,
  }));
  return { bubbles, offset: 0, elapsed: 0, scroll: scroll * speed, verdict: null, escaped: null };
}

export function bubblePos(state: State, bubble: Bubble) {
  return { x: bubble.x + state.offset, y: bubble.y };
}

export function hitTest(state: State, point: { x: number; y: number }): Bubble | undefined {
  return state.bubbles.find((bubble) => {
    if (bubble.popped) return false;
    const { x, y } = bubblePos(state, bubble);
    return (point.x - x) ** 2 + (point.y - y) ** 2 <= RADIUS ** 2;
  });
}

export function step(state: State, dt: number, click: { x: number; y: number } | null): void {
  if (state.verdict) return;
  if (click) {
    const bubble = hitTest(state, click);
    if (bubble) {
      bubble.popped = true;
      bubble.poppedAt = state.elapsed;
      if (state.bubbles.every((b) => b.popped)) {
        state.verdict = 'win';
        return;
      }
    }
  }
  state.elapsed += dt;
  state.offset += state.scroll * dt / 1000;
  const escaped = state.bubbles.find((bubble) => !bubble.popped && bubblePos(state, bubble).x + RADIUS >= 960);
  if (escaped) {
    state.escaped = escaped;
    state.verdict = 'lose';
  }
}
