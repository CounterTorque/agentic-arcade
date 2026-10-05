import {
  STAGE_HEIGHT,
  STAGE_WIDTH,
  type Difficulty,
  type GameContext,
  type GameInstance,
  type LifecyclePhase,
  type Outcome,
  type PreloadContext,
  type RoundResult,
  type Stage,
} from '@arcade/sdk';
import { createCanvas } from '../../sdk/canvas';
import type { RegistryEntry } from '../registry';
import type { Clock } from './clock';
import { computeTimeLimit } from './difficulty';
import type { InputController } from './input';
import { createRng } from './rng';

export const INTRO_MS = 700;
export const SETTLE_MS = 800;
export const PRELOAD_TIMEOUT_MS = 3000;

export interface RunRoundOptions {
  entry: RegistryEntry;
  root: HTMLDivElement;
  difficulty: Difficulty;
  seed: number;
  clock: Clock;
  input: InputController;
  intro?: (verb: string) => Promise<void>;
  stageScale?: () => number;
  reducedMotion?: boolean;
  loadImage?: (url: string, signal: AbortSignal) => Promise<HTMLImageElement>;
  onPhase?: (p: LifecyclePhase) => void;
  settleMs?: number;
  preloadTimeoutMs?: number;
}

export function defaultLoadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'));
    const img = new Image();
    signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
    img.onerror = () => reject(new Error(`failed to load image: ${url}`));
    img.src = url;
    img.decode().then(() => resolve(img), reject);
  });
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer));
}

export async function runRound(o: RunRoundOptions): Promise<RoundResult> {
  const { entry, root } = o;
  const abort = new AbortController();
  const timeLimitMs = computeTimeLimit(entry.manifest, o.difficulty);
  const settleMs = o.settleMs ?? SETTLE_MS;
  const scale = o.stageScale ?? (() => 1);
  const canvases: { resize(): void }[] = [];
  let phase: LifecyclePhase = 'load';
  let resolved: { outcome: Outcome; via: 'game' | 'timeout' } | null = null;
  let instance: GameInstance | undefined;
  let destroying = false;
  let elapsed = 0;
  const enter = (p: LifecyclePhase) => {
    phase = p;
    o.onPhase?.(p);
  };

  root.dataset.game = entry.id;
  try {
    o.onPhase?.('load');
    const game = await entry.load();
    const rng = createRng(o.seed);
    enter('preload');
    let assets: unknown;
    if (game.preload) {
      const loadImage = o.loadImage ?? defaultLoadImage;
      const pctx: PreloadContext = {
        loadImage: (url) => loadImage(url, abort.signal),
        difficulty: o.difficulty,
        rng,
        signal: abort.signal,
      };
      assets = await withTimeout(game.preload(pctx), o.preloadTimeoutMs ?? PRELOAD_TIMEOUT_MS, 'preload');
    }

    enter('create');
    const stage: Stage = {
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      get scale() {
        return scale();
      },
    };
    const ctx: GameContext = {
      root,
      stage,
      difficulty: o.difficulty,
      timeLimitMs,
      input: o.input.api,
      rng,
      signal: abort.signal,
      resolve(outcome) {
        if (!resolved && phase === 'play') resolved = { outcome, via: 'game' };
      },
      get resolved() {
        return resolved?.outcome ?? null;
      },
      createCanvas(opts) {
        const handle = createCanvas(root, () => stage, opts);
        canvases.push(handle);
        return handle;
      },
      reducedMotion: o.reducedMotion ?? false,
    };
    instance = game.create(ctx, assets);
    await o.intro?.(entry.manifest.verb);

    enter('start');
    o.input.reset();
    instance.start?.();

    enter('play');
    let lastScale = scale();
    await o.clock.run((dt) => {
      elapsed += dt;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      if (scale() !== lastScale) {
        lastScale = scale();
        for (const c of canvases) c.resize();
      }
      instance!.tick({ dt, elapsed, remaining, phase: 'play' });
      o.input.endFrame();
      if (!resolved && remaining === 0) resolved = { outcome: entry.manifest.outcomeOnTimeout, via: 'timeout' };
      return !resolved;
    });

    const final = resolved as { outcome: Outcome; via: 'game' | 'timeout' } | null;
    if (!final) throw new Error('clock stopped before the round resolved');
    enter('end');
    instance.end?.(final.outcome, final.via);

    enter('settle');
    let settle = 0;
    await o.clock.run((dt) => {
      settle += dt;
      instance!.tick({ dt, elapsed, remaining: 0, phase: 'settle' });
      o.input.endFrame();
      return settle < settleMs;
    });

    enter('destroy');
    destroying = true;
    instance.destroy?.();
    return { kind: final.outcome, via: final.via, elapsedMs: elapsed, gameId: entry.id };
  } catch (error) {
    if (instance && !destroying) {
      try {
        instance.destroy?.();
      } catch {
        /* already failing */
      }
    }
    return { kind: 'error', phase, error, elapsedMs: elapsed, gameId: entry.id };
  } finally {
    abort.abort();
    root.replaceChildren();
  }
}
