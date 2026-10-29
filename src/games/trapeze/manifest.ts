import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'trapeze',
  title: 'Trapeze',
  verb: 'LET GO!',
  description: 'An acrobat swings on a trapeze toward a partner. Press to let go and fly into their hands.',
  controls: ['action'],
  controlHint: 'Space/Click (Release)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
