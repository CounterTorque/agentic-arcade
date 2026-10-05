import { afterEach, describe, expect, it, vi } from 'vitest';
import { SAVE_KEY, createSaveStore, defaultSave } from '../../src/framework/storage';

const memory = (initial: Record<string, string> = {}) => {
  const map = new Map(Object.entries(initial));
  return { map, getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) };
};

afterEach(() => vi.restoreAllMocks());

describe('save store', () => {
  it('starts from defaults and persists updates', () => {
    const b = memory();
    const s = createSaveStore(b);
    expect(s.data).toEqual(defaultSave());
    s.update((d) => void (d.highScore = 7));
    expect(JSON.parse(b.map.get(SAVE_KEY)!).highScore).toBe(7);
    expect(createSaveStore(b).data.highScore).toBe(7);
    expect(s.persistent).toBe(true);
  });

  it('preserves unknown game ids', () => {
    const save = { ...defaultSave(), perGame: { ghost: { plays: 1, wins: 1, errors: 0 } } };
    const s = createSaveStore(memory({ [SAVE_KEY]: JSON.stringify(save) }));
    s.update((d) => void (d.sessionsPlayed = 2));
    expect(s.data.perGame.ghost).toEqual({ plays: 1, wins: 1, errors: 0 });
  });

  it('runs migrations in order', () => {
    const old = { schemaVersion: 0, best: 12 };
    const b = memory({ [SAVE_KEY]: JSON.stringify(old) });
    const s = createSaveStore(b, { 0: (o) => ({ ...defaultSave(), highScore: o.best }) });
    expect(s.data).toMatchObject({ schemaVersion: 1, highScore: 12 });
  });

  it('backs up corrupt data and resets', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123);
    for (const raw of ['{nope', JSON.stringify({ schemaVersion: 1, highScore: 'x' }), JSON.stringify({ schemaVersion: 0 })]) {
      const b = memory({ [SAVE_KEY]: raw });
      const s = createSaveStore(b);
      expect(s.data).toEqual(defaultSave());
      expect(b.map.get(`${SAVE_KEY}.corrupt-123`)).toBe(raw);
    }
  });

  it('treats newer versions as read-only', () => {
    const newer = { ...defaultSave(), schemaVersion: 2, highScore: 99 };
    const raw = JSON.stringify(newer);
    const b = memory({ [SAVE_KEY]: raw });
    const s = createSaveStore(b);
    expect(s.readOnly).toBe(true);
    expect(s.data.highScore).toBe(99);
    s.update((d) => void (d.highScore = 1));
    expect(b.map.get(SAVE_KEY)).toBe(raw);
  });

  it('falls back to memory when the backend throws, warning once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = createSaveStore({ getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } });
    s.update((d) => void (d.highScore = 3));
    s.update((d) => void (d.highScore = 4));
    expect(s.data.highScore).toBe(4);
    expect(s.persistent).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('keeps memory state on quota errors, warning once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = createSaveStore({ getItem: () => null, setItem: () => { throw new DOMException('full', 'QuotaExceededError'); } });
    s.update((d) => void (d.highScore = 1));
    s.update((d) => void (d.highScore = 2));
    expect(s.data.highScore).toBe(2);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
