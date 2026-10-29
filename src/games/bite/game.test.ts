import { describe, expect, it } from 'vitest';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { buildSchedule } from './logic';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

function frameAt(ms: number): number {
  return Math.round(ms / (1000 / 60)) - 1;
}

describe(manifest.id, () => {
  it.each([{ level: 1 as const, speed: 1 }, { level: 2 as const, speed: 1 }, { level: 3 as const, speed: 2.5 }])(
    'wins inside the bite window at level $level, speed $speed',
    async ({ level, speed }) => {
      const schedule = buildSchedule(createRng(1), level);
      const frame = frameAt((schedule.biteStartMs + schedule.windowMs / 2) / speed);
      const result = await runEntry(entry, { level, speed, script: (f, input) => f === frame && input.tap('action') });
      expect(result).toMatchObject({ kind: 'win', via: 'game' });
    },
  );

  it('loses on an early press', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 5 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when reeling in on a twitch', async () => {
    const twitch = buildSchedule(createRng(1), 1).twitches[0]!;
    const frame = frameAt(twitch.startMs + twitch.durMs / 2);
    const result = await runEntry(entry, { script: (f, input) => f === frame && input.tap('action') });
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });

  it('loses when the bite window passes without a press', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'game' });
  });
});
