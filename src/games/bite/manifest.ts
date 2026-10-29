import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'bite',
  title: 'Bite!',
  verb: 'HOOK IT!',
  description: 'Reel in only when the bobber truly plunges. Fake nibbles empty your hook.',
  controls: ['action'],
  controlHint: 'Space/Click (Hook)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
