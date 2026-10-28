import { describe, expect, it } from 'vitest';
import { browningProgress, judge, levelParams, stripColor } from './logic';

describe('levelParams', () => {
  it('lists the spec values per level', () => {
    expect(levelParams(1)).toEqual({ browningMs: 3000, goldWidth: 0.2 });
    expect(levelParams(2)).toEqual({ browningMs: 2200, goldWidth: 0.15 });
    expect(levelParams(3)).toEqual({ browningMs: 1500, goldWidth: 0.1 });
  });
});

describe('browningProgress', () => {
  it('runs from 0 to 1 over the browning time', () => {
    expect(browningProgress(0, 3000, 1)).toBe(0);
    expect(browningProgress(1500, 3000, 1)).toBeCloseTo(0.5);
    expect(browningProgress(3000, 3000, 1)).toBe(1);
  });

  it('speeds up with speed and clamps at 1', () => {
    expect(browningProgress(750, 3000, 2)).toBeCloseTo(0.5);
    expect(browningProgress(9000, 3000, 1)).toBe(1);
  });
});

describe('judge', () => {
  it('is pale below the gold band, gold inside it and burnt above it', () => {
    expect(judge(0, 0.2)).toBe('pale');
    expect(judge(0.39, 0.2)).toBe('pale');
    expect(judge(0.4, 0.2)).toBe('gold');
    expect(judge(0.5, 0.2)).toBe('gold');
    expect(judge(0.6, 0.2)).toBe('gold');
    expect(judge(0.61, 0.2)).toBe('burnt');
    expect(judge(1, 0.2)).toBe('burnt');
  });

  it('narrows the band with the gold width', () => {
    expect(judge(0.42, 0.2)).toBe('gold');
    expect(judge(0.42, 0.1)).toBe('pale');
  });
});

describe('stripColor', () => {
  it('runs white, gold, black', () => {
    expect(stripColor(0)).toBe('rgb(255, 247, 237)');
    expect(stripColor(0.5)).toBe('rgb(217, 119, 6)');
    expect(stripColor(1)).toBe('rgb(17, 24, 39)');
  });

  it('clamps out-of-range input', () => {
    expect(stripColor(-1)).toBe(stripColor(0));
    expect(stripColor(2)).toBe(stripColor(1));
  });
});
