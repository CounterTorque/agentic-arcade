import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'safecracker',
  title: 'Safecracker',
  verb: 'CRACK IT!',
  description: 'Time the spinning dial to unlock three tumblers and crack the safe.',
  controls: ['action'],
  controlHint: 'Space/Click (Lock)',
  baseDurationMs: 6000,
  outcomeOnTimeout: 'lose',
  tags: ['timing', 'reflex'],
});
