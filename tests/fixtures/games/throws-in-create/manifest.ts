import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'throws-in-create',
  title: 'Throws In Create',
  verb: 'GO!',
  description: 'Fixture game: throws-in-create.',
  controlHint: 'Space (Go)',
  controls: ['action'],
  baseDurationMs: 3000,
  outcomeOnTimeout: 'win',
});
