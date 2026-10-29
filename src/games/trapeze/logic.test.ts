import { describe, it, expect } from 'vitest';
import { createState, step, isLose } from './logic';
import { type Difficulty } from '@arcade/sdk';

describe('trapeze logic', () => {
  const baseDifficulty: Difficulty = { speed: 1, level: 1, round: 1 };

  it('creates initial state', () => {
    const state = createState(baseDifficulty);
    expect(state.released).toBe(false);
    expect(state.status).toBe('playing');
    expect(state.acrobatPhase).toBe(0);
    expect(state.partnerPhase).toBe(0);
  });

  it('updates phases during step', () => {
    const state = createState(baseDifficulty);
    step(state, 100, false, baseDifficulty);
    expect(state.acrobatPhase).toBeGreaterThan(0);
    expect(state.partnerPhase).toBeGreaterThan(0);
  });

  it('handles release action', () => {
    const state = createState(baseDifficulty);
    step(state, 100, true, baseDifficulty);
    expect(state.released).toBe(true);
  });

  it('applies gravity after release', () => {
    const state = createState(baseDifficulty);
    step(state, 100, true, baseDifficulty);
    const initialY = state.acrobatY;
    step(state, 100, false, baseDifficulty);
    expect(state.acrobatY).toBeGreaterThan(initialY);
  });

  it('detects miss when acrobat falls into net', () => {
    const state = createState(baseDifficulty);
    state.released = true;
    state.acrobatY = 650; // Below net
    step(state, 100, false, baseDifficulty);
    expect(isLose(state)).toBe(true);
  });

  it('respects difficulty level for phase offset', () => {
    const level2: Difficulty = { speed: 1, level: 2, round: 1 };
    const state = createState(level2);
    expect(state.partnerPhase).toBe(0.5); // Out of phase at level 2
  });

  it('scales swing periods by speed', () => {
    const state1 = createState(baseDifficulty);
    const state2 = createState({ speed: 2, level: 1, round: 1 });

    step(state1, 100, false, baseDifficulty);
    step(state2, 100, false, { speed: 2, level: 1, round: 1 });

    // Faster speed should result in larger phase change
    expect(state2.acrobatPhase).toBeGreaterThan(state1.acrobatPhase);
  });
});
