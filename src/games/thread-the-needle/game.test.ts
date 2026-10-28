import { describe, expect, it } from 'vitest';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { manifest } from './manifest';
import { CENTER_X, SWAY_AMPLITUDE, fallTimeMs, judge, levelParams, needleX } from './logic';

const entry = makeGameEntry(manifest, game);

describe('logic', () => {
  it('lists the spec values per level', () => {
    expect(levelParams(1)).toEqual({ periodS: 1.6, eyeWidth: 24 });
    expect(levelParams(2)).toEqual({ periodS: 1.2, eyeWidth: 18 });
    expect(levelParams(3)).toEqual({ periodS: 0.8, eyeWidth: 12 });
  });

  it('sways from the centre, peaks at a quarter period, and speeds up with speed', () => {
    expect(needleX(0, 1.6, 1)).toBeCloseTo(CENTER_X);
    expect(needleX(400, 1.6, 1)).toBeCloseTo(CENTER_X + SWAY_AMPLITUDE);
    // At speed 2 the quarter-period peak arrives at half the time.
    expect(needleX(200, 1.6, 2)).toBeCloseTo(CENTER_X + SWAY_AMPLITUDE);
  });

  it('passes the thread inside the eye and hits outside it', () => {
    expect(judge(CENTER_X, CENTER_X, 24)).toBe('through');
    // Half-width of the usable gap is (24 - 4) / 2 = 10px.
    expect(judge(CENTER_X + 10, CENTER_X, 24)).toBe('through');
    expect(judge(CENTER_X + 11, CENTER_X, 24)).toBe('hit');
    expect(judge(CENTER_X + 50, CENTER_X, 12)).toBe('hit');
  });

  it('gets faster with speed', () => {
    expect(fallTimeMs(2)).toBeCloseTo(fallTimeMs(1) / 2);
  });
});

describe(manifest.id, () => {
  it('loses when the thread is never dropped', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'timeout' });
  });

  it('can be threaded at level 1 (some drop time lands the thread in the eye)', async () => {
    let won = false;
    for (let frame = 1; frame <= 120 && !won; frame++) {
      const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
      won = result.kind === 'win';
    }
    expect(won).toBe(true);
  });

  it('can miss at level 3 (a mistimed drop hits the metal)', async () => {
    let lost = false;
    for (let frame = 1; frame <= 60 && !lost; frame++) {
      const result = await runEntry(entry, {
        level: 3,
        script: (f, input) => f === frame && input.tap('action'),
      });
      lost = result.kind === 'lose' && result.via === 'game';
    }
    expect(lost).toBe(true);
  });
});
