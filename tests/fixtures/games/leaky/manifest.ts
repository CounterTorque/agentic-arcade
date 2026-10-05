import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'leaky',
  title: 'Leaky',
  verb: 'GO!',
  description: 'Fixture game: leaky.',
  controlHint: 'Space (Go)',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
