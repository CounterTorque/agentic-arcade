import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { cellRect, createState, hitTest, levelParams, step } from './logic';

const center = (level: 1 | 2 | 3, index: number) => {
  const rect = cellRect(level, index);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
};

describe('Odd One Out logic', () => {
  it('creates deterministic layouts and fits every cell on the stage', () => {
    for (const level of [1, 2, 3] as const) {
      const params = levelParams(level);
      expect(params.size).toBe([3, 5, 7][level - 1]);
      for (let seed = 1; seed <= 30; seed++) {
        const state = createState(level, createRng(seed));
        expect(state).toEqual(createState(level, createRng(seed)));
        expect(state.odd).toBeGreaterThanOrEqual(0);
        expect(state.odd).toBeLessThan(params.size ** 2);
        expect(params.differences).toContain(state.difference);
      }
      for (let i = 0; i < params.size ** 2; i++) {
        const rect = cellRect(level, i);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(960);
        expect(rect.y + rect.height).toBeLessThanOrEqual(720);
        expect(hitTest(level, center(level, i))).toBe(i);
      }
      const first = cellRect(level, 0);
      expect(hitTest(level, { x: first.x + first.width + params.gap / 2, y: first.y + first.height / 2 })).toBe(-1);
      expect(hitTest(level, { x: 0, y: 0 })).toBe(-1);
    }
  });

  it('resolves picks once and ignores gaps', () => {
    for (const level of [1, 2, 3] as const) {
      const state = createState(level, createRng(1));
      step(state, { x: 0, y: 0 });
      expect(state.verdict).toBeNull();
      step(state, center(level, state.odd));
      expect(state).toMatchObject({ verdict: 'win', clicked: state.odd });
      step(state, center(level, (state.odd + 1) % (levelParams(level).size ** 2)));
      expect(state.verdict).toBe('win');

      const wrong = createState(level, createRng(1));
      const index = (wrong.odd + 1) % (levelParams(level).size ** 2);
      step(wrong, center(level, index));
      expect(wrong).toMatchObject({ verdict: 'lose', clicked: index });
    }
  });
});
