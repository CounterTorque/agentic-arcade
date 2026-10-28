import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'golden-toast',
  title: 'Golden Toast',
  verb: 'POP!',
  description: 'Press the action key before time runs out.',
  controls: ['action'],
  controlHint: 'Space/Click (Pop)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
