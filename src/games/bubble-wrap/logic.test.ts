import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { bubblePos, createState, hitTest, levelParams, RADIUS, step } from './logic';

describe('Bubble Wrap logic', () => {
  it('uses the specified counts and scroll rates with deterministic layouts', () => {
    for (const [level, count, scroll] of [[1, 12, 20], [2, 20, 40], [3, 30, 60]] as const) {
      expect(levelParams(level)).toMatchObject({ count, scroll });
      const state = createState(level, createRng(42), 2000, 2.5);
      expect(state).toEqual(createState(level, createRng(42), 2000, 2.5));
      expect(state.bubbles).toHaveLength(count);
      step(state, 100, null);
      expect(state.offset).toBe(scroll * 2.5 / 10);
    }
  });

  it('hits only unpopped bubbles, ignores misses, and wins after all are popped', () => {
    const state = createState(1, createRng(1), 5000, 1);
    expect(hitTest(state, { x: 0, y: 0 })).toBeUndefined();
    step(state, 0, { x: 0, y: 0 });
    for (const bubble of state.bubbles) {
      const point = bubblePos(state, bubble);
      expect(hitTest(state, point)).toBe(bubble);
      step(state, 0, point);
      expect(hitTest(state, point)).toBeUndefined();
    }
    expect(state.verdict).toBe('win');
  });

  it('loses as soon as an unpopped bubble reaches the edge', () => {
    const state = createState(3, createRng(7), 5000, 1);
    const leading = state.bubbles.reduce((a, b) => a.x > b.x ? a : b);
    const time = (960 - RADIUS - leading.x) / state.scroll * 1000;
    step(state, time - 1, null);
    expect(state.verdict).toBeNull();
    step(state, 2, null);
    expect(state.verdict).toBe('lose');
    expect(state.escaped).toBe(leading);
  });

  it('does not lose when a popped bubble reaches the edge', () => {
    const state = createState(1, createRng(1), 5000, 1);
    const leading = state.bubbles.reduce((a, b) => a.x > b.x ? a : b);
    step(state, 0, bubblePos(state, leading));
    const time = (960 - RADIUS - leading.x) / state.scroll * 1000;
    step(state, time + 1, null);
    expect(state.verdict).toBeNull();
  });
});
