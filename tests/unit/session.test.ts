import { describe, expect, it } from 'vitest';
import type { RoundResult } from '@arcade/sdk';
import { Session } from '../../src/framework/runtime/session';
import { makeEntry } from '../helpers/fixtures';

const games = (n: number, extra: Record<number, object> = {}) =>
  Array.from({ length: n }, (_, i) => makeEntry({ contractVersion: 1, create: () => ({ tick() {} }) }, { id: `game-${i}`, title: `G${i}`, ...extra[i] }));
const res = (kind: 'win' | 'lose' | 'error', gameId = 'game-0'): RoundResult =>
  kind === 'error' ? { kind, phase: 'play', error: new Error('x'), elapsedMs: 0, gameId } : { kind, via: 'game', elapsedMs: 1, gameId };

describe('Session', () => {
  it('plays every game once per bag with no immediate repeats across refills', () => {
    const s = new Session({ entries: games(4), seed: 3 });
    const ids = Array.from({ length: 200 }, () => s.next().entry.id);
    for (let b = 0; b < ids.length; b += 4) expect(new Set(ids.slice(b, b + 4)).size).toBe(4);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
  });

  it('is deterministic per seed', () => {
    const run = (seed: number) => {
      const s = new Session({ entries: games(5), seed });
      return Array.from({ length: 12 }, () => s.next()).map((n) => `${n.entry.id}:${n.seed}`);
    };
    expect(run(9)).toEqual(run(9));
    expect(run(9)).not.toEqual(run(10));
  });

  it('repeats a single game and skips disabled ones', () => {
    const s = new Session({ entries: games(2, { 1: { enabled: false } }), seed: 1 });
    expect([s.next().entry.id, s.next().entry.id]).toEqual(['game-0', 'game-0']);
  });

  it('tracks lives, score and rounds', () => {
    const s = new Session({ entries: games(2), seed: 1 });
    expect(s.lives).toBe(4);
    s.record(res('win'));
    s.record(res('lose'));
    expect(s).toMatchObject({ score: 1, lives: 3, round: 2, over: false });
    s.record(res('lose'));
    s.record(res('lose'));
    s.record(res('lose'));
    expect(s.lives).toBe(0);
    expect(s.over).toBe(true);
  });

  it('benches errored games without costing a life or round', () => {
    const s = new Session({ entries: games(2), seed: 1 });
    s.record(res('error', 'game-0'));
    expect(s).toMatchObject({ lives: 4, round: 0, score: 0 });
    expect(s.benched.has('game-0')).toBe(true);
    for (let i = 0; i < 6; i++) expect(s.next().entry.id).toBe('game-1');
    s.record(res('error', 'game-1'));
    expect(s.over).toBe(true);
  });

  it('is over with no playable games', () => {
    expect(new Session({ entries: [], seed: 1 }).over).toBe(true);
  });

  it('progresses difficulty with finished rounds', () => {
    const s = new Session({ entries: games(1), seed: 1 });
    expect(s.next().difficulty).toEqual({ speed: 1, level: 1, round: 0 });
    for (let i = 0; i < 10; i++) s.record(res('win'));
    expect(s.next().difficulty).toEqual({ speed: 1.5, level: 2, round: 10 });
  });
});
