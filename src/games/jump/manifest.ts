import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'jump',
  title: 'Jump',
  verb: 'JUMP!',
  description: 'A car is coming. Jump over it at the right moment.',
  author: 'reference',
  controls: ['action'],
  baseDurationMs: 5000,
  outcomeOnTimeout: 'win',
  tags: ['timing', 'reflex'],
});
