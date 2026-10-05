import type { RoundResult } from '@arcade/sdk';
import { createSaveStore, type SaveV1 } from '../framework/storage';

export const save = createSaveStore();

export function reducedMotionEnabled(): boolean {
  const setting = save.data.settings.reducedMotion;
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function countRound(draft: SaveV1, result: RoundResult): void {
  const stats = (draft.perGame[result.gameId] ??= { plays: 0, wins: 0, errors: 0 });
  stats.plays++;
  if (result.kind === 'win') stats.wins++;
  if (result.kind === 'error') stats.errors++;
}
