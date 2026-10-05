import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'nondeterministic',
  title: 'Nondeterministic',
  verb: 'GO!',
  description: 'Fixture game: nondeterministic.',
  controlHint: 'Space (Go)',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
