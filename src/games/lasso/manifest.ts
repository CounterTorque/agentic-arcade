import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'lasso',
  title: 'Lasso',
  verb: 'ROPE IT!',
  description: 'Lead the running calf and land your lasso around it!',
  controls: ['pointer'],
  controlHint: 'Click (Throw)',
  baseDurationMs: 4000,
  outcomeOnTimeout: 'lose',
  tags: ['aim', 'pointer'],
});
