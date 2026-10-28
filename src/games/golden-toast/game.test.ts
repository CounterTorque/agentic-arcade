import { describe, expect, it } from 'vitest';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

// The fake host ticks every 1000 / 60 ms, so a tap on frame f lands at (f + 1) * 16.67 ms of play time.
describe(manifest.id, () => {
  it('wins when popped inside the gold zone', async () => {
    // Level 1, speed 1: browning takes 3000 ms and gold is 1200-1800 ms; frame 89 is 1500 ms.
    const result = await runEntry(entry, { script: (frame, input) => frame === 89 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it('wins at the narrowest gold zone', async () => {
    // Level 3, speed 2.5: browning takes 600 ms and gold is 270-330 ms; frame 17 is 300 ms.
    const result = await runEntry(entry, {
      level: 3,
      speed: 2.5,
      script: (frame, input) => frame === 17 && input.tap('action'),
    });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it('loses when popped too early (pale)', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 5 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when popped too late (burnt)', async () => {
    // Frame 149 is 2500 ms, well past the gold zone.
    const result = await runEntry(entry, { script: (frame, input) => frame === 149 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when never popped, because the toast burns', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });
});
