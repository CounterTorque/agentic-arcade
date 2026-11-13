import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'lights-out',
  title: 'Lights Out',
  verb: 'LIGHTS OUT!',
  description: 'Switch off every apartment window and keep the building dark until bedtime.',
  controls: ['pointer'],
  controlHint: 'Click (Switch off)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'reflex'],
});
