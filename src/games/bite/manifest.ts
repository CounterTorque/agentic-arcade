import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'bite',
  title: 'Bite!',
  verb: 'HOOK IT!',
  description: 'Press the action key before time runs out.',
  controls: ['action'],
  controlHint: 'Space/Click (Hook)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
