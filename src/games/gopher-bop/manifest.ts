import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'gopher-bop',
  title: 'Gopher Bop',
  verb: 'BOP!',
  description: 'Bop the gophers as they pop up, but leave the rabbits alone!',
  controls: ['pointer'],
  controlHint: 'Click (Bop)',
  baseDurationMs: 5000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'reflex'],
});
