import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'grand-opening',
  title: 'Grand Opening',
  verb: 'SNIP!',
  description: 'Snip the ribbon the moment its red mark slides under the giant scissors.',
  controls: ['action'],
  controlHint: 'Space/Click (Snip)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
