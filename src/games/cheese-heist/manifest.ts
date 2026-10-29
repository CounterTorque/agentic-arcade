import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'cheese-heist',
  title: 'Cheese Heist',
  verb: 'GRAB IT!',
  description: 'Dash for the cheese and get back before the mousetrap snaps!',
  controls: ['action'],
  controlHint: 'Space/Click (Dash/Back)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['timing', 'reflex'],
});
