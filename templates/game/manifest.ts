import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: '__ID__',
  title: '__TITLE__',
  verb: '__VERB__',
  description: 'Press the action key before time runs out.',
  controls: ['action'],
  controlHint: '__CONTROL_HINT__',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['reflex'],
});
