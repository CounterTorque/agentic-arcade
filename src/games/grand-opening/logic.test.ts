import { describe, it, expect } from 'vitest';
import { createState, step, getMarkPosition, getPostPositions } from './logic';
import type { Difficulty, Rng } from '@arcade/sdk';

// Helper to create a mock RNG
function mockRng(values: number[]): Rng {
  let index = 0;
  return {
    next: () => values[index++ % values.length],
    int: (min: number, max: number) => {
      const val = values[index++ % values.length];
      return Math.floor(min + val * (max - min + 1));
    },
    range: (min: number, max: number) => {
      const val = values[index++ % values.length];
      return min + val * (max - min);
    },
    pick: <T>(items: readonly T[]): T => {
      const val = values[index++ % values.length];
      return items[Math.floor(val * items.length)];
    },
    chance: (p: number) => {
      const val = values[index++ % values.length];
      return val < p;
    },
  };
}

function makeDifficulty(speed = 1.0, level: 1 | 2 | 3 = 1, round = 0): Difficulty {
  return { speed, level, round };
}

describe('grand-opening logic', () => {
  describe('createState', () => {
    it('creates initial state with correct mark width for each level', () => {
      const rng = mockRng([0.5, 0.5, 0.5]);
      
      const state1 = createState(makeDifficulty(1, 1), rng);
      expect(state1.markWidth).toBe(30);
      
      const state2 = createState(makeDifficulty(1, 2), rng);
      expect(state2.markWidth).toBe(22);
      
      const state3 = createState(makeDifficulty(1, 3), rng);
      expect(state3.markWidth).toBe(14);
    });
    
    it('scales base speed with difficulty.speed', () => {
      const rng = mockRng([0.5, 0.5]);
      
      const state1 = createState(makeDifficulty(1.0, 1), rng);
      expect(state1.baseSpeed).toBe(80);
      
      const state2 = createState(makeDifficulty(2.0, 1), rng);
      expect(state2.baseSpeed).toBe(160);
      
      const state3 = createState(makeDifficulty(2.5, 1), rng);
      expect(state3.baseSpeed).toBe(200);
    });
    
    it('starts ribbon at center', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      expect(state.ribbon.x).toBe(480); // 960 / 2
    });
    
    it('initializes with no snip', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      expect(state.snipped).toBe(false);
      expect(state.result).toBe(null);
    });
  });
  
  describe('step', () => {
    it('moves ribbon based on velocity at level 1', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      const initialX = state.ribbon.x;
      const velocity = state.ribbon.velocity;
      
      step(state, 100, false, makeDifficulty(1, 1), rng);
      
      // Should move by velocity * dt
      expect(state.ribbon.x).toBeCloseTo(initialX + velocity * 0.1, 1);
    });
    
    it('detects hit when snipping on the mark', () => {
      const rng = mockRng([0.5, 0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      // Position ribbon so mark is at center (where scissors are)
      state.ribbon.x = 480; // Center
      state.markX = 0; // Mark at ribbon center
      
      step(state, 16, true, makeDifficulty(1, 1), rng);
      
      expect(state.snipped).toBe(true);
      expect(state.result).toBe('hit');
    });
    
    it('detects miss when snipping off the mark', () => {
      const rng = mockRng([0.5, 0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      // Position ribbon so mark is far from center
      state.ribbon.x = 480;
      state.markX = 200; // Mark far from center
      
      step(state, 16, true, makeDifficulty(1, 1), rng);
      
      expect(state.snipped).toBe(true);
      expect(state.result).toBe('miss');
    });
    
    it('freezes state after snipping', () => {
      const rng = mockRng([0.5, 0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      state.ribbon.x = 480;
      state.markX = 0;
      
      step(state, 16, true, makeDifficulty(1, 1), rng);
      const xAfterSnip = state.ribbon.x;
      
      // Further steps should not move the ribbon
      step(state, 16, false, makeDifficulty(1, 1), rng);
      expect(state.ribbon.x).toBe(xAfterSnip);
    });
    
    it('keeps ribbon within bounds', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      // Force ribbon to edge
      state.ribbon.x = 100;
      state.ribbon.velocity = -1000; // Moving left fast
      
      step(state, 1000, false, makeDifficulty(1, 1), rng);
      
      // Should be bounded and velocity reversed
      expect(state.ribbon.x).toBeGreaterThanOrEqual(350);
      expect(state.ribbon.velocity).toBeGreaterThan(0);
    });
    
    it('handles level 2 velocity changes', () => {
      const rng = mockRng([0.5, 0.3, 0.7, 0.5]);
      const state = createState(makeDifficulty(1, 2), rng);
      
      const initialVelocity = state.ribbon.velocity;
      
      // Step multiple times to allow velocity to change
      for (let i = 0; i < 10; i++) {
        step(state, 100, false, makeDifficulty(1, 2), rng);
      }
      
      // Velocity should have changed from initial
      expect(state.ribbon.velocity).not.toBe(initialVelocity);
    });
    
    it('handles level 3 direction changes', () => {
      const rng = mockRng([0.5, 0.5, 0.1]); // Low value for short change time
      const state = createState(makeDifficulty(1, 3), rng);
      
      const initialVelocity = state.ribbon.velocity;
      
      // Step until direction change
      for (let i = 0; i < 100; i++) {
        step(state, 16, false, makeDifficulty(1, 3), rng);
        if (state.ribbon.velocity !== initialVelocity) {
          break;
        }
      }
      
      // Velocity should have reversed
      expect(Math.sign(state.ribbon.velocity)).toBe(-Math.sign(initialVelocity));
    });
  });
  
  describe('getMarkPosition', () => {
    it('returns absolute position of mark', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      state.ribbon.x = 500;
      state.markX = 50;
      
      const pos = getMarkPosition(state);
      expect(pos.x).toBe(550);
      expect(pos.y).toBe(300); // RIBBON_Y
    });
  });
  
  describe('getPostPositions', () => {
    it('returns symmetric post positions', () => {
      const rng = mockRng([0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      state.ribbon.x = 480;
      
      const posts = getPostPositions(state);
      expect(posts.left).toBe(180); // 480 - 300
      expect(posts.right).toBe(780); // 480 + 300
    });
  });
  
  describe('determinism', () => {
    it('produces identical results with same seed', () => {
      const rng1 = mockRng([0.3, 0.7, 0.5, 0.2, 0.8]);
      const rng2 = mockRng([0.3, 0.7, 0.5, 0.2, 0.8]);
      
      const state1 = createState(makeDifficulty(1.5, 2), rng1);
      const state2 = createState(makeDifficulty(1.5, 2), rng2);
      
      expect(state1.ribbon.x).toBe(state2.ribbon.x);
      expect(state1.markX).toBe(state2.markX);
      expect(state1.markWidth).toBe(state2.markWidth);
      
      // Step both identically
      for (let i = 0; i < 10; i++) {
        step(state1, 16, false, makeDifficulty(1.5, 2), rng1);
        step(state2, 16, false, makeDifficulty(1.5, 2), rng2);
      }
      
      expect(state1.ribbon.x).toBeCloseTo(state2.ribbon.x, 5);
    });
  });
  
  describe('winnable scenarios', () => {
    it('can win by snipping when mark passes center', () => {
      const rng = mockRng([0.5, 0.5, 0.5]);
      const state = createState(makeDifficulty(1, 1), rng);
      
      // Simulate until mark is near center
      let won = false;
      for (let i = 0; i < 1000 && !won; i++) {
        const markPos = getMarkPosition(state);
        const distanceFromCenter = Math.abs(markPos.x - 480);
        
        if (distanceFromCenter < state.markWidth / 2) {
          step(state, 16, true, makeDifficulty(1, 1), rng);
          if (state.result === 'hit') {
            won = true;
          }
        } else {
          step(state, 16, false, makeDifficulty(1, 1), rng);
        }
      }
      
      expect(won).toBe(true);
    });
  });
});
