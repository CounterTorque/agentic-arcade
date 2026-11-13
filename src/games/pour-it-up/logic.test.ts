import { describe, expect, it } from 'vitest';
import { createState, FILL_LINE, flowRate, judge, levelParams, step } from './logic';

describe('pour logic', () => {
  it('sets the rate, tolerance and glass width for each level', () => {
    expect(levelParams(1)).toEqual({ rate: 0.25, band: 0.06, width: 220, surge: 0 });
    expect(levelParams(2)).toEqual({ rate: 0.35, band: 0.04, width: 170, surge: 0 });
    expect(levelParams(3)).toEqual({ rate: 0.5, band: 0.03, width: 140, surge: 0.15 });
  });

  it('accepts both edges of the band and rejects outside it', () => {
    const band = levelParams(1).band;
    expect(judge(FILL_LINE - band - 0.001, band)).toBe('under');
    expect(judge(FILL_LINE - band, band)).toBe('perfect');
    expect(judge(FILL_LINE + band, band)).toBe('perfect');
    expect(judge(FILL_LINE + band + 0.001, band)).toBe('over');
  });

  it('scales flow by speed and applies the level-three surge', () => {
    expect(flowRate(levelParams(1), 2.5, 0)).toBe(0.625);
    expect(flowRate(levelParams(3), 2, 75)).toBeCloseTo(1.15);
    expect(flowRate(levelParams(3), 2, 225)).toBeCloseTo(0.85);
  });

  it('pours only while held and freezes after spilling', () => {
    const state = createState();
    step(state, 500, false, levelParams(1), 1);
    expect(state).toEqual(createState());
    step(state, 4000, true, levelParams(1), 1);
    expect(state.level).toBe(1);
    expect(state.verdict).toBeNull();
    step(state, 50, true, levelParams(1), 1);
    expect(state.verdict).toBe('spill');
    const level = state.level;
    step(state, 50, true, levelParams(1), 1);
    expect(state.level).toBe(level);
  });
});
