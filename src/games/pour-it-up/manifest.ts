import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'pour-it-up',
  title: 'Pour It Up',
  verb: 'FILL IT!',
  description: 'Pour a drink up to the dashed line without spilling.',
  controls: ['action'],
  controlHint: 'Hold Space/Click (Pour)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
