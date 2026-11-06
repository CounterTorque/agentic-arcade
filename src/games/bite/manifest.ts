import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'bite',
  title: 'Bite!',
  verb: 'HOOK IT!',
  description: 'Wait for the bobber to plunge, then hook the fish! Beware of fake bites.',
  controls: ['action'],
  controlHint: 'Space/Click (Hook)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex', 'timing'],
});
