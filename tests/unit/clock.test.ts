import { describe, expect, it } from 'vitest';
import { ManualClock, RafClock } from '../../src/framework/runtime/clock';

describe('ManualClock', () => {
  it('stops between frames when aborted', async () => {
    const ac = new AbortController();
    const clock = new ManualClock();
    let n = 0;
    await clock.run(() => {
      if (++n === 3) ac.abort();
      return true;
    }, ac.signal);
    expect(n).toBe(3);
    await clock.run(() => (n++, true), ac.signal);
    expect(n).toBe(3);
  });
});

describe('RafClock', () => {
  it('runs until the step returns false', async () => {
    const clock = new RafClock();
    const dts: number[] = [];
    await clock.run((dt) => (dts.push(dt), dts.length < 3));
    expect(dts).toHaveLength(3);
    expect(dts[0]).toBeCloseTo(1000 / 60);
    expect(dts.every((d) => d > 0 && d <= 50)).toBe(true);
    clock.dispose();
  });

  it('resolves when aborted and stops stepping', async () => {
    const clock = new RafClock();
    const ac = new AbortController();
    let n = 0;
    const run = clock.run(() => (n++, true), ac.signal);
    await new Promise((r) => setTimeout(r, 40));
    ac.abort();
    await run;
    const frozen = n;
    await new Promise((r) => setTimeout(r, 40));
    expect(n).toBe(frozen);
    clock.dispose();
  });

  it('does not step while paused and resumes', async () => {
    const clock = new RafClock();
    let n = 0;
    const run = clock.run(() => ++n < 1000);
    await new Promise((r) => setTimeout(r, 30));
    clock.pause();
    await new Promise((r) => setTimeout(r, 30));
    const paused = n;
    await new Promise((r) => setTimeout(r, 50));
    expect(n).toBe(paused);
    clock.resume();
    await new Promise((r) => setTimeout(r, 50));
    expect(n).toBeGreaterThan(paused);
    clock.dispose();
    await run;
  });
});
