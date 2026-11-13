import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { CALF_SPEED, CALF_Y, createState, LOOP_RADIUS, predictCalf, step, TRAVEL_MS } from './logic';

const idle = { x: 0, y: 0, pressed: false, inside: true };

describe('lasso simulation', () => {
  it('uses the specified speeds and scheduled turns', () => {
    for (const level of [1, 2, 3] as const) {
      const state = createState(level, createRng(1), 1);
      expect(Math.abs(predictCalf(state, 500) - state.startX)).toBe(CALF_SPEED[level] / 2);
      expect(state.turns.length).toBe(level === 1 ? 0 : level === 2 ? 1 : 4);
      for (const turn of state.turns) {
        const before = predictCalf(state, turn - 10);
        const at = predictCalf(state, turn);
        const after = predictCalf(state, turn + 10);
        expect((at - before) * (after - at)).toBeLessThan(0);
      }
    }
  });

  it('lands after scaled travel time and ignores later clicks', () => {
    const state = createState(1, createRng(1), 2);
    const target = predictCalf(state, TRAVEL_MS);
    step(state, 50, { x: target, y: CALF_Y, pressed: true, inside: true });
    step(state, 100, { x: 0, y: 0, pressed: true, inside: true });
    expect(state.verdict).toBeNull();
    step(state, 50, idle);
    expect(state.verdict).toBe('win');
    expect(state.throw?.x).toBe(target);
  });

  it('uses loop distance to distinguish hits from misses', () => {
    for (const [offset, result] of [[LOOP_RADIUS, 'win'], [LOOP_RADIUS + 1, 'lose']] as const) {
      const state = createState(1, createRng(1), 1);
      step(state, TRAVEL_MS, { x: predictCalf(state, TRAVEL_MS), y: CALF_Y + offset, pressed: true, inside: true });
      expect(state.verdict).toBe(result);
    }
  });
});
