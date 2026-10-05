import type { Difficulty, GameManifest, LifecyclePhase, MicroGame, RoundResult } from '@arcade/sdk';
import type { RegistryEntry } from '../../src/framework/registry';
import { ManualClock, type Clock } from '../../src/framework/runtime/clock';
import { InputController } from '../../src/framework/runtime/input';
import { runRound, type RunRoundOptions } from '../../src/framework/runtime/round-runner';

export { createRng } from '../../src/framework/runtime/rng';

export interface FakeHost {
  root: HTMLDivElement;
  clock: ManualClock;
  input: InputController;
  loadImage: () => Promise<HTMLImageElement>;
  dispose(): void;
}

export function createFakeHost(opts: { frameMs?: number } = {}): FakeHost {
  const root = document.createElement('div');
  document.body.appendChild(root);
  return {
    root,
    clock: new ManualClock(opts.frameMs),
    input: new InputController(),
    loadImage: () => Promise.resolve(new Image()),
    dispose: () => root.remove(),
  };
}

export type FrameScript = (frameIndex: number, input: InputController, root: HTMLDivElement) => void;

export interface RunEntryOptions {
  seed?: number;
  speed?: number;
  level?: 1 | 2 | 3;
  round?: number;
  script?: FrameScript;
  host?: FakeHost;
  onPhase?: (p: LifecyclePhase) => void;
  preloadTimeoutMs?: number;
  settleMs?: number;
  intro?: RunRoundOptions['intro'];
}

export async function runEntry(entry: RegistryEntry, o: RunEntryOptions = {}): Promise<RoundResult> {
  const host = o.host ?? createFakeHost();
  const difficulty: Difficulty = { speed: o.speed ?? 1, level: o.level ?? 1, round: o.round ?? 0 };
  let frame = 0;
  const clock: Clock = {
    run: (step) =>
      host.clock.run((dt) => {
        o.script?.(frame++, host.input, host.root);
        return step(dt);
      }),
  };
  try {
    return await runRound({
      entry,
      root: host.root,
      difficulty,
      seed: o.seed ?? 1,
      clock,
      input: host.input,
      loadImage: host.loadImage,
      onPhase: o.onPhase,
      preloadTimeoutMs: o.preloadTimeoutMs,
      settleMs: o.settleMs,
      intro: o.intro,
    });
  } finally {
    if (!o.host) host.dispose();
  }
}

export function makeGameEntry<A>(manifest: GameManifest, game: MicroGame<A>): RegistryEntry {
  return { id: manifest.id, manifest, load: async () => game as MicroGame<unknown> };
}
