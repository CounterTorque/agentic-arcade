import { describe, it, expect } from 'vitest';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import { depth } from '../../../tests/helpers/depth';
import { manifest } from './manifest';
import game from './index';

const entry = makeGameEntry(manifest, game);

describe('trapeze game', () => {
  it('wins when acrobat is caught by partner', async () => {
    const result = await runEntry(entry, {
      seed: 42,
      speed: 1.0,
      level: 1,
      script: (frame, input) => {
        if (frame === 72) { // ~1200ms at 60fps
          input.tap('action');
        }
      },
    });
    expect(result.kind).toBe('win');
  });

  it('loses when acrobat misses partner', async () => {
    const result = await runEntry(entry, {
      seed: 42,
      speed: 1.0,
      level: 1,
      script: (frame, input) => {
        if (frame === 6) { // ~100ms - too early
          input.tap('action');
        }
      },
    });
    expect(result.kind).toBe('lose');
  });

  it('loses on timeout if never released', async () => {
    const result = await runEntry(entry, {
      seed: 42,
      speed: 1.0,
      level: 1,
      // No script - no input
    });
    expect(result.kind).toBe('lose');
  });

  it('is deterministic with same seed and inputs', async () => {
    const script = (frame: number, input: { tap: (key: string) => void }) => {
      if (frame === 72) input.tap('action');
    };
    const r1 = await runEntry(entry, { seed: 123, speed: 1.0, level: 1, script });
    const r2 = await runEntry(entry, { seed: 123, speed: 1.0, level: 1, script });
    expect(r1.kind).toBe(r2.kind);
  });

  describe('difficulty scaling', () => {
    it('works at level 1', async () => {
      const result = await runEntry(entry, {
        seed: 42,
        speed: 1.0,
        level: 1,
        script: (frame, input) => {
          if (frame === 72) input.tap('action');
        },
      });
      expect(result.kind).toMatch(/win|lose/);
    });

    it('works at level 2', async () => {
      const result = await runEntry(entry, {
        seed: 42,
        speed: 1.0,
        level: 2,
        script: (frame, input) => {
          if (frame === 72) input.tap('action');
        },
      });
      expect(result.kind).toMatch(/win|lose/);
    });

    it('works at level 3', async () => {
      const result = await runEntry(entry, {
        seed: 42,
        speed: 1.0,
        level: 3,
        script: (frame, input) => {
          if (frame === 72) input.tap('action');
        },
      });
      expect(result.kind).toMatch(/win|lose/);
    });

    it('works at high speed', async () => {
      const result = await runEntry(entry, {
        seed: 42,
        speed: 2.5,
        level: 1,
        script: (frame, input) => {
          if (frame === 36) input.tap('action'); // Earlier frame for higher speed
        },
      });
      expect(result.kind).toMatch(/win|lose/);
    });
  });

  describe('across many seeds', depth('smoke', 'full'), () => {
    const seeds = depth.is('full') ? 50 : 10;
    const speeds = depth.is('full') ? [1.0, 1.5, 2.0, 2.5] : [1.0, 2.5];
    const levels = [1, 2, 3] as const;

    for (const level of levels) {
      for (const speed of speeds) {
        it(`can be won at level ${level}, speed ${speed}`, async () => {
          let wins = 0;
          for (let seed = 0; seed < seeds; seed++) {
            // Try multiple release times to find a winning one
            for (let releaseFrame = 48; releaseFrame <= 120; releaseFrame += 12) {
              const result = await runEntry(entry, {
                seed,
                speed,
                level,
                script: (frame, input) => {
                  if (frame === releaseFrame) input.tap('action');
                },
              });
              if (result.kind === 'win') {
                wins++;
                break;
              }
            }
          }
          expect(wins).toBeGreaterThan(0);
        });

        it(`can be lost at level ${level}, speed ${speed}`, async () => {
          let losses = 0;
          for (let seed = 0; seed < seeds; seed++) {
            const result = await runEntry(entry, {
              seed,
              speed,
              level,
              script: (frame, input) => {
                if (frame === 3) input.tap('action'); // Way too early
              },
            });
            if (result.kind === 'lose') {
              losses++;
            }
          }
          expect(losses).toBeGreaterThan(0);
        });
      }
    }
  });
});
