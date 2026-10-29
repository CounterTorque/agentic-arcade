import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'grand-opening',
  title: 'Grand Opening',
  verb: 'SNIP!',
  description: 'Cut the ribbon at the red mark as posts slide left and right. Time your snip perfectly!',
  controls: ['action'],
  controlHint: 'Space/Click (Snip)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
