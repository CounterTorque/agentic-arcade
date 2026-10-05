import type { GameContext, GameInstance, InputAction, LifecyclePhase, MicroGame, RoundResult } from '@arcade/sdk';
import { validateManifest } from '../../src/framework/manifest-schema';
import type { RegistryEntry } from '../../src/framework/registry';
import { computeTimeLimit } from '../../src/framework/runtime/difficulty';
import { createFakeHost, createRng, runEntry, type FrameScript } from './fake-host';

export interface ContractFailure {
  check: 'manifest' | 'module' | 'preload' | 'create' | 'idle' | 'fuzz' | 'determinism' | 'hygiene' | 'teardown';
  message: string;
}
export interface ContractReport {
  id: string;
  ok: boolean;
  failures: ContractFailure[];
}

const ACTIONS: InputAction[] = ['action', 'up', 'down', 'left', 'right'];
const FRAME_MS = 1000 / 60;

export function fuzzScript(seed: number): FrameScript {
  const rng = createRng(seed * 7919 + 13);
  return (_i, input) => {
    for (const a of ACTIONS) {
      const roll = rng.next();
      if (roll < 0.08) input.tap(a);
      else if (roll < 0.13) input.press(a);
      else if (roll < 0.18) input.release(a);
    }
    if (rng.chance(0.3)) input.setPointer(rng.range(-20, 980), rng.range(-20, 740), rng.chance(0.2));
  };
}

const describeResult = (r: RoundResult) =>
  r.kind === 'error' ? `error in ${r.phase}: ${String((r.error as Error)?.message ?? r.error)}` : `${r.kind} via ${r.via}`;

const comparable = (r: RoundResult) => (r.kind === 'error' ? { ...r, error: String(r.error) } : r);

type Counter = { name: string; count: number };

function installSpies(): { counters: Counter[]; restore(): void } {
  const counters: Counter[] = [];
  const restores: (() => void)[] = [];
  const wrap = (obj: Record<string, unknown>, key: string, name: string) => {
    const original = obj[key] as (...a: unknown[]) => unknown;
    const counter = { name, count: 0 };
    counters.push(counter);
    obj[key] = function (this: unknown, ...args: unknown[]) {
      counter.count++;
      return original.apply(this, args);
    };
    restores.push(() => {
      obj[key] = original;
    });
  };
  wrap(window as never, 'addEventListener', 'window.addEventListener');
  wrap(document as never, 'addEventListener', 'document.addEventListener');
  wrap(globalThis as never, 'requestAnimationFrame', 'requestAnimationFrame');
  wrap(globalThis as never, 'setTimeout', 'setTimeout');
  wrap(globalThis as never, 'setInterval', 'setInterval');
  wrap(Math as never, 'random', 'Math.random');
  wrap(Date as never, 'now', 'Date.now');
  wrap(performance as never, 'now', 'performance.now');
  return { counters, restore: () => restores.reverse().forEach((r) => r()) };
}

export async function checkGame(entry: RegistryEntry): Promise<ContractReport> {
  const failures: ContractFailure[] = [];
  const fail = (check: ContractFailure['check'], message: string) => failures.push({ check, message });
  const guard = async (check: ContractFailure['check'], fn: () => Promise<void> | void) => {
    try {
      await fn();
    } catch (e) {
      fail(check, `threw: ${String((e as Error)?.message ?? e)}`);
    }
  };

  await guard('manifest', () => {
    for (const e of validateManifest(entry.manifest, entry.id)) fail('manifest', e);
  });

  let game: MicroGame<unknown> | undefined;
  await guard('module', async () => {
    game = await entry.load();
    if (game?.contractVersion !== 1) fail('module', 'default export must have contractVersion 1');
    if (typeof game?.create !== 'function') fail('module', 'default export must have a create function');
  });
  if (!game || typeof game.create !== 'function') return { id: entry.id, ok: false, failures };

  await guard('preload', async () => {
    if (!game!.preload) return;
    const ac = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, rej) => {
      timer = setTimeout(() => rej(new Error('preload exceeded 3000 ms')), 3000);
    });
    try {
      await Promise.race([
        game!.preload!({
          loadImage: () => Promise.resolve(new Image()),
          difficulty: { speed: 1, level: 1, round: 0 },
          rng: createRng(1),
          signal: ac.signal,
        }),
        timeout,
      ]);
    } finally {
      clearTimeout(timer!);
      ac.abort();
    }
  });

  const captured: { ctx?: GameContext; instance?: GameInstance; children?: number; sync?: boolean } = {};
  const wrapped: RegistryEntry = {
    ...entry,
    load: async () => ({
      ...game!,
      create(ctx, assets) {
        const instance = game!.create(ctx, assets);
        captured.ctx = ctx;
        captured.instance = instance;
        captured.sync = !(instance && typeof (instance as unknown as PromiseLike<unknown>).then === 'function');
        captured.children = ctx.root.childNodes.length;
        return instance;
      },
    }),
  };

  await guard('idle', async () => {
    for (let seed = 1; seed <= 5; seed++) {
      captured.ctx = undefined;
      const r = await runEntry(wrapped, { seed });
      if (r.kind === 'error') fail('idle', `seed ${seed}: ${describeResult(r)}`);
      else {
        const limit = computeTimeLimit(entry.manifest, { speed: 1 });
        if (r.elapsedMs > limit + 2 * FRAME_MS) fail('idle', `seed ${seed}: resolved after ${r.elapsedMs} ms (limit ${limit})`);
      }
      if (seed === 1 && captured.ctx) {
        if (!captured.sync) fail('create', 'create must be synchronous');
        if (typeof captured.instance?.tick !== 'function') fail('create', 'create must return an instance with tick()');
        if (!captured.children) fail('create', 'create must leave at least one child in root');
      }
    }
  });

  await guard('fuzz', async () => {
    for (const speed of [1, 2.5]) {
      for (const level of [1, 3] as const) {
        for (let seed = 1; seed <= 10; seed++) {
          const r = await runEntry(wrapped, { seed, speed, level, script: fuzzScript(seed) });
          if (r.kind === 'error') fail('fuzz', `seed ${seed} speed ${speed} level ${level}: ${describeResult(r)}`);
        }
      }
    }
  });

  await guard('determinism', async () => {
    const play = async (seed: number) => {
      let snapshot: string | null = null;
      let canvas = false;
      const script = fuzzScript(seed);
      const result = await runEntry(wrapped, {
        seed,
        speed: 1.5,
        level: 2,
        script: (i, input, root) => {
          script(i, input, root);
          if (i === 30) {
            canvas = root.querySelector('canvas') !== null;
            snapshot = root.innerHTML;
          }
        },
      });
      return { result: comparable(result), snapshot: canvas ? null : snapshot };
    };
    for (const seed of [1, 2, 3]) {
      const a = await play(seed);
      const b = await play(seed);
      if (JSON.stringify(a.result) !== JSON.stringify(b.result)) fail('determinism', `seed ${seed}: results differ between identical runs`);
      else if (a.snapshot !== b.snapshot) fail('determinism', `seed ${seed}: DOM differs after 30 frames`);
    }
  });

  await guard('hygiene', async () => {
    const host = createFakeHost();
    let spies: ReturnType<typeof installSpies> | undefined;
    let counters: Counter[] | undefined;
    try {
      const r = await runEntry(wrapped, {
        seed: 1,
        host,
        script: fuzzScript(1),
        onPhase: (p: LifecyclePhase) => {
          if (p === 'create' && !spies) spies = installSpies();
        },
      });
      counters = spies?.counters ?? [];
      spies?.restore();
      spies = undefined;
      if (r.kind === 'error') fail('hygiene', describeResult(r));
    } finally {
      spies?.restore();
      host.dispose();
    }
    for (const c of counters ?? []) if (c.count > 0) fail('hygiene', `${c.name} called ${c.count} time(s)`);
  });

  await guard('teardown', async () => {
    const host = createFakeHost();
    try {
      captured.ctx = undefined;
      await runEntry(wrapped, { seed: 1, host });
      const aborted = () => captured.ctx?.signal.aborted;
      if (host.root.childNodes.length) fail('teardown', 'root is not empty after teardown');
      if (!aborted()) fail('teardown', 'ctx.signal was not aborted after teardown');
    } finally {
      host.dispose();
    }
  });

  return { id: entry.id, ok: failures.length === 0, failures };
}
