import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'always-win',
  title: 'Always Win',
  verb: 'GO!',
  description: 'Fixture game: always-win.',
  author: 'tests',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
