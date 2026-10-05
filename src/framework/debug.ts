import { CONTRACT_VERSION, type LifecyclePhase, type RoundResult } from '@arcade/sdk';

export interface ArcadeDebug {
  readonly contractVersion: typeof CONTRACT_VERSION;
  readonly games: readonly string[];
  readonly phase: LifecyclePhase | 'idle';
  readonly lastRound: RoundResult | null;
  readonly rounds: number;
}

declare global {
  interface Window {
    __ARCADE__?: ArcadeDebug;
  }
}

export function publishDebug(patch: Partial<Omit<ArcadeDebug, 'contractVersion'>>): ArcadeDebug {
  const prev: ArcadeDebug = window.__ARCADE__ ?? {
    contractVersion: CONTRACT_VERSION,
    games: [],
    phase: 'idle',
    lastRound: null,
    rounds: 0,
  };
  const next = Object.freeze({ ...prev, ...patch });
  Object.defineProperty(window, '__ARCADE__', { value: next, configurable: true, enumerable: true, writable: false });
  return next;
}
