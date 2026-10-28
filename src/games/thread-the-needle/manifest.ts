import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'thread-the-needle',
  title: 'Thread the Needle',
  verb: 'THREAD!',
  description: 'Drop the thread so it slides through the eye of the swaying needle.',
  controls: ['action'],
  controlHint: 'Space/Click (Drop)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
