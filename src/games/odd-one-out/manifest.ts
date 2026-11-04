import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'odd-one-out',
  title: 'Odd One Out',
  verb: 'FIND IT!',
  description: 'Find the one face that stands out from the crowd.',
  controls: ['pointer'],
  controlHint: 'Click (Pick odd one)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'observation'],
});
