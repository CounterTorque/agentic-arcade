import { describe, expect, it, vi } from 'vitest';
import { createFakeHost, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { manifest } from './manifest';
import {
  BOB_AMPLITUDE,
  BOB_PERIOD_S,
  CENTER_Y,
  HEAD_TOP,
  NEEDLE_WIDTH,
  NEEDLE_X,
  POINT_BOTTOM,
  THREAD_START_X,
  judge,
  levelParams,
  needleY,
  threadTipX,
  travelTimeMs,
} from './logic';

const entry = makeGameEntry(manifest, game);

describe('logic', () => {
  it('shrinks the eye at each level', () => {
    expect(([1, 2, 3] as const).map((level) => levelParams(level).eyeHeight)).toEqual([56, 38, 24]);
  });

  it('bobs from the centre, peaks at a quarter period, and speeds up with speed', () => {
    expect(needleY(0, 1)).toBeCloseTo(CENTER_Y);
    expect(needleY(BOB_PERIOD_S * 250, 1)).toBeCloseTo(CENTER_Y + BOB_AMPLITUDE);
    expect(needleY(BOB_PERIOD_S * 125, 2)).toBeCloseTo(CENTER_Y + BOB_AMPLITUDE);
  });

  it('judges the eye boundaries, metal, and misses', () => {
    expect(judge(CENTER_Y, CENTER_Y, 56)).toBe('through');
    expect(judge(CENTER_Y + 25, CENTER_Y, 56)).toBe('through');
    expect(judge(CENTER_Y - 25, CENTER_Y, 56)).toBe('through');
    expect(judge(CENTER_Y + 26, CENTER_Y, 56)).toBe('hit');
    expect(judge(CENTER_Y - 26, CENTER_Y, 56)).toBe('hit');
    expect(judge(CENTER_Y + POINT_BOTTOM, CENTER_Y, 24)).toBe('hit');
    expect(judge(CENTER_Y + HEAD_TOP - 1, CENTER_Y, 24)).toBe('miss');
    expect(judge(CENTER_Y + POINT_BOTTOM + 1, CENTER_Y, 24)).toBe('miss');
  });

  it('moves from the starting point to the needle face faster with speed', () => {
    expect(threadTipX(0, 1)).toBe(THREAD_START_X);
    expect(threadTipX(travelTimeMs(1) * 2, 1)).toBe(NEEDLE_X - NEEDLE_WIDTH / 2);
    expect(travelTimeMs(2)).toBeCloseTo(travelTimeMs(1) / 2);
  });
});

describe(manifest.id, () => {
  it('loses when the thread is never shot', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'timeout' });
  });

  it('can be threaded at every level and speed, including the settle animation', async () => {
    for (const level of [1, 2, 3] as const) {
      for (const speed of [1, 2.5]) {
        let won = false;
        for (let frame = 1; frame <= 100 && !won; frame++) {
          const result = await runEntry(entry, {
            level,
            speed,
            script: (f, input) => f === frame && input.tap('action'),
          });
          won = result.kind === 'win' && result.via === 'game';
        }
        expect(won, `level ${level}, speed ${speed}`).toBe(true);
      }
    }
  });

  it('judges a shot still travelling on the final tick', async () => {
    const host = createFakeHost({ frameMs: 50 });
    try {
      const result = await runEntry(entry, {
        host,
        script: (frame, input) => frame === 78 && input.tap('action'),
      });
      expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    } finally {
      host.dispose();
    }
  });

  it('extends the thread during the win settle phase', async () => {
    const host = createFakeHost({ frameMs: 50 });
    const curves: number[][] = [];
    const getContext = HTMLCanvasElement.prototype.getContext;
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, ...args) {
      const context = getContext.apply(this, args) as CanvasRenderingContext2D;
      context.quadraticCurveTo = (...points) => { curves.push(points); };
      return context;
    } as typeof HTMLCanvasElement.prototype.getContext);
    try {
      const result = await runEntry(entry, {
        host,
        script: (frame, input) => frame === 10 && input.tap('action'),
      });
      expect(result).toMatchObject({ kind: 'win', via: 'game' });
      const tail = curves.filter((points) => points[0]! > NEEDLE_X);
      expect(tail.length).toBeGreaterThan(1);
      expect(tail.at(-1)![2]).toBeGreaterThan(tail[0]![2]!);
      expect(tail.at(-1)![3]).toBeGreaterThan(tail[0]![3]!);
    } finally {
      spy.mockRestore();
      host.dispose();
    }
  });

  it('can lose from a mistimed shot at level 3', async () => {
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
