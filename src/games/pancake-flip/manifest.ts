import { defineManifest } from '@arcade/sdk';

export const manifest = defineManifest({
  contractVersion: 1,
  id: 'pancake-flip',
  title: 'Pancake Flip',
  verb: 'FLIP!',
  description: 'Flip a golden pancake and catch it in the pan.',
  controls: ['action', 'directions'],
  controlHint: 'Space (Flip), Left/Right (Catch)',
  baseDurationMs: 6000,
  outcomeOnTimeout: 'lose',
  tags: ['timing', 'cooking'],
});
