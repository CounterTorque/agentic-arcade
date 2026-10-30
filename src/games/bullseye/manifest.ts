import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'bullseye',
  title: 'Bullseye',
  verb: 'FIRE!',
  description: 'Aim through the wind and hit the center of the target.',
  controls: ['pointer'],
  controlHint: 'Click (Fire)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'timing'],
});
