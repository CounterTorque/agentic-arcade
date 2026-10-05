import type { Difficulty, RoundResult } from '@arcade/sdk';
import { publishDebug } from '../framework/debug';
import type { RegistryEntry } from '../framework/registry';
import { RafClock } from '../framework/runtime/clock';
import { computeTimeLimit } from '../framework/runtime/difficulty';
import { InputController } from '../framework/runtime/input';
import { INTRO_MS, runRound } from '../framework/runtime/round-runner';
import { reducedMotionEnabled } from './save';
import { isAbort, sleep } from './util';

export interface StageHandle {
  getRoot(): HTMLDivElement;
  getScale(): number;
}

export interface RoundUi {
  stage: StageHandle;
  setIntro(verb: string | null): void;
  setPaused(paused: boolean): void;
  setTimer(fraction: number): void;
}

export interface PlayRoundOptions {
  entry: RegistryEntry;
  difficulty: Difficulty;
  seed: number;
  signal: AbortSignal;
  ui: RoundUi;
}

/** Resolves with the result, or null when the round was cancelled. */
export async function playRound({ entry, difficulty, seed, signal, ui }: PlayRoundOptions): Promise<RoundResult | null> {
  const clock = new RafClock();
  clock.onPausedChange = ui.setPaused;
  const input = new InputController();
  const timeLimit = computeTimeLimit(entry.manifest, difficulty);
  const detach = input.attach(window, ui.stage.getRoot(), ui.stage.getScale);
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.repeat) return;
    if (clock.paused) clock.resume();
    else clock.pause();
  };
  window.addEventListener('keydown', onKey);
  try {
    const result = await runRound({
      entry,
      root: ui.stage.getRoot(),
      difficulty,
      seed,
      clock,
      input,
      signal,
      stageScale: ui.stage.getScale,
      reducedMotion: reducedMotionEnabled(),
      onPhase: (phase) => publishDebug({ phase }),
      onFrame: (frame) => {
        if (frame.phase === 'play') ui.setTimer(frame.remaining / timeLimit);
      },
      intro: async (verb, s) => {
        ui.setIntro(verb);
        try {
          await sleep(INTRO_MS, s);
        } finally {
          ui.setIntro(null);
        }
      },
    });
    publishDebug({ lastRound: result, rounds: (window.__ARCADE__?.rounds ?? 0) + 1 });
    return result;
  } catch (e) {
    if (isAbort(e)) return null;
    throw e;
  } finally {
    window.removeEventListener('keydown', onKey);
    detach();
    clock.dispose();
    ui.setIntro(null);
    ui.setPaused(false);
    publishDebug({ phase: 'idle' });
  }
}
