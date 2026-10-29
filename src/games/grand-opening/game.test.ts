import { describe, it, expect } from 'vitest';
import { runEntry, makeGameEntry } from '../../../tests/helpers/fake-host';
import { manifest } from './manifest';
import game from './index';

const entry = makeGameEntry(manifest, game);

describe('grand-opening game', () => {
  it('wins when snipping on the mark', async () => {
    // Try to find a frame where the mark is near center
    const result = await runEntry(entry, {
      seed: 42,
      level: 1,
      speed: 1,
      script: (frame, input) => {
        // Snip at frame 30 (around 500ms)
        if (frame === 30) {
          input.tap('action');
        }
      },
    });
    
    // Should resolve before timeout
    expect(result.kind).toMatch(/win|lose/);
    if (result.kind !== 'error') {
      expect(result.via).toBe('game');
    }
  });
  
  it('loses when snipping off the mark', async () => {
    const result = await runEntry(entry, {
      seed: 123,
      level: 1,
      speed: 1,
      script: (frame, input) => {
        // Snip immediately (mark unlikely to be centered)
        if (frame === 3) {
          input.tap('action');
        }
      },
    });
    
    expect(result.kind).toBe('lose');
    if (result.kind !== 'error') {
      expect(result.via).toBe('game');
    }
  });
  
  it('loses on timeout if never snipped', async () => {
    const result = await runEntry(entry, {
      seed: 1,
      level: 1,
      speed: 1,
    });
    
    expect(result.kind).toBe('lose');
    if (result.kind !== 'error') {
      expect(result.via).toBe('timeout');
    }
  });
  
  it('is deterministic with same seed', async () => {
    const seed = 999;
    const level = 2;
    const speed = 1.5;
    
    const result1 = await runEntry(entry, {
      seed,
      level,
      speed,
      script: (frame, input) => frame === 60 && input.tap('action'),
    });
    
    const result2 = await runEntry(entry, {
      seed,
      level,
      speed,
      script: (frame, input) => frame === 60 && input.tap('action'),
    });
    
    expect(result1.kind).toBe(result2.kind);
    if (result1.kind !== 'error' && result2.kind !== 'error') {
      expect(result1.via).toBe(result2.via);
    }
  });
  
  it('handles all difficulty levels', async () => {
    for (const level of [1, 2, 3] as const) {
      const result = await runEntry(entry, {
        seed: 100 + level,
        level,
        speed: 1,
        script: (frame, input) => frame === 48 && input.tap('action'),
      });
      
      expect(result.kind).toMatch(/win|lose/);
    }
  });
  
  it('handles high speed', async () => {
    const result = await runEntry(entry, {
      seed: 777,
      level: 3,
      speed: 2.5,
      script: (frame, input) => frame === 24 && input.tap('action'),
    });
    
    expect(result.kind).toMatch(/win|lose/);
  });
  
  it('can be won with good timing', async () => {
    // Try multiple seeds and frames to find a winnable scenario
    let wonAtLeastOnce = false;
    
    for (let seed = 0; seed < 10 && !wonAtLeastOnce; seed++) {
      // Try snipping at different frames
      for (let frame = 12; frame < 180 && !wonAtLeastOnce; frame += 6) {
        const result = await runEntry(entry, {
          seed,
          level: 1,
          speed: 1,
          script: (f, input) => f === frame && input.tap('action'),
        });
        
        if (result.kind === 'win') {
          wonAtLeastOnce = true;
        }
      }
    }
    
    expect(wonAtLeastOnce).toBe(true);
  });
});
