import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'throws-on-tick',
  title: 'Throws On Tick',
  verb: 'GO!',
  description: 'Fixture game: throws-on-tick.',
  author: 'tests',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
