import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'thread-the-needle',
  title: 'Thread the Needle',
  verb: 'THREAD!',
  description: 'Shoot the thread into the eye of the bobbing needle.',
  controls: ['action'],
  controlHint: 'Space/Click (Shoot)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
