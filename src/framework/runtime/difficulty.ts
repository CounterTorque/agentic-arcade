import type { Difficulty, GameManifest } from '@arcade/sdk';

export function difficultyForRound(round: number): Difficulty {
  return {
    speed: Math.min(2.5, 1 + 0.25 * Math.floor(round / 5)),
    level: round < 10 ? 1 : round < 20 ? 2 : 3,
    round,
  };
}

export const computeTimeLimit = (manifest: Pick<GameManifest, 'baseDurationMs'>, d: Pick<Difficulty, 'speed'>): number =>
  Math.max(2000, Math.round(manifest.baseDurationMs / d.speed));
