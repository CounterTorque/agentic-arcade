import { describe, it, expect } from 'vitest';
import { createState, step, getAcrobatPosition, getPartnerPosition } from './logic';

describe('trapeze logic', () => {
  const mockDifficulty = { speed: 1.0, level: 1 as 1 | 2 | 3, round: 1 };

  describe('createState', () => {
    it('creates initial state for level 1', () => {
      const state = createState({ ...mockDifficulty, level: 1 });
      expect(state.released).toBe(false);
      expect(state.caught).toBe(false);
      expect(state.missed).toBe(false);
      expect(state.catchTolerance).toBe(40);
    });

    it('creates initial state for level 2', () => {
      const state = createState({ ...mockDifficulty, level: 2 });
      expect(state.catchTolerance).toBe(30);
    });

    it('creates initial state for level 3', () => {
      const state = createState({ ...mockDifficulty, level: 3 });
      expect(state.catchTolerance).toBe(20);
    });

    it('scales period by speed', () => {
      const state1 = createState({ ...mockDifficulty, speed: 1.0 });
      const state2 = createState({ ...mockDifficulty, speed: 2.0 });
      expect(state2.acrobatPeriod).toBe(state1.acrobatPeriod / 2);
    });
  });

  describe('step', () => {
    it('updates swing when not released', () => {
      const state = createState(mockDifficulty);
      const initialAngle = state.acrobatAngle;
      step(state, 100, false);
      expect(state.acrobatAngle).not.toBe(initialAngle);
      expect(state.released).toBe(false);
    });

    it('releases acrobat when action pressed', () => {
      const state = createState(mockDifficulty);
      step(state, 100, true);
      expect(state.released).toBe(true);
    });

    it('does not release twice', () => {
      const state = createState(mockDifficulty);
      step(state, 100, true);
      const releaseTime = state.releaseTime;
      step(state, 100, true);
      expect(state.releaseTime).toBeGreaterThan(releaseTime);
    });

    it('applies gravity during flight', () => {
      const state = createState(mockDifficulty);
      step(state, 100, true); // Release
      const initialY = state.acrobatY;
      const initialVelY = state.acrobatVelY;
      step(state, 100, false); // Flight
      expect(state.acrobatVelY).toBeGreaterThan(initialVelY);
      expect(state.acrobatY).toBeGreaterThan(initialY);
    });

    it('detects miss when falling below screen', () => {
      const state = createState(mockDifficulty);
      step(state, 100, true); // Release
      state.acrobatY = 800; // Force below screen
      step(state, 100, false);
      expect(state.missed).toBe(true);
    });

    it('stops updating after caught', () => {
      const state = createState(mockDifficulty);
      state.caught = true;
      const angle = state.acrobatAngle;
      step(state, 100, false);
      expect(state.acrobatAngle).toBe(angle);
    });

    it('stops updating after missed', () => {
      const state = createState(mockDifficulty);
      state.missed = true;
      const angle = state.acrobatAngle;
      step(state, 100, false);
      expect(state.acrobatAngle).toBe(angle);
    });
  });

  describe('getAcrobatPosition', () => {
    it('returns swing position when not released', () => {
      const state = createState(mockDifficulty);
      const pos = getAcrobatPosition(state);
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    });

    it('returns flight position when released', () => {
      const state = createState(mockDifficulty);
      step(state, 100, true); // Release
      const pos = getAcrobatPosition(state);
      expect(pos.x).toBe(state.acrobatX);
      expect(pos.y).toBe(state.acrobatY);
    });
  });

  describe('getPartnerPosition', () => {
    it('returns partner swing position', () => {
      const state = createState(mockDifficulty);
      const pos = getPartnerPosition(state);
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    });
  });
});
