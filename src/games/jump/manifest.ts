import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'jump',
  title: 'Jump',
  verb: 'JUMP!',
  description: 'A car is coming. Jump over it at the right moment.',
  controls: ['action'],
  controlHint: 'Space/Click (Jump)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'win',
  tags: ['timing', 'reflex'],
});
