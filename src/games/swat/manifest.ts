import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'swat',
  title: 'Swat',
  verb: 'SWAT!',
  description: 'Swat the fly before it lands on the cake.',
  controls: ['pointer'],
  controlHint: 'Click (Swat)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'reflex'],
});
