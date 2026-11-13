import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'crane-stack',
  title: 'Crane Stack',
  verb: 'STACK THREE!',
  description: 'Drop three swinging crates onto the stack without toppling it.',
  controls: ['action'],
  controlHint: 'Space/Click (Drop)',
  baseDurationMs: 8000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
