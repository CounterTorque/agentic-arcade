import { describe, expect, it } from 'vitest';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { createSchedule, levelParams, windowRealMs } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);
const frameAt = (ms: number) => Math.ceil(ms / (1000 / 60)) - 1;

describe(manifest.id, () => {
  it.each([{ level: 1, speed: 1 }, { level: 3, speed: 2.5 }] as const)(
    'wins during the real bite at level $level and speed $speed',
    async ({ level, speed }) => {
      const schedule = createSchedule(level, createRng(1));
      const frame = frameAt(schedule.biteAt / speed + 30);
      const result = await runEntry(entry, { level, speed, script: (f, input) => f === frame && input.tap('action') });
      expect(result).toMatchObject({ kind: 'win', via: 'game' });
    },
  );

  it('loses on a fake twitch', async () => {
    const twitch = createSchedule(1, createRng(1)).twitches[0]!;
    const frame = frameAt(twitch.at + twitch.dur / 2);
    const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when pressed early', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 5 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses before a late press can hook the fish', async () => {
    const schedule = createSchedule(3, createRng(1));
    const deadline = schedule.biteAt / 2.5 + windowRealMs(levelParams(3).windowMs, 2.5);
    const frame = frameAt(deadline + 50);
    const result = await runEntry(entry, { level: 3, speed: 2.5, script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
    expect(result.elapsedMs).toBeLessThanOrEqual(deadline + 20);
  });

  it('loses when idle after the bite window', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });
});
