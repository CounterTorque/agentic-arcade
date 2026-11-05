import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'say-cheese',
  title: 'Say Cheese',
  verb: 'SNAP!',
  description: 'Drag the viewfinder around all three friends, then click to snap a photo!',
  controls: ['pointer'],
  controlHint: 'Drag (Frame), Click (Snap)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'pointer'],
});
