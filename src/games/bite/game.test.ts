import { describe, expect, it } from 'vitest';
import { makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

describe(manifest.id, () => {
  it('wins when the action is pressed', async () => {
    const result = await runEntry(entry, { script: (frame, input) => frame === 5 && input.tap('action') });
    expect(result).toMatchObject({ kind: 'win', via: 'game' });
  });

  it('loses when idle', async () => {
    const result = await runEntry(entry);
    expect(result).toMatchObject({ kind: 'lose', via: 'timeout' });
  });
});
