import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'trapeze',
  title: 'Trapeze',
  verb: 'LET GO!',
  description: "Release at the right moment and fly into your partner's hands.",
  controls: ['action'],
  controlHint: 'Space/Click (Release)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['timing'],
});
