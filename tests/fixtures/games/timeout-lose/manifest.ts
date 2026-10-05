import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'timeout-lose',
  title: 'Timeout Lose',
  verb: 'GO!',
  description: 'Fixture game: timeout-lose.',
  controlHint: 'Space (Go)',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'lose',
});
