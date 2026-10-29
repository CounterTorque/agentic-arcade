import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'trapeze',
  title: 'Trapeze',
  verb: 'LET GO!',
  description: 'Press the action key before time runs out.',
  controls: ['action'],
  controlHint: 'Space/Click (Release)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
