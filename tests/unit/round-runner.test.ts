import { describe, expect, it } from 'vitest';
import type { GameContext, GameInstance, LifecyclePhase, MicroGame } from '@arcade/sdk';
import { INTRO_MS, SETTLE_MS } from '../../src/framework/runtime/round-runner';
import { createFakeHost, runEntry } from '../helpers/fake-host';
import { fixture, makeEntry } from '../helpers/fixtures';

const game = (create: MicroGame<unknown>['create'], extra: Partial<MicroGame<unknown>> = {}): MicroGame<unknown> => ({
  contractVersion: 1,
  create,
  ...extra,
});

describe('runRound', () => {
  it('returns a game win and tags the root', async () => {
    const host = createFakeHost();
    const r = await runEntry(fixture('always-win'), { host });
    expect(r).toMatchObject({ kind: 'win', via: 'game', gameId: 'always-win' });
    expect(host.root.dataset.game).toBe('always-win');
    expect(host.root.childNodes.length).toBe(0);
    host.dispose();
  });

  it('falls back to outcomeOnTimeout via timeout', async () => {
    const r = await runEntry(fixture('timeout-lose'));
    expect(r).toMatchObject({ kind: 'lose', via: 'timeout' });
    expect(r.elapsedMs).toBeGreaterThanOrEqual(3000);
    expect(r.elapsedMs).toBeLessThan(3000 + 50);
  });

  it('scales the time limit by speed', async () => {
    const r = await runEntry(fixture('timeout-lose'), { speed: 2.5 });
    expect(r.elapsedMs).toBeGreaterThanOrEqual(2000);
    expect(r.elapsedMs).toBeLessThan(2050);
  });

  it('ignores later resolves and lets end run exactly once', async () => {
    const calls: string[] = [];
    let ctx!: GameContext;
    const entry = makeEntry(
      game((c) => {
        ctx = c;
        return {
          tick(f) {
            if (f.phase === 'play') {
              c.resolve('lose');
              c.resolve('win');
            } else c.resolve('win');
          },
          end: (o, via) => void calls.push(`end:${o}:${via}`),
          destroy: () => void calls.push('destroy'),
        };
      }),
    );
    const r = await runEntry(entry);
    expect(r).toMatchObject({ kind: 'lose', via: 'game' });
    expect(calls).toEqual(['end:lose:game', 'destroy']);
    expect(ctx.resolved).toBe('lose');
  });

  it('ignores resolve outside play (create, start, settle)', async () => {
    const entry = makeEntry(
      game((c) => {
        c.resolve('lose');
        return {
          start: () => c.resolve('lose'),
          tick: (f) => {
            if (f.phase === 'play' && f.elapsed > 100) c.resolve('win');
          },
        };
      }),
    );
    expect(await runEntry(entry)).toMatchObject({ kind: 'win' });
  });

  it('runs settle ticks for about 800 ms with frozen elapsed', async () => {
    const settle: { dt: number; elapsed: number; remaining: number }[] = [];
    const entry = makeEntry(
      game(() => ({
        tick: (f) => void (f.phase === 'settle' && settle.push(f)),
      })),
    );
    await runEntry(entry);
    const total = settle.reduce((s, f) => s + f.dt, 0);
    expect(total).toBeGreaterThanOrEqual(SETTLE_MS);
    expect(total).toBeLessThan(SETTLE_MS + 20);
    expect(new Set(settle.map((f) => f.elapsed)).size).toBe(1);
    expect(settle.every((f) => f.remaining === 0)).toBe(true);
  });

  it('aborts the signal and empties the root', async () => {
    let ctx!: GameContext;
    const host = createFakeHost();
    await runEntry(makeEntry(game((c) => ((ctx = c), c.root.append('x'), { tick: () => c.resolve('win') }))), { host });
    expect(ctx.signal.aborted).toBe(true);
    expect(host.root.childNodes.length).toBe(0);
    host.dispose();
  });

  it('reports phases in order', async () => {
    const phases: LifecyclePhase[] = [];
    await runEntry(fixture('always-win'), { onPhase: (p) => phases.push(p) });
    expect(phases).toEqual(['load', 'preload', 'create', 'start', 'play', 'end', 'settle', 'destroy']);
  });

  it('awaits the intro before start and resets input', async () => {
    const order: string[] = [];
    const host = createFakeHost();
    host.input.press('action');
    const entry = makeEntry(
      game(() => ({
        start: () => order.push(`start:${host.input.api.isDown('action')}`),
        tick: (f) => void (f.phase === 'play' && order.push('tick')),
      })),
    );
    await runEntry(entry, {
      host,
      intro: async (verb) => void order.push(`intro:${verb}`),
    });
    expect(order.slice(0, 3)).toEqual(['intro:GO!', 'start:false', 'tick']);
    host.dispose();
    expect(INTRO_MS).toBe(700);
  });

  it('wires preload assets into create via loadImage', async () => {
    let assets: unknown;
    const entry = makeEntry({
      contractVersion: 1,
      preload: async (p) => ({ img: await p.loadImage('x.png') }),
      create: (_c, a) => ((assets = a), { tick: (f) => void (f.phase === 'play' && _c.resolve('win')) }),
    });
    await runEntry(entry);
    expect((assets as { img: unknown }).img).toBeInstanceOf(Image);
  });

  describe('errors', () => {
    it('throws-in-create', async () => {
      expect(await runEntry(fixture('throws-in-create'))).toMatchObject({ kind: 'error', phase: 'create' });
    });

    it('throws-on-tick destroys the instance', async () => {
      const entry = makeEntry(
        game(() => ({ tick: () => { throw new Error('x'); }, destroy: () => void (destroyed = true) })),
      );
      let destroyed = false;
      const host = createFakeHost();
      expect(await runEntry(entry, { host })).toMatchObject({ kind: 'error', phase: 'play' });
      expect(destroyed).toBe(true);
      expect(host.root.childNodes.length).toBe(0);
      host.dispose();
    });

    it.each(['start', 'end', 'destroy'] as const)('throws in %s', async (hook) => {
      let destroys = 0;
      const inst: GameInstance = {
        tick: (f) => void (f.phase === 'play' && ctxResolve()),
        destroy: () => void destroys++,
      };
      let ctxResolve = () => {};
      const entry = makeEntry(
        game((c) => {
          ctxResolve = () => c.resolve('win');
          inst[hook] = () => {
            throw new Error(hook);
          };
          if (hook === 'destroy') inst.destroy = () => { destroys++; throw new Error('destroy'); };
          return inst;
        }),
      );
      const r = await runEntry(entry);
      expect(r).toMatchObject({ kind: 'error', phase: hook });
      expect(destroys).toBe(1);
    });

    it('throws on a settle tick', async () => {
      const entry = makeEntry(
        game((c) => ({
          tick: (f) => {
            if (f.phase === 'play') c.resolve('win');
            else throw new Error('settle');
          },
        })),
      );
      expect(await runEntry(entry)).toMatchObject({ kind: 'error', phase: 'settle' });
    });

    it('fails on load error', async () => {
      const entry = { ...fixture('always-win'), load: async () => { throw new Error('chunk'); } };
      expect(await runEntry(entry)).toMatchObject({ kind: 'error', phase: 'load' });
    });

    it('fails when preload rejects', async () => {
      const entry = makeEntry({ contractVersion: 1, preload: () => Promise.reject(new Error('nope')), create: () => ({ tick() {} }) });
      expect(await runEntry(entry)).toMatchObject({ kind: 'error', phase: 'preload' });
    });

    it('fails when preload times out', async () => {
      const entry = makeEntry({ contractVersion: 1, preload: () => new Promise(() => {}), create: () => ({ tick() {} }) });
      const r = await runEntry(entry, { preloadTimeoutMs: 20 });
      expect(r).toMatchObject({ kind: 'error', phase: 'preload' });
      expect(String((r as { error: Error }).error)).toContain('timed out');
    });
  });
});
