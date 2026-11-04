import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'bubble-wrap',
  title: 'Bubble Wrap',
  verb: 'POP EM!',
  description: 'Pop every bubble before the sheet drifts away!',
  controls: ['pointer'],
  controlHint: 'Click (Pop)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'reflex'],
});
