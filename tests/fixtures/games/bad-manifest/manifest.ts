import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'other-id',
  title: 'Bad Manifest',
  verb: 'GO!',
  description: 'Fixture game: bad-manifest.',
  author: 'tests',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
